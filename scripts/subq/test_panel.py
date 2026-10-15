"""Offline tests for the new-board panel harness; a fake broker, never a provider.

Dummy values only. No Docker, no credential, no network.
"""
import contextlib
import io
import json
import pathlib
import tempfile
import types
import unittest
from unittest import mock

import boards
import broker
import replay
import sandbox
import trajectories

EVIDENCE = replay.SITE / "public/evidence"
CORPUS = EVIDENCE / "subq-panel/corpus.json"
DEVELOPMENT = EVIDENCE / "subq-panel/development-corpus.json"
TEMPLATE_STATE_KEYS = {"board_id", "size", "rules", "coordinates", "region_grid_rows", "regions",
                       "placed_queens", "instruction", "selected_region"}
FORBIDDEN = ("solution", "stratum", "generator", "profile", "greedy", "uniform_random", "tier", "candidate", "seed")


def prepare_args(output, corpus=DEVELOPMENT, **kw):
    values = dict(corpus=str(corpus), study=trajectories.PILOT_STUDY, select=None, modes=None, repeats=None, order=None,
                  schedule_seed=None, evidence=str(EVIDENCE), spend_ceiling=None, max_model_calls=None, output=str(output))
    values.update(kw)
    return types.SimpleNamespace(**values)


def quiet():
    return contextlib.redirect_stdout(io.StringIO())


class FakeBroker:
    """Mimics broker.py replies over the Unix socket; optional test-only oracle policy."""

    def __init__(self, known=0.10, unresolved=0.0, tokens=1000, oracle=True, fail_at=None, health_budget=True):
        self.posts, self.known, self.unresolved, self.tokens = [], known, unresolved, tokens
        self.oracle, self.fail_at, self.health_budget = oracle, fail_at, health_budget

    def snapshot(self):
        return {"cap_usd": 4.5, "estimated_known_usd": self.known, "unresolved_reserve_usd": self.unresolved,
                "calls_reserved": len(self.posts), "billing_confirmed": False}

    def __call__(self, socket_path, method, endpoint, body=None):
        if endpoint == "/health":
            return {"ready": True, "budget": self.snapshot()} if self.health_budget else {"ready": True}
        if endpoint == "/v1/models":
            return {"status": 200, "body": {"object": "list", "data": [{"id": replay.MODEL}]}, "elapsed_seconds": 0}
        assert (method, endpoint) == ("POST", "/v1/systemone")
        self.posts.append(json.loads(json.dumps(body)))
        if self.fail_at == len(self.posts):
            self.unresolved += broker.RESERVATION
            return {"status": 500, "body": {"receipt_filter": "provider error/body withheld; consult HTTP status",
                                            "error_type": "server_error"}, "elapsed_seconds": 0.01, "budget": self.snapshot()}
        phase = next(iter(body["questions"]))
        labels = list(body["questions"][phase]["criteria"])
        choice = labels[0]
        if self.oracle and phase == "cell":
            truth = replay.solutions(tuple(tuple(row) for row in body["state"]["region_grid_rows"]))[0]
            choice = next(label for label in labels if truth[int(label[1:].split("c")[0]) - 1] == int(label.split("c")[1]))
        self.known += self.tokens * broker.RESERVATION / broker.MAX_INPUT_TOKENS
        answer = {"type": "choice", "choice": choice, "confidence": 0.5,
                  "probabilities": {label: 1 / len(labels) for label in labels}}
        return {"status": 200, "body": {"model": replay.MODEL, "answers": {phase: answer},
                                        "usage": {"input_tokens": self.tokens, "output_tokens": 0}},
                "elapsed_seconds": 0.01, "budget": self.snapshot()}


