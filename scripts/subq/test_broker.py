"""Offline tests for the credential and spend boundary; no provider requests."""
import json
from pathlib import Path
import tempfile
import unittest

from broker import CAP_USD, Ledger, RESERVATION, validate, redact, public_response


class BrokerTests(unittest.TestCase):
    def test_decoded_and_encoded_secret_echoes_cannot_leave_broker(self):
        secret = "a" * 40  # Dummy only.
        escaped = '{"extra":"\\u0061' + secret[1:] + '"}'
        decoded = redact(json.loads(escaped), secret)
        self.assertNotIn(secret, json.dumps(decoded))
        # Unknown/encoded strings are not part of the public receipt contract.
        filtered = public_response({"detail": {"message": "YWFh" * 20}})
        self.assertNotIn("YWFh", json.dumps(filtered))

    def test_crashes_and_unknown_calls_stay_reserved_across_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "budget.json"
            ledger = Ledger(path)
            for _ in range(int(CAP_USD / RESERVATION)):
                ledger.reserve("digest")
            with self.assertRaises(ValueError):
                Ledger(path).reserve("one-too-many")
            self.assertLessEqual(Ledger(path).snapshot()["unresolved_reserve_usd"], CAP_USD)

    def test_malformed_usage_never_releases_reservation(self):
        with tempfile.TemporaryDirectory() as directory:
            ledger = Ledger(Path(directory) / "budget.json")
            for body in [{"usage": None}, {"usage": []}, {"usage": {"input_tokens": -1}},
                         {"usage": {"input_tokens": True}}, {"usage": {"input_tokens": 9999999}}]:
                entry = ledger.reserve("digest")
                ledger.settle(entry, 200, body)
                self.assertNotIn("estimated_usd", entry)

    def test_known_usage_reconciles_but_provider_error_stays_reserved(self):
        with tempfile.TemporaryDirectory() as directory:
            ledger = Ledger(Path(directory) / "budget.json")
            entry = ledger.reserve("digest")
            ledger.settle(entry, 200, {"usage": {"input_tokens": 1080}})
            self.assertAlmostEqual(ledger.snapshot()["estimated_known_usd"], 0.000054)
            ledger.settle(ledger.reserve("error"), 520, {"usage": {"input_tokens": 0}})
            self.assertAlmostEqual(ledger.snapshot()["unresolved_reserve_usd"], RESERVATION)

    def test_worker_cannot_choose_model_url_or_unbounded_menu(self):
        valid = {"model": "subq-snap-preview", "state": {}, "questions": {
            "pick": {"type": "choice", "instructions": "Pick", "criteria": {"a": "A", "b": "B"}}}}
        validate(valid)
        for field, value in [("url", "https://example.com"), ("tools", [])]:
            with self.assertRaises(ValueError):
                validate({**valid, field: value})
        with self.assertRaises(ValueError):
            validate({**valid, "model": "subq-preview"})
        invalid = json.loads(json.dumps(valid))
        invalid["questions"]["pick"]["criteria"] = {str(i): None for i in range(256)}
        with self.assertRaises(ValueError):
            validate(invalid)


if __name__ == "__main__":
    unittest.main()
