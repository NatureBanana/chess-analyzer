#!/usr/bin/env python3
"""Regenerate src/data/openings.js from lichess TSV files."""
import os, json, re, urllib.request

SCRIPT_DIR = os.path.dirname(__file__)
TSV_DIR = SCRIPT_DIR
OUT_DIR = os.path.join(SCRIPT_DIR, "..", "src", "data")
BASE = "https://raw.githubusercontent.com/lichess-org/chess-openings/master"

def norm_moves(pgn):
    pgn = re.sub(r"\d+\.\.\.", "", pgn)
    pgn = re.sub(r"\d+\.", "", pgn)
    pgn = re.sub(r"\{[^}]*\}", "", pgn)
    pgn = re.sub(r"\([^)]*\)", "", pgn)
    pgn = re.sub(r"[!?+#=]+", "", pgn)
    moves = []
    for m in pgn.split():
        if not m or m in ("1-0", "0-1", "1/2-1/2", "*"):
            continue
        m = m.replace("0-0-0", "O-O-O").replace("0-0", "O-O")
        moves.append(m)
    return " ".join(moves).strip()

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    eco_by_code = {}
    move_entries = []

    for letter in "abcde":
        url = f"{BASE}/{letter}.tsv"
        path = os.path.join(TSV_DIR, f"{letter}.tsv")
        print(f"Fetching {url}...")
        urllib.request.urlretrieve(url, path)
        with open(path) as f:
            lines = f.read().strip().split("\n")[1:]
        for line in lines:
            parts = line.split("\t", 2)
            if len(parts) < 3:
                continue
            eco, name, pgn = parts[0].strip(), parts[1].strip(), parts[2].strip()
            if not eco or not name:
                continue
            if eco not in eco_by_code:
                eco_by_code[eco] = name
            moves = norm_moves(pgn)
            if moves:
                move_entries.append([moves, eco, name, len(moves.split())])

    move_entries.sort(key=lambda x: -x[3])
    seen = set()
    deduped = []
    for e in move_entries:
        if e[0] in seen:
            continue
        seen.add(e[0])
        deduped.append(e)

    out = os.path.join(OUT_DIR, "openings.js")
    with open(out, "w") as f:
        f.write("// Auto-generated from lichess-org/chess-openings TSV files\n")
        f.write("export const ECO_BY_CODE = ")
        json.dump(eco_by_code, f, separators=(",", ":"))
        f.write(";\n\n")
        f.write("export const MOVE_BOOK = ")
        json.dump([[e[0], e[1], e[2]] for e in deduped], f, separators=(",", ":"))
        f.write(";\n")

    print(f"Wrote {out} — {len(eco_by_code)} ECO codes, {len(deduped)} move entries")

if __name__ == "__main__":
    main()
