// Wettermacher 3D – Darstellung: Szene, Insel, Meer, Himmel, Wolken, Partikel, Modelle
(() => {
'use strict';
const WM = window.WM = window.WM || {};
const D = window.WM_DATA, DATA = window.WETTERMACHER_MODELS;
const V3 = THREE.Vector3, clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const touch = matchMedia('(pointer: coarse)').matches;

// ============ Renderer & Kamera ============
const renderer = new THREE.WebGLRenderer({ antialias: !touch, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, touch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);
document.getElementById('view').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfe8f7, 90, 190);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.3, 400);
const cam = { yaw: -0.6, pitch: 0.78, dist: 52, ty: 1.5, tyaw: -0.6, tpitch: 0.78, tdist: 52, shake: 0, tx: 0, tz: 0 };
function fit() { camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 0.8 ? 58 : 42; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }
addEventListener('resize', fit); fit();
function updateCamera(dt) {
  const k = 1 - Math.exp(-dt * 8);
  cam.yaw += (cam.tyaw - cam.yaw) * k; cam.pitch += (cam.tpitch - cam.pitch) * k; cam.dist += (cam.tdist - cam.dist) * k;
  const cp = Math.cos(cam.pitch);
  camera.position.set(cam.tx + Math.sin(cam.yaw) * cp * cam.dist, cam.ty + Math.sin(cam.pitch) * cam.dist, cam.tz + Math.cos(cam.yaw) * cp * cam.dist);
  if (cam.shake > 0) { cam.shake = Math.max(0, cam.shake - dt * 2); camera.position.x += (Math.random() - 0.5) * cam.shake; camera.position.y += (Math.random() - 0.5) * cam.shake; }
  camera.lookAt(cam.tx, cam.ty, cam.tz);
}

// ============ Licht ============
const hemi = new THREE.HemisphereLight(0xeaf6ff, 0x6a7a4a, 0.56);
const sun = new THREE.DirectionalLight(0xfff1d6, 0.85);
sun.castShadow = true; sun.shadow.mapSize.set(touch ? 1024 : 2048, touch ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 10, far: 120 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
const flashLight = new THREE.PointLight(0xcfe0ff, 0, 60, 1.6);
scene.add(hemi, sun, sun.target, flashLight);

// ============ Modelle ============
const GEO = {};
DATA.objects.forEach(o => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(o.v, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(o.c.map(x => x / 255), 3));
  g.setIndex(o.f); g.computeVertexNormals(); g.computeBoundingSphere();
  GEO[o.n] = { geo: g, p: o.p, t: o.t };
});
const SOLID = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 8, specular: 0x111111 });
const GLOW = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0x8c8c8c });
const mesh = (n, mat = SOLID, shadow = true) => { const m = new THREE.Mesh(GEO[n].geo, mat); m.castShadow = shadow; m.receiveShadow = true; return m; };
// Objekt mit Glüh-Teil & Kindern (Pivot aus t)
function model(n) {
  const g = new THREE.Group(); g.add(mesh(n));
  if (GEO[n + '__glow']) g.add(mesh(n + '__glow', GLOW, false));
  g.userData.parts = {};
  for (const k in GEO) if (GEO[k].p === n && !k.endsWith('__glow')) {
    const c = model(k); c.position.fromArray(GEO[k].t); g.add(c); g.userData.parts[k] = c;
  }
  return g;
}

