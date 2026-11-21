"""Check the real JVM mint against its engraving and an independent UTF-16 oracle."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MINT = ROOT / "mint"


def audit():
    sheet = (MINT / "serial.jasm").read_text().splitlines()
    expected = ["iload_0"]
    for tooth in range(1, 9001):
        expected.extend(("bipush 31", "imul", f"sipush {tooth}", "iadd"))
    expected.append("ireturn")
    if sheet != expected:
        raise ValueError("The mint's dies disagree with the approved engraving")

    # Independent rolling-hash oracle. Java strings are sequences of UTF-16 units.
    seals = ["", "FizzBuzz", "buy milk", "✓", "🪙"]
    stamps = []
    for seal in seals:
        value = 0
        encoded = seal.encode("utf-16-be")
        for i in range(0, len(encoded), 2):
            value = (31 * value + int.from_bytes(encoded[i:i+2], "big")) & 0xffffffff
        for tooth in range(1, 9001):
            value = (31 * value + tooth) & 0xffffffff
        stamps.append(format(value, "x"))
    actual = subprocess.check_output(["java", str(MINT / "Mint.java"), str(MINT / "serial.jasm")],
                                     input="\n".join(seals) + "\n", text=True)
    if actual.splitlines() != stamps:
        raise ValueError("JVM returned a counterfeit printing")


if __name__ == "__main__":
    audit()
