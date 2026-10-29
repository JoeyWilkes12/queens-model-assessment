"""Offline checks for local-panel grades, failure classification and denominators."""
import importlib.util
import json
import contextlib
import io
import shutil
import pathlib
import tempfile
import unittest
from unittest import mock

HERE = pathlib.Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("ollama_panel", HERE / "panel.py")
panel = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(panel)


class PanelTests(unittest.TestCase):
    """Protect the separation between transport, format and rule correctness."""

    def setUp(self):
        """Use a small synthetic fixture unrelated to the evaluated boards."""
        self.board = {"id": "fixture", "size": 5, "regions": [[r] * 5 for r in range(5)]}
        self.answer = json.dumps({"board_id": "fixture", "columns_by_row": [1, 3, 5, 2, 4]})

    def test_grade_accepts_valid_and_rejects_touch_and_region_conflict(self):
        """All four Queens rules must hold; format alone is insufficient."""
        self.assertTrue(panel.grading.grade(self.board, self.answer)["correct"])
        touching = json.dumps({"board_id": "fixture", "columns_by_row": [1, 2, 3, 4, 5]})
        self.assertFalse(panel.grading.grade(self.board, touching)["correct"])
        changed = {**self.board, "regions": [[0] * 5 for _ in range(5)]}
        self.assertFalse(panel.grading.grade(changed, self.answer)["correct"])

    def test_format_diagnostic_is_separate_and_unambiguous(self):
        """A fenced solve is diagnostic-only; multiple candidates do not count."""
        wrapped = "```json\n" + self.answer + "\n```"
        self.assertFalse(panel.grading.grade(self.board, wrapped)["correct"])
        self.assertTrue(panel.grading.diagnose(self.board, wrapped)["rule_valid_after_extraction"])
        self.assertFalse(panel.grading.diagnose(self.board, self.answer * 2)["rule_valid_after_extraction"])
        duplicate = '{"board_id":"fixture","board_id":"fixture","columns_by_row":[1,3,5,2,4]}'
        self.assertFalse(panel.grading.grade(self.board, duplicate)["correct"])

    def test_classification_never_counts_transport_or_missing_answers(self):
        """Infrastructure and budget limits remain distinct outcomes."""
        no = {"correct": False}
        diag = {"rule_valid_after_extraction": False}
        self.assertEqual(panel.classify(500, {}, no, diag), "transport_error")
        self.assertEqual(panel.classify(200, {"done_reason": "length"}, no, diag), "truncated")
        self.assertEqual(panel.classify(200, {"message": {"content": ""}}, no, diag), "no_final_answer")
        self.assertEqual(panel.classify(200, {"message": {"content": self.answer}}, {"correct": True}, diag), "strict")

    def test_summary_keeps_scheduled_and_unattempted_in_denominators(self):
        """Recorded errors cannot silently shrink a study denominator."""
        with tempfile.TemporaryDirectory() as temporary:
            out = pathlib.Path(temporary)
            boards = [{"id": f"b{s}", "size": s, "stratum": {}, "image": f"images/b{s}.png"} for s in (5, 7, 9)]
            panel.save(out / "plan.json", {"study": "fixture", "protocol": {}, "runtime": {}, "boards": boards})
            panel.save(out / "receipts/baseline_b5/metadata.json", {"outcome": "transport_error", "http_status": 500,
                       "strict_correct": False, "rule_valid_after_extraction": False, "elapsed_seconds": 1})
            with mock.patch.object(panel, "OUT", out):
                panel.summarize()
            summary = panel.read(out / "summary.json")
            self.assertEqual(len(summary["rows"]), 3)
            self.assertEqual(summary["by_treatment_size"][0]["scheduled"], 1)
            self.assertEqual(summary["by_treatment_size"][0]["transport_errors"], 1)
            self.assertEqual(summary["by_treatment_size"][1]["not_run"], 1)
            self.assertFalse(summary["gate"]["baseline_success"])


    def test_runtime_drift_rejected_with_unchanged_model_digest(self):
        """Server, runner and defaults are part of identity, not just weight digest."""
        plan = panel.read(panel.OUT / "plan.json")
        base = plan["runtime"]
        panel.validate_runtime(plan, base)
        for key, value in (("server_version", "changed"), ("details", {**base["details"], "runner": "different"}),
                           ("parameters_reported", "temperature 123")):
            with self.subTest(field=key):
                changed = {**base, key: value}
                self.assertEqual(changed["digest"], base["digest"])
                with self.assertRaisesRegex(RuntimeError, key):
                    panel.validate_runtime(plan, changed)

    def test_verify_catches_summary_and_receipt_tampering(self):
        """Offline audit rejects changed totals and metadata even when JSON is valid."""
        with tempfile.TemporaryDirectory() as temporary:
            out = pathlib.Path(temporary)
            shutil.copy(panel.OUT / "plan.json", out / "plan.json")
            shutil.copy(panel.OUT / "prompt-template.txt", out / "prompt-template.txt")
            shutil.copytree(panel.OUT / "images", out / "images")
            with mock.patch.object(panel, "OUT", out), contextlib.redirect_stdout(io.StringIO()):
                panel.summarize()
                panel.verify()
                with self.assertRaisesRegex(AssertionError, "Publication is incomplete"):
                    panel.verify(require_complete=True)
                changed = panel.read(out / "summary.json")
                changed["by_treatment_size"][0]["scheduled"] = 0
                panel.save(out / "summary.json", changed)
                with self.assertRaisesRegex(AssertionError, "denominators"):
                    panel.verify()
                panel.summarize()
                plan = panel.read(out / "plan.json")
                board = plan["boards"][0]
                request = panel.request_body(plan, board, "baseline")
                response = {"model": panel.MODEL, "message": {"content": "not JSON"}, "done": True,
                            "done_reason": "stop", "prompt_eval_count": 10, "eval_count": 2}
                panel.save(out / "receipts" / ("baseline_" + board["id"]) / "request.json", request)
                panel.record_result(plan, board, "baseline", response, 200, 1.0, request, panel.utc())
                panel.verify()
                path = out / "receipts" / ("baseline_" + board["id"]) / "metadata.json"
                meta = panel.read(path)
                meta["output_tokens"] = 999
                panel.save(path, meta)
                with self.assertRaisesRegex(AssertionError, "Token metadata"):
                    panel.verify()
                with self.assertRaises(AssertionError):
                    panel.verify(require_complete=True)


if __name__ == "__main__":
    unittest.main()
