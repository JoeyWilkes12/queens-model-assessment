"""Offline checks of the explicit question-batch adaptation."""
import pathlib
import unittest

import replay


class SplitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = pathlib.Path(__file__).parent / "input/split"
        cls.plan = replay.read(cls.root / "manifest.json")

    def test_questions_and_state_are_preserved_exactly_once_in_order(self):
        self.assertEqual(self.plan["planned_logical_tasks"], 18)
        self.assertEqual(self.plan["scheduled_calls"], 36)
        by_id = {entry["call_id"]: entry for entry in self.plan["schedule"]}
        for logical in self.plan["logical_tasks"]:
            parent = replay.read(self.root / logical["parent_fixture"])
            combined = []
            for call_id in logical["parts"]:
                fixture = replay.read(self.root / by_id[call_id]["fixture"])
                partial = fixture["request"]
                self.assertEqual(partial["state"], parent["request"]["state"])
                self.assertLessEqual(len(partial["questions"]), 16)
                self.assertEqual(fixture["parent_source_semantics_sha256"], parent["source_semantics_sha256"])
                combined.extend(partial["questions"].items())
            self.assertEqual(combined, list(parent["request"]["questions"].items()))
            self.assertEqual(logical["part_question_counts"], [16, 9])

    def test_partial_answer_aggregation_preserves_original_deterministic_grade(self):
        by_id = {entry["call_id"]: entry for entry in self.plan["schedule"]}
        for logical in self.plan["logical_tasks"]:
            parent = replay.read(self.root / logical["parent_fixture"])
            source_response = replay.read(replay.SITE / "public/evidence" / parent["source_files"]["response"])
            source_response["model"] = replay.MODEL
            full_grade = replay.grade(parent["request"], source_response)
            combined = {"model": replay.MODEL, "answers": {}}
            for call_id in logical["parts"]:
                partial = replay.read(self.root / by_id[call_id]["fixture"])["request"]
                response = {"model": replay.MODEL, "answers": {key: source_response["answers"][key] for key in partial["questions"]}}
                self.assertTrue(replay.grade(partial, response)["schema_valid"])
                combined["answers"].update(response["answers"])
            self.assertEqual(replay.grade(parent["request"], combined), full_grade)


if __name__ == "__main__":
    unittest.main()
