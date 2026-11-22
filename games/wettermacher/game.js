// Wettermacher 3D – Simulation: Insel, Dorf, Felder, Wetter, Gefahren, Wünsche, Fortschritt, Speichern
(() => {
'use strict';
const WM = window.WM, D = window.WM_DATA, W = WM.world;
const { H, isLand, clamp, lerp, sstep } = W;
const AC = window.ArcadeCore || null;
const V3 = THREE.Vector3;
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.random() * a.length | 0];
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const DEBUG = /[?&]debug\b/.test(location.search);

// =====================================================================
// Speicherstand (versioniert, jede Lese-/Schreibaktion in try/catch)
// =====================================================================
const SAVE_KEY = 'wettermacher_save', VER = 1;
const num = (v, d = 0, lo = -1e9, hi = 1e9) => Number.isFinite(+v) ? clamp(+v, lo, hi) : d;
function defaultSave() {
  return { v: VER, faith: 0, faithTotal: 0, skills: {}, unlocked: ['wiege'], cur: 'wiege', chronik: {}, hint: 0, islands: {}, stats: { clouds: 0, bolts: 0, wishes: 0, harvests: 0 }, best: 0 };
}
function sanitize(s) {
  const d = defaultSave();
  if (!s || typeof s !== 'object' || s.v !== VER) return d;
  d.faith = num(s.faith, 0, 0); d.faithTotal = num(s.faithTotal, 0, 0); d.hint = num(s.hint, 0, 0, 99) | 0; d.best = num(s.best, 0, 0);
  if (s.skills && typeof s.skills === 'object') for (const k of D.SKILLS) { const l = num(s.skills[k.id], 0, 0, k.c.length) | 0; if (l) d.skills[k.id] = l; }
  if (Array.isArray(s.unlocked)) d.unlocked = D.ISLANDS.map(i => i.id).filter(id => id === 'wiege' || s.unlocked.includes(id));
  if (d.unlocked.includes(s.cur)) d.cur = s.cur;
  if (s.chronik && typeof s.chronik === 'object') for (const [id] of D.CHRONIK) if (s.chronik[id] && typeof s.chronik[id] === 'object') d.chronik[id] = { y: num(s.chronik[id].y, 0) | 0, s: num(s.chronik[id].s, 0, 0, 3) | 0, i: String(s.chronik[id].i || '').slice(0, 20) };
  if (s.stats && typeof s.stats === 'object') for (const k in d.stats) d.stats[k] = num(s.stats[k], 0, 0);
  if (s.islands && typeof s.islands === 'object') for (const isl of D.ISLANDS) if (s.islands[isl.id] && typeof s.islands[isl.id] === 'object') d.islands[isl.id] = s.islands[isl.id];
  return d;
}
let S = defaultSave();
try { const raw = localStorage.getItem(SAVE_KEY); if (raw) S = sanitize(JSON.parse(raw)); } catch (e) { S = defaultSave(); }
function persist() {
  try { if (I) S.islands[I.def.id] = serializeIsland(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  const total = totalPop();
  if (total > S.best) { S.best = total; try { if (AC) AC.saveScore('wettermacher', total); } catch (e) {} }
}
function totalPop() { let n = 0; for (const isl of D.ISLANDS) { if (I && I.def.id === isl.id) n += I.pop; else if (S.islands[isl.id]) n += num(S.islands[isl.id].pop, 0, 0); } return Math.floor(n); }

// =====================================================================
// Fertigkeiten
// =====================================================================
const sk = id => S.skills[id] | 0;
const SKILL = id => D.SKILLS.find(s => s.id === id);
function skillState(s) {
  const l = sk(s.id); if (l >= s.c.length) return 'max';
  if (s.req) { const [rid, rl] = Array.isArray(s.req) ? s.req : [s.req, 1]; if (sk(rid) < rl) return 'locked'; }
  return S.faith >= s.c[l] ? 'buy' : 'poor';
}
function buySkill(id) {
  const s = SKILL(id); if (!s || skillState(s) !== 'buy') return false;
  S.faith -= s.c[sk(id)]; S.skills[id] = sk(id) + 1; chron('firstSkill');
  if (D.SKILLS.every(x => sk(x.id) >= x.c.length)) chron('treeDone');
  snd('powerup'); persist(); return true;
}
const powerUnlocked = p => !p.skill || sk(p.skill) > 0;
const manaMax = () => D.BAL.manaBase + 20 * sk('g1');
const cloudMax = () => D.BAL.cloudMaxBase + 2 * sk('w2');

// =====================================================================
// Inselzustand
// =====================================================================
let I = null;   // aktive Insel
const GN = 44, GS = 19, GC = 2 * GS / GN;        // Feuchte-/Schneeraster
const Wg = new Float32Array(GN * GN), Sg = new Float32Array(GN * GN), Bg = new Float32Array(GN * GN), Lg = new Uint8Array(GN * GN), shadeG = new Uint8Array(GN * GN);
const gi = (x, z) => { const i = Math.floor((x + GS) / GC), j = Math.floor((z + GS) / GC); return i < 0 || j < 0 || i >= GN || j >= GN ? -1 : j * GN + i; };
function sampleG(a, x, z) {
  const fx = (x + GS) / GC - 0.5, fz = (z + GS) / GC - 0.5; const i = Math.floor(fx), j = Math.floor(fz);
  if (i < 0 || j < 0 || i >= GN - 1 || j >= GN - 1) return 0;
  const u = fx - i, v = fz - j, k = j * GN + i;
  return lerp(lerp(a[k], a[k + 1], u), lerp(a[k + GN], a[k + GN + 1], u), v);
}
function addG(a, x, z, r, amt, lo = 0, hi = 2) {
  const i0 = Math.max(0, Math.floor((x - r + GS) / GC)), i1 = Math.min(GN - 1, Math.floor((x + r + GS) / GC));
  const j0 = Math.max(0, Math.floor((z - r + GS) / GC)), j1 = Math.min(GN - 1, Math.floor((z + r + GS) / GC));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const cx = -GS + (i + 0.5) * GC, cz = -GS + (j + 0.5) * GC, d = Math.hypot(cx - x, cz - z); if (d > r) continue;
    const k = j * GN + i; if (!Lg[k]) continue;
    a[k] = clamp(a[k] + amt * (1 - (d / r) ** 2), lo, hi);
  }
}

const SEASON = () => D.SEASONS[I.season];
function islDef(id) { return D.ISLANDS.find(i => i.id === id); }

function newIslandState(def) {
  return { id: def.id, year: 0, season: 0, t: 0, played: 0, pop: 4, food: 22, water: 40, wood: 14, happy: 60, built: [], trees: [], seeded: false, flags: {}, stats: { harvests: 0, wishes: 0 }, goal: false, plan: 0, festSeason: -1 };
}
function serializeIsland() {
  return {
    id: I.def.id, year: I.year, season: I.season, t: Math.round(I.t), played: Math.round(I.played), pop: I.pop, food: +I.food.toFixed(1), water: +I.water.toFixed(1), wood: +I.wood.toFixed(1),
    happy: +I.happy.toFixed(1), plan: I.plan, goal: I.goal, flags: I.flags, stats: I.stats, festSeason: I.festSeason, seeded: true,
    built: I.buildings.map(b => [b.t, +b.x.toFixed(2), +b.z.toFixed(2), +b.rot.toFixed(2), +b.done.toFixed(2), +b.hp.toFixed(2)]),
    fields: I.fields.map(f => [+f.x.toFixed(2), +f.z.toFixed(2), +f.rot.toFixed(2), +f.g.toFixed(2), +f.h.toFixed(2), +f.m.toFixed(2)]),
    trees: I.trees.map(t => [+t.x.toFixed(2), +t.z.toFixed(2), t.k, +t.s.toFixed(2), t.st, +t.grow.toFixed(2)]),
  };
}

// ---------- Szenenobjekte der Insel ----------
const isleObjs = new THREE.Group(); W.scene.add(isleObjs);
function clearIsland() {
  while (isleObjs.children.length) isleObjs.remove(isleObjs.children[0]);
  ['pirates', 'swarms', 'fires', 'ships', 'boats', 'fogs', 'gusts', 'reqs', 'clouds', 'bombs', 'floaters'].forEach(k => { if (G[k]) G[k].length = 0; });
  G.serpent = null; G.boss = null; G.tornado = null; G.sandstorm = null; G.events = {}; G.rainbowT = 0;
  W.bossEyes.visible = false; if (WM.ui) WM.ui.bossBar(false);
}

// Laufzeitobjekte (nicht gespeichert)
const G = {
  clouds: [], gusts: [], fogs: [], pirates: [], swarms: [], fires: [], ships: [], boats: [], reqs: [], bombs: [], floaters: [],
  serpent: null, boss: null, tornado: null, sandstorm: null, events: {}, villagers: [],
  mana: 60, wind: { x: 0.4, z: 0.2 }, millSpin: 0, lastRainT: -99, now: 0, sunbeam: null, rainbowT: 0, warmT: 0, frostT: 0,
  threatT: 200, reqT: 6, natT: 8, popT: 0, starveT: 0, buildT: 2, tickAcc: 0, tintT: 0, hintKeys: {}, speed: 1, msgQ: [],
};

function placeSpot(r, near, minD, maxD, opts = {}) {
  // sucht einen freien, flachen Platz um near (x,z) im Abstand minD..maxD
  const occ = [...I.buildings.map(b => [b.x, b.z, D.BUILD[b.t].r]), ...I.fields.map(f => [f.x, f.z, 1.6])];
  for (let tries = 0; tries < 400; tries++) {
    const a = Math.random() * Math.PI * 2, d = minD + (maxD - minD) * Math.sqrt(Math.random()) * (tries < 200 ? Math.min(1, 0.35 + tries / 200) : 1);
    const x = near[0] + Math.cos(a) * d, z = near[1] + Math.sin(a) * d, h = H(x, z);
    if (h < (opts.minH || 0.55) || (opts.maxH && h > opts.maxH)) continue;
    if (Math.hypot(x, z) > 12.5) continue;
    if (W.slope(x, z, r * 0.9) > (opts.slope || 0.45)) continue;
    if (occ.some(o => dist(o[0], o[1], x, z) < o[2] + r + 0.35)) continue;
    if (I.harbourPath && distSeg(x, z, I.harbourPath) < r + 0.6) continue;
    return [x, z];
  }
  return null;
}
function distSeg(x, z, s) { const [ax, az, bx, bz] = s, dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); return dist(x, z, ax + dx * t, az + dz * t); }
function coastPoint(ang) {
  // vom Zentrum entlang Winkel nach außen, bis Wasser
  let last = [0, 0];
  for (let r = 4; r < 19; r += 0.1) { const x = Math.cos(ang) * r, z = Math.sin(ang) * r; if (H(x, z) < 0.1) return { x, z, land: last }; last = [x, z]; }
  return { x: Math.cos(ang) * 15, z: Math.sin(ang) * 15, land: last };
}

function loadIsland(id) {
  if (I) { S.islands[I.def.id] = serializeIsland(); }
  clearIsland();
  const def = islDef(id); S.cur = id;
  W.loadIsland(def);
  const saved = S.islands[id];
  const st = saved && saved.seeded ? saved : newIslandState(def);
  I = {
    def, year: num(st.year, 0, 0) | 0, season: num(st.season, 0, 0, 3) | 0, t: num(st.t, 0, 0, D.SEASON_LEN), played: num(st.played, 0, 0), pop: num(st.pop, 4, 2, 999) | 0,
    food: num(st.food, 20, 0), water: num(st.water, 40, 0), wood: num(st.wood, 12, 0), happy: num(st.happy, 60, 0, 100), plan: num(st.plan, 0, 0) | 0, goal: !!st.goal,
    flags: st.flags && typeof st.flags === 'object' ? st.flags : {}, stats: st.stats && typeof st.stats === 'object' ? st.stats : { harvests: 0, wishes: 0 }, festSeason: num(st.festSeason, -1),
    buildings: [], fields: [], trees: [],
  };
  // Raster
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const x = -GS + (i + 0.5) * GC, z = -GS + (j + 0.5) * GC, k = j * GN + i; Lg[k] = H(x, z) > 0.2 ? 1 : 0; Wg[k] = 0.5; Sg[k] = I.season === 3 ? 0.4 : 0; Bg[k] = 0; }
  // Hafen-Achse
  const hc = coastPoint(def.cove); I.harbour = hc; I.harbourPath = [def.village[0], def.village[1], hc.land[0], hc.land[1]];
  if (saved && saved.seeded && Array.isArray(st.built)) {
    st.built.forEach(b => { if (Array.isArray(b) && D.BUILD[b[0]]) addBuilding(b[0], num(b[1]), num(b[2]), num(b[3]), num(b[4], 1, 0, 1), num(b[5], 1, 0, 1)); });
    (st.fields || []).forEach(f => { if (Array.isArray(f)) addField(num(f[0]), num(f[1]), num(f[2]), num(f[3], 0, 0, 1), num(f[4], 1, 0, 1), num(f[5], 0.5, 0, 2)); });
    (st.trees || []).forEach(t => { if (Array.isArray(t) && W.trees[t[2]]) I.trees.push({ x: num(t[0]), z: num(t[1]), k: t[2], s: num(t[3], 1, 0.3, 2), st: num(t[4], 0, 0, 2) | 0, grow: num(t[5], 1, 0, 1), burn: 0, bend: 0 }); });
  } else seedIsland();
  I.fields.forEach(f => addG(Wg, f.x, f.z, 1.6, f.m - 0.5, 0, 2));
  spawnVillagers();
  G.mana = Math.min(manaMax(), Math.max(G.mana, 50));
  G.threatT = I.played < 240 && def.id === 'wiege' ? 240 - I.played : rnd(60, 110);
  if (I.played < 5) G.reqT = 3;
  if (!S.unlocked.includes(id)) S.unlocked.push(id);
  if (S.unlocked.length > 1 && id !== 'wiege') chron('island2');
  updateTint(true);
  msg(def.e + ' ' + def.n, D.ISLAND_TXT[D.ISLANDS.indexOf(def)] + '<br>🎯 Ziel: ' + def.goalTxt, 5);
}

function seedIsland() {
  const def = I.def, v = def.village;
  addBuilding('well', v[0], v[1], 0, 1, 1);
  for (let k = 0; k < 2; k++) { const p = placeSpot(1.0, v, 1.8, 3.2); if (p) addBuilding('hut', p[0], p[1], Math.atan2(v[0] - p[0], v[1] - p[1]), 1, 1); }
  for (let k = 0; k < 2; k++) newField(true);
  // Wald: Büschel an Rändern & Hängen
  const kinds = def.trees;
  for (let c = 0; c < 9; c++) {
    let cx, cz, ok = false;
    for (let t = 0; t < 60 && !ok; t++) { const a = Math.random() * 6.28, r = rnd(5, 11.5); cx = Math.cos(a) * r; cz = Math.sin(a) * r; ok = H(cx, cz) > 0.6 && dist(cx, cz, v[0], v[1]) > 5 && distSeg(cx, cz, I.harbourPath) > 2; }
    if (!ok) continue;
    const kind = kinds[c % kinds.length];
    for (let n = 0; n < 9; n++) {
      const x = cx + rnd(-2.2, 2.2), z = cz + rnd(-2.2, 2.2);
      if (H(x, z) < 0.5 || Math.hypot(x, z) > 13 || distSeg(x, z, I.harbourPath) < 1.5) continue;
      if (I.buildings.some(b => dist(b.x, b.z, x, z) < 1.6) || I.fields.some(f => dist(f.x, f.z, x, z) < 2) || I.trees.some(t => dist(t.x, t.z, x, z) < 0.9)) continue;
      I.trees.push({ x, z, k: Math.random() < 0.8 ? kind : pick(kinds), s: rnd(0.8, 1.25), st: 0, grow: 1, burn: 0, bend: 0 });
    }
  }
  for (let n = 0; n < 10; n++) { const a = Math.random() * 6.28, r = rnd(8, 12.5), x = Math.cos(a) * r, z = Math.sin(a) * r; if (H(x, z) > 0.4) I.trees.push({ x, z, k: def.desert ? 'cactus' : 'bush', s: rnd(0.8, 1.2), st: 0, grow: 1, burn: 0, bend: 0 }); }
}

