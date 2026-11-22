// Wettermacher 3D – Eingabe, HUD, Menüs, Sprechblasen, Hinweise, Klang, Hauptschleife
(() => {
'use strict';
const WM = window.WM, D = window.WM_DATA, W = WM.world, GM = WM.game, G = GM.G, P = GM.P;
const AC = window.ArcadeCore || null;
const $ = id => document.getElementById(id);
const clamp = W.clamp;
const V3 = THREE.Vector3;

// =====================================================================
// Klang: Ambiente (Meer, Regen, Wind), Donner, Musik
// =====================================================================
const audio = (() => {
  let ctx = null, master = null, rainG, windG, seaG, windF, musicG, noiseBuf, ok = false, nextNote = 0, step = 0;
  function init() {
    if (ok || !AC) return; ctx = AC.getAudioContext(); if (!ctx) return; ok = true;
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); let b = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = 0.98 * b + 0.02 * w; d[i] = w * 0.5 + b * 2; }
    const loop = (type, f, q) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(master); s.start(); return [g, fl]; };
    [seaG] = loop('lowpass', 420, 0.5); [rainG] = loop('highpass', 1800, 0.4); [windG, windF] = loop('bandpass', 500, 1.2);
    musicG = ctx.createGain(); musicG.gain.value = 0.5; musicG.connect(master);
  }
  const SCALES = [[0, 2, 4, 7, 9, 12, 14], [0, 2, 4, 7, 9, 11, 14], [0, 3, 5, 7, 10, 12, 15], [0, 2, 3, 7, 8, 12, 14]];
  function note(freq, t, dur, vol, type = 'triangle') {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicG); o.start(t); o.stop(t + dur + 0.05);
  }
  function update(rain, wind, storm, season, night, paused) {
    if (!ok) return;
    const t = ctx.currentTime, muted = AC.isMuted();
    master.gain.setTargetAtTime(muted || paused ? 0 : 0.9, t, 0.2);
    seaG.gain.setTargetAtTime(0.05 + storm * 0.06, t, 0.5);
    rainG.gain.setTargetAtTime(Math.min(0.11, rain * 0.012), t, 0.3);
    windG.gain.setTargetAtTime(Math.min(0.12, 0.012 + wind * 0.03), t, 0.2); windF.frequency.setTargetAtTime(350 + wind * 220, t, 0.3);
    musicG.gain.setTargetAtTime(storm > 0.6 ? 0.18 : 0.45, t, 1);
    if (muted || paused) return;
    if (t > nextNote) {
      const sc = SCALES[season], base = [262, 294, 220, 196][season] * (night ? 0.5 : 1), beat = night ? 0.7 : 0.48;
      nextNote = Math.max(t, nextNote) + beat; step++;
      if (step % 8 === 0) { note(base / 2 * 2 ** (sc[0] / 12), t, 2.6, 0.05, 'sine'); note(base / 2 * 2 ** (sc[2] / 12), t, 2.6, 0.035, 'sine'); }
      if (Math.random() < (night ? 0.35 : 0.55)) note(base * 2 ** (sc[(Math.random() * sc.length) | 0] / 12), t + 0.02, 0.9, 0.035);
      if (!night && season < 2 && storm < 0.3 && Math.random() < 0.05) chirp();
    }
  }
  function chirp() { const t = ctx.currentTime; for (let i = 0; i < 3; i++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(2600 + Math.random() * 800, t + i * 0.09); o.frequency.exponentialRampToValueAtTime(1800, t + i * 0.09 + 0.07); g.gain.setValueAtTime(0.012, t + i * 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.08); o.connect(g); g.connect(master); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.1); } }
  function thunder(d, natural) {
    if (!ok || AC.isMuted()) return;
    const delay = clamp(d * 0.018, 0.08, 2.2), t = ctx.currentTime + delay;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(70, t + 2.2);
    const g = ctx.createGain(), v = clamp(1.4 - d * 0.012, 0.25, 1) * 0.6; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + 2.7);
    const c = ctx.createBufferSource(); c.buffer = noiseBuf; const cg = ctx.createGain(); cg.gain.setValueAtTime(0.25, ctx.currentTime); cg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12); c.connect(cg); cg.connect(master); c.start(); c.stop(ctx.currentTime + 0.15);
  }
  const blip = (fs, dur = 0.12, type = 'sine', vol = 0.06) => { if (!ok || AC.isMuted()) return; const t = ctx.currentTime; fs.forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t + i * dur); g.gain.exponentialRampToValueAtTime(0.0001, t + i * dur + dur * 1.8); o.connect(g); g.connect(master); o.start(t + i * dur); o.stop(t + i * dur + dur * 2); }); };
  return {
    init, update, thunder,
    chime: () => blip([880, 1320], 0.09, 'sine', 0.04), alarm: () => blip([440, 330, 440, 330], 0.13, 'square', 0.03),
    fanfare: () => blip([523, 659, 784, 1046], 0.13, 'triangle', 0.06), roar: () => blip([90, 70, 55], 0.18, 'sawtooth', 0.05),
    gulp: () => blip([300 + Math.random() * 200], 0.05, 'sine', 0.02),
  };
})();
WM.audio = audio;

