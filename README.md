# UCB Trip Planner

친구들끼리 여행 계획을 같이 모으고 정하는 사이트 → **https://ucbtripplanner.github.io**

| 여행 | 날짜 | 페이지 |
|---|---|---|
| 🏔️ Thanksgiving 2026 · Yosemite | 2026-11-26 (목) – 11-28 (토) | [/2026-yosemite/](https://ucbtripplanner.github.io/2026-yosemite/) |
| 🌴 Thanksgiving 2026 · LA | 2026-11-26 (목) – 11-28 (토) | [/2026-la/](https://ucbtripplanner.github.io/2026-la/) |

## 수정하는 법

**여행마다 내용은 전부 `<여행 폴더>/data.js` 한 파일에 있어요** (`2026-yosemite/data.js`, `2026-la/data.js`).

- **GitHub 웹에서:** 사이트 오른쪽 위 ✏️ → `data.js` 편집 → Commit. 1–2분 뒤 반영.
- **Claude Code로:** 이 레포를 열고 "숙소 Cedar Lodge 예약 완료로 바꿔줘", "이 식당 추가해줘", "출발 전에 도로 상황 다시 확인해줘"처럼 말하면 돼요. 에이전트용 가이드는 [`CLAUDE.md`](CLAUDE.md)에 있어요 (다른 에이전트는 [`AGENTS.md`](AGENTS.md)).
- 자주 쓰는 것:
  - 찜하기 → 항목의 `votes: ['mk', 'ms', 'jp']`
  - 숙소 상태 → `status: 'cand' | 'top' | 'booked' | 'full' | 'na' | 'closed'`
  - 할 일 완료 → `done: true`
- 수정 후 확인: `node tools/check_data.mjs 2026-la` (또는 `2026-yosemite`) → `✓ OK`

필드 설명은 [`docs/DATA.md`](docs/DATA.md), 출처가 달린 리서치 노트와 출발 전 확인 목록은 [`2026-yosemite/research/`](2026-yosemite/research/).

## 로컬에서 보기

```sh
python3 tools/serve.py          # → http://127.0.0.1:8765/2026-yosemite/
```

## 구조

```
index.html               여행 목록 (메인)
assets/style.css, trip.js 공통 디자인 + 렌더러 (data.js → 화면)
sw.js                    오프라인 캐시 (요세미티는 신호가 거의 없어요)
2026-yosemite/
  data.js                ✏️ 여행 내용 전부
  images.json → images.js   사진 목록 (Wikimedia Commons, 라이선스 자동 표시)
  routes.json → geo.js      지도 운전 경로
  index.html, course/ …     페이지 껍데기 (tools/gen_pages.mjs가 생성)
  research/              리서치 노트 · OPEN_QUESTIONS.md
tools/                   사진 찾기 · 좌표 · 검증 · 미리보기 · 스크린샷 스크립트
docs/DATA.md             data.js 필드 설명
.claude/                 Claude Code 설정 · 작업 스킬
```

> 이 레포는 **public**이에요. 예약번호, 전화번호, 결제 정보 같은 개인정보는 올리지 마세요.
> 사진 출처는 각 페이지 맨 아래 "📷 사진 출처"에 자동으로 표시돼요.
