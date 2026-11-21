"""The checked-in law must match the printing press."""
from pathlib import Path
import subprocess
import tempfile
ROOT = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as directory:
    output = Path(directory, "book.mjs")
    for charter, book in [('constitution.json', 'statutes.mjs'), ('tests/green-ink/charter.json', 'tests/green-ink/policies.mjs')]:
        subprocess.run(["node", "scripts/charter.mjs", charter, str(output)], cwd=ROOT, check=True)
        assert output.read_bytes() == (ROOT / book).read_bytes(), book
