// Tiefenrausch 3D – Spiellogik (Three.js r128, ArcadeCore). Daten: tiefenrausch/data.js, Modelle: models/tiefenrausch_models.js
(() => {
'use strict';

const AC = window.ArcadeCore || null;
const snd = (name, ...a) => { try { if (AC && AC[name]) AC[name](...a); } catch (e) {} };
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);
const fmt = n => Math.round(n).toLocaleString('de-DE');
const D = window.TR_DATA;
const DEBUG = /[?&]debug\b/.test(location.search);
if (!D || typeof THREE === 'undefined') { document.body.insertAdjacentHTML('beforeend', '<p style="position:fixed;top:40%;width:100%;text-align:center">Spieldaten konnten nicht geladen werden.</p>'); return; }
const V3 = THREE.Vector3, UP = new V3(0, 1, 0);
const DS = D.DEPTH_SCALE, depthM = y => Math.max(0, -y * DS);
const ZONES = D.ZONES, ORES = D.ORES, CRE = D.CREATURES;
const zoneIndexAt = m => { let i = 0; for (let k = 0; k < ZONES.length; k++) if (m >= ZONES[k].from) i = k; return i; };

// ============ Spielstand ============
const SAVE_KEY = 'tiefenrausch_save', SAVE_V = 1;
const STAT_KEYS = ['dives', 'surfaced', 'deaths', 'earned', 'ore', 'kills', 'scans', 'wrecks', 'contracts', 'jackpots', 'bestCombo', 'leviathan', 'playTime', 'beacons'];
function defaultSave() {
  const stats = {}; STAT_KEYS.forEach(k => stats[k] = 0);
  return { v: SAVE_V, money: 0, upg: {}, record: 0, codex: {}, notes: {}, contracts: [], stats, ach: {}, hints: {}, lastDive: null };
}
const nonNeg = v => Number.isFinite(+v) && +v > 0 ? +v : 0;
const plainObj = o => o && typeof o === 'object' && !Array.isArray(o);
function loadSave() {
  const d = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    if (!plainObj(s)) return d;
    d.money = Math.floor(nonNeg(s.money)); d.record = Math.floor(nonNeg(s.record));
    if (plainObj(s.upg)) D.UPGRADES.forEach(u => { const l = Math.floor(nonNeg(s.upg[u.id])); if (l) d.upg[u.id] = Math.min(l, u.max); });
    ['codex', 'notes', 'ach', 'hints'].forEach(k => { if (plainObj(s[k])) Object.keys(s[k]).forEach(id => { if (s[k][id]) d[k][id] = 1; }); });
    if (plainObj(s.stats)) STAT_KEYS.forEach(k => d.stats[k] = nonNeg(s.stats[k]));
    if (Array.isArray(s.contracts)) d.contracts = s.contracts.filter(c => plainObj(c) && typeof c.type === 'string' && Number.isFinite(+c.goal) && Number.isFinite(+c.reward)).slice(0, 3)
      .map(c => ({ type: c.type, ore: typeof c.ore === 'string' && ORES[c.ore] ? c.ore : null, goal: Math.max(1, +c.goal), prog: nonNeg(c.prog), reward: Math.floor(nonNeg(c.reward)) }))
      .filter(c => c.type !== 'ore' || c.ore);
    if (plainObj(s.lastDive)) d.lastDive = s.lastDive;
  } catch (e) { return defaultSave(); }
  return d;
}
let save = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
const lvl = id => save.upg[id] || 0;
let S = D.stats(lvl);
const priceOf = u => Math.round(u.base * Math.pow(u.g, lvl(u.id)));
const zoneReached = () => zoneIndexAt(save.record);

// ============ Renderer ============
const coarse = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ antialias: !coarse, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5));
renderer.setSize(innerWidth, innerHeight);
$('view').appendChild(renderer.domElement);
const canvas = renderer.domElement;
const scene = new THREE.Scene();
const FOG = new THREE.FogExp2(0x1f6f86, 0.012);
scene.fog = FOG; scene.background = new THREE.Color(0x1f6f86);
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 700);
function fitCamera() {
  camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 1 ? 82 : 68;
  camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
  fxc.width = innerWidth; fxc.height = innerHeight; drawCracks();
}
const fxc = $('fx'), fxx = fxc.getContext('2d');

const hemi = new THREE.HemisphereLight(0x9fdcff, 0x2a3a30, 1);
const sun = new THREE.DirectionalLight(0xfff4dd, 0.8); sun.position.set(30, 100, 20);
const headlight = new THREE.SpotLight(0xfff0d8, 2, 30, 0.6, 0.55, 1.4);
const fill = new THREE.PointLight(0x9fd8ff, 0.9, 14, 1.2);
scene.add(hemi, sun, sun.target, headlight, headlight.target, fill);

// ============ Sonar-Shader (an jedes Material angehängt) ============
// Ein Ping zur Zeit: Wellenfront leuchtet hell auf, Spur verblasst. Läuft NACH dem Nebel -> sieht durch die Trübung.
const WAVE = 42;
const PING = { uPO: { value: new V3() }, uPT: { value: 99 }, uPR: { value: 0 } };
function sonarize(mat, col, k) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uPO = PING.uPO; sh.uniforms.uPT = PING.uPT; sh.uniforms.uPR = PING.uPR;
    sh.uniforms.uPC = { value: new THREE.Color(col).multiplyScalar(k) };
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      vec4 wp0 = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
      wp0 = instanceMatrix * wp0;
      #endif
      vWP = (modelMatrix * wp0).xyz;`);
    sh.fragmentShader = 'uniform vec3 uPO; uniform float uPT; uniform float uPR; uniform vec3 uPC; varying vec3 vWP;\n' +
      sh.fragmentShader.replace('#include <fog_fragment>', `#include <fog_fragment>
      if (uPR > 0.0) {
        float dd = distance(vWP, uPO), fr = uPT * ${WAVE.toFixed(1)};
        float rd = (dd - fr) / 0.9; float ring = exp(-rd * rd);
        float trail = dd < fr ? exp(-(uPT - dd / ${WAVE.toFixed(1)}) * 1.2) * 0.12 : 0.0;
        gl_FragColor.rgb += uPC * (ring + trail) * (1.0 - smoothstep(uPR * 0.75, uPR, dd));
      }`);
  };
  return mat;
}
const phong = (o, sonarCol, k) => sonarize(new THREE.MeshPhongMaterial(Object.assign({ vertexColors: true, flatShading: true, shininess: 18 }, o)), sonarCol, k);
const MAT = {
  terrain: phong({ shininess: 4 }, 0x38e8ff, 0.45),
  solid: phong({}, 0x7fd8ff, 0.35),
  smooth: phong({ flatShading: false, shininess: 40 }, 0x7fd8ff, 0.35),
  ore: phong({ shininess: 80, emissive: 0x000000 }, 0xffe066, 1.3),
  glow: sonarize(new THREE.MeshBasicMaterial({ vertexColors: true }), 0xffffff, 0.3),
  glass: sonarize(new THREE.MeshPhongMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.55, shininess: 120, specular: 0xffffff, emissive: 0x0a3040 }), 0x7fd8ff, 0.3),
  jelly: sonarize(new THREE.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false, emissive: 0x113344, shininess: 60, side: THREE.DoubleSide }), 0xff6060, 0.8),
};
// Erze leuchten leicht in ihrer Farbe (im Dunkeln sichtbar, Scheinwerfer macht sie brillant)
MAT.ore.onBeforeCompile = (orig => sh => { orig(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * 0.38;'); })(MAT.ore.onBeforeCompile);

// ============ Modelle aus Blender ============
const MD = window.TIEFENRAUSCH_MODELS;
const GEO = {};
if (MD && Array.isArray(MD.objects)) MD.objects.forEach(o => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(o.v, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(o.c.map(x => x / 255), 3));
  g.setIndex(o.f); g.computeVertexNormals(); g.computeBoundingSphere();
  GEO[o.n] = { geo: g, t: o.t || [0, 0, 0], p: o.p || null, e: !!o.e, s: !!o.s, glass: !!o.g };
});
// Fallback-Geometrie, falls ein Teil fehlt (Spiel bleibt spielbar)
function colored(g, hex) {
  g = g.index ? g : g; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
const FALLBACK = {
  ore_vein: () => colored(new THREE.DodecahedronGeometry(0.8, 0), 0xffffff),
  ore_crystal: () => colored(new THREE.OctahedronGeometry(0.9, 0).scale(0.6, 1.4, 0.6), 0xffffff),
  ore_nodule: () => colored(new THREE.IcosahedronGeometry(0.7, 0), 0xffffff),
  ore_pearl: () => colored(new THREE.SphereGeometry(0.6, 10, 8), 0xffffff),
  fish: () => colored(new THREE.ConeGeometry(0.25, 1, 5).rotateX(Math.PI / 2), 0xffffff),
};
function G(name) {
  if (GEO[name]) return GEO[name].geo;
  if (!GEO['_fb_' + name]) GEO['_fb_' + name] = { geo: (FALLBACK[name] || (() => colored(new THREE.BoxGeometry(1, 1, 1), 0x888888)))(), t: [0, 0, 0] };
  return GEO['_fb_' + name].geo;
}
const off = name => GEO[name] ? GEO[name].t : [0, 0, 0];
function matFor(name) {
  const g = GEO[name];
  if (!g) return MAT.solid;
  if (g.glass) return MAT.glass;
  if (g.e) return MAT.glow;
  return g.s ? MAT.smooth : MAT.solid;
}
function part(name, mat) { const m = new THREE.Mesh(G(name), mat || matFor(name)); m.position.fromArray(off(name)); return m; }
// Baut ein Objekt aus allen Teilen "prefix_*" (Eltern-Verknüpfung über p); Kettenglieder werden separat instanziert
const CHAIN_PARTS = new Set(['eel_seg', 'eel_tail', 'lev_seg', 'lev_tail', 'squid_arm']);
function build(prefix, matOverride) {
  const parts = {}, root = new THREE.Group();
  Object.keys(GEO).filter(n => n.startsWith(prefix + '_') && !CHAIN_PARTS.has(n)).forEach(n => {
    const g = new THREE.Group(); g.position.fromArray(GEO[n].t);
    const mo = matOverride && !GEO[n].e && !GEO[n].glass ? matOverride : matFor(n);
    g.add(new THREE.Mesh(GEO[n].geo, mo)); parts[n.slice(prefix.length + 1)] = g;
  });
  Object.keys(parts).forEach(k => { const p = GEO[prefix + '_' + k].p; (p && parts[p.slice(prefix.length + 1)] || root).add(parts[k]); });
  root.userData.parts = parts;
  return root;
}

// ============ Rauschen & Graben ============
function rng32(seed) { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
function makeNoise(seed) {
  const r = rng32(seed), P = new Uint16Array(512), Gv = new Float32Array(256), perm = [];
  for (let i = 0; i < 256; i++) perm.push(i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)), t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
  for (let i = 0; i < 256; i++) Gv[i] = r() * 2 - 1;
  return (x, y, z) => {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    let u = x - X, v = y - Y, w = z - Z; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); w = w * w * (3 - 2 * w);
    const a = X & 255, b = Y & 255, c = Z & 255;
    const h = (i, j, k) => Gv[P[P[P[i] + j] + k]];
    const x0 = lerp(h(a, b, c), h(a + 1, b, c), u), x1 = lerp(h(a, b + 1, c), h(a + 1, b + 1, c), u);
    const x2 = lerp(h(a, b, c + 1), h(a + 1, b, c + 1), u), x3 = lerp(h(a, b + 1, c + 1), h(a + 1, b + 1, c + 1), u);
    return lerp(lerp(x0, x1, v), lerp(x2, x3, v), w);
  };
}
let N1 = makeNoise(1), N2 = makeNoise(2), WS = [0, 1, 2, 3], diveSeed = 1;
function newWorld(seed) { diveSeed = seed >>> 0; N1 = makeNoise(seed); N2 = makeNoise(seed * 7 + 13); const r = rng32(seed + 99); WS = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28]; }
// Grabenmitte schlängelt sich mit der Tiefe (an der Oberfläche genau unter der Station)
const _c = { x: 0, z: 0 };
function center(y) {
  const k = smooth(0, 45, -y);
  _c.x = k * (16 * Math.sin(y * 0.006 + WS[0]) + 7 * Math.sin(y * 0.017 + WS[1]));
  _c.z = k * (16 * Math.cos(y * 0.0051 + WS[2]) + 7 * Math.sin(y * 0.013 + WS[3]));
  return _c;
}
function zoneBlend(m) {
  const i = zoneIndexAt(m), n = ZONES[i + 1];
  if (!n) return { a: ZONES[i], b: ZONES[i], t: 0, i };
  return { a: ZONES[i], b: n, t: smooth(n.from - 50, n.from, m), i };
}
function baseR(y) {
  const m = depthM(y), zb = zoneBlend(m);
  let r = lerp(zb.a.radius, zb.b.radius, zb.t);
  const cav = N2(y * 0.008, 3.3, 7.1);
  r *= 1 + 0.5 * Math.max(0, cav * 1.6 - 0.15);
  return r + 50 * Math.exp(y / 22);
}
function radiusAt(th, y, br) {
  const ca = Math.cos(th), sa = Math.sin(th), b = br || baseR(y);
  const n = N1(ca * 1.5, sa * 1.5, y * 0.04) * 0.62 + N1(ca * 3.1 + 5, sa * 3.1, y * 0.09) * 0.3 + N1(ca * 7 + 9, sa * 7, y * 0.2) * 0.12;
  const l = Math.pow(Math.max(0, Math.sin(y * 0.07 + N2(ca, sa, y * 0.01) * 4)), 6) * 0.16;
  return Math.max(9, b * (1 + n * 0.55 - l));
}
// Punkt auf der Wand (pos) + Normale nach innen
function wallPoint(th, y, inset, out) {
  const c = center(y), R = radiusAt(th, y) - inset, ca = Math.cos(th), sa = Math.sin(th);
  out.pos.set(c.x + ca * R, y, c.z + sa * R); out.n.set(-ca, 0, -sa); return out;
}

// ============ Chunks ============
const CH = 30, NR = 20, NS = 56;
const chunks = new Map();
let mined = new Set(), looted = new Set(), wreckChunk = {};
const _col = new THREE.Color(), _col2 = new THREE.Color(), _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _s = new V3(), _p = new V3(), _v = new V3(), _e = new THREE.Euler();
function pickWeighted(obj, r, filter) {
  let tot = 0; for (const k in obj) if (!filter || filter(k)) tot += obj[k];
  if (!tot) return null;
  let x = r * tot; for (const k in obj) { if (filter && !filter(k)) continue; x -= obj[k]; if (x <= 0) return k; }
  return Object.keys(obj)[0];
}
function terrainGeo(k) {
  const y0 = -k * CH, nv = (NR + 1) * (NS + 1), pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = [];
  const cb = new THREE.Color();
  for (let r = 0; r <= NR; r++) {
    const y = y0 - r * CH / NR, br = baseR(y), c = center(y), m = depthM(y), zb = zoneBlend(m);
    const cx = c.x, cz = c.z;
    for (let j = 0; j <= NS; j++) {
      const th = j / NS * Math.PI * 2, R = radiusAt(th, y, br), i = r * (NS + 1) + j, ca = Math.cos(th), sa = Math.sin(th);
      pos[i * 3] = cx + ca * R; pos[i * 3 + 1] = y; pos[i * 3 + 2] = cz + sa * R;
      const mix = clamp(N1(ca * 2 + 3, sa * 2, y * 0.05) + 0.5, 0, 1);
      _col.setHex(zb.a.wall).lerp(_col2.setHex(zb.a.wall2), mix);
      if (zb.t > 0) { cb.setHex(zb.b.wall).lerp(_col2.setHex(zb.b.wall2), mix); _col.lerp(cb, zb.t); }
      const ao = clamp(1.15 - (R / br - 1) * 2.4, 0.35, 1.3) * (0.85 + 0.3 * N1(ca * 9, sa * 9, y * 0.3));
      col[i * 3] = _col.r * ao; col[i * 3 + 1] = _col.g * ao; col[i * 3 + 2] = _col.b * ao;
    }
  }
  for (let r = 0; r < NR; r++) for (let j = 0; j < NS; j++) {
    const a = r * (NS + 1) + j, b = a + 1, c = a + NS + 1, d = c + 1;
    idx.push(a, c, b, b, c, d); // Winding nach innen
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
const WP = { pos: new V3(), n: new V3() };
const orientUp = (n, out) => out.setFromUnitVectors(UP, n);
function makeIM(geo, mat, list, colorFn) {
  if (!list.length) return null;
  const im = new THREE.InstancedMesh(geo, mat, list.length); im.frustumCulled = false; // r128: Culling kennt die Instanzen nicht
  list.forEach((d, i) => { im.setMatrixAt(i, _m4.compose(d.p, d.q, d.s)); if (colorFn) im.setColorAt(i, colorFn(d, _col)); });
  scene.add(im); return im;
}

function buildChunk(k) {
  const y0 = -k * CH, r = rng32(diveSeed ^ Math.imul(k + 1, 2654435761)), ch = { k, ims: [], nodes: [], rocks: [], vents: [], pockets: [], items: [], wreck: null, mobs: [], schools: [] };
  ch.mesh = new THREE.Mesh(terrainGeo(k), MAT.terrain); scene.add(ch.mesh);
  const ym = y0 - CH / 2, zi = zoneIndexAt(depthM(ym)), Z = ZONES[zi];
  const randY = () => y0 - 1 - r() * (CH - 2);
  // Erzadern an der Wand
  const nOre = k === 0 ? 4 : 6 + Math.min(4, zi) + Math.floor(r() * 4);
  const addNode = (pos, n, y, i, forceType) => {
    const id = k * 1000 + i;
    const zz = ZONES[zoneIndexAt(depthM(y))];
    let type = forceType || pickWeighted(zz.ores, r());
    const jack = !forceType && r() < 0.035;
    if (jack) { const ks = Object.keys(zz.ores); type = ks[Math.min(ks.length - 1, ks.indexOf(type) + 1)]; }
    const units = jack ? 8 + Math.floor(r() * 4) : 2 + Math.floor(r() * 3) + (ORES[type].shape === 'nodule' ? 1 : 0);
    const q = orientUp(n, new THREE.Quaternion()).multiply(_q2.setFromAxisAngle(UP, r() * 6.3)), sc = jack ? 1.5 : 0.9 + r() * 0.5;
    if (mined.has(id)) return; // nach allen r()-Aufrufen, damit der Chunk-Zufall gleich bleibt
    ch.nodes.push({ id, type, units, max: units, pos: pos.clone(), n: n.clone(), q, sc, jack, prog: 0, wob: 0, alive: true, seen: -99 });
  };
  for (let i = 0; i < nOre; i++) {
    const y = randY(), th = r() * Math.PI * 2;
    wallPoint(th, y, 0.25, WP); WP.n.y += (r() - 0.5) * 0.6; WP.n.normalize();
    addNode(WP.pos, WP.n, y, i);
  }
  // Felsbrocken im Schacht (teils mit Erz)
  if (k > 2) {
    const nr = r() < 0.6 ? 1 + Math.floor(r() * 2) : 0;
    for (let i = 0; i < nr; i++) {
      const y = randY(), c = center(y), th = r() * 6.3, br = baseR(y), d = br * (0.25 + r() * 0.35), rad = 2.2 + r() * 2.8;
      const p = new V3(c.x + Math.cos(th) * d, y, c.z + Math.sin(th) * d);
      ch.rocks.push({ p, r: rad, q: new THREE.Quaternion().setFromEuler(_e.set(r() * 6, r() * 6, r() * 6)) });
      if (r() < 0.6) { const dir = new V3(r() - 0.5, r() * 0.8, r() - 0.5).normalize(); addNode(p.clone().addScaledVector(dir, rad * 0.85), dir, y, 100 + i); }
    }
    ch.ims.push(makeIM(G('rock'), MAT.solid, ch.rocks.map(o => ({ p: o.p, q: o.q, s: new V3(o.r, o.r, o.r) }))));
  }
  // Deko: Kelp & Korallen
  const decoKelp = [], decoCoral = [];
  const m0 = depthM(y0);
  if (m0 < 190) for (let i = 0; i < 34; i++) {
    const y = randY(); if (depthM(y) > 175) continue;
    wallPoint(r() * 6.3, y, 0.1, WP); const n = WP.n.clone().multiplyScalar(0.35).add(UP).normalize();
    const s = 1.4 + r() * 2.4; decoKelp.push({ p: WP.pos.clone(), q: orientUp(n, new THREE.Quaternion()).multiply(_q2.setFromAxisAngle(UP, r() * 6.3)), s: new V3(s, s * (0.8 + r() * 0.8), s) });
  }
  if (m0 > 90 && m0 < 470) for (let i = 0; i < 44; i++) {
    const y = randY(); wallPoint(r() * 6.3, y, 0.15, WP); WP.n.y += 0.6; WP.n.normalize();
    const s = 1.2 + r() * 2.2; decoCoral.push({ p: WP.pos.clone(), q: orientUp(WP.n, new THREE.Quaternion()).multiply(_q2.setFromAxisAngle(UP, r() * 6.3)), s: new V3(s, s, s), c: r() });
  }
  if (zi >= 3) for (let i = 0; i < 14; i++) { // leuchtende Tiefsee-Polypen
    const y = randY(); wallPoint(r() * 6.3, y, 0.1, WP); const s = 0.5 + r() * 0.8;
    decoCoral.push({ p: WP.pos.clone(), q: orientUp(WP.n, new THREE.Quaternion()), s: new V3(s, s, s), c: r(), glow: true });
  }
  ch.ims.push(makeIM(G('kelp'), MAT.kelp, decoKelp, (d, c) => c.setHSL(0.22 + d.s.y * 0.01, 0.5, 0.45)));
  const CORAL_COLS = [0xff7a8a, 0xffb04a, 0xc77dff, 0x5fd8c8, 0xff5a5a, 0xf5e07a];
  ch.ims.push(makeIM(G('coral'), MAT.solid, decoCoral.filter(d => !d.glow), (d, c) => c.setHex(CORAL_COLS[Math.floor(d.c * CORAL_COLS.length)])));
  ch.ims.push(makeIM(G('coral'), MAT.glowTint, decoCoral.filter(d => d.glow), (d, c) => c.setHSL(0.5 + d.c * 0.35, 0.9, 0.55)));
  // Schlote mit heißer Fahne
  if (Z.id === 'vents' || (zi > 4 && r() < 0.3)) {
    const nv = Z.id === 'vents' ? 2 + Math.floor(r() * 2) : 1, list = [];
    for (let i = 0; i < nv; i++) {
      const y = randY(); wallPoint(r() * 6.3, y, -0.5, WP);
      const p = WP.pos.clone(), s = 1.2 + r() * 0.8, top = p.clone().add(new V3(WP.n.x * 1.2, 3.6 * s, WP.n.z * 1.2));
      ch.vents.push({ p, top, s }); list.push({ p, q: new THREE.Quaternion().setFromAxisAngle(UP, r() * 6.3), s: new V3(s, s, s) });
      for (let j = 0; j < 2; j++) { const a = r() * 6.3; addNode(p.clone().add(new V3(Math.cos(a) * 2.4, 1 + r() * 2, Math.sin(a) * 2.4)), WP.n.clone().add(UP).normalize(), y, 200 + i * 4 + j, r() < 0.55 ? 'feueropal' : null); }
    }
    ch.ims.push(makeIM(G('vent'), MAT.solid, list));
  }
  // Luftblasen-Quellen
  if (k > 1 && r() < 0.28 + zi * 0.03) {
    const y = randY(); wallPoint(r() * 6.3, y, 0.6, WP);
    ch.pockets.push({ p: WP.pos.clone(), n: WP.n.clone(), air: 80, seen: -99 });
  }
  // Treibende Rettungsboje (+1 Notboje für diesen Tauchgang)
  if (depthM(y0) > 300 && r() < 0.07) {
    const y = randY(), c = center(y), a = r() * 6.3, d = baseR(y) * 0.4;
    addItem(ch, 'buoy', new V3(c.x + Math.cos(a) * d, y, c.z + Math.sin(a) * d));
  }
  // Wrack
  const wz = ZONES.findIndex(z => wreckChunk[z.id] === k);
  if (wz >= 0) {
    const y = ym, th = r() * 6.3; wallPoint(th, y, 3.2, WP);
    const g = build('wreck'); g.position.copy(WP.pos); g.rotation.y = Math.atan2(WP.n.x, WP.n.z) + Math.PI / 2; g.rotation.z = (r() - 0.5) * 0.4;
    const sc = 1 + wz * 0.08; g.scale.setScalar(sc); scene.add(g);
    ch.wreck = { zone: ZONES[wz].id, zi: wz, g, p: WP.pos.clone(), r: 3.6 * sc, prog: 0, looted: looted.has(ZONES[wz].id), seen: -99 };
  }
  spawnLife(ch, r, zi, randY);
  return ch;
}
function disposeChunk(ch) {
  scene.remove(ch.mesh); ch.mesh.geometry.dispose();
  ch.ims.forEach(im => { if (im) { scene.remove(im); im.dispose(); } });
  if (ch.wreck) scene.remove(ch.wreck.g);
  ch.items.forEach(it => scene.remove(it.g));
  despawnLife(ch);
}
function addItem(ch, kind, p) {
  const g = build(kind === 'buoy' ? 'buoy' : 'crate');
  g.position.copy(p); if (kind === 'buoy') g.scale.setScalar(0.6); scene.add(g);
  const it = { kind, p: p.clone(), g, t: Math.random() * 6, seen: -99, prog: 0, r: 1.6, done: false };
  ch.items.push(it); return it;
}
let curChunk = 0;
function updateChunks(force) {
  curChunk = Math.max(0, Math.floor(-sub.pos.y / CH));
  const lo = Math.max(0, curChunk - 2), hi = curChunk + 3;
  for (const [k, ch] of chunks) if (k < lo || k > hi) { disposeChunk(ch); chunks.delete(k); }
  // nächstgelegenen fehlenden Chunk bauen (einer pro Frame, außer beim Start)
  for (const k of [curChunk, curChunk + 1, curChunk - 1, curChunk + 2, curChunk - 2, curChunk + 3]) {
    if (k < lo || k > hi || chunks.has(k)) continue;
    chunks.set(k, buildChunk(k));
    if (!force) break;
  }
}
function clearWorld() { for (const ch of chunks.values()) disposeChunk(ch); chunks.clear(); }
function forNodes(fn) { for (const ch of chunks.values()) for (const n of ch.nodes) if (n.alive) fn(n, ch); }

// ============ Zusatz-Materialien ============
const TIME = { value: 0 };
MAT.kelp = phong({ side: THREE.DoubleSide }, 0x38e8ff, 0.4);
MAT.kelp.onBeforeCompile = (orig => sh => {
  orig(sh); sh.uniforms.uTime = TIME;
  sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.21;
    transformed.x += sin(uTime * 1.3 + ph + position.y * 0.5) * position.y * 0.09;
    transformed.z += cos(uTime * 1.1 + ph + position.y * 0.4) * position.y * 0.06;`);
})(MAT.kelp.onBeforeCompile);
MAT.glowTint = sonarize(new THREE.MeshBasicMaterial({ vertexColors: true }), 0xffffff, 0.3);
MAT.fish = phong({ shininess: 50 }, 0xff6060, 0.6);
MAT.fish.onBeforeCompile = (orig => sh => { orig(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * 0.22;'); })(MAT.fish.onBeforeCompile);
const ADD = o => new THREE.MeshBasicMaterial(Object.assign({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }, o));

// ============ Oberfläche, Station, Lichtstrahlen ============
const waterTop = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400, 1, 1).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x0b5f80, shininess: 90, specular: 0x9fdfff, transparent: true, opacity: 0.92 }));
const waterBot = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400, 1, 1).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x8fe0f5, transparent: true, opacity: 0.55 }));
waterBot.position.y = -0.05;
scene.add(waterTop, waterBot);
const station = build('station'); scene.add(station);
const raysMat = ADD({ color: 0xbfefff, opacity: 0.07, side: THREE.DoubleSide });
const rays = [];
for (let i = 0; i < 9; i++) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 4 + Math.random() * 4, 110, 10, 1, true).translate(0, -55, 0), raysMat);
  const a = Math.random() * 6.3, d = 8 + Math.random() * 40; m.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
  m.rotation.set(rnd(-0.25, 0.25), 0, rnd(-0.25, 0.25)); m.userData.ph = Math.random() * 6; rays.push(m); scene.add(m);
}

