---
name: add-item
description: Add a place, lodging, restaurant/store, or Thanksgiving option to the trip site (data.js) with a licensed photo, a correct map pin, and sourced facts. Use when someone says "X 추가해줘", "이 식당/숙소/장소도 넣어줘", or pastes a link to add.
---

# Add an item to the trip site

Work in the trip folder the user means (`2026-yosemite/` or `2026-la/`; ask if unclear). Content goes **only** in `data.js`.

1. **Research the facts** from the official source (business site, nps.gov, travelyosemite.com). Note price, hours
   *for late November*, reservation method, closures. Anything you can't confirm → write `미확인`. Put the date on
   prices ("11/7 기준"). Never invent numbers.
2. **Pin:** `python3 tools/geocode.py "Name, Town"` (add `--any` outside the Bay Area–Yosemite box, e.g. for LA) → use `[lat, lng]` only if the matched name is really that place
   (Nominatim sometimes returns a nearby road). If unsure, omit `ll` and set `mapq: 'Name Town CA'` instead.
3. **Photo:**
   - `python3 tools/find_photo.py "name or landmark"` → pick a landscape, CC/PD Commons file →
     add `"key": {"file": "…", "title": "…"}` to `<trip>/images.json` → `python3 tools/build_images.py <trip>`.
   - Lodging/restaurant with no Commons photo: `python3 tools/find_photo.py --og https://their-site/` → add
     `{"src": "https://wsrv.nl/?url=<host/path>&w=960&output=jpg&q=78", "credit": "공식 사이트 이미지",
     "license": "링크 미리보기", "page": "<site>", "title": "…"}`. Skip logos; no photo is fine (emoji placeholder).
4. **Write the entry** in the right array (`places`, `stays`, `food.items`, or `food.thanksgiving`) following
   `docs/DATA.md` and the neighbouring entries' style (Korean, short `summary`, `pros`/`cons`, `links`).
   - New items are **not** `featured` by default → they appear under "더 보기". Only make it featured (or add it to the
     course) if the user wants it in the main plan — the group prefers a short shortlist.
   - Places appear in the main list only if the course references them (`ref: 'place:<id>'`).
5. `node tools/check_data.mjs <trip>` → must be `✓ OK`.
6. Preview (`python3 tools/serve.py`, `tools/screenshot.sh /2026-yosemite/<page>/ desktop /tmp/x.png`) and look at it.
7. Tell the user what you added and what's unverified. Commit/push only if asked
   (message like `Add <name> to <page>` — it shows in the site's "최근 변경" feed).
