# UCB Trip Planner

여행 계획 사이트 → https://ucbtripplanner.github.io

## 구조

```
index.html                 # 메인 (여행 목록)
assets/style.css           # 공통 스타일 (노션 스타일, 라이트/다크)
assets/trip.js             # 렌더러 — data.js를 읽어서 모든 페이지를 그려요
2026-yosemite/
  data.js                  # ✏️ 여행 내용 전부 (여기만 고치면 돼요)
  images.js                # 사진 목록 (Wikimedia Commons, 라이선스 포함)
  geo.js                   # 지도 경로 (Berkeley → Yosemite)
  index.html               # 홈
  course/ places/ stay/ food/ prep/   # 서브페이지 (껍데기 HTML)
```

## 같이 수정하기

- 사이트 오른쪽 위 ✏️ → GitHub에서 `data.js` 바로 수정
- **찜하기:** 항목의 `votes: ['mk', 'ms', 'jp']`
- **숙소 상태:** `status: 'cand' | 'top' | 'booked' | 'full' | 'closed'`
- **할 일 완료:** `done: true`
- push 후 1–2분 뒤 반영

## 로컬에서 보기

```sh
python3 -m http.server 8000   # → http://localhost:8000/2026-yosemite/
```

> 이 레포는 public이에요. 예약번호, 전화번호, 결제 정보 같은 개인정보는 올리지 마세요.