// ============ Höhenfeld (aus Inselmesh gerastert) ============
const HN = 96, HS = 19, HC = (2 * HS) / (HN - 1);
const hgrid = new Float32Array(HN * HN);
function rasterHeights(geo) {
  hgrid.fill(-6.2);
  const p = geo.attributes.position.array, idx = geo.index.array;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ax = p[a], ay = p[a + 1], az = p[a + 2], bx = p[b], by = p[b + 1], bz = p[b + 2], cx = p[c], cy = p[c + 1], cz = p[c + 2];
    const den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(den) < 1e-9) continue;
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) + HS) / HC)), i1 = Math.min(HN - 1, Math.ceil((Math.max(ax, bx, cx) + HS) / HC));
    const j0 = Math.max(0, Math.floor((Math.min(az, bz, cz) + HS) / HC)), j1 = Math.min(HN - 1, Math.ceil((Math.max(az, bz, cz) + HS) / HC));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = -HS + i * HC, z = -HS + j * HC;
      const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / den, l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / den, l3 = 1 - l1 - l2;
      if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) continue;
      const y = l1 * ay + l2 * by + l3 * cy, k = j * HN + i;
      if (y > hgrid[k]) hgrid[k] = y;
    }
  }
}
function H(x, z) {
  const fx = (x + HS) / HC, fz = (z + HS) / HC;
  if (fx < 0 || fz < 0 || fx >= HN - 1 || fz >= HN - 1) return -6.2;
  const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * HN + i;
  return lerp(lerp(hgrid[k], hgrid[k + 1], u), lerp(hgrid[k + HN], hgrid[k + HN + 1], u), v);
}
const isLand = (x, z) => H(x, z) > 0.25;
function slope(x, z, r) { let mn = 99, mx = -99; for (let a = 0; a < 6.28; a += 0.785) { const h = H(x + Math.cos(a) * r, z + Math.sin(a) * r); mn = Math.min(mn, h); mx = Math.max(mx, h); } return Math.max(mx - mn, Math.abs(H(x, z) - (mx + mn) / 2)); }

