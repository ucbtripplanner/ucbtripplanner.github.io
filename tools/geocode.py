#!/usr/bin/env python3
"""Look up [lat, lng] for a place name (OpenStreetMap Nominatim; ~1 request/second).

  python3 tools/geocode.py "Yosemite View Lodge" "Happy Burger Diner, Mariposa"

Prints  [lat, lng]  ← matched name [category/type]  for each query → paste into data.js as  ll: [lat, lng].
ALWAYS check the matched name: Nominatim sometimes returns a nearby road or a different place
(e.g. "Tenaya Lodge" matched "Tenaya Way" in the Valley). Add the town/state to the query if unsure,
or use --any to search outside the default Yosemite/Bay Area box.
"""
import json
import sys
import time
import urllib.parse
import urllib.request

UA = {"User-Agent": "ucbtripplanner-site/1.0 (https://ucbtripplanner.github.io)"}
BOX = "-122.6,38.4,-118.9,37.0"  # Bay Area → Yosemite region


def main(args):
    bounded = "--any" not in args
    for q in [a for a in args if a != "--any"]:
        params = {"q": q, "format": "jsonv2", "limit": 3}
        if bounded:
            params.update(viewbox=BOX, bounded=1)
        url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(params)
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))
        except Exception as e:  # noqa: BLE001
            print(f"{q}: ERROR {e}")
            d = None
        if d:
            for r in d[:2]:
                print(f'[{round(float(r["lat"]), 5)}, {round(float(r["lon"]), 5)}]  ← {r.get("display_name", "")[:95]}  [{r.get("category")}/{r.get("type")}]   ({q})')
        elif d is not None:
            print(f"{q}: not found")
        time.sleep(1.1)


if __name__ == "__main__":
    main(sys.argv[1:]) if len(sys.argv) > 1 else print(__doc__)