// ---------- Gebäude ----------
function addBuilding(t, x, z, rot, done = 0, hp = 1) {
  const obj = W.model(t);
  const b = { t, x, z, rot, done, hp, obj, burn: 0 };
  obj.position.set(x, t === 'harbour' ? 0 : H(x, z) - 0.05, z); obj.rotation.y = rot;
  obj.scale.setScalar(done >= 1 ? 1 : 0.01);
  if (t === 'harbour') {
    obj.add(Object.assign(W.model('boat'), {})); obj.children[obj.children.length - 1].position.set(2.2, 0, 1.2);
  }
  isleObjs.add(obj); I.buildings.push(b);
  if (t === 'mill') b.blades = obj.userData.parts.mill_blades;
  if (t === 'temple') b.vane = obj.userData.parts.temple_vane;
  return b;
}
function addField(x, z, rot, g = 0, h = 1, m = 0.5) {
  const obj = W.model('field'); obj.position.set(x, H(x, z) - 0.02, z); obj.rotation.y = rot; isleObjs.add(obj);
  const f = { x, z, rot, g, h, m, obj, sunT: 0, ripeT: 0, eaten: 0, cos: Math.cos(rot), sin: Math.sin(rot), seed: Math.random() * 100 };
  I.fields.push(f); return f;
}
function newField(instant) {
  const v = I.def.village, p = placeSpot(1.55, v, 3.5, 9.5, { slope: 0.5 });
  if (!p) return null;
  const rot = Math.atan2(p[0] - v[0], p[1] - v[1]) + (Math.random() < 0.5 ? 0 : Math.PI / 2);
  // Bäume weichen
  I.trees = I.trees.filter(t => dist(t.x, t.z, p[0], p[1]) > 1.9);
  const f = addField(p[0], p[1], rot, 0, 1, instant ? 0.22 : 0.5);
  if (!instant) { f.obj.scale.setScalar(0.01); f.building = 0; }
  return f;
}
const count = t => I.buildings.filter(b => b.t === t && b.done >= 1).length;
const has = t => count(t) > 0;
const housing = () => I.buildings.reduce((n, b) => n + (b.done >= 1 && D.BUILD[b.t].cap ? D.BUILD[b.t].cap : 0), 0);
function startConstruction() {
  if (I.buildings.some(b => b.done < 1) || I.fields.some(f => f.building !== undefined && f.building < 1)) return;
  const v = I.def.village, cap = housing();
  const can = c => I.wood >= c;
  // 1) Wohnraum
  if (I.pop >= cap - 1) {
    const huts = I.buildings.filter(b => b.t === 'hut' && b.done >= 1), houses = I.buildings.filter(b => b.t === 'house' && b.done >= 1);
    if (I.pop >= 24 && houses.length && can(D.BUILD.manor.wood) && (huts.length === 0 || Math.random() < 0.5)) return upgrade(pick(houses), 'manor');
    if (I.pop >= 9 && huts.length && can(D.BUILD.house.wood) && Math.random() < 0.6) return upgrade(pick(huts), 'house');
    if (can(D.BUILD.hut.wood)) { const p = placeSpot(1.0, v, 1.6, 5.5 + I.buildings.length * 0.12); if (p) { I.wood -= D.BUILD.hut.wood; return addBuilding('hut', p[0], p[1], Math.atan2(v[0] - p[0], v[1] - p[1]) + rnd(-0.3, 0.3), 0, 1); } }
    if (huts.length && can(D.BUILD.house.wood)) return upgrade(pick(huts), 'house');
  }
  // 2) Felder nach Bedarf
  const want = 2 + Math.floor(I.pop / 3.2);
  if (I.fields.length < want && can(D.BUILD.field.wood) && I.season !== 3) { const f = newField(false); if (f) { I.wood -= D.BUILD.field.wood; return; } }
  // 3) Bauplan: erster unerfüllter Eintrag (zählt vorhandene Gebäude → zerstörte werden neu gebaut)
  const t = nextPlan();
  if (t && can(D.BUILD[t].wood)) {
    const r = D.BUILD[t].r, tryAll = list => { for (const [c, a, b, o] of list) { const p = placeSpot(r, c, a, b, o); if (p) return p; } return null; };
    let p = null, rot = 0;
    if (t === 'harbour') { const c = I.harbour; p = [c.land[0], c.land[1]]; rot = -I.def.cove; }
    else if (t === 'temple') p = tryAll([[I.def.temple, 0, 3.5, { slope: 1.2, minH: 0.5 }], [v, 3, 11, { slope: 0.8 }], [v, 2, 12.5, { slope: 1.1 }]]);
    else if (t === 'lighthouse') { const c = coastPoint(I.def.light); p = tryAll([[[c.land[0] * 0.95, c.land[1] * 0.95], 0, 2.5, { slope: 0.9 }], [[c.land[0] * 0.8, c.land[1] * 0.8], 0, 4, { slope: 1.1 }], [v, 5, 12.5, { slope: 1.1 }]]); }
    else if (t === 'mill') p = tryAll([[v, 4, 9, { slope: 0.6, minH: 1.0 }], [v, 3, 11.5, { slope: 0.8 }]]);
    else p = tryAll([[v, 2.5, 7], [v, 2, 10, { slope: 0.6 }], [v, 1.5, 12.5, { slope: 0.9 }]]);
    if (p) {
      I.trees = I.trees.filter(tr => dist(tr.x, tr.z, p[0], p[1]) > r + 0.8);
      I.wood -= D.BUILD[t].wood;
      return addBuilding(t, p[0], p[1], t === 'harbour' ? rot : Math.atan2(v[0] - p[0], v[1] - p[1]), 0, 1);
    }
  }
}
function nextPlan() {
  const seen = {};
  for (const [t, pop] of D.PLAN) {
    seen[t] = (seen[t] || 0) + 1;
    if (I.buildings.filter(b => b.t === t).length < seen[t]) return I.pop >= pop ? t : null;
  }
  return null;
}
function upgrade(b, to) {
  I.wood -= D.BUILD[to].wood; isleObjs.remove(b.obj);
  const i = I.buildings.indexOf(b); I.buildings.splice(i, 1);
  const nb = addBuilding(to, b.x, b.z, b.rot, 0, 1); return nb;
}
function removeBuilding(b) { isleObjs.remove(b.obj); I.buildings.splice(I.buildings.indexOf(b), 1); }

// =====================================================================
// Dorfbewohner (nur Darstellung; Produktion ist abstrakt)
// =====================================================================
const CLOTH = ['#d9534f', '#4f8bd9', '#e6b84a', '#5cae5c', '#a46fd0', '#e07b39', '#3fb0a8', '#f2f2f2', '#c46a8c', '#6f8f3a'].map(h => new THREE.Color(h));
const SKIN = ['#f3d1b0', '#e8b48c', '#c98e62', '#8d5a3b', '#f7dcc4'].map(h => new THREE.Color(h));
function spawnVillagers() {
  G.villagers.length = 0;
  for (let i = 0; i < Math.min(I.pop, 150); i++) addVillager(false);
}
function addVillager(cheer) {
  const v = I.def.village, home = pick(I.buildings.filter(b => D.BUILD[b.t].cap) .concat([{ x: v[0], z: v[1] }]));
  const p = { x: home.x + rnd(-0.6, 0.6), z: home.z + rnd(-0.6, 0.6), yaw: rnd(0, 6.28), tx: 0, tz: 0, st: 'idle', t: rnd(0, 3), job: null, ph: rnd(0, 6),
    cloth: pick(CLOTH), skin: pick(SKIN), act: 'stand', home, cheer: cheer ? 3 : 0, speed: rnd(0.8, 1.1) };
  G.villagers.push(p); return p;
}
function villagerTarget(p) {
  const v = I.def.village, night = W.nightK > 0.7;
  if (G.events.fest && has('maypole')) { const m = I.buildings.find(b => b.t === 'maypole'); const a = rnd(0, 6.28); return [m.x + Math.cos(a) * 1.4, m.z + Math.sin(a) * 1.4, 'dance']; }
  if (night) { const h = p.home && p.home.x !== undefined ? p.home : { x: v[0], z: v[1] }; return [h.x + rnd(-0.5, 0.5), h.z + rnd(-0.5, 0.5), 'sleep']; }
  const r = Math.random();
  const site = I.buildings.find(b => b.done < 1) || I.fields.find(f => f.building !== undefined && f.building < 1);
  if (site && r < 0.25) return [site.x + rnd(-1, 1), site.z + rnd(-1, 1), 'build'];
  const ripe = I.fields.filter(f => f.g >= 0.98);
  if (ripe.length && r < 0.6) { const f = pick(ripe); return [f.x + rnd(-0.8, 0.8), f.z + rnd(-0.6, 0.6), 'farm']; }
  if (r < 0.45 && I.fields.length && I.season !== 3) { const f = pick(I.fields); return [f.x + rnd(-0.9, 0.9), f.z + rnd(-0.7, 0.7), 'farm']; }
  if (r < 0.62) { const t = I.trees.filter(t => t.st === 0 && dist(t.x, t.z, v[0], v[1]) < 10); if (t.length) { const tr = pick(t); return [tr.x + 0.5, tr.z + 0.3, 'chop']; } }
  if (r < 0.72 && has('harbour')) { const h = I.harbour; return [h.land[0] + rnd(-0.5, 0.5), h.land[1] + rnd(-0.5, 0.5), 'stand']; }
  if (r < 0.8 && has('mill')) { const m = I.buildings.find(b => b.t === 'mill'); return [m.x + rnd(-1, 1), m.z + rnd(-1, 1), 'stand']; }
  return [v[0] + rnd(-3.5, 3.5), v[1] + rnd(-3.5, 3.5), 'stand'];
}
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3(1, 1, 1), _p = new V3(), _c = new THREE.Color();
function updateVillagers(dt) {
  const want = Math.min(I.pop, 150);
  while (G.villagers.length < want) addVillager(true);
  while (G.villagers.length > want) G.villagers.pop();
  const parts = W.vil, piv = W.VPIV, n = G.villagers.length;
  for (let i = 0; i < n; i++) {
    const p = G.villagers[i];
    p.t -= dt;
    if (p.st === 'walk') {
      const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.1) { p.st = 'work'; p.t = rnd(3, 7); }
      else { const sp = 0.9 * p.speed * Math.min(1, d * 3); p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; const ty = Math.atan2(dx, dz); p.yaw += Math.atan2(Math.sin(ty - p.yaw), Math.cos(ty - p.yaw)) * Math.min(1, dt * 8); }
      if (p.t < -15) { p.st = 'work'; p.t = 1; }
    } else if (p.t <= 0) {
      const [tx, tz, act] = villagerTarget(p);
      if (H(tx, tz) > 0.3) { p.tx = tx; p.tz = tz; p.act = act; p.st = 'walk'; p.t = 0; }
      else p.t = 1;
    }
    p.ph += dt * (p.st === 'walk' ? 9 * p.speed : 5);
    if (p.cheer > 0) p.cheer -= dt;
    // Pose
    let legA = 0, armA = 0, armB = 0, bob = 0, hide = false;
    if (p.st === 'walk') { legA = Math.sin(p.ph) * 0.6; armA = -legA * 0.8; armB = -armA; bob = Math.abs(Math.sin(p.ph)) * 0.03; }
    else if (p.cheer > 0 || p.act === 'dance' || G.rainbowT > 0 && p.act !== 'sleep') { armA = armB = -2.7 + Math.sin(p.ph * 2) * 0.3; bob = Math.abs(Math.sin(p.ph * 1.5)) * 0.12; if (p.act === 'dance') p.yaw += dt * 2; }
    else if (p.act === 'chop' || p.act === 'build') { armA = armB = -1.3 + Math.sin(p.ph * 2.2) * 0.9; }
    else if (p.act === 'farm') { armA = armB = -0.6 + Math.sin(p.ph * 1.6) * 0.4; bob = -0.02; }
    else if (p.act === 'sleep' && p.st === 'work') hide = true;
    const y = H(p.x, p.z) + bob;
    _q.setFromAxisAngle(THREE.Object3D.DefaultUp, p.yaw);
    const base = _m.compose(_p.set(p.x, y, p.z), _q, hide ? _s.set(0, 0, 0) : _s.set(1.55, 1.55, 1.55));
    const ang = [0, 0, armB, armA, legA, -legA];
    for (let k = 0; k < 6; k++) {
      _e.set(ang[k], 0, 0); _q.setFromEuler(_e);
      _m2.compose(_p.copy(piv[k]), _q, _s.set(1, 1, 1));
      parts[k].setMatrixAt(i, _m2.premultiply(base));
      parts[k].setColorAt(i, k === 1 ? p.skin : k >= 4 ? _c.set(0xffffff) : p.cloth);
    }
  }
  for (const im of parts) { im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
}

