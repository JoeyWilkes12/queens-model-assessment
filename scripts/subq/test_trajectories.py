"""Offline policy tests; mock replies never contact a provider."""
import contextlib
import io
import pathlib
import tempfile
import types
import unittest
from unittest import mock

import replay
import trajectories


class TrajectoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plan = replay.read(pathlib.Path(__file__).parent / "input/trajectory-input.json")

    def policy(self, args, output, call_id, req, context):
        phase = next(iter(req["questions"]))
        options = req["questions"][phase]["criteria"]
        if phase == "region":
            selected = "B" if "B" in options else next(iter(options))
        else:
            grid = replay.board_grid(req["state"])
            truth = replay.solutions(tuple(tuple(row) for row in grid))[0]
            selected = next(label for label in options if truth[int(label[1:].split("c")[0]) - 1] == int(label.split("c")[1]))
        answer = {"type": "choice", "choice": selected, "confidence": 1,
                  "probabilities": {label: int(label == selected) for label in options}}
        return {"model": replay.MODEL, "answers": {phase: answer}}, {"elapsed_seconds": 0}

    def test_oracle_policy_reaches_valid_boards_with_forced_transitions(self):
        # Oracle exists only in this offline mock, never in the real policy.
        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(trajectories, "call", side_effect=self.policy), contextlib.redirect_stdout(io.StringIO()):
            for board in self.plan["boards"]:
                for mode in ("raw", "local"):
                    entry = {"trajectory_id": board["id"] + "_" + mode + "_a1", "board_id": board["id"], "size": board["size"], "mode": mode, "replicate": 1}
                    self.assertFalse(trajectories.attempt(types.SimpleNamespace(), pathlib.Path(tmp), board, entry))
                    result = replay.read(pathlib.Path(tmp) / "trajectories" / (entry["trajectory_id"] + ".json"))
                    self.assertTrue(result["success"])
                    self.assertEqual(result["stop_reason"], "solved")
                    self.assertEqual(result["correct_queens_before_failure"], board["size"])
                    self.assertEqual(result["http_calls"] + result["forced_decisions"], 2 * board["size"])

    def test_locally_legal_wrong_cell_stops_global_prefix_without_feedback(self):
        board = self.plan["boards"][0]
        seen = []
        def wrong_policy(args, output, call_id, req, context):
            seen.append(req)
            phase = next(iter(req["questions"]))
            selected = "A" if phase == "region" else "r1c1"
            opts = req["questions"][phase]["criteria"]
            return {"answers": {phase: {"choice": selected, "probabilities": {key: int(key == selected) for key in opts}}}}, {"elapsed_seconds": 0}
        entry = {"trajectory_id": "wrong_raw_a1", "board_id": board["id"], "size": 5, "mode": "raw", "replicate": 1}
        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(trajectories, "call", side_effect=wrong_policy), contextlib.redirect_stdout(io.StringIO()):
            self.assertFalse(trajectories.attempt(types.SimpleNamespace(), pathlib.Path(tmp), board, entry))
            result = replay.read(pathlib.Path(tmp) / "trajectories/wrong_raw_a1.json")
            self.assertEqual(result["stop_reason"], "globally_unextendable_prefix")
            self.assertEqual(result["correct_queens_before_failure"], 0)
            self.assertEqual(result["accepted_queens"], 1)
            self.assertEqual(len(seen), 2)
            self.assertTrue(all(req["state"]["placed_queens"] == [] for req in seen))

    def test_local_filter_uses_only_immediate_conflicts(self):
        board = self.plan["boards"][0]
        grid = trajectories.state(board, [])["region_grid_rows"]
        truth = replay.solutions(tuple(tuple(row) for row in grid))[0]
        placed = [(1, 5)]
        raw = trajectories.cell_question(board, placed, "A", "raw")["criteria"]
        local = trajectories.cell_question(board, placed, "A", "local")["criteria"]
        self.assertLess(len(local), len(raw))
        self.assertGreater(len(local), 1)
        self.assertTrue(any(truth[int(label[1:].split("c")[0]) - 1] != int(label.split("c")[1]) for label in local))
        for label in local:
            r, c = map(int, label[1:].split("c"))
            self.assertFalse(trajectories.violations(board, placed, (r, c)))


if __name__ == "__main__":
    unittest.main()
