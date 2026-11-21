"""Reproduce the Mint's straight-line JVM instruction sheet."""
from pathlib import Path

def engraving():
    yield "iload_0"
    for tooth in range(1, 9001):
        yield "bipush 31"
        yield "imul"
        yield f"sipush {tooth}"
        yield "iadd"
    yield "ireturn"

if __name__ == "__main__":
    Path(__file__).with_name("serial.jasm").write_text("\n".join(engraving()) + "\n")