// =====================================================================
// Wolken
// =====================================================================
function newCloud(x, z, w, opt = {}) {
  const c = { x, z, w, vx: 0, vz: 0, natural: !!opt.natural, storm: !!opt.storm, raining: false, snowing: false, hail: false, fade: 0, age: 0, charge: 0, strikeT: rnd(6, 12), puffs: [], id: Math.random(), boss: !!opt.boss, held: false, rainAcc: 0 };
  const n = opt.boss ? 22 : 9;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + rnd(-0.3, 0.3), r = i === 0 ? 0 : rnd(0.45, 1.05) * (opt.boss ? 1.4 : 1);
    c.puffs.push({ ox: Math.cos(a) * r, oz: Math.sin(a) * r * 0.75, oy: rnd(-0.1, 0.35) - r * 0.18, s: (i === 0 ? 0.85 : rnd(0.45, 0.7)) * (opt.boss ? 1.4 : 1), ph: rnd(0, 6) });
  }
  G.clouds.push(c); return c;
}
const cloudR = c => (1.0 + c.w * 2.3) * (c.boss ? 1.8 : 1);
const playerClouds = () => G.clouds.filter(c => !c.natural && !c.boss && c.fade === 0).length;
function cloudAt(x, z, ignoreLand) {
  let best = null, bd = 1e9;
  for (const c of G.clouds) { if (c.fade || c.boss) continue; const d = dist(c.x, c.z, x, z); if (d < cloudR(c) + 0.6 && d < bd) { bd = d; best = c; } }
  return best;
}
function updateClouds(dt) {
  const ss = SEASON();
  for (let i = G.clouds.length - 1; i >= 0; i--) {
    const c = G.clouds[i]; c.age += dt;
    if (c.flung > 0) { c.flung -= dt; c.w = Math.max(0, c.w - dt * 0.4); }
    if (!c.held) {
      const damp = c.flung > 0 ? 0.08 : 0.4;
      c.vx += (G.wind.x * (c.natural ? 0.9 : 0.25) - c.vx) * dt * damp; c.vz += (G.wind.z * (c.natural ? 0.9 : 0.25) - c.vz) * dt * damp;
      c.x += c.vx * dt; c.z += c.vz * dt;
    }
    const over = isLand(c.x, c.z), cr = cloudR(c);
    // natürlicher Regen schwerer Wolken
    const autoRain = !c.held && (c.w > 1.02 || (c.natural && c.w > 0.55 && over && Math.sin(c.age * 0.7 + c.id * 9) > -0.2));
    const raining = (c.raining || autoRain) && c.w > 0.04 && !c.fade;
    c.isRaining = raining && !c.snowing && !c.hail; c.isSnowing = c.snowing && c.w > 0.04 && !c.fade; c.isHail = c.hail && c.w > 0.04;
    const prec = c.isRaining || c.isSnowing || c.isHail;
    if (prec) {
      const rate = (c.raining || c.snowing || c.hail ? 1 : (c.storm ? 0.9 : 0.55)) * (c.boss ? 0 : 1);
      c.w = Math.max(0, c.w - D.BAL.rainUse * rate * dt * (c.natural ? 0.6 : 1));
      const r = cr * (sk('w3') ? 1.25 : 1) * 0.85;
      if (c.isRaining) {
        const amt = D.BAL.rainRate * rate * dt * (sk('w3') ? 0.82 : 1);
        addG(Wg, c.x, c.z, r, amt, 0, 2); addG(Sg, c.x, c.z, r, -amt * 2, 0, 1);
        if (over) { I.water = Math.min(waterCap(), I.water + 3.2 * rate * dt); G.lastRainT = G.now; c.rainAcc += dt; }
        if (c.raining && over) { chron('firstRain'); hintDone('rain'); }
        // Feuer löschen
        for (const f of G.fires) if (dist(f.x, f.z, c.x, c.z) < r) f.int -= 0.55 * dt * rate;
        if (I.def.volcano && G.events.volcano && dist(c.x, c.z, I.def.volcano[0], I.def.volcano[1]) < r + 1) G.events.volcano -= dt * 2;
      } else if (c.isSnowing) {
        addG(Sg, c.x, c.z, r, 0.16 * dt, 0, 1); addG(Wg, c.x, c.z, r, 0.02 * dt, 0, 2);
        for (const f of G.fires) if (dist(f.x, f.z, c.x, c.z) < r) f.int -= 1.1 * dt;
        for (const s of G.swarms) if (dist(s.x, s.z, c.x, c.z) < r + 1) s.n -= s.n * 0.6 * dt + dt * 2;
        if (dist(c.x, c.z, I.def.village[0], I.def.village[1]) < r + 2) G.frostT = 60;
        if (I.season !== 3) for (const f of I.fields) if (dist(f.x, f.z, c.x, c.z) < r && f.g > 0.05) f.h = Math.max(0, f.h - 0.02 * dt);
      } else if (c.isHail) {
        for (const s of G.swarms) if (dist(s.x, s.z, c.x, c.z) < r + 1) s.n -= s.n * 0.8 * dt + dt * 3;
        for (const pr of G.pirates) if (dist(pr.x, pr.z, c.x, c.z) < r + 1.5) pr.hp -= 0.35 * dt;
        for (const f of I.fields) if (dist(f.x, f.z, c.x, c.z) < r) f.h = Math.max(0, f.h - 0.05 * dt);
      }
    }
    // Gewitterwolken laden Spannung
    if (c.w >= 0.6) c.charge = Math.min(1, c.charge + dt * 0.25); else c.charge = Math.max(0, c.charge - dt * 0.2);
    if (c.storm && !c.fade && c.w > 0.45 && over) {
      c.strikeT -= dt;
      if (c.strikeT <= 0) { c.strikeT = rnd(7, 13); const a = rnd(0, 6.28), r = rnd(0, cr); strike(c, c.x + Math.cos(a) * r, c.z + Math.sin(a) * r, true); }
    }
    // Verdunstung über Land in praller Sonne, Auflösung
    if (c.fade) { c.fade += dt; if (c.fade > 1.5) { G.clouds.splice(i, 1); continue; } }
    else if (c.w <= 0.03 && !c.held && c.age > 2) c.fade = 0.01;
    if (Math.hypot(c.x, c.z) > 52 && !c.fade) c.fade = 0.01;
    if (c.natural && c.age > 140 && !c.fade) c.fade = 0.01;
  }
  // natürliche Wolken
  G.natT -= dt;
  if (G.natT <= 0) {
    const k = ss.clouds * I.def.natClouds * (G.events.drought ? 0 : 1);
    G.natT = rnd(9, 20) / Math.max(0.2, k);
    const nat = G.clouds.filter(c => c.natural).length;
    if (k > 0 && nat < 1 + Math.round(3 * k)) {
      const wa = Math.atan2(G.wind.z, G.wind.x) + Math.PI + rnd(-0.6, 0.6);
      newCloud(Math.cos(wa) * 34, Math.sin(wa) * 34, rnd(0.25, 0.75) * (I.def.desert ? 0.6 : 1), { natural: true });
    }
  }
}
function drawClouds(time) {
  const im = W.puffs; let n = 0;
  for (const c of G.clouds) {
    const sc = (0.75 + c.w * 1.35) * (c.fade ? Math.max(0, 1 - c.fade / 1.5) : Math.min(1, c.age * 2 + 0.2)) * (c.boss ? 1.3 : 1);
    const dark = clamp((c.w - 0.35) / 0.75, 0, 1), flick = c.charge >= 1 && Math.random() < 0.04 ? 1 : 0;
    const base = c.boss ? 0.28 : 1 - dark * 0.62;
    const y = D.CLOUD_Y + Math.sin(time * 0.6 + c.id * 20) * 0.2 + (c.boss ? 1 : 0) - (c.held ? 0 : 0);
    for (const p of c.puffs) {
      if (n >= 260) break;
      const s = p.s * sc * (1 + Math.sin(time * 0.8 + p.ph) * 0.04) * (c.held ? 1.06 : 1);
      _q.identity();
      im.setMatrixAt(n, _m.compose(_p.set(c.x + p.ox * sc, y + p.oy * sc, c.z + p.oz * sc), _q, _s.set(s * 1.15, s * 0.82, s)));
      const sel = c === WM.hoverCloud ? 0.08 : 0;
      im.setColorAt(n, flick ? _c.setRGB(1.2, 1.2, 1.4) : c.boss ? (G.boss && G.boss.eye ? _c.setRGB(0.22 + Math.sin(time * 9 + p.ph) * 0.08, 0.04, 0.08) : _c.setRGB(0.07, 0.05, 0.11)) : _c.setRGB(base + sel, base + sel, Math.min(1.1, base * 1.04 + 0.03 + sel)));
      n++;
    }
  }
  im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
}

// =====================================================================
// Kräfte (von ui.js aufgerufen)
// =====================================================================
function spend(n) { if (G.mana < n) { WM.ui && WM.ui.noMana(); return false; } G.mana -= n; return true; }
const P = {};
// Wolke: Feuchte sammeln (dx = Weglänge in Welteinheiten)
P.gather = (c, x, z, d, dt) => {
  if (!c) {
    if (playerClouds() >= cloudMax()) { WM.ui.toast('☁️ Höchstens ' + cloudMax() + ' eigene Wolken – mehr im Himmelsbaum.'); return null; }
    c = newCloud(x, z, 0.08); chron('firstCloud'); S.stats.clouds++;
  }
  c.x = x; c.z = z;
  if (!isLand(x, z) && Math.hypot(x, z) < 50) {
    const gain = (d * 0.022 + dt * 0.08) * (1 + 0.3 * sk('w1')) * (I.def.desert ? 0.75 : 1) * (I.def.tropical ? 1.15 : 1);
    if (c.w < 1.3 && spend(d * D.POWERS[0].costD + dt * 0.4)) {
      c.w = Math.min(1.3, c.w + gain);
      if (Math.random() < 0.6 + d) emitVapor(x, z, c);
      if (c.w > 0.45) hintDone('cloud');
    }
  }
  return c;
};
P.rain = (c, on, dt) => { if (!c) return; if (on && !spend(D.POWERS[1].costS * dt)) on = false; c.raining = on; };
P.snow = (c, on, dt) => { if (!c) return; if (on && !spend(D.POWERS[5].costS * dt)) on = false; c.snowing = on; };
P.hail = (c, on, dt) => { if (!c || c.w < 0.6) return false; if (on && !spend(3 * dt)) on = false; c.hail = on; return true; };
P.flick = (c, vx, vz) => {
  if (!c || c.boss) return;
  if (!spend(D.POWERS[2].cost)) return;
  c.vx = vx; c.vz = vz; c.held = false; c.flung = 2.5; c.fade = c.natural || c.w < 0.4 ? 0 : 0; c.dissolve = 1;
  hintDone('sun'); snd('jump');
};
P.sunbeam = (x, z, dt) => {
  if (!spend(D.POWERS[2].costS * dt * (1 - 0.12 * sk('s1')))) { G.sunbeam = null; return; }
  G.sunbeam = { x, z, t: G.now }; hintDone('sun');
};
P.gust = (x, z, dx, dz, len) => {
  if (!spend(len * D.POWERS[3].costD)) return;
  const L = Math.hypot(dx, dz) || 1, str = clamp(len * 1.4, 2, 14) * (1 + 0.3 * sk('v1'));
  G.gusts.push({ x, z, dx: dx / L, dz: dz / L, str, r: 2.6 * (1 + 0.3 * sk('v1')), t: 0, life: 0.9 });
  for (let i = 0; i < 4; i++) emitStreak(x + rnd(-1, 1), H(x, z) + rnd(0.8, 3), z + rnd(-1, 1), dx / L, dz / L);
  hintDone('wind');
};
P.bolt = (x, z) => {
  const range = 7 + 3 * sk('b1');
  let best = null, bd = 1e9;
  for (const c of G.clouds) { if (c.fade || c.w < 0.6 || c.boss) continue; const d = dist(c.x, c.z, x, z); if (d < range && d < bd) { bd = d; best = c; } }
  if (!best) { WM.ui.toast('⚡ Keine dunkle Gewitterwolke in Reichweite. Lade eine Wolke über dem Meer schwer auf.'); return false; }
  if (!spend(D.POWERS[4].cost)) return false;
  const sc = [1.6, 0.8, 0.3][sk('b1')], a = rnd(0, 6.28), r = rnd(0, sc);
  strike(best, x + Math.cos(a) * r, z + Math.sin(a) * r, false);
  hintDone('bolt'); return true;
};
P.rainbow = () => {
  if (G.now - G.lastRainT > 30) { WM.ui.toast('🌈 Ein Regenbogen braucht einen frischen Schauer über der Insel.'); return false; }
  if (W.nightK > 0.6) { WM.ui.toast('🌈 Nachts gibt es keine Regenbögen.'); return false; }
  if (G.rainbowT > 0) return false;
  if (!spend(D.POWERS[6].cost)) return false;
  G.rainbowT = 18; chron('rainbow');
  I.happy = Math.min(100, I.happy + 12); G.wishBoost = Math.min(30, (G.wishBoost || 0) + 10);
  addFaith(8 * (sk('s5') ? 2 : 1), 0, 9, 0);
  if (has('harbour') && !G.ships.length) spawnTrade(true);
  fulfil('rainbow'); snd('powerup'); return true;
};
P.fog = (x, z) => {
  if (!spend(D.POWERS[7].costD * 1.2)) return;
  G.fogs.push({ x, z, s: rnd(1.4, 2.2), t: 0, life: 45, vx: 0, vz: 0 });
};
P.tornado = (x, z, on, dt) => {
  if (on && !G.tornado) { if (!spend(D.POWERS[8].cost)) return; G.tornado = { x, z, tx: x, tz: z, t: 0 }; chron('tornado'); cameraShake(0.4); }
  if (!G.tornado) return;
  if (!on) { G.tornado.end = true; return; }
  G.tornado.tx = x; G.tornado.tz = z;
  if (!spend(D.POWERS[8].costS * dt)) G.tornado.end = true;
};

// =====================================================================
// Blitz
// =====================================================================
function strike(c, x, z, natural) {
  const gy = Math.max(0, H(x, z)), from = new V3(c.x, D.CLOUD_Y - 0.3, c.z), to = new V3(x, gy, z);
  W.bolt(from, to, 2);
  c.w = Math.max(0, c.w - (natural ? 0.12 : 0.2)); c.charge = 0;
  if (!natural) { S.stats.bolts++; chron('firstBolt'); }
  const camD = W.camera.position.distanceTo(to);
  WM.audio && WM.audio.thunder(camD, natural);
  if (WM.ui) WM.ui.flash(natural ? 0.35 : 0.5);
  cameraShake(0.15);
  let hit = false;
  const hitThreat = (cx, cz) => {
    for (const pr of G.pirates) if (pr.state !== 'sink' && dist(pr.x, pr.z, cx, cz) < 2.4) { pr.hp -= 1; pr.hitT = 1; hit = true; if (sk('b4') && pr.state === 'approach') pr.state = 'flee'; return pr; }
    if (G.serpent && G.serpent.state !== 'dive' && dist(G.serpent.x, G.serpent.z, cx, cz) < 3) { G.serpent.hp -= 1; G.serpent.hitT = 1; hit = true; return G.serpent; }
    for (const s of G.swarms) if (dist(s.x, s.z, cx, cz) < 2.8) { s.n *= 0.3; s.n -= 4; hit = true; return s; }
    if (G.boss && G.boss.eye && dist(G.boss.x, G.boss.z, cx, cz) < 4.5) { G.boss.hp -= 1; G.boss.hitT = 1; G.boss.eye = 0; hit = true; return G.boss; }
    return null;
  };
  const first = natural ? null : hitThreat(x, z);
  if (first && sk('b2')) {
    const cand = [...G.pirates, ...G.swarms, G.serpent].filter(t => t && t !== first && dist(t.x, t.z, x, z) < 10);
    if (cand.length) { const t = cand[0]; W.bolt(to.clone().setY(gy + 1), new V3(t.x, 0.5, t.z), 1); hitThreat(t.x, t.z); }
  }
  if (hit) return;
  // Kollateralschäden
  if (gy > 0.2) {
    for (const t of I.trees) if (t.st === 0 && dist(t.x, t.z, x, z) < 1.4 && Math.random() < 0.75) { ignite(t.x, t.z, 'tree', t); break; }
    const b = I.buildings.find(b => dist(b.x, b.z, x, z) < D.BUILD[b.t].r + 0.4);
    if (b) {
      if (sk('b5') && !natural) { const tmp = I.buildings.find(t => t.t === 'temple'); if (tmp) W.bolt(new V3(x, 6, z), new V3(tmp.x, H(tmp.x, tmp.z) + 3.2, tmp.z), 0); }
      else { ignite(b.x, b.z, 'bld', b); I.happy = Math.max(0, I.happy - 6); G.disaster = (G.disaster || 0) + 8; complain('bolt', b.x, b.z); }
    }
    for (const f of I.fields) if (dist(f.x, f.z, x, z) < 1.8) { f.h = Math.max(0, f.h - 0.4); addG(Bg, x, z, 1.2, 0.8, 0, 1); }
    for (const p of G.villagers) if (dist(p.x, p.z, x, z) < 2.5) { p.cheer = 0; p.st = 'work'; p.t = 0.1; }
  }
}
function ignite(x, z, kind, ref) {
  if (G.fires.length > 40 || G.fires.some(f => f.ref === ref)) return;
  G.fires.push({ x, z, kind, ref, int: 0.35, t: 0, spreadT: rnd(2, 4) });
  if (!G.reqs.some(r => r.type === 'fire')) addReq('fire', { x, z }, 70, 6);
}

// =====================================================================
// Partikel-Emitter
// =====================================================================
function emitVapor(x, z, c) {
  for (const v of W.vaps) if (!v.alive) { Object.assign(v, { alive: true, x: x + rnd(-1.2, 1.2), y: 0.2, z: z + rnd(-1.2, 1.2), c, t: 0 }); return; }
}
function emitStreak(x, y, z, dx, dz) {
  for (const s of W.wss) if (!s.alive) { Object.assign(s, { alive: true, x, y, z, dx, dz, t: 0, life: rnd(0.6, 1.1), sp: rnd(9, 15) }); return; }
}
function burst(x, y, z, col, n = 14, up = 3) {
  for (let i = 0; i < n; i++) G.floaters.push({ x, y, z, vx: rnd(-1.5, 1.5), vy: rnd(1, up), vz: rnd(-1.5, 1.5), t: 0, life: rnd(0.8, 1.5), col: col.isColor ? col : new THREE.Color(col) });
}
function cameraShake(a) { W.cam.shake = Math.max(W.cam.shake, a); }