// =====================================================================
// HUD-Aufbau
// =====================================================================
let power = 0, paused = false, modalOpen = null;
const pbar = $('powers');
D.POWERS.forEach((p, i) => {
  const b = document.createElement('button'); b.className = 'pw'; b.dataset.i = i;
  b.innerHTML = `<span class="pe">${p.e}</span><span class="pk">${p.key}</span><span class="pn">${p.n}</span>`;
  b.title = p.n + ' – ' + p.d;
  b.addEventListener('click', () => selectPower(i)); pbar.appendChild(b);
});
function selectPower(i) {
  const p = D.POWERS[i];
  if (!GM.powerUnlocked(p)) { toast('🔒 ' + p.n + ' lernst du im Himmelsbaum (' + D.SKILLS.find(s => s.id === p.skill).n + ').'); return; }
  power = i; refreshPowers(); $('pdesc').textContent = p.e + ' ' + p.n + ': ' + p.d; $('pdesc').classList.add('show');
  clearTimeout(selectPower.t); selectPower.t = setTimeout(() => $('pdesc').classList.remove('show'), 3500);
  audio.gulp();
}
function refreshPowers() { [...pbar.children].forEach((b, i) => { const p = D.POWERS[i]; b.classList.toggle('on', i === power); b.classList.toggle('locked', !GM.powerUnlocked(p)); }); }

function fmt(n) { return Math.floor(n).toLocaleString('de-DE'); }
let hudT = 0;
function updateHud(dt) {
  const I = GM.I, S = GM.S; if (!I) return;
  $('manaFill').style.width = (G.mana / GM.manaMax() * 100) + '%';
  $('manaTxt').textContent = Math.floor(G.mana) + ' / ' + GM.manaMax();
  hudT -= dt; if (hudT > 0) return; hudT = 0.2;
  const ss = D.SEASONS[I.season];
  $('hIsland').textContent = I.def.e + ' ' + I.def.n;
  $('hSeason').textContent = ss.e + ' ' + ss.n + ' · Jahr ' + (I.year + 1);
  $('hSeasonBar').style.width = (I.t / D.SEASON_LEN * 100) + '%';
  $('hDay').textContent = W.nightK > 0.6 ? '🌙' : '☀️';
  $('hPop').textContent = I.pop + ' / ' + GM.housing();
  $('hFood').textContent = fmt(I.food); $('hWater').textContent = fmt(I.water); $('hWood').textContent = fmt(I.wood);
  $('hFaith').textContent = fmt(S.faith);
  $('hHappy').textContent = Math.round(I.happy) + ' %';
  $('hHappyE').textContent = I.happy > 75 ? '😄' : I.happy > 50 ? '🙂' : I.happy > 30 ? '😐' : '😟';
  $('gFood').classList.toggle('warn', I.food < I.pop * 1.5); $('gWater').classList.toggle('warn', I.water < 8); $('gWood').classList.toggle('warn', G.cold || I.wood < 3);
  $('gHappy').classList.toggle('warn', I.happy < 35);
  $('skillBtn').classList.toggle('glow', D.SKILLS.some(s => GM.skillState(s) === 'buy'));
  $('mapBtn').classList.toggle('glow', S.unlocked.some(id => !S.islands[id]));
  // Ziel
  const g = I.def.goal, bs = g.b.map(t => (GM.has(t) ? '✅ ' : '⬜ ') + D.BUILD[t].n).join(' · ');
  $('hGoal').innerHTML = I.goal ? '🏆 Inselziel erreicht' : `🎯 ${Math.min(I.pop, g.pop)}/${g.pop} Bewohner · ${bs}${g.boss ? (I.flags.boss ? ' · ✅ Sturmgeist' : ' · ⬜ Sturmgeist') : ''}`;
  // Wünsche-Liste
  const list = $('reqs'); let html = '';
  for (const r of G.reqs) {
    const icon = { rain: '🌧️', sun: '☀️', wind: '💨', ship: '⛵', rainbow: '🌈', snow: '❄️', fest: '🎉', fire: '🔥', pirates: '🏴‍☠️', locusts: '🦗', serpent: '🐉', warm: '🔆' }[r.type] || '💬';
    const k = clamp(r.t / r.dur, 0, 1), pr = r.type === 'sun' ? r.prog / 8 : r.type === 'fest' ? r.prog / 15 : r.type === 'warm' ? r.prog / 5 : 0;
    html += `<div class="rq ${['fire', 'pirates', 'locusts', 'serpent'].includes(r.type) ? 'danger' : ''}"><span>${icon}</span><div><div class="rt">${r.txt}</div><div class="rb"><i style="width:${k * 100}%"></i>${pr ? `<b style="width:${pr * 100}%"></b>` : ''}</div></div></div>`;
  }
  list.innerHTML = html;
  if (G.boss) $('bossFill').style.width = (G.boss.hp / G.boss.max * 100) + '%';
}

