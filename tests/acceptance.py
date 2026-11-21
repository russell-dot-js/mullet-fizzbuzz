"""Independent acceptance office. Run from any working directory with Python 3."""
import concurrent.futures
import json
from xml.etree import ElementTree as ET
from pathlib import Path
import sqlite3
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def run(*args, check=True):
    return subprocess.run(args, cwd=ROOT, capture_output=True, text=True, check=check)


class PublicInquiry(unittest.TestCase):
    def test_land_allotments(self):
        expected = [(("Fizz" if n % 3 == 0 else "") + ("Buzz" if n % 5 == 0 else "")) or str(n)
                    for n in range(1, 107)]
        self.assertEqual(run("node", "app.mjs", "106").stdout.splitlines(), expected)
        case = run("node", "app.mjs", "--case", "15", "--minutes").stdout
        self.assertIn("3200 instruments settled", case)
        self.assertIn("Newline supplied by:", case)
        restated = run("node", "app.mjs", "--case", "15", "--edition", "restated").stdout
        self.assertTrue(restated.endswith("Authorized roadside sign: BuzzFizz\n"))
        self.assertIn("2 licensed hisses", case)
        self.assertIn("200 hearings", case)
        self.assertEqual(case.count("  Roll call: "), 200)
        self.assertTrue(case.endswith("Authorized roadside sign: FizzBuzz\n"))


    def test_printer_concessions_and_insolvency(self):
        def petition(variance, actual):
            envelope = ET.Element("{http://schemas.xmlsoap.org/soap/envelope/}Envelope")
            body = ET.SubElement(envelope, "{http://schemas.xmlsoap.org/soap/envelope/}Body")
            manifest = ET.SubElement(body, "{urn:mullet:stationery}Waybill")
            manifest.text = json.dumps([dict(seal="lot-one", sign="Fizz & <Buzz>",
                prospectus=dict(quarters=[20, 20, 20, actual], forecast=20, variance=variance))])
            return subprocess.run(["python3", "stationery.py"], cwd=ROOT,
                                  input=ET.tostring(envelope), capture_output=True)
        for variance, name in [(-2, "dot matrix"), (2, "thermal subsidiary")]:
            grant, = json.loads(petition(variance, 20 + variance).stdout)
            self.assertIn(name, grant["press"])
            self.assertEqual(grant["lien"], max(0, -variance))
            self.assertEqual(grant["line"], "Fizz & <Buzz>\n")
        self.assertNotEqual(petition(1, 42).returncode, 0)



if __name__ == "__main__":
    unittest.main()