function updateParticles(dt, time) {
  // Regen: Tropfen den regnenden Wolken zuordnen
  const rainers = G.clouds.filter(c => c.isRaining || c.isHail);
  const snowers = G.clouds.filter(c => c.isSnowing);
  const blizz = G.events.blizzard > 0;
  const rp = W.rainPos, rc = W.rainCol;
  let ri = 0;
  for (const d of W.drops) {
    if (!d.alive) {
      if (rainers.length && Math.random() < 0.35) {
        const c = rainers[ri++ % rainers.length], r = cloudR(c) * 0.85 * Math.sqrt(Math.random()), a = Math.random() * 6.28;
        d.x = c.x + Math.cos(a) * r; d.z = c.z + Math.sin(a) * r; d.y = D.CLOUD_Y - 0.4 - Math.random() * 1.5; d.vy = c.isHail ? 26 : rnd(17, 22); d.alive = true; d.hail = c.isHail;
        d.gy = Math.max(0, H(d.x, d.z));
      }
    }
    if (d.alive) { d.y -= d.vy * dt; d.x += G.wind.x * dt * 0.6; d.z += G.wind.z * dt * 0.6; if (d.y <= d.gy) { d.alive = false; d.y = -99; } }
  }
  for (let i = 0; i < W.drops.length; i++) {
    const d = W.drops[i], o = i * 6;
    if (d.alive) {
      const len = d.hail ? 0.18 : 0.55;
      rp[o] = d.x; rp[o + 1] = d.y; rp[o + 2] = d.z; rp[o + 3] = d.x - G.wind.x * 0.02; rp[o + 4] = d.y + len; rp[o + 5] = d.z - G.wind.z * 0.02;
      const k = d.hail ? 1 : 0.75; rc[o] = rc[o + 3] = 0.62 * k + (d.hail ? 0.3 : 0); rc[o + 1] = rc[o + 4] = 0.75 * k + (d.hail ? 0.2 : 0); rc[o + 2] = rc[o + 5] = 0.95;
    } else { rp[o + 1] = rp[o + 4] = -99; }
  }
  W.rainGeo.attributes.position.needsUpdate = true; W.rainGeo.attributes.color.needsUpdate = true;
  // Schnee
  const sp = W.snowPos, sc = W.snowCol; let si = 0;
  const winterSky = I.season === 3 && !I.def.tropical && !I.def.desert ? 0.06 : 0;
  for (let i = 0; i < W.flakes.length; i++) {
    const f = W.flakes[i];
    if (!f.alive) {
      if (snowers.length && Math.random() < 0.3) { const c = snowers[si++ % snowers.length], r = cloudR(c) * 0.9 * Math.sqrt(Math.random()), a = Math.random() * 6.28; Object.assign(f, { x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r, y: D.CLOUD_Y - 0.5, vy: rnd(1.6, 2.6), alive: true }); }
      else if ((blizz || Math.random() < winterSky) && Math.random() < (blizz ? 0.5 : 0.03)) Object.assign(f, { x: rnd(-18, 18), z: rnd(-18, 18), y: rnd(8, 14), vy: rnd(1.2, 2.2) * (blizz ? 2 : 1), alive: true });
    }
    if (f.alive) {
      f.y -= f.vy * dt; f.x += (Math.sin(time * 1.3 + f.ph) * 0.4 + G.wind.x * (blizz ? 3 : 0.8)) * dt; f.z += (Math.cos(time * 1.1 + f.ph) * 0.4 + G.wind.z * (blizz ? 3 : 0.8)) * dt;
      if (f.y < Math.max(0, H(f.x, f.z))) f.alive = false;
    }
    sp[i * 3] = f.x; sp[i * 3 + 1] = f.alive ? f.y : -99; sp[i * 3 + 2] = f.z; sc[i * 3] = sc[i * 3 + 1] = sc[i * 3 + 2] = 1;
  }
  W.snowGeo.attributes.position.needsUpdate = true;
  // Dampf: steigt vom Meer in die Wolke
  const vp = W.vapPos, vc = W.vapCol;
  for (let i = 0; i < W.vaps.length; i++) {
    const v = W.vaps[i];
    if (v.alive) {
      v.t += dt * 1.6; const c = v.c;
      if (v.t >= 1 || !c) { v.alive = false; }
      else { v.x += (c.x - v.x) * dt * 2.2; v.z += (c.z - v.z) * dt * 2.2; v.y = lerp(0.2, D.CLOUD_Y - 0.5, v.t * v.t); }
    }
    vp[i * 3] = v.x; vp[i * 3 + 1] = v.alive ? v.y : -99; vp[i * 3 + 2] = v.z;
    const k = v.alive ? Math.sin(v.t * Math.PI) * 0.7 : 0; vc[i * 3] = k * 0.75; vc[i * 3 + 1] = k * 0.9; vc[i * 3 + 2] = k;
  }
  W.vapGeo.attributes.position.needsUpdate = true; W.vapGeo.attributes.color.needsUpdate = true;
  // Windstreifen
  const wp = W.wsPos, wc = W.wsCol;
  for (let i = 0; i < W.wss.length; i++) {
    const s = W.wss[i], o = i * 6;
    if (s.alive) { s.t += dt; s.x += s.dx * s.sp * dt; s.z += s.dz * s.sp * dt; if (s.t > s.life) s.alive = false; }
    const k = s.alive ? Math.sin(s.t / s.life * Math.PI) * 0.8 : 0, L = 1.6;
    wp[o] = s.x; wp[o + 1] = s.alive ? s.y : -99; wp[o + 2] = s.z; wp[o + 3] = s.x - s.dx * L; wp[o + 4] = s.alive ? s.y + Math.sin(s.t * 6) * 0.1 : -99; wp[o + 5] = s.z - s.dz * L;
    wc[o] = wc[o + 1] = wc[o + 2] = k; wc[o + 3] = wc[o + 4] = wc[o + 5] = 0;
  }
  W.wsGeo.attributes.position.needsUpdate = true; W.wsGeo.attributes.color.needsUpdate = true;
  // Funken/Konfetti
  const im = W.dustIM; let n = 0;
  for (let i = G.floaters.length - 1; i >= 0; i--) {
    const f = G.floaters[i]; f.t += dt; if (f.t > f.life) { G.floaters.splice(i, 1); continue; }
    f.vy -= 5 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt;
    if (n < 200) { const s = (1 - f.t / f.life) * 0.9; im.setMatrixAt(n, _m.compose(_p.set(f.x, f.y, f.z), _q.identity(), _s.set(s, s, s))); im.setColorAt(n, f.col); n++; }
  }
  im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
}

// =====================================================================
// Böen, Nebel, Tornado, Sonnenstrahl
// =====================================================================
function updateGusts(dt) {
  for (let i = G.gusts.length - 1; i >= 0; i--) {
    const g = G.gusts[i]; g.t += dt; if (g.t > g.life) { G.gusts.splice(i, 1); continue; }
    g.x += g.dx * 9 * dt; g.z += g.dz * 9 * dt;
    const f = g.str * dt * (1 - g.t / g.life);
    if (Math.random() < 0.5) emitStreak(g.x + rnd(-g.r, g.r) * 0.5, Math.max(0.3, H(g.x, g.z)) + rnd(0.5, 2.5), g.z + rnd(-g.r, g.r) * 0.5, g.dx, g.dz);
    for (const c of G.clouds) if (!c.boss && dist(c.x, c.z, g.x, g.z) < g.r + cloudR(c)) { c.vx += g.dx * f * 0.55; c.vz += g.dz * f * 0.55; if (c.held) { c.held = false; } }
    for (const s of [...G.pirates, ...G.ships]) if (dist(s.x, s.z, g.x, g.z) < g.r + 1.5) { s.vx = (s.vx || 0) + g.dx * f * 0.6; s.vz = (s.vz || 0) + g.dz * f * 0.6; }
    for (const s of G.swarms) if (dist(s.x, s.z, g.x, g.z) < g.r + 2) { s.vx += g.dx * f * 0.9; s.vz += g.dz * f * 0.9; s.pushed = 2; }
    for (const fg of G.fogs) if (dist(fg.x, fg.z, g.x, g.z) < g.r + 1) { fg.vx += g.dx * f * 0.4; fg.vz += g.dz * f * 0.4; }
    for (const fi of G.fires) if (dist(fi.x, fi.z, g.x, g.z) < g.r + 1) { fi.int += 0.15 * f; fi.fan = 2; fi.fdx = g.dx; fi.fdz = g.dz; }
    if (G.sandstorm && distSeg(g.x, g.z, G.sandstorm.seg) < g.r + 2) { const d = g.dx * G.sandstorm.dx + g.dz * G.sandstorm.dz; if (d < -0.3) { G.sandstorm.str -= f * 0.03; G.sandstorm.push = 1; } }
    const mill = I.buildings.find(b => b.t === 'mill' && b.done >= 1);
    if (mill && dist(mill.x, mill.z, g.x, g.z) < g.r + 1.5) G.millSpin = Math.min(1, G.millSpin + f * 0.08);
    if (sk('v3') && Math.random() < dt * 1.2) {
      const near = I.trees.find(t => t.st === 0 && dist(t.x, t.z, g.x, g.z) < g.r);
      if (near) { const x = near.x + g.dx * rnd(1.2, 2.6) + rnd(-0.6, 0.6), z = near.z + g.dz * rnd(1.2, 2.6) + rnd(-0.6, 0.6); if (canTree(x, z)) I.trees.push({ x, z, k: near.k, s: rnd(0.8, 1.2), st: 0, grow: 0.1, burn: 0, bend: 0 }); }
    }
  }
  // Nebel
  for (let i = G.fogs.length - 1; i >= 0; i--) {
    const f = G.fogs[i]; f.t += dt; f.x += (f.vx + G.wind.x * 0.2) * dt; f.z += (f.vz + G.wind.z * 0.2) * dt; f.vx *= 1 - dt; f.vz *= 1 - dt;
    if (G.sunbeam && dist(f.x, f.z, G.sunbeam.x, G.sunbeam.z) < 3) f.t += dt * 6;
    if (W.nightK > 0.5 && isLand(f.x, f.z)) addG(Wg, f.x, f.z, f.s, 0.006 * dt, 0, 0.9);
    if (f.t > f.life) G.fogs.splice(i, 1);
  }
  // Tornado
  const T = G.tornado;
  if (T) {
    T.t += dt; const dx = T.tx - T.x, dz = T.tz - T.z, d = Math.hypot(dx, dz);
    if (d > 0.05) { const sp = Math.min(d, 7 * dt); T.x += dx / d * sp; T.z += dz / d * sp; }
    if (T.end || T.t > 9) { T.fade = (T.fade || 0) + dt; if (T.fade > 1) G.tornado = null; }
    const R = 2.4;
    for (const p of G.pirates) if (dist(p.x, p.z, T.x, T.z) < R + 1) p.hp -= dt * 2;
    if (G.serpent && dist(G.serpent.x, G.serpent.z, T.x, T.z) < R + 2) G.serpent.hp -= dt * 1.2;
    for (const s of G.swarms) if (dist(s.x, s.z, T.x, T.z) < R + 1.5) s.n -= dt * 20;
    for (const c of G.clouds) if (!c.boss && dist(c.x, c.z, T.x, T.z) < 6) { c.vx += (T.x - c.x) * dt; c.vz += (T.z - c.z) * dt; }
    if (G.boss && dist(G.boss.x, G.boss.z, T.x, T.z) < 4 && G.boss.eye) { G.boss.hp -= dt * 0.6; }
    for (const t of I.trees) if (t.st === 0 && dist(t.x, t.z, T.x, T.z) < R * 0.8) { t.st = 1; t.grow = 0; burst(t.x, H(t.x, t.z) + 1, t.z, 0x4e8a2e, 6, 5); }
    for (const b of I.buildings) if (dist(b.x, b.z, T.x, T.z) < R * 0.7 + D.BUILD[b.t].r && b.done >= 1) { b.hp -= dt * 0.35; G.disaster = (G.disaster || 0) + dt * 3; if (Math.random() < dt * 3) burst(b.x, H(b.x, b.z) + 1, b.z, 0x9a6434, 3, 5); }
    for (const f of I.fields) if (dist(f.x, f.z, T.x, T.z) < R) { f.g = Math.max(0, f.g - dt * 0.4); }
  }
}
function canTree(x, z) {
  return H(x, z) > 0.45 && Math.hypot(x, z) < 13 && !I.buildings.some(b => dist(b.x, b.z, x, z) < D.BUILD[b.t].r + 0.5) && !I.fields.some(f => dist(f.x, f.z, x, z) < 1.9) &&
    !I.trees.some(t => dist(t.x, t.z, x, z) < 0.8) && distSeg(x, z, I.harbourPath) > 1.2 && I.trees.length < 210;
}

