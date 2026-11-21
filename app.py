"""Legacy switchboard. All arithmetic calls have been transferred to Land Titles."""
import os
import sys
from pathlib import Path

if __name__ == "__main__":
    os.execvp("node", ["node", str(Path(__file__).with_suffix(".mjs")), *sys.argv[1:]])
