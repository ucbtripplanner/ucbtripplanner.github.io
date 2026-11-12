/* UCB Trip Planner — offline support (Yosemite Valley has little or no cell signal).
 * - Site files (pages, data.js, css/js): network-first, fall back to cache → edits show up when online.
 * - Photos, fonts, Leaflet, map tiles: cache-first (stale-while-revalidate) → whatever you've seen works offline.
 * - Weather / GitHub feed: network-first, fall back to the last copy.
 * Open every page once (with signal) before driving in, and they'll all open offline.
 * Bump VERSION if you change this file's caching rules.
 */
const VERSION = 'utp-v4';
const CORE = `${VERSION}-core`;
const RUNTIME = `${VERSION}-rt`;
const MAX_RUNTIME = 600;
const PRECACHE = [
  '/', '/assets/style.css', '/assets/trip.js',
  '/2026-yosemite/', '/2026-yosemite/course/', '/2026-yosemite/places/', '/2026-yosemite/stay/',
  '/2026-yosemite/food/', '/2026-yosemite/prep/',
  '/2026-yosemite/data.js', '/2026-yosemite/images.js', '/2026-yosemite/geo.js',
  '/2026-monterey/', '/2026-monterey/course/', '/2026-monterey/places/', '/2026-monterey/stay/', '/2026-monterey/food/', '/2026-monterey/prep/', '/2026-monterey/data.js', '/2026-monterey/images.js', '/2026-monterey/geo.js',
];

self.addEventListener('install', (e) => {
  // allSettled: one missing file must not break offline support for everything else
  e.waitUntil(caches.open(CORE).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function trim() {
  const c = await caches.open(RUNTIME);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - MAX_RUNTIME; i++) await c.delete(keys[i]);
}

async function networkFirst(req, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]);
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(req);
  const refresh = fetch(req).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) { cache.put(req, res.clone()); trim(); }
    return res;
  }).catch(() => hit);
  return hit || refresh;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(networkFirst(req, CORE, 4000));
  } else if (/open-meteo\.com|api\.github\.com/.test(url.host)) {
    e.respondWith(networkFirst(req, RUNTIME, 5000));
  } else if (req.destination === 'image' || req.destination === 'font' || req.destination === 'style' || req.destination === 'script'
    || /wikimedia\.org|wsrv\.nl|imgix\.net|milestoneinternet\.com|jsdelivr\.net|cdnjs\.cloudflare\.com|tile\.openstreetmap\.org|opentopomap\.org/.test(url.host)) {
    e.respondWith(cacheFirst(req));
  }
});