// =====================================================================
// Gefahren
// =====================================================================
function announce(key, x, z) { const t = D.THREAT_TXT[key]; if (t) msg(t[0], t[1], 4); WM.audio && WM.audio.alarm(); if (x !== undefined) WM.ui && WM.ui.warnAt(x, z); hintDone('season'); }
function startThreat(type) {
  const def = I.def, v = def.village;
  if (type === 'locusts') {
    const a = rnd(0, 6.28); G.swarms.push({ x: Math.cos(a) * 30, z: Math.sin(a) * 30, vx: 0, vz: 0, n: 34 + Math.min(30, I.pop), target: null, t: 0, pts: [] });
    announce('locusts', Math.cos(a) * 18, Math.sin(a) * 18); addReq('locusts', { x: v[0], z: v[1] }, 90, 10);
  } else if (type === 'pirates') {
    const a = def.cove + rnd(-1.6, 1.6); spawnPirate(a); announce('pirates', Math.cos(a) * 20, Math.sin(a) * 20); addReq('pirates', { x: I.harbour.x, z: I.harbour.z }, 120, 12);
  } else if (type === 'serpent') {
    const a = rnd(0, 6.28), obj = new THREE.Group();
    const head = W.model('serp_head'), segs = [0, 1, 2].map(() => W.model('serp_seg')), tail = W.model('serp_tail');
    obj.add(head, ...segs, tail); isleObjs.add(obj);
    G.serpent = { x: Math.cos(a) * 19, z: Math.sin(a) * 19, ang: a, hp: 3, state: 'rise', t: 0, obj, head, segs, tail, rise: 0, hist: [] };
    announce('serpent', G.serpent.x, G.serpent.z); addReq('serpent', { x: G.serpent.x, z: G.serpent.z }, 100, 14);
  } else if (type === 'drought') { G.events.drought = 70; announce('drought'); }
  else if (type === 'storm') {
    G.events.storm = 70; announce('storm');
    const a = Math.atan2(G.wind.z, G.wind.x) + Math.PI;
    for (let k = 0; k < (def.stormy ? 4 : 3); k++) newCloud(Math.cos(a + k * 0.35) * (30 + k * 4), Math.sin(a + k * 0.35) * (30 + k * 4), rnd(0.9, 1.15), { natural: true, storm: true });
    G.wind.x = -Math.cos(a) * 1.8; G.wind.z = -Math.sin(a) * 1.8;
  } else if (type === 'monsoon') {
    G.events.monsoon = 60; announce('monsoon');
    const a = rnd(0, 6.28);
    for (let k = 0; k < 5; k++) newCloud(Math.cos(a + k * 0.25) * (30 + k * 5), Math.sin(a + k * 0.25) * (30 + k * 5), rnd(1.0, 1.2), { natural: true });
    G.wind.x = -Math.cos(a) * 1.6; G.wind.z = -Math.sin(a) * 1.6;
  } else if (type === 'volcano') { G.events.volcano = 40; G.bombT = 1; announce('volcano', def.volcano[0], def.volcano[1]); }
  else if (type === 'sandstorm') {
    const a = rnd(0, 6.28), dx = -Math.cos(a), dz = -Math.sin(a);
    G.sandstorm = { cx: Math.cos(a) * 24, cz: Math.sin(a) * 24, dx, dz, str: 1, push: 0, seg: [0, 0, 0, 0], t: 0, dmg: 0 };
    announce('sandstorm', Math.cos(a) * 16, Math.sin(a) * 16);
  } else if (type === 'blizzard') { G.events.blizzard = 45; announce('blizzard'); addReq('warm', { x: v[0], z: v[1] }, 45, 8); }
  else if (type === 'boss') {
    const a = rnd(0, 6.28), c = newCloud(Math.cos(a) * 26, Math.sin(a) * 26, 1.1, { boss: true, natural: true });
    G.boss = { c, x: c.x, z: c.z, hp: 6, max: 6, t: 0, eye: 0, eyeT: 6, spawnT: 5, ang: a };
    announce('boss', c.x, c.z); WM.ui && WM.ui.bossBar(true);
  }
}
function threatOptions() {
  const def = I.def, s = I.season, o = [];
  const can = k => def.threats.includes(k);
  if (can('locusts') && (s === 1 || s === 2) && I.pop >= 8 && I.fields.length && !G.swarms.length) o.push('locusts');
  if (can('pirates') && has('harbour') && s !== 3 && !G.pirates.length) o.push('pirates', 'pirates');
  if (can('serpent') && has('harbour') && !G.serpent && (I.year >= 1 || def.id !== 'wiege') && I.pop >= 14) o.push('serpent');
  if (can('drought') && s === 1 && !G.events.drought) o.push('drought');
  if (can('storm') && (s === 2 || def.stormy) && !G.events.storm) o.push('storm', 'storm');
  if (can('monsoon') && (s === 1 || s === 0) && !G.events.monsoon) o.push('monsoon');
  if (can('volcano') && !G.events.volcano && I.played > 300) o.push('volcano');
  if (can('sandstorm') && s !== 3 && !G.sandstorm) o.push('sandstorm', 'sandstorm');
  if (can('blizzard') && s === 3 && !G.events.blizzard) o.push('blizzard', 'blizzard');
  if (can('boss') && !G.boss && (s === 2 || (!I.flags.boss && I.played > 420)) && I.played > 300) o.push('boss', 'boss');
  if (!can('boss') && I.year >= 3 && !G.boss && s === 2 && Math.random() < 0.15) o.push('boss');
  return o;
}
function spawnPirate(a) {
  const obj = W.model('pirate_ship'); isleObjs.add(obj);
  G.pirates.push({ x: Math.cos(a) * 42, z: Math.sin(a) * 42, vx: 0, vz: 0, hp: 2, state: 'approach', t: 0, obj, yaw: 0, conf: 0 });
}
function spawnTrade(auto) {
  const a = I.def.cove + rnd(-0.9, 0.9), obj = W.model('trade_ship'); isleObjs.add(obj);
  const s = { x: Math.cos(a) * 30, z: Math.sin(a) * 30, vx: 0, vz: 0, state: 'wait', t: 0, obj, yaw: 0, auto };
  G.ships.push(s); return s;
}
function updateThreats(dt, time) {
  const def = I.def, v = def.village;
  // Zeitplan
  G.threatT -= dt;
  if (G.threatT <= 0) {
    const o = threatOptions();
    G.threatT = rnd(75, 140) / (1 + Math.min(I.year, 4) * 0.12) * (def.stormy ? 0.8 : 1);
    if (o.length) startThreat(pick(o));
  }
  // Ereignis-Zeiten
  for (const k of ['drought', 'storm', 'monsoon', 'volcano', 'blizzard']) if (G.events[k] > 0) {
    G.events[k] -= dt;
    if (G.events[k] <= 0) { G.events[k] = 0; if (k === 'storm') { chron('bigStorm'); addFaith(8, v[0], 4, v[1]); } if (k === 'volcano') { chron('volcano'); addFaith(10, def.volcano[0], 6, def.volcano[1]); } if (k === 'monsoon') addFaith(6, v[0], 4, v[1]); }
  }
  // Vulkan
  if (G.events.volcano > 0 && def.volcano) {
    G.bombT -= dt;
    if (G.bombT <= 0) {
      G.bombT = rnd(1.2, 2.6); const [vx, vz] = def.volcano, a = rnd(0, 6.28), r = rnd(3, 9);
      G.bombs.push({ x: vx, y: 7.5, z: vz, vx: Math.cos(a) * r / 2.2, vz: Math.sin(a) * r / 2.2, vy: 9, t: 0 });
      cameraShake(0.12);
    }
    if (Math.random() < dt * 6) burst(def.volcano[0], 7.5, def.volcano[1], 0xff6a1a, 2, 6);
  }
  for (let i = G.bombs.length - 1; i >= 0; i--) {
    const b = G.bombs[i]; b.t += dt; b.vy -= 9.8 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (Math.random() < 0.5) G.floaters.push({ x: b.x, y: b.y, z: b.z, vx: 0, vy: 0.5, vz: 0, t: 0, life: 0.6, col: new THREE.Color(0xff8a2a) });
    if (b.y < H(b.x, b.z)) {
      G.bombs.splice(i, 1); burst(b.x, b.y + 0.2, b.z, 0xff5a10, 10, 4);
      const t = I.trees.find(t => t.st === 0 && dist(t.x, t.z, b.x, b.z) < 1.8); if (t) ignite(t.x, t.z, 'tree', t);
      addG(Bg, b.x, b.z, 1, 0.6, 0, 1);
    }
  }
  // Heuschrecken
  for (let i = G.swarms.length - 1; i >= 0; i--) {
    const s = G.swarms[i]; s.t += dt;
    if (!s.target || s.target.g < 0.05 || !I.fields.includes(s.target)) s.target = I.fields.slice().sort((a, b) => b.g - a.g)[0] || null;
    const tx = s.target ? s.target.x : v[0], tz = s.target ? s.target.z : v[1], dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz) || 1;
    const sp = s.pushed > 0 ? 0.3 : 2.0; s.pushed = (s.pushed || 0) - dt;
    s.vx += (dx / d * sp - s.vx) * dt * 0.8; s.vz += (dz / d * sp - s.vz) * dt * 0.8;
    s.x += s.vx * dt; s.z += s.vz * dt;
    if (s.target && d < 1.6) { s.target.g = Math.max(0, s.target.g - 0.06 * dt); s.target.h = Math.max(0, s.target.h - 0.02 * dt); s.eating = true; } else s.eating = false;
    const far = Math.hypot(s.x, s.z) > 26 && s.t > 8;
    if (s.n <= 3 || far) {
      G.swarms.splice(i, 1); chron('locusts'); addFaith(10, s.x, 3, s.z); fulfil('locusts');
      msg('🦗 Plage gebannt!', far ? 'Der Schwarm wurde aufs Meer geweht.' : 'Der Schwarm ist erledigt.', 2.5);
    }
  }
  // Piraten
  for (let i = G.pirates.length - 1; i >= 0; i--) {
    const p = G.pirates[i]; p.t += dt;
    const tgt = I.harbour, dx = tgt.x - p.x, dz = tgt.z - p.z, d = Math.hypot(dx, dz) || 1;
    const inFog = G.fogs.some(f => dist(f.x, f.z, p.x, p.z) < f.s + 1.6);
    if (inFog && p.state === 'approach') { p.conf += dt; if (p.conf > 2.5) { p.state = 'flee'; msg('🌫️ Die Piraten haben sich im Nebel verirrt!', '', 2); } }
    let ax = 0, az = 0;
    if (p.state === 'approach') { const sp = inFog ? 0.4 : 1.3; ax = dx / d * sp; az = dz / d * sp; if (d < 2.6) { p.state = 'raid'; p.t = 0; } }
    else if (p.state === 'raid') {
      if (p.t > 4) {
        const lf = Math.round(I.food * 0.3), lw = Math.round(I.wood * 0.3); I.food -= lf; I.wood -= lw; I.happy = Math.max(0, I.happy - 15); G.disaster = (G.disaster || 0) + 15;
        msg('🏴‍☠️ Die Piraten plündern!', `−${lf} Nahrung, −${lw} Holz`, 3); fail('pirates'); p.state = 'flee';
      }
    } else if (p.state === 'flee') { ax = -dx / d * 1.6; az = -dz / d * 1.6; if (d > 36) { isleObjs.remove(p.obj); G.pirates.splice(i, 1); if (!p.raided) { chron('pirates'); addFaith(12, p.x, 2, p.z); fulfil('pirates'); } continue; } }
    if (p.state === 'raid') p.raided = true;
    if (p.hp <= 0 && p.state !== 'sink') { p.state = 'sink'; p.t = 0; burst(p.x, 1, p.z, 0x5e3b1d, 20, 5); snd('explosion'); }
    if (p.state === 'sink') { p.obj.position.y -= dt * 0.6; p.obj.rotation.z += dt * 0.3; if (p.t > 3) { isleObjs.remove(p.obj); G.pirates.splice(i, 1); chron('pirates'); addFaith(15, p.x, 2, p.z); fulfil('pirates'); msg('🏴‍☠️ Piratenschiff versenkt!', '', 2); } continue; }
    p.vx = (p.vx || 0) * (1 - dt * 0.8); p.vz = (p.vz || 0) * (1 - dt * 0.8);
    p.x += (ax + p.vx) * dt; p.z += (az + p.vz) * dt;
    if (H(p.x, p.z) > -0.2 && p.state !== 'raid' && d > 3.5) { const r = Math.hypot(p.x, p.z); p.x += p.x / r * dt * 2; p.z += p.z / r * dt * 2; }
    const mvx = ax + p.vx, mvz = az + p.vz; if (Math.hypot(mvx, mvz) > 0.1) p.yaw = Math.atan2(-mvz, mvx);
    p.obj.position.set(p.x, Math.sin(time * 1.6 + i) * 0.08 - 0.1, p.z); p.obj.rotation.set(Math.sin(time * 1.2) * 0.04, p.yaw, (p.hitT > 0 ? Math.sin(time * 30) * 0.1 : 0) + Math.sin(time) * 0.03);
    p.hitT = (p.hitT || 0) - dt;
  }
  // Handelsschiffe
  for (let i = G.ships.length - 1; i >= 0; i--) {
    const s = G.ships[i]; s.t += dt;
    const h = I.harbour, dock = { x: h.x + Math.cos(I.def.cove) * 2.2, z: h.z + Math.sin(I.def.cove) * 2.2 }, dx = dock.x - s.x, dz = dock.z - s.z, d = Math.hypot(dx, dz) || 1;
    let ax = 0, az = 0;
    if (s.state === 'wait') { const sp = s.auto ? 1.4 : 0.12; ax = dx / d * sp; az = dz / d * sp; if (d < 2.2) { s.state = 'dock'; s.t = 0; } if (s.t > 120 && !s.auto) { s.state = 'leave'; fail('ship'); } }
    else if (s.state === 'dock') {
      if (s.t > 0.1 && !s.paid) {
        s.paid = true; const k = 1 + 0.5 * sk('v2'); const wd = Math.round(D.BAL.tradeWood * k), fd = Math.round(D.BAL.tradeFood * k);
        I.wood += wd; I.food += fd; addFaith(s.auto ? 3 : 6, s.x, 2, s.z); chron('firstShip'); fulfil('ship');
        msg('⛵ Handelsschiff angelegt!', `+${wd} Holz, +${fd} Nahrung`, 2.5); snd('coin');
      }
      if (s.t > 8) s.state = 'leave';
    } else { ax = -dx / d * 1.2; az = -dz / d * 1.2; if (d > 34) { isleObjs.remove(s.obj); G.ships.splice(i, 1); continue; } }
    s.vx = (s.vx || 0) * (1 - dt * 0.5); s.vz = (s.vz || 0) * (1 - dt * 0.5);
    s.x += (ax + s.vx) * dt; s.z += (az + s.vz) * dt;
    if (H(s.x, s.z) > -0.5 && s.state !== 'dock') { const r = Math.hypot(s.x, s.z); s.x += s.x / r * dt * 2.5; s.z += s.z / r * dt * 2.5; }
    const mvx = ax + s.vx, mvz = az + s.vz; if (Math.hypot(mvx, mvz) > 0.15) s.yaw += Math.atan2(Math.sin(Math.atan2(-mvz, mvx) - s.yaw), Math.cos(Math.atan2(-mvz, mvx) - s.yaw)) * dt * 3;
    s.obj.position.set(s.x, Math.sin(time * 1.4 + i * 2) * 0.07 - 0.05, s.z); s.obj.rotation.set(Math.sin(time) * 0.03, s.yaw, Math.sin(time * 1.2) * 0.04);
  }
  // Seeschlange
  const sp = G.serpent;
  if (sp) {
    sp.t += dt;
    if (sp.state === 'rise') { sp.rise = Math.min(1, sp.rise + dt * 0.5); if (sp.rise >= 1) sp.state = 'swim'; }
    if (sp.state === 'swim') {
      sp.ang += dt * 0.12; const r = 17 + Math.sin(sp.t * 0.3) * 2.5; sp.x = Math.cos(sp.ang) * r; sp.z = Math.sin(sp.ang) * r;
      if (Math.random() < dt / 14 && has('harbour')) { I.happy = Math.max(0, I.happy - 4); complain('hunger', I.harbour.x, I.harbour.z); cameraShake(0.1); WM.audio && WM.audio.roar(); }
      if (sp.hp <= 0) { sp.state = 'dive'; sp.won = true; snd('powerup'); }
      if (sp.t > 110) sp.state = 'dive';
    }
    if (sp.state === 'dive') {
      sp.rise -= dt * 0.6;
      if (sp.rise <= 0) { isleObjs.remove(sp.obj); if (sp.won) { chron('serpent'); addFaith(20, sp.x, 2, sp.z); fulfil('serpent'); msg('🐉 Die Seeschlange flieht!', '', 2.5); } else fail('serpent'); G.serpent = null; }
    }
    if (G.serpent) {
      const fx = -Math.sin(sp.ang), fz = Math.cos(sp.ang), ry = -1.3 + sp.rise * 1.3 + (sp.hitT > 0 ? Math.sin(time * 30) * 0.15 : 0);
      sp.hitT = (sp.hitT || 0) - dt;
      sp.head.position.set(sp.x, ry - 0.2, sp.z); sp.head.rotation.y = Math.atan2(fx, fz);
      sp.segs.forEach((s, k) => { const bx = sp.x - fx * (2.2 + k * 2.4), bz = sp.z - fz * (2.2 + k * 2.4); s.position.set(bx, ry - 0.3 + Math.sin(time * 2 + k) * 0.2, bz); s.rotation.y = Math.atan2(-fz, fx); });
      sp.tail.position.set(sp.x - fx * 9.5, ry - 0.3, sp.z - fz * 9.5); sp.tail.rotation.y = Math.atan2(fx, fz) + Math.PI;
    }
  }
  // Sandsturm
  const ss = G.sandstorm;
  if (ss) {
    ss.t += dt; const spd = ss.push > 0 ? -0.6 : 1.1; ss.push -= dt;
    ss.cx += ss.dx * spd * dt; ss.cz += ss.dz * spd * dt;
    const px = -ss.dz * 16, pz = ss.dx * 16; ss.seg = [ss.cx - px, ss.cz - pz, ss.cx + px, ss.cz + pz];
    for (const f of I.fields) if (distSeg(f.x, f.z, ss.seg) < 2 && f.m < 0.55) { f.g = Math.max(0, f.g - 0.12 * dt * ss.str); f.h = Math.max(0, f.h - 0.03 * dt * ss.str); ss.dmg += dt; }
    if (Math.random() < 0.6) for (let k = 0; k < 2; k++) { const t = Math.random(); G.floaters.push({ x: lerp(ss.seg[0], ss.seg[2], t), y: rnd(0.5, 4), z: lerp(ss.seg[1], ss.seg[3], t), vx: ss.dx * 4, vy: 0.5, vz: ss.dz * 4, t: 0, life: 1.5, col: new THREE.Color(0xd9b47a) }); }
    if (ss.str <= 0.05 || Math.hypot(ss.cx, ss.cz) > 30 && ss.t > 10) { G.sandstorm = null; chron('sandstorm'); addFaith(ss.str <= 0.05 ? 14 : 6, v[0], 4, v[1]); msg('🏜️ Der Sandsturm ist vorüber.', ss.str <= 0.05 ? 'Dein Gegenwind hat ihn zerstreut!' : '', 2.5); }
  }
  // Sturmgeist
  const B = G.boss;
  if (B) {
    B.t += dt; B.ang += dt * 0.15; const R = 15 + Math.sin(B.t * 0.2) * 3;
    B.c.x += (Math.cos(B.ang) * R - B.c.x) * dt * 0.5; B.c.z += (Math.sin(B.ang) * R - B.c.z) * dt * 0.5; B.c.w = 1.1; B.x = B.c.x; B.z = B.c.z;
    B.eyeT -= dt; if (B.eyeT <= 0) { if (B.eye) { B.eye = 0; B.eyeT = rnd(6, 9); } else { B.eye = 1; B.eyeT = 4.5; WM.audio && WM.audio.roar(); } }
    B.spawnT -= dt;
    if (B.spawnT <= 0) {
      B.spawnT = rnd(9, 13); const a = rnd(0, 6.28), r = rnd(1, 4);
      const c = newCloud(B.x, B.z, 0.95, { natural: true, storm: true }); c.vx = (v[0] + Math.cos(a) * r - B.x) * 0.15; c.vz = (v[1] + Math.sin(a) * r - B.z) * 0.15; c.strikeT = 8;
    }
    W.bossEyes.visible = B.eye > 0; W.bossEyes.position.set(B.x, D.CLOUD_Y + 0.6, B.z); W.bossEyes.lookAt(W.camera.position);
    W.bossEyes.scale.y = B.eye ? 1 : 0.1;
    if (B.hp <= 0) {
      W.bossEyes.visible = false; B.c.fade = 0.01; G.boss = null; I.flags.boss = true; chron('boss'); addFaith(150 * (I.def.faithK / 2 + 0.5), B.x, 8, B.z);
      msg('👁️ Borrasco ist besiegt!', 'Der Himmel über Sturmhorn gehört dir.', 4); G.rainbowT = 18; WM.ui && WM.ui.bossBar(false); snd('powerup');
      for (const c of G.clouds) if (c.storm) c.fade = 0.01;
    }
    if (B.t > 240 && G.boss) { G.boss = null; B.c.fade = 0.01; W.bossEyes.visible = false; WM.ui && WM.ui.bossBar(false); msg('👁️ Borrasco zieht sich zurück…', 'Er kommt wieder.', 3); }
  }
  // Feuer
  for (let i = G.fires.length - 1; i >= 0; i--) {
    const f = G.fires[i]; f.t += dt; const wet = sampleG(Wg, f.x, f.z);
    f.int += dt * (0.05 + (0.5 - wet) * 0.1 + (I.season === 1 ? 0.04 : 0)) + (f.fan > 0 ? dt * 0.1 : 0); f.fan = (f.fan || 0) - dt;
    f.int = Math.min(1.2, f.int);
    if (f.int <= 0) { G.fires.splice(i, 1); chron('fireOut'); if (!G.fires.length) { fulfil('fire'); addFaith(3, f.x, 2, f.z); } continue; }
    addG(Bg, f.x, f.z, 0.9, dt * 0.08 * f.int, 0, 1);
    if (f.kind === 'tree' && f.int > 0.7 && f.t > 9) { f.ref.st = 2; f.ref.grow = 0; f.int -= dt * 0.5; }
    if (f.kind === 'bld') { f.ref.hp -= dt * 0.035 * f.int; G.disaster = (G.disaster || 0) + dt * 0.8; if (f.ref.hp <= 0) { removeBuilding(f.ref); burst(f.x, 1, f.z, 0x333333, 20, 4); msg('🔥 Ein Gebäude ist abgebrannt!', '', 2.5); f.int = 0; } }
    f.spreadT -= dt * (1 + (f.fan > 0 ? 2 : 0)) * (I.season === 1 ? 1.4 : 1);
    if (f.spreadT <= 0 && f.int > 0.55) {
      f.spreadT = rnd(3, 6);
      const dirx = f.fan > 0 ? f.fdx : G.wind.x * 0.3, dirz = f.fan > 0 ? f.fdz : G.wind.z * 0.3;
      const cand = I.trees.filter(t => t.st === 0 && dist(t.x, t.z, f.x + dirx, f.z + dirz) < 2.6 && sampleG(Wg, t.x, t.z) < 0.75);
      if (cand.length) { const t = pick(cand); ignite(t.x, t.z, 'tree', t); }
      else { const b = I.buildings.find(b => b.done >= 1 && dist(b.x, b.z, f.x, f.z) < 2.2 && !G.fires.some(ff => ff.ref === b)); if (b && Math.random() < 0.4) ignite(b.x, b.z, 'bld', b); }
    }
  }
  // spontane Waldbrände bei Dürre
  if ((G.events.drought > 0 || (I.season === 1 && def.desert)) && Math.random() < dt * 0.012) {
    const t = I.trees.filter(t => t.st === 0 && sampleG(Wg, t.x, t.z) < 0.15); if (t.length) { const tr = pick(t); ignite(tr.x, tr.z, 'tree', tr); }
  }
}