// =====================================================================
// Sprechblasen, schwebende Texte, Meldungen
// =====================================================================
const layer = $('bubbles');
const reqEls = new Map();
const transient = [];
function bubble(text, x, z, cls) {
  const el = document.createElement('div'); el.className = 'bub ' + (cls || ''); el.textContent = text; layer.appendChild(el);
  transient.push({ el, x, y: W.H(x, z) + 2.2, z, t: 0, life: 3.2 });
}
function floatText(text, x, y, z, cls) {
  const el = document.createElement('div'); el.className = 'ft ' + (cls || ''); el.textContent = text; layer.appendChild(el);
  transient.push({ el, x, y, z, t: 0, life: 1.6, rise: 1.5 });
}
const warns = [];
function warnAt(x, z) { const el = document.createElement('div'); el.className = 'warnmk'; el.textContent = '⚠️'; layer.appendChild(el); warns.push({ el, x, z, t: 0 }); }
function updateBubbles(dt) {
  // Wunsch-Blasen
  const seen = new Set();
  // höchstens 3 Wunsch-Blasen in der Welt (Gefahren zuerst), der Rest steht nur in der Liste
  const DANGER = ['fire', 'pirates', 'locusts', 'serpent'];
  const shown = G.reqs.slice().sort((a, b) => DANGER.includes(b.type) - DANGER.includes(a.type)).slice(0, W.touch ? 2 : 3);
  for (const r of shown) {
    seen.add(r);
    let el = reqEls.get(r);
    if (!el) { el = document.createElement('div'); el.className = 'bub req' + (['fire', 'pirates', 'locusts', 'serpent'].includes(r.type) ? ' danger' : ''); el.textContent = r.txt; layer.appendChild(el); reqEls.set(r, el); }
    const y = r.y || Math.max(0, W.H(r.x, r.z)) + 2.4, s = W.toScreen(r.x, y, r.z);
    const cx = clamp(s.x, 80, innerWidth - 80), cy = clamp(s.y, 90, innerHeight - 150);
    el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -100%)`; el.style.display = s.vis ? '' : 'none';
    el.classList.toggle('edge', cx !== s.x || cy !== s.y);
  }
  for (const [r, el] of reqEls) if (!seen.has(r)) { el.remove(); reqEls.delete(r); }
  for (let i = transient.length - 1; i >= 0; i--) {
    const b = transient[i]; b.t += dt; if (b.t > b.life) { b.el.remove(); transient.splice(i, 1); continue; }
    const s = W.toScreen(b.x, b.y + (b.rise || 0.4) * b.t, b.z);
    b.el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%)`; b.el.style.opacity = Math.min(1, (b.life - b.t) * 2);
  }
  for (let i = warns.length - 1; i >= 0; i--) {
    const w = warns[i]; w.t += dt; if (w.t > 6) { w.el.remove(); warns.splice(i, 1); continue; }
    const s = W.toScreen(w.x, 1.5, w.z); w.el.style.transform = `translate(${clamp(s.x, 30, innerWidth - 30)}px, ${clamp(s.y, 80, innerHeight - 140)}px) translate(-50%, -50%) scale(${1 + Math.sin(w.t * 8) * 0.15})`;
  }
}
let msgT = 0;
function msg(title, text, sec = 3) { $('msg').innerHTML = title + (text ? `<small>${text}</small>` : ''); $('msg').classList.add('show'); msgT = sec; }
let toastT = 0;
function toast(t) { $('toast').textContent = t; $('toast').classList.add('show'); toastT = 3; }
let noManaT = 0;
function noMana() { if (noManaT > 0) return; noManaT = 2.5; toast('💙 Zu wenig Wetterkraft – warte kurz, sie lädt nach.'); $('mana').classList.add('empty'); setTimeout(() => $('mana').classList.remove('empty'), 600); }
const chronQ = [];
function chronikToast(t, d) { chronQ.push([t, d]); if (chronQ.length === 1) showChron(); audio.fanfare(); }
function showChron() { if (!chronQ.length) return; const [t, d] = chronQ[0]; $('chronToast').innerHTML = `📜 <b>${t}</b><small>${d}</small>`; $('chronToast').classList.add('show'); setTimeout(() => { $('chronToast').classList.remove('show'); setTimeout(() => { chronQ.shift(); showChron(); }, 400); }, 3200); }
function flash(a) { const f = $('flash'); f.style.transition = 'none'; f.style.opacity = a; requestAnimationFrame(() => { f.style.transition = 'opacity 0.45s'; f.style.opacity = 0; }); }
function bossBar(on) { $('boss').style.display = on ? 'block' : 'none'; }