class ScheduleTests(unittest.TestCase):
    def test_historical_schedule_is_the_published_order(self):
        protocol = replay.read(EVIDENCE / "subq-trajectories-protocol.json")
        self.assertEqual(trajectories.build_schedule(protocol["boards"]), protocol["schedule"])
        self.assertEqual(len(protocol["schedule"]), 90)

    def test_interleaved_schedule_pairs_counterbalances_and_is_seeded(self):
        corpus = replay.read(CORPUS)
        schedule = trajectories.build_schedule(corpus["boards"], ("raw", "local"), 1, "interleaved", 17)
        self.assertEqual(schedule, trajectories.build_schedule(corpus["boards"], ("raw", "local"), 1, "interleaved", 17))
        self.assertNotEqual(schedule, trajectories.build_schedule(corpus["boards"], ("raw", "local"), 1, "interleaved", 18))
        self.assertEqual(len(schedule), 384)
        self.assertEqual(sorted((e["board_id"], e["mode"]) for e in schedule),
                         sorted((b["id"], m) for b in corpus["boards"] for m in ("raw", "local")))
        for a, b in zip(schedule[::2], schedule[1::2]):  # both modes of a board are adjacent
            self.assertEqual(a["board_id"], b["board_id"])
            self.assertEqual({a["mode"], b["mode"]}, {"raw", "local"})
        for size in (5, 7, 9):
            first = [e for e in schedule if e["size"] == size and e["mode_position"] == 1]
            self.assertEqual(sum(e["mode"] == "raw" for e in first), 32)
        blocks = {}
        for e in schedule:
            blocks.setdefault(e["block"], set()).add(e["size"])
        self.assertTrue(all(sizes == {5, 7, 9} for sizes in blocks.values()))
        self.assertEqual([e["sequence"] for e in schedule], list(range(1, 385)))
        repeated = trajectories.build_schedule(corpus["boards"], ("raw", "local"), 2, "interleaved", 17)
        self.assertEqual(len(repeated), 768)
        self.assertEqual([e["trajectory_id"].replace("_a2", "_a1") for e in repeated[384:]], [e["trajectory_id"] for e in schedule])


class PrepareTests(unittest.TestCase):
    def test_full_panel_plan_is_solution_free_and_bounded(self):
        with tempfile.TemporaryDirectory() as tmp, quiet():
            path = pathlib.Path(tmp) / "panel-input.json"
            trajectories.prepare(prepare_args(path, corpus=CORPUS, study=None))
            plan = replay.read(path)
        self.assertEqual(plan["study"], trajectories.PANEL_STUDY)
        self.assertEqual(plan["scheduled_trajectories"], len(plan["schedule"]))
        self.assertEqual(len(plan["schedule"]), 384)
        self.assertEqual(plan["budget_policy"]["max_model_calls"], 64 * 2 * (9 + 13 + 17))
        self.assertEqual(plan["budget_policy"]["panel_spend_ceiling_usd"], 1.45)
        self.assertEqual(plan["corpus"]["sha256"], replay.sha(CORPUS.read_bytes()))
        for board in plan["boards"]:
            self.assertEqual(set(board), {"id", "size", "regions", "solution_sha256"})
        text = json.dumps(plan["boards"]) + json.dumps(plan["schedule"])
        for word in ("stratum", "generator", "profile", "greedy", "_solution", "tier"):
            self.assertNotIn(word, text)

    def test_pilot_and_role_rules(self):
        with tempfile.TemporaryDirectory() as tmp, quiet():
            out = pathlib.Path(tmp) / "pilot.json"
            trajectories.prepare(prepare_args(out, select="dev-9-01:raw,dev-9-02:local"))
            plan = replay.read(out)
            self.assertEqual([(e["board_id"], e["mode"]) for e in plan["schedule"]], [("dev-9-01", "raw"), ("dev-9-02", "local")])
            self.assertEqual(plan["budget_policy"]["panel_spend_ceiling_usd"], 0.05)
            self.assertEqual(plan["budget_policy"]["max_model_calls"], 34)
            with self.assertRaises(SystemExit):
                trajectories.prepare(prepare_args(out, corpus=CORPUS, study=None, select="panel-5-01:raw"))
            with self.assertRaises(SystemExit):
                trajectories.prepare(prepare_args(out, corpus=DEVELOPMENT, study=trajectories.PANEL_STUDY))
            with self.assertRaises(SystemExit):
                trajectories.prepare(prepare_args(out, corpus="historical", study=None, repeats=1))

    def test_worker_constants_mirror_the_broker(self):
        self.assertEqual(trajectories.RESERVATION_USD, broker.RESERVATION)
        self.assertEqual(trajectories.MAX_INPUT_TOKENS, broker.MAX_INPUT_TOKENS)
        self.assertEqual(trajectories.SHARED_LEDGER_CAP_USD, broker.CAP_USD)
        self.assertAlmostEqual(trajectories.PRICE_PER_INPUT_TOKEN_USD * broker.MAX_INPUT_TOKENS, broker.RESERVATION)
        self.assertEqual(trajectories.solution_digest([2, 4, 1, 3]), boards.solution_sha256([2, 4, 1, 3]))

    def test_private_solutions_are_outside_every_worker_mount(self):
        private = boards.PRIVATE_DIR.resolve()
        for name in ("panel", "panel-pilot"):
            mount = (sandbox.ROOT / "scripts/subq/input" / name).resolve()
            self.assertNotEqual(private, mount)
            self.assertNotIn(mount, private.parents)
            self.assertNotIn(private, mount.parents)