// =====================================================================
// Wünsche
// =====================================================================
function addReq(type, at, dur, reward, extra = {}) {
  dur *= sk('g4') ? 1.3 : 1;
  const txt = pick(D.REQ[type] || ['…']);
  const r = Object.assign({ type, txt, x: at.x, z: at.z, y: at.y, t: dur, dur, reward, prog: 0, id: Math.random() }, extra);
  G.reqs.push(r); WM.audio && WM.audio.chime(); return r;
}
function fulfil(type, cond) {
  const r = G.reqs.find(r => r.type === type && (!cond || cond(r))); if (!r) return false;
  G.reqs.splice(G.reqs.indexOf(r), 1);
  const faith = r.reward * (1 + 0.25 * sk('g3'));
  addFaith(faith, r.x, (r.y || H(r.x, r.z)) + 2, r.z);
  I.happy = Math.min(100, I.happy + 4); G.wishBoost = Math.min(30, (G.wishBoost || 0) + 7);
  S.stats.wishes++; I.stats.wishes = (I.stats.wishes || 0) + 1; chron('firstWish');
  WM.ui && WM.ui.bubble(pick(D.THANKS), r.x, r.z, 'thanks');
  cheerNear(r.x, r.z, 5); snd('coin');
  return true;
}
function fail(type) {
  const r = G.reqs.find(r => r.type === type); if (!r) return;
  G.reqs.splice(G.reqs.indexOf(r), 1); I.happy = Math.max(0, I.happy - 3);
  WM.ui && WM.ui.bubble(pick(D.COMPLAIN.fail), r.x, r.z, 'sad');
}
function complain(kind, x, z) { if (!WM.ui || G.now - (G.complainAt || -99) < 7) return; G.complainAt = G.now; WM.ui.bubble(pick(D.COMPLAIN[kind]), x, z, 'sad'); }
function cheerNear(x, z, r) { for (const p of G.villagers) if (dist(p.x, p.z, x, z) < r) p.cheer = 2.5; burst(x, H(x, z) + 1.5, z, new THREE.Color().setHSL(Math.random(), 0.8, 0.6), 10, 4); }
function updateReqs(dt) {
  const v = I.def.village, day = W.nightK < 0.5;
  for (let i = G.reqs.length - 1; i >= 0; i--) {
    const r = G.reqs[i]; r.t -= dt;
    if (r.type === 'rain' && r.f) { r.x = r.f.x; r.z = r.f.z; if (r.f.m >= 0.55 && r.f.m < D.BAL.floodAt) { fulfil('rain', q => q === r); continue; } }
    if (r.type === 'sun' && r.f) { if (!r.f.shaded && day) r.prog += dt * (G.sunbeam && dist(G.sunbeam.x, G.sunbeam.z, r.f.x, r.f.z) < 3 ? 3 : 1); if (r.prog >= 8) { fulfil('sun', q => q === r); continue; } }
    if (r.type === 'wind' && G.millSpin > 0.35) { fulfil('wind'); continue; }
    if (r.type === 'fest') {
      const shaded = G.clouds.some(c => !c.fade && dist(c.x, c.z, r.x, r.z) < cloudR(c) + 1);
      if (!shaded && day) r.prog += dt; if (r.prog >= 15) { fulfil('fest', q => q === r); startFest(); continue; }
    }
    if (r.type === 'snow' && sampleG(Sg, v[0], v[1]) > 0.35) { fulfil('snow'); startFest(); continue; }
    if (r.type === 'warm' && G.warmT > 0) { r.prog += dt; if (r.prog > 5) { fulfil('warm'); continue; } }
    if (r.t <= 0) {
      if (['fire', 'pirates', 'locusts', 'serpent'].includes(r.type)) { r.t = 15; continue; }
      fail(r.type);
    }
  }
  G.reqT -= dt;
  const maxR = 2 + (I.pop >= 15 ? 1 : 0);
  if (G.reqT <= 0 && G.reqs.filter(r => !['fire', 'pirates', 'locusts', 'serpent'].includes(r.type)).length < maxR) {
    G.reqT = rnd(14, 26);
    const o = [], s = I.season;
    const growing = SEASON().grow > 0 || I.def.tropical;
    if (growing) {
      const dry = I.fields.filter(f => f.m < 0.42 && f.building === undefined && !G.reqs.some(r => r.f === f)).sort((a, b) => a.m - b.m)[0];
      if (dry) o.push(['rain', dry], ['rain', dry]);
      const ripe = I.fields.filter(f => f.g > 0.4 && f.g < 0.95 && f.m > 0.3 && !G.reqs.some(r => r.f === f))[0];
      if (ripe && day) o.push(['sun', ripe]);
    }
    if (has('mill') && G.millSpin < 0.1 && !G.reqs.some(r => r.type === 'wind')) o.push(['wind']);
    if (has('harbour') && !G.ships.length && s !== 3) o.push(['ship']);
    if (sk('s3') && s !== 3 && I.pop >= 8 && !G.reqs.some(r => r.type === 'rainbow') && day) o.push(['rainbow']);
    if (sk('w5') && s === 3 && !G.reqs.some(r => r.type === 'snow')) o.push(['snow'], ['snow']);
    if (has('maypole') && (s === 1 || s === 2) && I.festSeason !== I.year * 4 + s && day && !G.reqs.some(r => r.type === 'fest')) o.push(['fest'], ['fest']);
    if (o.length) {
      const [type, f] = pick(o);
      if (type === 'rain' || type === 'sun') addReq(type, { x: f.x, z: f.z }, type === 'rain' ? 60 : 55, 5, { f });
      else if (type === 'wind') { const m = I.buildings.find(b => b.t === 'mill'); addReq('wind', { x: m.x, z: m.z, y: H(m.x, m.z) + 3 }, 45, 5); }
      else if (type === 'ship') { const sh = spawnTrade(false); addReq('ship', { x: I.harbour.x, z: I.harbour.z }, 110, 6); }
      else if (type === 'rainbow') addReq('rainbow', { x: v[0], z: v[1] }, 70, 8);
      else if (type === 'snow') addReq('snow', { x: v[0], z: v[1] }, 70, 7);
      else if (type === 'fest') { const m = I.buildings.find(b => b.t === 'maypole'); addReq('fest', { x: m.x, z: m.z }, 75, 10); I.festSeason = I.year * 4 + s; }
    }
  }
}
function startFest() {
  G.events.fest = 20; chron('firstFest'); I.happy = Math.min(100, I.happy + 10); G.wishBoost = Math.min(30, (G.wishBoost || 0) + 10);
  addFaith(6 * (sk('s5') ? 2 : 1), I.def.village[0], 4, I.def.village[1]); msg('🎉 Fest im Dorf!', 'Die Leute tanzen um den Maibaum.', 3);
  WM.audio && WM.audio.fanfare();
}

// =====================================================================
// Glaube, Chronik, Meldungen
// =====================================================================
function addFaith(n, x, y, z) {
  const temple = has('temple') ? 1.5 : 1;
  n = n * I.def.faithK * temple; if (n <= 0) return;
  S.faith += n; S.faithTotal += n;
  if (WM.ui && x !== undefined) WM.ui.floatText('+' + (n >= 10 ? Math.round(n) : n.toFixed(1)) + ' ✨', x, y, z);
  if (S.faith >= 15) hintDone('faithReady');
}
function chron(id) {
  if (S.chronik[id]) return;
  const e = D.CHRONIK.find(c => c[0] === id); if (!e) return;
  S.chronik[id] = { y: I ? I.year + 1 : 1, s: I ? I.season : 0, i: I ? I.def.id : '' };
  WM.ui && WM.ui.chronikToast(e[1], e[2]);
}
function msg(title, text, sec) { WM.ui && WM.ui.msg(title, text, sec); }
function snd(name, ...a) { try { if (AC && AC[name]) AC[name](...a); } catch (e) {} }
function hintDone(k) { G.hintKeys[k] = true; }