// ============ Meeresschnee (GPU-Wrap um die Kamera) ============
const SNOW_N = coarse ? 700 : 1200;
const snowU = { uCam: { value: new V3() }, uTime: TIME, uBright: { value: 0.6 }, uCol: { value: new THREE.Color(0xcfefff) } };
{
  const p = new Float32Array(SNOW_N * 3); for (let i = 0; i < p.length; i++) p[i] = Math.random() * 50;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.ShaderMaterial({ uniforms: snowU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform vec3 uCam; uniform float uTime; varying float vA;
      void main() { vec3 p = position + vec3(sin(uTime * 0.3 + position.y) * 0.6, -uTime * 0.35, cos(uTime * 0.25 + position.x) * 0.6);
        p = mod(p - uCam + 25.0, 50.0) - 25.0 + uCam; vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = length(mv.xyz); vA = (1.0 - smoothstep(6.0, 25.0, d)) * smoothstep(0.5, 2.0, d);
        gl_PointSize = 70.0 / max(d, 1.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uBright; uniform vec3 uCol; varying float vA;
      void main() { float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard; gl_FragColor = vec4(uCol * uBright * vA * (1.0 - r * 2.0), 1.0); }` });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
}

// ============ Partikel ============
const PMAX = 1200, parts = [];
const pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3), pSize = new Float32Array(PMAX);
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('size', new THREE.BufferAttribute(pSize, 1).setUsage(THREE.DynamicDrawUsage));
const pPoints = new THREE.Points(pGeo, new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC;
    void main() { vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * 300.0 / max(-mv.z, 0.5); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `varying vec3 vC; void main() { float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard; gl_FragColor = vec4(vC * (1.0 - r * 2.0), 1.0); }`,
}));
pPoints.frustumCulled = false; scene.add(pPoints);
function emit(p, v, life, size, hex, grav, drag) {
  if (parts.length >= PMAX) parts.shift();
  _col.setHex(hex);
  parts.push({ p: p.clone(), v: v.clone(), life, max: life, size, r: _col.r, g: _col.g, b: _col.b, grav: grav || 0, drag: drag == null ? 2 : drag });
}
function burst(p, n, speed, life, size, hex, grav) {
  for (let i = 0; i < n; i++) { _v.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(speed * rnd(0.3, 1)); emit(p, _v, life * rnd(0.6, 1.2), size * rnd(0.6, 1.3), hex, grav); }
}
function updateParticles(dt) {
  let n = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i]; q.life -= dt;
    if (q.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
    q.v.y += q.grav * dt; q.v.multiplyScalar(Math.exp(-q.drag * dt)); q.p.addScaledVector(q.v, dt);
  }
  for (const q of parts) {
    const a = q.life / q.max;
    pPos[n * 3] = q.p.x; pPos[n * 3 + 1] = q.p.y; pPos[n * 3 + 2] = q.p.z;
    pCol[n * 3] = q.r * a; pCol[n * 3 + 1] = q.g * a; pCol[n * 3 + 2] = q.b * a; pSize[n] = q.size * (0.5 + a * 0.5); n++;
  }
  pGeo.setDrawRange(0, n);
  pGeo.attributes.position.needsUpdate = pGeo.attributes.color.needsUpdate = pGeo.attributes.size.needsUpdate = true;
}

// ============ U-Boot ============
const subG = build('sub'); scene.add(subG);
const SP = subG.userData.parts;
const ZAX = new V3(0, 0, 1);
const drillTip = new V3(0, 0, GEO.sub_drill ? (G('sub_drill').computeBoundingBox(), G('sub_drill').boundingBox.max.z) : 0.6);
const coneU = { uOp: { value: 0 } };
const lightCone = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 7, 26, 20, 1, true).translate(0, -13, 0).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
  uniforms: coneU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: `varying float vL; varying float vE; void main() { vL = position.z / 26.0; vec3 n = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vE = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float uOp; varying float vL; varying float vE; void main() { float a = uOp * pow(1.0 - clamp(vL, 0.0, 1.0), 2.0) * vE * vE; gl_FragColor = vec4(vec3(1.0, 0.93, 0.78) * a, 1.0); }`,
}));
lightCone.frustumCulled = false; scene.add(lightCone);
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 1, 6, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5), ADD({ color: 0xffb040, opacity: 0.85 }));
beam.visible = false; scene.add(beam);
const oreBitIM = new THREE.InstancedMesh(G('ore_crystal'), MAT.ore, 60); oreBitIM.count = 0; oreBitIM.frustumCulled = false; scene.add(oreBitIM);
const oreIM = {};
['vein', 'crystal', 'nodule', 'pearl'].forEach(s => { const im = new THREE.InstancedMesh(G('ore_' + s), MAT.ore, 500); im.count = 0; im.frustumCulled = false; scene.add(im); oreIM[s] = im; });
const fishIM = new THREE.InstancedMesh(G('fish'), MAT.fish, 500); fishIM.count = 0; fishIM.frustumCulled = false; scene.add(fishIM);
const fallIM = new THREE.InstancedMesh(G('rock'), MAT.solid, 24); fallIM.count = 0; fallIM.frustumCulled = false; scene.add(fallIM);
const pocketRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 6, 20), ADD({ color: 0x7fe8ff, opacity: 0.5 }));
const SUB_R = 1.5;
const sub = {
  pos: new V3(), vel: new V3(), yaw: 0, roll: 0, pitch: 0, hull: 100, o2: 100, bat: 100, light: true, boosting: false,
  aimYaw: 0, aimPitch: -0.12, harpCD: 0, invuln: 0, grabbedBy: null, mash: 0, buoys: 0, charges: 0,
  cargo: {}, cargoN: 0, bonus: 0, combo: 0, comboT: 0, drilling: false,
};
const aimDir = new V3(), fwd = new V3();
function updateAimDir() {
  const y = sub.yaw + sub.aimYaw, p = sub.aimPitch;
  aimDir.set(Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p));
  fwd.set(Math.sin(sub.yaw), 0, Math.cos(sub.yaw));
}

// ============ Kreaturen ============
const mobs = [], schools = [];
const TINT = { schattenaal: 0x8a70b0, geisterqualle: 0xe0b0ff, leuchtqualle: 0xffffff, muraene: 0xffffff, anglerfisch: 0xffffff, riesenkalmar: 0xffffff, leviathan: 0xffffff };
function mobMat(sp, jelly) {
  const m = jelly ? MAT.jelly.clone() : MAT.solid.clone();
  sonarize(m, 0xff4a4a, 1.0); m.color.setHex(TINT[sp] || 0xffffff); return m;
}
function spawnLife(ch, r, zi, randY) {
  const Z = ZONES[zi];
  for (const sp of Z.life) {
    const d = CRE[sp];
    if (d.kind === 'school') {
      const n = 1 + (r() < 0.6 ? 1 : 0);
      for (let i = 0; i < n; i++) { const y = randY(), c = center(y), a = r() * 6.3, dd = baseR(y) * 0.35 * r(); schools.push(makeSchool(sp, new V3(c.x + Math.cos(a) * dd, y, c.z + Math.sin(a) * dd), ch.k, r)); }
      continue;
    }
    if (ch.k < 2) continue;
    const n = d.kind === 'eel' ? (sp === 'muraene' ? (r() < 0.7 ? 1 + (r() < 0.35 ? 1 : 0) : 0) : (r() < 0.5 ? 1 : 0))
      : d.kind === 'jelly' ? 1 + Math.floor(r() * 2.5) : d.kind === 'angler' ? (r() < 0.55 ? 1 : 0) : d.kind === 'squid' ? (r() < 0.3 ? 1 : 0) : 0;
    for (let i = 0; i < n; i++) {
      const y = randY();
      if (d.kind === 'eel' && sp === 'muraene') { wallPoint(r() * 6.3, y, 0.2, WP); mobs.push(makeMob(sp, WP.pos.clone(), ch.k, WP.n.clone())); }
      else if (d.kind === 'angler') { wallPoint(r() * 6.3, y, 3.5, WP); mobs.push(makeMob(sp, WP.pos.clone(), ch.k, WP.n.clone())); }
      else { const c = center(y), a = r() * 6.3, dd = baseR(y) * 0.45 * r(); mobs.push(makeMob(sp, new V3(c.x + Math.cos(a) * dd, y, c.z + Math.sin(a) * dd), ch.k, null)); }
    }
  }
}
function despawnLife(ch) {
  for (let i = mobs.length - 1; i >= 0; i--) { const m = mobs[i]; if (m.k === ch.k && m.kind !== 'boss' && sub.grabbedBy !== m) removeMob(i); }
  for (let i = schools.length - 1; i >= 0; i--) if (schools[i].k === ch.k) schools.splice(i, 1);
}
function makeSchool(sp, c, k, r) {
  const fish = [], n = 8 + Math.floor(r() * 9);
  for (let i = 0; i < n; i++) fish.push({ ph: r() * 6.3, rad: 1.5 + r() * 3.8, sp: (0.5 + r() * 0.7) * (r() < 0.5 ? 1 : -1), yo: (r() - 0.5) * 3, s: 0.8 + r() * 0.45 });
  return { sp, d: CRE[sp], c, v: new V3(), k, fish, t: r() * 100, seen: -99, scanned: false };
}
function makeMob(sp, pos, k, home) {
  const d = CRE[sp], m = { sp, d, kind: d.kind, pos: pos.clone(), vel: new V3(), hp: d.hp, state: 'idle', t: Math.random() * 10, stun: 0, flash: 0, cd: 1, k, seen: -99, scanned: false, dead: 0, home: home ? pos.clone() : null, n: home, ims: [] };
  m.mat = mobMat(sp, d.kind === 'jelly');
  m.baseEm = new THREE.Color(d.glow || d.col).multiplyScalar(d.kind === 'jelly' ? 0.35 : 0.1);
  if (d.kind === 'jelly') { m.g = build('jelly', m.mat); m.g.scale.setScalar(sp === 'geisterqualle' ? 1.5 : 1.1); m.hitR = 1.5; }
  else if (d.kind === 'angler') { m.g = build('angler', m.mat); m.g.scale.setScalar(1.4); m.hitR = 1.8; m.g.position.copy(pos); m.g.lookAt(_v.copy(pos).add(home)); }
  else if (d.kind === 'squid') { m.g = build('squid', m.mat); m.g.scale.setScalar(1.3); m.hitR = 1.9; m.arms = new THREE.InstancedMesh(G('squid_arm'), m.mat, 8 * 6); m.arms.frustumCulled = false; scene.add(m.arms); m.ims.push(m.arms); }
  else if (d.kind === 'eel' || d.kind === 'boss') {
    const boss = d.kind === 'boss', NSEG = boss ? 22 : 11, L = boss ? 2.5 : 0.62;
    m.g = build(boss ? 'lev' : 'eel', m.mat); m.g.scale.setScalar(boss ? 3 : 0.9); m.hitR = boss ? 3.4 : 0.9;
    m.segIM = new THREE.InstancedMesh(G(boss ? 'lev_seg' : 'eel_seg'), m.mat, NSEG); m.segIM.frustumCulled = false; scene.add(m.segIM); m.ims.push(m.segIM);
    m.tail = new THREE.Mesh(G(boss ? 'lev_tail' : 'eel_tail'), m.mat); scene.add(m.tail);
    m.L = L; m.pts = [];
    const back = home ? home.clone().negate() : new V3(0, 1, 0);
    for (let i = 0; i <= NSEG + 1; i++) m.pts.push(pos.clone().addScaledVector(back, i * L * (home ? 1 : 0.5)));
    if (home) m.pos.addScaledVector(home, 0.4);
  }
  scene.add(m.g); m.g.position.copy(m.pos);
  return m;
}
function removeMob(i) {
  const m = mobs[i]; scene.remove(m.g); if (m.tail) scene.remove(m.tail);
  m.ims.forEach(im => { scene.remove(im); im.dispose(); }); m.mat.dispose();
  if (sub.grabbedBy === m) sub.grabbedBy = null;
  mobs.splice(i, 1);
}
function chainFollow(pts, L) {
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; _v.subVectors(b, a); const d = _v.length() || 1; b.copy(a).addScaledVector(_v, L / d); }
}
function chainRender(m, thick) {
  const n = m.segIM.count;
  for (let i = 0; i < n; i++) {
    const a = m.pts[i], b = m.pts[i + 1]; _v.subVectors(a, b).normalize();
    _q.setFromUnitVectors(ZAX, _v); const t = 1 - i / n * 0.55, s = thick * t;
    m.segIM.setMatrixAt(i, _m4.compose(_p.addVectors(a, b).multiplyScalar(0.5), _q, _s.set(s, s, m.L * 1.08)));
  }
  m.segIM.instanceMatrix.needsUpdate = true;
  const a = m.pts[n], b = m.pts[n + 1]; _v.subVectors(a, b).normalize();
  m.tail.position.copy(a); m.tail.quaternion.setFromUnitVectors(ZAX, _v); m.tail.scale.setScalar(thick * 0.45);
}
// Trefferkugeln einer Kreatur: [Punkt, Radius]
function hitSpheres(m, out) {
  out.length = 0; out.push([m.pos, m.hitR]);
  if (m.pts) for (let i = 2; i < m.pts.length; i += 3) out.push([m.pts[i], m.kind === 'boss' ? 2.4 : 0.5]);
  return out;
}
let leviathan = null, levDone = false;
function spawnLeviathan() {
  const c = center(sub.pos.y - 40);
  leviathan = makeMob('leviathan', new V3(c.x, sub.pos.y - 45, c.z), -1, null);
  leviathan.state = 'circle'; leviathan.t = 0; leviathan.ang = 0; mobs.push(leviathan);
  showBanner('🐉 LEVIATHAN', 'Etwas Riesiges umkreist dich. Harpune (Rechtsklick/G) und Wasserbomben (X) – oder flieh nach oben!', 5);
  shake(1); sfxRoar(); $('bossBar').style.display = 'block';
}

// ============ Kreaturen-KI ============
const _a = new V3(), _b = new V3(), _d = new V3(), HS = [];
let clock = 0;
function keepInside(p, margin) {
  const c = center(p.y), dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz) || 0.001, R = radiusAt(Math.atan2(dz, dx), p.y) - margin;
  if (d > R) { p.x = c.x + dx / d * R; p.z = c.z + dz / d * R; return true; }
  return false;
}
function bite(m, dmg, dir) {
  damage(dmg, m.d.n); sub.vel.addScaledVector(dir, m.kind === 'boss' ? 22 : 9); shake(m.kind === 'boss' ? 1.2 : 0.5);
  burst(sub.pos, 14, 7, 0.5, 0.4, 0xffffff); sfxBite();
}
function updateMobs(dt) {
  for (let i = mobs.length - 1; i >= 0; i--) {
    const m = mobs[i]; m.t += dt; m.cd -= dt; m.stun -= dt;
    if (m.kind !== 'boss' && !chunks.has(m.k) && sub.grabbedBy !== m) { removeMob(i); continue; } // Chunk weg (z.B. nach Kalmar-Griff verschont)
    if (m.flash > 0) m.flash -= dt;
    m.mat.emissive.copy(m.baseEm).addScalar(Math.max(0, m.flash) * 5);
    if (m.dead > 0) {
      m.dead -= dt; m.pos.y -= dt * 2.5; m.g.position.copy(m.pos); m.g.rotation.z += dt;
      if (m.pts) { m.pts.forEach(p => { p.y -= dt * 2.5; }); chainRender(m, m.kind === 'boss' ? 2.4 : 0.55); }
      if (m.dead <= 0) { if (m === leviathan) leviathan = null; removeMob(i); }
      continue;
    }
    const toSub = _a.subVectors(sub.pos, m.pos), dist = toSub.length(); toSub.divideScalar(dist || 1);
    const stunned = m.stun > 0, P = m.g.userData.parts;
    if (m.kind === 'jelly') {
      const pulse = Math.max(0, Math.sin(m.t * 1.7));
      m.vel.y += (pulse * 1.1 - 0.35) * dt; m.vel.x += Math.sin(m.t * 0.3) * 0.2 * dt; m.vel.z += Math.cos(m.t * 0.27) * 0.2 * dt;
      m.vel.multiplyScalar(Math.exp(-0.9 * dt)); m.pos.addScaledVector(m.vel, dt); keepInside(m.pos, 3);
      if (P.bell) P.bell.scale.set(1 + pulse * 0.14, 1 - pulse * 0.18, 1 + pulse * 0.14);
      if (P.tent) { P.tent.rotation.x = Math.sin(m.t * 1.7 - 1) * 0.12; P.tent.scale.y = 1 + pulse * 0.12; }
      m.g.position.copy(m.pos);
      if (!stunned && m.cd <= 0 && dist < m.hitR + SUB_R) {
        m.cd = 2; damage(m.d.dmg, m.d.n); sub.bat = Math.max(0, sub.bat - m.d.dmg * 1.5); sub.vel.addScaledVector(toSub, 8);
        shake(0.4); zapT = 0.4; burst(m.pos, 20, 8, 0.4, 0.4, 0x7fe8ff); sfxZap(); hint('jelly', '⚡ Quallen schocken Hülle UND Akku – Abstand halten oder harpunieren!');
      }
    } else if (m.kind === 'eel') {
      const head = m.pts[0], free = !m.home;
      if (free) {
        if (m.state === 'idle') { _b.set(Math.sin(m.t * 0.4), Math.sin(m.t * 0.23) * 0.4, Math.cos(m.t * 0.35)).multiplyScalar(4); m.vel.lerp(_b, dt); if (dist < 34 && m.cd <= 0 && !stunned) m.state = 'hunt'; }
        else if (m.state === 'hunt') {
          _b.copy(toSub).multiplyScalar(m.d.speed); _d.set(-toSub.z, 0, toSub.x).multiplyScalar(Math.sin(m.t * 6) * 6); _b.add(_d);
          m.vel.lerp(_b, 1 - Math.exp(-dt * 2.5));
          if (!stunned && dist < m.hitR + SUB_R + 0.4) { bite(m, m.d.dmg, toSub); m.state = 'back'; m.t = 0; }
          if (dist > 60) m.state = 'idle';
        } else { m.vel.lerp(_b.copy(toSub).multiplyScalar(-m.d.speed * 0.7), dt * 3); if (m.t > 1.6) { m.state = 'hunt'; } }
        if (stunned) m.vel.multiplyScalar(Math.exp(-4 * dt));
        m.pos.addScaledVector(m.vel, dt); keepInside(m.pos, 2);
      } else {
        const rest = _d.copy(m.home).addScaledVector(m.n, 0.5 + Math.sin(m.t * 1.3) * 0.25);
        if (m.state === 'idle') { m.pos.lerp(rest, 1 - Math.exp(-dt * 3)); if (dist < 9 && m.cd <= 0 && !stunned) { m.state = 'strike'; m.t = 0; sfxHiss(); } }
        else if (m.state === 'strike') {
          if (stunned) m.state = 'back';
          else m.pos.addScaledVector(toSub, m.d.speed * dt);
          if (!stunned && dist < m.hitR + SUB_R + 0.3) { bite(m, m.d.dmg, toSub); m.state = 'back'; hint('eel', '🐍 Muränen lauern in Spalten – Harpune (Rechtsklick/G) schreckt sie ab.'); }
          if (m.t > 0.75 || m.pos.distanceTo(m.home) > 6.5) m.state = 'back';
        } else { m.pos.lerp(rest, 1 - Math.exp(-dt * 4)); if (m.pos.distanceTo(rest) < 0.4) { m.state = 'idle'; m.cd = 2.5; } }
      }
      head.copy(m.pos); chainFollow(m.pts, m.L);
      if (!free) { // Schwanz bleibt in der Spalte verankert (zweiter Durchlauf von hinten)
        const last = m.pts[m.pts.length - 1]; last.copy(m.home).addScaledVector(m.n, -2.2);
        for (let k = m.pts.length - 2; k >= 1; k--) { const a = m.pts[k + 1], b = m.pts[k]; _b.subVectors(b, a); const d = _b.length() || 1; b.copy(a).addScaledVector(_b, m.L / d); }
      }
      const look = _b.subVectors(m.pts[0], m.pts[1]).normalize();
      m.g.position.copy(m.pos); m.g.quaternion.setFromUnitVectors(ZAX, look);
      if (P.jaw) P.jaw.rotation.x = m.state === 'strike' || m.state === 'hunt' ? 0.5 : 0.08;
      chainRender(m, 0.55);
    } else if (m.kind === 'angler') {
      const lure = P.lure;
      if (m.state === 'idle') {
        m.pos.copy(m.home).addScaledVector(UP, Math.sin(m.t * 0.8) * 0.3);
        if (!stunned && m.cd <= 0 && (dist < 6.5 || m.lured)) { m.state = 'lunge'; m.t = 0; sfxRoar(0.5); if (m.lured) showMsg('🎣 Das war kein Erz!', 'Ein Anglerfisch!', 1.6); }
      } else if (m.state === 'lunge') {
        if (stunned) m.state = 'back';
        else m.pos.addScaledVector(toSub, m.d.speed * dt);
        if (!stunned && dist < m.hitR + SUB_R + 0.5) { bite(m, m.d.dmg, toSub); m.state = 'back'; m.t = 0; }
        if (m.t > 1.1) m.state = 'back';
      } else { m.pos.lerp(m.home, 1 - Math.exp(-dt * 2)); if (m.pos.distanceTo(m.home) < 0.5) { m.state = 'idle'; m.cd = 3.5; m.lured = false; } }
      m.g.position.copy(m.pos);
      _b.copy(m.state === 'lunge' ? sub.pos : _d.copy(m.home).add(m.n));
      m.g.lookAt(_b);
      if (P.jaw) P.jaw.rotation.x = m.state === 'lunge' ? 0.7 : 0.15 + Math.sin(m.t) * 0.05;
      if (lure) { lure.rotation.x = Math.sin(m.t * 1.4) * 0.15; lure.getWorldPosition(m.lurePos || (m.lurePos = new V3())); }
    } else if (m.kind === 'squid') {
      if (m.state === 'idle') { m.vel.lerp(_b.set(Math.sin(m.t * 0.3), Math.sin(m.t * 0.2) * 0.3, Math.cos(m.t * 0.25)).multiplyScalar(2), dt); if (dist < 26 && m.cd <= 0 && !stunned) m.state = 'chase'; }
      else if (m.state === 'chase') {
        const jet = 0.45 + 0.55 * Math.max(0, Math.sin(m.t * 4));
        m.vel.lerp(_b.copy(toSub).multiplyScalar(m.d.speed * jet * 1.4), 1 - Math.exp(-dt * 3));
        if (stunned) m.vel.multiplyScalar(Math.exp(-6 * dt));
        if (dist < 3 && !sub.grabbedBy && !stunned) { m.state = 'grab'; sub.grabbedBy = m; sub.mash = 0; m.t = 0; sfxRoar(0.7); shake(0.7);
          showMsg('🦑 Kalmar-Griff!', 'Hämmere Leertaste / Bohren – oder Turbo!', 2.2); hint('squid', '🦑 Kalmar abschütteln: Leertaste/F hämmern, Turbo oder Harpune!'); }
        if (dist > 50) m.state = 'idle';
      } else if (m.state === 'grab') {
        _b.set(0, 1.4, -0.6).applyAxisAngle(UP, sub.yaw); m.pos.copy(sub.pos).add(_b); m.vel.copy(sub.vel);
        damage(m.d.dmg * dt, m.d.n, true); if (sub.boosting) sub.mash += 3 * dt;
        if (sub.mash >= 10) { sub.grabbedBy = null; m.state = 'flee'; m.t = 0; m.stun = 3; m.cd = 8; m.vel.copy(toSub).multiplyScalar(-16); toast('💪 Kalmar abgeschüttelt!'); snd('powerup'); shake(0.4); }
      } else { m.vel.multiplyScalar(Math.exp(-1.2 * dt)); if (m.t > 3) m.state = 'idle'; }
      if (m.state !== 'grab') { m.pos.addScaledVector(m.vel, dt); keepInside(m.pos, 2.5); }
      m.g.position.copy(m.pos);
      const dir = m.state === 'grab' ? _b.copy(fwd) : m.vel.lengthSq() > 0.1 ? _b.copy(m.vel).normalize() : _b.copy(toSub);
      m.g.quaternion.slerp(_q.setFromUnitVectors(ZAX, dir), 1 - Math.exp(-dt * 4));
      updateSquidArms(m);
    } else if (m.kind === 'boss') updateLeviathan(m, dt, toSub, dist, stunned);
  }
}
const ARM_BASE = new V3();
function updateSquidArms(m) {
  m.g.updateMatrixWorld(); const wm = m.g.matrixWorld, s = m.g.scale.x, grab = m.state === 'grab', L = 0.55;
  let idx = 0;
  for (let a = 0; a < 8; a++) {
    const ang = a / 8 * Math.PI * 2, spread = grab ? 1.4 : 0.25 + 0.1 * Math.sin(m.t * 3 + a);
    _p.set(Math.cos(ang) * 0.32, Math.sin(ang) * 0.32, -0.9);
    let yaw = 0, pitch = 0;
    for (let j = 0; j < 6; j++) {
      const wave = Math.sin(m.t * (grab ? 6 : 3) - j * 0.8 + a) * 0.25 * (j + 1) / 6;
      pitch += (Math.sin(ang) * spread * 0.35) + wave; yaw += (Math.cos(ang) * spread * 0.35) + wave * 0.6;
      _d.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
      const mid = _b.copy(_p).addScaledVector(_d, L * 0.5);
      _q.setFromUnitVectors(ZAX, _v.copy(_d).negate());
      _m4.compose(mid, _q, _s.set(1 - j * 0.12, 1 - j * 0.12, L)).premultiply(wm);
      m.arms.setMatrixAt(idx++, _m4);
      _p.addScaledVector(_d, L);
    }
  }
  m.arms.instanceMatrix.needsUpdate = true;
}
function updateLeviathan(m, dt, toSub, dist, stunned) {
  const P = m.g.userData.parts, sp = m.d.speed;
  if (depthM(sub.pos.y) < 1950 && m.state !== 'leave') { m.state = 'leave'; m.t = 0; toast('🐉 Der Leviathan lässt von dir ab …'); }
  if (m.state === 'circle') {
    m.ang += dt * 0.55;
    _b.set(Math.cos(m.ang) * 22, Math.sin(m.t * 0.6) * 7 - 3, Math.sin(m.ang) * 22).add(sub.pos); keepInside(_b, 6);
    _d.subVectors(_b, m.pos).normalize().multiplyScalar(sp);
    m.vel.lerp(_d, 1 - Math.exp(-dt * 1.6));
    if (m.t > 6.5 && !stunned) { m.state = 'windup'; m.t = 0; sfxRoar(1); showMsg('⚠️ Der Leviathan holt aus!', 'Ausweichen!', 1.2); }
  } else if (m.state === 'windup') {
    m.vel.multiplyScalar(Math.exp(-3 * dt)); m.vel.addScaledVector(toSub, -6 * dt);
    if (m.t > 1.1 && !stunned) { m.state = 'charge'; m.t = 0; m.vel.copy(toSub).multiplyScalar(36); }
  } else if (m.state === 'charge') {
    if (m.t > 1.7 || stunned) { m.state = 'circle'; m.t = 0; }
    else if (dist < m.hitR + SUB_R + 1.2) { bite(m, m.d.dmg, toSub); m.state = 'circle'; m.t = 0; }
  } else if (m.state === 'leave') {
    m.vel.lerp(_d.set(0, -sp, 0), dt); if (m.t > 6) { const i = mobs.indexOf(m); if (i >= 0) removeMob(i); leviathan = null; $('bossBar').style.display = 'none'; return; }
  }
  if (stunned) m.vel.multiplyScalar(Math.exp(-2 * dt));
  m.pos.addScaledVector(m.vel, dt); keepInside(m.pos, 4);
  m.pts[0].copy(m.pos); chainFollow(m.pts, m.L);
  for (let i = 2; i < m.pts.length; i += 2) keepInside(m.pts[i], 2.5);
  const look = _b.subVectors(m.pts[0], m.pts[1]).normalize();
  m.g.position.copy(m.pos); m.g.quaternion.setFromUnitVectors(ZAX, look);
  if (P.jaw) P.jaw.rotation.x = m.state === 'charge' || m.state === 'windup' ? 0.6 : 0.1 + Math.sin(m.t * 2) * 0.05;
  chainRender(m, 2.4);
  $('bossFill').style.width = clamp(m.hp / m.d.hp, 0, 1) * 100 + '%';
}
function updateSchools(dt) {
  let n = 0;
  for (const sc of schools) {
    sc.t += dt;
    _a.set(Math.sin(sc.t * 0.21), Math.sin(sc.t * 0.13) * 0.3, Math.cos(sc.t * 0.17)).multiplyScalar(1.6);
    _b.subVectors(sc.c, sub.pos); const d = _b.length();
    if (d < 10) _a.addScaledVector(_b.normalize(), 7 * (1 - d / 10) * 3);
    sc.v.lerp(_a, 1 - Math.exp(-dt * 1.5)); sc.c.addScaledVector(sc.v, dt); keepInside(sc.c, 6);
    if (sc.c.y > -3) sc.c.y = -3;
    if (d > 70) continue;
    const col = _col.setHex(sc.d.col);
    for (const f of sc.fish) {
      if (n >= 500) break;
      const a = f.ph + sc.t * f.sp;
      _p.set(Math.cos(a) * f.rad, f.yo + Math.sin(sc.t * 0.7 + f.ph) * 0.6, Math.sin(a) * f.rad).add(sc.c);
      _d.set(-Math.sin(a) * f.sp, 0, Math.cos(a) * f.sp).normalize().addScaledVector(sc.v, 0.15).normalize();
      _q.setFromUnitVectors(ZAX, _d).multiply(_q2.setFromAxisAngle(UP, Math.sin(sc.t * 12 + f.ph) * 0.25));
      const s = sc.d.size * f.s;
      fishIM.setMatrixAt(n, _m4.compose(_p, _q, _s.set(s, s, s))); fishIM.setColorAt(n, col); n++;
    }
  }
  fishIM.count = n; fishIM.instanceMatrix.needsUpdate = true; if (fishIM.instanceColor) fishIM.instanceColor.needsUpdate = true;
}

// ============ Drohnen ============
const drones = [];
function setupDrones() {
  drones.forEach(d => scene.remove(d.g)); drones.length = 0;
  for (let i = 0; i < S.drones; i++) { const g = build('drone'); g.scale.setScalar(0.8); g.position.copy(sub.pos); scene.add(g); drones.push({ g, t: i * 1.7, target: null, prog: 0 }); }
}
function updateDrones(dt) {
  drones.forEach((dr, i) => {
    dr.t += dt;
    if (dr.target && (!dr.target.alive || dr.target.pos.distanceTo(sub.pos) > 22)) { dr.target = null; dr.prog = 0; }
    if (!dr.target && dr.t > 1) {
      let best = null, bd = 18;
      forNodes(n => { if (ORES[n.type].tier > S.drillTier || drones.some(o => o !== dr && o.target === n) || (target && target.o === n)) return; const d = n.pos.distanceTo(sub.pos); if (d < bd) { bd = d; best = n; } });
      dr.target = best; dr.t = 0;
    }
    if (dr.target) {
      _b.copy(dr.target.pos).addScaledVector(dr.target.n, 1.3);
      dr.g.position.lerp(_b, 1 - Math.exp(-dt * 2.5));
      if (dr.g.position.distanceTo(_b) < 0.8) {
        dr.prog += dt * S.drillSpeed * 0.35 / ORES[dr.target.type].h;
        if (Math.random() < 0.5) emit(dr.target.pos, _v.set(rnd(-2, 2), rnd(-2, 2), rnd(-2, 2)), 0.3, 0.25, ORES[dr.target.type].col);
        if (dr.prog >= 1) { dr.prog = 0; const n = dr.target; n.units--; popUnit(n, true); if (n.units <= 0) breakNode(n); }
      }
      dr.g.lookAt(dr.target.pos);
    } else {
      const a = clock * 1.2 + i * Math.PI * 2 / drones.length;
      _b.set(Math.cos(a) * 2.6, 1.6 + Math.sin(clock * 2 + i) * 0.3, Math.sin(a) * 2.6).add(sub.pos);
      dr.g.position.lerp(_b, 1 - Math.exp(-dt * 3)); dr.g.rotation.set(0, -a, 0);
    }
  });
}

// ============ Eingabe-Zustand ============
const keys = {};
let mouseAim = false, mouseX = 0.5, mouseY = 0.5, mouseMine = false;
const touch = { x: 0, y: 0, up: false, down: false, mine: false, boost: false };
const inp = () => ({
  turn: clamp((keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + touch.x, -1, 1),
  thr: clamp((keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - touch.y, -1, 1),
  vert: clamp((keys.Space || touch.up ? 1 : 0) - (keys.ShiftLeft || keys.ShiftRight || keys.KeyC || touch.down ? 1 : 0), -1, 1),
  boost: !!(keys.KeyB || touch.boost),
  mine: !!(keys.KeyF || mouseMine || touch.mine),
});

// ============ Schaden, Schütteln, Meldungen ============
let shakeAmt = 0, flashT = 0, zapT = 0, crackLvl = 0, deathCause = '';
const shake = a => { shakeAmt = Math.min(1.6, shakeAmt + a); };
function damage(n, cause, silent) {
  if (state !== 'dive' || n <= 0) return;
  sub.hull -= n; deathCause = cause || deathCause;
  if (!silent) { flashT = Math.min(1, flashT + n / 22); snd('hit'); }
}
let msgT = 0;
function showMsg(t, small, dur) { $('msg').innerHTML = t + (small ? '<small>' + small + '</small>' : ''); $('msg').classList.add('show'); msgT = dur || 1.8; }
let bannerT = 0;
function showBanner(t, p, dur) { $('bTitle').textContent = t; $('bText').textContent = p || ''; $('banner').classList.add('show'); bannerT = dur || 4; }
function toast(html, cls, dur) {
  const el = document.createElement('div'); el.className = 'toast ' + (cls || ''); el.innerHTML = html; $('toasts').appendChild(el);
  while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
  setTimeout(() => el.remove(), (dur || 3.2) * 1000);
}
const throttle = {};
function once(key, sec) { const t = key in throttle ? throttle[key] : -Infinity; if (clock - t < sec) return false; throttle[key] = clock; return true; }
function hint(id, text) { if (save.hints[id]) return; save.hints[id] = 1; toast('💡 ' + text, 'tip', 6); }

// ============ U-Boot-Steuerung ============
let diveT = 0, wentDown = false, current = null;
function updateSub(dt) {
  const I = inp(), bat0 = sub.bat <= 0;
  sub.boosting = I.boost && !bat0 && (I.thr !== 0 || I.vert !== 0);
  sub.yaw -= I.turn * (sub.boosting ? 1.3 : 1.9) * dt;
  updateAimDir();
  const max = S.speed * (sub.boosting ? S.boostMul : 1) * (bat0 ? 0.55 : 1) * (sub.grabbedBy ? 0.35 : 1);
  _a.copy(fwd).multiplyScalar(I.thr * max); _a.y = I.vert * max * 0.85;
  sub.vel.lerp(_a, 1 - Math.exp(-dt * 1.8));
  if (current) sub.vel.addScaledVector(current.dir, current.f * dt);
  sub.pos.addScaledVector(sub.vel, dt);
  collideSub();
  // Optik: Rollen in Kurven, Nicken beim Steigen/Sinken
  sub.roll = lerp(sub.roll, I.turn * 0.3, 1 - Math.exp(-dt * 3));
  sub.pitch = lerp(sub.pitch, clamp(-sub.vel.y / (S.speed * 1.2), -0.5, 0.5), 1 - Math.exp(-dt * 3));
  subG.position.copy(sub.pos); subG.position.y += Math.sin(clock * 1.3) * 0.05;
  subG.rotation.set(sub.pitch, sub.yaw, -sub.roll, 'YXZ');
  const sp = sub.vel.length();
  if (SP.prop) SP.prop.rotation.z += (2 + sp * 2.5 * (sub.boosting ? 1.8 : 1)) * dt;
  if (sp > 1.5 && Math.random() < (sub.boosting ? 0.9 : 0.35)) { SP.prop ? SP.prop.getWorldPosition(_b) : _b.copy(sub.pos); emit(_b, _v.set(rnd(-0.5, 0.5), rnd(0.2, 1), rnd(-0.5, 0.5)).addScaledVector(fwd, -2), 1.6, 0.18, 0x9fdfff, 1.2, 1.5); }
  if (sub.boosting) hint('boost', '💨 Turbo frisst Akku – sparsam einsetzen!');
  if (-sub.pos.y > 6) wentDown = true;
}
function collideSub() {
  const c = center(sub.pos.y), dx = sub.pos.x - c.x, dz = sub.pos.z - c.z, d = Math.hypot(dx, dz) || 0.001;
  const R = radiusAt(Math.atan2(dz, dx), sub.pos.y) - SUB_R;
  if (d > R) {
    const nx = dx / d, nz = dz / d; sub.pos.x = c.x + nx * R; sub.pos.z = c.z + nz * R;
    const vn = sub.vel.x * nx + sub.vel.z * nz;
    if (vn > 0) { sub.vel.x -= nx * vn * 1.5; sub.vel.z -= nz * vn * 1.5; if (vn > 4.5) bump(vn); }
  }
  for (const ch of chunks.values()) {
    for (const r of ch.rocks) sphereCol(r.p, r.r * 0.9);
    if (ch.wreck) sphereCol(ch.wreck.p, ch.wreck.r);
  }
  if (sub.pos.y > -0.6) { sub.pos.y = -0.6; if (sub.vel.y > 0) sub.vel.y = 0; }
}
function sphereCol(p, r) {
  _b.subVectors(sub.pos, p); const d = _b.length(), min = r + SUB_R;
  if (d >= min || d < 0.001) return;
  _b.divideScalar(d); sub.pos.copy(p).addScaledVector(_b, min);
  const vn = -sub.vel.dot(_b); if (vn > 0) { sub.vel.addScaledVector(_b, vn * 1.5); if (vn > 4.5) bump(vn); }
}
function bump(v) {
  damage((v - 4.5) * 3, 'Kollision'); shake(0.25 + v * 0.04); sfxThud(v);
  burst(sub.pos, 10, 4, 0.8, 0.3, 0x8a9aa0, -1);
  hint('bump', '🪨 Harte Wandtreffer beschädigen die Hülle – langsam an Erz heranfahren.');
}

// ============ Ressourcen, Druck, Hitze ============
let creakT = 0, warnO2 = false, lastZone = -1;
function updateResources(dt) {
  const m = depthM(sub.pos.y), over = m - S.rating;
  sub.o2 -= dt * (sub.boosting ? 1.25 : 1);
  if (sub.o2 <= 0) { sub.o2 = 0; damage(9 * dt, 'Sauerstoffmangel', true); if (once('o2dead', 2)) showMsg('🫧 Kein Sauerstoff!', 'Sofort auftauchen!', 1.6); }
  const drain = (sub.light ? 0.28 : 0) + (sub.drilling ? 1.0 : 0) + (sub.boosting ? S.boostDrain : 0);
  sub.bat = Math.max(0, sub.bat - drain * dt);
  if (sub.bat <= 0 && once('batEmpty', 15)) { showMsg('🔋 Akku leer!', 'Licht aus, Notantrieb – auftauchen!', 2); sfxDeny(); }
  if (over > 0) {
    damage(over / 22 * dt, 'Wasserdruck', true);
    creakT -= dt; if (creakT <= 0) { creakT = rnd(0.6, 2.2) / (1 + over / 80); sfxCreak(over); shake(0.15 + Math.min(0.4, over / 300)); }
    if (once('overHint', 20)) showMsg('⚠️ Unter Nenntiefe!', 'Die Hülle gibt nach – ' + S.rating + ' m nicht überschreiten', 2);
    hint('pressure', '🛡️ Unter der Nenntiefe zerdrückt der Druck die Hülle. Die Druckhülle in der Werft erhöht sie.');
  } else if (S.repair > 0) sub.hull = Math.min(S.hullMax, sub.hull + S.repair * dt);
  crackLvl = lerp(crackLvl, clamp(Math.max(over / 160, 1 - sub.hull / S.hullMax * 1.6), 0, 1), 1 - Math.exp(-dt * 2));
  if (sub.o2 < S.o2Max * 0.25 && !warnO2) { warnO2 = true; showMsg('🫧 Sauerstoff knapp!', 'Zeit zum Auftauchen', 2); sfxAlarm(); hint('o2', '🫧 Behalte O₂ im Blick: Für den Rückweg brauchst du Luft! Blasenquellen füllen nach.'); }
  if (sub.o2 > S.o2Max * 0.3) warnO2 = false;
  // Hitze an Schloten
  for (const ch of chunks.values()) for (const v of ch.vents) {
    const dy = sub.pos.y - v.p.y;
    if (dy < -1 || dy > 18) continue;
    const dx = sub.pos.x - v.top.x, dz = sub.pos.z - v.top.z;
    if (dx * dx + dz * dz < 3.6 * 3.6) {
      if (S.heatK > 0) { damage(8 * S.heatK * dt, 'Hitze', true); flashT = Math.max(flashT, 0.25 * S.heatK); if (once('heat', 3)) { showMsg('🔥 Heißer Schlot!', S.heatK < 1 ? 'Thermoschild dämpft' : 'Thermoschild schützt davor', 1.2); sfxSizzle(); } }
    }
  }
  // Luftblasen
  for (const ch of chunks.values()) for (const pk of ch.pockets) {
    if (pk.air <= 0) continue;
    if (Math.random() < 0.4 && pk.p.distanceToSquared(sub.pos) < 3600) emit(pk.p, _v.set(rnd(-0.3, 0.3), rnd(2, 3.5), rnd(-0.3, 0.3)), 2.5, rnd(0.2, 0.45), 0x9fefff, 0.5, 0.2);
    if (pk.p.distanceTo(sub.pos) < 4 && sub.o2 < S.o2Max) {
      const add = Math.min(30 * dt, pk.air); pk.air -= add; sub.o2 = Math.min(S.o2Max, sub.o2 + add);
      if (once('bubbleSfx', 0.3)) sfxBubble(); hint('pocket', '🫧 Luftblasen-Quellen füllen deinen Sauerstoff auf!');
    }
  }
  // Zonenwechsel
  const zi = zoneIndexAt(m);
  if (zi !== lastZone) {
    if (lastZone >= 0 && zi > lastZone) {
      const Z = ZONES[zi], first = discover('z_' + Z.id, true);
      showBanner(Z.e + ' ' + Z.n, first ? D.TEXT.zones[Z.id] : '', first ? 6 : 3);
      if (first) { sfxReveal(); shake(0.3); }
    }
    lastZone = zi; setDrone(zi);
  }
  // Tiefenrekorde: alle 100 m Fanfare + Prämie
  if (m > diveMax) {
    diveMax = m;
    const mark = Math.floor(m / 100) * 100;
    if (mark > save.record && mark > 0 && mark > lastMark) {
      lastMark = mark; const prize = Math.round(mark * 0.6);
      save.money += prize; save.stats.earned += prize;
      toast(`🏁 Neuer Tiefenrekord: <b>${mark} m</b> · +${fmt(prize)} Cr`, 'gold', 3.5); sfxFanfare();
    }
    contractEvent('depth', m);
  }
}
let diveMax = 0, lastMark = 0;

// ============ Bohren & Fracht ============
let target = null, bits = [], drillSnd = 0;
function pickTarget() {
  let best = null, bs = 1e9, bk = '', bo = null, bp = null;
  const consider = (kind, o, pos, extra) => {
    _a.subVectors(pos, sub.pos); const d = Math.max(0, _a.length() - (extra || 0)); if (d > S.reach) return;
    const ang = _a.angleTo(aimDir); if (ang > 0.8) return;
    const sc = d * (1 + ang * 2.5); if (sc < bs) { bs = sc; bk = kind; bo = o; bp = pos; }
  };
  forNodes(n => consider('node', n, n.pos));
  for (const ch of chunks.values()) {
    if (ch.wreck && !ch.wreck.looted) consider('wreck', ch.wreck, ch.wreck.p, ch.wreck.r - 1);
    for (const it of ch.items) if (!it.done && it.kind === 'crate') consider('crate', it, it.p, 0.5);
  }
  for (const m of mobs) if (m.kind === 'angler' && m.lurePos && m.state === 'idle' && !m.dead) consider('lure', m, m.lurePos);
  if (bo) best = { kind: bk, o: bo, pos: bp };
  return best;
}
const tipW = new V3();
function updateMining(dt, mineHeld) {
  target = pickTarget();
  const held = mineHeld && !sub.grabbedBy;
  sub.drilling = false;
  let pos = null, col = 0xffb040;
  if (target && held) {
    pos = target.pos;
    if (target.kind === 'node') {
      const n = target.o, o = ORES[n.type]; col = o.col;
      if (o.tier > S.drillTier) { if (once('tier', 1.5)) { showMsg('⛏️ Bohrer zu schwach', `${o.n} braucht Bohrer-Stufe ${o.tier}`, 1.4); sfxDeny(); } pos = null; }
      else {
        sub.drilling = true; n.wob = 1;
        n.prog += dt * S.drillSpeed / o.h * (sub.bat > 0 ? 1 : 0.4);
        if (n.prog >= 1) { n.prog = 0; n.units--; popUnit(n); if (n.units <= 0) breakNode(n); }
      }
    } else if (target.kind === 'wreck' || target.kind === 'crate') {
      sub.drilling = true; target.o.prog += dt / (target.kind === 'wreck' ? 2.4 : 1.2);
      if (target.o.prog >= 1) target.kind === 'wreck' ? lootWreck(target.o) : lootCrate(target.o);
    } else if (target.kind === 'lure') { sub.drilling = true; col = 0xffe28a; target.o.lured = true; }
  }
  // Bohrarm zielt auf das Ziel (oder in Blickrichtung)
  if (SP.arm) {
    subG.updateMatrixWorld();
    _a.copy(target ? target.pos : _b.copy(sub.pos).addScaledVector(aimDir, 6));
    SP.arm.parent.worldToLocal(_a); _a.sub(SP.arm.position);
    const ry = Math.atan2(_a.x, _a.z), rx = -Math.atan2(_a.y, Math.hypot(_a.x, _a.z));
    SP.arm.rotation.y = lerp(SP.arm.rotation.y, clamp(ry, -1.1, 1.1), 1 - Math.exp(-dt * 8));
    SP.arm.rotation.x = lerp(SP.arm.rotation.x, clamp(rx, -1.2, 0.9), 1 - Math.exp(-dt * 8));
  }
  if (SP.drill) { SP.drill.rotation.z += (sub.drilling ? 30 : 1) * dt; SP.arm.updateMatrixWorld(); SP.drill.localToWorld(tipW.copy(drillTip)); }
  else tipW.copy(sub.pos).addScaledVector(fwd, 2);
  beam.visible = !!(sub.drilling && pos);
  if (beam.visible) {
    beam.position.copy(tipW); beam.lookAt(pos); beam.scale.set(1 + Math.random() * 0.5, 1 + Math.random() * 0.5, tipW.distanceTo(pos));
    beam.material.color.setHex(col);
    for (let i = 0; i < 3; i++) emit(pos, _v.set(rnd(-4, 4), rnd(-2, 5), rnd(-4, 4)), rnd(0.2, 0.5), rnd(0.15, 0.32), i ? col : 0xffe9b0, -6, 1);
    if (Math.random() < 0.25) emit(pos, _v.set(rnd(-0.5, 0.5), rnd(0.5, 1.5), rnd(-0.5, 0.5)), 1.5, 0.25, 0x667788, 0.4, 0.8);
    shakeAmt = Math.max(shakeAmt, 0.06);
  }
  const prog = target && target.kind === 'node' ? target.o.prog : target && target.o && target.o.prog || 0;
  drillTone(sub.drilling, prog);
  // Fliegende Erzbrocken (Magnet zum U-Boot)
  let n = 0;
  for (let i = bits.length - 1; i >= 0; i--) {
    const b = bits[i]; b.t += dt;
    _a.subVectors(sub.pos, b.p); const d = _a.length();
    if (b.t > 0.22) b.v.addScaledVector(_a.normalize(), (30 + b.t * 50) * dt);
    b.v.multiplyScalar(Math.exp(-2.2 * dt)); b.p.addScaledVector(b.v, dt);
    if (d < 1.4 || b.t > 3.5) { bits.splice(i, 1); collect(b.type, b.jack); continue; }
    if (n < 60) { _q.setFromEuler(_e.set(b.t * 7, b.t * 5, 0)); oreBitIM.setMatrixAt(n, _m4.compose(b.p, _q, _s.setScalar(0.35))); oreBitIM.setColorAt(n, _col.setHex(ORES[b.type].col)); n++; }
  }
  oreBitIM.count = n; oreBitIM.instanceMatrix.needsUpdate = true; if (oreBitIM.instanceColor) oreBitIM.instanceColor.needsUpdate = true;
  if (sub.comboT && clock - sub.comboT > 3 && sub.combo) { sub.combo = 0; $('combo').classList.remove('show'); }
}
function popUnit(n, byDrone) {
  bits.push({ type: n.type, p: n.pos.clone().addScaledVector(n.n, 0.7), v: n.n.clone().multiplyScalar(6).add(_v.set(rnd(-2, 2), rnd(0, 3), rnd(-2, 2))), t: 0, jack: n.jack });
  burst(n.pos, byDrone ? 5 : 12, 7, 0.5, 0.35, ORES[n.type].col, -4);
  if (!byDrone) { shake(0.08); sfxCrack(); }
  if (discover('o_' + n.type)) { /* Meldung in discover */ }
}
function breakNode(n) {
  n.alive = false; mined.add(n.id);
  burst(n.pos, n.jack ? 50 : 26, n.jack ? 12 : 8, 0.9, 0.45, ORES[n.type].col, -3);
  burst(n.pos, 10, 3, 1.4, 0.6, 0x556070, -0.5);
  shake(n.jack ? 0.5 : 0.18); sfxBreak();
  if (n.jack) { save.stats.jackpots++; toast('💎 Glücksader geplündert!', 'gold'); sfxFanfare(); }
}
function collect(type, jack) {
  if (sub.cargoN >= S.cargo) {
    if (once('full', 4)) { toast('📦 Fracht voll! Auftauchen (Leertaste) und verkaufen.', 'gold'); sfxDeny(); }
    return;
  }
  sub.cargo[type] = (sub.cargo[type] || 0) + 1; sub.cargoN++; save.stats.ore++;
  sub.combo = clock - sub.comboT < 3 ? sub.combo + 1 : 1; sub.comboT = clock;
  const bonus = sub.combo >= 3 ? Math.max(1, Math.round(ORES[type].v * Math.min(0.6, 0.05 * (sub.combo - 2)))) : 0;
  sub.bonus += bonus;
  if (sub.combo >= 3) { $('combo').innerHTML = `Bohr-Serie ×${sub.combo} <small style="color:#fff">+${bonus} Cr</small>`; $('combo').classList.add('show'); }
  save.stats.bestCombo = Math.max(save.stats.bestCombo, sub.combo);
  contractEvent('combo', sub.combo);
  sfxChime(sub.combo);
  if (sub.cargoN === S.cargo) { toast('📦 Frachtraum voll! Ab nach oben zum Verkaufen.', 'gold'); sfxFull(); hint('full', '⬆️ Leertaste = auftauchen. An der Oberfläche wird automatisch verkauft.'); }
  else if (sub.cargoN === 1) hint('firstOre', '📦 Erz landet im Frachtraum. Je tiefer, desto wertvoller – aber Fracht geht beim Tod verloren!');
}
const cargoValue = () => Object.keys(sub.cargo).reduce((s, k) => s + sub.cargo[k] * ORES[k].v, 0);
function lootWreck(w) {
  w.looted = true; looted.add(w.zone); save.stats.wrecks++; contractEvent('wreck', 1);
  const cr = Math.round(60 * Math.pow(2.3, w.zi) * rnd(0.85, 1.2)); sub.bonus += cr;
  sub.o2 = Math.min(S.o2Max, sub.o2 + S.o2Max * 0.3); sub.bat = Math.min(S.batMax, sub.bat + S.batMax * 0.3);
  discover('w_' + w.zone);
  const notes = D.TEXT.wrecks[w.zone].notes, ni = notes.findIndex((t, i) => !save.notes[w.zone + '_' + i]);
  if (ni >= 0) { save.notes[w.zone + '_' + ni] = 1; showBanner('📜 Logbuchseite gefunden', notes[ni], 8); }
  toast(`⚓ Wrack geplündert: +${fmt(cr)} Cr, O₂ & Akku aufgefüllt`, 'gold', 4);
  burst(w.p, 40, 9, 1, 0.5, 0xffd34a, -2); sfxFanfare(); persist();
}
function lootCrate(it) {
  it.done = true; scene.remove(it.g);
  const zi = zoneIndexAt(depthM(it.p.y)), cr = Math.round(30 * Math.pow(2.2, zi) * rnd(0.8, 1.3));
  sub.bonus += cr; toast(`🧰 Schatzkiste: +${fmt(cr)} Cr`, 'gold'); burst(it.p, 30, 8, 0.9, 0.45, 0xffd34a, -2); snd('coin');
}
function updateItems(dt) {
  for (const ch of chunks.values()) for (const it of ch.items) {
    if (it.done) continue; it.t += dt;
    if (it.kind === 'buoy') {
      it.g.position.set(it.p.x, it.p.y + Math.sin(it.t * 1.5) * 0.4, it.p.z); it.g.rotation.y += dt * 0.5;
      if (it.g.position.distanceTo(sub.pos) < 2.8) { it.done = true; scene.remove(it.g); sub.buoys++; toast('🎈 Rettungsboje eingesammelt! <b>T</b> = sofort mit Fracht auftauchen', 'gold', 4); snd('powerup'); }
    }
  }
}

// ============ Sonar ============
let pingT = 99, pingR = 0;
const pingO = new V3();
function sonarPing() {
  if (sub.bat < S.sonarCost) { if (once('nosonar', 1)) { toast('🔋 Zu wenig Akku für das Sonar'); sfxDeny(); } return; }
  sub.bat -= S.sonarCost; pingO.copy(sub.pos); pingT = 0; pingR = S.sonarR;
  PING.uPO.value.copy(pingO); PING.uPT.value = 0; PING.uPR.value = pingR;
  sfxPing();
  let newScans = 0;
  const reach = (p) => p.distanceTo(pingO) < pingR;
  for (const m of mobs) if (!m.dead && reach(m.pos)) { m.seen = clock; if (!m.scanned) { m.scanned = true; newScans++; } discover('c_' + m.sp); }
  for (const sc of schools) if (reach(sc.c)) { sc.seen = clock; if (!sc.scanned) { sc.scanned = true; newScans++; } discover('c_' + sc.sp); }
  for (const ch of chunks.values()) {
    for (const n of ch.nodes) if (n.alive && reach(n.pos)) n.seen = clock;
    for (const pk of ch.pockets) if (reach(pk.p)) pk.seen = clock;
    for (const it of ch.items) if (reach(it.p)) it.seen = clock;
    if (ch.wreck && reach(ch.wreck.p)) { ch.wreck.seen = clock; if (discover('w_' + ch.wreck.zone)) {} }
  }
  if (newScans) { save.stats.scans += newScans; contractEvent('scan', newScans); }
  hint('sonar', '📡 Das Sonar zeigt Erz (gelb), Kreaturen (rot), Wracks und Luftblasen auf dem Radar – und scannt neue Arten ins Logbuch.');
}
function updatePing(dt) {
  if (PING.uPR.value <= 0) return;
  pingT += dt; PING.uPT.value = pingT;
  if (pingT > pingR / WAVE + 2.5) PING.uPR.value = 0;
}

// ============ Harpune & Wasserbomben ============
const shots = [], bombs = [];
const harpGeo = GEO.harpoon ? G('harpoon') : new THREE.CylinderGeometry(0.05, 0.05, 1.6, 5).rotateX(Math.PI / 2);
const harpMat = GEO.harpoon ? matFor('harpoon') : new THREE.MeshBasicMaterial({ color: 0xd8f6ff });
let reticleLock = null;
function aimAssist() {
  let best = null, ba = 0.42;
  for (const m of mobs) {
    if (m.dead || !m.d.hostile) continue;
    _a.subVectors(m.pos, sub.pos); const d = _a.length(); if (d > 48) continue;
    const ang = _a.angleTo(aimDir); if (ang < ba) { ba = ang; best = m; }
  }
  return best;
}
function fireHarpoon() {
  if (sub.harpCD > 0 || state !== 'dive') return;
  sub.harpCD = S.harpoonCD;
  const dir = aimDir.clone(), tgt = aimAssist();
  if (tgt) dir.subVectors(tgt.pos, sub.pos).addScaledVector(tgt.vel, 0.12).normalize();
  const mesh = new THREE.Mesh(harpGeo, harpMat); scene.add(mesh);
  const p = sub.pos.clone().addScaledVector(fwd, 2).addScaledVector(UP, -0.3);
  mesh.position.copy(p); mesh.quaternion.setFromUnitVectors(ZAX, dir);
  shots.push({ p, v: dir.multiplyScalar(62), life: 0.9, mesh });
  sub.vel.addScaledVector(fwd, -1.5); shake(0.12); sfxHarpoon();
}
function updateShots(dt) {
  sub.harpCD -= dt;
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]; s.life -= dt; s.p.addScaledVector(s.v, dt); s.mesh.position.copy(s.p);
    emit(s.p, _v.set(0, 0, 0), 0.25, 0.18, 0xbfefff, 0, 0);
    let hit = s.life <= 0 || keepInside(_b.copy(s.p), 0.2);
    if (hit && s.life > 0) { burst(s.p, 10, 4, 0.5, 0.3, 0xaabbcc, -2); sfxThud(5); }
    if (!hit) for (const m of mobs) {
      if (m.dead) continue;
      for (const [hp, hr] of hitSpheres(m, HS)) if (hp.distanceTo(s.p) < hr + 0.4) { hitMob(m, S.harpoonDmg, _d.copy(s.v).normalize(), s.p); hit = true; break; }
      if (hit) break;
    }
    if (hit) { scene.remove(s.mesh); shots.splice(i, 1); }
  }
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i]; b.t -= dt; b.v.y -= 3 * dt; b.v.multiplyScalar(Math.exp(-1.5 * dt)); b.p.addScaledVector(b.v, dt); keepInside(b.p, 0.6);
    b.mesh.position.copy(b.p); b.light.visible = Math.sin(b.t * 25) > 0;
    if (b.t <= 0) { explode(b.p); scene.remove(b.mesh); bombs.splice(i, 1); }
  }
}
function hitMob(m, dmg, dir, at) {
  m.hp -= dmg; m.flash = 0.16; m.stun = Math.max(m.stun, m.kind === 'boss' ? 0.3 : 1.1);
  const kb = m.kind === 'boss' ? 0.8 : m.state === 'grab' ? 0 : 3;
  m.pos.addScaledVector(dir, kb); m.vel.addScaledVector(dir, m.kind === 'boss' ? 3 : 10);
  if (sub.grabbedBy === m) sub.mash += 4;
  burst(at || m.pos, 18, 7, 0.5, 0.4, m.kind === 'jelly' ? 0x7fe8ff : 0xff5a5a, -1);
  sfxHit(); shake(0.12); m.seen = clock;
  if (m.hp <= 0) killMob(m);
}
function killMob(m) {
  m.dead = 1.8; m.state = 'dead';
  if (sub.grabbedBy === m) sub.grabbedBy = null;
  burst(m.pos, m.kind === 'boss' ? 120 : 34, m.kind === 'boss' ? 16 : 9, 1.2, 0.5, m.kind === 'jelly' ? 0x7fe8ff : 0xff7a5a, -1);
  discover('c_' + m.sp);
  save.stats.kills++; contractEvent('kill', 1);
  const zi = zoneIndexAt(depthM(m.pos.y)), cr = Math.round(6 * Math.pow(zi + 1, 1.6));
  if (m.kind === 'boss') {
    const first = !save.stats.leviathan, prize = first ? 15000 : 4000;
    save.stats.leviathan++; save.money += prize; save.stats.earned += prize; levDone = true;
    showBanner('🏆 Leviathan besiegt!', `+${fmt(prize)} Cr Kopfgeld${first ? ' – die Tiefe gehört dir.' : ''}`, 6); sfxFanfare(); shake(1.5);
    $('bossBar').style.display = 'none'; persist();
  } else { sub.bonus += cr; toast(`🎯 ${m.d.n} erlegt · +${cr} Cr`); snd('explosion'); }
}
const BOMB = { geo: new THREE.SphereGeometry(0.45, 10, 8), mat: new THREE.MeshPhongMaterial({ color: 0x2a3036, shininess: 60 }), lgeo: new THREE.SphereGeometry(0.14, 6, 5), lmat: ADD({ color: 0xff3030 }) };
function dropBomb() {
  if (sub.charges <= 0 || state !== 'dive') { if (S.charges === 0 && once('nobomb', 3)) toast('💣 Wasserbomben gibt es in der Werft (ab 1100 m Rekord).'); return; }
  sub.charges--;
  const mesh = new THREE.Group(), body = new THREE.Mesh(BOMB.geo, BOMB.mat), light = new THREE.Mesh(BOMB.lgeo, BOMB.lmat); light.position.y = 0.45;
  mesh.add(body, light); scene.add(mesh);
  bombs.push({ p: sub.pos.clone().addScaledVector(fwd, 1.5), v: sub.vel.clone().multiplyScalar(0.5).addScaledVector(fwd, 4), t: 1.4, mesh, light });
  sfxBeep(); toast(`💣 Wasserbombe! Noch ${sub.charges}`);
}
function explode(p) {
  burst(p, 90, 18, 1, 0.7, 0xffc070, -1); burst(p, 60, 8, 2.2, 0.6, 0xbfefff, 2);
  snd('explosion'); sfxBoom(); const d = p.distanceTo(sub.pos); shake(Math.max(0.3, 1.4 - d / 20));
  if (d < 5) damage(10, 'eigene Wasserbombe');
  for (const m of mobs) if (!m.dead) for (const [hp, hr] of hitSpheres(m, HS)) if (hp.distanceTo(p) < 9 + hr) { hitMob(m, 12, _d.subVectors(m.pos, p).normalize(), hp); break; }
  forNodes(n => { if (n.pos.distanceTo(p) < 7 && ORES[n.type].tier <= S.drillTier + 2) { for (let k = 0; k < 2 && n.units > 0; k++) { n.units--; popUnit(n, true); } if (n.units <= 0) breakNode(n); } });
}

// ============ Zufallsereignisse ============
let eventT = 50, beacon = null, falling = [];
function updateEvents(dt) {
  const m = depthM(sub.pos.y);
  eventT -= dt;
  if (eventT <= 0 && m > 40) {
    eventT = rnd(45, 80);
    const pool = ['current'];
    if (m > 150) pool.push('cavein', 'cavein');
    if (m > 80 && !beacon) pool.push('beacon', 'beacon');
    if (m > 60) pool.push('treasure');
    if (sub.o2 < S.o2Max * 0.45) pool.push('air', 'air');
    const ev = pool[Math.floor(Math.random() * pool.length)];
    if (ev === 'current') { const a = rnd(0, 6.3); current = { dir: new V3(Math.cos(a), rnd(-0.2, 0.2), Math.sin(a)), f: 5 + m / 400, t: 12 }; showMsg('🌊 Starke Strömung!', 'Gegensteuern!', 1.8); sfxRumble(0.5); }
    else if (ev === 'cavein') { showMsg('⚠️ Steinschlag!', 'Felsbrocken von oben – ausweichen!', 1.8); sfxRumble(1); shake(0.6); for (let i = 0; i < 12; i++) falling.push({ p: new V3(sub.pos.x + rnd(-9, 9), sub.pos.y + rnd(18, 40), sub.pos.z + rnd(-9, 9)), v: new V3(0, -rnd(4, 8), 0), r: rnd(0.6, 1.4), t: 0, q: new THREE.Quaternion().setFromEuler(_e.set(rnd(0, 6), rnd(0, 6), 0)) }); }
    else if (ev === 'beacon') {
      const y = sub.pos.y - rnd(40, 90) / DS * 1.2, c = center(y), a = rnd(0, 6.3), d = baseR(y) * 0.4;
      const g = build('buoy'); g.scale.setScalar(0.7); const p = new V3(c.x + Math.cos(a) * d, y, c.z + Math.sin(a) * d); g.position.copy(p); scene.add(g);
      const zi = zoneIndexAt(depthM(y)); beacon = { p, g, t: 100, reward: Math.round(40 * Math.pow(2.2, zi)) };
      showMsg('📟 Notsignal empfangen!', `Unter dir · Bergungsprämie ${fmt(beacon.reward)} Cr`, 2.2); sfxBeep(); sfxBeep(0.2);
    } else if (ev === 'treasure') {
      const y = sub.pos.y - rnd(8, 25), th = rnd(0, 6.3); wallPoint(th, y, 1.2, WP);
      const ch = chunks.get(Math.floor(-y / CH));
      if (ch) { const it = addItem(ch, 'crate', WP.pos); it.seen = clock + 20; showMsg('💰 Schatzsignal!', 'Eine Kiste in der Nähe – siehe Radar', 2); sfxBeep(); }
    } else if (ev === 'air') {
      const y = sub.pos.y - rnd(3, 12), ch = chunks.get(Math.floor(-y / CH));
      if (ch) { wallPoint(rnd(0, 6.3), y, 0.6, WP); ch.pockets.push({ p: WP.pos.clone(), n: WP.n.clone(), air: 60, seen: clock + 30 }); showMsg('🫧 Luftblasen geortet!', 'Siehe Radar (blau)', 2); sfxBeep(); }
    }
  }
  if (current && (current.t -= dt) <= 0) current = null;
  if (current && Math.random() < 0.6) emit(_b.copy(sub.pos).add(_v.set(rnd(-8, 8), rnd(-4, 4), rnd(-8, 8))), _v.copy(current.dir).multiplyScalar(14), 0.8, 0.12, 0x8fdfff, 0, 0);
  if (beacon) {
    beacon.t -= dt; beacon.g.rotation.y += dt;
    if (Math.random() < 0.3) emit(beacon.p, _v.set(0, 3, 0), 0.6, 0.6, 0x5aff8a, 0, 1);
    if (beacon.p.distanceTo(sub.pos) < 3.5) {
      save.money += beacon.reward; save.stats.earned += beacon.reward; save.stats.beacons++;
      toast(`📟 Notsender geborgen · +${fmt(beacon.reward)} Cr`, 'gold'); sfxFanfare(); scene.remove(beacon.g); beacon = null;
    } else if (beacon.t <= 0) { toast('📟 Das Notsignal ist verstummt.'); scene.remove(beacon.g); beacon = null; }
  }
  let n = 0;
  for (let i = falling.length - 1; i >= 0; i--) {
    const f = falling[i]; f.t += dt; f.v.y -= 6 * dt; f.p.addScaledVector(f.v, dt);
    if (f.p.distanceTo(sub.pos) < f.r + SUB_R) { damage(14, 'Steinschlag'); shake(0.7); sfxThud(9); burst(f.p, 20, 6, 0.8, 0.4, 0x8a8070, -3); falling.splice(i, 1); continue; }
    if (f.t > 9 || f.p.y < sub.pos.y - 40) { falling.splice(i, 1); continue; }
    if (n < 24) fallIM.setMatrixAt(n++, _m4.compose(f.p, f.q, _s.setScalar(f.r)));
  }
  fallIM.count = n; fallIM.instanceMatrix.needsUpdate = true;
  // Leviathan erscheint im Hadal-Graben
  if (!leviathan && !levDone && depthM(sub.pos.y) > 2150) spawnLeviathan();
}

// ============ Audio (Web Audio über ArcadeCore-Kontext) ============
const AU = { ok: false };
function audioInit() {
  if (AU.ok) return;
  const ctx = AC && AC.getAudioContext ? AC.getAudioContext() : null;
  if (!ctx) return;
  try {
    AU.ok = true; AU.ctx = ctx;
    AU.master = ctx.createGain(); AU.master.connect(ctx.destination);
    AU.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = AU.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    // Ambient-Drone je Zone
    AU.dF = ctx.createBiquadFilter(); AU.dF.type = 'lowpass'; AU.dF.frequency.value = 600; AU.dF.Q.value = 3;
    AU.dG = ctx.createGain(); AU.dG.gain.value = 0;
    AU.dO = [0, 1, 2].map(i => { const o = ctx.createOscillator(); o.type = i === 2 ? 'sine' : 'sawtooth'; o.frequency.value = 55; o.connect(AU.dF); o.start(); return o; });
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 220; lfo.connect(lg); lg.connect(AU.dF.frequency); lfo.start();
    AU.dF.connect(AU.dG); AU.dG.connect(AU.master);
    // Wasserrauschen
    const ns = ctx.createBufferSource(); ns.buffer = AU.noise; ns.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 300; AU.nG = ctx.createGain(); AU.nG.gain.value = 0.05;
    ns.connect(nf); nf.connect(AU.nG); AU.nG.connect(AU.master); ns.start();
    // Bohrer
    AU.mO = ctx.createOscillator(); AU.mO.type = 'square'; AU.mF = ctx.createBiquadFilter(); AU.mF.type = 'bandpass'; AU.mF.Q.value = 2;
    AU.mG = ctx.createGain(); AU.mG.gain.value = 0; AU.mO.connect(AU.mF); AU.mF.connect(AU.mG); AU.mG.connect(AU.master); AU.mO.start();
    // Motor
    AU.eO = ctx.createOscillator(); AU.eO.type = 'triangle'; AU.eO.frequency.value = 45; AU.eG = ctx.createGain(); AU.eG.gain.value = 0;
    AU.eO.connect(AU.eG); AU.eG.connect(AU.master); AU.eO.start();
  } catch (e) { AU.ok = false; }
}
function setDrone(zi) {
  if (!AU.ok) return; const Z = ZONES[zi], t = AU.ctx.currentTime;
  AU.dO[0].frequency.setTargetAtTime(Z.drone[0], t, 2); AU.dO[1].frequency.setTargetAtTime(Z.drone[1] * 1.004, t, 2);
  AU.dO[2].frequency.setTargetAtTime(Z.drone[0] / 2, t, 2); AU.dF.frequency.setTargetAtTime(Math.max(180, 720 - zi * 85), t, 3);
}
const muted = () => AC && AC.isMuted && AC.isMuted();
function audioFrame() {
  if (!AU.ok) return; const t = AU.ctx.currentTime;
  AU.master.gain.setTargetAtTime(muted() ? 0 : 0.9, t, 0.05);
  AU.dG.gain.setTargetAtTime(state === 'dive' ? 0.045 : 0.02, t, 0.5);
  AU.nG.gain.setTargetAtTime(state === 'dive' ? 0.06 : 0.03, t, 0.5);
  const sp = state === 'dive' ? sub.vel.length() : 0;
  AU.eG.gain.setTargetAtTime(Math.min(0.08, sp * 0.008), t, 0.1); AU.eO.frequency.setTargetAtTime(38 + sp * 3 * (sub.boosting ? 1.5 : 1), t, 0.1);
  if (state === 'dive' && Math.random() < 0.0025) ambientCall();
}
function drillTone(on, prog) {
  if (!AU.ok) return; const t = AU.ctx.currentTime;
  AU.mG.gain.setTargetAtTime(on ? 0.035 : 0, t, 0.03);
  AU.mO.frequency.setTargetAtTime(110 + prog * 220 + Math.random() * 15, t, 0.02); AU.mF.frequency.setTargetAtTime(600 + prog * 1400, t, 0.03);
}
function tone(f, dur, type, g, slide, delay) {
  if (!AU.ok || muted()) return;
  try {
    const ctx = AU.ctx, t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(g || 0.1, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(AU.master); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) {}
}
function noise(dur, ftype, freq, g, slideF, delay) {
  if (!AU.ok || muted()) return;
  try {
    const ctx = AU.ctx, t = ctx.currentTime + (delay || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gn = ctx.createGain();
    s.buffer = AU.noise; f.type = ftype; f.frequency.setValueAtTime(freq, t); if (slideF) f.frequency.exponentialRampToValueAtTime(slideF, t + dur);
    gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(gn); gn.connect(AU.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  } catch (e) {}
}
const sfxPing = () => { tone(1500, 0.6, 'sine', 0.12, 1380); tone(1500, 0.5, 'sine', 0.04, 1380, 0.4); tone(1500, 0.4, 'sine', 0.015, 1380, 0.8); };
const sfxCreak = over => { tone(rnd(60, 95), rnd(0.5, 1.1), 'sawtooth', Math.min(0.09, 0.03 + over / 3000), rnd(35, 50)); noise(0.5, 'bandpass', rnd(250, 500), 0.05, 150); };
const sfxThud = v => { tone(70, 0.25, 'sine', Math.min(0.3, 0.06 + v * 0.02), 35); noise(0.2, 'lowpass', 400, 0.12, 80); };
const sfxCrack = () => { noise(0.08, 'highpass', 2500, 0.12); tone(rnd(500, 700), 0.06, 'square', 0.03, 300); };
const sfxBreak = () => { noise(0.4, 'lowpass', 1800, 0.2, 200); tone(140, 0.3, 'triangle', 0.12, 60); };
const sfxChime = c => { const f = 620 * Math.pow(2, Math.min(c, 24) / 24); tone(f, 0.18, 'sine', 0.09); tone(f * 1.5, 0.22, 'sine', 0.04, null, 0.04); };
const sfxFull = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, null, i * 0.08));
const sfxFanfare = () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, i % 2 ? 'triangle' : 'square', 0.06, null, i * 0.09));
const sfxReveal = () => [220, 277, 330, 440].forEach((f, i) => tone(f, 2.2, 'sine', 0.07, null, i * 0.25));
const sfxDeny = () => tone(150, 0.16, 'square', 0.05, 110);
const sfxAlarm = () => { tone(880, 0.15, 'square', 0.05); tone(660, 0.15, 'square', 0.05, null, 0.18); tone(880, 0.15, 'square', 0.05, null, 0.36); };
const sfxBubble = () => tone(rnd(300, 600), 0.12, 'sine', 0.05, rnd(800, 1200));
const sfxSizzle = () => noise(0.6, 'highpass', 3000, 0.08);
const sfxZap = () => { for (let i = 0; i < 4; i++) tone(rnd(900, 2000), 0.05, 'square', 0.05, rnd(200, 400), i * 0.05); };
const sfxBite = () => { noise(0.2, 'lowpass', 900, 0.25, 100); tone(90, 0.25, 'sawtooth', 0.12, 40); };
const sfxHiss = () => noise(0.45, 'bandpass', 3200, 0.06, 1500);
const sfxRoar = k => { k = k || 1; tone(70 * (2 - k), 1.2 * k, 'sawtooth', 0.12 * k, 32); noise(1.1 * k, 'lowpass', 500, 0.15 * k, 60); };
const sfxHarpoon = () => { noise(0.18, 'bandpass', 1800, 0.12, 600); tone(320, 0.08, 'square', 0.05, 160); };
const sfxHit = () => { tone(180, 0.12, 'square', 0.08, 80); noise(0.12, 'bandpass', 1200, 0.1); };
const sfxBeep = d => tone(1250, 0.12, 'square', 0.05, null, d || 0);
const sfxBoom = () => { tone(55, 1.2, 'sine', 0.3, 25); noise(1.2, 'lowpass', 700, 0.3, 40); };
const sfxRumble = k => noise(1.6 * k, 'lowpass', 160, 0.25 * k, 50);
function ambientCall() { // ferne Walgesänge / unheimliche Töne je nach Zone
  const zi = zoneIndexAt(depthM(sub.pos.y)), f = zi < 2 ? rnd(300, 500) : zi < 4 ? rnd(140, 260) : rnd(60, 120);
  tone(f, 2.5, 'sine', 0.03, f * rnd(0.6, 1.4)); tone(f * 1.5, 2, 'sine', 0.012, f * rnd(0.8, 1.6), 0.4);
}

// ============ Kamera & Umgebung ============
const camPos = new V3(), camLook = new V3();
function updateCamera(dt) {
  const desc = clamp(-sub.vel.y / (S.speed * 0.8), 0, 1), asc = clamp(sub.vel.y / (S.speed * 0.8), 0, 1);
  _a.copy(sub.pos).addScaledVector(fwd, -8.5 + desc * 2).addScaledVector(UP, 3 + desc * 5 - asc * 1.5);
  keepInside(_a, 1.2); if (_a.y > -0.4) _a.y = -0.4;
  camPos.lerp(_a, 1 - Math.exp(-dt * 4));
  _b.copy(sub.pos).addScaledVector(aimDir, 5).addScaledVector(UP, 0.6 - desc * 6);
  camLook.lerp(_b, 1 - Math.exp(-dt * 6));
  camera.position.copy(camPos);
  if (shakeAmt > 0.01) camera.position.add(_v.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(shakeAmt * 0.35));
  camera.lookAt(camLook);
  shakeAmt *= Math.exp(-dt * 5);
}
const SKY = new THREE.Color(0x8fd0ec), _fc = new THREE.Color(), _fc2 = new THREE.Color();
function updateEnv(dt) {
  const camY = camera.position.y, above = camY > 0.02, m = depthM(Math.min(camY, state === 'dive' ? sub.pos.y : camY));
  if (above) { FOG.color.copy(SKY); FOG.density = 0.0022; hemi.intensity = 1; hemi.color.setHex(0xdff4ff); hemi.groundColor.setHex(0x335566); sun.intensity = 1; }
  else {
    const zb = zoneBlend(m);
    _fc.setHex(zb.a.fog).lerp(_fc2.setHex(zb.b.fog), zb.t);
    FOG.color.copy(_fc); FOG.density = lerp(zb.a.fogD, zb.b.fogD, zb.t) * (1 - 0.06 * lvl('light'));
    hemi.intensity = lerp(zb.a.amb, zb.b.amb, zb.t) * (0.85 + 0.15 * Math.exp(-m / 60));
    hemi.color.copy(_fc).lerp(SKY, 0.5); hemi.groundColor.copy(_fc).multiplyScalar(0.5);
    sun.intensity = 0.9 * Math.exp(-m / 55);
  }
  scene.background.copy(FOG.color);
  const lightOn = state === 'dive' && sub.light && sub.bat > 0;
  const flick = sub.bat < S.batMax * 0.08 || zapT > 0 ? (Math.random() < 0.3 ? 0.2 : 1) : 1;
  headlight.intensity = lightOn ? S.lightPow * flick : 0; headlight.distance = S.lightRange;
  headlight.position.copy(sub.pos).addScaledVector(fwd, 1.8); headlight.target.position.copy(sub.pos).addScaledVector(aimDir, 12);
  fill.position.copy(sub.pos).addScaledVector(UP, 2.5).addScaledVector(fwd, -2); fill.intensity = state === 'dive' ? 0.5 + 0.5 * clamp(m / 800, 0, 1) : 0;
  zapT -= dt;
  lightCone.visible = lightOn && !above; coneU.uOp.value = 0.09 * flick * clamp(m / 300, 0.25, 1);
  if (lightCone.visible) { lightCone.position.copy(headlight.position); lightCone.lookAt(headlight.target.position); }
  const rk = above ? 0 : clamp(1 - m / 140, 0, 1);
  raysMat.opacity = 0.06 * rk * (0.8 + 0.2 * Math.sin(clock * 0.7)); rays.forEach(r => { r.visible = rk > 0.01; r.rotation.y = Math.sin(clock * 0.1 + r.userData.ph) * 0.2; });
  snowU.uCam.value.copy(camera.position); snowU.uBright.value = above ? 0 : 0.18 + hemi.intensity * 0.35 + (lightOn ? 0.15 : 0);
  snowU.uCol.value.copy(_fc).lerp(SKY, 0.7);
  waterTop.visible = above || m < 120; waterBot.visible = !above && m < 120;
}

// ============ HUD ============
const txtCache = {};
const setT = (id, v) => { if (txtCache[id] !== v) { txtCache[id] = v; $(id).textContent = v; } };
const setW = (id, f) => { const v = (clamp(f, 0, 1) * 100).toFixed(1) + '%'; if (txtCache[id + 'w'] !== v) { txtCache[id + 'w'] = v; $(id).querySelector('i').style.width = v; } };
function cheapestUpgrade() {
  let best = null;
  D.UPGRADES.forEach(u => { if (lvl(u.id) >= u.max || (u.need && save.record < u.need)) return; const p = priceOf(u); if (!best || p < best.p) best = { u, p }; });
  return best;
}
function updateHud() {
  const m = depthM(sub.pos.y);
  setT('dVal', Math.round(m) + ' m'); $('dVal').classList.toggle('over', m > S.rating);
  const Z = ZONES[zoneIndexAt(m)];
  setT('dZone', Z.e + ' ' + Z.n); setT('dSub', 'Nenntiefe ' + S.rating + ' m · Rekord ' + Math.max(save.record, Math.round(diveMax)) + ' m');
  setW('o2Bar', sub.o2 / S.o2Max); setT('o2Txt', '🫧 O₂ ' + Math.ceil(sub.o2) + ' s');
  setW('hullBar', sub.hull / S.hullMax); $('hullBar').style.setProperty('--hull', `hsl(${Math.round(clamp(sub.hull / S.hullMax, 0, 1) * 120)}, 75%, 52%)`); setT('hullTxt', '🛡️ Hülle ' + Math.max(0, Math.ceil(sub.hull)) + ' / ' + S.hullMax);
  setW('batBar', sub.bat / S.batMax); setT('batTxt', '🔋 Akku ' + Math.ceil(sub.bat / S.batMax * 100) + ' %' + (sub.light ? '' : ' · Licht aus'));
  setW('cargoBar', sub.cargoN / S.cargo); setT('cargoTxt', '📦 ' + sub.cargoN + ' / ' + S.cargo + ' · ' + fmt(cargoValue() + sub.bonus) + ' Cr');
  $('o2Bar').classList.toggle('low', sub.o2 < S.o2Max * 0.25); $('hullBar').classList.toggle('low', sub.hull < S.hullMax * 0.3);
  $('batBar').classList.toggle('low', sub.bat < S.batMax * 0.15);
  setT('hMoney', fmt(save.money) + (sub.buoys ? '  · 🎈' + sub.buoys : '') + (S.charges ? '  · 💣' + sub.charges : ''));
  const cu = cheapestUpgrade();
  $('upgReady').style.display = cu && save.money + cargoValue() + sub.bonus >= cu.p ? 'block' : 'none';
  // Fadenkreuz & Zielmarke
  _a.copy(sub.pos).addScaledVector(aimDir, 14).project(camera);
  const rt = $('reticle'); rt.style.transform = `translate(${(_a.x + 1) / 2 * innerWidth}px, ${(1 - _a.y) / 2 * innerHeight}px)`;
  const lock = aimAssist(); rt.classList.toggle('lock', !!lock);
  const om = $('oreMark'); document.body.classList.toggle('hasTarget', !!target);
  if (target) {
    _a.copy(target.pos).project(camera);
    if (_a.z < 1) {
      om.style.display = 'block'; om.style.transform = `translate(${(_a.x + 1) / 2 * innerWidth}px, ${(1 - _a.y) / 2 * innerHeight}px)`;
      let lbl = '', bad = false, prog = 0;
      if (target.kind === 'node') { const o = ORES[target.o.type]; bad = o.tier > S.drillTier; lbl = o.e + ' ' + o.n + (target.o.jack ? ' ✨' : '') + ' ×' + target.o.units + (bad ? ' · Stufe ' + o.tier : ''); prog = target.o.prog; }
      else if (target.kind === 'wreck') { lbl = '⚓ Wrack plündern'; prog = target.o.prog; }
      else if (target.kind === 'crate') { lbl = '🧰 Kiste öffnen'; prog = target.o.prog; }
      else lbl = '✨ ???';
      setT('oreLbl', lbl); om.classList.toggle('bad', bad); $('prog').style.width = (prog * 100).toFixed(0) + '%';
    } else om.style.display = 'none';
  } else om.style.display = 'none';
  // Notsignal-Anzeige
  const bc = $('beacon');
  if (beacon) {
    _a.copy(beacon.p).project(camera);
    const onScr = _a.z < 1 && Math.abs(_a.x) < 0.95 && Math.abs(_a.y) < 0.9;
    const x = onScr ? (_a.x + 1) / 2 * innerWidth : innerWidth / 2, y = onScr ? (1 - _a.y) / 2 * innerHeight : innerHeight * 0.78;
    bc.style.display = 'block'; bc.style.left = x + 'px'; bc.style.top = y + 'px';
    bc.textContent = `📟 ${Math.round(beacon.p.distanceTo(sub.pos) * DS)} m ${beacon.p.y < sub.pos.y - 3 ? '▼' : beacon.p.y > sub.pos.y + 3 ? '▲' : ''} · ${Math.ceil(beacon.t)} s`;
  } else bc.style.display = 'none';
  const ch = contractHud(); if (txtCache.contract !== ch) { txtCache.contract = ch; $('contract').innerHTML = ch; }
}
function contractHud() {
  const open = save.contracts.filter(c => c.prog < c.goal), done = save.contracts.length - open.length;
  const c = open.sort((a, b) => b.prog / b.goal - a.prog / a.goal)[0];
  if (!c) return done ? `✅ ${done} Auftrag${done > 1 ? 'e' : ''} erfüllt – auftauchen zum Kassieren!` : '';
  const p = c.type === 'ore' ? Math.min(c.goal, c.prog + (sub.cargo[c.ore] || 0)) : c.type === 'value' ? Math.min(c.goal, cargoValue()) : Math.min(c.goal, c.prog);
  return `📋 ${contractText(c)}<br><b>${c.type === 'value' ? fmt(p) : Math.floor(p)} / ${fmt(c.goal)}</b> · +${fmt(c.reward)} Cr` + (done ? `<br>✅ ${done} erfüllt` : '');
}
// Radar (Draufsicht, Blickrichtung oben)
const rc = $('radar').getContext('2d');
let radarFrame = 0;
function drawRadar() {
  if ((radarFrame++ & 1) === 1) return;
  const W = 170, H = W / 2, range = Math.max(42, S.sonarR), sc = (H - 6) / range;
  const fx = fwd.x, fz = fwd.z, toR = (x, z) => { const dx = x - sub.pos.x, dz = z - sub.pos.z; return [H + (-fz * dx + fx * dz) * sc, H - (fx * dx + fz * dz) * sc]; };
  rc.clearRect(0, 0, W, W); rc.save(); rc.beginPath(); rc.arc(H, H, H - 2, 0, 6.3); rc.clip();
  rc.fillStyle = 'rgba(0, 30, 36, 0.6)'; rc.fillRect(0, 0, W, W);
  rc.strokeStyle = 'rgba(90, 220, 255, 0.12)'; rc.lineWidth = 1;
  for (let r = 1; r <= 3; r++) { rc.beginPath(); rc.arc(H, H, (H - 6) * r / 3, 0, 6.3); rc.stroke(); }
  // Grabenwand auf aktueller und tieferer Höhe
  [[sub.pos.y - 14, 'rgba(90, 220, 255, 0.25)', 1], [sub.pos.y, 'rgba(120, 235, 255, 0.85)', 2]].forEach(([y, col, lw]) => {
    const c = center(y), cx = c.x, cz = c.z, br = baseR(y);
    rc.strokeStyle = col; rc.lineWidth = lw; rc.beginPath();
    for (let j = 0; j <= 48; j++) { const th = j / 48 * 6.2832, R = radiusAt(th, y, br), [x, z] = toR(cx + Math.cos(th) * R, cz + Math.sin(th) * R); j ? rc.lineTo(x, z) : rc.moveTo(x, z); }
    rc.stroke();
  });
  if (PING.uPR.value > 0) { rc.strokeStyle = `rgba(120, 240, 255, ${clamp(1 - pingT / 2.5, 0, 1)})`; rc.lineWidth = 2; rc.beginPath(); const [px, pz] = toR(pingO.x, pingO.z); rc.arc(px, pz, Math.min(pingT * WAVE, pingR) * sc, 0, 6.3); rc.stroke(); }
  const vis = s => S.scanner ? 1 : clamp(1 - (clock - s) / 9, 0, 1);
  const dot = (p, col, r, a, shape) => {
    if (a <= 0) return; const [x, z] = toR(p.x, p.z); const dy = p.y - sub.pos.y;
    rc.globalAlpha = a * (Math.abs(dy) > 12 ? 0.45 : 1); rc.fillStyle = col; rc.beginPath();
    if (shape === 'sq') rc.rect(x - r, z - r, r * 2, r * 2); else rc.arc(x, z, r, 0, 6.3);
    rc.fill();
    if (Math.abs(dy) > 5) { rc.fillStyle = '#fff'; rc.font = 'bold 8px sans-serif'; rc.fillText(dy > 0 ? '▲' : '▼', x + r, z - r); }
  };
  for (const ch of chunks.values()) {
    for (const n of ch.nodes) if (n.alive) dot(n.pos, '#' + new THREE.Color(ORES[n.type].col).getHexString(), n.jack ? 3.5 : 2.2, vis(n.seen));
    for (const pk of ch.pockets) if (pk.air > 0) dot(pk.p, '#5fd8ff', 3.5, clamp(1 - (clock - pk.seen) / 9, 0, 1), 'ring');
    for (const it of ch.items) if (!it.done) dot(it.p, it.kind === 'buoy' ? '#86efac' : '#fde047', 3.5, clamp(1 - (clock - it.seen) / 9, 0, 1), 'sq');
    if (ch.wreck && !ch.wreck.looted) dot(ch.wreck.p, '#fbbf24', 5, Math.max(clamp(1 - (clock - ch.wreck.seen) / 12, 0, 1), ch.wreck.p.distanceTo(sub.pos) < 20 ? 1 : 0), 'sq');
  }
  for (const m of mobs) { if (m.dead) continue; if (m.kind === 'angler' && m.lurePos) dot(m.lurePos, '#ffd84a', 2.4, vis(m.seen)); dot(m.pos, '#ff4d4d', m.kind === 'boss' ? 6 : 3, m.kind === 'boss' ? 1 : vis(m.seen)); }
  for (const s of schools) dot(s.c, '#9fe8b0', 2, vis(s.seen) * 0.6);
  rc.globalAlpha = 1;
  if (beacon) { const [x, z] = toR(beacon.p.x, beacon.p.z), dx = x - H, dz = z - H, d = Math.hypot(dx, dz), k = d > H - 8 ? (H - 8) / d : 1; rc.fillStyle = '#5aff8a'; rc.beginPath(); rc.arc(H + dx * k, H + dz * k, 4 + Math.sin(clock * 6) * 1.5, 0, 6.3); rc.fill(); }
  rc.fillStyle = '#e6fbff'; rc.beginPath(); rc.moveTo(H, H - 7); rc.lineTo(H - 5, H + 5); rc.lineTo(H + 5, H + 5); rc.fill();
  rc.restore();
}
// Risse im Glas (Druck / Hüllenschaden)
let cracks = [];
function drawCracks() {
  const w = fxc.width, h = fxc.height; fxx.clearRect(0, 0, w, h);
  if (!cracks.length) for (let i = 0; i < 7; i++) {
    const corner = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0], [0, 0.5], [1, 0.6]][i], pts = [];
    let x = corner[0], y = corner[1], a = Math.atan2(0.5 - y, 0.5 - x) + rnd(-0.6, 0.6);
    for (let j = 0; j < 9; j++) { pts.push([x, y]); x += Math.cos(a) * rnd(0.03, 0.07); y += Math.sin(a) * rnd(0.03, 0.07); a += rnd(-0.7, 0.7); }
    cracks.push(pts);
  }
  fxx.lineCap = 'round';
  cracks.forEach((pts, i) => {
    fxx.strokeStyle = 'rgba(220, 245, 255, 0.75)'; fxx.lineWidth = 2.2 - i * 0.15; fxx.beginPath();
    pts.forEach(([x, y], j) => j ? fxx.lineTo(x * w, y * h) : fxx.moveTo(x * w, y * h)); fxx.stroke();
    fxx.strokeStyle = 'rgba(0, 0, 0, 0.35)'; fxx.lineWidth = 1; fxx.stroke();
  });
}

// ============ Logbuch, Erfolge, Aufträge ============
const CODEX_IDS = new Set(D.CODEX.map(c => c.id));
const codexPct = () => Math.floor(Object.keys(save.codex).filter(k => CODEX_IDS.has(k)).length / D.CODEX.length * 100);
function discover(id, quiet) {
  if (save.codex[id] || !CODEX_IDS.has(id)) return false;
  save.codex[id] = 1;
  const e = D.CODEX.find(c => c.id === id);
  let extra = '';
  if (id.startsWith('c_')) { const prize = 25 * (zoneIndexAt(depthM(sub.pos.y)) + 1); save.money += prize; save.stats.earned += prize; extra = ` · +${prize} Cr Forschungsprämie`; }
  if (!quiet) { toast(`📖 Neu im Logbuch: <b>${e.n}</b>${extra}`); tone(880, 0.3, 'sine', 0.06); tone(1320, 0.4, 'sine', 0.04, null, 0.1); }
  return true;
}
function checkAch() {
  const s = { record: save.record, stats: save.stats, notes: save.notes, codexPct: codexPct(), maxed: D.UPGRADES.every(u => lvl(u.id) >= u.max) };
  D.ACH.forEach(a => {
    if (save.ach[a.id] || !a.test(s)) return;
    save.ach[a.id] = 1; save.money += a.r; save.stats.earned += a.r;
    toast(`🏆 Erfolg: <b>${a.n}</b>${a.r ? ' · +' + fmt(a.r) + ' Cr' : ''}`, 'gold', 4.5); snd('powerup');
  });
}
function contractText(c) {
  switch (c.type) {
    case 'ore': return `Liefere ${c.goal}× ${ORES[c.ore].e} ${ORES[c.ore].n}`;
    case 'depth': return `Erreiche ${c.goal} m Tiefe`;
    case 'scan': return `Scanne ${c.goal} Lebewesen per Sonar`;
    case 'kill': return `Erlege ${c.goal} Raubtiere`;
    case 'value': return `Bringe Fracht für ${fmt(c.goal)} Cr in einem Tauchgang`;
    case 'wreck': return 'Plündere ein Wrack';
    case 'combo': return `Schaffe eine ${c.goal}er Bohr-Serie`;
  }
  return '?';
}
function genContract() {
  const zr = zoneReached(), f = zr + 1, have = save.contracts.map(c => c.type + (c.ore || ''));
  const types = ['ore', 'ore', 'ore', 'depth', 'scan', 'value', 'combo'];
  if (save.record >= 150) types.push('kill', 'kill');
  if (save.record >= 60) types.push('wreck');
  for (let tries = 0; tries < 20; tries++) {
    const type = types[Math.floor(Math.random() * types.length)];
    let c = null;
    if (type === 'ore') {
      const zi = Math.max(0, zr - (Math.random() < 0.4 ? 1 : 0)), ore = pickWeighted(ZONES[zi].ores, Math.random(), k => ORES[k].tier <= S.drillTier);
      if (!ore) continue;
      const n = clamp(Math.round(rnd(4, 9) * (1 + zr * 0.2)), 3, Math.max(3, Math.round(S.cargo * 0.8)));
      c = { type, ore, goal: n, reward: Math.round(n * ORES[ore].v * 1.7 + 20 * f) };
    } else if (type === 'depth') {
      const g = Math.ceil((save.record + rnd(40, 140)) / 10) * 10;
      if (g > S.rating + 60) continue;
      c = { type, goal: g, reward: Math.round(g * 0.9 + 30) };
    } else if (type === 'scan') { const n = 3 + Math.min(6, zr); c = { type, goal: n, reward: 40 * f + n * 12 }; }
    else if (type === 'kill') { const n = 2 + Math.min(5, zr); c = { type, goal: n, reward: Math.round(55 * Math.pow(f, 1.5) * n / 2) }; }
    else if (type === 'value') {
      const Z = ZONES[zr]; let ws = 0, vs = 0; for (const k in Z.ores) { ws += Z.ores[k]; vs += Z.ores[k] * ORES[k].v; }
      const v = Math.max(30, Math.round(S.cargo * vs / ws * 0.6 / 10) * 10); c = { type, goal: v, reward: Math.round(v * 0.5 + 15 * f) };
    } else if (type === 'wreck') c = { type, goal: 1, reward: Math.round(120 * Math.pow(f, 1.5)) };
    else if (type === 'combo') { const n = Math.min(25, 6 + zr * 2); c = { type, goal: n, reward: Math.round(30 * Math.pow(f, 1.6)) }; }
    if (!c || have.includes(c.type + (c.ore || ''))) continue;
    c.prog = 0; return c;
  }
  return { type: 'scan', goal: 3, prog: 0, reward: 50 };
}
function ensureContracts() { while (save.contracts.length < 3) save.contracts.push(genContract()); }
function contractEvent(type, v) {
  for (const c of save.contracts) { if (c.type !== type) continue; if (type === 'depth' || type === 'combo') c.prog = Math.max(c.prog, v); else c.prog += v; }
}
function payContracts() {
  let paid = 0; const names = [];
  save.contracts = save.contracts.filter(c => { if (c.prog >= c.goal) { paid += c.reward; names.push(contractText(c)); save.stats.contracts++; return false; } return true; });
  save.money += paid; save.stats.earned += paid; ensureContracts();
  return { paid, names };
}

// ============ Station (Hub) ============
let tab = 'dive';
const TABS = [['dive', '🚀 Tauchen'], ['shop', '🔧 Werft'], ['contracts', '📋 Aufträge'], ['codex', '📖 Logbuch'], ['ach', '🏆 Erfolge'], ['opt', '⚙️ Optionen']];
const EFF = {
  hull: s => s.rating + ' m', armor: s => s.hullMax + ' HP', o2: s => Math.round(s.o2Max) + ' s', battery: s => s.batMax + ' Energie',
  drill: s => '×' + s.drillSpeed.toFixed(2) + ' · Härte ' + s.drillTier, cargo: s => s.cargo + ' Brocken', engine: s => (s.speed * DS * 1.94).toFixed(0) + ' kn',
  boost: s => '×' + s.boostMul.toFixed(2) + ' · ' + s.boostDrain.toFixed(1) + '/s', light: s => Math.round(s.lightRange * DS) + ' m', sonar: s => Math.round(s.sonarR * DS) + ' m · ' + s.sonarCost + ' Energie',
  harpoon: s => s.harpoonDmg.toFixed(1) + ' Schaden · ' + s.harpoonCD.toFixed(2) + ' s', repair: s => s.repair.toFixed(2) + ' HP/s', buoy: s => s.buoys + ' je Tauchgang',
  magnet: s => 'Reichweite ' + Math.round(s.reach * DS) + ' m', thermal: s => Math.round((1 - s.heatK) * 100) + ' % Hitzeschutz', drone: s => s.drones + ' Drohne' + (s.drones === 1 ? '' : 'n'),
  charges: s => s.charges + ' Bomben', scanner: s => s.scanner ? 'aktiv' : 'aus',
};
function statsWith(id, add) { return D.stats(k => lvl(k) + (k === id ? add : 0)); }
function affordableCount() { return D.UPGRADES.filter(u => lvl(u.id) < u.max && (!u.need || save.record >= u.need) && priceOf(u) <= save.money).length; }
function nextZoneTip() {
  const Z = ZONES.find(z => z.from + 30 > S.rating);
  if (!Z) return '';
  const need = D.HULL_DEPTH.findIndex(d => d >= Z.from + 60);
  return `Nächste Zone: <b>${Z.e} ${Z.n}</b> ab ${Z.from} m – braucht <b>Druckhülle Stufe ${need}</b> (${D.HULL_DEPTH[need]} m).`;
}
function openStation() {
  state = 'station'; document.body.classList.remove('diving');
  $('station').style.display = 'flex'; renderStation();
  subG.visible = true; subG.position.set(9, -0.25, 3); subG.rotation.set(0, 0.6, 0);
  if (SP.arm) SP.arm.rotation.set(0, 0, 0);
  beam.visible = false; drillTone(false, 0);
}
function renderStation() {
  S = D.stats(lvl); ensureContracts();
  $('topStats').innerHTML = `<span>💰 <b>${fmt(save.money)}</b> Cr</span><span>🏆 Rekord <b>${save.record} m</b></span><span>🛡️ Nenntiefe <b>${S.rating} m</b></span><span>📖 Logbuch <b>${codexPct()} %</b></span>`;
  const ac = affordableCount(), cDone = save.contracts.filter(c => c.prog >= c.goal).length;
  $('tabs').innerHTML = TABS.map(([id, n]) => `<button data-tab="${id}" class="${tab === id ? 'on' : ''}">${n}${id === 'shop' && ac ? `<span class="badge">${ac}</span>` : ''}${id === 'contracts' && cDone ? `<span class="badge">✓</span>` : ''}</button>`).join('');
  const b = $('tabBody');
  if (tab === 'dive') b.innerHTML = diveTab();
  else if (tab === 'shop') b.innerHTML = shopTab();
  else if (tab === 'contracts') b.innerHTML = contractsTab();
  else if (tab === 'codex') b.innerHTML = codexTab();
  else if (tab === 'ach') b.innerHTML = achTab();
  else b.innerHTML = optTab();
}
function diveTab() {
  let h = '';
  const L = save.lastDive;
  if (!save.stats.dives) h += `<p>Willkommen auf der Tiefsee-Station! Unter uns liegt ein endloser <b>Graben</b> voller Erz. Tauche hinab, <b>bohre Erz</b> (Linksklick/F) und bring es nach oben – an der Oberfläche wird automatisch verkauft. ` +
    `Achte auf <b>Sauerstoff</b>, <b>Hülle</b> und <b>Akku</b>. Stirbst du, ist die Fracht weg – Geld und Upgrades bleiben.</p>`;
  else if (L) {
    if (L.ok) {
      const items = Object.keys(L.sold || {}).filter(k => ORES[k]).map(k => `${ORES[k].e} ${L.sold[k]}× ${ORES[k].n}`).join(' · ') || 'keine Fracht';
      h += `<div class="cat">Letzter Tauchgang</div><p>${items}</p><div class="sum"><div><small>Erz verkauft</small><b>${fmt(L.value)} Cr</b></div><div><small>Boni (Serie, Wracks, Jagd)</small><b>${fmt(L.bonus)} Cr</b></div>` +
        `<div><small>Aufträge</small><b>${fmt(L.paid)} Cr</b></div><div><small>Max. Tiefe</small><b>${L.depth} m</b></div></div>`;
      if (L.contracts && L.contracts.length) h += `<p>✅ Erfüllt: ${L.contracts.join(' · ')}</p>`;
    } else h += `<div class="cat">Letzter Tauchgang</div><p>💥 Verloren in ${L.depth} m (${L.cause || 'Unglück'}). Fracht im Wert von <b>${fmt(L.lost)} Cr</b> ist versunken.</p>`;
  }
  const cu = cheapestUpgrade();
  const tips = [];
  if (cu) tips.push(cu.p <= save.money ? `🔧 Du kannst dir <b>${cu.u.e} ${cu.u.n}</b> für ${fmt(cu.p)} Cr leisten – ab in die Werft!` : `🔧 Nächstes Upgrade: <b>${cu.u.e} ${cu.u.n}</b> – noch ${fmt(cu.p - save.money)} Cr.`);
  const nz = nextZoneTip(); if (nz) tips.push('🌊 ' + nz);
  if (tips.length) h += `<div class="tipBox">${tips.join('<br>')}</div>`;
  h += `<div class="sum"><div><small>🫧 Sauerstoff</small><b>${Math.round(S.o2Max)} s</b></div><div><small>📦 Fracht</small><b>${S.cargo}</b></div><div><small>⛏️ Bohrer</small><b>Härte ${S.drillTier}</b></div><div><small>🛡️ Hülle</small><b>${S.hullMax} HP</b></div></div>`;
  h += `<button class="primary" data-act="dive">🤿 Tauchgang starten</button>`;
  return h;
}
function shopTab() {
  const groups = [['Boot', ['hull', 'armor', 'o2', 'battery', 'engine', 'boost']], ['Werkzeug', ['drill', 'cargo', 'magnet', 'light', 'sonar', 'harpoon']], ['Module', ['repair', 'buoy', 'drone', 'thermal', 'charges', 'scanner']]];
  let h = `<p>Upgrades bleiben für immer. Preise steigen mit jeder Stufe.</p>`;
  groups.forEach(([gn, ids]) => {
    h += `<div class="cat">${gn}</div>`;
    ids.forEach(id => {
      const u = D.UPGRADES.find(x => x.id === id), l = lvl(id), max = l >= u.max, locked = u.need && save.record < u.need, p = priceOf(u);
      const now = EFF[id](S), next = max ? '' : ' → <b>' + EFF[id](statsWith(id, 1)) + '</b>';
      let extra = '';
      if (id === 'drill') { const ok = Object.keys(ORES).filter(k => ORES[k].tier <= S.drillTier).pop(), nx = Object.keys(ORES).find(k => ORES[k].tier > S.drillTier); extra = `<small>Bohrt bis ${ORES[ok].e} ${ORES[ok].n}${nx ? ` · ${ORES[nx].n} ab Stufe ${ORES[nx].tier}` : ''}</small>`; }
      h += `<div class="row ${locked ? 'locked' : ''}"><div><h3>${u.e} ${u.n}<span>Stufe ${l}/${u.max}</span></h3><small>${u.d}</small>${extra}<div class="val">${now}${next}</div></div>` +
        (locked ? `<button disabled>ab ${u.need} m</button>` : max ? '<button disabled>MAX</button>' : `<button data-buy="${id}" ${p > save.money ? 'disabled' : ''}>${fmt(p)} Cr</button>`) + '</div>';
    });
  });
  return h;
}
function contractsTab() {
  let h = `<p>Aufträge werden beim Auftauchen ausgezahlt. Fortschritt bleibt auch nach einem Unglück erhalten (Erz zählt erst beim Verkauf).</p>`;
  save.contracts.forEach((c, i) => {
    const done = c.prog >= c.goal, cost = Math.max(10, Math.round(c.reward * 0.1));
    h += `<div class="row ${done ? 'done' : ''}"><div><h3>📋 ${contractText(c)}</h3><div class="val">${done ? '✅ erfüllt – wird beim nächsten Auftauchen ausgezahlt' : `Fortschritt ${c.type === 'value' ? '' : fmt(Math.min(c.prog, c.goal)) + ' / ' + fmt(c.goal)}`} · Belohnung <b>${fmt(c.reward)} Cr</b></div>` +
      `<div class="pbar"><i style="width:${clamp(c.prog / c.goal, 0, 1) * 100}%"></i></div></div><button data-reroll="${i}" ${cost > save.money || done ? 'disabled' : ''} title="Neuer Auftrag">🎲 ${fmt(cost)}</button></div>`;
  });
  return h;
}
function codexTab() {
  let h = `<p>Scanne Lebewesen mit dem Sonar (R), baue Erze ab und finde Wracks. Neue Arten bringen eine Forschungsprämie.</p>`;
  ['Zonen', 'Erze', 'Lebewesen', 'Wracks'].forEach(cat => {
    const list = D.CODEX.filter(c => c.cat === cat), got = list.filter(c => save.codex[c.id]).length;
    h += `<div class="cat">${cat} · ${got}/${list.length}</div>`;
    list.forEach(c => { h += save.codex[c.id] ? `<div class="row"><div><h3>${c.n}</h3><small>${c.t}</small></div></div>` : `<div class="row locked"><div><h3>??? </h3><small>Noch nicht entdeckt</small></div></div>`; });
  });
  h += `<div class="cat">Logbuch der Voss-Expedition · ${Object.keys(save.notes).length}/14</div>`;
  ZONES.forEach(z => D.TEXT.wrecks[z.id].notes.forEach((t, i) => { if (save.notes[z.id + '_' + i]) h += `<div class="row"><div><small>${D.TEXT.wrecks[z.id].name}</small><h3 style="font-weight:600;color:#e0f2fe">${t}</h3></div></div>`; }));
  return h;
}
function achTab() {
  return `<p>${Object.keys(save.ach).length} / ${D.ACH.length} Erfolge</p>` + D.ACH.map(a => `<div class="row ${save.ach[a.id] ? 'done' : 'locked'}"><div><h3>${save.ach[a.id] ? '🏆' : '🔒'} ${a.n}</h3><small>${a.d}${a.r ? ' · +' + fmt(a.r) + ' Cr' : ''}</small></div></div>`).join('');
}
function optTab() {
  const s = save.stats, h = Math.floor(s.playTime / 3600), mi = Math.floor(s.playTime / 60) % 60;
  return `<div class="sum"><div><small>Tauchgänge</small><b>${s.dives}</b></div><div><small>Unglücke</small><b>${s.deaths}</b></div><div><small>Erz abgebaut</small><b>${fmt(s.ore)}</b></div>` +
    `<div><small>Raubtiere</small><b>${s.kills}</b></div><div><small>Verdient</small><b>${fmt(s.earned)} Cr</b></div><div><small>Spielzeit</small><b>${h} h ${mi} min</b></div>` +
    `<div><small>Wracks</small><b>${s.wrecks}</b></div><div><small>Aufträge</small><b>${s.contracts}</b></div><div><small>Beste Serie</small><b>${s.bestCombo}</b></div></div>` +
    `<p><b>Steuerung:</b> W/S fahren · A/D drehen · Leertaste/Shift (oder C) hoch/runter · Maus oder Q/E zielen · Linksklick/F bohren · Rechtsklick/G Harpune · R Sonar · B Turbo · L Licht · T Notboje · X Wasserbombe · P/Esc Pause.</p>` +
    `<button class="ghost danger" data-act="reset">Fortschritt komplett zurücksetzen</button>`;
}
$('tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { tab = b.dataset.tab; renderStation(); snd('pop'); } });
$('tabBody').addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.act === 'dive') startDive();
  else if (t.dataset.act === 'reset') {
    if (!confirm('Wirklich alles zurücksetzen? Geld, Upgrades, Logbuch und Erfolge gehen verloren.')) return;
    save = defaultSave(); persist(); S = D.stats(lvl); tab = 'dive'; renderStation();
  } else if (t.dataset.buy) {
    const u = D.UPGRADES.find(x => x.id === t.dataset.buy), p = priceOf(u);
    if (!u || lvl(u.id) >= u.max || p > save.money || (u.need && save.record < u.need)) return;
    save.money -= p; save.upg[u.id] = lvl(u.id) + 1; S = D.stats(lvl);
    snd('powerup'); checkAch(); persist(); renderStation();
  } else if (t.dataset.reroll != null) {
    const i = +t.dataset.reroll, c = save.contracts[i], cost = Math.max(10, Math.round(c.reward * 0.1));
    if (!c || cost > save.money) return;
    save.money -= cost; save.contracts.splice(i, 1); ensureContracts(); persist(); renderStation(); snd('pop');
  }
});

// ============ Spielablauf ============
let state = 'station', deadT = 0, buoyT = 0;
function startDive() {
  audioInit();
  S = D.stats(lvl); newWorld(Math.floor(Math.random() * 2e9));
  mined = new Set(); looted = new Set(); wreckChunk = {};
  ZONES.forEach((z, i) => {
    const a = Math.ceil(z.from / DS / CH) + 1, b = ZONES[i + 1] ? Math.floor(ZONES[i + 1].from / DS / CH) - 1 : a + 8;
    wreckChunk[z.id] = a + Math.floor(Math.random() * Math.max(1, Math.min(b - a, 7)));
  });
  Object.assign(sub, { yaw: 0, roll: 0, pitch: 0, hull: S.hullMax, o2: S.o2Max, bat: S.batMax, light: true, boosting: false, aimYaw: 0, aimPitch: -0.12, harpCD: 0,
    grabbedBy: null, mash: 0, buoys: S.buoys, charges: S.charges, cargo: {}, cargoN: 0, bonus: 0, combo: 0, comboT: 0, drilling: false });
  sub.pos.set(0, -2, 0); sub.vel.set(0, 0, 0); updateAimDir();
  diveT = 0; wentDown = false; diveMax = 0; lastMark = Math.floor(save.record / 100) * 100; lastZone = 0; eventT = rnd(40, 60);
  levDone = false; leviathan = null; current = null; beacon = null; falling = []; bits = []; target = null; deathCause = ''; crackLvl = 0;
  updateChunks(true); setupDrones();
  camPos.copy(sub.pos).add(_v.set(0, 3, -8.5)); camLook.copy(sub.pos);
  subG.visible = true;
  state = 'dive'; save.stats.dives++; persist();
  document.body.classList.add('diving'); $('station').style.display = 'none'; $('bossBar').style.display = 'none';
  if (save.hints.helpBar == null) document.body.classList.toggle('hideHint', save.stats.dives > 3);
  setDrone(0); sfxBubble(); sfxBubble();
  if (save.stats.dives === 1) { showMsg('🤿 Abtauchen!', 'Shift = runter · Linksklick/F an Erz = bohren', 3); setTimeout(() => hint('controls', '🎮 W/S fahren, A/D drehen, Shift/Leertaste runter/hoch, Maus zielt. Halte Linksklick an leuchtendem Erz!'), 3500); }
}
function endDive() {
  clearWorld();
  for (let i = mobs.length - 1; i >= 0; i--) removeMob(i);
  schools.length = 0;
  shots.forEach(s => scene.remove(s.mesh)); shots.length = 0; bombs.forEach(b => scene.remove(b.mesh)); bombs.length = 0;
  if (beacon) scene.remove(beacon.g); beacon = null; falling = []; bits = [];
  drones.forEach(d => scene.remove(d.g)); drones.length = 0;
  leviathan = null; current = null; sub.grabbedBy = null;
  PING.uPR.value = 0; Object.values(oreIM).forEach(im => { im.count = 0; }); fishIM.count = 0; oreBitIM.count = 0; fallIM.count = 0;
  $('combo').classList.remove('show'); fxc.style.opacity = 0; $('flash').style.opacity = 0;
}
function finishRecord() {
  save.record = Math.max(save.record, Math.floor(diveMax));
  if (AC && AC.saveScore) AC.saveScore('tiefenrausch', save.record);
}
function surface(viaBuoy) {
  const sold = Object.assign({}, sub.cargo), value = cargoValue(), bonus = Math.round(sub.bonus);
  save.money += value + bonus; save.stats.earned += value + bonus; save.stats.surfaced++;
  for (const c of save.contracts) { if (c.type === 'ore') c.prog += sold[c.ore] || 0; if (c.type === 'value') c.prog = Math.max(c.prog, value); }
  finishRecord();
  const cp = payContracts();
  save.lastDive = { ok: true, depth: Math.floor(diveMax), sold, value, bonus, paid: cp.paid, contracts: cp.names };
  checkAch(); persist();
  endDive(); tab = 'dive'; openStation();
  if (value + bonus + cp.paid > 0) { snd('coin'); sfxFanfare(); }
  toast(`${viaBuoy ? '🎈 Notboje: ' : '⚓ Aufgetaucht: '}+${fmt(value + bonus + cp.paid)} Cr`, 'gold');
}
function die() {
  state = 'dead'; deadT = 1.8;
  const lost = cargoValue() + Math.round(sub.bonus);
  save.stats.deaths++; finishRecord();
  save.lastDive = { ok: false, depth: Math.floor(depthM(sub.pos.y)), lost, cause: deathCause };
  checkAch(); persist();
  burst(sub.pos, 140, 14, 1.4, 0.6, 0xbfefff, 1); burst(sub.pos, 60, 9, 1, 0.5, 0xff9a5a, -1);
  subG.visible = false; beam.visible = false; drillTone(false, 0); shake(1.6); flashT = 1; snd('explosion'); sfxBoom(); snd('gameOver');
  $('dText').innerHTML = `Ursache: <b>${deathCause || 'Unglück'}</b> in ${save.lastDive.depth} m.<br>Verloren: Fracht für <b>${fmt(lost)} Cr</b>.<br>Dein Geld (${fmt(save.money)} Cr) und alle Upgrades bleiben.`;
}
function useBuoy() {
  if (state !== 'dive' || buoyT > 0) return;
  if (sub.buoys <= 0) { if (once('nobuoy', 2)) toast(S.buoys ? '🎈 Keine Notboje mehr übrig.' : '🎈 Notbojen gibt es in der Werft (ab 200 m Rekord).'); return; }
  sub.buoys--; buoyT = 1.4; sub.grabbedBy = null; showMsg('🎈 Notboje!', 'Ab nach oben …', 1.4); snd('powerup');
}
let paused = false;
function pause() { if (state !== 'dive' || paused) return; paused = true; $('pauseModal').style.display = 'flex'; $('pauseInfo').textContent = `${Math.round(depthM(sub.pos.y))} m · Fracht ${fmt(cargoValue() + sub.bonus)} Cr`; drillTone(false, 0); persist(); }
function resume() { paused = false; $('pauseModal').style.display = 'none'; last = performance.now(); }
$('resumeBtn').addEventListener('click', resume);
$('abortBtn').addEventListener('click', () => { resume(); deathCause = 'Aufgegeben'; sub.hull = 0; });
$('dBtn').addEventListener('click', () => { if (state !== 'dead') return; $('deathModal').style.display = 'none'; endDive(); tab = 'dive'; openStation(); });

// ============ Eingabe ============
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && state === 'dive') e.preventDefault();
  if (state === 'station' && e.code === 'Enter' && document.activeElement === document.body) { startDive(); return; }
  if (state !== 'dive') return;
  if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) { paused ? resume() : pause(); return; }
  if (paused) return;
  keys[e.code] = true;
  if (e.repeat) return;
  if (e.code === 'KeyQ' || e.code === 'KeyE') mouseAim = false;
  if (sub.grabbedBy && (e.code === 'Space' || e.code === 'KeyF')) { sub.mash++; shake(0.1); tone(200 + sub.mash * 30, 0.06, 'square', 0.04); }
  if (e.code === 'KeyR') sonarPing();
  if (e.code === 'KeyG') fireHarpoon();
  if (e.code === 'KeyX') dropBomb();
  if (e.code === 'KeyT') useBuoy();
  if (e.code === 'KeyH') { const h = document.body.classList.toggle('hideHint'); save.hints.helpBar = h ? 0 : 1; }
  if (e.code === 'KeyL') { sub.light = !sub.light; tone(sub.light ? 900 : 500, 0.06, 'square', 0.04); }
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseMine = false; pause(); });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousemove', e => { mouseX = e.clientX / innerWidth; mouseY = e.clientY / innerHeight; mouseAim = true; });
canvas.addEventListener('mousedown', e => {
  if (state !== 'dive' || paused || isTouch) return;
  if (e.button === 0) { mouseMine = true; if (sub.grabbedBy) { sub.mash++; shake(0.1); } }
  if (e.button === 2) fireHarpoon();
});
addEventListener('mouseup', e => { if (e.button === 0) mouseMine = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); persist(); } });
addEventListener('pagehide', persist);
document.querySelectorAll('button').forEach(b => b.addEventListener('click', () => b.blur()));

let isTouch = false;
function setTouch() { if (!isTouch) { isTouch = true; document.body.classList.add('touch'); } }
addEventListener('touchstart', setTouch, { passive: true, once: true });
const stick = $('stick'), knob = $('knob'); let stickId = null;
function stickMove(e) {
  const r = stick.getBoundingClientRect(), R = r.width / 2;
  let x = (e.clientX - r.left - R) / R, y = (e.clientY - r.top - R) / R; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  touch.x = Math.abs(x) < 0.12 ? 0 : x; touch.y = Math.abs(y) < 0.12 ? 0 : y; knob.style.transform = `translate(${x * R * 0.6}px, ${y * R * 0.6}px)`;
}
stick.addEventListener('pointerdown', e => { e.preventDefault(); if (stickId !== null) return; stickId = e.pointerId; stick.setPointerCapture(e.pointerId); stickMove(e); });
stick.addEventListener('pointermove', e => { if (e.pointerId === stickId) stickMove(e); });
const stickEnd = e => { if (e.pointerId !== stickId) return; stickId = null; touch.x = touch.y = 0; knob.style.transform = ''; };
stick.addEventListener('pointerup', stickEnd); stick.addEventListener('pointercancel', stickEnd);
function holdBtn(el, set, tap) {
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); if (set) set(true); if (tap) tap(); el.classList.add('on'); });
  const offF = () => { if (set) set(false); el.classList.remove('on'); };
  el.addEventListener('pointerup', offF); el.addEventListener('pointercancel', offF);
}
holdBtn($('tUp'), v => { touch.up = v; }, () => { if (sub.grabbedBy) sub.mash++; });
holdBtn($('tDown'), v => { touch.down = v; });
holdBtn($('tMine'), v => { touch.mine = v; }, () => { if (sub.grabbedBy) { sub.mash++; shake(0.1); } });
holdBtn($('tBoost'), v => { touch.boost = v; });
holdBtn($('tHarp'), null, fireHarpoon);
holdBtn($('tSonar'), null, sonarPing);
holdBtn($('tBuoy'), null, useBuoy);
holdBtn($('tBomb'), null, dropBomb);
$('pauseBtn').addEventListener('click', () => { if (state === 'dive') paused ? resume() : pause(); });
const soundLabel = () => { $('soundBtn').textContent = muted() ? '🔇' : '🔊'; };
$('soundBtn').addEventListener('click', () => { if (AC) AC.toggleMute(); soundLabel(); });
soundLabel();

// ============ Erz-Rendering ============
function updateOres(dt) {
  const cnt = { vein: 0, crystal: 0, nodule: 0, pearl: 0 };
  forNodes(n => {
    const o = ORES[n.type], im = oreIM[o.shape], i = cnt[o.shape];
    if (i >= 500) return;
    n.wob = Math.max(0, n.wob - dt * 3);
    const s = n.sc * (0.55 + 0.45 * n.units / n.max) * (1 + Math.sin(clock * 40) * 0.05 * n.wob);
    _p.copy(n.pos); if (n.wob > 0) _p.add(_v.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(0.05 * n.wob));
    im.setMatrixAt(i, _m4.compose(_p, n.q, _s.set(s, s, s)));
    _col.setHex(o.col); if (n.jack) _col.multiplyScalar(1.3 + Math.sin(clock * 5) * 0.4);
    im.setColorAt(i, _col); cnt[o.shape]++;
    if (n.jack && Math.random() < 0.15) emit(_p.copy(n.pos).addScaledVector(n.n, 0.8).add(_v.set(rnd(-0.6, 0.6), rnd(-0.6, 0.6), rnd(-0.6, 0.6))), _v.set(0, 0.6, 0), 1, 0.35, 0xfff0a0, 0, 0.5);
  });
  for (const k in oreIM) { const im = oreIM[k]; im.count = cnt[k]; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  // Schlotfahnen
  for (const ch of chunks.values()) for (const v of ch.vents) if (v.p.distanceToSquared(sub.pos) < 3600 && Math.random() < 0.7) {
    emit(v.top, _v.set(rnd(-0.4, 0.4), rnd(4, 6), rnd(-0.4, 0.4)), 2.6, rnd(0.4, 0.9), Math.random() < 0.3 ? 0xff7a2a : 0x40201a, 0.5, 0.4);
  }
  // Luftblasen-Ringe & Wrack-Glitzern
  for (const ch of chunks.values()) if (ch.wreck && !ch.wreck.looted && Math.random() < 0.2) emit(_p.copy(ch.wreck.p).add(_v.set(rnd(-2, 2), rnd(0, 2), rnd(-2, 2))), _v.set(0, 0.5, 0), 1.2, 0.4, 0xffd34a, 0, 0.5);
}

// ============ Hauptschleife ============
let last = performance.now(), statT = 0, fpsAvg = 60;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); fpsAvg = lerp(fpsAvg, 1 / Math.max(0.001, (now - last) / 1000), 0.05); last = now;
  if (paused) { renderer.render(scene, camera); return; }
  clock += dt; TIME.value = clock;
  if (state === 'dive') {
    diveT += dt; save.stats.playTime += dt;
    // Zielen: Maus (Bildschirmposition) oder Q/E
    if (mouseAim && !isTouch) { sub.aimYaw = lerp(sub.aimYaw, -(mouseX - 0.5) * 1.4, 1 - Math.exp(-dt * 10)); sub.aimPitch = lerp(sub.aimPitch, clamp(-(mouseY - 0.5) * 1.8 - 0.1, -1, 0.6), 1 - Math.exp(-dt * 10)); }
    else { if (keys.KeyQ) sub.aimPitch = Math.min(0.6, sub.aimPitch + dt * 1.2); if (keys.KeyE) sub.aimPitch = Math.max(-1, sub.aimPitch - dt * 1.2); if (isTouch) sub.aimPitch = lerp(sub.aimPitch, -0.15 - clamp(-sub.vel.y / 8, 0, 1) * 0.4, dt * 2); }
    if (buoyT > 0) {
      buoyT -= dt; sub.pos.y += 40 * dt; subG.position.copy(sub.pos); emit(sub.pos, _v.set(rnd(-1, 1), -3, rnd(-1, 1)), 1, 0.4, 0x9fdfff, 0, 1);
      updateAimDir(); updateChunks(); updateCamera(dt);
      if (buoyT <= 0 || sub.pos.y > -1) { buoyT = 0; surface(true); }
    } else {
      const I = inp();
      updateSub(dt); updateChunks(); updateResources(dt); updateMining(dt, I.mine); updateItems(dt);
      updateMobs(dt); updateSchools(dt); updateDrones(dt); updateShots(dt); updateEvents(dt); updatePing(dt);
      updateOres(dt); updateCamera(dt);
      if (state === 'dive') updateHud();
      drawRadar();
      if ((statT += dt) > 2) { statT = 0; checkAch(); }
      if (sub.hull <= 0) die();
      else if (wentDown && sub.pos.y > -1.3) surface(false);
    }
  } else if (state === 'dead') {
    updateMobs(dt); updateCamera(dt); deadT -= dt;
    if (deadT <= 0 && $('deathModal').style.display !== 'flex') $('deathModal').style.display = 'flex';
  } else {
    // Station: Kamera kreist langsam über dem Wasser
    const a = clock * 0.05;
    camera.position.set(Math.cos(a) * 30, 10 + Math.sin(clock * 0.2), Math.sin(a) * 30); camera.lookAt(0, 1.5, 0);
    subG.position.y = -0.25 + Math.sin(clock * 1.2) * 0.08; subG.rotation.z = Math.sin(clock * 0.9) * 0.04;
    if (SP.prop) SP.prop.rotation.z += dt * 0.5;
  }
  if (flashT > 0) { flashT = Math.max(0, flashT - dt * 1.4); $('flash').style.opacity = flashT; }
  fxc.style.opacity = state === 'dive' || state === 'dead' ? crackLvl.toFixed(2) : 0;
  if (msgT > 0 && (msgT -= dt) <= 0) $('msg').classList.remove('show');
  if (bannerT > 0 && (bannerT -= dt) <= 0) $('banner').classList.remove('show');
  updateParticles(dt); updateEnv(dt); audioFrame();
  renderer.render(scene, camera);
}

// ============ Debug-Hook (nur mit ?debug) ============
if (DEBUG) window.TR = {
  give(n) { save.money += n; persist(); if (state === 'station') renderStation(); },
  depth(m) { sub.pos.y = -m / DS; const c = center(sub.pos.y); sub.pos.x = c.x; sub.pos.z = c.z; sub.vel.set(0, 0, 0); diveMax = Math.max(diveMax, m - 1); updateChunks(true); camPos.copy(sub.pos).add(_v.set(0, 3, -8)); },
  get state() { return state; }, get fps() { return fpsAvg; }, get info() { return Object.assign({}, renderer.info.render, { geos: renderer.info.memory.geometries, progs: renderer.info.programs.length, parts: parts.length, mobs: mobs.length }); }, get save() { return save; }, get sub() { return sub; }, get S() { return S; }, get mobs() { return mobs; }, chunks, get wreckChunks() { return wreckChunk; }, center: y => Object.assign({}, center(y)),
  nearestNode() { let b = null, bd = 1e9; forNodes(n => { const d = n.pos.distanceTo(sub.pos); if (d < bd && ORES[n.type].tier <= S.drillTier) { bd = d; b = n; } }); return b; },
  faceNode(n) { sub.pos.copy(n.pos).addScaledVector(n.n, 3.5); sub.vel.set(0, 0, 0); sub.yaw = Math.atan2(n.pos.x - sub.pos.x, n.pos.z - sub.pos.z); sub.aimYaw = 0; sub.aimPitch = Math.atan2(n.pos.y - sub.pos.y, Math.hypot(n.pos.x - sub.pos.x, n.pos.z - sub.pos.z)); mouseAim = false; updateAimDir(); },
  key(code, down) { keys[code] = down; }, mine(v) { mouseMine = v; }, surface() { surface(false); }, kill() { sub.hull = 0; }, ping: sonarPing, harpoon: fireHarpoon, startDive,
};

fitCamera(); addEventListener('resize', fitCamera);
ensureContracts(); openStation();
requestAnimationFrame(frame);
})();
