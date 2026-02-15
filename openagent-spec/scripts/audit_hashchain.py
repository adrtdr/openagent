#!/usr/bin/env python3
"""Verify audit JSONL hash chain integrity.

Each line is a JSON object with prevHash and hash fields.
hash = SHA256(prevHash || canonical_event_without_hash)

Fails fast on mismatch.
"""

import json, hashlib, sys

def canonical_without_hash(evt: dict) -> bytes:
    tmp = {k: evt[k] for k in evt.keys() if k != "hash"}
    s = json.dumps({k: tmp[k] for k in sorted(tmp.keys())}, separators=(",",":"), ensure_ascii=False)
    return s.encode("utf-8")

def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def main(path: str):
    prev = None
    with open(path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            evt = json.loads(line)
            if prev is None:
                prev = evt.get("prevHash")
            if evt.get("prevHash") != prev:
                raise SystemExit(f"Line {i}: prevHash mismatch (expected {prev}, got {evt.get('prevHash')})")
            expected = sha256(prev.encode("utf-8") + canonical_without_hash(evt))
            if evt.get("hash") != expected:
                raise SystemExit(f"Line {i}: hash mismatch (expected {expected}, got {evt.get('hash')})")
            prev = evt["hash"]
    print("OK: hash chain verified")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: audit_hashchain.py <audit.jsonl>", file=sys.stderr)
        raise SystemExit(2)
    main(sys.argv[1])