// =====================================================================
// Simulation: Felder, Bedürfnisse, Bevölkerung (feste Ticks)
// =====================================================================
const waterCap = () => 60 + 40 * count('well');
function simTick(dt) {
  const def = I.def, ss = SEASON(), v = def.village, day = W.nightK < 0.5;
  const evapMul = ss.evap * def.evap * (G.events.drought > 0 ? 2.2 : 1) * (def.tropical && I.season === 3 ? 3.5 : 1);
  // Beschattung
  shadeG.fill(0);
  for (const c of G.clouds) { if (c.fade) continue; const r = cloudR(c) * 0.9; for (let j = Math.max(0, Math.floor((c.z - r + GS) / GC)); j <= Math.min(GN - 1, Math.floor((c.z + r + GS) / GC)); j++) for (let i = Math.max(0, Math.floor((c.x - r + GS) / GC)); i <= Math.min(GN - 1, Math.floor((c.x + r + GS) / GC)); i++) { const cx = -GS + (i + 0.5) * GC, cz = -GS + (j + 0.5) * GC; if (dist(cx, cz, c.x, c.z) < r) shadeG[j * GN + i] = 1; } }
  // Verdunstung / Abfluss / Schmelze
  const melt = I.season === 3 && !def.polar ? 0.002 : I.season === 3 ? 0.0004 : 0.03;
  for (let k = 0; k < GN * GN; k++) {
    if (!Lg[k]) continue;
    const sun = day && !shadeG[k] ? 1.35 : 0.65;
    let w = Wg[k] - evapMul * sun * dt;
    if (w > 1) w -= (w - 1) * 0.035 * dt;
    if (Sg[k] > 0) { const m = Math.min(Sg[k], melt * (shadeG[k] ? 0.5 : 1.5) * dt); Sg[k] -= m; w += m * 0.9; }
    if (I.season === 3 && !def.tropical && !def.desert && Math.random() < 0.02 * dt) Sg[k] = Math.min(0.5, Sg[k] + 0.2);
    if (G.events.blizzard > 0) Sg[k] = Math.min(1, Sg[k] + 0.02 * dt);
    Wg[k] = clamp(w, 0, 2);
    if (Bg[k] > 0) Bg[k] = Math.max(0, Bg[k] - 0.004 * dt);
  }
  // Sonnenstrahl
  const sb = G.sunbeam && G.now - G.sunbeam.t < 0.2 ? G.sunbeam : null;
  if (sb) { addG(Wg, sb.x, sb.z, 2.6, -0.2 * dt * (1 + 0.35 * sk('s1')), 0, 2); addG(Sg, sb.x, sb.z, 2.6, -0.4 * dt, 0, 1); if (dist(sb.x, sb.z, v[0], v[1]) < 4) G.warmT = 3; }
  if (sk('w6') && W.nightK > 0.6) for (const f of I.fields) addG(Wg, f.x, f.z, 1.4, 0.006 * dt, 0, 0.7);
  // Felder
  const growS = (def.tropical ? Math.max(0.7, ss.grow) : ss.grow) * def.grow;
  let flooded = 0, dried = 0;
  for (const f of I.fields) {
    if (f.building !== undefined) continue;
    let m = 0; for (const [ox, oz] of [[0, 0], [0.9, 0.6], [-0.9, 0.6], [0.9, -0.6], [-0.9, -0.6]]) m += sampleG(Wg, f.x + ox * f.cos + oz * f.sin, f.z - ox * f.sin + oz * f.cos);
    f.m = m / 5; const gi_ = gi(f.x, f.z); f.shaded = gi_ >= 0 && shadeG[gi_] === 1;
    const beam = sb && dist(sb.x, sb.z, f.x, f.z) < 3;
    if (growS <= 0) { f.g = Math.max(0, f.g - dt * 0.01); continue; }
    let mf = f.m < D.BAL.dryAt ? 0 : f.m < 0.3 ? (f.m - D.BAL.dryAt) / (0.3 - D.BAL.dryAt) : f.m > D.BAL.floodAt ? 0.15 : 1;
    const sunF = !day ? 0.2 : beam ? 2.4 * (1 + 0.15 * sk('s1')) : f.shaded ? 0.45 : 1 + 0.15 * sk('s2');
    if (f.m > D.BAL.floodAt) { f.h = Math.max(0, f.h - 0.022 * dt * (sk('w3') ? 0.6 : 1)); flooded++; if (Math.random() < dt * 0.04) complain('flood', f.x, f.z); }
    else if (f.m < D.BAL.dryAt) { f.h = Math.max(0, f.h - 0.016 * dt); dried++; if (Math.random() < dt * 0.03) complain('dry', f.x, f.z); }
    else if (f.g < 1) f.h = Math.min(1, f.h + 0.01 * dt);
    if (f.g < 1) f.g = Math.min(1, f.g + D.BAL.growBase * mf * sunF * growS * dt);
    if (f.h <= 0.02) { f.g = 0; f.h = 0.6; if (G.now - (G.lostAt || -99) > 20) { G.lostAt = G.now; msg('🥀 Ernte verdorben', f.m > 1 ? 'Das Feld ist ertrunken.' : 'Das Feld ist verdorrt.', 2); } }
    if (f.g >= 1) {
      f.ripeT += dt;
      if (f.ripeT > 4) {
        const y = D.BAL.fieldYield * (0.4 + 0.6 * f.h) * (1 + 0.2 * sk('s4')) * (G.millSpin > 0.08 ? 1.5 : 1);
        I.food += y; f.g = 0; f.ripeT = 0; I.stats.harvests = (I.stats.harvests || 0) + 1; S.stats.harvests++;
        chron('firstHarvest'); addFaith(0.6, f.x, 1.5, f.z); burst(f.x, H(f.x, f.z) + 0.6, f.z, 0xf2c14e, 8, 3);
        if (WM.ui) WM.ui.floatText('+' + Math.round(y) + ' 🌾', f.x, H(f.x, f.z) + 1, f.z, 'food');
      }
    }
  }
  // Mühle
  const millDecay = sk('v5') ? 0.025 : 0.05; G.millSpin = Math.max(0, G.millSpin - millDecay * dt);
  if (G.millSpin > 0.2) chron('mill');
  // Holz
  const alive = I.trees.filter(t => t.st === 0 && t.grow >= 1);
  const cutters = Math.max(1, Math.floor(I.pop * 0.22));
  if (alive.length) {
    G.chopAcc = (G.chopAcc || 0) + D.BAL.chop * cutters * dt; I.wood += D.BAL.chop * cutters * dt;
    if (G.chopAcc >= D.BAL.woodPerTree) {
      G.chopAcc = 0; const t = alive.sort((a, b) => dist(a.x, a.z, v[0], v[1]) - dist(b.x, b.z, v[0], v[1]))[Math.floor(Math.random() * Math.min(5, alive.length))];
      t.st = 1; t.grow = 0;
    }
  }
  if (alive.length < 3 && G.now - (G.noWoodAt || -99) > 60) { G.noWoodAt = G.now; msg('🪵 Kaum noch Bäume!', 'Lass Regen auf Stümpfe und Wald fallen – nasser Boden lässt Bäume schneller nachwachsen.', 3.5); }
  // Nachwachsen
  for (const t of I.trees) {
    if (t.st !== 0 || t.grow < 1) {
      const w = sampleG(Wg, t.x, t.z);
      const rate = (t.st === 0 ? 1 / 60 : 1 / 110) * (w > 0.3 ? 1 + (w - 0.3) * 2 : 0.25) * (I.season === 3 ? 0.2 : 1);
      t.grow = Math.min(1, t.grow + rate * dt);
      if (t.st !== 0 && t.grow >= 1) { t.st = 0; t.grow = 0.15; }
    }
  }
  // Fischfang
  const boats = has('harbour') ? 1 + (I.pop >= 20 ? 1 : 0) : 0;
  const calm = !G.serpent && !G.events.storm && !(def.polar && I.season === 3);
  G.fishing = boats && calm;
  if (G.fishing) I.food += D.BAL.fish * boats * dt;
  // Verbrauch
  const eat = D.BAL.eat * I.pop * ss.eat * dt; I.food = Math.max(0, I.food - eat);
  if (I.season === 1 && G.frostT <= 0) I.food -= I.food * 0.0025 * dt * (has('granary') ? 0.4 : 1);
  G.frostT = Math.max(0, G.frostT - dt);
  I.water = Math.max(0, Math.min(waterCap(), I.water - D.BAL.drink * I.pop * dt * (def.desert ? 1.4 : 1) + (has('well') ? 0.02 * dt : 0)));
  const heatNeed = D.BAL.heat * (ss.heat + (G.events.blizzard > 0 ? 2 : 0)) * def.warm * I.buildings.filter(b => D.BUILD[b.t].cap && b.done >= 1).length * dt * (G.warmT > 0 ? 0.3 : 1);
  let cold = false;
  if (heatNeed > 0) { if (I.wood >= heatNeed) I.wood -= heatNeed; else { I.wood = 0; cold = true; } }
  if (cold && Math.random() < dt * 0.04) complain('cold', v[0], v[1]);
  if (I.food <= 0 && Math.random() < dt * 0.05) complain('hunger', v[0], v[1]);
  if (I.water <= 0 && Math.random() < dt * 0.05) complain('thirst', v[0], v[1]);
  G.warmT = Math.max(0, G.warmT - dt);
  // Glück
  G.wishBoost = Math.max(0, (G.wishBoost || 0) - dt * 0.12); G.disaster = Math.max(0, (G.disaster || 0) - dt * 0.25);
  let target = 50 + (I.food > I.pop * 2 ? 10 : I.food <= 0 ? -28 : 0) + (I.water > 8 ? 6 : I.water <= 0 ? -22 : 0) + (cold ? -18 : 0)
    + G.wishBoost - G.disaster - flooded * 3 - dried * 2 + (G.events.fest > 0 ? 15 : 0) + (G.rainbowT > 0 ? 10 : 0) + (has('temple') ? 6 : 0) + (has('maypole') ? 3 : 0);
  if (G.events.blizzard > 0 && G.warmT <= 0) target -= 10;
  I.happy = clamp(I.happy + (target - I.happy) * 0.04 * dt, 0, 100);
  G.cold = cold;
  // Bevölkerung
  const cap = housing();
  G.popT += dt * (I.happy > 75 ? 1.5 : 1);
  if (G.popT >= D.BAL.popTick) {
    G.popT = 0;
    if (I.pop < cap && I.food > I.pop * 1.6 && I.water > 4 && I.happy >= 42) {
      I.pop++; const p = addVillager(true); burst(p.x, H(p.x, p.z) + 0.8, p.z, 0xffffff, 8, 3);
      if (I.pop >= 10) chron('pop10'); if (I.pop >= 30) chron('pop30'); if (totalPop() >= 100) chron('pop100');
    }
  }
  if (I.food <= 0 || I.water <= 0) { G.starveT += dt; if (G.starveT > D.BAL.starveTick && I.pop > 3) { G.starveT = 0; I.pop--; msg('😢 Jemand hat die Insel verlassen', I.food <= 0 ? 'Es gab nicht genug zu essen.' : 'Es gab nicht genug Wasser.', 2.5); } } else G.starveT = 0;
  // Bauen
  G.buildT -= dt;
  if (G.buildT <= 0) { G.buildT = 3; if (I.season !== 3 || I.def.tropical || Math.random() < 0.4) startConstruction(); }
  const site = I.buildings.find(b => b.done < 1);
  if (site) {
    site.done = Math.min(1, site.done + dt / (5 + D.BUILD[site.t].wood * 0.25) * (1 + I.pop * 0.03));
    if (Math.random() < dt * 4) burst(site.x + rnd(-0.6, 0.6), H(site.x, site.z) + 0.2, site.z + rnd(-0.6, 0.6), 0xc9a26b, 2, 2);
    if (site.done >= 1) { msg('🏗️ ' + D.BUILD[site.t].n + ' fertig!', '', 2); snd('merge'); cheerNear(site.x, site.z, 4); if (['mill', 'harbour', 'temple', 'lighthouse'].includes(site.t)) chron(site.t); }
  }
  for (const f of I.fields) if (f.building !== undefined) { f.building += dt / 6; if (f.building >= 1) delete f.building; }
  // Gebäudeschäden heilen langsam
  for (const b of I.buildings) if (b.hp < 1 && !G.fires.some(f => f.ref === b)) b.hp = Math.min(1, b.hp + dt * 0.01);
  // Polarlicht
  G.aurora = def.polar && W.nightK > 0.7 && G.clouds.filter(c => !c.fade && Math.hypot(c.x, c.z) < 20).reduce((s, c) => s + c.w, 0) < 0.6;
  if (G.aurora) { S.faith += 0.03 * dt * def.faithK; S.faithTotal += 0.03 * dt * def.faithK; chron('aurora'); }
  // Ziele
  checkGoal();
}
function checkGoal() {
  const g = I.def.goal; if (I.goal) return;
  if (I.pop >= g.pop && g.b.every(t => has(t)) && (!g.boss || I.flags.boss)) {
    I.goal = true; addFaith(40, I.def.village[0], 6, I.def.village[1]);
    const idx = D.ISLANDS.indexOf(I.def), next = D.ISLANDS[idx + 1];
    if (next && !S.unlocked.includes(next.id)) { S.unlocked.push(next.id); msg('🗺️ Neue Insel entdeckt!', next.e + ' ' + next.n + ' ist jetzt erreichbar (Inselkarte, Taste M).', 6); WM.audio && WM.audio.fanfare(); }
    else msg('🏆 Inselziel erreicht!', I.def.n + ' blüht unter deinem Himmel.', 4);
    if (D.ISLANDS.every(i => S.islands[i.id] && S.islands[i.id].goal || (I.def.id === i.id && I.goal))) chron('allIslands');
    persist();
  }
}

// =====================================================================
// Zeit, Jahreszeiten, Wind
// =====================================================================
function advanceTime(dt) {
  I.t += dt; I.played += dt;
  if (I.t >= D.SEASON_LEN) {
    I.t -= D.SEASON_LEN; I.season = (I.season + 1) % 4;
    if (I.season === 0) { I.year++; chron('firstYear'); }
    const ss = SEASON();
    const bonus = I.pop * 0.35;
    let pil = 0; for (const isl of D.ISLANDS) { if (isl.id === I.def.id) continue; const s = S.islands[isl.id]; if (s && Array.isArray(s.built) && s.built.some(b => b[0] === 'temple')) pil += num(s.pop, 0) * 0.15 * isl.faithK * (sk('g5') ? 2 : 1); }
    addFaith(bonus, I.def.village[0], 5, I.def.village[1]); if (pil > 0) { S.faith += pil; S.faithTotal += pil; }
    msg(ss.e + ' ' + ss.n + ' · Jahr ' + (I.year + 1), D.SEASON_TXT[I.season] + (pil > 0 ? `<br><small>Pilgergaben anderer Inseln: +${Math.round(pil)} ✨</small>` : ''), 4.5);
    if (I.season === 3 && !I.def.tropical) for (let k = 0; k < GN * GN; k++) if (Lg[k]) Sg[k] = Math.max(Sg[k], 0.15);
    hintDone('season'); persist();
  }
  // Wind dreht langsam
  const wa = G.now * 0.013 + I.season * 1.7;
  const wtx = Math.cos(wa) * (0.5 + 0.3 * Math.sin(G.now * 0.05)), wtz = Math.sin(wa) * (0.5 + 0.3 * Math.sin(G.now * 0.05));
  const strong = G.events.storm > 0 || G.events.monsoon > 0 ? 3 : 1;
  G.wind.x += (wtx * strong - G.wind.x) * dt * 0.05; G.wind.z += (wtz * strong - G.wind.z) * dt * 0.05;
}
// Tag 70 %, Nacht 30 % des Zyklus; 0.25..0.75 = Sonnenbogen für setSky
const dayFrac = () => { const f = ((I.t % D.DAY_LEN) / D.DAY_LEN + 0.08) % 1; return f < 0.7 ? 0.25 + f / 0.7 * 0.5 : (0.75 + (f - 0.7) / 0.3 * 0.5) % 1; };