// ============ Diorama: Meer, Wassersäule, Boden ============
const SEA_R = 58;
const seaU = { uTime: { value: 0 }, uWave: { value: 1 } };
function buildSea() {
  const pos = [], col = [], idx = [], RN = 46, SN = 120;
  const ringR = i => SEA_R * Math.pow(i / RN, 1.15);
  pos.push(0, 0, 0); col.push(0, 0, 0);
  for (let i = 1; i <= RN; i++) for (let j = 0; j < SN; j++) {
    const a = (j + (i % 2) * 0.5) / SN * Math.PI * 2, r = ringR(i) + (i < RN ? (Math.sin(j * 7.1 + i * 3.3) * 0.25) : 0);
    pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); col.push(0, 0, 0);
  }
  for (let j = 0; j < SN; j++) idx.push(0, 1 + (j + 1) % SN, 1 + j);
  for (let i = 1; i < RN; i++) for (let j = 0; j < SN; j++) {
    const a = 1 + (i - 1) * SN + j, b = 1 + (i - 1) * SN + (j + 1) % SN, c = 1 + i * SN + j, d = 1 + i * SN + (j + 1) % SN;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  return g;
}
const seaGeo = buildSea();
const seaMat = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, transparent: true, opacity: 0.9, shininess: 35, specular: 0x2a3a48 });
seaMat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, seaU);
  sh.vertexShader = 'uniform float uTime; uniform float uWave;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float rr = length(position.xz);
    float edge = smoothstep(${SEA_R.toFixed(1)}, ${(SEA_R - 4).toFixed(1)}, rr);
    transformed.y += edge * uWave * (sin(position.x * 0.42 + uTime * 1.3) * 0.11 + cos(position.z * 0.37 + uTime * 1.05) * 0.1 + sin((position.x + position.z) * 0.9 + uTime * 2.1) * 0.04);`);
};
const sea = new THREE.Mesh(seaGeo, seaMat); sea.receiveShadow = true; sea.renderOrder = 2; scene.add(sea);
const SHALLOW = new THREE.Color('#4cc6c4'), DEEP = new THREE.Color('#17568c'), FOAM = new THREE.Color('#dff7f7');
function colorSea(tint) {
  const p = seaGeo.attributes.position, c = seaGeo.attributes.color, col = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), fh = H(x, z);
    col.copy(DEEP).lerp(SHALLOW, sstep(-5.8, -1.2, fh));
    if (fh > -0.45) col.lerp(FOAM, 0.4);
    if (tint) col.multiply(tint);
    c.setXYZ(i, col.r, col.g, col.b);
  }
  c.needsUpdate = true;
}
// Wassersäule (Diorama-Schnitt) + Felsboden
{
  const side = new THREE.CylinderGeometry(SEA_R, SEA_R, 7, 120, 1, true), cc = [];
  const p = side.attributes.position;
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + 3.5) / 7; const c = new THREE.Color('#0d3a66').lerp(new THREE.Color('#3aa0c8'), t); cc.push(c.r, c.g, c.b); }
  side.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
  const sm = new THREE.Mesh(side, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.72, side: THREE.FrontSide, depthWrite: false }));
  sm.position.y = -3.5; scene.add(sm);
  const rock = new THREE.CylinderGeometry(SEA_R + 0.2, SEA_R - 8, 6, 60, 3, false), rp = rock.attributes.position, rc = [];
  for (let i = 0; i < rp.count; i++) {
    const y = rp.getY(i), x = rp.getX(i), z = rp.getZ(i);
    if (y < 2.9 && y > -2.9) { const k = 1 + Math.sin(x * 1.3 + y * 2) * 0.02 + Math.cos(z * 1.1) * 0.02; rp.setX(i, x * k); rp.setZ(i, z * k); }
    if (y < -2.9) rp.setY(i, y - 2 + Math.sin(x * 0.4) * Math.cos(z * 0.4) * 1.2);
    const c = new THREE.Color('#5a4a3e').lerp(new THREE.Color('#8a7660'), clamp((y + 3) / 6, 0, 1) * (0.7 + 0.3 * Math.sin(y * 5)));
    rc.push(c.r, c.g, c.b);
  }
  rock.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3)); rock.computeVertexNormals();
  const rm = new THREE.Mesh(rock, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 4 }));
  rm.position.y = -10.1; scene.add(rm);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(SEA_R, 60), new THREE.MeshLambertMaterial({ color: 0x2f6a80 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -6.4; floor.receiveShadow = true; scene.add(floor);
}

// ============ Insel ============
let island = null, islBase = null, islGreen = null;
const islandGroup = new THREE.Group(); scene.add(islandGroup);
function loadIsland(def) {
  if (island) { islandGroup.remove(island); island.geometry.dispose(); }
  const src = GEO[def.model].geo.clone();
  if (def.rot) { src.rotateY(def.rot); }
  const c = src.attributes.color, n = c.count;
  // Grasfarben je Insel einfärben
  islGreen = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let r = c.getX(i), g = c.getY(i), b = c.getZ(i);
    const green = g > r * 1.08 && g > b * 1.15 ? 1 : 0; islGreen[i] = green;
    if (green && def.grass) {
      const L = clamp((g - 0.08) / 0.5, 0, 1), A = def.grass[0], B = def.grass[1];
      r = lerp(B[0], A[0], L); g = lerp(B[1], A[1], L); b = lerp(B[2], A[2], L);
      c.setXYZ(i, r, g, b);
    }
  }
  islBase = Float32Array.from(c.array);
  src.computeVertexNormals();
  island = new THREE.Mesh(src, SOLID.clone()); island.material.vertexColors = true;
  island.receiveShadow = true; island.castShadow = true; islandGroup.add(island);
  rasterHeights(src);
  colorSea(def.desert ? new THREE.Color(1.05, 1.0, 0.9) : def.polar ? new THREE.Color(0.85, 0.95, 1.05) : def.stormy ? new THREE.Color(0.75, 0.82, 0.85) : null);
  const vgeo = GEO[def.model + '__glow'];
  if (vgeo) { const lava = new THREE.Mesh(vgeo.geo.clone(), GLOW); if (def.rot) lava.geometry.rotateY(def.rot); lava.material = new THREE.MeshBasicMaterial({ vertexColors: true }); island.add(lava); }
}
// Bodenfarbe: Nässe/Schnee/Jahreszeit (wetF, snowF: (x,z)->0..1)
const _ct = new THREE.Color();
function tintIsland(wetF, snowF, seasonTint, scorch) {
  if (!island) return;
  const p = island.geometry.attributes.position, c = island.geometry.attributes.color, nrm = island.geometry.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i); let r = islBase[i * 3], g = islBase[i * 3 + 1], b = islBase[i * 3 + 2];
    if (y > 0.05) {
      const x = p.getX(i), z = p.getZ(i);
      if (islGreen[i]) { r *= seasonTint[0]; g *= seasonTint[1]; b *= seasonTint[2]; }
      const w = wetF(x, z);
      if (w > 0.6) { const k = 1 - 0.38 * clamp((w - 0.6) / 0.6, 0, 1); r *= k; g *= k; b *= k * 1.08; }
      else if (w < 0.25 && islGreen[i]) { const k = (0.25 - w) * 2.2; r = lerp(r, 0.42, k * 0.5); g = lerp(g, 0.33, k * 0.5); b = lerp(b, 0.12, k * 0.5); }
      const s = scorch ? scorch(x, z) : 0; if (s > 0) { r *= 1 - s * 0.8; g *= 1 - s * 0.85; b *= 1 - s * 0.85; }
      const sn = snowF(x, z) * clamp(nrm.getY(i) * 1.4 - 0.1, 0, 1);
      if (sn > 0) { r = lerp(r, 0.92, sn); g = lerp(g, 0.95, sn); b = lerp(b, 1.0, sn); }
    }
    c.setXYZ(i, r, g, b);
  }
  c.needsUpdate = true;
}

// ============ Instanz-Helfer ============
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3(), _p = new V3(), _c = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function IM(geo, mat, n, shadow = true) {
  // eigenes Material je InstancedMesh: r128 verwechselt sonst Programme mit/ohne instanceColor
  const im = new THREE.InstancedMesh(geo, mat === SOLID ? SOLID.clone() : mat, n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.castShadow = shadow; im.receiveShadow = true; im.count = 0; im.frustumCulled = false; scene.add(im); return im;
}
// r128 legt instanceColor mit Länge = aktuellem count an → vorher auf Kapazität setzen
function withColors(im) { im.count = im.instanceMatrix.count; im.setColorAt(0, new THREE.Color(1, 1, 1)); im.count = 0; return im; }

// Bäume: je Art Stamm + Krone
const TREE_KINDS = ['oak', 'poplar', 'pine', 'palm', 'bush', 'cactus'];
const trees = {};
TREE_KINDS.forEach(k => {
  const leaves = GEO[k + '_leaves'] ? withColors(IM(GEO[k + '_leaves'].geo, SOLID, 220)) : null;
  trees[k] = { trunk: IM(GEO[k].geo, SOLID, 220), leaves };
  if (!leaves) withColors(trees[k].trunk);
});
// Feldpflanzen 4 Stufen
const crops = [0, 1, 2, 3].map(i => withColors(IM(GEO['crop' + i].geo, SOLID, 640, false)));
// Dorfbewohner
const VPARTS = ['vil_body', 'vil_head', 'vil_armL', 'vil_armR', 'vil_legL', 'vil_legR'];
const vil = VPARTS.map(n => withColors(IM(GEO[n].geo, SOLID, 160)));
const VPIV = VPARTS.map(n => new V3().fromArray(GEO[n].t || [0, 0, 0]));
const locustIM = IM(GEO.locust.geo, SOLID, 260, false);
// Wolken-Puffs
// Wolken weich schattiert (nicht facettiert), leicht selbstleuchtend gegen graue Schattenseiten
const puffGeo = new THREE.IcosahedronGeometry(1, 2);
const puffMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x2c3440, transparent: true, opacity: 0.96 });
const puffs = withColors(IM(puffGeo, puffMat, 260)); puffs.receiveShadow = false;
// Nebel
const fogIM = withColors(IM(puffGeo, new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.38, depthWrite: false }), 160, false));
// Feuer & Rauch
const flameIM = withColors(IM(new THREE.ConeGeometry(0.28, 0.9, 5).translate(0, 0.45, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), 120, false));
const smokeIM = withColors(IM(puffGeo, new THREE.MeshLambertMaterial({ color: 0x555555, transparent: true, opacity: 0.5, depthWrite: false }), 120, false));
// Pfützen
const puddleIM = IM(new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x6fb6d8, transparent: true, opacity: 0.7, shininess: 90, depthWrite: false }), 60, false);
puddleIM.receiveShadow = false;
// Staub/Konfetti
const dustIM = withColors(IM(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }), 200, false));

// ============ Partikel: Regen, Schnee, Dampf, Windstreifen ============
const RAIN_N = 2200, rainPos = new Float32Array(RAIN_N * 6), rainCol = new Float32Array(RAIN_N * 6);
const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3)); rainGeo.setAttribute('color', new THREE.BufferAttribute(rainCol, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 })); rain.frustumCulled = false; scene.add(rain);
const drops = []; for (let i = 0; i < RAIN_N; i++) drops.push({ x: 0, y: -99, z: 0, vy: 0, src: null, alive: false });
const SNOW_N = 1200, snowPos = new Float32Array(SNOW_N * 3), snowCol = new Float32Array(SNOW_N * 3);
const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3)); snowGeo.setAttribute('color', new THREE.BufferAttribute(snowCol, 3));
const flakeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ size: 0.32, map: flakeTex, vertexColors: true, transparent: true, depthWrite: false })); snow.frustumCulled = false; scene.add(snow);
const flakes = []; for (let i = 0; i < SNOW_N; i++) flakes.push({ x: 0, y: -99, z: 0, vy: 0, ph: Math.random() * 6, alive: false, hail: false });
const VAP_N = 400, vapPos = new Float32Array(VAP_N * 3), vapCol = new Float32Array(VAP_N * 3);
const vapGeo = new THREE.BufferGeometry(); vapGeo.setAttribute('position', new THREE.BufferAttribute(vapPos, 3)); vapGeo.setAttribute('color', new THREE.BufferAttribute(vapCol, 3));
const vapor = new THREE.Points(vapGeo, new THREE.PointsMaterial({ size: 0.55, map: flakeTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); vapor.frustumCulled = false; scene.add(vapor);
const vaps = []; for (let i = 0; i < VAP_N; i++) vaps.push({ alive: false, x: 0, y: 0, z: 0, tx: 0, tz: 0, t: 0 });
const WS_N = 140, wsPos = new Float32Array(WS_N * 6), wsCol = new Float32Array(WS_N * 6);
const wsGeo = new THREE.BufferGeometry(); wsGeo.setAttribute('position', new THREE.BufferAttribute(wsPos, 3)); wsGeo.setAttribute('color', new THREE.BufferAttribute(wsCol, 3));
const streaks = new THREE.LineSegments(wsGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); streaks.frustumCulled = false; scene.add(streaks);
const wss = []; for (let i = 0; i < WS_N; i++) wss.push({ alive: false, x: 0, y: 0, z: 0, dx: 0, dz: 0, t: 0, life: 1 });
// Sterne & Polarlicht
const starGeo = new THREE.BufferGeometry(), sp = [];
for (let i = 0; i < 500; i++) { const a = Math.random() * 6.28, e = 0.15 + Math.random() * 1.3, r = 180; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.1, color: 0xffffff, transparent: true, opacity: 0, fog: false, sizeAttenuation: false, depthWrite: false })); scene.add(stars);
const aurora = (() => {
  const g = new THREE.PlaneGeometry(120, 24, 40, 1), c = [], p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const t = p.getY(i) > 0 ? 0 : 1; const col = new THREE.Color().setHSL(0.38 + 0.12 * Math.sin(p.getX(i) * 0.05), 0.9, 0.55 * t); c.push(col.r, col.g, col.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, fog: false }));
  m.position.set(0, 42, -70); m.rotation.x = 0.35; scene.add(m); m.userData.base = Float32Array.from(p.array); return m;
})();

// ============ Effekte: Sonnenstrahl, Regenbogen, Blitze, Tornado, Ring ============
const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.6, 1, 16, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
beam.visible = false; scene.add(beam);
const beamDisc = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffe680, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
scene.add(beamDisc);
const rainbow = (() => {
  const g = new THREE.RingGeometry(12.5, 16.5, 64, 7, 0, Math.PI), c = [], p = g.attributes.position;
  const cols = ['#ff4d4d', '#ff9a3d', '#ffe14d', '#5fd35f', '#4da6ff', '#6a5cff', '#b45cff'].map(h => new THREE.Color(h));
  for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)); const k = clamp((16.5 - r) / 4 * 6.999, 0, 6.999); const a = cols[k | 0], b = cols[Math.min(6, (k | 0) + 1)]; const col = a.clone().lerp(b, k % 1); c.push(col.r, col.g, col.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, fog: false }));
  m.visible = false; scene.add(m); return m;
})();
const boltMat = new THREE.MeshBasicMaterial({ color: 0xeef4ff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
const bolts = [];
function bolt(from, to, branches = 3) {
  const segs = [], mk = (a, b, w, depth) => {
    const n = 9, pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, p = a.clone().lerp(b, t); if (i > 0 && i < n) { const j = a.distanceTo(b) * 0.07; p.x += (Math.random() - 0.5) * j; p.z += (Math.random() - 0.5) * j; p.y += (Math.random() - 0.5) * j * 0.4; } pts.push(p); }
    segs.push([pts, w]);
    if (depth > 0) for (let k = 0; k < branches; k++) { const s = pts[2 + (Math.random() * 5 | 0)]; mk(s, s.clone().add(new V3((Math.random() - 0.5) * 5, -2 - Math.random() * 3, (Math.random() - 0.5) * 5)), w * 0.5, depth - 1); }
  };
  mk(from, to, 0.22, 1);
  const pos = [], view = new V3().subVectors(camera.position, to).normalize();
  for (const [pts, w] of segs) for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], d = new V3().subVectors(b, a), side = new V3().crossVectors(d, view).normalize().multiplyScalar(w);
    pos.push(a.x - side.x, a.y - side.y, a.z - side.z, a.x + side.x, a.y + side.y, a.z + side.z, b.x + side.x, b.y + side.y, b.z + side.z,
      a.x - side.x, a.y - side.y, a.z - side.z, b.x + side.x, b.y + side.y, b.z + side.z, b.x - side.x, b.y - side.y, b.z - side.z);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Mesh(g, boltMat.clone()); m.frustumCulled = false; scene.add(m); bolts.push({ m, t: 0 });
  flashLight.position.copy(to).y += 3; flashLight.intensity = 6;
}
const tornado = (() => {
  const prof = []; for (let i = 0; i <= 10; i++) { const t = i / 10; prof.push(new THREE.Vector2(0.25 + 2.6 * t * t + 0.2 * Math.sin(t * 9), t * 10)); }
  const g = new THREE.LatheGeometry(prof, 14);
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x8d97a3, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
  m.visible = false; scene.add(m); return m;
})();
const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }));
ring.visible = false; ring.renderOrder = 5; scene.add(ring);
const lightBeam = new THREE.Mesh(new THREE.ConeGeometry(2.2, 22, 12, 1, true).translate(0, -11, 0).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
scene.add(lightBeam);
// Boss-Augen
const bossEyes = (() => {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: 0xff3355, fog: false });
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), m); e.position.x = s * 1.2; e.scale.y = 0.6; g.add(e); }
  g.visible = false; scene.add(g); return g;
})();

// ============ Himmel & Tageszeit ============
const skyEl = document.getElementById('sky');
const C = (h) => new THREE.Color(h);
const SKY = { dayTop: C('#6fb9ea'), dayBot: C('#d8efff'), duskTop: C('#5b6fb0'), duskBot: C('#ffb27a'), nightTop: C('#101c42'), nightBot: C('#33507f'), stormTop: C('#4b5563'), stormBot: C('#9aa5b1') };
let glowK = 0, nightK = 0;
function setSky(dayFrac, def, storm, seasonIdx) {
  // dayFrac 0..1: 0.25 Sonnenaufgang, 0.5 Mittag, 0.75 Untergang
  const ang = (dayFrac - 0.25) * Math.PI * 2, el = Math.sin(ang);
  const day = sstep(-0.12, 0.25, el), dusk = clamp(1 - Math.abs(el) * 3.2, 0, 1) * 0.9;
  nightK = 1 - day; glowK = sstep(0.15, -0.15, el);
  const top = SKY.nightTop.clone().lerp(SKY.dayTop, day), bot = SKY.nightBot.clone().lerp(SKY.dayBot, day);
  if (def && def.sky && day > 0) { top.lerp(C(def.sky[0]), 0.45 * day); bot.lerp(C(def.sky[1]), 0.45 * day); }
  top.lerp(SKY.duskTop, dusk * 0.5); bot.lerp(SKY.duskBot, dusk);
  top.lerp(SKY.stormTop, storm * 0.7 * (0.4 + 0.6 * day)); bot.lerp(SKY.stormBot, storm * 0.7 * (0.4 + 0.6 * day));
  if (seasonIdx === 3) { top.lerp(C('#9db4cc'), 0.25 * day); bot.lerp(C('#eef3f8'), 0.25 * day); }
  skyEl.style.background = `linear-gradient(180deg, #${top.getHexString()} 0%, #${bot.getHexString()} 70%, #${bot.clone().lerp(top, 0.25).getHexString()} 100%)`;
  scene.fog.color.copy(bot);
  const sa = ang < 0 ? ang + Math.PI : ang; // Mond nachts über gleichen Bogen
  sun.position.set(Math.cos(sa) * 50, 12 + Math.abs(Math.sin(sa)) * 40, -22 + Math.sin(sa) * 8);
  sun.intensity = el > 0 ? lerp(0.35, 0.85, day) * (1 - storm * 0.55) : 0.42;
  sun.color.set(el > 0 ? 0xfff1d6 : 0x9fb4ff).lerp(C('#ffb070'), dusk * 0.6);
  hemi.intensity = lerp(0.5, 0.58, day) * (1 - storm * 0.25);
  hemi.color.set(0xeaf6ff).lerp(C('#8fa3e0'), nightK * 0.6);
  stars.material.opacity = nightK * (1 - storm) * 0.9;
  GLOW.color.setScalar(lerp(0.55, 1.6, glowK));
  return { day, night: nightK, el };
}

