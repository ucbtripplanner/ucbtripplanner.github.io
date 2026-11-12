/* UCB Trip Planner — Notion-style page renderer.
 * Each trip folder has data.js (window.TRIP); each page sets <body data-page="home|course|places|stay|food|prep">.
 * The root hub sets window.HUB and <body data-page="hub">.
 * Optional: Leaflet (window.L) for maps.
 */
(function () {
  'use strict';

  // ================================================================ utils
  const store = {
    get(k) { try { return localStorage.getItem('utp:' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('utp:' + k, v); } catch (e) { /* private mode */ } },
  };
  const sess = {
    get(k) { try { return JSON.parse(sessionStorage.getItem('utp:' + k)); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem('utp:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // tiny inline markup: **bold**, `code`, [text](https://url) or [text](/internal/path)
  const plain = (s) => String(s || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1');
  const md = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\[([^\]]+)\]\((tel:\+?[\d-]+)\)/g, '<a href="$2">$1</a>');
  const list = (a) => (a && a.length ? `<ul class="bullets">${a.map((x) => `<li>${md(x)}</li>`).join('')}</ul>` : '');
  const tag = (label, color) => (label ? `<span class="tag ${color || 'gray'}">${esc(label)}</span>` : '');
  const h2 = (icon, text, aside) => `<h2 class="h2">${icon ? `<span class="h-icon">${esc(icon)}</span>` : ''}${esc(text)}${aside ? `<span class="h2-aside">${aside}</span>` : ''}</h2>`;
  const ext = (url, label) => `<a class="ext" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;
  const after = (fn) => setTimeout(fn, 0);
  const DAYC = ['#2383e2', '#1f9d61', '#c4621b', '#9b5fd0'];
  const MOBILE = !!(window.matchMedia && window.matchMedia('(max-width: 640px)').matches);
  // rewrite a thumbnail URL to another width: Commons ".../960px-File.jpg", wsrv "&w=960", imgix "?w=960"
  const sized = (u, w) => (u ? u.replace(/\/\d+px-(?=[^/]*$)/, `/${w}px-`).replace(/([?&]w=)\d+/, `$1${w}`) : u);

  // ================================================================ theme
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.content = t === 'dark' ? '#191919' : '#ffffff';
    document.querySelectorAll('.theme-btn').forEach((b) => {
      b.textContent = t === 'dark' ? '☀️' : '🌙';
      b.title = t === 'dark' ? '라이트 모드로' : '다크 모드로';
      b.setAttribute('aria-label', b.title);
    });
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-btn')) return;
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    store.set('theme', next);
    applyTheme(next);
  });

  const app = document.getElementById('app');
  const PAGE = document.body.dataset.page || 'home';
  const used = new Map(); // images shown on this page → photo credits

  function image(key, T) {
    if (!key) return null;
    const im = typeof key === 'string' ? ((T && T.images) || {})[key] : key;
    if (!im || !im.src) return null;
    used.set(im.src, im);
    return im;
  }
  function thumb(im, emoji, alt, badge) {
    return `<div class="thumb${im ? '' : ' noimg'}">${im
      ? `<img loading="lazy" decoding="async" src="${esc(sized(im.src, MOBILE ? 500 : 960))}" alt="${esc(alt || '')}" style="object-position:${esc(im.pos || 'center')}" onerror="this.parentNode.classList.add('noimg');this.remove()">`
      : ''}<span class="thumb-emoji" aria-hidden="true">${esc(emoji || '🏞️')}</span>${badge ? `<span class="thumb-badge">${esc(badge)}</span>` : ''}</div>`;
  }
  const credit = (im) => (im && im.credit ? `<a class="cover-credit" href="${esc(im.page || im.src)}" target="_blank" rel="noopener">📷 ${esc(im.credit)}</a>` : '');
  function cover(im) {
    if (!im) return '<div class="cover cover-blank"></div>';
    return `<div class="cover"><img src="${esc(MOBILE ? im.src : (im.big || im.src))}" alt="" fetchpriority="high" style="object-position:${esc(im.pos || 'center')}">${credit(im)}</div>`;
  }
  const callout = (c) => (c.collapsed ? collapsedCallout(c) : calloutBox(c));
  const collapsedCallout = (c) => `<details class="toggle callout-toggle callout ${c.color || 'gray'}"><summary><span class="callout-icon">${esc(c.icon || '💡')}</span> <b>${md(c.title || '')}</b></summary><div class="toggle-body">${c.text ? `<p>${md(c.text)}</p>` : ''}${list(c.items)}</div></details>`;
  const calloutsTop = (a) => (a || []).filter((c) => !c.after).map(callout).join('');
  const calloutsAfter = (a) => (a || []).filter((c) => c.after).map(callout).join('');
  const calloutBox = (c) => `<div class="callout ${c.color || 'gray'}"><div class="callout-icon">${esc(c.icon || '💡')}</div><div class="callout-body">${
    c.title ? `<div class="callout-title">${md(c.title)}</div>` : ''}${c.text ? `<p>${md(c.text)}</p>` : ''}${list(c.items)}</div></div>`;
  const toggle = (summary, inner, open, cls) => `<details class="toggle ${cls || ''}"${open ? ' open' : ''}><summary>${summary}</summary><div class="toggle-body">${inner}</div></details>`;
  // rows: [icon, label, value, isHtml]
  const props = (rows) => `<div class="props">${rows.filter((r) => r && r[2] != null && r[2] !== '').map((r) => `<div class="prop"><div class="prop-k"><span class="prop-icon">${esc(r[0])}</span>${esc(r[1])}</div><div class="prop-v">${r[3] ? r[2] : md(r[2])}</div></div>`).join('')}</div>`;

  function relTime(iso) {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return '방금';
    if (s < 3600) return `${Math.floor(s / 60)}분 전`;
    if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
    if (s < 86400 * 14) return `${Math.floor(s / 86400)}일 전`;
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  // ================================================================ HUB (root page)
  if (PAGE === 'hub') {
    const H = window.HUB;
    if (!H || !app) return;
    const HI = { images: window.TRIP_IMAGES || {} };
    const im = image(H.cover, HI);
    app.innerHTML = `
      <header class="topbar"><div class="topbar-row"><nav class="crumbs"><span class="here">🧳 <span>UCB Trip Planner</span></span></nav>
        <div class="topbar-actions"><button class="theme-btn" type="button"></button></div></div></header>
      ${cover(im)}
      <main class="page">
        <div class="page-icon">🧳</div>
        <h1 class="page-title">${esc(H.title)}</h1>
        <p class="page-desc">${md(H.desc)}</p>
        ${h2('🗂️', '여행')}
        <div class="gallery gallery-lg">${H.trips.filter((t) => !t.archived).map((t) => `
          <a class="gcard" href="${esc(t.href)}">${thumb(image(t.cover, HI), t.icon, t.title, t.badge)}
            <div class="gcard-body"><div class="gcard-title">${esc(t.icon)} ${esc(t.title)}</div>
            <div class="gcard-sub">${esc(t.when)}</div>${t.desc ? `<p class="gcard-text">${md(t.desc)}</p>` : ''}
            <div class="gcard-tags">${(t.tags || []).map((x) => tag(x[0], x[1])).join('')}</div></div></a>`).join('')}
        </div>
        ${hubCompare(H)}
        ${hubArchived(H)}
        ${hubFooter()}
      </main>`;
    applyTheme(document.documentElement.dataset.theme);
    return;
  }
  // side-by-side comparison of the trip options (HUB.trips[i].compare)
  function hubCompare(H) {
    const rows = H.trips.filter((t) => t.compare && !t.archived);
    if (rows.length < 2) return '';
    const cols = [['drive', '🚗 편도'], ['cost', '💸 1인 경비'], ['highlights', '✨ 하이라이트'], ['thanksgiving', '🦃 Thanksgiving 디너'], ['risk', '⚠️ 주의'], ['bestFor', '👍 이런 사람에게']];
    return `${h2('⚖️', '한눈에 비교', H.compareNote ? esc(H.compareNote) : '')}
      <div class="table-wrap compare-table"><table class="dbtable"><thead><tr><th>여행</th>${cols.map((c) => `<th>${esc(c[1])}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((t) => `<tr><td class="name-cell"><a class="row-open" href="${esc(t.href)}"><span class="row-emoji">${esc(t.icon)}</span><span>${esc(t.short || t.title)}${t.badge ? ` <span class="tag gray">${esc(t.badge)}</span>` : ''}</span></a></td>${cols.map((c) => `<td><div class="cell">${md(t.compare[c[0]] || '')}</div></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  // trips set aside (HUB.trips[i].archived = { date, reason }) — kept reachable, folded away
  function hubArchived(H) {
    const a = H.trips.filter((t) => t.archived);
    if (!a.length) return '';
    return `<details class="more-block archived-block"><summary><span class="more-title">🗄️ 접어둔 후보 <span class="more-n">${a.length}</span></span><span class="more-hint">${esc(H.archivedHint || '이번엔 안 가기로 한 곳')}</span></summary>
      <div class="more-body">${a.map((t) => `<a class="more-row" href="${esc(t.href)}"><span class="row-emoji">${esc(t.icon)}</span><span class="more-row-main"><b>${esc(t.title)}</b><span class="muted small">${md(t.archived.reason || '')}${t.archived.date ? ` · ${esc(t.archived.date)}` : ''}</span></span></a>`).join('')}</div></details>`;
  }
  function hubFooter() {
    const imgs = [...used.values()].filter((i) => i.credit);
    return `<footer class="page-foot">${imgs.length ? toggle('📷 사진 출처', `<ul class="bullets small">${imgs.map((i) => `<li><a href="${esc(i.page || i.src)}" target="_blank" rel="noopener">${esc(i.title || '사진')}</a> — ${esc(i.credit)}${i.license ? ` · ${esc(i.license)}` : ''}</li>`).join('')}</ul>`) : ''}
      <p class="faint small"><a href="https://github.com/ucbtripplanner/ucbtripplanner.github.io" target="_blank" rel="noopener">GitHub</a></p></footer>`;
  }

  // ================================================================ TRIP
  const T = window.TRIP;
  if (!T || !app) return;
  T.images = Object.assign({}, window.TRIP_IMAGES || {}, T.images || {});
  T.geo = Object.assign({}, window.TRIP_GEO || {}, T.geo || {});
  const P = T.pages[PAGE] || T.pages.home;
  // per-trip wording, e.g. labels: { drive: 'Valley까지', season: '11월 말' }
  const LBL = Object.assign({ drive: '이동 시간', season: '그 주 상황', open: '그 주 영업', entrance: '입구' }, T.labels || {});
  const img = (k) => image(k, T);
  const editUrl = T.repo && T.dataPath ? `https://github.com/${T.repo}/edit/main/${T.dataPath}` : null;

  const TIERS = { must: ['필수', 'red'], rec: ['추천', 'green'], opt: ['선택', 'gray'], skip: ['이번엔 패스', 'brown'] };
  const STATUS = { cand: ['후보', 'gray'], top: ['유력', 'blue'], booked: ['예약 완료', 'green'], full: ['매진', 'red'], na: ['이번 날짜 불가', 'red'], closed: ['영업 안 함', 'brown'] };
  const PICKS = { top: ['강추', 'orange'], good: ['괜찮음', 'green'], backup: ['백업', 'gray'] };
  const mapTag = (m, k) => (m[k] ? tag(m[k][0], m[k][1]) : '');
  const groupTag = (groups, k) => { const g = (groups || []).find((x) => x.id === k); return g ? tag(g.label, g.color || 'blue') : ''; };

  // members & votes
  const member = (id) => (T.members || []).find((m) => m.id === id);
  const avatar = (id, lg) => { const m = member(id); return m ? `<span class="avatar${lg ? ' lg' : ''}" style="background:${esc(m.color)}" title="${esc(m.name)}">${esc(m.initial || m.name.slice(0, 1))}</span>` : ''; };
  const votesHtml = (v) => (v && v.length ? `<span class="votes" title="${esc(v.map((id) => (member(id) || {}).name).filter(Boolean).join(', '))} 찜"><span class="avatars">${v.map((id) => avatar(id)).join('')}</span>👍 ${v.length}</span>` : '');
  const membersHtml = () => `<span class="members">${(T.members || []).map((m) => `<span class="member">${avatar(m.id, true)}${m.url ? `<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.name)}</a>` : esc(m.name)}</span>`).join('')}</span>`;

  // ---------------------------------------------------------------- shell
  function topbar() {
    const crumbs = [
      '<a href="/">🧳 <span>UCB Trip Planner</span></a>',
      PAGE === 'home' ? `<span class="here">${esc(T.icon)} <span>${esc(T.short)}</span></span>` : `<a href="${T.base}">${esc(T.icon)} <span>${esc(T.short)}</span></a>`,
    ];
    if (PAGE !== 'home') crumbs.push(`<span class="here">${esc(P.icon)} <span>${esc(P.title)}</span></span>`);
    const tabs = T.pageOrder.map((k) => {
      const p = T.pages[k];
      return `<a href="${T.base}${p.href}"${k === PAGE ? ' class="active" aria-current="page"' : ''}>${esc(p.icon)} ${esc(p.tab || p.title)}</a>`;
    }).join('');
    return `<header class="topbar"><div class="topbar-row"><nav class="crumbs">${crumbs.join('<span class="sep">/</span>')}</nav>
      <div class="topbar-actions">${editUrl ? `<a class="icon-btn" href="${esc(editUrl)}" target="_blank" rel="noopener" title="GitHub에서 내용 수정" aria-label="내용 수정">✏️</a>` : ''}<button class="theme-btn" type="button"></button></div></div>
      <nav class="pagetabs" aria-label="페이지"><div class="pagetabs-inner">${tabs}</div></nav></header>`;
  }
  function header() {
    return `${cover(img(P.cover))}<div class="page"><div class="page-icon">${esc(P.icon)}</div>
      <h1 class="page-title">${esc(PAGE === 'home' ? T.title : P.title)}</h1>${P.desc ? `<p class="page-desc">${md(P.desc)}</p>` : ''}${T.archived ? calloutBox({ icon: '🗄️', color: 'gray', title: `접어둔 후보예요${T.archived.date ? ` (${T.archived.date})` : ''}`, text: `${T.archived.reason || ''} 정보는 조사한 시점 그대로라 최신이 아닐 수 있어요. → [지금 후보 보기](/)` }) : ''}`;
  }
  function footer() {
    const imgs = [...used.values()].filter((i) => i.credit);
    const credits = imgs.length ? toggle('📷 사진 출처', `<ul class="bullets small">${imgs.map((i) => `<li><a href="${esc(i.page || i.src)}" target="_blank" rel="noopener">${esc(i.title || '사진')}</a> — ${esc(i.credit)}${i.license ? ` · ${esc(i.license)}` : ''}</li>`).join('')}</ul>`) : '';
    const srcs = (T.sources || []).filter((s) => !s.page || s.page === PAGE);
    const src = srcs.length && (PAGE === 'prep' || srcs.some((s) => s.page === PAGE))
      ? toggle('🔗 참고한 출처', `<ul class="bullets small">${srcs.map((s) => `<li>${ext(s.url, s.label)}</li>`).join('')}</ul>`) : '';
    return `<footer class="page-foot">${src}${credits}<p class="faint small">${T.updated ? `마지막 업데이트 ${esc(T.updated)}` : ''}${editUrl ? ` · <a href="${esc(editUrl)}" target="_blank" rel="noopener">✏️ 내용 수정하기 (GitHub)</a>` : ''}</p></footer>`;
  }

  function dday() {
    const [y, m, d] = T.start.split('-').map(Number);
    const [ey, em, ed] = (T.end || T.start).split('-').map(Number);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const n = Math.round((new Date(y, m - 1, d) - today) / 864e5);
    if (n > 0) return `<b>D-${n}</b>`;
    if (today <= new Date(ey, em - 1, ed)) return '<b>여행 중 🎒</b>';
    return '다녀옴 ✨';
  }

  // ---------------------------------------------------------------- items
  const KINDS = {
    place: { items: () => T.places || [], page: 'places', emoji: '📍' },
    stay: { items: () => T.stays || [], page: 'stay', emoji: '🏨' },
    food: { items: () => (T.food && T.food.items) || [], page: 'food', emoji: '🍽️' },
  };
  const findItem = (kind, id) => KINDS[kind] && KINDS[kind].items().find((x) => x.id === id);
  const itemHref = (kind, id) => `${T.base}${T.pages[KINDS[kind].page].href}#${encodeURIComponent(id)}`;
  const linksHtml = (links) => (links && links.length ? `<div class="item-links">${links.map((l) => ext(l.url, l.label)).join('')}</div>` : '');

  function cardHtml(kind, it, badgeOverride) {
    const im = img(it.img);
    let sub = '', tags = '', line = '';
    if (kind === 'place') {
      sub = it.en || '';
      tags = mapTag(TIERS, it.tier) + tag(it.kindLabel, 'purple') + (it.time ? tag('⏱ ' + it.time, 'gray') : '');
      line = !it.status ? '' : /^✓/.test(it.status) ? `<div class="gcard-line">${md(it.status)}</div>` : `<div class="gcard-warn">⚠️ ${md(it.status)}</div>`;
    } else if (kind === 'stay') {
      sub = it.area || '';
      tags = mapTag(STATUS, it.status) + groupTag(T.stayGroups, it.group);
      const pr = it.priceShort || it.price;
      line = `${it.drive ? `<div class="gcard-line">🚗 ${md(it.drive)}</div>` : ''}${pr ? `<div class="gcard-line gcard-key">💵 ${md(pr)}</div>` : ''}`;
    } else {
      sub = [it.area, it.cuisine].filter(Boolean).join(' · ');
      tags = mapTag(PICKS, it.pick) + tag(it.price, 'gray') + groupTag(T.foodGroups, it.group);
      line = it.hours ? `<div class="gcard-line">🕒 ${md(it.hours)}</div>` : '';
    }
    const v = votesHtml(it.votes);
    return `<button type="button" class="gcard" data-peek="${kind}:${esc(it.id)}">${thumb(im, it.emoji || KINDS[kind].emoji, it.name, badgeOverride || it.badge)}
      <div class="gcard-body"><div class="gcard-title">${esc(it.name)}</div>${sub ? `<div class="gcard-sub">${esc(plain(sub))}</div>` : ''}
      <div class="gcard-tags">${tags}</div>${it.summary ? `<p class="gcard-text">${md(it.summary)}</p>` : ''}${line}${v ? `<div class="gcard-foot">${v}</div>` : ''}</div></button>`;
  }

  function peekHtml(kind, it) {
    const im = img(it.img);
    let rows;
    if (kind === 'place') {
      rows = [
        ['🏷️', '구분', mapTag(TIERS, it.tier) + ' ' + tag(it.kindLabel, 'purple'), true],
        ['📍', '위치', it.area], ['⏱', '소요', it.time], ['🥾', '거리 · 고도', it.distance],
        ['💪', '난이도', it.difficulty], ['🌅', '추천 시간', it.best], ['🅿️', '주차', it.parking], ['🎟️', '티켓 · 예약', it.tickets], ['💵', '비용', it.cost], ['🕒', '영업', it.hours], ['📅', LBL.season, it.status],
      ];
    } else if (kind === 'stay') {
      rows = [
        ['🏷️', '상태', mapTag(STATUS, it.status) + ' ' + groupTag(T.stayGroups, it.group), true],
        ['📍', '위치', it.area], ['🚗', LBL.drive, it.drive], ['🚪', LBL.entrance, it.entrance], ['🅿️', '주차', it.parking],
        ['💵', '가격', it.price], ['🛏️', '3명 배정', it.beds], ['🍳', '부엌', it.kitchen],
        ['📅', LBL.open, it.open], ['↩️', '취소 규정', it.cancel],
      ];
    } else {
      rows = [
        ['🏷️', '구분', mapTag(PICKS, it.pick) + ' ' + groupTag(T.foodGroups, it.group), true],
        ['📍', '위치', it.area], ['🍴', '종류', it.cuisine], ['💵', '가격', it.price],
        ['🕒', '영업', it.hours], ['📞', '예약', it.reserve],
      ];
    }
    if (it.votes && it.votes.length) rows.push(['👍', '찜', `<span class="members">${it.votes.map((id) => `<span class="member">${avatar(id)}${esc((member(id) || {}).name || id)}</span>`).join('')}</span>`, true]);
    let body = it.summary ? `<p class="peek-summary">${md(it.summary)}</p>` : '';
    if (it.pros || it.cons) body += `<div class="proscons"><div><div class="pc-h">👍 좋은 점</div>${list(it.pros)}</div><div><div class="pc-h">👎 아쉬운 점</div>${list(it.cons)}</div></div>`;
    if (it.details && it.details.length) body += `<h3 class="h3">자세히</h3>${list(it.details)}`;
    if (it.caveat) body += callout({ icon: '⚠️', color: 'yellow', text: it.caveat });
    const links = (it.links || []).slice();
    if (it.mapq || it.ll) links.push({ label: '🗺️ 구글 지도', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.mapq || (it.name + ' ' + (it.area || '')))}` });
    body += linksHtml(links);
    const kpage = T.pages[KINDS[kind].page];
    return `<div class="peek-top"><span class="peek-kind">${esc(kpage.icon)} ${esc(kpage.title)}</span>
        <a class="peek-open" href="${esc(itemHref(kind, it.id))}" title="페이지에서 열기" aria-label="페이지에서 열기">↗</a><button type="button" class="peek-close" aria-label="닫기" autofocus>✕</button></div>
      ${im ? `<div class="peek-hero"><img src="${esc(MOBILE ? im.src : (im.big || im.src))}" alt="${esc(it.name)}" style="object-position:${esc(im.pos || 'center')}">${credit(im)}</div>` : ''}
      <div class="peek-content"><div class="peek-icon"${im ? '' : ' style="margin-top:18px"'}>${esc(it.emoji || KINDS[kind].emoji)}</div>
        <h2 class="peek-title">${esc(it.name)}</h2>${it.en ? `<div class="peek-sub">${esc(it.en)}</div>` : ''}
        ${props(rows)}${body}</div>`;
  }

  // side peek (Notion-style)
  const peek = document.createElement('dialog');
  peek.className = 'peek';
  document.body.appendChild(peek);
  function openPeek(kind, id) {
    const it = findItem(kind, id);
    if (!it) return;
    peek.innerHTML = peekHtml(kind, it);
    const url = KINDS[kind].page === PAGE ? '#' + encodeURIComponent(id) : location.pathname + location.search;
    if (!peek.open) {
      peek.showModal();
      if (!(history.state && history.state.peek)) history.pushState({ peek: 1 }, '', url);
    } else history.replaceState({ peek: 1 }, '', url);
    peek.scrollTop = 0;
  }
  peek.addEventListener('close', () => {
    if (history.state && history.state.peek) history.back();
    else if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  });
  window.addEventListener('popstate', () => { if (peek.open && !(history.state && history.state.peek)) peek.close(); });
  peek.addEventListener('click', (e) => {
    if (e.target === peek || e.target.closest('.peek-close')) peek.close();
  });
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-peek]');
    if (!el) return;
    e.preventDefault();
    const [kind, id] = el.dataset.peek.split(':');
    openPeek(kind, id);
  });

  // ---------------------------------------------------------------- database view (gallery / table + filters)
  // cfg.featured(x) → shortlist shown first; everything else goes into a collapsed "more" database.
  let dbSeq = 0;
  function dbView(kind, all, cfg) {
    const viewKey = 'view:' + T.id + ':' + kind;
    const state = { view: store.get(viewKey) === 'table' ? 'table' : 'gallery', filter: 'all' };
    const id = 'db-' + kind + '-' + (++dbSeq);
    const filters = [{ id: 'all', label: '전체', test: () => true }].concat((cfg.filters || []).filter((f) => all.some(f.test)));
    function rows(items) {
      if (!items.length) return '<p class="empty">해당하는 항목이 없어요.</p>';
      if (state.view === 'gallery') return `<div class="gallery">${items.map((it) => cardHtml(kind, it)).join('')}</div>`;
      return `<div class="table-wrap"><table class="dbtable"><thead><tr><th>이름</th>${cfg.cols.map((c) => `<th>${esc(c[0])}</th>`).join('')}<th>👍</th></tr></thead><tbody>${items.map((it) => {
        const im = img(it.img);
        return `<tr><td class="name-cell"><button type="button" class="row-open" data-peek="${kind}:${esc(it.id)}">${im ? `<img src="${esc(sized(im.src, 330))}" alt="" loading="lazy">` : `<span class="row-emoji">${esc(it.emoji || KINDS[kind].emoji)}</span>`}<span>${esc(it.name)}</span></button></td>${cfg.cols.map((c) => `<td><div class="cell">${c[1](it)}</div></td>`).join('')}<td>${votesHtml(it.votes)}</td></tr>`;
      }).join('')}</tbody></table></div>`;
    }
    const controls = () => `<div class="views" role="tablist">
        <button type="button" role="tab" data-view="gallery" aria-selected="${state.view === 'gallery'}">🖼️ 갤러리</button>
        <button type="button" role="tab" data-view="table" aria-selected="${state.view === 'table'}">▦ 표로 비교</button>
        <span class="views-count">${all.length}개</span></div>
      ${filters.length > 2 ? `<div class="pills">${filters.map((f) => `<button type="button" class="pill" data-filter="${esc(f.id)}" aria-pressed="${state.filter === f.id}">${esc(f.label)} <span class="pill-n">${all.filter(f.test).length}</span></button>`).join('')}</div>` : ''}`;
    function draw() {
      const f = filters.find((x) => x.id === state.filter) || filters[0];
      document.getElementById(id).innerHTML = controls() + `<div class="db-body">${rows(all.filter(f.test))}</div>`;
    }
    after(() => {
      const root = document.getElementById(id);
      if (!root) return;
      root.addEventListener('click', (e) => {
        const v = e.target.closest('[data-view]');
        const fl = e.target.closest('[data-filter]');
        if (v) { state.view = v.dataset.view; store.set(viewKey, state.view); draw(); }
        if (fl) { state.filter = fl.dataset.filter; draw(); }
      });
    });
    all.forEach((it) => img(it.img)); // register images for credits even when starting in table view
    return `<div class="db" id="${id}">${controls()}<div class="db-body">${rows(all)}</div></div>`;
  }
  function database(kind, cfg) {
    let all = KINDS[kind].items();
    if (!cfg.featured) return dbView(kind, all, cfg);
    let feat = all.filter(cfg.featured);
    if (cfg.order) feat = feat.slice().sort(cfg.order);
    const rest = all.filter((x) => !cfg.featured(x));
    let h = `<div class="gallery featured">${feat.map((it) => cardHtml(kind, it, cfg.badge && cfg.badge(it))).join('')}</div>`;
    if (rest.length) {
      h += `<details class="more-block"><summary><span class="more-title">${esc(cfg.moreLabel || '다른 후보')} <span class="more-n">${rest.length}</span></span><span class="more-hint">${esc(cfg.moreHint || '눌러서 펼치기')}</span></summary>
        <div class="more-body">${dbView(kind, rest, cfg)}</div></details>`;
    }
    return h;
  }

  // ---------------------------------------------------------------- checklists
  function staticChecklist(items) {
    return `<ul class="todo">${items.map((i) => `<li class="${i.done ? 'done' : ''}"><span class="box" aria-hidden="true"></span><span class="todo-text">${i.due ? `<span class="todo-due${i.done ? '' : ' open'}">${esc(i.due)}</span>` : ''}${md(i.text)}${i.who ? `<span class="todo-who">${avatar(i.who)}</span>` : ''}${i.note ? `<span class="todo-note">${md(i.note)}</span>` : ''}</span></li>`).join('')}</ul>`;
  }
  function localChecklist(cid, items) {
    const key = 'chk:' + T.id + ':' + cid;
    let saved = {};
    try { saved = JSON.parse(store.get(key) || '{}') || {}; } catch (e) { saved = {}; }
    after(() => {
      const root = document.getElementById(key);
      if (!root) return;
      const count = () => { root.querySelector('.chk-count').textContent = `${root.querySelectorAll('input:checked').length}/${items.length}`; };
      root.addEventListener('change', (e) => {
        if (!e.target.matches('input')) return;
        saved[e.target.dataset.i] = e.target.checked ? 1 : 0;
        store.set(key, JSON.stringify(saved));
        count();
      });
      count();
    });
    return `<div class="todo local" id="${esc(key)}"><div class="chk-head faint small">내 체크 (이 기기에만 저장) · <span class="chk-count"></span></div>${items.map((t, i) => `<label class="todo-row"><input type="checkbox" data-i="${i}"${saved[i] ? ' checked' : ''}><span class="todo-text">${md(t)}</span></label>`).join('')}</div>`;
  }

  // ---------------------------------------------------------------- course helpers
  const plans = T.courses || [];
  const planKey = 'plan:' + T.id;
  function currentPlan() {
    const id = store.get(planKey);
    return plans.find((p) => p.id === id) || plans[0];
  }
  function stopInfo(it) {
    if (it.ref) {
      const [k, rid] = it.ref.split(':');
      const ref = findItem(k, rid);
      if (ref) return { kind: k, ref, ll: it.ll || ref.ll, name: it.title || ref.name, im: img(ref.img) };
    }
    return it.ll ? { kind: null, ref: null, ll: it.ll, name: it.title, im: img(it.img) } : null;
  }

  function dayCards(p) {
    return p.days.map((d, i) => `<details class="day" id="day-${i + 1}" open><summary class="day-head"><span class="day-num" style="background:${DAYC[i % DAYC.length]}">${i + 1}</span><span class="day-title">${esc(d.title)}</span><span class="day-date">${esc(d.date || '')}</span></summary>
      ${d.note ? `<div style="padding:12px 18px 0">${callout({ icon: d.noteIcon || '💡', color: 'gray', text: d.note })}</div>` : ''}
      <ol class="timeline">${d.items.map((it) => {
        const s = stopInfo(it);
        let title = md(it.title), th = '';
        if (s && s.ref) {
          title = `<button type="button" class="ref" data-peek="${esc(it.ref)}">${esc(s.name)}</button>`;
          if (s.im) th = `<button type="button" class="t-thumb" data-peek="${esc(it.ref)}" aria-label="${esc(s.name)} 자세히"><img src="${esc(sized(s.im.src, 330))}" alt="" loading="lazy"></button>`;
        }
        const alts = (it.alts || []).map((a) => {
          const r = a.ref && findItem(...a.ref.split(':'));
          const label = r ? `<button type="button" class="ref" data-peek="${esc(a.ref)}">${esc(a.title || r.name)}</button>` : md(a.title);
          return label + (a.note ? ` <span class="faint">— ${md(a.note)}</span>` : '');
        });
        return `<li><span class="t-time">${esc(it.time || '')}</span><div class="t-what"><div class="t-title">${title}${it.tag ? ' ' + tag(it.tag[0], it.tag[1]) : ''}</div>${it.note ? `<div class="t-note">${md(it.note)}</div>` : ''}${alts.length ? `<details class="t-alt"${MOBILE ? '' : ' open'}><summary class="t-alt-k">${esc(it.altLabel || '🔁 대안')} <span class="faint">${alts.length}</span></summary>${alts.join('<br>')}</details>` : ''}</div>${th}</li>`;
      }).join('')}</ol></details>`).join('');
  }

  // ---------------------------------------------------------------- map (Leaflet)
  const km = (a, b) => {
    const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  };
  let mapSeq = 0;
  function mapBlock(opts) {
    const id = 'map' + (++mapSeq);
    const showPlanTabs = opts.planTabs && plans.length > 1;
    after(() => initMap(id, opts));
    return `<div class="map-block" id="${id}-block">
      <div class="map-bar" id="${id}-bar"></div>
      <div class="map-wrap"><div class="map" id="${id}" role="region" aria-label="여행 동선 지도"></div><div class="map-side" id="${id}-side"></div></div>
      <div class="map-legend">🏠 출발지 · 번호 = Day별 방문 순서 · 굵은 실선 = 가는 길 · 굵은 점선 = 돌아오는 길 (경로는 대략) · 가는 점선 = 그날 이동 순서 · 지도 © OpenStreetMap 기여자</div></div>`;
  }
  const mapControllers = [];
  function initMap(id, opts) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!window.L) {
      // Leaflet loads async (so a slow CDN never blanks the page) — wait for it up to 15s
      opts._t0 = opts._t0 || Date.now();
      if (Date.now() - opts._t0 > 15000) { el.innerHTML = '<p class="empty" style="padding:20px">지도를 불러오지 못했어요 (오프라인?). 아래 목록은 그대로 쓸 수 있어요.</p>'; return; }
      if (!el.firstChild) el.innerHTML = '<p class="empty" style="padding:20px">지도 불러오는 중…</p>';
      setTimeout(() => initMap(id, opts), 250);
      return;
    }
    el.innerHTML = '';
    const L = window.L;
    const touch = L.Browser.mobile;
    // on phones one-finger drag would trap page scrolling → map moves only after a tap
    const map = L.map(el, { scrollWheelZoom: false, dragging: !touch, tap: false, zoomControl: true, attributionControl: true });
    if (touch) {
      const hint = document.createElement('div');
      hint.className = 'map-hint';
      hint.textContent = '👆 탭하면 지도를 움직일 수 있어요';
      el.appendChild(hint);
      map.on('click', () => { map.dragging.enable(); hint.remove(); });
    }
    map.attributionControl.setPrefix('');
    const bases = {
      osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, className: 'tiles-osm',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }),
      topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17, subdomains: 'abc',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM · <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      }),
    };
    let baseKey = store.get('mapbase') === 'topo' ? 'topo' : 'osm';
    bases[baseKey].addTo(map);
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur', () => map.scrollWheelZoom.disable());

    const state = { plan: currentPlan(), day: 'all', focused: false, layers: { stay: false, food: false, place: false } };
    let planLayer = L.layerGroup().addTo(map);
    const extra = { stay: L.layerGroup(), food: L.layerGroup(), place: L.layerGroup() };
    const markers = []; // {day, idx, marker}

    const pinIcon = (n, color) => L.divIcon({ className: '', html: `<div class="pin" style="background:${color}"><span>${n}</span></div>`, iconSize: [28, 28], iconAnchor: [14, 34], popupAnchor: [0, -30] });
    const smallIcon = (emoji) => L.divIcon({ className: '', html: `<div class="pin-sm">${emoji}</div>`, iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12] });
    const popupHtml = (s, sub) => `${s.im ? `<img class="pop-img" src="${esc(sized(s.im.src, 500))}" alt="">` : ''}<div class="pop-body"><div class="pop-title">${esc(s.name)}</div>${sub ? `<div class="pop-sub">${esc(plain(sub))}</div>` : ''}${s.ref ? `<div class="pop-actions"><button type="button" data-peek="${s.kind}:${esc(s.ref.id)}">자세히</button><a href="${esc(itemHref(s.kind, s.ref.id))}">${esc(T.pages[KINDS[s.kind].page].title)} 페이지 →</a></div>` : ''}</div>`;

    // extra layers: all stays / food / places with coordinates
    Object.keys(extra).forEach((k) => {
      KINDS[k].items().forEach((it) => {
        if (!it.ll) return;
        const s = { kind: k, ref: it, ll: it.ll, name: it.name, im: img(it.img) };
        L.marker(it.ll, { icon: smallIcon(it.emoji || KINDS[k].emoji), zIndexOffset: -100 }).bindPopup(popupHtml(s, it.area || '')).addTo(extra[k]);
      });
    });

    function drawPlan() {
      planLayer.clearLayers();
      markers.length = 0;
      const p = state.plan;
      if (!p) return;
      const g = T.geo || {};
      if (g.home) L.marker(g.home.ll, { icon: L.divIcon({ className: '', html: '<div class="pin-home">🏠</div>', iconSize: [30, 30], iconAnchor: [15, 15] }) }).bindPopup(`<div class="pop-body"><div class="pop-title">${esc(g.home.name)}</div><div class="pop-sub">출발 · 도착</div></div>`).addTo(planLayer);
      const rks = p.routes || (p.route ? [p.route] : []);
      rks.forEach((rk, ri) => {
        const r = g.routes && g.routes[rk];
        if (!r) return;
        const lbl = (rks.length > 1 ? (ri ? '↩︎ 돌아오는 길 · ' : '→ 가는 길 · ') : '') + r.label;
        L.polyline(r.line, { color: ri ? '#a0785a' : '#5f7591', weight: 5, opacity: 0.6, dashArray: ri ? '12 9' : null }).bindTooltip(lbl, { sticky: true }).addTo(planLayer);
      });
      p.days.forEach((d, di) => {
        const color = DAYC[di % DAYC.length];
        const segs = [[]];
        let n = 0;
        d.items.forEach((it) => {
          const s = stopInfo(it);
          if (!s || !s.ll) return;
          if (g.home && km(s.ll, g.home.ll) < 3) { segs.push([]); return; } // home is drawn separately
          n += 1;
          const seg = segs[segs.length - 1];
          // only connect nearby stops (in-park moves); long drives are already drawn as the route
          if (seg.length && km(seg[seg.length - 1], s.ll) > 35) segs.push([s.ll]); else seg.push(s.ll);
          const mk = L.marker(s.ll, { icon: pinIcon(n, color), zIndexOffset: 100 + di })
            .bindPopup(popupHtml(s, `Day ${di + 1}${d.date ? ' · ' + d.date : ''}${it.time ? ' · ' + it.time : ''}`));
          mk.addTo(planLayer);
          markers.push({ day: di, n, marker: mk, s, time: it.time });
        });
        segs.filter((x) => x.length > 1).forEach((pts) => L.polyline(pts, { color, weight: 3, opacity: 0.8, dashArray: '6 7' }).addTo(planLayer));
      });
    }
    function fit() {
      const sel = markers.filter((m) => state.day === 'all' || m.day === state.day);
      let pts = sel.map((m) => m.s.ll);
      if (state.day !== 'all' && pts.length > 2) {
        // a day like "drive 300 km, then 6 city stops" → zoom to the biggest cluster of nearby stops
        const groups = [[pts[0]]];
        for (let i = 1; i < pts.length; i++) {
          if (km(pts[i - 1], pts[i]) > 35) groups.push([pts[i]]); else groups[groups.length - 1].push(pts[i]);
        }
        const big = groups.sort((a, b) => b.length - a.length)[0];
        if (big.length >= 2) pts = big;
      }
      if (state.day === 'all' && T.geo && T.geo.home) pts = pts.concat([T.geo.home.ll]);
      if (!pts.length) return;
      if (pts.length === 1) map.setView(pts[0], 13); else map.fitBounds(L.latLngBounds(pts), { padding: [36, 36], maxZoom: 14 });
      markers.forEach((m) => {
        const on = state.day === 'all' || m.day === state.day;
        m.marker.setOpacity(on ? 1 : 0.15);
        m.marker.setZIndexOffset(on ? 1000 + m.day : -1000);
        const mel = m.marker.getElement();
        if (mel) mel.style.pointerEvents = on ? '' : 'none';
      });
    }
    // zoom to the destination's stops (the "all" view is dominated by the long drive): T.mapFocus = { label, ll, km }
    const FOCUS = Object.assign({ label: 'Valley 확대', ll: [37.7456, -119.5936], km: 20 }, T.mapFocus || {});
    function zoomValley(instant) {
      const pts = markers.filter((m) => (state.day === 'all' || m.day === state.day) && km(m.s.ll, FOCUS.ll) < FOCUS.km).map((m) => m.s.ll);
      if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 15, animate: !instant });
    }
    function bar() {
      const p = state.plan;
      const planTabs = opts.planTabs && plans.length > 1 ? plans.map((x) => `<button type="button" class="pill" data-mplan="${esc(x.id)}" aria-pressed="${x.id === p.id}">${esc(x.short || x.label)}</button>`).join('') + '<span class="sep"></span>' : '';
      const days = `<button type="button" class="pill" data-mday="all" aria-pressed="${state.day === 'all' && !state.focused}">전체 동선</button>` + (p ? p.days.map((d, i) => `<button type="button" class="pill" data-mday="${i}" aria-pressed="${state.day === i}"><span class="dot" style="background:${DAYC[i % DAYC.length]}"></span>Day ${i + 1}</button>`).join('') : '');
      const zoom = T.mapFocus ? `<button type="button" class="pill" data-mzoom="1" aria-pressed="${state.focused}">🔍 ${esc(FOCUS.label)}</button>` : '';
      const layers = '<span class="sep"></span>' + [['stay', '🏨 숙소'], ['food', '🍽️ 식당'], ['place', '📍 다른 스팟']].map(([k, label]) => `<button type="button" class="pill" data-mlayer="${k}" aria-pressed="${state.layers[k]}">${label}</button>`).join('')
        + `<span class="sep"></span><button type="button" class="pill" data-mbase="1" aria-pressed="${baseKey === 'topo'}">🏔️ 지형도</button>`;
      document.getElementById(id + '-bar').innerHTML = planTabs + days + zoom + layers;
    }
    function side() {
      const p = state.plan;
      if (!p) return;
      document.getElementById(id + '-side').innerHTML = p.days.map((d, di) => {
        const ms = markers.filter((m) => m.day === di);
        if (state.day !== 'all' && state.day !== di) return '';
        return `<div class="map-side-day"><span class="dot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${DAYC[di % DAYC.length]}"></span>DAY ${di + 1} · ${esc(d.title)}</div>${ms.map((m) => `<button type="button" class="map-stop" data-mstop="${markers.indexOf(m)}"><span class="n" style="background:${DAYC[di % DAYC.length]}">${m.n}</span><span class="ms-txt">${esc(m.s.name)}${m.time ? `<span class="t">${esc(m.time)}</span>` : ''}</span>${m.s.im ? `<img class="ms-img" src="${esc(sized(m.s.im.src, 330))}" alt="" loading="lazy">` : ''}</button>`).join('')}`;
      }).join('');
    }
    function redraw(refit) { drawPlan(); bar(); side(); if (refit !== false) fit(); }

    document.getElementById(id + '-block').addEventListener('click', (e) => {
      const pl = e.target.closest('[data-mplan]');
      const dy = e.target.closest('[data-mday]');
      const ly = e.target.closest('[data-mlayer]');
      const st = e.target.closest('[data-mstop]');
      const bs = e.target.closest('[data-mbase]');
      if (e.target.closest('[data-mzoom]')) { state.focused = true; zoomValley(); bar(); }
      if (bs) {
        map.removeLayer(bases[baseKey]);
        baseKey = baseKey === 'topo' ? 'osm' : 'topo';
        store.set('mapbase', baseKey);
        bases[baseKey].addTo(map);
        bar();
      }
      if (pl) { state.plan = plans.find((x) => x.id === pl.dataset.mplan); state.day = 'all'; store.set(planKey, state.plan.id); redraw(); if (opts.onPlan) opts.onPlan(state.plan); }
      if (dy) { state.day = dy.dataset.mday === 'all' ? 'all' : Number(dy.dataset.mday); state.focused = false; bar(); side(); fit(); }
      if (ly) {
        const k = ly.dataset.mlayer; state.layers[k] = !state.layers[k];
        if (state.layers[k]) extra[k].addTo(map); else map.removeLayer(extra[k]);
        bar();
      }
      if (st) {
        const m = markers[Number(st.dataset.mstop)];
        map.setView(m.s.ll, Math.max(map.getZoom(), 14), { animate: true });
        m.marker.openPopup();
      }
    });
    redraw();
    if (T.mapFocus && T.mapFocus.auto) { state.focused = true; zoomValley(true); bar(); setTimeout(() => map.invalidateSize(), 250); }
    mapControllers.push({ setPlan(p) { state.plan = p; state.day = 'all'; redraw(); }, map });
    // leaflet needs a size recalculation if the container was laid out late
    setTimeout(() => map.invalidateSize(), 200);
  }

  // ---------------------------------------------------------------- weather (Open-Meteo, no key)
  const WMO = (c) => {
    if (c === 0) return ['☀️', '맑음'];
    if (c <= 2) return ['🌤️', '대체로 맑음'];
    if (c === 3) return ['☁️', '흐림'];
    if (c === 45 || c === 48) return ['🌫️', '안개'];
    if (c >= 51 && c <= 57) return ['🌦️', '이슬비'];
    if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return ['🌧️', '비'];
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return ['🌨️', '눈'];
    if (c >= 95) return ['⛈️', '뇌우'];
    return ['🌡️', ''];
  };
  function weatherBlock() {
    const W = T.weather;
    if (!W) return '';
    after(async () => {
      const box = document.getElementById('wx');
      if (!box) return;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${W.ll[0]}&longitude=${W.ll[1]}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum,sunrise,sunset&timezone=America%2FLos_Angeles&forecast_days=16`;
      try {
        let d = sess.get('wx:' + T.id);
        if (!d || Date.now() - d.t > 30 * 60 * 1000) {
          const r = await fetch(url);
          if (!r.ok) throw new Error(r.status);
          d = { t: Date.now(), v: await r.json() };
          sess.set('wx:' + T.id, d);
        }
        const dl = d.v.daily;
        const tripDays = new Set(T.weatherDays || []);
        const idx = dl.time.map((t, i) => i);
        const tripIdx = idx.filter((i) => tripDays.has(dl.time[i]));
        const show = tripIdx.length ? tripIdx : idx.slice(0, 7);
        const dow = ['일', '월', '화', '수', '목', '금', '토'];
        const hm = (s) => s.slice(11, 16);
        box.innerHTML = `<div class="wx">${show.map((i) => {
          const [m, dd] = dl.time[i].slice(5).split('-').map(Number);
          const wd = dow[new Date(dl.time[i] + 'T12:00:00').getDay()];
          const [ico, lbl] = WMO(dl.weather_code[i]);
          const snow = dl.snowfall_sum[i] > 0 ? ` · ❄️ ${dl.snowfall_sum[i]}cm` : '';
          return `<div class="wx-day${tripDays.has(dl.time[i]) ? ' trip' : ''}"><div class="wx-d">${m}/${dd} (${wd})</div><div class="wx-ico" title="${esc(lbl)}">${ico}</div>
            <div class="wx-t">${Math.round(dl.temperature_2m_max[i])}° <span class="lo">/ ${Math.round(dl.temperature_2m_min[i])}°</span></div>
            <div class="wx-s">☔ ${dl.precipitation_probability_max[i] ?? '–'}%${snow}</div><div class="wx-s">🌅 ${hm(dl.sunrise[i])}</div><div class="wx-s">🌇 ${hm(dl.sunset[i])}</div></div>`;
        }).join('')}</div>
        <div class="wx-note">${tripIdx.length ? '여행 날짜 예보 (파란 칸)' : `지금 ${esc(W.name)} 앞으로 7일 — 여행 날짜 예보는 출발 약 2주 전부터 여기에 자동으로 떠요`} · °C · <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>${W.nws ? ` · <a href="${esc(W.nws)}" target="_blank" rel="noopener">NWS 상세 예보</a>` : ''}</div>`;
      } catch (e) {
        box.innerHTML = `<p class="faint small">날씨를 불러오지 못했어요.${W.nws ? ` <a href="${esc(W.nws)}" target="_blank" rel="noopener">NWS 예보 보기</a>` : ''}</p>`;
      }
    });
    return `${W.normal ? `<p class="muted">${md(W.normal)}</p>` : ''}<div id="wx"><p class="faint small">날씨 불러오는 중…</p></div>`;
  }

  // ---------------------------------------------------------------- recent changes (GitHub commits)
  function updatesBlock() {
    if (!T.repo) return '';
    after(async () => {
      const box = document.getElementById('feed');
      if (!box) return;
      try {
        let d = sess.get('feed:' + T.id);
        if (!d || Date.now() - d.t > 5 * 60 * 1000) {
          const r = await fetch(`https://api.github.com/repos/${T.repo}/commits?per_page=6&path=${encodeURIComponent(T.id)}`);
          if (!r.ok) throw new Error(r.status);
          d = { t: Date.now(), v: (await r.json()).map((c) => ({ m: c.commit.message.split('\n')[0], w: c.commit.author.date, a: (c.author && c.author.login) || c.commit.author.name, u: c.html_url })) };
          sess.set('feed:' + T.id, d);
        }
        box.innerHTML = `<ul class="feed">${d.v.map((c) => `<li><span class="when">${esc(relTime(c.w))}</span><a href="${esc(c.u)}" target="_blank" rel="noopener">${esc(c.m)}</a><span class="who">${esc(c.a)}</span></li>`).join('')}</ul>`;
      } catch (e) {
        box.innerHTML = `<p class="faint small"><a href="https://github.com/${esc(T.repo)}/commits/main" target="_blank" rel="noopener">GitHub에서 변경 기록 보기</a></p>`;
      }
    });
    return '<div id="feed"><p class="faint small">불러오는 중…</p></div>';
  }

  // ================================================================ pages
  function renderHome() {
    const countOf = {
      course: () => (plans.length > 1 ? `${plans.length}가지 플랜` : `${plans[0] ? plans[0].days.length : 0}일 일정`),
      places: () => `${(T.places || []).length}곳`,
      stay: () => `${(T.stays || []).length}곳`,
      food: () => `${((T.food && T.food.items) || []).length}곳`,
      prep: () => '체크리스트',
    };
    let h = props((T.props || []).map((p) => {
      if (p.dday) return [p.icon, p.label, dday(), true];
      if (p.members) return [p.icon, p.label, membersHtml() + (p.value ? ` <span class="muted small">${md(p.value)}</span>` : ''), true];
      if (p.tags) return [p.icon, p.label, p.tags.map((x) => tag(x[0], x[1])).join(' ') + (p.value ? ` <span class="muted small">${md(p.value)}</span>` : ''), true];
      return [p.icon, p.label, p.value];
    }));
    if (T.stages && T.stages.length) {
      h += `<div class="stages">${T.stages.map((s) => `<div class="stage ${s.state || ''}"><span class="st-ico">${s.state === 'done' ? '✅' : s.state === 'now' ? '👉' : '⬜'}</span><b>${esc(s.label)}</b>${s.note ? esc(s.note) : ''}</div>`).join('')}</div>`;
    }
    h += calloutsTop(T.homeCallouts);
    // everyone's avatar on each option — greyed out until that person 👍s it (votes: ['mk', ...])
    const voters = (T.members || []).filter((m) => m.id !== 'plus');
    const voteRow = (v) => `<span class="votes vote-row" title="찜하려면 data.js에서 votes에 내 id 추가">${voters.map((m) => `<span class="avatar${(v || []).includes(m.id) ? '' : ' ghost'}" style="background:${esc(m.color)}" title="${esc(m.name)}">${esc(m.initial || m.name[0])}</span>`).join('')}</span>`;
    if (T.decisions && T.decisions.length) {
      const doneN = T.decisions.filter((d) => d.done).length;
      h += h2('🤔', '정해야 할 것', `${doneN}/${T.decisions.length} 결정`);
      h += T.decisions.map((d) => toggle(`<b>${d.done ? '✅ ' : ''}${esc(d.title)}</b><span class="decision-meta">${d.status ? tag(d.status[0], d.status[1]) : ''}${d.owner ? avatar(d.owner) : ''}${d.due ? `<span class="faint small">~${esc(d.due)}</span>` : ''}</span>`,
        `${d.desc ? `<p class="muted">${md(d.desc)}</p>` : ''}${d.options ? `<div class="compare">${d.options.map((o) => `<div class="compare-opt${o.pick ? ' pick' : ''}"><div class="compare-h">${o.pick ? '✅ ' : ''}${esc(o.label)}</div>${voteRow(o.votes)}${o.pros ? `<div class="pc-h">👍 장점</div>${list(o.pros)}` : ''}${o.cons ? `<div class="pc-h">👎 단점</div>${list(o.cons)}` : ''}</div>`).join('')}</div>` : ''}`, d.open)).join('');
    }
    if (T.todo && T.todo.length) {
      h += h2('✅', '할 일 · 마감', `${T.todo.filter((t) => t.done).length}/${T.todo.length}`);
      const open = T.todo.filter((t) => !t.done);
      const SHOW = 7;
      if (open.length > SHOW + 2) {
        const first = T.todo.filter((t) => t.done || open.indexOf(t) < SHOW);
        const later = open.slice(SHOW);
        h += staticChecklist(first) + toggle(`나중 할 일 <span class="faint">${later.length}</span>`, staticChecklist(later));
      } else h += staticChecklist(T.todo);
    }
    if (plans.length) {
      h += h2('🗺️', '전체 동선', `<a href="${T.base}${T.pages.course.href}">코스 자세히 →</a>`);
      h += mapBlock({ planTabs: true });
    }
    h += h2('📚', '페이지');
    h += `<div class="gallery gallery-pages">${T.pageOrder.filter((k) => k !== 'home').map((k) => {
      const p = T.pages[k];
      return `<a class="gcard" href="${T.base}${p.href}">${thumb(img(p.cover), p.icon, p.title)}<div class="gcard-body"><div class="gcard-title">${esc(p.icon)} ${esc(p.title)}</div><p class="gcard-text">${esc(p.blurb || '')}</p><div class="gcard-tags">${tag(countOf[k] ? countOf[k]() : '', 'gray')}</div></div></a>`;
    }).join('')}</div>`;
    if (T.budget) {
      const B = T.budget;
      h += h2('💸', '1인 예상 경비', B.aside || '');
      h += `${B.note ? `<p class="muted">${md(B.note)}</p>` : ''}<div class="table-wrap budget"><table class="dbtable"><thead><tr><th></th>${B.cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${B.rows.map((r) => `<tr><td><b>${esc(r[0])}</b></td>${r.slice(1, B.cols.length + 1).map((c) => `<td class="num">${md(c)}</td>`).join('')}</tr>${r.length > B.cols.length + 1 && r[r.length - 1] ? `<tr class="b-note"><td colspan="${B.cols.length + 1}">${md(r[r.length - 1])}</td></tr>` : ''}`).join('')}${B.total ? `<tr class="total"><td><b>합계 (1인)</b></td>${B.total.map((c) => `<td class="num"><b>${md(c)}</b></td>`).join('')}</tr>` : ''}</tbody></table></div>`;
    }
    if (T.weather) { h += h2('🌤️', T.weather.title || `${T.weather.name} 날씨`); h += weatherBlock(); }
    h += h2('📝', '최근 변경');
    h += updatesBlock();
    if (T.howto) h += toggle('🙋 같이 수정하는 방법', list(T.howto));
    h += calloutsAfter(T.homeCallouts);
    return h;
  }

  function renderCourse() {
    let cur = currentPlan();
    plans.forEach((p) => p.days.forEach((d) => d.items.forEach((it) => stopInfo(it)))); // register images
    after(() => {
      const root = document.getElementById('plans');
      if (!root) return;
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-plan]');
        if (!b) return;
        cur = plans.find((p) => p.id === b.dataset.plan); store.set(planKey, cur.id);
        root.querySelectorAll('[data-plan]').forEach((x) => x.setAttribute('aria-selected', x.dataset.plan === cur.id));
        root.querySelector('.plan-body').innerHTML = planBody(cur);
        mapControllers.forEach((c) => c.setPlan(cur));
      });
    });
    const planBody = (p) => `${p.summary ? callout({ icon: p.icon || '🧭', color: 'blue', title: p.label, text: p.summary }) : ''}${(p.callouts || []).map(callout).join('')}${dayCards(p)}`;
    let h = calloutsTop(T.courseCallouts);
    if (cur && cur.days.length > 1) h += `<nav class="day-jump" aria-label="날짜로 이동">${cur.days.map((d, i) => `<a class="pill" href="#day-${i + 1}"><span class="dot" style="background:${DAYC[i % DAYC.length]}"></span>Day ${i + 1} · ${esc((d.date || '').split(' ')[0])}</a>`).join('')}</nav>`;
    h += `<div id="plans">${plans.length > 1 ? `<div class="views plan-tabs" role="tablist">${plans.map((p) => `<button type="button" role="tab" data-plan="${esc(p.id)}" aria-selected="${p.id === (cur && cur.id)}">${esc(p.label)}</button>`).join('')}</div>` : ''}
      ${mapBlock({ planTabs: false })}
      <div class="plan-body">${cur ? planBody(cur) : ''}</div></div>`;
    if (T.variants && T.variants.length) {
      h += h2('🔀', '상황별로 바뀌는 것');
      h += T.variants.map((v) => toggle(`<b>${esc(v.title)}</b>${v.hint ? ` <span class="faint small">${esc(v.hint)}</span>` : ''}`, (v.text ? `<p>${md(v.text)}</p>` : '') + list(v.items), v.open)).join('');
    }
    if (T.rainPlan && T.rainPlan.length) {
      h += h2('🌧️', '비 · 눈 오는 날 플랜');
      h += callout({ icon: '☔', color: 'blue', items: T.rainPlan });
    }
    h += calloutsAfter(T.courseCallouts);
    return h;
  }

  // where each place/stay/food item appears in the (first) plan → "Day 1 · 16:05"
  function planIndex() {
    const idx = {};
    const p = plans[0];
    if (!p) return idx;
    p.days.forEach((d, di) => d.items.forEach((it, ii) => {
      if (it.ref) (idx[it.ref] = idx[it.ref] || []).push({ day: di + 1, time: it.time, order: di * 100 + ii });
      (it.alts || []).forEach((a) => { if (a.ref) (idx['alt:' + a.ref] = idx['alt:' + a.ref] || []).push({ day: di + 1, time: it.time }); });
    }));
    return idx;
  }
  function renderPlaces() {
    const pi = planIndex();
    const inPlan = (x) => !!pi['place:' + x.id];
    const n = (T.places || []).filter(inPlan).length;
    let h = calloutsTop(T.placeCallouts);
    h += h2('🗓️', '코스에 들어간 곳', `${n}곳 · 일정 순서`);
    return h + database('place', {
      featured: inPlan,
      order: (a, b) => pi['place:' + a.id][0].order - pi['place:' + b.id][0].order,
      badge: (x) => pi['place:' + x.id].map((o) => `Day ${o.day} · ${o.time}`).join(' / '),
      moreLabel: '대안 · 시간 남으면 · 이번엔 패스',
      moreHint: '코스에 없는 곳',
      filters: [
        { id: 'must', label: '🔴 필수', test: (x) => x.tier === 'must' },
        { id: 'rec', label: '🟢 추천', test: (x) => x.tier === 'rec' },
        { id: 'opt', label: '⚪ 선택', test: (x) => x.tier === 'opt' },
        { id: 'skip', label: '🚫 이번엔 패스', test: (x) => x.tier === 'skip' },
      ],
      cols: [
        ['구분', (x) => mapTag(TIERS, x.tier)], ['종류', (x) => md(x.kindLabel || '')], ['위치', (x) => md(x.area || '')],
        ['소요', (x) => md(x.time || '')], ['난이도', (x) => md(x.difficulty || '')], [LBL.season, (x) => md(x.status || '✓ 가능')],
      ],
    }) + calloutsAfter(T.placeCallouts);
  }

  function renderStay() {
    const feat = (T.stays || []).filter((x) => x.featured);
    let h = calloutsTop(T.stayCallouts);
    if (feat.length) h += h2('⭐', '추천 후보', `${feat.length}곳`);
    return h + database('stay', {
      featured: feat.length ? (x) => !!x.featured : null,
      order: (a, b) => (a.featured || 9) - (b.featured || 9),
      moreLabel: '다른 후보',
      moreHint: '멀거나 비싸거나 조건이 안 맞는 곳',
      filters: (T.stayGroups || []).map((g) => ({ id: g.id, label: g.label, test: (x) => x.group === g.id })),
      cols: [
        ['상태', (x) => mapTag(STATUS, x.status)], ['위치', (x) => md(x.area || '')], [LBL.drive, (x) => md(x.drive || '')],
        ['가격', (x) => md(x.priceShort || x.price || '')], ['3명', (x) => md(x.beds || '')], ['부엌', (x) => md(x.kitchen || '')],
      ],
    }) + calloutsAfter(T.stayCallouts);
  }

  function renderFood() {
    const F = T.food || {};
    let h = calloutsTop(F.callouts);
    if (F.thanksgiving && F.thanksgiving.length) {
      const tgCard = (t) => `<div class="tg"><div class="tg-head"><b>${esc(t.name)}</b> ${t.state ? tag(t.state[0], t.state[1]) : ''}</div>
        ${t.price ? `<div class="tg-price">💵 ${md(t.price)}</div>` : ''}<div class="muted small">${[t.where, t.time].filter(Boolean).map(md).join(' · ')}</div>${t.note ? `<p>${md(t.note)}</p>` : ''}${linksHtml(t.links)}</div>`;
      const tf = F.thanksgiving.filter((t) => t.featured);
      const tr = F.thanksgiving.filter((t) => !t.featured);
      h += h2('🦃', F.thanksgivingTitle || 'Thanksgiving 저녁 (11/26 목)', tf.length ? (F.thanksgivingAside || '셋 중 하나') : '');
      h += `<div class="tg-list">${(tf.length ? tf : F.thanksgiving).map(tgCard).join('')}</div>`;
      if (tf.length && tr.length) h += `<details class="more-block"><summary><span class="more-title">다른 Thanksgiving 옵션 <span class="more-n">${tr.length}</span></span><span class="more-hint">멀거나 정보가 불확실한 곳</span></summary><div class="more-body"><div class="tg-list">${tr.map(tgCard).join('')}</div></div></details>`;
    }
    const ff = (F.items || []).filter((x) => x.featured);
    h += h2('🍽️', ff.length ? '목–토 동선에 맞는 곳' : '식당 · 카페 · 장보기', ff.length ? `${ff.length}곳` : '');
    const pi = planIndex();
    h += database('food', {
      badge: (x) => (pi['food:' + x.id] || []).map((o) => `Day ${o.day} · ${o.time}`).join(' / ') || x.badge,
      featured: ff.length ? (x) => !!x.featured : null,
      order: (a, b) => (a.featured || 99) - (b.featured || 99),
      moreLabel: '다른 식당 · 카페 · 마트',
      moreHint: '다른 루트 · 백업',
      filters: (T.foodGroups || []).map((g) => ({ id: g.id, label: g.label, test: (x) => x.group === g.id })),
      cols: [
        ['구분', (x) => mapTag(PICKS, x.pick)], ['위치', (x) => md(x.area || '')], ['종류', (x) => md(x.cuisine || '')],
        ['가격', (x) => md(x.price || '')], ['영업', (x) => md(x.hoursShort || x.hours || '')],
      ],
    });
    h += calloutsAfter(F.callouts);
    return h;
  }

  function renderPrep() {
    const R = T.prep || {};
    let h = calloutsTop(R.callouts);
    if (R.sections && R.sections.length) {
      h += `<div class="prep-grid">${R.sections.map((s) => `<div class="prep-card"><div class="prep-h">${esc(s.icon || '')} ${esc(s.title)}</div>${s.text ? `<p class="muted">${md(s.text)}</p>` : ''}${list(s.items)}${s.more ? toggle('더 보기', list(s.more)) : ''}${linksHtml(s.links)}</div>`).join('')}</div>`;
    }
    (R.checklists || []).forEach((c) => {
      h += h2(c.icon || '☑️', c.title);
      h += localChecklist(c.id, c.items);
    });
    h += calloutsAfter(R.callouts);
    return h;
  }

  const RENDER = { home: renderHome, course: renderCourse, places: renderPlaces, stay: renderStay, food: renderFood, prep: renderPrep };
  const body = (RENDER[PAGE] || renderHome)();
  app.innerHTML = topbar() + header() + `<main class="content">${body}</main>` + footer() + '</div>';
  applyTheme(document.documentElement.dataset.theme);

  // deep link: /places/#tunnel-view opens that item
  const kindHere = Object.keys(KINDS).find((k) => KINDS[k].page === PAGE);
  function fromHash() {
    const hid = decodeURIComponent(location.hash.slice(1));
    if (kindHere && hid && findItem(kindHere, hid)) openPeek(kindHere, hid);
  }
  fromHash();
  window.addEventListener('hashchange', fromHash);
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
})();
