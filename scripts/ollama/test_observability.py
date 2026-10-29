"""Offline-only future-run telemetry tests; all journals are temporary fixtures."""
import contextlib
import copy
import importlib.util
import io
import json
import os
import pathlib
import shutil
import stat
import tempfile
import unittest
from unittest import mock

HERE = pathlib.Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("future_panel", HERE / "panel.py")
panel = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(panel)
import local_observability as obs  # noqa: E402


class ObservabilityTests(unittest.TestCase):
    """Enforce numeric privacy, legacy compatibility and zero live inference."""

    def setUp(self):
        """Block every real urllib request, including metadata, in this suite."""
        self.network = mock.patch("urllib.request.OpenerDirector.open", side_effect=AssertionError("network forbidden in offline tests"))
        self.network.start()
        self.addCleanup(self.network.stop)
        self.original_out = panel.OUT
        self.plan = panel.read(self.original_out / "plan.json")
        self.response = {"model": panel.MODEL, "done": True, "done_reason": "stop",
                         "message": {"content": "private generated text"},
                         **{key: 10 for key in obs.USAGE_FIELDS}, "prompt_eval_cached_count": 2}
        self.request = {"model": panel.MODEL, "messages": [{"role": "user", "content": "private prompt /private/path"}],
                        "options": {"num_predict": 12288, "num_ctx": 16384, "temperature": 0, "seed": 42}}

    def fixture(self, out, count=2):
        """Prepare a small isolated run without copying or altering saved receipts."""
        plan = copy.deepcopy(self.plan)
        plan["boards"] = plan["boards"][:count]
        panel.save(out / "plan.json", plan)
        shutil.copy(self.original_out / "prompt-template.txt", out / "prompt-template.txt")
        shutil.copytree(self.original_out / "images", out / "images")
        return plan

    def test_host_unavailable_is_explicit_null_without_error_text(self):
        """Failed collectors cannot masquerade as zero memory or normal pressure."""
        with mock.patch.object(obs, "_command", return_value=None):
            host = obs.capture_host()
        self.assertTrue(all(host[field] is None for field in obs.HOST_FIELDS))
        self.assertEqual(host["unavailable_fields"], list(obs.HOST_FIELDS))
        self.assertNotIn("error", json.dumps(host))

    def test_host_numeric_parsing_retains_no_raw_command_output(self):
        """Translate fixed sysctl/vm_stat numbers and discard unrelated text."""
        values = ["25769803776\n", "2\n", "total = 1024.00M used = 512.00M free = 512.00M (encrypted)",
                  "Mach Virtual Memory Statistics: (page size of 16384 bytes)\nPages free: 10.\nPages inactive: 20.\nPages purgeable: 3.\nPages wired down: 4.\nPages occupied by compressor: 5.\nprivate unrelated text"]
        with mock.patch.object(obs, "_command", side_effect=values):
            host = obs.capture_host()
        self.assertEqual(host["physical_memory_bytes"], 25769803776)
        self.assertEqual(host["pressure_level"], 2)
        self.assertEqual(host["swap_used_bytes"], 512 * 1024 ** 2)
        self.assertEqual(host["free_memory_bytes"], 10 * 16384)
        self.assertEqual(host["compressor_memory_bytes"], 5 * 16384)
        self.assertFalse(host["unavailable_fields"])
        self.assertNotIn("private", json.dumps(host))

    def test_command_failure_discards_stderr(self):
        """Subprocess failures expose no command/error text to a host record."""
        with mock.patch.object(obs.subprocess, "run", side_effect=OSError("private error")):
            self.assertIsNone(obs._command(["/usr/bin/vm_stat"]))

    def test_journal_projection_is_numeric_and_privacy_allowlisted(self):
        """Private prompt, output, identifiers and error payloads never enter the event."""
        response = {**self.response, "request_id": "private-unique-id", "raw_path": "/private/path"}
        event = obs.journal_event(self.request, response, 200, "baseline", 100, 102, 2)
        self.assertEqual(event["run"], "queens-baseline")
        self.assertEqual(event["status"], "success")
        self.assertEqual(event["usage"]["eval_count"], 10)
        self.assertNotIn("private", json.dumps(event))
        self.assertNotIn("messages", event)
        failed = obs.journal_event(self.request, {"error": "private exception"}, 500, "caveman", 100, 102, 2)
        self.assertEqual(failed["status"], "error")
        self.assertNotIn("usage", failed)
        self.assertNotIn("private", json.dumps(failed))

    def test_invalid_usage_is_not_coerced_to_zero_or_exported(self):
        """Malformed native counts produce an error attempt without fabricated usage."""
        for value in (True, -1, 1.5, float("nan"), float("inf"), 2 ** 63, None):
            with self.subTest(value=value):
                event = obs.journal_event(self.request, {**self.response, "eval_count": value}, 200, "baseline", 100, 102, 2)
                self.assertEqual(event["status"], "error")
                self.assertNotIn("usage", event)
        event = obs.journal_event(self.request, {key: value for key, value in self.response.items() if key != "total_duration"}, 200, "baseline", 100, 102, 2)
        self.assertNotIn("usage", event)

    def test_journal_rejects_extra_fields_invalid_numbers_and_labels(self):
        """Validation happens before file creation and forbids arbitrary metric labels."""
        event = obs.journal_event(self.request, self.response, 200, "baseline", 100, 102, 2)
        cases = [{**event, "prompt": "private"}, {**event, "wall_seconds": float("nan")},
                 {**event, "model": "/private/model"}, {**event, "run": "unique-request-id"},
                 {**event, "usage": {**event["usage"], "eval_count": True}}]
        with tempfile.TemporaryDirectory() as temporary:
            journal = pathlib.Path(temporary) / "fixture.jsonl"
            for changed in cases:
                with self.assertRaises(ValueError):
                    obs.append_event(journal, changed)
            self.assertFalse(journal.exists())

    def test_temporary_journal_is_locked_bounded_and_mode0600(self):
        """Only temporary fixture files are used to check append semantics."""
        event = obs.journal_event(self.request, self.response, 200, "baseline", 100, 102, 2)
        with tempfile.TemporaryDirectory() as temporary:
            journal = pathlib.Path(temporary) / "fixture.jsonl"
            journal.write_text("")
            journal.chmod(0o666)
            with mock.patch.object(obs.fcntl, "flock", wraps=obs.fcntl.flock) as lock:
                obs.append_event(journal, event)
                self.assertEqual(lock.call_args.args[1], obs.fcntl.LOCK_EX | obs.fcntl.LOCK_NB)
            self.assertEqual(stat.S_IMODE(journal.stat().st_mode), 0o600)
            self.assertEqual(json.loads(journal.read_text()), event)
            with mock.patch.object(obs, "MAX_JOURNAL_BYTES", 1), self.assertRaises(OSError):
                obs.append_event(journal, event)
            self.assertEqual(len(journal.read_text().splitlines()), 1)

    def test_legacy_and_future_request_defaults_are_distinct(self):
        """Historical requests remain32768/10m; new plans explicitly request16384/0."""
        board = self.plan["boards"][0]
        old = panel.request_body(self.plan, board, "baseline")
        self.assertEqual(old["keep_alive"], "10m")
        self.assertEqual(old["options"]["num_ctx"], 32768)
        new = copy.deepcopy(self.plan)
        new["protocol"].update(num_ctx=16384, keep_alive=0)
        request = panel.request_body(new, board, "baseline")
        self.assertEqual(request["keep_alive"], 0)
        self.assertEqual(request["options"]["num_ctx"], 16384)

    def test_future_freeze_requires_new_identity_and_explicit_defaults(self):
        """Freeze tests mock metadata/rendering and write exclusively to a temp study."""
        with tempfile.TemporaryDirectory() as temporary, mock.patch.object(panel, "OUT", pathlib.Path(temporary)):
            with self.assertRaises(SystemExit):
                panel.freeze(panel.STUDY)
            with mock.patch.object(panel, "model_snapshot", return_value=self.plan["runtime"]), mock.patch.object(panel, "render_png", side_effect=lambda size, regions, path: path.write_bytes(b"fixture PNG")), contextlib.redirect_stdout(io.StringIO()):
                panel.freeze("future-policy-fixture")
            frozen = panel.read(panel.OUT / "plan.json")
            self.assertEqual(frozen["study"], "future-policy-fixture")
            self.assertEqual(frozen["protocol"]["num_ctx"], 16384)
            self.assertEqual(frozen["protocol"]["keep_alive"], 0)

    def test_journal_failure_does_not_retry_or_lose_model_receipts(self):
        """A failed optional append remains separate from two saved API responses."""
        with tempfile.TemporaryDirectory() as temporary:
            out = pathlib.Path(temporary) / "study"
            self.fixture(out)
            with mock.patch.object(panel, "OUT", out), mock.patch.object(panel, "model_snapshot", return_value=self.plan["runtime"]), mock.patch.object(panel, "capture_host", return_value={"pressure_level": None}), mock.patch.object(panel, "local_api", return_value=(200, self.response)) as api, mock.patch.object(obs, "append_event", side_effect=OSError("private journal path")), contextlib.redirect_stdout(io.StringIO()):
                panel.run("baseline", journal=pathlib.Path(temporary) / "fixture.jsonl")
            self.assertEqual(api.call_count, 2)
            directories = sorted((out / "receipts").iterdir())
            self.assertEqual(len(directories), 2)
            for directory in directories:
                self.assertTrue((directory / "metadata.json").exists())
                self.assertTrue((directory / "response.json").exists())
                self.assertEqual(panel.read(directory / "journal.json")["status"], "journal_write_failed")

    def test_uncertain_transport_stops_after_one_saved_call(self):
        """A socket timeout is not cancellation and cannot trigger another model request."""
        with tempfile.TemporaryDirectory() as temporary:
            out = pathlib.Path(temporary) / "study"
            self.fixture(out)
            with mock.patch.object(panel, "OUT", out), mock.patch.object(panel, "model_snapshot", return_value=self.plan["runtime"]), mock.patch.object(panel, "capture_host", return_value={"pressure_level": None}), mock.patch.object(panel, "local_api", side_effect=TimeoutError("private error")) as api, contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaisesRegex(SystemExit, "does not cancel backend work"):
                    panel.run("baseline", journal=pathlib.Path(temporary) / "fixture.jsonl")
            self.assertEqual(api.call_count, 1)
            directories = list((out / "receipts").iterdir())
            self.assertEqual(len(directories), 1)
            self.assertTrue((directories[0] / "metadata.json").exists())
            self.assertEqual(panel.read(directories[0] / "host.json")["after"]["pressure_level"], None)
            event = json.loads((pathlib.Path(temporary) / "fixture.jsonl").read_text())
            self.assertEqual(event["status"], "error")
            self.assertNotIn("private", json.dumps(event))

    def test_saved_timeout_blocks_resumption_and_cross_arm_switch(self):
        """The second invocation cannot bypass a saved failure by skipping its receipt."""
        with tempfile.TemporaryDirectory() as temporary:
            out = pathlib.Path(temporary) / "study"
            self.fixture(out)
            with mock.patch.object(panel, "OUT", out), mock.patch.object(panel, "model_snapshot", return_value=self.plan["runtime"]) as metadata, mock.patch.object(panel, "capture_host", return_value={"pressure_level": None}) as host, mock.patch.object(panel, "local_api", side_effect=TimeoutError("private error")) as api, mock.patch.object(panel, "record_journal", return_value={"enabled": True, "recorded": False, "status": "journal_write_failed"}) as journal, contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaises(SystemExit):
                    panel.run("baseline")
                failed = next((out / "receipts").glob("*/metadata.json"))
                immutable = failed.read_bytes()
                metadata.reset_mock()
                host.reset_mock()
                api.reset_mock()
                journal.reset_mock()
                for treatment in ("baseline", "caveman"):
                    with self.assertRaisesRegex(SystemExit, "Unresolved client failure"):
                        panel.run(treatment, journal=pathlib.Path(temporary) / "fixture.jsonl")
                metadata.assert_not_called()
                host.assert_not_called()
                api.assert_not_called()
                journal.assert_not_called()
                self.assertEqual(failed.read_bytes(), immutable)

    def test_unresolved_caveman_receipt_also_blocks_baseline(self):
        """Uncertainty is a study-wide barrier, independent of selected treatment."""
        with tempfile.TemporaryDirectory() as temporary:
            out = pathlib.Path(temporary) / "study"
            plan = self.fixture(out)
            panel.save(out / "receipts" / ("caveman_" + plan["boards"][0]["id"]) / "metadata.json", {"http_status": None})
            with mock.patch.object(panel, "OUT", out), mock.patch.object(panel, "model_snapshot", side_effect=AssertionError("metadata forbidden")), mock.patch.object(panel, "local_api", side_effect=AssertionError("API forbidden")):
                with self.assertRaisesRegex(SystemExit, "Unresolved client failure"):
                    panel.run("baseline")

    def test_fifo_journal_never_blocks_open_and_rejects_before_lock(self):
        """Temporary FIFOs fail safely with and without a reader; no bytes are appended."""
        event = obs.journal_event(self.request, self.response, 200, "baseline", 100, 102, 2)
        real_open = os.open
        with tempfile.TemporaryDirectory() as temporary:
            fifo = pathlib.Path(temporary) / "fixture.fifo"
            os.mkfifo(fifo, 0o600)

            def guarded_open(path, flags, mode=0o600):
                """Fail the regression before opening if nonblocking protection disappears."""
                self.assertTrue(flags & os.O_NONBLOCK)
                return real_open(path, flags, mode)

            with mock.patch.object(obs.os, "open", side_effect=guarded_open), mock.patch.object(obs.fcntl, "flock", side_effect=AssertionError("nonregular descriptor must not reach flock")):
                result = obs.record_journal(fifo, self.request, self.response, 200, "baseline", 100, 102, 2)
                self.assertEqual(result["status"], "journal_write_failed")
                reader = real_open(fifo, os.O_RDONLY | os.O_NONBLOCK)
                try:
                    with self.assertRaisesRegex(OSError, "owned_regular_file"):
                        obs.append_event(fifo, event)
                finally:
                    os.close(reader)

    def test_busy_temporary_journal_uses_nonblocking_lock(self):
        """A busy optional journal reports failure instead of waiting behind another writer."""
        real_flock = obs.fcntl.flock
        with tempfile.TemporaryDirectory() as temporary:
            path = pathlib.Path(temporary) / "fixture.jsonl"
            descriptor = os.open(path, os.O_WRONLY | os.O_CREAT, 0o600)
            real_flock(descriptor, obs.fcntl.LOCK_EX | obs.fcntl.LOCK_NB)

            def guarded_lock(target, operation):
                """Fail before a potentially blocking lock if the safety flag regresses."""
                self.assertTrue(operation & obs.fcntl.LOCK_NB)
                return real_flock(target, operation)

            try:
                with mock.patch.object(obs.fcntl, "flock", side_effect=guarded_lock):
                    result = obs.record_journal(path, self.request, self.response, 200, "baseline", 100, 102, 2)
                self.assertEqual(result["status"], "journal_write_failed")
                self.assertEqual(path.read_bytes(), b"")
            finally:
                os.close(descriptor)

    def test_offline_cli_verify_calls_no_metadata_host_or_journal(self):
        """The completed historical audit is entirely offline and does not mutate evidence."""
        before = {path: path.read_bytes() for path in self.original_out.rglob("*") if path.is_file()}
        with mock.patch.object(panel, "local_api", side_effect=AssertionError("API forbidden")), mock.patch.object(panel, "model_snapshot", side_effect=AssertionError("metadata forbidden")), mock.patch.object(panel, "capture_host", side_effect=AssertionError("host collection forbidden")), mock.patch.object(panel, "record_journal", side_effect=AssertionError("journal forbidden")), mock.patch("sys.argv", ["panel.py", "verify", "--require-complete"]), contextlib.redirect_stdout(io.StringIO()):
            panel.main()
        self.assertEqual(before, {path: path.read_bytes() for path in self.original_out.rglob("*") if path.is_file()})

    def test_completed_run_never_queries_metadata_or_backfills_journal(self):
        """A completed study returns before any endpoint, host command or append."""
        with tempfile.TemporaryDirectory() as temporary:
            journal = pathlib.Path(temporary) / "fixture.jsonl"
            with mock.patch.object(panel, "local_api", side_effect=AssertionError("API forbidden")), mock.patch.object(panel, "model_snapshot", side_effect=AssertionError("metadata forbidden")), mock.patch.object(panel, "capture_host", side_effect=AssertionError("host forbidden")), mock.patch.object(panel, "record_journal", side_effect=AssertionError("journal forbidden")), contextlib.redirect_stdout(io.StringIO()):
                panel.run("baseline", journal=journal)
                panel.run("caveman", journal=journal)
            self.assertFalse(journal.exists())

    def test_uncertain_marker_blocks_metadata_before_any_new_call(self):
        """Saved start markers are checked before even querying the model service."""
        with tempfile.TemporaryDirectory() as temporary:
            out = pathlib.Path(temporary) / "study"
            plan = self.fixture(out)
            panel.save(out / "receipts" / ("baseline_" + plan["boards"][0]["id"]) / "started.json", {"started_utc": "fixture"})
            with mock.patch.object(panel, "OUT", out), mock.patch.object(panel, "model_snapshot", side_effect=AssertionError("metadata forbidden")), mock.patch.object(panel, "local_api", side_effect=AssertionError("API forbidden")):
                with self.assertRaisesRegex(SystemExit, "no metadata query"):
                    panel.run("baseline")


if __name__ == "__main__":
    unittest.main()
