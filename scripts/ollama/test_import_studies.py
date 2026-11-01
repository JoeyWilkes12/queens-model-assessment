"""Offline mutation tests for immutable Local Qwen evidence snapshots."""
import base64
import importlib.util
import json
import shutil
from pathlib import Path
import tempfile
import unittest
from unittest import mock

SPEC = importlib.util.spec_from_file_location("local_qwen_import", Path(__file__).with_name("import_studies.py"))
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class ImportTests(unittest.TestCase):
    """Use small synthetic evidence with genuine rules, avoiding production data copies."""

    def setUp(self):
        """Freeze two paired five-by-five studies in an isolated local source."""
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.source = self.base / "source"
        self.output = self.base / "output"
        self.board = {"id": "fixture-5", "size": 5, "regions": [[r] * 5 for r in range(5)],
                      "image": "images/fixture-5.png", "image_sha256": module.sha(b"fixture image")}
        self.answer = {"board_id": "fixture-5", "columns_by_row": [1, 3, 5, 2, 4]}
        self.template = "Solve {{BOARD_ID}} {{SIZE}}"
        self.system = "Use brief words."
        self.pilot = self.source / "public/evidence/ollama"
        self.larger = self.source / "public/evidence/ollama-models/qwen3.5-9b-nvfp4-np24576"
        self.seed(self.pilot, "qwen3.5:4b", 12288)
        self.seed(self.larger, "qwen3.5:9b-nvfp4", 24576)
        patcher = mock.patch.object(module, "provenance", return_value={"source_commit": "a" * 40, "source_dirty": True})
        patcher.start()
        self.addCleanup(patcher.stop)

    def seed(self, root, model, budget):
        """Create complete strict responses plus numeric host telemetry."""
        (root / "images").mkdir(parents=True)
        (root / self.board["image"]).write_bytes(b"fixture image")
        (root / "prompt-template.txt").write_text(self.template)
        (root / "caveman-system.txt").write_text(self.system)
        module.save(root / "skill.json", {"system_sha256": module.sha(self.system.encode())})
        protocol = {"modality": "image", "one_shot": True, "tools": False, "retries": 0,
                    "structured_output_enforcement": False, "think": True, "num_predict": budget,
                    "temperature": 0, "seed": 2, "num_ctx": budget + 4096, "keep_alive": 0}
        plan = {"study": "fixture-" + root.name, "runtime": {"model": model, "digest": "d" * 64},
                "protocol": protocol, "boards": [self.board], "prompt_template_sha256": module.sha(self.template.encode())}
        module.save(root / "plan.json", plan)
        rows = []
        for arm in module.ARMS:
            call_id = arm + "_" + self.board["id"]
            user = {"role": "user", "content": "Solve fixture-5 5", "images": [base64.b64encode(b"fixture image").decode()]}
            request = {**module.configuration(plan), "messages": ([{"role": "system", "content": self.system}] if arm == "caveman" else []) + [user]}
            response = {"model": model, "done": True, "done_reason": "stop", "message": {"content": json.dumps(self.answer), "thinking": "A short reasoning trace."},
                        "prompt_eval_count": 30 if arm == "caveman" else 10, "eval_count": 20}
            meta = {"call_id": call_id, "board_id": self.board["id"], "size": 5, "treatment": arm,
                    "model": model, "returned_model": model, "model_digest": "d" * 64, "image_sha256": self.board["image_sha256"],
                    "done": True, "http_status": 200, "request_sha256": module.sha(module.canonical(request)),
                    "response_sha256": module.sha(module.canonical(response)), "finish_reason": "stop", "strict_correct": True,
                    "rule_valid_after_extraction": True, "outcome": "strict", "input_tokens": response["prompt_eval_count"],
                    "output_tokens": 20, "elapsed_seconds": 2.0}
            directory = root / "receipts" / call_id
            for name, value in {"request": request, "response": response, "metadata": meta,
                                "grade": module.grading.grade(self.board, response["message"]["content"]),
                                "diagnostic": module.grading.diagnose(self.board, response["message"]["content"]),
                                "host": {"window": {"samples": 2, "max_pressure_level": 1, "private_note": "not copied"}, "processes": ["private"]}}.items():
                module.save(directory / (name + ".json"), value)
            (directory / "server-log.txt").write_text("PRIVATE LOG NOT FOR PUBLICATION")
            rows.append({"call_id": call_id, "board_id": self.board["id"], "size": 5, "treatment": arm,
                         "state": "recorded", "strict_correct": True, "input_tokens": meta["input_tokens"],
                         "output_tokens": 20, "elapsed_seconds": 2.0, "image": self.board["image"], "outcome": "strict"})
        module.save(root / "summary.json", {"study": plan["study"], "protocol": protocol, "runtime": plan["runtime"], "rows": rows})

    def capture(self, name="fixture-snapshot"):
        """Import and return the public catalog."""
        return module.import_snapshot(self.source, name, self.output)

    def mutate(self, name, change, rehash=False):
        """Alter a larger-model baseline artifact, optionally updating canonical hashes."""
        directory = self.larger / "receipts/baseline_fixture-5"
        value = module.read(directory / (name + ".json"))
        change(value)
        module.save(directory / (name + ".json"), value)
        if rehash:
            meta = module.read(directory / "metadata.json")
            meta[name + "_sha256"] = module.sha(module.canonical(value))
            module.save(directory / "metadata.json", meta)

    def make_four_arm(self):
        """Add a frozen fresh study with four distinct checked system prompts."""
        root = self.larger.with_name("qwen3.5-9b-nvfp4-fresh1-4arm-np32768")
        shutil.copytree(self.larger, root)
        plan, summary = (module.read(root / name) for name in ("plan.json", "summary.json"))
        plan["arm_names"] = ["baseline", "schema", "neutral", "caveman"]
        plan["board_set"] = {"name": "fresh1"}
        plan["arms"] = {}
        plan["protocol"].update(transport="stream", loop_stop={"shadow": True}, rescue=False)
        for arm in plan["arm_names"]:
            body = None if arm == "baseline" else self.system if arm == "caveman" else "Distinct " + arm
            name = None if body is None else "caveman-system.txt" if arm == "caveman" else "arm-" + arm + ".txt"
            if name:
                (root / name).write_text(body)
            plan["arms"][arm] = {"system_file": name, "system_sha256": module.sha(body.encode()) if body else None,
                                  "system_chars": len(body or ""), "system_words": len((body or "").split())}
            call_id = arm + "_fixture-5"
            directory = root / "receipts" / call_id
            if not directory.exists():
                shutil.copytree(root / "receipts/caveman_fixture-5", directory)
                row = dict(summary["rows"][1], call_id=call_id, treatment=arm)
                summary["rows"].append(row)
            request, meta = (module.read(directory / n) for n in ("request.json", "metadata.json"))
            request["stream"] = True
            request["messages"] = ([{"role": "system", "content": body}] if body else []) + [request["messages"][-1]]
            meta.update(call_id=call_id, treatment=arm, request_sha256=module.sha(module.canonical(request)),
                        loop_stop={"enabled": False, "shadow": True, "would_have_stopped": True})
            module.save(directory / "request.json", request)
            module.save(directory / "metadata.json", meta)
        summary["protocol"] = plan["protocol"]
        module.save(root / "plan.json", plan)
        module.save(root / "summary.json", summary)
        return root

    def test_four_arm_shadow_contract(self):
        """A shadow trigger does not censor results or create schema/Caveman pairs."""
        self.make_four_arm()
        study = next(s for s in self.capture()["studies"] if s["board_set"] == "fresh1")
        self.assertEqual((study["planned"], study["recorded"], study["loop_mode"], study["decoding"]), (4, 4, "shadow", "greedy"))
        self.assertEqual(len(study["arms"]), 4)
        schema = next(r for r in study["rows"] if r["treatment"] == "schema")
        self.assertEqual(len(schema["peer_call_ids"]), 3)
        self.assertIsNone(schema["peer_call_id"])
        self.assertFalse(schema["pair_verified"])
        self.assertFalse(schema["loop_stopped"])
        self.assertTrue(schema["loop_stop"]["would_have_stopped"])

    def test_arm_prompt_mutation(self):
        """A changed control-arm prompt fails its frozen hash."""
        root = self.make_four_arm()
        (root / "arm-neutral.txt").write_text("changed")
        with self.assertRaisesRegex(ValueError, "Arm system hash"):
            self.capture()

    def test_supported_plan_without_summary(self):
        """A known plan without its summary cannot disappear from the capture."""
        (self.larger / "summary.json").unlink()
        with self.assertRaisesRegex(ValueError, "missing summary"):
            self.capture()

    def test_shadow_cannot_be_active_stop(self):
        """Shadow receipts cannot claim a client-stop outcome."""
        root = self.make_four_arm()
        p = root / "receipts/schema_fixture-5/metadata.json"
        meta = module.read(p)
        meta["outcome"] = "loop_stopped"
        module.save(p, meta)
        with self.assertRaisesRegex(ValueError, "Invalid client loop stop"):
            self.capture()

    def test_unknown_frozen_condition(self):
        """An unrecognized frozen plan requires review instead of silently disappearing."""
        root = self.larger.with_name("unrecognized-model-study")
        root.mkdir()
        module.save(root / "plan.json", {})
        with self.assertRaisesRegex(ValueError, "Unsupported frozen study"):
            self.capture()

    def test_snapshot_and_allowlist(self):
        """Preserve source bytes but omit raw logs and host identities."""
        catalog = self.capture()
        self.assertEqual(sum(s["recorded"] for s in catalog["studies"]), 4)
        self.assertEqual(module.verify_snapshot(self.output), catalog)
        study = catalog["studies"][1]
        row = study["rows"][0]
        self.assertTrue(row["pair_verified"])
        self.assertEqual((self.output / row["receipt"] / "request.json").read_bytes(),
                         (self.larger / "receipts/baseline_fixture-5/request.json").read_bytes())
        names = {p.name for p in self.output.rglob("*")}
        self.assertNotIn("server-log.txt", names)
        self.assertNotIn("host.json", names)
        self.assertEqual(set(row["host"]), set(module.HOST_KEYS))
        self.assertNotIn(str(self.source), (self.output / "index.json").read_text())
        with self.assertRaisesRegex(ValueError, "already exists"):
            self.capture()

    def test_saved_artifact_mutation(self):
        """Hash verification rejects edits to a published raw response."""
        catalog = self.capture()
        p = self.output / catalog["studies"][1]["rows"][0]["receipt"] / "response.json"
        p.write_text(p.read_text() + " ")
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            module.verify_snapshot(self.output)

    def test_derived_index_mutation(self):
        """The pointer cannot silently change displayed grades."""
        self.capture()
        index = module.read(self.output / "index.json")
        index["studies"][0]["rows"][0]["strict_correct"] = False
        module.save(self.output / "index.json", index)
        with self.assertRaisesRegex(ValueError, "catalog"):
            module.verify_snapshot(self.output)

    def test_partial_pair(self):
        """Pending calls are not fabricated zero-usage failures or verified pairs."""
        summary = module.read(self.larger / "summary.json")
        summary["rows"][1]["state"] = "not_run"
        shutil.rmtree(self.larger / "receipts" / summary["rows"][1]["call_id"])
        module.save(self.larger / "summary.json", summary)
        catalog = self.capture()
        larger = catalog["studies"][1]
        self.assertEqual(larger["status"], "partial")
        self.assertEqual(larger["recorded"], 1)
        self.assertFalse(larger["rows"][0]["pair_verified"])
        self.assertIsNone(larger["rows"][1]["input_tokens"])
        self.assertIsNone(larger["rows"][1]["receipt"])

    def test_request_hash(self):
        """Canonical hashes detect changed request bytes even with valid JSON."""
        self.mutate("response", lambda value: value.update(eval_count=22))
        with self.assertRaisesRegex(ValueError, "Response hash"):
            self.capture()

    def test_changed_generation_setting(self):
        """Even rehashed requests must match frozen generation controls."""
        self.mutate("request", lambda value: value["options"].update(temperature=1), True)
        with self.assertRaisesRegex(ValueError, "configuration"):
            self.capture()

    def test_changed_image(self):
        """Images must match frozen plan hashes."""
        (self.larger / self.board["image"]).write_bytes(b"wrong image")
        with self.assertRaisesRegex(ValueError, "image hash"):
            self.capture()

    def test_changed_model_digest(self):
        """Metadata cannot point at a different model build."""
        self.mutate("metadata", lambda value: value.update(model_digest="e" * 64))
        with self.assertRaisesRegex(ValueError, "identity mismatch"):
            self.capture()

    def test_wrong_source_grade(self):
        """Source strict success flags are checked against the actual response."""
        self.mutate("metadata", lambda value: value.update(strict_correct=False))
        with self.assertRaisesRegex(ValueError, "strict grade"):
            self.capture()

    def test_changed_source_during_capture(self):
        """An inconsistent live source fails before the prior index is replaced."""
        prior = self.capture("prior")
        original = module.derive_catalog
        def unstable(base, manifest):
            result = original(base, manifest)
            p = self.larger / "summary.json"
            p.write_text(p.read_text() + " ")
            return result
        with mock.patch.object(module, "derive_catalog", side_effect=unstable):
            with self.assertRaisesRegex(ValueError, "Source changed"):
                self.capture("next")
        self.assertEqual(module.read(self.output / "index.json"), prior)
        self.assertFalse((self.output / "snapshots/next").exists())

    def test_conservative_format_diagnostic(self):
        """Fences and a unique bare array qualify; ambiguity and identity repairs do not."""
        text = json.dumps(self.answer)
        self.assertFalse(module.format_only_correct(self.board, text))
        self.assertTrue(module.format_only_correct(self.board, "```json\n" + text + "\n```"))
        self.assertTrue(module.format_only_correct(self.board, "[1,3,5,2,4]"))
        self.assertFalse(module.format_only_correct(self.board, "[1,3,5,2,4] or [2,4,1,3,5]"))
        self.assertFalse(module.format_only_correct(self.board, text.replace("fixture-5", "another-board")))
        self.assertFalse(module.format_only_correct(self.board, '{"board_id":"bad","board_id":"fixture-5","columns_by_row":[1,3,5,2,4]}'))
        self.assertFalse(module.format_only_correct(self.board, "[true,3,5,2,4]"))

    def make_loop_and_rescue(self):
        """Replace one fixture call by a stopped stream and a separate successful rescue."""
        plan = module.read(self.larger / "plan.json")
        plan["protocol"]["loop_stop"] = {"version": 1}
        plan["protocol"]["transport"] = "stream"
        module.save(self.larger / "plan.json", plan)
        summary = module.read(self.larger / "summary.json")
        summary["protocol"] = plan["protocol"]
        for row in summary["rows"]:
            directory = self.larger / "receipts" / row["call_id"]
            request, meta = (module.read(directory / name) for name in ("request.json", "metadata.json"))
            request["stream"] = True
            module.save(directory / "request.json", request)
            meta["request_sha256"] = module.sha(module.canonical(request))
            if row["treatment"] == "baseline":
                response = {"model": plan["runtime"]["model"], "done": False, "done_reason": None,
                            "client_stop": {"reason": "loop_stop"}, "message": {"content": "", "thinking": "repeat repeat"}}
                meta.update(done=False, finish_reason="loop_stop", strict_correct=False, rule_valid_after_extraction=False,
                            outcome="loop_stopped", input_tokens=None, output_tokens=None,
                            loop_stop={"enabled": True, "triggered": True})
                meta["response_sha256"] = module.sha(module.canonical(response))
                row.update(strict_correct=False, outcome="loop_stopped", input_tokens=None, output_tokens=None)
                for name, value in {"response": response, "grade": module.grading.grade(self.board, ""),
                                    "diagnostic": module.grading.diagnose(self.board, "")}.items():
                    module.save(directory / (name + ".json"), value)
            module.save(directory / "metadata.json", meta)
        module.save(self.larger / "summary.json", summary)
        source = self.larger / "receipts/baseline_fixture-5"
        original_request = module.read(source / "request.json")
        source_meta = module.read(source / "metadata.json")
        prefix = '{"board_id":"fixture-5","columns_by_row":['
        continuation = '1,3,5,2,4]}'
        request = {**original_request, "stream": False,
                   "messages": original_request["messages"] + [{"role": "assistant", "thinking": "repeat repeatSTOP", "content": prefix}],
                   "options": {"num_ctx": plan["protocol"]["num_ctx"], "seed": 2, "temperature": 0, "num_predict": 256}}
        response = {"model": plan["runtime"]["model"], "done": True, "done_reason": "stop",
                    "message": {"content": continuation}, "prompt_eval_count": 500, "eval_count": 12}
        meta = {"kind": "forced_answer_rescue", "call_id": source.name, "board_id": self.board["id"], "size": 5,
                "treatment": "baseline", "model": plan["runtime"]["model"], "source_response_sha256": source_meta["response_sha256"],
                "http_status": 200, "answer_prefix": prefix, "answer_text": prefix + continuation, "early_stop_text": "STOP",
                "strict_correct": True, "input_tokens": 500, "output_tokens": 12, "elapsed_seconds": 1.0, "outcome": "rescued_strict"}
        rescue = self.larger / "rescue" / source.name
        for name, value in {"request": request, "response": response, "metadata": meta,
                            "grade": module.grading.grade(self.board, prefix + continuation),
                            "diagnostic": module.grading.diagnose(self.board, prefix + continuation)}.items():
            module.save(rescue / (name + ".json"), value)
        return rescue

    def test_loop_usage_and_rescue_separate(self):
        """A successful follow-up never upgrades its stopped source or erases replay cost."""
        self.make_loop_and_rescue()
        row = self.capture()["studies"][1]["rows"][0]
        self.assertFalse(row["strict_correct"])
        self.assertTrue(row["loop_stopped"])
        self.assertFalse(row["truncated"])
        self.assertIsNone(row["input_tokens"])
        self.assertIsNone(row["output_tokens"])
        self.assertTrue(row["rescue"]["strict_correct"])
        self.assertEqual(row["rescue"]["input_tokens"], 500)
        self.assertEqual(row["rescue"]["output_tokens"], 12)

    def test_rescue_replay_mutation(self):
        """Rescue derivation rejects replaying reasoning unrelated to the original call."""
        rescue = self.make_loop_and_rescue()
        request = module.read(rescue / "request.json")
        request["messages"][-1]["thinking"] = "different thought"
        module.save(rescue / "request.json", request)
        with self.assertRaisesRegex(ValueError, "replayed thinking"):
            self.capture()

    def make_audit(self):
        """Build a selected one-call audit retaining both original planned rows."""
        self.make_loop_and_rescue()
        plan = module.read(self.larger / "plan.json")
        # The synthetic source uses one stop at exactly the observed trace length.
        meta_path = self.larger / "receipts/baseline_fixture-5/metadata.json"
        meta = module.read(meta_path)
        meta["loop_stop"]["fired_at_thinking_chars"] = len("repeat repeat")
        module.save(meta_path, meta)
        audit = self.larger.with_name(self.larger.name + "-audit")
        shutil.copytree(self.larger, audit)
        shutil.rmtree(audit / "rescue")
        plan["audit_of"] = self.larger.name
        plan["audit_calls"] = ["baseline_fixture-5"]
        plan["protocol"].pop("loop_stop")
        plan["protocol"]["transport"] = "nonstream"
        module.save(audit / "plan.json", plan)
        summary = module.read(audit / "summary.json")
        summary["protocol"] = plan["protocol"]
        summary["rows"][1]["state"] = "not_run"
        shutil.rmtree(audit / "receipts/caveman_fixture-5")
        receipt = audit / "receipts/baseline_fixture-5"
        request = module.read(receipt / "request.json")
        request["stream"] = False
        response = {"model": plan["runtime"]["model"], "done": True, "done_reason": "length",
                    "message": {"content": "", "thinking": "repeat repeat more"},
                    "prompt_eval_count": 10, "eval_count": 20}
        meta.update(done=True, finish_reason="length", outcome="truncated", input_tokens=10, output_tokens=20,
                    request_sha256=module.sha(module.canonical(request)), response_sha256=module.sha(module.canonical(response)),
                    loop_stop={"enabled": False},
                    audit={"source_receipt": "public/evidence/ollama-models/" + self.larger.name + "/receipts/baseline_fixture-5",
                           "source_stopped_at_thinking_chars": 13, "identical_up_to_stop": True, "answered_after_stop": False})
        summary["rows"][0].update(outcome="truncated", input_tokens=10, output_tokens=20)
        for name, value in (("request", request), ("response", response), ("metadata", meta)):
            module.save(receipt / (name + ".json"), value)
        module.save(audit / "summary.json", summary)
        # Discover normally supports the production audit naming; fixture stays small.
        original_pattern = module.STUDY_NAME
        pattern_patcher = mock.patch.object(module, "STUDY_NAME", __import__("re").compile(original_pattern.pattern + "|" + __import__("re").escape(audit.name)))
        pattern_patcher.start()
        self.addCleanup(pattern_patcher.stop)
        original = module.discover_sources
        patcher = mock.patch.object(module, "discover_sources", side_effect=lambda root: original(root))
        patcher.start()
        self.addCleanup(patcher.stop)
        return audit

    def test_selected_audit_contract(self):
        """Excluded rows remain raw evidence, not pending audit denominator entries."""
        audit_dir = self.make_audit()
        raw = (audit_dir / "summary.json").read_bytes()
        catalog = self.capture()
        audit = catalog["studies"][-1]
        self.assertEqual((audit["kind"], audit["decoding"], audit["planned"], audit["recorded"], audit["status"]),
                         ("audit", "loop-audit", 1, 1, "complete"))
        self.assertFalse(audit["rows"][0]["pair_verified"])
        self.assertEqual(audit["rows"][0]["peer_call_ids"], [])
        for study in catalog["studies"]:
            identities = {row["call_id"] for row in study["rows"]}
            self.assertTrue(all(set(row["peer_call_ids"]) <= identities for row in study["rows"]))
        self.assertTrue(audit["rows"][0]["audit"]["prefix_match"])
        self.assertFalse(catalog["studies"][1]["rows"][0]["strict_correct"])
        self.assertEqual((self.output / audit["root"] / "summary.json").read_bytes(), raw)

    def test_audit_linkage_mutation(self):
        """An untrusted audit claim cannot identify an unrelated source receipt."""
        audit = self.make_audit()
        p = audit / "receipts/baseline_fixture-5/metadata.json"
        meta = module.read(p)
        meta["audit"]["source_receipt"] += "-wrong"
        module.save(p, meta)
        with self.assertRaisesRegex(ValueError, "source receipt"):
            self.capture()

    def test_audit_excluded_pending_mutation(self):
        """An excluded row cannot masquerade as a pending selected rerun."""
        audit = self.make_audit()
        p = audit / "summary.json"
        summary = module.read(p)
        summary["rows"][1]["state"] = "started_unrecorded"
        module.save(p, summary)
        with self.assertRaisesRegex(ValueError, "Excluded"):
            self.capture()

    def test_selected_audit_pending(self):
        """A selected missing receipt stays pending and makes the audit partial."""
        audit = self.make_audit()
        p = audit / "summary.json"
        summary = module.read(p)
        summary["rows"][0]["state"] = "not_run"
        module.save(p, summary)
        shutil.rmtree(audit / "receipts/baseline_fixture-5")
        study = self.capture()["studies"][-1]
        self.assertEqual((study["planned"], study["recorded"], study["status"]), (1, 0, "partial"))
        self.assertIsNone(study["rows"][0]["audit"])

    def test_audit_selection_mutation(self):
        """Selection must exactly match stopped originals rather than cherry-picked calls."""
        audit = self.make_audit()
        p = audit / "plan.json"
        plan = module.read(p)
        plan["audit_calls"].append("caveman_fixture-5")
        module.save(p, plan)
        with self.assertRaisesRegex(ValueError, "loop-stopped set"):
            self.capture()

    def test_retained_snapshot_mutation(self):
        """Verification also catches a corrupt retained snapshot after pointer advances."""
        first = self.capture("first")
        self.capture("second")
        p = self.output / first["studies"][0]["root"] / "summary.json"
        p.write_text(p.read_text() + " ")
        with self.assertRaisesRegex(ValueError, "Retained snapshot hash"):
            module.verify_snapshot(self.output)

    def test_measurement_null_and_invalid(self):
        """Stopped-stream usage stays null and malformed counts never become free calls."""
        self.assertIsNone(module.number(None, "input_tokens", True))
        for invalid in (False, -1, float("nan"), 1.5):
            with self.assertRaises(ValueError):
                module.number(invalid, "input_tokens", True)


if __name__ == "__main__":
    unittest.main()