// =====================================================================
// Hinweise (Tutorial inline)
// =====================================================================
let hintShownT = 0, camMoved = false, treeOpened = false;
const HC = {
  cloud: [() => true, () => G.hintKeys.cloud],
  move: [() => true, () => G.clouds.some(c => !c.natural && c.w > 0.3 && GM.I.fields.some(f => Math.hypot(f.x - c.x, f.z - c.z) < GM.cloudR(c)))],
  rain: [() => true, () => G.hintKeys.rain],
  camera: [() => true, () => camMoved],
  sun: [() => true, () => G.hintKeys.sun],
  wind: [() => true, () => G.hintKeys.wind],
  faith: [() => GM.S.faith >= 15 || treeOpened, () => treeOpened],
  bolt: [() => G.pirates.length || G.swarms.length || G.serpent || G.clouds.some(c => c.w > 0.75), () => G.hintKeys.bolt],
  season: [() => GM.I.season > 0 || GM.I.year > 0, () => hintShownT > 9],
  mana: [() => G.hintKeys.mana, () => hintShownT > 9],
};
function updateHints(dt) {
  const S = GM.S, h = D.HINTS[S.hint], el = $('hint');
  if (!h) { el.classList.remove('show'); return; }
  const [show, done] = HC[h.k];
  if (done()) { S.hint++; hintShownT = 0; el.classList.remove('show'); audio.chime(); return; }
  if (show()) { if (!el.classList.contains('show')) { el.innerHTML = W.touch ? h.t.replace('Halte die Maus gedrückt', 'Halte den Finger gedrückt') : h.t; el.classList.add('show'); } hintShownT += dt; }
  else el.classList.remove('show');
  if (h.k === 'rain' && power !== 1 && hintShownT > 0.1) $('powers').children[1].classList.add('pulse'); else $('powers').children[1].classList.remove('pulse');
  if (h.k === 'sun') $('powers').children[2].classList.add('pulse'); else $('powers').children[2].classList.remove('pulse');
  if (h.k === 'wind') $('powers').children[3].classList.add('pulse'); else $('powers').children[3].classList.remove('pulse');
}

// =====================================================================
// Eingabe
// =====================================================================
const cvs = W.renderer.domElement;
const pointers = new Map();
let act = null; // laufende Aktion
let lastPinch = 0, orbit = null;
cvs.addEventListener('contextmenu', e => e.preventDefault());
function cloudScreenPick(px, py) {
  let best = null, bd = 1e9;
  for (const c of G.clouds) {
    if (c.fade || c.boss) continue;
    const s = W.toScreen(c.x, D.CLOUD_Y, c.z), e = W.toScreen(c.x + GM.cloudR(c), D.CLOUD_Y, c.z), rpx = Math.max(28, Math.hypot(e.x - s.x, e.y - s.y) * 1.05);
    const d = Math.hypot(px - s.x, py - s.y); if (d < rpx && d / rpx < bd) { bd = d / rpx; best = c; }
  }
  return best;
}
function hits(px, py) {
  const r = W.pointerRay(px, py);
  return { cp: W.planeHit(r, D.CLOUD_Y), gp: W.groundHit(r), wp: W.planeHit(r, 1.5) };
}
cvs.addEventListener('pointerdown', e => {
  audio.init();
  if (paused || modalOpen) return;
  cvs.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) { endAction(); const [a, b] = [...pointers.values()]; lastPinch = Math.hypot(a.x - b.x, a.y - b.y); orbit = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; return; }
  if (e.button === 2 || e.button === 1) { orbit = { x: e.clientX, y: e.clientY, mouse: true }; return; }
  if (pointers.size > 1) return;
  startAction(e.clientX, e.clientY);
});
cvs.addEventListener('pointermove', e => {
  const p = pointers.get(e.pointerId);
  if (p) { p.x = e.clientX; p.y = e.clientY; }
  if (orbit && pointers.size === 2) {
    const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    W.cam.tdist = clamp(W.cam.tdist * lastPinch / Math.max(1, d), 24, 85); lastPinch = d;
    W.cam.tyaw -= (mx - orbit.x) * 0.006; W.cam.tpitch = clamp(W.cam.tpitch + (my - orbit.y) * 0.004, 0.35, 1.35); orbit.x = mx; orbit.y = my; camMoved = true; return;
  }
  if (orbit && orbit.mouse) { W.cam.tyaw -= (e.clientX - orbit.x) * 0.006; W.cam.tpitch = clamp(W.cam.tpitch + (e.clientY - orbit.y) * 0.004, 0.35, 1.35); orbit.x = e.clientX; orbit.y = e.clientY; camMoved = true; return; }
  if (act) { act.px = e.clientX; act.py = e.clientY; }
  else if (!W.touch) { hover.x = e.clientX; hover.y = e.clientY; }
});
const endPtr = e => {
  pointers.delete(e.pointerId);
  if (orbit && (orbit.mouse || pointers.size < 2)) { orbit = null; if (pointers.size) return; }
  if (!pointers.size) endAction();
};
cvs.addEventListener('pointerup', endPtr); cvs.addEventListener('pointercancel', endPtr);
cvs.addEventListener('wheel', e => { e.preventDefault(); W.cam.tdist = clamp(W.cam.tdist * (1 + Math.sign(e.deltaY) * 0.1), 24, 85); camMoved = true; }, { passive: false });
const hover = { x: -1, y: -1 };

