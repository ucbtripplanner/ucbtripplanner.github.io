# `data.js` field reference

Each trip folder has `data.js` that sets `window.TRIP = { … }`. `assets/trip.js` reads it and renders every page.
Text fields accept a tiny markup: `**bold**`, `` `code` ``, `[label](https://…)` (opens a new tab), `[label](/internal/path)`.
After editing run `node tools/check_data.mjs`.

## Top level

| Field | Example | Notes |
|---|---|---|
| `id` | `'2026-yosemite'` | folder name; also the localStorage namespace |
| `base` | `'/2026-yosemite/'` | URL prefix, leading + trailing slash |
| `repo`, `dataPath` | `'ucbtripplanner/ucbtripplanner.github.io'`, `'2026-yosemite/data.js'` | ✏️ edit button + "최근 변경" feed |
| `title`, `short`, `icon` | `'Thanksgiving 2026 · Yosemite'`, `'2026 Yosemite'`, `'🏔️'` | |
| `start`, `end` | `'2026-11-26'`, `'2026-11-28'` | D-day and "여행 중" badge |
| `updated` | `'2026-11-07'` | footer "마지막 업데이트" |
| `members` | `[{ id:'mk', name:'Minseo Kim', initial:'MK', color:'#2383e2', url }]` | ids used by `votes`, `owner`, `who` |
| `pageOrder`, `pages` | see below | subpages + their covers |
| `labels` | `{ drive: 'Valley까지', season: '11월 말', open: '11월 말 영업', entrance: '입구' }` | per-trip wording of a few property labels (defaults are generic) |
| `mapFocus` | `{ label: 'Valley 확대', ll: [37.7456, -119.5936], km: 20, auto: false }` | the map's "🔍" button zooms to stops within `km` of `ll`; `auto: true` opens the map already zoomed there |
| `archived` | `{ date: '11/11', reason: '…' }` | trip set aside: every page shows a gray "접어둔 후보" banner with the reason. Also set `archived` on its card in the root `index.html` (`HUB.trips[i]`) so it moves into the hub's collapsed "접어둔 후보" list and out of the comparison table; drop its pages from `PRECACHE` in `sw.js` |

### `pages`

`pages.<key> = { title, tab, icon, href, cover, desc, blurb }` for keys `home, course, places, stay, food, prep`.
`href` is relative to `base` (`''` for home, `'course/'` …). `cover` is an image key. `blurb` is the short line on the
home page card and the link-preview description; `desc` is the sub-title under the page title.
After changing these, run `node tools/gen_pages.mjs`.

## Home page

| Field | Shape |
|---|---|
| `props` | `[{ icon, label, value }]`, or `{ dday: true }`, `{ members: true }`, `{ tags: [['확정','green']], value }` |
| `stages` | `[{ label, state: 'done' \| 'now' \| '', note }]` — progress strip |
| `homeCallouts` | callouts (see below) |
| `decisions` | `[{ title, status: [label, color], owner, done, open, desc, options: [{ label, pros:[], cons:[], votes:[], pick }] }]` |
| `todo` | `[{ due: '11/19', text, note, who, done }]` — shared checklist (state lives in data.js) |
| `budget` | `{ aside, note, cols: ['아끼면','보통','여유'], rows: [[label, a, b, c, note]], total: [a, b, c] }` |
| `howto` | bullet list in the "같이 수정하는 방법" toggle |
| `weather`, `weatherDays` | `{ name, ll, normal, nws }`, `['2026-11-26', …]` — live Open-Meteo forecast (shows trip days once within 16 days) |

**Callout** (used everywhere): `{ icon, color, title, text, items: [] }` — colors: `gray brown orange yellow green blue purple pink red`.

## Course (`course/` page + maps)

```js
courses: [{
  id, label, short, icon,
  routes: ['hwy120', 'hwy140'],          // keys in geo.js: [go, return]
  summary,
  days: [{ title, date, note, items: [
    { time: '08:00', ref: 'place:mist-trail',            // or 'food:degnans' / 'stay:cedar-lodge'
      title: '…',                                       // optional override of the item's name
      note, tag: ['🌅 일몰 16:41', 'orange'],
      ll: [lat, lng],                                    // only for stops without a ref
      altLabel: '🍽️ 선택지',                              // default '🔁 대안'
      alts: [{ ref: 'place:columbia-rock', note }, { title: '…', note }] },
  ] }],
}],
courseCallouts, variants: [{ title, hint, open, text, items }], rainPlan: [ … ]
```

Stops with a `ref` (or `ll`) get numbered pins on the map, coloured by day. The places page shows exactly the places
referenced by `courses[0]`, in order, with a "Day 1 · 16:05" badge; the rest are collapsed.

## Places · Stays · Food (the "databases")

Shared: `id` (lowercase-hyphen, unique per kind), `name`, `en`, `emoji`, `img` (image key), `ll: [lat, lng]`,
`summary`, `details: []`, `pros: []`, `cons: []`, `caveat`, `links: [{ label, url }]`, `votes: []`, `badge`,
`mapq` (Google Maps query when there's no `ll`).

| Kind | Extra fields | Enums |
|---|---|---|
| `places[]` | `tier`, `kindLabel`, `area`, `time`, `distance`, `difficulty`, `best`, `parking`, `tickets`, `cost`, `hours`, `status` (e.g. '도로 폐쇄 가능성') | `tier`: `must rec opt skip` |
| `stays[]` | `group`, `status`, `featured` (1,2,3… shortlist order), `area`, `entrance`, `drive`, `parking`, `price`, `priceShort`, `beds`, `kitchen`, `open`, `cancel` | `status`: `cand top booked full na closed` (`na` = not bookable for our dates) |
| `food.items[]` | `group`, `pick`, `featured`, `area`, `cuisine`, `price`, `hours`, `reserve` | `pick`: `top good backup` |
| `food.thanksgiving[]` | `{ name, state: [label,color], where, price, time, note, links, featured }` | |
| `food.thanksgivingTitle`, `food.thanksgivingAside` | heading + right-side note of the Thanksgiving section | |

`stayGroups` / `foodGroups`: `[{ id, label, color }]` — filter pills inside "더 보기".
`placeCallouts`, `stayCallouts`, `food.callouts`: callouts at the top of each page.

## Prep page

```js
prep: {
  callouts: [ … ],
  sections: [{ icon, title, text, items: [], more: [], links: [] }],   // masonry cards
  checklists: [{ id, icon, title, items: [] }],                        // per-device checkboxes (localStorage)
},
sources: [{ label, url }]   // "참고한 출처" toggle on the prep page
```

## Images (`images.json` → `images.js`)

```json
"tunnel-view": { "file": "Tunnel_View,_Yosemite_Valley,_Yosemite_NP_-_Diliff.jpg", "title": "Tunnel View", "pos": "center 60%" },
"og-rush-creek": { "src": "https://wsrv.nl/?url=…&w=960&output=jpg&q=78", "credit": "공식 사이트 이미지",
                   "license": "링크 미리보기", "page": "https://www.rushcreeklodge.com/", "title": "Rush Creek Lodge" }
```
Run `python3 tools/build_images.py`. Credits are listed automatically in each page's "📷 사진 출처" toggle.