class ModelVisibleStateTests(unittest.TestCase):
    def test_requests_for_every_panel_board_carry_only_template_fields(self):
        corpus = replay.read(CORPUS)
        for board in corpus["boards"]:
            requests = [trajectories.request(board, [], "region", "raw")]
            for i in range(board["size"]):
                for mode in ("raw", "local"):
                    requests.append(trajectories.request(board, [], "cell", mode, chr(65 + i)))
            for req in requests:
                self.assertEqual(set(req), {"model", "state", "questions"})
                self.assertLessEqual(set(req["state"]), TEMPLATE_STATE_KEYS)
                text = json.dumps(req)
                self.assertNotIn(board["solution_sha256"], text)
                self.assertNotIn(board["canonical_sha256"], text)
                lowered = json.dumps(req["state"]["board_id"]).lower() + json.dumps(req["questions"]).lower()
                for word in FORBIDDEN:
                    self.assertNotIn(word, lowered.replace("unique full solution", "").replace("unique complete solution", ""))
            self.assertRegex(board["id"], r"^panel-[579]-\d\d$")


class PanelRunTests(unittest.TestCase):
    def plan(self, tmp, select, **kw):
        path = pathlib.Path(tmp) / "input" / "panel-input.json"
        with quiet():
            trajectories.prepare(prepare_args(path, select=select, **kw))
        return path

    def run_panel(self, plan_path, out, fake, limit=10):
        args = types.SimpleNamespace(input=str(plan_path), output=str(out), broker_socket="/unused.sock", limit=limit)
        with mock.patch.object(replay, "broker", fake), quiet():
            trajectories.run(args)
        return args

    def test_attempt_loop_with_fake_broker(self):
        with tempfile.TemporaryDirectory() as tmp:
            plan_path = self.plan(tmp, "dev-5-01:raw,dev-5-01:local,dev-7-01:raw,dev-9-01:local")
            out = pathlib.Path(tmp) / "out"
            fake = FakeBroker()
            self.run_panel(plan_path, out, fake)
            results = [replay.read(p) for p in sorted((out / "trajectories").glob("*.json"))]
            self.assertEqual(len(results), 4)
            self.assertTrue(all(r["success"] and r["stop_reason"] == "solved" for r in results))
            for r in results:
                self.assertEqual(r["http_calls"] + r["forced_decisions"], 2 * r["size"])  # forced moves made no call
            self.assertEqual(len(fake.posts), sum(r["http_calls"] for r in results))
            self.assertEqual(len(list((out / "runs").iterdir())), len(fake.posts))
            guard = replay.read(out / "budget-guard.json")
            self.assertEqual(guard["calls"], len(fake.posts))
            self.assertAlmostEqual(guard["committed_usd"], len(fake.posts) * 1000 * trajectories.PRICE_PER_INPUT_TOKEN_USD)
            summary = replay.read(out / "summary.json")
            self.assertEqual(summary["study"], trajectories.PILOT_STUDY)
            self.assertEqual(summary["planned_trajectories"], 4)
            self.assertEqual(summary["guard"]["call_directories"], len(fake.posts))
            for body in fake.posts:  # exactly what would go upstream
                self.assertEqual(set(body), {"model", "state", "questions"})
                self.assertLessEqual(set(body["state"]), TEMPLATE_STATE_KEYS)
                self.assertNotIn("sha256", json.dumps(body))
            before = len(fake.posts)
            self.run_panel(plan_path, out, fake)  # resume: completed trajectories are skipped
            self.assertEqual(len(fake.posts), before)
            report = trajectories.analysis(replay.read(out / "manifest.json"), results, trajectories.output_loader(out))
            self.assertEqual(report["consistency_errors"], [])
            self.assertTrue(all(c["extendable"] == c["on_solution"] for c in report["labels"]["cells"] if c["locally_legal"]))
            self.assertEqual(report["paired_raw_vs_local"]["5"]["both_solved"], 1)

    def test_provider_failure_stops_without_retry(self):
        with tempfile.TemporaryDirectory() as tmp:
            plan_path = self.plan(tmp, "dev-7-01:raw,dev-7-02:local")
            out = pathlib.Path(tmp) / "out"
            fake = FakeBroker(fail_at=2)
            self.run_panel(plan_path, out, fake)
            self.assertEqual(len(fake.posts), 2)
            result = replay.read(out / "trajectories" / "dev-7-01_raw_a1.json")
            self.assertEqual(result["stop_reason"], "request_failure")
            self.assertFalse((out / "trajectories" / "dev-7-02_local_a1.json").exists())
            calls, committed = trajectories.tally(out)
            self.assertEqual(calls, 2)
            self.assertAlmostEqual(committed, 1000 * trajectories.PRICE_PER_INPUT_TOKEN_USD + trajectories.RESERVATION_USD)
            with self.assertRaises(RuntimeError):
                self.run_panel(plan_path, out, fake)
            self.assertEqual(len(fake.posts), 2)

    def test_admission_ceiling_stops_before_any_dispatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            plan_path = self.plan(tmp, "dev-5-01:raw", spend_ceiling=0.001)
            out = pathlib.Path(tmp) / "out"
            fake = FakeBroker()
            self.run_panel(plan_path, out, fake)
            self.assertEqual(fake.posts, [])
            self.assertFalse((out / "trajectories").exists())

    def test_per_call_guard_censors_and_blocks_continuation(self):
        with tempfile.TemporaryDirectory() as tmp:
            plan_path = self.plan(tmp, "dev-9-03:raw,dev-9-04:local", spend_ceiling=0.05)
            out = pathlib.Path(tmp) / "out"
            fake = FakeBroker(tokens=300000)  # far above the pessimistic estimate, within the reserve
            self.run_panel(plan_path, out, fake)
            result = replay.read(out / "trajectories" / "dev-9-03_raw_a1.json")
            self.assertEqual(result["stop_reason"], "censored_guard")
            self.assertEqual(result["guard_reason"], "panel_spend_ceiling")
            calls, committed = trajectories.tally(out)
            self.assertEqual(calls, len(fake.posts))
            self.assertLessEqual(committed, 0.05)
            self.assertEqual(len(list((out / "runs").iterdir())), len(fake.posts))  # refused call left no receipt
            with self.assertRaises(RuntimeError):
                self.run_panel(plan_path, out, fake)

    def test_shared_ledger_cap_and_missing_snapshot_stop_before_dispatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            plan_path = self.plan(tmp, "dev-5-01:raw")
            fake = FakeBroker(known=4.49)
            self.run_panel(plan_path, pathlib.Path(tmp) / "out1", fake)
            self.assertEqual(fake.posts, [])
            fake = FakeBroker(health_budget=False)
            with self.assertRaises(RuntimeError):
                self.run_panel(plan_path, pathlib.Path(tmp) / "out2", fake)
            self.assertEqual(fake.posts, [])

    def test_request_byte_bound_and_commitment_mismatch(self):
        policy = {"max_request_bytes": 10, "max_model_calls": 5, "panel_spend_ceiling_usd": 1, "reservation_per_call_usd": 0.02,
                  "shared_ledger_cap_usd": 4.5, "pessimistic_tokens_per_call": 5000, "price_per_input_token_usd": 5e-8}
        with tempfile.TemporaryDirectory() as tmp:
            guard = trajectories.SpendGuard(policy, tmp, {"estimated_known_usd": 0, "unresolved_reserve_usd": 0})
            with self.assertRaises(trajectories.GuardStop) as stop:
                guard.before_call({"model": replay.MODEL, "state": {}, "questions": {}})
            self.assertEqual(stop.exception.reason, "max_request_bytes")
            plan = replay.read(self.plan(tmp, "dev-5-01:raw"))
            plan["boards"][0]["solution_sha256"] = "0" * 64
            with self.assertRaises(RuntimeError):
                trajectories.verify_commitments(plan)