// ============ Projektion & Picking ============
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pointerRay(px, py) { ndc.set(px / innerWidth * 2 - 1, -(py / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.ray; }
function planeHit(r, y) { if (Math.abs(r.direction.y) < 1e-4) return null; const t = (y - r.origin.y) / r.direction.y; return t > 0 ? r.origin.clone().addScaledVector(r.direction, t) : null; }
function groundHit(r) {
  const p = r.origin.clone(), d = r.direction;
  let prevAbove = true;
  for (let t = 0; t < 220; t += 0.35) {
    p.copy(r.origin).addScaledVector(d, t);
    const h = Math.max(H(p.x, p.z), 0);
    if (p.y <= h) { for (let k = 0; k < 6; k++) { t -= 0.35 / (2 << k); p.copy(r.origin).addScaledVector(d, t); } p.y = Math.max(H(p.x, p.z), 0); return p; }
    if (p.y < -2) break;
  }
  return planeHit(r, 0);
}
const _pv = new V3();
function toScreen(x, y, z) { _pv.set(x, y, z).project(camera); return { x: (_pv.x + 1) / 2 * innerWidth, y: (1 - _pv.y) / 2 * innerHeight, vis: _pv.z < 1 }; }

WM.world = {
  renderer, scene, camera, cam, sun, GEO, SOLID, GLOW, model, mesh, H, isLand, slope, loadIsland, tintIsland, setSky, updateCamera,
  IM, ZERO, trees, crops, vil, VPIV, locustIM, puffs, fogIM, flameIM, smokeIM, puddleIM, dustIM,
  drops, rainGeo, rainPos, rainCol, flakes, snowGeo, snowPos, snowCol, vaps, vapGeo, vapPos, vapCol, wss, wsGeo, wsPos, wsCol,
  beam, beamDisc, rainbow, bolts, bolt, tornado, ring, lightBeam, bossEyes, aurora, flashLight, seaU, stars, hemi,
  pointerRay, planeHit, groundHit, toScreen, sstep, clamp, lerp, touch, get glowK() { return glowK; }, get nightK() { return nightK; },
};
})();
