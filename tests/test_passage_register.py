"""Losslessness and frozen-input checks for the October consolidation."""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("register", ROOT / "scripts/consolidate-passages.py")
register = importlib.util.module_from_spec(spec)
spec.loader.exec_module(register)


class PassageRegisterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = register.build()
        cls.audit = register.read("research/passages/audit-34.json")
        cls.variants = {v["alias"]: v["record"] for r in cls.data["records"] for v in r["variants"]}

    def test_every_catalogue_record_survives_with_all_fields(self):
        for p in register.read("data/passages.json")["passages"]:
            self.assertEqual(p, self.variants[p["id"]])

    def test_every_frozen_pool_record_survives_with_local_identity(self):
        for pool in register.read("research/keys/pools.json"):
            for p in pool["passages"]:
                self.assertEqual(p, self.variants[f"pool:{pool['question']}:{p['id']}"])

    def test_merge_does_not_conflate_works_or_different_readings(self):
        for r in self.data["records"]:
            for v in r["variants"]:
                p = v["record"]
                self.assertEqual(r["id"], self.data["aliases"][v["alias"]])
                self.assertEqual(r["work"], register.WORK_ALIASES.get(p["work"], p["work"]))
                self.assertEqual(r["readingText"], register.normalized(register.reading_text(p)))
        for pair in self.data["possibleOverlaps"]:
            self.assertNotEqual(pair["left"], pair["right"])

    def test_pilot_inputs_unchanged_since_audit_started(self):
        for path, digest in self.audit["frozenInputs"].items():
            self.assertEqual(digest, register.digest(path), path)

    def test_audit_covers_exactly_the_nonpilot_records(self):
        pilot = {"Q01", "Q08", "Q18", "Q23", "Q30", "Q39"}
        questions = {q["id"] for q in register.read("data/questions.json")["questions"]}
        self.assertEqual(questions - pilot, {q["question"] for q in self.audit["questions"]})
        expected = {p["id"] for p in register.read("data/passages.json")["passages"] if set(p["questions"]) - pilot}
        self.assertEqual(expected, {p["passage"] for p in self.audit["passages"]})
        for p in self.audit["passages"]:
            self.assertTrue(set(p["questions"]).isdisjoint(pilot))
        for path, digest in self.audit["inputs"].items():
            self.assertEqual(digest, register.digest(path), "Audit needs refreshing: " + path)

    def test_saved_register_matches_rebuild(self):
        self.assertEqual(self.data, register.read("data/passage-register.json"))

    def test_description_revision_preserves_existing_passage_content(self):
        revision = register.read("research/passages/four-question-revision.json")
        current = {p["id"]: p for p in register.read("data/passages.json")["passages"]}
        for change in revision["descriptionCorrections"]:
            previous = change["previous"]["passage"]
            for key, value in previous.items():
                if key not in ("notes", "summaryCheck"):
                    self.assertEqual(value, current[previous["id"]][key], (previous["id"], key))
            self.assertEqual(change["description"], current[previous["id"]]["notes"])
        for addition in revision["additions"]:
            p = current[addition["passage"]]
            self.assertEqual(p["questions"], [addition["question"]])
            self.assertEqual(p["source"]["sha256"], register.digest(p["source"]["file"]))


    def test_final_revision_preserves_reserve_text_and_checks_new_sources(self):
        revision = register.read("research/passages/four-question-revision.json")["finalImprovement"]
        current = {p["id"]: p for p in register.read("data/passages.json")["passages"]}
        self.assertEqual(11, len(revision["reserves"]))
        for reserve in revision["reserves"]:
            pid = reserve["passage"]
            self.assertEqual("reserve", current[pid]["selectionStatus"])
            for key, value in revision["before"][pid].items():
                self.assertEqual(value, current[pid][key], (pid, key))
        for addition in revision["additions"]:
            p = current[addition["passage"]]
            self.assertEqual(p["source"]["sha256"], register.digest(p["source"]["file"]))
            if p.get("excerptScope") == "brief":
                self.assertFalse(p["sortingReady"])
        restored = current["q02-quevedo-essays-automatics"]
        self.assertIn("Ciertamente", restored["original"])
        self.assertIn("Certainly", restored["translation"])
        self.assertNotIn("[…]", restored["translation"])


if __name__ == "__main__":
    unittest.main()