function startAction(px, py) {
  const id = D.POWERS[power].id, h = hits(px, py);
  act = { id, px, py, sx: px, sy: py, t: 0, lastCp: h.cp, lastWp: h.wp, lastGp: h.gp, acc: 0, hist: [], cloud: null, moved: 0 };
  const c = cloudScreenPick(px, py);
  if (id === 'cloud') { act.cloud = c ? c : null; if (c) c.held = true; else if (h.cp) { act.cloud = P.gather(null, h.cp.x, h.cp.z, 0, 0); if (act.cloud) act.cloud.held = true; } }
  else if (id === 'rain' || id === 'snow') { if (c) { act.cloud = c; c.held = true; } else toast('Tippe auf eine Wolke und halte gedrückt.'); }
  else if (id === 'sun') { if (c) { act.cloud = c; c.held = true; } }
  else if (id === 'bolt') { act.cloud = c && c.w >= 0.6 && GM.sk('b3') ? c : null; }
  else if (id === 'tornado' && h.gp) P.tornado(h.gp.x, h.gp.z, true, 0);
  else if (id === 'fog' && h.gp) P.fog(h.gp.x, h.gp.z);
}
function endAction() {
  if (!act) return;
  const a = act; act = null;
  const c = a.cloud;
  if (a.id === 'rain' && c) P.rain(c, false, 0);
  if (a.id === 'snow' && c) P.snow(c, false, 0);
  if (a.id === 'bolt') { if (c) P.hail(c, false, 0); if (a.moved < 14 && a.t < 0.5 || (!c && a.moved < 30)) { const h = hits(a.px, a.py); if (h.gp) P.bolt(h.gp.x, h.gp.z); } }
  if (a.id === 'rainbow' && a.moved < 20) P.rainbow();
  if (a.id === 'tornado') P.tornado(0, 0, false, 0);
  if (c) {
    c.held = false;
    // Wurfgeschwindigkeit aus letzter Bewegung
    const hs = a.hist.filter(h => a.t - h.t < 0.12);
    if (hs.length >= 2) {
      const f = hs[0], l = hs[hs.length - 1], dt = Math.max(0.016, l.t - f.t), vx = (l.x - f.x) / dt, vz = (l.z - f.z) / dt, sp = Math.hypot(vx, vz);
      if (a.id === 'sun' && sp > 9) P.flick(c, vx * 0.9, vz * 0.9);
      else { c.vx = vx * 0.25; c.vz = vz * 0.25; }
    }
  }
}
function actionFrame(dt) {
  W.ring.visible = false; WM.hoverCloud = null;
  const id = D.POWERS[power].id;
  if (!act) {
    if (hover.x >= 0 && !paused && !modalOpen) {
      if (['cloud', 'rain', 'snow', 'sun'].includes(id)) WM.hoverCloud = cloudScreenPick(hover.x, hover.y);
      if (['bolt', 'tornado', 'rainbow', 'fog', 'sun'].includes(id) && !WM.hoverCloud) { const h = hits(hover.x, hover.y); if (h.gp) showRing(h.gp, id); }
      if (WM.hoverCloud) cloudRing(WM.hoverCloud);
    }
    return;
  }
  act.t += dt;
  const h = hits(act.px, act.py), c = act.cloud;
  const mv = Math.hypot(act.px - act.sx, act.py - act.sy); act.moved = Math.max(act.moved, mv);
  if (c && h.cp) {
    const d = act.lastCp ? Math.hypot(h.cp.x - act.lastCp.x, h.cp.z - act.lastCp.z) : 0;
    if (act.id === 'cloud') P.gather(c, h.cp.x, h.cp.z, Math.min(d, 3), dt);
    else { c.x += (h.cp.x - c.x) * Math.min(1, dt * 14); c.z += (h.cp.z - c.z) * Math.min(1, dt * 14); }
    c.vx = c.vz = 0;
    act.hist.push({ t: act.t, x: h.cp.x, z: h.cp.z }); if (act.hist.length > 20) act.hist.shift();
    act.lastCp = h.cp; WM.hoverCloud = c;
  }
  if (act.id === 'rain' && c) P.rain(c, true, dt);
  if (act.id === 'snow' && c) P.snow(c, true, dt);
  if (act.id === 'sun' && !c && h.gp) { P.sunbeam(h.gp.x, h.gp.z, dt); showRing(h.gp, 'sun'); }
  if (act.id === 'bolt' && c && act.t > 0.35 && act.moved < 20) { if (!P.hail(c, true, dt)) act.cloud = null; }
  if (act.id === 'bolt' && h.gp) showRing(h.gp, 'bolt');
  if (act.id === 'tornado' && h.gp) { P.tornado(h.gp.x, h.gp.z, true, dt); showRing(h.gp, 'tornado'); }
  if (act.id === 'wind' && h.wp && act.lastWp) {
    const dx = h.wp.x - act.lastWp.x, dz = h.wp.z - act.lastWp.z, d = Math.hypot(dx, dz);
    act.acc += d; act.gx = (act.gx || 0) + dx; act.gz = (act.gz || 0) + dz; act.gt = (act.gt || 0) + dt;
    if (act.acc > 1.1) {
      const sp = act.acc / Math.max(0.016, act.gt);
      P.gust(h.wp.x - act.gx / 2, h.wp.z - act.gz / 2, act.gx, act.gz, clamp(sp * 0.12, 1, 10));
      act.acc = 0; act.gx = act.gz = 0; act.gt = 0;
    }
    act.lastWp = h.wp;
  }
  if (c && !c.fade) cloudRing(c);
  if (act.id === 'fog' && h.gp && act.lastGp) { if (Math.hypot(h.gp.x - act.lastGp.x, h.gp.z - act.lastGp.z) > 1.4) { P.fog(h.gp.x, h.gp.z); act.lastGp = h.gp; } }
}
// Kreis am Boden genau unter der Wolke: zeigt, wohin Regen/Schnee fällt
function cloudRing(c) {
  const y = Math.max(0, W.H(c.x, c.z)); W.ring.visible = true; W.ring.position.set(c.x, y + 0.12, c.z);
  W.ring.material.color.set(c.w >= 0.6 ? 0x9fb4ff : 0xdff3ff); W.ring.scale.setScalar(GM.cloudR(c) * 0.85);
}
function showRing(p, id) {
  const col = { bolt: 0xffe14d, sun: 0xffd27a, tornado: 0x9aa5b1, rainbow: 0xff9ad5, fog: 0xffffff }[id] || 0xffffff;
  W.ring.visible = true; W.ring.position.set(p.x, p.y + 0.12, p.z); W.ring.material.color.set(col);
  const s = id === 'tornado' ? 2.4 : id === 'sun' ? 2.6 : id === 'bolt' ? [1.6, 0.9, 0.5][GM.sk('b1')] : 1; W.ring.scale.setScalar(s);
  if (id === 'bolt') { const ok = G.clouds.some(c => !c.fade && !c.boss && c.w >= 0.6 && Math.hypot(c.x - p.x, c.z - p.z) < 7 + 3 * GM.sk('b1')); W.ring.material.color.set(ok ? 0xffe14d : 0xff5a5a); }
}
addEventListener('keydown', e => {
  audio.init();
  if (e.repeat && !['q', 'e', 'Q', 'E'].includes(e.key)) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { if (modalOpen && modalOpen !== 'start') closeModal(); else togglePause(); return; }
  if (modalOpen) return;
  if (k >= '1' && k <= '9') { const i = +k - 1; if (D.POWERS[i]) selectPower(i); }
  else if (k === 'q') { W.cam.tyaw += 0.12; camMoved = true; }
  else if (k === 'e') { W.cam.tyaw -= 0.12; camMoved = true; }
  else if (k === '+' || k === '=') { W.cam.tdist = clamp(W.cam.tdist * 0.9, 24, 85); camMoved = true; }
  else if (k === '-') { W.cam.tdist = clamp(W.cam.tdist * 1.1, 24, 85); camMoved = true; }
  else if (k === 'p') togglePause();
  else if (k === 't') openModal('skills');
  else if (k === 'c') openModal('chronik');
  else if (k === 'm') openModal('map');
});

