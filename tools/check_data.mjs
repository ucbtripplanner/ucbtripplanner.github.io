#!/usr/bin/env node
// Validate a trip folder's data.js (+ images.js, geo.js).
// Usage: node tools/check_data.mjs [trip-folder]   (default: 2026-yosemite)
// Exit code 1 if there are errors. Run this after every edit to data.js.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trip = process.argv[2] || '2026-yosemite';
const dir = path.join(ROOT, trip);
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['images.js', 'geo.js', 'data.js']) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) continue;
  try {
    vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: p });
  } catch (e) {
    console.error(`✗ ${f} has a syntax/runtime error:\n  ${e.message}`);
    process.exit(1);
  }
}
const T = ctx.window.TRIP;
const I = Object.assign({}, ctx.window.TRIP_IMAGES || {}, (T && T.images) || {});
const G = Object.assign({}, ctx.window.TRIP_GEO || {}, (T && T.geo) || {});
const errs = [];
const warns = [];
const err = (m) => errs.push(m);
const warn = (m) => warns.push(m);

if (!T) { console.error('✗ data.js did not set window.TRIP'); process.exit(1); }
for (const k of ['id', 'base', 'title', 'short', 'start', 'end', 'pages', 'pageOrder']) if (!T[k]) err(`missing top-level field: ${k}`);
if (T.base && !/^\/.+\/$/.test(T.base)) err(`base must look like "/${trip}/" (got ${T.base})`);
if (T.start && T.end && T.start > T.end) err('start is after end');

(T.pageOrder || []).forEach((k) => {
  const p = T.pages[k];
  if (!p) return err(`pageOrder has "${k}" but pages.${k} is missing`);
  if (p.cover && !I[p.cover]) err(`pages.${k}.cover "${p.cover}" is not in images.js`);
});

const TIERS = ['must', 'rec', 'opt', 'skip'];
const STATUS = ['cand', 'top', 'booked', 'full', 'na', 'closed'];
const PICKS = ['top', 'good', 'backup'];
const memberIds = new Set((T.members || []).map((m) => m.id));
const checkMembers = (where, ids) => (ids || []).forEach((id) => { if (!memberIds.has(id)) err(`${where}: unknown member id "${id}" (members: ${[...memberIds].join(', ')})`); });

const kinds = {
  place: T.places || [],
  stay: T.stays || [],
  food: (T.food && T.food.items) || [],
};
const ids = {};
const allLL = [];
for (const [kind, items] of Object.entries(kinds)) {
  ids[kind] = new Set();
  items.forEach((it, i) => {
    const where = `${kind}[${i}] ${it.id || '(no id)'}`;
    if (!it.id) return err(`${where}: missing id`);
    if (!/^[a-z0-9-]+$/.test(it.id)) err(`${where}: id must be lowercase letters/digits/hyphens`);
    if (ids[kind].has(it.id)) err(`${where}: duplicate id`);
    ids[kind].add(it.id);
    if (!it.name) err(`${where}: missing name`);
    if (it.img && !I[it.img]) err(`${where}: img "${it.img}" is not in images.js`);
    if (it.ll) {
      const [lat, lng] = it.ll;
      if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) err(`${where}: ll out of range ${it.ll}`);
      else allLL.push({ where, ll: it.ll });
    }
    checkMembers(where + ' votes', it.votes);
    if (kind === 'place' && it.tier && !TIERS.includes(it.tier)) err(`${where}: tier must be one of ${TIERS}`);
    if (kind === 'stay' && it.status && !STATUS.includes(it.status)) err(`${where}: status must be one of ${STATUS}`);
    if (kind === 'food' && it.pick && !PICKS.includes(it.pick)) err(`${where}: pick must be one of ${PICKS}`);
    if (kind === 'stay' && it.group && !(T.stayGroups || []).some((g) => g.id === it.group)) err(`${where}: group "${it.group}" not in stayGroups`);
    if (kind === 'food' && it.group && !(T.foodGroups || []).some((g) => g.id === it.group)) err(`${where}: group "${it.group}" not in foodGroups`);
  });
}

// pins far from the others are usually typos or swapped [lat, lng]
if (allLL.length > 3) {
  const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const c = [med(allLL.map((x) => x.ll[0])), med(allLL.map((x) => x.ll[1]))];
  const km = (a, b) => {
    const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
    return 12742 * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2));
  };
  allLL.forEach((x) => { const d = km(c, x.ll); if (d > 400) warn(`${x.where}: pin is ${Math.round(d)} km from the others — typo or swapped [lat, lng]?`); });
}

const checkRef = (where, ref) => {
  const [k, id] = String(ref).split(':');
  if (!ids[k]) return err(`${where}: ref "${ref}" — kind must be place/stay/food`);
  if (!ids[k].has(id)) err(`${where}: ref "${ref}" does not match any ${k} id`);
};
(T.courses || []).forEach((c) => {
  (c.routes || (c.route ? [c.route] : [])).forEach((r) => { if (!(G.routes || {})[r]) err(`course ${c.id}: route "${r}" not in geo.js`); });
  c.days.forEach((d, di) => d.items.forEach((it, ii) => {
    const where = `course ${c.id} day${di + 1} #${ii + 1} (${it.time || ''})`;
    if (it.ref) checkRef(where, it.ref);
    else if (!it.title) err(`${where}: needs ref or title`);
    (it.alts || []).forEach((a) => { if (a.ref) checkRef(where + ' alt', a.ref); else if (!a.title) err(`${where} alt: needs ref or title`); });
  }));
});
(T.decisions || []).forEach((d) => d.owner && checkMembers(`decision "${d.title}" owner`, [d.owner]));
(T.todo || []).forEach((t) => t.who && checkMembers(`todo "${t.text}" who`, [t.who]));

const n = (a) => a.length;
console.log(`trip ${T.id}: ${n(kinds.place)} places · ${n(kinds.stay)} stays · ${n(kinds.food)} food · ${(T.courses || []).length} plan(s) · ${Object.keys(I).length} images`);
warns.forEach((w) => console.log('⚠ ' + w));
if (errs.length) {
  errs.forEach((e) => console.log('✗ ' + e));
  console.log(`\n${errs.length} error(s)`);
  process.exit(1);
}
console.log('✓ OK');
