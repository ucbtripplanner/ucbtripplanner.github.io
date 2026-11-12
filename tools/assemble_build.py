#!/usr/bin/env python3
"""Assemble a new trip's data.js from section fragments written by build agents.

Usage: python3 tools/assemble_build.py <trip-folder>

Reads <trip>/_build/{head,course,places,stays,food,prep}.js (each a sequence of top-level object properties;
head.js starts with the header comment and "window.TRIP = {"), writes <trip>/data.js, and merges every
<trip>/_build/images-*.json into <trip>/images.json. Then run:
  python3 tools/build_images.py <trip> && python3 tools/build_routes.py <trip> \\
    && node tools/gen_pages.mjs <trip> && node tools/check_data.mjs <trip>
Only for bootstrapping a trip — after that, data.js is the source of truth (don't re-assemble over edits).
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = ["head.js", "course.js", "places.js", "stays.js", "food.js", "prep.js"]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    trip = os.path.join(ROOT, sys.argv[1])
    b = os.path.join(trip, "_build")
    missing = [p for p in PARTS if not os.path.exists(os.path.join(b, p))]
    if missing:
        sys.exit(f"missing fragments: {missing}")
    chunks = []
    for p in PARTS:
        t = open(os.path.join(b, p), encoding="utf-8").read().rstrip()
        if p != "head.js":
            t = re.sub(r"^\s*window\.TRIP\s*=\s*\{", "", t)
        t = re.sub(r"\n\};\s*$", "", t)
        if not t.rstrip().endswith(","):
            t = t.rstrip() + ","
        chunks.append(t + "\n")
    data = "\n".join(chunks).rstrip().rstrip(",") + "\n};\n"
    if os.path.exists(os.path.join(trip, "data.js")) and "--force" not in sys.argv:
        sys.exit("data.js already exists — refusing to overwrite (pass --force if you really mean it)")
    open(os.path.join(trip, "data.js"), "w", encoding="utf-8").write(data)
    imgs = {}
    for f in sorted(os.listdir(b)):
        if f.startswith("images-") and f.endswith(".json"):
            d = json.load(open(os.path.join(b, f), encoding="utf-8"))
            dup = set(d) & set(imgs)
            if dup:
                print("⚠ duplicate image keys from", f, sorted(dup))
            imgs.update(d)
    json.dump(imgs, open(os.path.join(trip, "images.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{sys.argv[1]}: data.js {len(data)} chars · images.json {len(imgs)} entries")


if __name__ == "__main__":
    main()