// =====================================================================
// Menüs
// =====================================================================
function togglePause(force) {
  paused = force !== undefined ? force : !paused;
  $('pauseBtn').textContent = paused ? '▶' : '⏸'; $('pauseOv').style.display = paused ? 'flex' : 'none';
  if (paused) GM.persist();
}
function openModal(name) {
  if (modalOpen === 'start') return;
  modalOpen = name; endAction();
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
  $(name).style.display = 'flex';
  if (name === 'skills') { treeOpened = true; renderSkills(); }
  if (name === 'chronik') renderChronik();
  if (name === 'map') renderMap();
}
function closeModal() { if (modalOpen) $(modalOpen).style.display = 'none'; modalOpen = null; GM.persist(); refreshPowers(); }
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
$('skillBtn').addEventListener('click', () => openModal('skills'));
$('chronBtn').addEventListener('click', () => openModal('chronik'));
$('mapBtn').addEventListener('click', () => openModal('map'));
$('pauseBtn').addEventListener('click', () => togglePause());
$('pauseOv').addEventListener('click', () => togglePause(false));
const soundLabel = () => { $('soundBtn').textContent = AC && AC.isMuted() ? '🔇' : '🔊'; };
$('soundBtn').addEventListener('click', () => { if (AC) AC.toggleMute(); soundLabel(); audio.init(); }); soundLabel();

