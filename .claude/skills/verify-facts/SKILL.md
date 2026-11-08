---
name: verify-facts
description: Re-check time-sensitive trip facts (road/trail closures, chain controls, weather, prices, hours, Thanksgiving dinners, pass rules) against official sources and update the site. Use when asked "출발 전에 확인해줘", "지금 도로 상황 어때", "아직 맞는 정보야?", or a few days before departure.
---

# Re-verify the trip facts

1. Read `2026-yosemite/research/OPEN_QUESTIONS.md` — it lists what was unconfirmed on 2026-11-07, deadlines, and
   past mistakes not to reintroduce.
2. Check, at minimum (official sources only; note the time you checked):
   - NPS current conditions: https://www.nps.gov/yose/planyourvisit/conditions.htm — Glacier Point Rd, Tioga Rd,
     Mist Trail, chain controls, construction delays. Phone line 209-372-0200 (1, 1) is authoritative but you can't call.
   - Caltrans: https://roads.dot.ca.gov/?roadnumber=120 and `=140` (chain controls / closures).
   - Weather: NWS point forecast for Yosemite Valley (link in `data.js` → `weather.nws`).
   - New Yosemite Guide (from ~11/24): https://www.nps.gov/yose/planyourvisit/guide.htm — shuttle, dining & store hours.
   - Fees/passes: https://www.nps.gov/yose/planyourvisit/fees.htm and https://www.nps.gov/aboutus/nonresident-fees.htm.
     Keep the status-based framing (Resident pass = US citizens/residents; a state DL alone doesn't make an F-1 student a resident).
   - Anything the user is about to book: re-open the official page (booking engines often block bots — then say so and
     ask the user to check by hand rather than guessing).
3. Update `data.js` where facts changed (dates in text like "11/7 기준" → the new date), mark resolved items in
   `OPEN_QUESTIONS.md`, bump `updated:` at the top of `TRIP`.
4. `node tools/check_data.mjs`, preview, then summarise for the user: what changed, what's still unknown, and any
   decision it affects (e.g. "눈 예보 → 140번 왕복으로 바꾸는 걸 추천").
5. Safety first: if a storm/chain control is forecast, say so plainly and point to the "🌨️ 눈 · 비 예보가 있으면" variant.
