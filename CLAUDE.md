# UCB Trip Planner — guide for AI agents (Claude Code, etc.)

Public trip-planning site for a group of friends, served by GitHub Pages at
**https://ucbtripplanner.github.io** from the `main` branch of `ucbtripplanner/ucbtripplanner.github.io`.
UI language is **Korean** (casual, friendly "~해요" tone). Talk to the user in the language they use.

Trips (same dates — **Thu 11/26 – Sat 11/28/2026, fixed** — same group of 3 (+ maybe 1), driving from Berkeley).
**Active shortlist (since 11/11): two candidates.**
- **`2026-yosemite/`** (후보 A) — first-timers, Yosemite Valley: "하이킹은 하루 1개, 나머지는 구경" (120 in, 140 out).
- **`2026-monterey/`** (후보 B) — Monterey Bay Aquarium, Moss Landing otters, Asilomar, Point Lobos + Big Sur day, 17-Mile, Carmel.

**Archived (접어둔 후보, 11/11)** — `2026-la/`, `2026-mendocino/`, `2026-napa/`, `2026-sonoma-coast/`. Pages still work but show a
"접어둔 후보" banner (`archived: { date, reason }` in their data.js); the hub lists them in a collapsed toggle
(`HUB.trips[i].archived`) and leaves them out of the comparison table and the offline precache. Don't spend effort on them unless asked.

**Group tastes (apply to every plan):** no seafood-centric meals (esp. oysters) · no redwood/sequoia groves (already seen, boring) ·
wineries are not a draw · no museums, galleries, history tours, missions, architecture sightseeing. They like nature/scenery, wildlife
(the aquarium is OK), golden-hour views, fun activities, non-seafood food (Korean welcome), ≤ one moderate hike per day.
Disliked things may appear only as an `alts` option or rain fallback, never as a default slot or featured pick.

The hub (`index.html`) shows the active trips as cards + a side-by-side "한눈에 비교" table (`HUB.trips[i].compare`).

Each trip folder is self-contained; replace `2026-yosemite` with the trip you're editing in the paths below.

## How the site works (read this first)

- **All content of a trip lives in one file: `<trip>/data.js`** (`window.TRIP = {…}`). Edit that, nothing else, for content changes.
- `assets/trip.js` renders every page client-side from `data.js` (Notion-style: cover, properties, callouts, toggles,
  gallery/table "databases", side-peek detail panel, Leaflet map, weather, GitHub "recent changes" feed).
- `assets/style.css` — light theme by default (the users asked for bright & readable), dark via the 🌙 toggle.
- Page HTML files (`2026-yosemite/index.html`, `course/`, `places/`, `stay/`, `food/`, `prep/`) are thin shells
  **generated** by `node tools/gen_pages.mjs` — never hand-edit them.
- `images.js` is **generated** from `images.json`; `geo.js` is **generated** from `routes.json` (see tools below).
- `sw.js` (root) = offline cache (Yosemite Valley has almost no signal). Bump `VERSION` only if you change caching rules.
- Field reference for `data.js`: **`docs/DATA.md`**.

```
index.html              hub (trip list + inline cover images; add new trips here)
assets/style.css, trip.js
sw.js                   service worker (offline)
2026-*/ (yosemite, la, mendocino, napa, sonoma-coast, monterey — same layout)
  data.js               ✏️ THE content file
  images.json → images.js    photo registry (generated)
  routes.json → geo.js       map driving routes (generated)
  index.html, course/ … prep/  generated page shells
  research/             sourced research notes (2026-11-07) + OPEN_QUESTIONS.md
tools/                  helper scripts (below)
docs/DATA.md            data.js schema
.claude/skills/         task recipes (add an item, re-verify facts, …)
```

## Workflow for any change