class SandboxPathTests(unittest.TestCase):
    def test_existing_modes_keep_their_paths(self):
        for mode, out, path in [("replay", "output/subq", "/input"), ("trajectories", "output/subq-trajectories", "/input/trajectory-input.json"),
                                ("split", "output/subq-split", "/input/split")]:
            paths = sandbox.resolve(sandbox.parse(["--mode", mode]))
            self.assertEqual(paths["out"], sandbox.ROOT / out)
            self.assertEqual(paths["ledger"], sandbox.ROOT / "output/subq-ledger")
            self.assertEqual(paths["inputs"], sandbox.ROOT / "scripts/subq/input")
            self.assertEqual(paths["input_path"], path)

    def test_panel_modes_require_the_existing_shared_ledger(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / "scripts/subq/input/panel").mkdir(parents=True)
            (root / "scripts/subq/input/panel/panel-input.json").write_text("{}")
            ledger = root / "shared-ledger"
            ledger.mkdir()
            with mock.patch.object(sandbox, "ROOT", root):
                with self.assertRaises(SystemExit):
                    sandbox.resolve(sandbox.parse(["--mode", "panel"]))
                with self.assertRaises(SystemExit):  # no budget.json: never a fresh ledger
                    sandbox.resolve(sandbox.parse(["--mode", "panel", "--ledger-dir", str(ledger)]))
                (ledger / "budget.json").write_text("{}")
                paths = sandbox.resolve(sandbox.parse(["--mode", "panel", "--ledger-dir", str(ledger)]))
                self.assertEqual(paths["ledger"], ledger.resolve())
                self.assertEqual(paths["inputs"], root / "scripts/subq/input/panel")
                self.assertEqual(paths["input_path"], "/input/panel-input.json")
                self.assertEqual(paths["out"], root / "output/subq-panel")
                with self.assertRaises(SystemExit):  # pilot plan not prepared
                    sandbox.resolve(sandbox.parse(["--mode", "panel-pilot", "--ledger-dir", str(ledger)]))