function renderSkills() {
  const S = GM.S;
  $('sFaith').textContent = Math.floor(S.faith);
  let html = '';
  D.BRANCHES.forEach(([e, n], bi) => {
    html += `<div class="br"><h3>${e} ${n}</h3>`;
    for (const s of D.SKILLS.filter(s => s.b === bi)) {
      const st = GM.skillState(s), l = GM.sk(s.id), cost = s.c[l];
      const req = s.req ? (Array.isArray(s.req) ? s.req : [s.req, 1]) : null;
      const reqTxt = st === 'locked' ? `<small class="lock">🔒 braucht ${D.SKILLS.find(x => x.id === req[0]).n}${req[1] > 1 ? ' Stufe ' + req[1] : ''}</small>` : '';
      const pips = s.c.length > 1 ? '<span class="pips">' + s.c.map((_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('') + '</span>' : '';
      html += `<div class="sk ${st}"><div class="se">${s.e}</div><div class="sb"><b>${s.n}</b>${pips}<small>${s.d}</small>${reqTxt}</div>` +
        (st === 'max' ? '<span class="done">✔ gemeistert</span>' : `<button data-sk="${s.id}" ${st === 'buy' ? '' : 'disabled'}>${l ? 'Stufe ' + (l + 1) + ' · ' : 'Lernen · '}${cost} ✨</button>`) + '</div>';
    }
    html += '</div>';
  });
  $('skillTree').innerHTML = html;
  $('skillTree').querySelectorAll('button[data-sk]').forEach(b => b.addEventListener('click', () => { if (GM.buySkill(b.dataset.sk)) { renderSkills(); refreshPowers(); const s = D.SKILLS.find(x => x.id === b.dataset.sk); const p = D.POWERS.find(p => p.skill === s.id); if (p) toast(p.e + ' Neue Kraft: ' + p.n + ' (Taste ' + p.key + ')'); } }));
}
function renderChronik() {
  const S = GM.S; let html = '', n = 0;
  for (const [id, t, d] of D.CHRONIK) {
    const e = S.chronik[id]; if (e) n++;
    const isl = e && D.ISLANDS.find(i => i.id === e.i);
    html += `<div class="ch ${e ? 'got' : ''}"><span>${e ? '📜' : '❔'}</span><div><b>${e ? t : '???'}</b><small>${e ? d : 'Noch nicht erlebt.'}</small>${e ? `<em>${isl ? isl.e + ' ' + isl.n + ' · ' : ''}${D.SEASONS[e.s].n}, Jahr ${e.y}</em>` : ''}</div></div>`;
  }
  $('chronList').innerHTML = html; $('chronCount').textContent = n + ' / ' + D.CHRONIK.length;
  const st = S.stats;
  $('chronStats').innerHTML = `☁️ ${st.clouds} Wolken · ⚡ ${st.bolts} Blitze · 🙏 ${st.wishes} Wünsche · 🌾 ${st.harvests} Ernten · 👥 ${GM.totalPop()} Bewohner gesamt · ✨ ${Math.floor(S.faithTotal)} Glaube gesamt`;
}
function renderMap() {
  const S = GM.S; let html = '';
  D.ISLANDS.forEach((isl, i) => {
    const open = S.unlocked.includes(isl.id), cur = GM.I && GM.I.def.id === isl.id, st = cur ? GM.I : S.islands[isl.id];
    const pop = st ? Math.floor(st.pop || 0) : 0, goal = st && st.goal;
    const prev = D.ISLANDS[i - 1];
    html += `<div class="isl ${open ? '' : 'locked'} ${cur ? 'cur' : ''}"><div class="ie">${open ? isl.e : '🔒'}</div><div class="ib"><b>${isl.n}</b>` +
      `<small>${open ? D.ISLAND_TXT[i] : 'Erreiche das Ziel von ' + prev.n + ', um diese Insel zu entdecken.'}</small>` +
      `<em>${open ? (goal ? '🏆 ' : '🎯 ') + isl.goalTxt + (st ? ' · 👥 ' + pop + ' · Jahr ' + ((st.year || 0) + 1) : ' · unberührt') : ''}</em></div>` +
      (open && !cur ? `<button data-isl="${isl.id}">Hinreisen</button>` : cur ? '<span class="here">Du bist hier</span>' : '') + '</div>';
  });
  $('mapList').innerHTML = html;
  $('mapList').querySelectorAll('button[data-isl]').forEach(b => b.addEventListener('click', () => { closeModal(); GM.travel(b.dataset.isl); refreshPowers(); }));
}

// Start
function startGame() {
  $('start').style.display = 'none'; modalOpen = null;
  audio.init();
  GM.loadIsland(GM.S.cur); GM.ensureFirstRequest();
  selectPower(0); refreshPowers();
}
{
  const S = GM.S, has = Object.keys(S.islands).length > 0;
  $('startBtn').textContent = has ? 'Weiterspielen' : 'Wetter machen';
  const best = AC ? Number(AC.getScore('wettermacher')) || 0 : 0;
  $('startStats').innerHTML = has ? `<div class="stat"><div>Glaube</div><div>✨ ${Math.floor(S.faith)}</div></div><div class="stat"><div>Bewohner gesamt</div><div>👥 ${GM.totalPop()}</div></div><div class="stat"><div>Inseln</div><div>🗺️ ${S.unlocked.length} / ${D.ISLANDS.length}</div></div><div class="stat"><div>Chronik</div><div>📜 ${Object.keys(S.chronik).length} / ${D.CHRONIK.length}</div></div>`
    : (best ? `<div class="stat"><div>Rekord</div><div>👥 ${best}</div></div>` : '');
  $('resetBtn').style.display = has ? '' : 'none';
  modalOpen = 'start';
}
$('startBtn').addEventListener('click', startGame);
$('resetBtn').addEventListener('click', () => { if (confirm('Wirklich den gesamten Fortschritt löschen? Das kann nicht rückgängig gemacht werden.')) { GM.resetAll(); $('start').style.display = 'none'; modalOpen = null; GM.ensureFirstRequest(); selectPower(0); } });

// Speichern beim Verlassen
document.addEventListener('visibilitychange', () => { if (document.hidden && GM.I) { GM.persist(); if (!modalOpen) togglePause(true); } });
addEventListener('pagehide', () => { if (GM.I) GM.persist(); });

// =====================================================================
// Hauptschleife
// =====================================================================
let last = performance.now(), saveT = 0, fpsAcc = 0, fpsN = 0;
WM.ui = { bubble, floatText, msg, toast, noMana, chronikToast, flash, bossBar, warnAt, get power() { return power; }, selectPower };
// Insel schon im Hintergrund zeigen (Startbildschirm)
GM.loadIsland(GM.S.cur); $('msg').classList.remove('show'); msgT = 0;
W.cam.tyaw = W.cam.yaw = -0.6;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const running = !paused && !modalOpen;
  if (running) { GM.update(dt); actionFrame(dt); }
  else if (modalOpen === 'start') { W.cam.tyaw += dt * 0.05; GM.update(dt * 0.3); }
  W.updateCamera(dt);
  updateBubbles(running ? dt : 0); if (GM.I) updateHud(dt);
  if (running && GM.I) updateHints(dt);
  if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('msg').classList.remove('show'); }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('show'); }
  noManaT -= dt;
  const rainAmt = G.clouds.reduce((s, c) => s + (c.isRaining ? c.w + 0.3 : 0), 0), windAmt = G.gusts.length * 0.6 + Math.hypot(G.wind.x, G.wind.z) + (G.tornado ? 3 : 0);
  audio.update(rainAmt, windAmt, G.storm || 0, GM.I ? GM.I.season : 0, W.nightK > 0.6, !running && modalOpen !== 'start');
  saveT += dt; if (saveT > 45 && running) { saveT = 0; GM.persist(); }
  W.renderer.render(W.scene, W.camera);
  fpsAcc += dt; fpsN++; if (fpsAcc > 1) { WM.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
}
requestAnimationFrame(frame);