1. Edit `2026-yosemite/data.js` (keep the existing style; Korean text; `**bold**` and `[label](url)` / `[label](/internal/path)` work inside strings).
2. **Validate:** `node tools/check_data.mjs <trip>` (e.g. `2026-la`; default `2026-yosemite`) — must print `✓ OK`.
3. **Preview:** `python3 tools/serve.py` → http://127.0.0.1:8765/2026-yosemite/  
   Visual check: `tools/screenshot.sh /2026-yosemite/stay/ [desktop|mobile] /tmp/x.png`, then look at the PNG.
   - ⚠️ Use `tools/serve.py`, not `python3 -m http.server`: the plain server makes Chrome *download* `.md` files into
     `~/Downloads` (this happened once — don't point headless Chrome at `.md` URLs).
4. If you changed a page title/desc/cover or `pageOrder`: `node tools/gen_pages.mjs`.
5. Commit with a clear message (it shows on the home page "최근 변경" feed) and push to `main`. The site updates in ~1–2 min.
   Only commit/push when the user asks you to.

## Common requests → what to change

| Request | Change in `data.js` |
|---|---|
| "숙소 X 예약했어" | `stays[id].status = 'booked'`; home `props` 숙소 row → `tags: [['예약 완료','green']], value: 'X'`; `stages` 숙소 예약 → `'done'`; tick the `todo` |
| "X 좋아요 / 찜" | add the member id to `votes: ['mk', …]` on that item (or on a decision `options[i].votes`) |
| "할 일 끝났어" | `todo[i].done = true` |
| "결정했어" | `decisions[i].done = true`, `status: ['확정','green']`, mark the chosen option `pick: true` |
| add a place/stay/restaurant | see `.claude/skills/add-item/SKILL.md` (photo via `tools/find_photo.py`, pin via `tools/geocode.py`) |
| change the itinerary | `courses[0].days[d].items` — `{ time, ref: 'place:id' \| 'food:id', title?, note?, tag?, alts?: [{ref\|title, note}] }` |
| "출발 전에 다시 확인해줘" | `.claude/skills/verify-facts/SKILL.md` + `2026-yosemite/research/OPEN_QUESTIONS.md` |

Member ids: `mk` Minseo Kim · `ms` Minhyuk Seo · `jp` Jongseok Park · `plus` (+α, undecided).

## Content rules (important — the site is public and people act on it)

- **Facts must be sourced.** Prices, hours, closures, rules: link the official page (nps.gov, travelyosemite.com, the business).
  Mark anything unconfirmed as `미확인`; never invent numbers. Prices are snapshots — say the date (e.g. "11/7 기준").
- **Entrance passes:** eligibility for Resident passes is by **status** (US citizen / permanent resident), *not* by which ID
  card someone holds. Never suggest an F-1/J-1 visa holder buy a Resident pass using a state driver's license.
  When unsure → Non-Resident pass ($250) or ask the ranger at the gate. Keep this framing.
- **No private info**: no confirmation numbers, phone numbers of members, payment details, addresses of members.
- **Keep it focused.** The users explicitly prefer a short curated list over many options:
  - shortlist items use `featured: <order>` (stays, food) — everything else is auto-collapsed under "더 보기";
  - places shown first are exactly the ones referenced by the course, in itinerary order;
  - add alternatives as `alts` on a course slot rather than as new top-level options.
- Photos: prefer Wikimedia Commons (license is fetched + credited automatically). Official-site images only as link
  previews for lodging/restaurants, credited "공식 사이트 이미지". No logos.
- Yosemite Valley roads are one-way: **Southside Dr = eastbound, Northside Dr = westbound** (an earlier draft got this wrong).
- LA: Thanksgiving Day closes most museums (Griffith building, The Broad, Getty, LACMA…) — always re-check day-specific hours;
  car break-ins are the #1 visitor risk (nothing visible in the car; unload at the hotel). Per-trip wording lives in
  `labels`, the map's zoom button in `mapFocus`, the weather heading in `weather.title`.

## Tools (`tools/`, Python stdlib / Node only)

| Command | What it does |
|---|---|
| `node tools/check_data.mjs [trip]` | validate data.js (run after every edit) |
| `node tools/gen_pages.mjs [trip]` | regenerate page HTML shells (titles, og:image link previews) |
| `python3 tools/build_images.py [trip]` | images.json → images.js (fetches Commons author/license + thumbnail URLs) |
| `python3 tools/build_routes.py [trip]` | routes.json → geo.js (OSRM road geometry, simplified) |
| `python3 tools/find_photo.py "query"` / `--og URL` | search Commons photos / get a site's og:image |
| `python3 tools/geocode.py "name, town"` | [lat, lng] from OpenStreetMap — **check the matched name** |
| `python3 tools/serve.py [port]` | local preview server (safe for .md) |
| `tools/screenshot.sh PATH [desktop\|mobile] OUT.png` | headless-Chrome screenshot (mobile = 390px via `tools/mobile.html`) |

## Adding a new trip

Copy `2026-yosemite/` to e.g. `2027-tahoe/`, rewrite `data.js` (`id`, `base: '/2027-tahoe/'`, `labels`, `mapFocus`,
pages, content), `images.json`, `routes.json`; run `build_images.py`, `build_routes.py`, `gen_pages.mjs`, `check_data.mjs`
(each with the trip folder as argument); add a card to `window.HUB.trips` in the root `index.html` (cover as an inline image
object); add the new pages to `PRECACHE` in `sw.js` and bump `VERSION`. The 2026-la trip was built this way:
research agents → itinerary judge → section writers (`_build/` fragments → `python3 tools/assemble_build.py <trip>`) →
adversarial fact-check → fixer (see `<trip>/research/README.md`). The four trips added on 11/10–11 used one workflow for all of it.

## Repo access

Owner account: `ucbtripplanner`. Members push as collaborators (e.g. `minseo25`). Collaborators can't change repo
Settings (e.g. GitHub Pages) — the owner account has to do that.