// =====================================================================
// Darstellung pro Frame: Bäume, Felder, Gebäude, Feuer, Nebel, Pfützen
// =====================================================================
const LEAF = { oak: [new THREE.Color(1, 1, 1), new THREE.Color(1.7, 0.95, 0.35), new THREE.Color(1.35, 1.35, 1.4)], poplar: [new THREE.Color(1, 1, 1), new THREE.Color(1.6, 1.2, 0.3), new THREE.Color(1.3, 1.3, 1.35)] };
function drawWorld(dt, time) {
  const season = I.season, tf = I.t / D.SEASON_LEN;
  // Baumbiegung durch Böen + Wind
  const wx = G.wind.x, wz = G.wind.z, wl = Math.hypot(wx, wz);
  const cnt = {}; for (const k in W.trees) cnt[k] = 0;
  const snowy = k => k === 'pine' && season === 3;
  for (const t of I.trees) {
    const T = W.trees[t.k]; if (!T) continue;
    let bx = wx * 0.04, bz = wz * 0.04;
    for (const g of G.gusts) { const d = dist(g.x, g.z, t.x, t.z); if (d < g.r + 1) { const k = (1 - d / (g.r + 1)) * (1 - g.t / g.life) * g.str * 0.05; bx += g.dx * k; bz += g.dz * k; } }
    if (G.tornado && dist(G.tornado.x, G.tornado.z, t.x, t.z) < 5) { bx += (G.tornado.x - t.x) * 0.08; bz += (G.tornado.z - t.z) * 0.08; }
    t.bend = t.bend || { x: 0, z: 0 }; t.bend.x += (bx - t.bend.x) * Math.min(1, dt * 6); t.bend.z += (bz - t.bend.z) * Math.min(1, dt * 6);
    const sway = Math.sin(time * 1.7 + t.x) * 0.02 * (wl + 0.3);
    _e.set(clamp(t.bend.z, -0.6, 0.6) + sway, 0, -clamp(t.bend.x, -0.6, 0.6)); _q.setFromEuler(_e);
    const s = t.s * (t.st === 0 ? lerp(0.25, 1, t.grow) : 1), y = H(t.x, t.z) - 0.05, i = cnt[t.k]++;
    if (t.st === 0) {
      T.trunk.setMatrixAt(i, _m.compose(_p.set(t.x, y, t.z), _q, _s.set(s, s, s)));
      if (T.leaves) {
        T.leaves.setMatrixAt(i, _m.compose(_p.set(t.x, y, t.z), _q, _s.set(s, s, s)));
        const burning = G.fires.some(f => f.ref === t);
        let col = _c.setRGB(1, 1, 1);
        if (LEAF[t.k]) { const L = LEAF[t.k]; if (season === 2) col.copy(L[0]).lerp(L[1], clamp(tf * 1.6 + (t.x % 1) * 0.3, 0, 1)); else if (season === 3) col.copy(L[2]); }
        else if (snowy(t.k)) col.setRGB(1.25, 1.3, 1.35);
        if (burning) col.multiplyScalar(0.5).add(_c2.setRGB(0.6, 0.15, 0));
        T.leaves.setColorAt(i, col);
      } else T.trunk.setColorAt(i, _c.setRGB(1, 1, 1));
    } else {
      // Stumpf / verbrannt
      T.trunk.setMatrixAt(i, _m.compose(_p.set(t.x, y, t.z), _q.identity(), _s.set(s, s * (t.st === 2 ? 0.7 : 0.22), s)));
      if (T.leaves) { T.leaves.setMatrixAt(i, W.ZERO); }
      else T.trunk.setColorAt(i, _c.setRGB(0.3, 0.3, 0.3));
    }
  }
  for (const k in W.trees) { const T = W.trees[k]; T.trunk.count = cnt[k]; T.trunk.instanceMatrix.needsUpdate = true; if (T.trunk.instanceColor) T.trunk.instanceColor.needsUpdate = true; if (T.leaves) { T.leaves.count = cnt[k]; T.leaves.instanceMatrix.needsUpdate = true; if (T.leaves.instanceColor) T.leaves.instanceColor.needsUpdate = true; } }
  // Feldpflanzen
  const cn = [0, 0, 0, 0];
  for (const f of I.fields) {
    const by = H(f.x, f.z) + 0.02, sc = f.building !== undefined ? 0 : 1;
    f.obj.scale.setScalar(f.building !== undefined ? Math.max(0.01, f.building) : 1);
    if (sc === 0 || (I.season === 3 && !I.def.tropical && f.g < 0.05)) continue;
    const st = f.g < 0.18 ? 0 : f.g < 0.45 ? 1 : f.g < 0.8 ? 2 : 3, local = st === 0 ? f.g / 0.18 : st === 1 ? (f.g - 0.18) / 0.27 : st === 2 ? (f.g - 0.45) / 0.35 : 1;
    const im = W.crops[st];
    const dry = clamp((0.3 - f.m) * 3, 0, 1), wet = clamp((f.m - 1) * 3, 0, 1), sick = 1 - f.h;
    _c.setRGB(1, 1, 1).lerp(_c2.setRGB(1.25, 0.95, 0.45), Math.max(dry, sick * 0.7)).lerp(_c2.setRGB(0.55, 0.65, 0.8), wet * 0.6);
    for (let r = 0; r < 5; r++) for (let q = 0; q < 6; q++) {
      if (cn[st] >= 640) break;
      const lx = -0.95 + q * 0.38, lz = -0.72 + r * 0.36;
      const x = f.x + lx * f.cos + lz * f.sin, z = f.z - lx * f.sin + lz * f.cos;
      const jit = Math.sin(f.seed + r * 7 + q * 3), s = (0.55 + 0.45 * local) * (1 + jit * 0.1) * (f.eaten ? 0.8 : 1);
      let bx = 0, bz = 0; for (const g of G.gusts) { const d = dist(g.x, g.z, x, z); if (d < g.r) { const k = (1 - d / g.r) * 0.4; bx += g.dx * k; bz += g.dz * k; } }
      _e.set(bz + Math.sin(time * 2 + x) * 0.04, f.rot + jit, -bx); _q.setFromEuler(_e);
      im.setMatrixAt(cn[st], _m.compose(_p.set(x, by, z), _q, _s.set(s, s * (wet > 0.5 ? 0.7 : 1), s)));
      im.setColorAt(cn[st], _c); cn[st]++;
    }
  }
  W.crops.forEach((im, k) => { im.count = cn[k]; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; });
  // Gebäude: Bau-Animation, Mühle, Tempel, Leuchtturm
  let lh = null;
  for (const b of I.buildings) {
    const s = b.done >= 1 ? 1 : Math.max(0.01, W.sstep(0, 1, b.done));
    b.obj.scale.set(s, b.done >= 1 ? 1 : s * (1 + Math.sin(time * 8) * 0.02), s);
    if (b.hp < 1) b.obj.rotation.z = (1 - b.hp) * 0.08 * Math.sin(b.x);
    if (b.blades) b.blades.rotation.z -= dt * (0.25 + G.millSpin * 6);
    if (b.vane) b.vane.rotation.y += dt * (1 + Math.hypot(G.wind.x, G.wind.z) * 2);
    if (b.t === 'lighthouse' && b.done >= 1) lh = b;
    if (b.t === 'harbour') { const boat = b.obj.children[b.obj.children.length - 1]; if (G.fishing) { const a = time * 0.15; boat.position.set(4 + Math.cos(a) * 3, -0.05 + Math.sin(time * 1.5) * 0.05, 1 + Math.sin(a) * 3); boat.rotation.y = -a - Math.PI / 2; } else { boat.position.set(2.2, -0.05 + Math.sin(time * 1.5) * 0.04, 1.2); boat.rotation.y = 0; } }
  }
  if (lh && W.nightK > 0.4) { W.lightBeam.position.set(lh.x, H(lh.x, lh.z) + 3.55, lh.z); W.lightBeam.rotation.y = time * 0.8; W.lightBeam.material.opacity = 0.16 * W.nightK; W.lightBeam.visible = true; }
  else W.lightBeam.visible = false;
  // Feuer & Rauch
  let fn = 0, sn = 0;
  for (const f of G.fires) {
    const y = H(f.x, f.z) + (f.kind === 'tree' ? 0.4 : 0.2), k = clamp(f.int, 0.2, 1.2);
    for (let j = 0; j < 3 && fn < 120; j++) {
      const a = j * 2.1 + time * 2, r = 0.25 * k, s = k * (0.7 + 0.3 * Math.sin(time * 14 + j * 3 + f.x)) * (j ? 0.7 : 1.1);
      W.flameIM.setMatrixAt(fn, _m.compose(_p.set(f.x + Math.cos(a) * r, y, f.z + Math.sin(a) * r), _q.identity(), _s.set(s, s * 1.4, s)));
      W.flameIM.setColorAt(fn, j ? _c.setRGB(1, 0.35, 0.05) : _c.setRGB(1, 0.75, 0.2)); fn++;
    }
    for (let j = 0; j < 3 && sn < 120; j++) {
      const ph = (time * 0.5 + j / 3 + f.x * 0.1) % 1, s = (0.3 + ph * 0.9) * k;
      W.smokeIM.setMatrixAt(sn, _m.compose(_p.set(f.x + G.wind.x * ph * 2, y + 0.8 + ph * 3.5, f.z + G.wind.z * ph * 2), _q.identity(), _s.set(s, s, s)));
      W.smokeIM.setColorAt(sn, _c.setScalar(0.35 + ph * 0.4)); sn++;
    }
  }
  if (I.def.volcano) { const [vx, vz] = I.def.volcano, er = G.events.volcano > 0; for (let j = 0; j < (er ? 10 : 4) && sn < 120; j++) { const ph = (time * (er ? 0.35 : 0.15) + j / (er ? 10 : 4)) % 1, s = (0.5 + ph * (er ? 3 : 1.6)); W.smokeIM.setMatrixAt(sn, _m.compose(_p.set(vx + G.wind.x * ph * 4, 7.6 + ph * (er ? 9 : 5), vz + G.wind.z * ph * 4), _q.identity(), _s.set(s, s, s))); W.smokeIM.setColorAt(sn, _c.setScalar(er ? 0.25 + ph * 0.3 : 0.6 + ph * 0.3)); sn++; } }
  W.flameIM.count = fn; W.smokeIM.count = sn; [W.flameIM, W.smokeIM].forEach(im => { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; });
  // Nebel
  let gn = 0;
  for (const f of G.fogs) {
    const a = Math.min(1, f.t * 2, (f.life - f.t) / 4), y = Math.max(0.4, H(f.x, f.z) + 0.3);
    for (let j = 0; j < 3 && gn < 160; j++) {
      const s = f.s * a * (0.8 + 0.25 * j);
      W.fogIM.setMatrixAt(gn, _m.compose(_p.set(f.x + Math.cos(j * 2.1 + time * 0.2) * f.s * 0.5, y + j * 0.15, f.z + Math.sin(j * 2.1 + time * 0.2) * f.s * 0.5), _q.identity(), _s.set(s * 1.3, s * 0.45, s * 1.3)));
      W.fogIM.setColorAt(gn, _c.setScalar(1)); gn++;
    }
  }
  W.fogIM.count = gn; W.fogIM.instanceMatrix.needsUpdate = true;
  // Pfützen auf überfluteten Feldern
  let pn = 0;
  for (const f of I.fields) if (f.m > 0.92 && pn < 60) {
    const k = clamp((f.m - 0.92) * 3, 0, 1.2);
    for (let j = 0; j < 2; j++) { const lx = j ? 0.5 : -0.5; W.puddleIM.setMatrixAt(pn++, _m.compose(_p.set(f.x + lx * f.cos, H(f.x, f.z) + 0.09, f.z - lx * f.sin), _q.identity(), _s.set(0.7 * k, 1, 0.55 * k))); }
  }
  W.puddleIM.count = pn; W.puddleIM.instanceMatrix.needsUpdate = true;
  // Heuschrecken
  let ln = 0;
  for (const s of G.swarms) {
    const n = Math.min(Math.ceil(s.n), 80);
    for (let j = 0; j < n && ln < 260; j++) {
      const a = time * (1.5 + (j % 5) * 0.3) + j * 2.4, r = 0.6 + (j % 7) * 0.22, y = (s.eating ? H(s.x, s.z) + 0.4 : 3) + Math.sin(time * 3 + j) * 0.5 + (j % 4) * 0.2;
      const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
      W.locustIM.setMatrixAt(ln++, _m.compose(_p.set(x, y, z), _q.setFromAxisAngle(THREE.Object3D.DefaultUp, a + Math.PI), _s.set(1.4, 1.4, 1.4)));
    }
  }
  W.locustIM.count = ln; W.locustIM.instanceMatrix.needsUpdate = true;
  // Sonnenstrahl
  const sb = G.sunbeam && G.now - G.sunbeam.t < 0.2 ? G.sunbeam : null;
  W.beam.visible = !!sb;
  if (sb) { const gy = Math.max(0, H(sb.x, sb.z)); W.beam.position.set(sb.x, gy, sb.z); W.beam.scale.set(1, D.CLOUD_Y + 6 - gy, 1); W.beam.material.opacity = 0.18 + Math.sin(time * 8) * 0.03; W.beamDisc.position.set(sb.x, gy + 0.08, sb.z); W.beamDisc.material.opacity = 0.35; }
  else W.beamDisc.material.opacity = Math.max(0, W.beamDisc.material.opacity - dt * 2);
  // Regenbogen
  if (G.rainbowT > 0) {
    G.rainbowT -= dt; const a = Math.min(1, (18 - G.rainbowT) / 2, G.rainbowT / 2);
    W.rainbow.visible = true; W.rainbow.material.opacity = 0.62 * a;
    const cy = Math.atan2(W.camera.position.x, W.camera.position.z);
    W.rainbow.position.set(-Math.sin(cy) * 6, -1, -Math.cos(cy) * 6); W.rainbow.rotation.set(0, cy, 0);
    if (Math.random() < dt * 4) { const p = pick(G.villagers); if (p) p.cheer = 2; }
  } else W.rainbow.visible = false;
  // Tornado
  const T = G.tornado;
  W.tornado.visible = !!T;
  if (T) { const a = T.fade ? 1 - T.fade : Math.min(1, T.t * 2); W.tornado.position.set(T.x, Math.max(0, H(T.x, T.z)) - 0.3, T.z); W.tornado.rotation.y += dt * 9; W.tornado.scale.set(a, a * 1.02, a); for (let j = 0; j < 3; j++) G.floaters.push({ x: T.x + rnd(-1, 1), y: rnd(0, 6), z: T.z + rnd(-1, 1), vx: rnd(-6, 6), vy: rnd(1, 4), vz: rnd(-6, 6), t: 0, life: 0.6, col: new THREE.Color(0x8a7a60) }); }
  // Blitze verblassen
  for (let i = W.bolts.length - 1; i >= 0; i--) { const b = W.bolts[i]; b.t += dt; b.m.material.opacity = Math.max(0, 1 - b.t * 3) * (Math.random() < 0.3 ? 0.4 : 1); if (b.t > 0.35) { W.scene.remove(b.m); b.m.geometry.dispose(); W.bolts.splice(i, 1); } }
  W.flashLight.intensity = Math.max(0, W.flashLight.intensity - dt * 18);
  // Polarlicht
  const au = W.aurora; au.material.opacity += ((G.aurora ? 0.55 : 0) - au.material.opacity) * dt;
  if (au.material.opacity > 0.01) { const p = au.geometry.attributes.position, b = au.userData.base; for (let i = 0; i < p.count; i++) p.setZ(i, b[i * 3 + 2] + Math.sin(b[i * 3] * 0.08 + time * 0.6) * 5); p.needsUpdate = true; }
  W.seaU.uTime.value = time; W.seaU.uWave.value += ((G.events.storm > 0 || G.boss ? 2.6 : G.events.monsoon > 0 ? 1.8 : 1) - W.seaU.uWave.value) * dt * 0.5;
}
const _c2 = new THREE.Color();
function updateTint(force) {
  G.tintT -= 1;
  const ss = SEASON(), tf = I.t / D.SEASON_LEN, nxt = D.SEASONS[(I.season + 1) % 4];
  const blend = sstep(0.75, 1, tf), tint = ss.tint.map((v, i) => lerp(v, nxt.tint[i], blend));
  if (I.def.tropical) tint[0] = tint[1] = tint[2] = 1;
  W.tintIsland((x, z) => sampleG(Wg, x, z), (x, z) => sampleG(Sg, x, z), tint, (x, z) => sampleG(Bg, x, z));
}

// =====================================================================
// Hauptupdate
// =====================================================================
function update(dtReal) {
  const dt = Math.min(0.05, dtReal) * G.speed;
  G.now += dt; const time = G.now;
  if (!I) return;
  advanceTime(dt);
  // Mana
  const regen = D.BAL.manaRegen * (0.55 + I.happy / 100 * 0.9) * (1 + 0.15 * sk('g2'));
  G.mana = Math.min(manaMax(), G.mana + regen * dt);
  if (G.mana < manaMax() * 0.3) hintDone('mana');
  G.tickAcc += dt;
  while (G.tickAcc >= 0.25) { G.tickAcc -= 0.25; simTick(0.25); }
  if (G.events.fest > 0) G.events.fest -= dt;
  updateClouds(dt); updateGusts(dt); updateThreats(dt, time); updateReqs(dt);
  updateParticles(dt, time); updateVillagers(dt);
  drawClouds(time); drawWorld(dt, time);
  if ((G.tintAcc = (G.tintAcc || 0) + dt) > 0.3) { G.tintAcc = 0; updateTint(); }
  const storm = clamp(G.clouds.reduce((s, c) => s + (c.fade ? 0 : Math.max(0, c.w - 0.5) * (Math.hypot(c.x, c.z) < 25 ? 1 : 0)), 0) * 0.25 + (G.events.storm > 0 ? 0.5 : 0) + (G.boss ? 0.6 : 0) + (G.events.drought > 0 ? -0.1 : 0), 0, 1);
  G.storm = storm;
  W.setSky(dayFrac(), I.def, storm, I.season);
  if (G.wishBoost > 25) hintDone('faith');
}

function travel(id) { if (!S.unlocked.includes(id) || (I && I.def.id === id)) return; loadIsland(id); persist(); }
function resetAll() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = defaultSave(); I = null; G.mana = 60; loadIsland('wiege'); }

WM.game = {
  get S() { return S; }, get I() { return I; }, G, P, D, sk, skillState, buySkill, powerUnlocked, manaMax, cloudMax, cloudAt, cloudR, update, loadIsland, travel, persist,
  housing, waterCap, totalPop, has, chron, addFaith, fulfil, msg, resetAll, sampleG, Wg, Sg, newCloud, startThreat, dayFrac, DEBUG,
  ensureFirstRequest() {
    if (G.reqs.some(r => r.type === 'rain') || (I.stats.wishes | 0) > 0) return;
    const f = I.fields.slice().sort((a, b) => a.m - b.m)[0]; if (f) addReq('rain', { x: f.x, z: f.z }, 120, 5, { f });
  },
};
})();
