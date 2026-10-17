"""Offline tests for the one-queen-per-request harness (no network, fake broker)."""
import json
import pathlib
import shutil
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import sequential as S  # noqa: E402

BOARD = S.board_index()["dev-5-01"]
SOLUTION = S.oracle(BOARD)


def reply(text, cost=0.01):
    return 200, {"id": "gen-x", "model": "fake", "provider": "Fake", "choices": [{"message": {"content": text}, "finish_reason": "stop"}],
                 "usage": {"cost": cost}}, 0.1


def fenced(obj, prose="Because of the regions."):
    return f"{prose}\n```json\n{json.dumps(obj)}\n```"


class Harness(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.patches = [mock.patch.object(S, "OUT_ROOT", self.tmp / "ft"),
                        mock.patch.object(S.C, "OUT", self.tmp / "campaign"),
                        mock.patch.object(S.C, "key_numbers", return_value={"usage": 1.0, "limit": None, "limit_remaining": None}),
                        mock.patch.object(S, "RESEND_DELAY_SECONDS", 0)]
        for p in self.patches:
            p.start()
        S.C.save(S.C.OUT / "baseline.json", {"usage_usd": 1.0})
        S.prepare(type("A", (), {"phase": "pilot", "blocks": None})())

    def tearDown(self):
        for p in self.patches:
            p.stop()
        shutil.rmtree(self.tmp)

    def test_parse_action_prefers_last_fenced_block(self):
        text = 'try {"action":"place","row":1,"column":1}\n```json\n{"action":"stop"}\n```\n```json\n{"action":"place","row":2,"column":3}\n```'
        self.assertEqual(S.parse_action(text), ({"action": "place", "row": 2, "column": 3}, "fenced"))
        self.assertEqual(S.parse_action('I will {"action":"stop"} now'), ({"action": "stop"}, "bare"))
        self.assertEqual(S.parse_action("no json here")[0], None)

    def test_apply_rules(self):
        placed = [(1, SOLUTION[0])]
        self.assertEqual(S.apply_action(BOARD, placed, {"action": "place", "row": 1, "column": SOLUTION[0]})[0], "occupied_cell")
        self.assertEqual(S.apply_action(BOARD, placed, {"action": "place", "row": 9, "column": 1})[0], "invalid_action")
        effect, after, detail = S.apply_action(BOARD, placed, {"action": "place", "row": 1, "column": (SOLUTION[0] % 5) + 1})
        self.assertEqual(effect, "placed")
        self.assertIn("row_reused", detail["violations"])  # illegal placements are applied, never rejected
        too_many = {"action": "revise", "queens": [{"row": r + 1, "column": c} for r, c in enumerate(SOLUTION)]}
        self.assertEqual(S.apply_action(BOARD, placed, too_many)[0], "revise_too_many")
        two = {"action": "revise", "queens": [{"row": 1, "column": SOLUTION[0]}, {"row": 2, "column": SOLUTION[1]}]}
        self.assertEqual(S.apply_action(BOARD, placed, two)[0], "revised")

    def test_on_demand_trajectory_continues_past_deviation_and_ends_at_n(self):
        wrong = (SOLUTION[1] % 5) + 1
        script = [reply(fenced({"action": "place", "row": 1, "column": SOLUTION[0]})),
                  reply(fenced({"action": "place", "row": 2, "column": wrong})),  # off the solution: no stop
                  reply("I am unsure."),  # no action: request consumed, placement unchanged
                  (429, {"error": {"code": 429}}, 0.1), reply(fenced({"action": "revise", "queens": [{"row": 1, "column": SOLUTION[0]}, {"row": 2, "column": SOLUTION[1]}, {"row": 3, "column": SOLUTION[2]}]})),
                  reply(fenced({"action": "place", "row": 4, "column": SOLUTION[3]}))]
        sent = []

        def fake(short, call_id, body):
            sent.append(body)
            return script.pop(0)
        with mock.patch.object(S, "send_on_demand", side_effect=fake):
            S.run(type("A", (), {"phase": "pilot", "model": "grok-4.6"})())
        summary = S.trajectory_summary("pilot", "grok-4.6", BOARD)
        self.assertEqual(summary["end_reason"], "max_requests")
        self.assertEqual(summary["requests"], 5)
        self.assertEqual(summary["effects"], {"placed": 3, "invalid_action": 1, "revised": 1})
        self.assertEqual(summary["first_off_solution_turn"], 2)
        self.assertEqual(summary["final_correct_queens"], 4)
        self.assertFalse(summary["solved"])
        # History: each request carries every earlier user and assistant message, and no solution.
        last = sent[-1]["messages"]
        self.assertEqual([m["role"] for m in last], ["user", "assistant"] * 4 + ["user"])
        self.assertNotIn("solution_sha256", json.dumps(sent))
        state = json.loads(last[-1]["content"])["state"]
        self.assertEqual(len(state["placed_queens"]), 3)

    def test_batch_rounds_with_one_failed_item_resent(self):
        calls = {"n": 0}

        def fake_broker(method, path, body=None, timeout=60):
            if method == "POST":
                calls["n"] += 1
                calls["last"] = body
                return 202, {"id": f"batch-{calls['n']}"}
            req = calls["last"]["requests"][0]
            k = json.loads(req["body"]["messages"][-1]["content"])["request"]["number"]
            if calls["n"] == 2:  # second round: the item fails once
                return 200, {"data": {"status": "completed", "results": [{"custom_id": req["custom_id"], "error": {"code": 500}}]}}
            text = fenced({"action": "place", "row": k, "column": SOLUTION[k - 1]})
            return 200, {"data": {"status": "completed", "results": [{"custom_id": req["custom_id"], "response": {"status_code": 200, "body": reply(text)[1]}}]}}
        with mock.patch.object(S.C, "broker", side_effect=fake_broker):
            S.batch_rounds(type("A", (), {"phase": "pilot", "model": "gpt-5.6-sol"})())
        summary = S.trajectory_summary("pilot", "gpt-5.6-sol", BOARD)
        self.assertTrue(summary["solved"])
        self.assertEqual(summary["requests"], 5)
        self.assertEqual(calls["n"], 6)  # five turns plus one re-send round
        meta = S.read(S.tdir("pilot", "gpt-5.6-sol", "dev-5-01") / "turn-02" / "metadata.json")
        self.assertEqual([a["http_status"] for a in meta["attempts"]], [None, 200])


if __name__ == "__main__":
    unittest.main()