// =====================================================================
// Debug-Haken (nur mit ?debug)
// =====================================================================
if (GM.DEBUG) {
  WM.debug = {
    faith(n = 500) { GM.S.faith += n; },
    skipSeason() { GM.I.t = D.SEASON_LEN - 0.01; },
    time(sec) { const steps = Math.ceil(sec / 0.05); for (let i = 0; i < steps; i++) GM.update(0.05); },
    pop(n) { GM.I.pop = n; },
    wood(n) { GM.I.wood += n; }, food(n) { GM.I.food += n; },
    speed(x) { G.speed = x; },
    threat(t) { GM.G.threatT = 999; WM.game.startThreat(t); },
    state() { const I = GM.I; return { island: I.def.id, year: I.year, season: I.season, t: Math.round(I.t), pop: I.pop, cap: GM.housing(), food: Math.round(I.food), water: Math.round(I.water), wood: Math.round(I.wood), happy: Math.round(I.happy), faith: Math.round(GM.S.faith), mana: Math.round(G.mana), clouds: G.clouds.length, reqs: G.reqs.map(r => r.type), fields: I.fields.map(f => [+f.m.toFixed(2), +f.g.toFixed(2), +f.h.toFixed(2)]), buildings: I.buildings.map(b => b.t + (b.done < 1 ? '*' : '')), hint: GM.S.hint, unlocked: GM.S.unlocked, goal: I.goal, fps: Math.round(WM.fps || 0), threats: { pirates: G.pirates.length, swarms: G.swarms.length, serpent: !!G.serpent, fires: G.fires.length, boss: !!G.boss } }; },
    cam(yaw, pitch, dist) { Object.assign(W.cam, { tyaw: yaw, yaw, tpitch: pitch, pitch, tdist: dist, dist }); },
    start: startGame, select: selectPower, buy: id => GM.buySkill(id), travel: id => GM.travel(id), unlock(id) { if (!GM.S.unlocked.includes(id)) GM.S.unlocked.push(id); },
    screen: (x, y, z) => W.toScreen(x, y, z), G, GM,
  };
}
})();
