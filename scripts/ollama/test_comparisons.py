"""Offline mutation tests for the provenance chain joining treatment receipts."""
import base64
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock


SPEC = importlib.util.spec_from_file_location("ollama_comparisons", Path(__file__).with_name("comparisons.py"))
comparisons = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(comparisons)


class ComparisonTests(unittest.TestCase):
    """Reject unsupported pairings even when altered files remain valid JSON."""

    def setUp(self):
        """Create a complete synthetic pilot without copying production receipts."""
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        (self.root / "images").mkdir()
        self.model = "fixture-qwen:4b"
        self.digest = "d" * 64
        self.template = "Solve {{BOARD_ID}}, size {{SIZE}}. Return JSON."
        self.system = "Fixture terse instruction."
        (self.root / "prompt-template.txt").write_text(self.template, encoding="utf-8")
        (self.root / "caveman-system.txt").write_text(self.system, encoding="utf-8")
        self.save("skill.json", {"system_sha256": comparisons.sha256(self.system.encode())})
        self.configuration = {
            "model": self.model, "stream": False, "think": True,
            "options": {"num_predict": 12288, "temperature": 0, "seed": 20261028, "num_ctx": 32768},
            "keep_alive": "10m",
        }
        boards = []
        for size in (5, 7, 9):
            for index in range(4):
                board_id = f"fixture-{size}-{index}"
                image = f"images/{board_id}.png"
                image_bytes = b"synthetic image bytes"
                (self.root / image).write_bytes(image_bytes)
                board = {"id": board_id, "size": size, "image": image,
                         "image_sha256": comparisons.sha256(image_bytes)}
                boards.append(board)
                user = {"role": "user", "content": self.template.replace("{{BOARD_ID}}", board_id).replace("{{SIZE}}", str(size)),
                        "images": [base64.b64encode(image_bytes).decode()]}
                for arm in comparisons.ARMS:
                    call_id = f"{arm}_{board_id}"
                    directory = f"receipts/{call_id}"
                    messages = [user] if arm == "baseline" else [{"role": "system", "content": self.system}, user]
                    request = {**self.configuration, "messages": messages}
                    response = {"model": self.model, "done": True, "done_reason": "stop", "message": {"content": "{}"}}
                    metadata = {"call_id": call_id, "board_id": board_id, "size": size, "treatment": arm,
                                "model": self.model, "returned_model": self.model, "model_digest": self.digest,
                                "done": True, "http_status": 200, "image_sha256": board["image_sha256"],
                                "request_sha256": comparisons.sha256(comparisons.canonical_json(request)),
                                "response_sha256": comparisons.sha256(comparisons.canonical_json(response))}
                    for name, value in {"request": request, "response": response, "metadata": metadata,
                                        "grade": {}, "diagnostic": {}, "started": {"started_utc": "fixture"}}.items():
                        self.save(f"{directory}/{name}.json", value)
        self.save("plan.json", {
            "study": "fixture-paired-pilot", "boards": boards,
            "runtime": {"model": self.model, "digest": self.digest},
            "prompt_template_sha256": comparisons.sha256(self.template.encode()),
            "protocol": {"modality": "image", "one_shot": True, "tools": False, "retries": 0,
                         "structured_output_enforcement": False, "think": True, **self.configuration["options"]},
        })

    def save(self, relative_path, value):
        """Save a synthetic JSON fixture with normal human-readable formatting."""
        path = self.root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")

    def mutate(self, arm, kind, edit, refresh_hash=False):
        """Alter one call, optionally updating its metadata hash to test deeper guards."""
        directory = f"receipts/{arm}_fixture-5-0"
        relative = f"{directory}/{kind}.json"
        value = comparisons.read_json(self.root / relative)
        edit(value)
        self.save(relative, value)
        if refresh_hash:
            metadata_path = f"{directory}/metadata.json"
            metadata = comparisons.read_json(self.root / metadata_path)
            metadata[f"{kind}_sha256"] = comparisons.sha256(comparisons.canonical_json(value))
            self.save(metadata_path, metadata)

    def test_complete_pairs_are_deterministic_and_hashes_are_linked(self):
        """A valid manifest joins all calls and shares one proven requested configuration."""
        manifest = comparisons.build_manifest(self.root)
        self.assertEqual(manifest, comparisons.build_manifest(self.root))
        self.assertEqual(manifest["configuration"], self.configuration)
        self.assertEqual(manifest["configuration_sha256"], comparisons.sha256(comparisons.canonical_json(self.configuration)))
        self.assertEqual(manifest["plan_sha256"], comparisons.sha256((self.root / "plan.json").read_bytes()))
        self.assertEqual(manifest["system_sha256"], comparisons.sha256(self.system.encode()))
        self.assertEqual(len(manifest["pairs"]), 12)
        for pair in manifest["pairs"]:
            self.assertTrue(all(pair["checks"].values()))
            self.assertEqual(pair["configuration_sha256"], manifest["configuration_sha256"])
            self.assertNotEqual(pair["baseline"]["request_sha256"], pair["caveman"]["request_sha256"])

    def test_equal_but_wrong_configuration_is_rejected_against_plan(self):
        """Pairwise equality cannot conceal controls that differ from the frozen plan."""
        for arm in comparisons.ARMS:
            self.mutate(arm, "request", lambda request: request["options"].update(num_ctx=16384), refresh_hash=True)
        with self.assertRaisesRegex(ValueError, "configuration differs"):
            comparisons.build_manifest(self.root)

    def test_extra_request_fields_are_rejected(self):
        """Unlisted decoding options cannot hide outside the compared configuration."""
        self.mutate("caveman", "request", lambda request: request.update(format="json"), refresh_hash=True)
        with self.assertRaisesRegex(ValueError, "configuration differs"):
            comparisons.build_manifest(self.root)

    def test_boolean_controls_are_not_equal_to_integer_lookalikes(self):
        """Python's True == 1 behavior must not weaken exact JSON comparisons."""
        self.mutate("caveman", "request", lambda request: request.update(think=1), refresh_hash=True)
        with self.assertRaisesRegex(ValueError, "configuration differs"):
            comparisons.build_manifest(self.root)

    def test_equal_but_wrong_user_message_is_rejected_against_template(self):
        """Both arms changing a prompt must fail even if their new hashes agree."""
        for arm in comparisons.ARMS:
            self.mutate(arm, "request", lambda request: request["messages"][-1].update(content="Changed task"), refresh_hash=True)
        with self.assertRaisesRegex(ValueError, "messages differ"):
            comparisons.build_manifest(self.root)

    def test_changed_system_message_is_rejected_even_with_updated_request_hash(self):
        """The Caveman body must remain the exact reviewed system artifact."""
        self.mutate("caveman", "request", lambda request: request["messages"][0].update(content="Other skill"), refresh_hash=True)
        with self.assertRaisesRegex(ValueError, "messages differ"):
            comparisons.build_manifest(self.root)

    def test_model_identity_is_checked_in_metadata_and_response(self):
        """Equal changed digests and a mismatched returned model cannot be paired."""
        for arm in comparisons.ARMS:
            self.mutate(arm, "metadata", lambda metadata: metadata.update(model_digest="a" * 64))
        with self.assertRaisesRegex(ValueError, "model_digest"):
            comparisons.build_manifest(self.root)
        for arm in comparisons.ARMS:
            self.mutate(arm, "metadata", lambda metadata: metadata.update(model_digest=self.digest))
        self.mutate("caveman", "response", lambda response: response.update(model="different-model"), refresh_hash=True)
        with self.assertRaisesRegex(ValueError, "frozen model"):
            comparisons.build_manifest(self.root)

    def test_saved_hash_tampering_is_rejected(self):
        """A matching task is insufficient when its raw receipt hash was altered."""
        for key in ("request_sha256", "response_sha256"):
            with self.subTest(hash_field=key):
                original = comparisons.read_json(self.root / "receipts/baseline_fixture-5-0/metadata.json")
                self.mutate("baseline", "metadata", lambda metadata: metadata.update({key: "0" * 64}))
                with self.assertRaisesRegex(ValueError, "hash mismatch"):
                    comparisons.build_manifest(self.root)
                self.save("receipts/baseline_fixture-5-0/metadata.json", original)

    def test_response_tampering_is_rejected_without_trusting_unchanged_metadata(self):
        """The saved server payload must still match the original response hash."""
        self.mutate("baseline", "response", lambda response: response["message"].update(content="changed final answer"))
        with self.assertRaisesRegex(ValueError, "Response hash mismatch"):
            comparisons.build_manifest(self.root)

    def test_incomplete_and_unexpected_receipts_are_rejected(self):
        """The manifest cannot silently publish a subset or ignore an extra call."""
        path = self.root / "receipts/caveman_fixture-9-3/response.json"
        old = path.read_bytes()
        path.unlink()
        with self.assertRaisesRegex(ValueError, "Incomplete receipt"):
            comparisons.build_manifest(self.root)
        path.write_bytes(old)
        (self.root / "receipts/extra_call").mkdir()
        with self.assertRaisesRegex(ValueError, "extra receipt"):
            comparisons.build_manifest(self.root)

    def test_duplicate_frozen_boards_are_rejected(self):
        """Duplicated board IDs cannot produce apparently complete pair counts."""
        plan = comparisons.read_json(self.root / "plan.json")
        plan["boards"][1]["id"] = plan["boards"][0]["id"]
        self.save("plan.json", plan)
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            comparisons.build_manifest(self.root)

    def test_changed_image_or_system_artifact_is_rejected(self):
        """The actual saved bytes must still match their frozen hashes."""
        image = self.root / "images/fixture-5-0.png"
        original = image.read_bytes()
        image.write_bytes(b"modified image")
        with self.assertRaisesRegex(ValueError, "image hash mismatch"):
            comparisons.build_manifest(self.root)
        image.write_bytes(original)
        (self.root / "caveman-system.txt").write_text("modified skill", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "system hash mismatch"):
            comparisons.build_manifest(self.root)

    def test_verify_is_read_only_and_rejects_stale_manifest(self):
        """Verification never rewrites evidence and rejects an altered link index."""
        with contextlib.redirect_stdout(io.StringIO()):
            comparisons.main(["--evidence-dir", str(self.root)])
        with mock.patch.object(Path, "write_text", side_effect=AssertionError("Unexpected write")), contextlib.redirect_stdout(io.StringIO()):
            comparisons.main(["--evidence-dir", str(self.root), "--verify"])
        manifest = comparisons.read_json(self.root / "comparisons.json")
        manifest["pairs"][0]["baseline"]["request_sha256"] = "0" * 64
        self.save("comparisons.json", manifest)
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as error:
            comparisons.main(["--evidence-dir", str(self.root), "--verify"])
        self.assertEqual(error.exception.code, 1)


if __name__ == "__main__":
    unittest.main()
