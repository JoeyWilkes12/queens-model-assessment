"""Offline tests for outcome separation and deterministic grading boundaries."""
import json
import pathlib
import unittest

import replay


class ReplayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixtures = pathlib.Path(__file__).parent / "input/fixtures"
        cls.mixed = replay.read(cls.fixtures / "2026-09-18-jev-5x5-variations__complete_annotated_r2.json")["request"]

    def choice_response(self, request, selected):
        key = next(iter(request["questions"]))
        labels = request["questions"][key]["criteria"]
        probs = {label: 1 / len(labels) for label in labels}
        return {"model": replay.MODEL, "answers": {key: {"type": "choice", "choice": selected,
                "probabilities": probs, "confidence": 0}}}

    def test_single_selected_candidate_passes_every_rule(self):
        truth = replay.expected_question(self.mixed, "pick", self.mixed["questions"]["pick"])
        self.assertEqual(truth["acceptable"], ["option_06"])
        result = replay.grade(self.mixed, self.choice_response(self.mixed, "option_06"))
        self.assertTrue(result["primary_correct"])
        self.assertTrue(result["questions"]["pick"]["checks"]["correct"])
        wrong = replay.grade(self.mixed, self.choice_response(self.mixed, "option_01"))
        self.assertFalse(wrong["primary_correct"])
        self.assertEqual(wrong["outcome"], "model_failure")

    def test_missing_or_extra_answer_keys_are_schema_failures(self):
        result = replay.grade(self.mixed, {"answers": {}})
        self.assertFalse(result["schema_valid"])
        self.assertEqual(result["outcome"], "schema_failure")

    def test_selected_choice_is_executed_despite_probability_rank(self):
        body = self.choice_response(self.mixed, "option_06")
        body["answers"]["pick"]["probabilities"].update(option_06=.08, option_01=.09)
        result = replay.grade(self.mixed, body)
        self.assertTrue(result["schema_valid"])
        self.assertTrue(result["primary_correct"])
        self.assertTrue(result["questions"]["pick"]["selected_below_reported_max"])

    def test_local_and_global_moves_remain_different_tasks(self):
        global_req = replay.read(self.fixtures / "2026-09-18-jev-5x5-variations__partial_global_r1.json")["request"]
        local_req = replay.read(self.fixtures / "2026-09-18-jev-5x5-variations__partial_local_r1.json")["request"]
        globally = replay.expected_question(global_req, "pick", global_req["questions"]["pick"])
        locally = replay.expected_question(local_req, "pick", local_req["questions"]["pick"])
        self.assertEqual(len(globally["acceptable"]), 1)
        self.assertGreater(len(locally["acceptable"]), 1)
        self.assertEqual(globally["kind"], "global_move")
        self.assertEqual(locally["kind"], "local_move")

    def test_board_is_unique_and_long_diagonals_are_allowed(self):
        grid = replay.board_grid(self.mixed["state"])
        solutions = replay.solutions(tuple(tuple(row) for row in grid))
        self.assertEqual(len(solutions), 1)
        columns = list(solutions[0])
        self.assertTrue(replay.independent_valid(grid, columns))
        self.assertEqual(replay.checks(grid, columns)["correct"], replay.independent_valid(grid, columns))
        # Every row is a region on this separate valid regional-Queens board.
        # These positions include a long diagonal that chess N-Queens forbids.
        columns_with_long_diagonal = [2, 4, 1, 5, 3]
        other_grid = [[str(row)] * 5 for row in range(5)]
        self.assertTrue(replay.checks(other_grid, columns_with_long_diagonal)["correct"])
        self.assertTrue(replay.independent_valid(other_grid, columns_with_long_diagonal))
        self.assertTrue(any(abs(r - s) == abs(columns_with_long_diagonal[r] - columns_with_long_diagonal[s])
                            for r in range(5) for s in range(r + 2, 5)))

    def test_invalid_and_nonfinite_probabilities_fail_schema(self):
        body = self.choice_response(self.mixed, "option_06")
        body["answers"]["pick"]["probabilities"]["option_06"] = float("nan")
        self.assertFalse(replay.grade(self.mixed, body)["schema_valid"])

    def test_malformed_response_and_nonstring_choice_fail_schema(self):
        self.assertFalse(replay.grade(self.mixed, [])["schema_valid"])
        body = self.choice_response(self.mixed, "option_06")
        body["answers"]["pick"]["choice"] = []
        self.assertFalse(replay.grade(self.mixed, body)["schema_valid"])

    def test_invalid_mass_confidence_and_model_fail_schema(self):
        body = self.choice_response(self.mixed, "option_06")
        body["answers"]["pick"]["probabilities"] = {label: 1 for label in self.mixed["questions"]["pick"]["criteria"]}
        self.assertFalse(replay.grade(self.mixed, body)["schema_valid"])
        body = self.choice_response(self.mixed, "option_06")
        body["answers"]["pick"]["confidence"] = float("inf")
        self.assertFalse(replay.grade(self.mixed, body)["schema_valid"])
        body = self.choice_response(self.mixed, "option_06")
        body["model"] = "different-model"
        self.assertFalse(replay.grade(self.mixed, body)["schema_valid"])

    def test_fixture_envelope_and_semantic_hash(self):
        manifest = replay.read(pathlib.Path(__file__).parent / "input/manifest.json")
        self.assertGreaterEqual(manifest["scheduled_calls"], 105)
        self.assertGreaterEqual(manifest["unique_source_requests"], 81)
        for fixture in self.fixtures.glob("*.json"):
            item = replay.read(fixture)
            request = item["request"]
            self.assertEqual(set(request), {"model", "state", "questions"})
            self.assertEqual(request["model"], replay.MODEL)
            self.assertEqual(replay.sha(replay.encoded({"state": request["state"], "questions": request["questions"]})), item["source_semantics_sha256"])


if __name__ == "__main__":
    unittest.main()
