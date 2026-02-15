#!/usr/bin/env python3
"""Canonicalize tool call JSON for hashing/approval binding.

This is a reference utility; the implementation language can differ.
"""

import json
import sys

def canonical(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def main():
    data = json.load(sys.stdin)
    sys.stdout.write(canonical(data))

if __name__ == "__main__":
    main()