class HistoricalAnalysisTests(unittest.TestCase):
    def test_public_subq_trajectories_reproduce_methods_critique(self):
        plan = replay.read(EVIDENCE / "subq-trajectories-protocol.json")
        attempts = replay.read(EVIDENCE / "subq-trajectories-summary.json")["trajectories"]
        runs = EVIDENCE / "runs" / plan["study"]

        def load(call_id):
            return {name: replay.read(runs / call_id / (name + ".json")) for name in ("request", "response", "metadata")}

        report = trajectories.analysis(plan, attempts, load)
        self.assertEqual(report["consistency_errors"], [])
        groups = report["by_size_mode"]
        calls = sum(g["nonforced_cell_calls"] for g in groups)
        correct = sum(g["nonforced_cell_accuracy"] * g["nonforced_cell_calls"] for g in groups)
        chance = sum(g["nonforced_uniform_chance"] * g["nonforced_cell_calls"] for g in groups) / calls
        self.assertEqual((calls, round(correct)), (120, 40))
        self.assertAlmostEqual(chance, 0.2880430911680912)
        self.assertAlmostEqual(sum(g["random_expected_solved_trajectories"] for g in groups), 1.5703, places=4)
        means = {(g["size"], g["mode"]): round(g["mean_correct_placements"], 2) for g in groups}
        self.assertEqual(means, {(5, "raw"): 1.33, (5, "local"): 3.67, (7, "raw"): 0.67, (7, "local"): 1.33, (9, "raw"): 1.0, (9, "local"): 1.0})
        self.assertEqual(report["paired_raw_vs_local"]["5"]["local_only"], 2)
        self.assertEqual(report["paired_raw_vs_local"]["5"]["exact_mcnemar_p"], 0.5)

    def test_exact_mcnemar_and_holm(self):
        self.assertEqual(trajectories.exact_mcnemar(0, 0), 1.0)
        self.assertAlmostEqual(trajectories.exact_mcnemar(1, 9), 2 * 11 / 1024)
        self.assertEqual(trajectories.holm({"a": 0.01, "b": 0.04, "c": 0.03}), {"a": 0.03, "c": 0.06, "b": 0.06})


if __name__ == "__main__":
    unittest.main()
