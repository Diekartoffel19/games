(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const SEND_RATE = 48000;

  let ctx = null;
  const getCtx = () => {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.setSinkId && outSelect.value) ctx.setSinkId(outSelect.value).catch(() => {});
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  const say = (el, msg, cls) => {
    el.textContent = msg;
    el.className = 'status' + (cls ? ' ' + cls : '');
  };

  const fmtSize = (n) => (n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB');
  const fmtTime = (s) => {
    s = Math.round(s);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };
  const fmtHz = (hz) => (hz >= 1000 ? (hz / 1000).toFixed(2) + ' kHz' : hz + ' Hz');

  /* =========================================================================
   * 0. AUDIO DEVICES, VOLUME & PERSISTENCE
   * ========================================================================= */
  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  const outSelect = $('outSelect');
  const inSelect = $('inSelect');
  const vol = $('vol');
  const modeSelect = $('modeSelect');
  const instRange = $('instRange');
  const showBandsToggle = $('showBandsToggle');
  let sendGain = null;

  vol.value = store.get('ft_vol', vol.value);
  instRange.value = store.get('ft_instances', '8');
  const savedMode = store.get('ft_mode', 'robot36');
  if ([...modeSelect.options].some((o) => o.value === savedMode)) {
    modeSelect.value = savedMode;
  }

  const applyVol = () => {
    $('volLabel').textContent = vol.value + '%';
    if (sendGain) sendGain.gain.value = Math.pow(vol.value / 100, 2);
  };
  vol.addEventListener('input', () => {
    store.set('ft_vol', vol.value);
    applyVol();
  });
  applyVol();

  const BT_RE = /bluetooth|hands-?free|headset|airpods|buds/i;

  function fillSelect(sel, devices, fallback) {
    const keep = sel.value || store.get('ft_' + sel.id, '');
    sel.length = 1;
    devices.forEach((d, i) => {
      const o = document.createElement('option');
      o.value = d.deviceId;
      o.textContent = d.label || `${fallback} ${i + 1}`;
      sel.appendChild(o);
    });
    sel.value = [...sel.options].some((o) => o.value === keep) ? keep : '';
  }

  function updateDevHint() {
    const labels = [outSelect, inSelect].map((s) => s.selectedOptions[0].textContent);
    const bt = labels.some((l) => BT_RE.test(l));
    $('devHint').textContent = bt
      ? 'Bluetooth erkannt: Headset-Mikrofone übertragen meist nur bis 4–8 kHz. Besser 1–6 Robot-36-Instanzen im Modus "Robust" wählen.'
      : 'Tipp: Bei 1–8 Robot-36-Instanzen funktioniert fast jeder Raum-Lautsprecher. Für 12–16 Instanzen Lautsprecher näher ans Mikrofon halten.';
  }

  async function refreshDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      updateDevHint();
      return;
    }
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      fillSelect(outSelect, all.filter((d) => d.kind === 'audiooutput'), 'Ausgabe');
      fillSelect(inSelect, all.filter((d) => d.kind === 'audioinput'), 'Mikrofon');
      outSelect.disabled = !('setSinkId' in AudioContext.prototype) || outSelect.length < 2;
    } catch (e) { /* ignore */ }
    updateDevHint();
  }

  async function applySink() {
    store.set('ft_outSelect', outSelect.value);
    updateDevHint();
    if (ctx && ctx.setSinkId) {
      try { await ctx.setSinkId(outSelect.value || ''); } catch (e) { /* ignore */ }
    }
  }

  outSelect.addEventListener('change', applySink);
  inSelect.addEventListener('change', () => {
    store.set('ft_inSelect', inSelect.value);
    updateDevHint();
  });
  if (navigator.mediaDevices) navigator.mediaDevices.addEventListener?.('devicechange', refreshDevices);
  updateDevHint();
  refreshDevices();

  function playChime() {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, c.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, c.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.18, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.45);
    } catch (e) {
      /* ignore audio error */
    }
  }

  /* =========================================================================
   * 1. COMPRESSION HELPER
   * ========================================================================= */
  async function pipe(bytes, stream) {
    const w = stream.writable.getWriter();
    w.write(bytes);
    w.close();
    return new Uint8Array(await new Response(stream.readable).arrayBuffer());
  }

  async function packBytes(bytes) {
    if (typeof CompressionStream === 'undefined') return { bytes, compressed: false };
    try {
      const z = await pipe(bytes, new CompressionStream('deflate-raw'));
      if (z.length < bytes.length * 0.95) return { bytes: z, compressed: true };
    } catch (e) {
      /* fall back to raw */
    }
    return { bytes, compressed: false };
  }

  /* =========================================================================
   * 2. LIVE WATERFALL SPECTROGRAM + ROBOT-36 CHANNEL OVERLAY
   * ========================================================================= */
  const cv = $('scope');
  const g = cv.getContext('2d');
  const ovCv = $('scopeOverlay');
  const ovG = ovCv.getContext('2d');
  let analyser = null;
  let scopeRaf = 0;
  let scopeMaxHz = 16000;
  let overlayMode = null;
  let overlayInstances = 8;

  g.fillStyle = '#05070a';
  g.fillRect(0, 0, cv.width, cv.height);

  function getScopeMaxHz(mode) {
    if (mode && mode.ultrasound) return 21500;
    const needed = mode ? mode.maxHz + 1200 : 10000;
    return Math.max(9500, Math.min(16500, Math.ceil(needed / 1000) * 1000));
  }

  function drawScopeOverlay(modeOpt, instancesOpt) {
    ovG.clearRect(0, 0, ovCv.width, ovCv.height);
    if (!showBandsToggle.checked) return;

    const effMode = Modem.resolveMode(modeOpt || modeSelect.value, 1024, instancesOpt || getSelectedInstances());
    scopeMaxHz = getScopeMaxHz(effMode);
    const bands = Modem.getInstanceBands(effMode, effMode.instances);

    ovG.font = '600 10px system-ui, sans-serif';
    ovG.textBaseline = 'middle';

    bands.forEach((b, i) => {
      const yTop = Math.max(0, ovCv.height * (1 - b.endHz / scopeMaxHz));
      const yBot = Math.min(ovCv.height, ovCv.height * (1 - b.startHz / scopeMaxHz));
      const h = Math.max(2, yBot - yTop);

      // Alternating subtle band tint
      ovG.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.06)' : 'rgba(255, 184, 77, 0.05)';
      ovG.fillRect(0, yTop, ovCv.width, h);

      // Band boundary line
      ovG.strokeStyle = 'rgba(56, 189, 248, 0.28)';
      ovG.lineWidth = 1;
      ovG.beginPath();
      ovG.moveTo(0, yTop);
      ovG.lineTo(ovCv.width, yTop);
      ovG.stroke();

      if (h >= 9) {
        const label = `R36 #${i + 1} (${(b.startHz / 1000).toFixed(1)}–${(b.endHz / 1000).toFixed(1)} kHz)`;
        ovG.fillStyle = 'rgba(6, 10, 16, 0.72)';
        ovG.fillRect(6, yTop + h / 2 - 6, 138, 12);
        ovG.fillStyle = i % 2 === 0 ? '#7dd3fc' : '#fcd34d';
        ovG.fillText(label, 10, yTop + h / 2);
      }
    });
  }

  showBandsToggle.addEventListener('change', () => drawScopeOverlay(overlayMode, overlayInstances));

  function scopeStart(node, toSpeakers, effMode) {
    scopeStop();
    const c = getCtx();
    overlayMode = effMode;
    overlayInstances = effMode ? effMode.instances : getSelectedInstances();
    scopeMaxHz = getScopeMaxHz(effMode);
    drawScopeOverlay(overlayMode, overlayInstances);

    $('scopeRate').textContent = `${(c.sampleRate / 1000).toFixed(1)} kHz | Bis ${(scopeMaxHz / 1000).toFixed(1)} kHz | ${overlayInstances}× Robot 36`;

    analyser = c.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.08;
    node.connect(analyser);
    if (toSpeakers) analyser.connect(c.destination);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const maxBin = Math.min(
      data.length - 1,
      Math.floor((scopeMaxHz / (c.sampleRate / 2)) * data.length)
    );

    const draw = () => {
      analyser.getByteFrequencyData(data);
      g.drawImage(cv, -2, 0);

      for (let y = 0; y < cv.height; y++) {
        const binIdx = Math.floor((1 - y / cv.height) * maxBin);
        const v = data[binIdx] / 255;
        let col;
        if (v < 0.2) col = `hsl(215, 80%, ${v * 60}%)`;
        else if (v < 0.6) col = `hsl(190, 95%, ${20 + v * 50}%)`;
        else if (v < 0.85) col = `hsl(45, 100%, ${30 + v * 50}%)`;
        else col = `hsl(55, 100%, ${60 + (v - 0.85) * 260}%)`;

        g.fillStyle = col;
        g.fillRect(cv.width - 2, y, 2, 1);
      }
      scopeRaf = requestAnimationFrame(draw);
    };
    draw();
  }

  function scopeStop() {
    cancelAnimationFrame(scopeRaf);
    if (analyser) {
      try { analyser.disconnect(); } catch (e) { /* ignore */ }
      analyser = null;
    }
  }

  /* =========================================================================
   * 3. ROBOT-36 INSTANCE RACK & PACKET MATRIX VISUALIZERS
   * ========================================================================= */
  function getSelectedInstances() {
    const raw = parseInt(instRange.value, 10) || 8;
    const baseMode = Modem.MODES[modeSelect.value] || Modem.MODES.robot36;
    return Modem.clampInstances(raw, baseMode);
  }

  function renderSendInstancesRack(effMode) {
    const rack = $('sendInstancesRack');
    const bands = Modem.getInstanceBands(effMode, effMode.instances);
    rack.innerHTML = '';
    const frag = document.createDocumentFragment();

    bands.forEach((b) => {
      const card = document.createElement('div');
      card.className = 'inst-card';
      card.id = `sendInst_${b.index}`;
      card.innerHTML = `
        <div class="inst-top">
          <span>${b.label}</span>
          <i class="inst-dot"></i>
        </div>
        <div class="inst-hz">${b.startHz}–${b.endHz} Hz</div>
        <div class="inst-bar"><i id="sendInstBar_${b.index}"></i></div>
      `;
      frag.appendChild(card);
    });
    rack.appendChild(frag);
  }

  function renderRecInstancesRack(effMode, instances) {
    const rack = $('recInstancesRack');
    const bands = Modem.getInstanceBands(effMode, instances);
    rack.innerHTML = '';
    const frag = document.createDocumentFragment();

    bands.forEach((b) => {
      const card = document.createElement('div');
      card.className = 'inst-card';
      card.id = `recInst_${b.index}`;
      card.innerHTML = `
        <div class="inst-top">
          <span>${b.label}</span>
          <i class="inst-dot"></i>
        </div>
        <div class="inst-hz" id="recInstMeta_${b.index}">${b.startHz}–${b.endHz} Hz</div>
        <div class="inst-bar"><i id="recInstBar_${b.index}"></i></div>
      `;
      frag.appendChild(card);
    });
    rack.appendChild(frag);
  }

  function updateInstanceUiControls() {
    const baseMode = Modem.MODES[modeSelect.value] || Modem.MODES.robot36;
    const maxI = baseMode.maxInstances || 16;
    instRange.max = String(maxI);
    const count = getSelectedInstances();
    if (parseInt(instRange.value, 10) !== count) {
      instRange.value = String(count);
    }

    const effMode = Modem.resolveMode(modeSelect.value, activePayload ? activePayload.bytes.length : 2048, count);
    const geom = Modem.getLineGeometry(effMode);
    const lineSec = (geom.symsPerLine * (effMode.actMs + effMode.guardMs)) / 1000;
    const rawRate = Math.round((geom.lineBytes * 0.82) / lineSec);

    $('instCountLabel').textContent = `${count} ${count === 1 ? 'Instanz' : 'Instanzen'}`;
    $('headerInstBadge').textContent = `${count}× Robot 36 Parallel`;
    $('metricSpeedup').textContent = `${count}× Parallel`;
    $('metricBand').textContent = `${(effMode.minHz / 1000).toFixed(1)}–${(effMode.maxHz / 1000).toFixed(1)} kHz`;
    $('metricRate').textContent = `~${rawRate} B/s`;

    document.querySelectorAll('#instPresets .preset-chip').forEach((btn) => {
      const n = parseInt(btn.dataset.inst, 10);
      btn.disabled = n > maxI;
      btn.classList.toggle('active', n === count);
    });

    renderSendInstancesRack(effMode);
    drawScopeOverlay(effMode, count);
  }

  function initGrid(containerEl, total) {
    containerEl.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
      const el = document.createElement('div');
      el.className = 'pkt';
      el.id = `${containerEl.id}_${i}`;
      el.title = `Scanline / Paket ${i + 1} von ${total}`;
      fragment.appendChild(el);
    }
    containerEl.appendChild(fragment);
  }

  function markGridPkt(containerId, index, state) {
    const el = $(`${containerId}_${index}`);
    if (el) el.className = 'pkt ' + state;
  }

  /* =========================================================================
   * 4. TABS, PRESET CHIPS & INPUT HANDLING
   * ========================================================================= */
  let activePayload = null; // { name, bytes }
  const drop = $('drop');
  const fileIn = $('file');
  const textInput = $('textInput');
  const textStats = $('textStats');

  $('tabFile').addEventListener('click', () => {
    $('tabFile').classList.add('active');
    $('tabText').classList.remove('active');
    $('fileBox').hidden = false;
    $('textBox').hidden = true;
    if (fileIn.files[0]) preparePayload(fileIn.files[0].name, null, fileIn.files[0]);
  });

  $('tabText').addEventListener('click', () => {
    $('tabText').classList.add('active');
    $('tabFile').classList.remove('active');
    $('fileBox').hidden = true;
    $('textBox').hidden = false;
    updateTextStats();
    if (textInput.value.trim()) applyText(true);
    else preparePayload(null);
  });

  const TEXT_NAME = 'nachricht.txt';

  function updateTextStats() {
    const text = textInput.value;
    const bytes = new TextEncoder().encode(text);
    const estSec = Modem.estimateSeconds(TEXT_NAME.length, bytes.length, modeSelect.value, getSelectedInstances());
    textStats.textContent = `${text.length} Zeichen (${fmtSize(bytes.length)}) ~ ${fmtTime(estSec)} bei ${getSelectedInstances()}× Robot 36`;
  }

  function applyText(quiet) {
    const text = textInput.value.trim();
    if (!text) {
      if (!quiet) say($('sendStatus'), 'Bitte zuerst Text eingeben.', 'err');
      preparePayload(null);
      return;
    }
    preparePayload(TEXT_NAME, new TextEncoder().encode(text));
  }

  let textTimer = 0;
  textInput.addEventListener('input', () => {
    updateTextStats();
    clearTimeout(textTimer);
    textTimer = setTimeout(() => applyText(true), 400);
  });

  $('applyText').addEventListener('click', () => {
    clearTimeout(textTimer);
    applyText(false);
  });

  instRange.addEventListener('input', () => {
    store.set('ft_instances', instRange.value);
    updateInstanceUiControls();
    updateTextStats();
    updateEncoding();
  });

  document.querySelectorAll('#instPresets .preset-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      instRange.value = btn.dataset.inst;
      store.set('ft_instances', instRange.value);
      updateInstanceUiControls();
      updateTextStats();
      updateEncoding();
    });
  });

  modeSelect.addEventListener('change', () => {
    store.set('ft_mode', modeSelect.value);
    updateInstanceUiControls();
    updateTextStats();
    updateEncoding();
  });

  /* =========================================================================
   * 5. SENDER CONTROLLER
   * ========================================================================= */
  let enc = null;
  let srcNode = null;
  let progRaf = 0;

  async function preparePayload(name, bytes, fileObj) {
    stopPlayback();
    enc = null;
    $('play').disabled = $('wav').disabled = $('loopbackBtn').disabled = true;
    if (!name) {
      activePayload = null;
      $('sendGridSection').hidden = true;
      $('sendTag').textContent = 'Sender bereit';
      return;
    }

    activePayload = null;
    if (!bytes && fileObj) {
      if (fileObj.size > 2 * 1024 * 1024) {
        say($('sendStatus'), 'Datei zu groß (max. 2 MB).', 'err');
        return;
      }
      bytes = new Uint8Array(await fileObj.arrayBuffer());
      $('dropText').textContent = name;
    }

    activePayload = { name, bytes };
    updateEncoding();
  }

  async function updateEncoding() {
    if (!activePayload) return;
    stopPlayback();
    say($('sendStatus'), 'Codieren auf ' + getSelectedInstances() + ' Robot-36-Instanzen...');
    const { name, bytes } = activePayload;

    try {
      const packed = await packBytes(bytes);
      const chosenMode = modeSelect.value;
      const chosenInstances = getSelectedInstances();
      enc = Modem.encodeAudio(name, packed.bytes, SEND_RATE, packed.compressed, chosenMode, chosenInstances);
      enc.sent = packed;

      const effMode = enc.mode;
      renderSendInstancesRack(effMode);
      drawScopeOverlay(effMode, enc.instances);

      $('modeHint').textContent =
        `${effMode.label} mit ${enc.instances}× parallelen Robot-36-Instanzen (${fmtHz(effMode.minHz)} – ${fmtHz(effMode.maxHz)}): ${effMode.desc}.`;

      if (effMode.ultrasound) {
        $('modeHint').textContent += ' Achtung: Normale Lautsprecher übertragen Ultraschall oft gedämpft.';
      }

      $('fileInfo').textContent =
        fmtSize(bytes.length) +
        (enc.sent.compressed ? ' (' + fmtSize(enc.sent.bytes.length) + ' komprimiert)' : '') +
        ` → ${fmtTime(enc.seconds)} Ton, ${enc.total} Scanlines (${enc.instances}× Robot 36)`;

      $('sendTag').textContent = `${enc.instances}× R36 • ${enc.total} Scanlines (${fmtTime(enc.seconds)})`;
      say(
        $('sendStatus'),
        `Bereit: ${enc.instances} gleichzeitige Robot-36-Instanzen (${enc.total} Scanlines, ${fmtTime(enc.seconds)}).`,
        'ok'
      );

      $('sendGridSection').hidden = false;
      $('sendGridCounter').textContent = `0 / ${enc.total}`;
      initGrid($('sendGrid'), enc.total);
      $('play').disabled = $('wav').disabled = $('loopbackBtn').disabled = false;
    } catch (err) {
      say($('sendStatus'), err.message, 'err');
    }
  }

  fileIn.addEventListener('change', () => {
    if (fileIn.files[0]) preparePayload(fileIn.files[0].name, null, fileIn.files[0]);
  });

  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    if (e.dataTransfer.files[0]) {
      preparePayload(e.dataTransfer.files[0].name, null, e.dataTransfer.files[0]);
    }
  });

  function setSendInstancesLive(active, progressRatio) {
    if (!enc) return;
    for (let i = 0; i < enc.instances; i++) {
      const card = $(`sendInst_${i}`);
      const bar = $(`sendInstBar_${i}`);
      if (card) card.classList.toggle('live', active);
      if (bar) {
        const wave = active ? Math.min(100, Math.round(progressRatio * 100)) : 0;
        bar.style.width = wave + '%';
      }
    }
  }

  function stopPlayback() {
    cancelAnimationFrame(progRaf);
    if (srcNode) {
      srcNode.onended = null;
      try { srcNode.stop(); } catch (e) { /* ignore */ }
      srcNode = null;
    }
    scopeStop();
    setSendInstancesLive(false, 0);
    $('play').disabled = !enc;
    $('stop').disabled = true;
    $('sendProg').hidden = true;
    $('sendTag').textContent = enc ? `${enc.instances}× R36 • ${enc.total} Scanlines` : 'Sender bereit';
  }

  $('play').addEventListener('click', () => {
    if (!enc) return;
    const c = getCtx();
    const buf = c.createBuffer(1, enc.samples.length, SEND_RATE);
    buf.copyToChannel(enc.samples, 0);

    srcNode = c.createBufferSource();
    srcNode.buffer = buf;
    sendGain = c.createGain();
    applyVol();
    srcNode.connect(sendGain);
    scopeStart(sendGain, true, enc.mode);

    const t0 = c.currentTime + 0.05;
    srcNode.start(t0);

    srcNode.onended = () => {
      stopPlayback();
      setSendInstancesLive(false, 1);
      say($('sendStatus'), `Übertragung mit ${enc.instances}× Robot-36-Instanzen abgeschlossen.`, 'ok');
      $('sendTag').textContent = 'Gesendet';
    };

    $('play').disabled = true;
    $('stop').disabled = false;
    $('sendProg').hidden = false;
    $('sendTag').textContent = `${enc.instances}× R36 läuft...`;

    initGrid($('sendGrid'), enc.total);

    const chirpLead = (120 + 60 + 15 + 60 + 15) / 1000;
    const hBasis = enc.mode.ultrasound ? { actMs: 28.57, guardMs: 6, groups: 4 } : { actMs: 20, guardMs: 5, groups: 8 };
    const numHSyms = 12 / (hBasis.groups / 2);
    const headerDur = (numHSyms * (hBasis.actMs + hBasis.guardMs)) / 1000;
    const preambleDur = chirpLead + headerDur;

    const symsPerLine = enc.geom.symsPerLine;
    const linePeriod = (symsPerLine * (enc.mode.actMs + enc.mode.guardMs)) / 1000;

    let activePkt = -1;
    const tick = () => {
      const t = c.currentTime - t0;
      const ratio = Math.min(1, Math.max(0, t / buf.duration));
      $('sendProg').value = ratio;
      setSendInstancesLive(true, ratio);

      if (t >= preambleDur) {
        const curIdx = Math.min(enc.total - 1, Math.floor((t - preambleDur) / linePeriod));
        if (curIdx !== activePkt) {
          if (activePkt >= 0) markGridPkt('sendGrid', activePkt, 'received');
          markGridPkt('sendGrid', curIdx, 'active');
          activePkt = curIdx;
          $('sendGridCounter').textContent = `${curIdx + 1} / ${enc.total}`;
        }
      }

      say(
        $('sendStatus'),
        `Senden (${enc.instances}× Robot 36): ${fmtTime(Math.max(0, t))} / ${fmtTime(buf.duration)} [${enc.mode.label}]`
      );
      progRaf = requestAnimationFrame(tick);
    };
    tick();
  });

  $('stop').addEventListener('click', () => {
    stopPlayback();
    say($('sendStatus'), 'Wiedergabe gestoppt.');
  });

  $('wav').addEventListener('click', () => {
    if (!enc || !activePayload) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(Modem.toWav(enc.samples, SEND_RATE));
    a.download = `${activePayload.name}.r36x${enc.instances}.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 6000);
  });

  /* Direct Loopback Test (Sender -> Receiver with all N simultaneous Robot 36 instances) */
  $('loopbackBtn').addEventListener('click', () => {
    if (!enc) return;
    $('result').hidden = true;
    $('recGridSection').hidden = true;
    $('recInstancesSection').hidden = true;
    $('recTag').textContent = 'Loopback-Decodierung...';
    say($('recStatus'), `Direkt-Test: Synchronisiere ${enc.instances}× Robot-36-Instanzen...`);

    setTimeout(() => {
      finish(() => Modem.decode(enc.samples, SEND_RATE, onLine, onHeader));
    }, 30);
  });

  /* =========================================================================
   * 6. RECEIVER CONTROLLER (WORKLET & MULTI-INSTANCE DEMODULATION)
   * ========================================================================= */
  const WORKLET_CODE = `
    class R extends AudioWorkletProcessor {
      process(inputs) {
        const c = inputs[0][0];
        if (c) this.port.postMessage(c.slice(0));
        return true;
      }
    }
    registerProcessor('rec', R);
  `;

  let rec = null;
  let rxReceivedCount = 0;

  let workletPromise = null;
  function loadWorklet(c) {
    if (!workletPromise) {
      const url = URL.createObjectURL(new Blob([WORKLET_CODE], { type: 'text/javascript' }));
      workletPromise = c.audioWorklet.addModule(url).finally(() => URL.revokeObjectURL(url));
      workletPromise.catch(() => { workletPromise = null; });
    }
    return workletPromise;
  }

  function onHeader(total, detectedMode, instances) {
    rxReceivedCount = 0;
    $('recGridSection').hidden = false;
    initGrid($('recGrid'), total);
    $('gridCounter').textContent = `0 / ${total}`;

    $('recInstancesSection').hidden = false;
    $('recInstCountBadge').textContent = `${instances}× parallel (${detectedMode.label})`;
    renderRecInstancesRack(detectedMode, instances);
    drawScopeOverlay(detectedMode, instances);

    $('recTag').textContent = `${instances}× R36 (${total} Scanlines)`;
    say(
      $('recStatus'),
      `Signal synchronisiert: ${instances}× Robot-36-Instanzen erkannt (${detectedMode.label}, ${total} Scanlines)...`,
      'ok'
    );
  }

  function onLine(lineIdx, bytes, total, mode, instanceStats) {
    rxReceivedCount++;
    markGridPkt('recGrid', lineIdx, 'received');
    const got = rec && rec.rx ? rec.rx.lines.size : rxReceivedCount;
    $('gridCounter').textContent = `${got} / ${total}`;

    if (instanceStats) {
      for (let i = 0; i < instanceStats.length; i++) {
        const st = instanceStats[i];
        const card = $(`recInst_${i}`);
        const bar = $(`recInstBar_${i}`);
        const meta = $(`recInstMeta_${i}`);
        if (card) card.classList.add('rx-ok');
        if (bar) bar.style.width = `${Math.max(15, st.confidence)}%`;
        if (meta) meta.textContent = `${st.bytesReceived} B • ${st.confidence}% Qual.`;
      }
    }
  }

  $('rec').addEventListener('click', async () => {
    if (rec) return;
    $('rec').disabled = true;
    $('result').hidden = true;
    $('recGridSection').hidden = true;
    $('recInstancesSection').hidden = true;
    $('recTag').textContent = 'Lausche...';

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          window.isSecureContext === false || location.protocol === 'file:'
            ? 'Mikrofon nur über https:// oder http://localhost verfügbar. Nutze einen lokalen Server oder den "⚡ Direkt-Test"-Button.'
            : 'Dieser Browser unterstützt keinen Mikrofonzugriff (getUserMedia fehlt).'
        );
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          ...(inSelect.value ? { deviceId: { exact: inSelect.value } } : {}),
        },
      });

      refreshDevices();
      const c = getCtx();
      const micSrc = c.createMediaStreamSource(stream);
      let workletNode = null;
      let scriptNode = null;
      let silentSink = null;

      const rx = new Modem.Receiver(c.sampleRate, onLine, onHeader);
      let level = 0;

      const handleAudioData = (d) => {
        rx.push(d);
        let s = 0;
        for (let i = 0; i < d.length; i++) s += d[i] * d[i];
        level = Math.max(level * 0.85, Math.sqrt(s / d.length));
      };

      try {
        await loadWorklet(c);
        workletNode = new AudioWorkletNode(c, 'rec');
        workletNode.port.onmessage = (e) => handleAudioData(e.data);
        micSrc.connect(workletNode);
        silentSink = c.createGain();
        silentSink.gain.value = 0;
        workletNode.connect(silentSink);
        silentSink.connect(c.destination);
      } catch (workletErr) {
        scriptNode = c.createScriptProcessor(2048, 1, 1);
        scriptNode.onaudioprocess = (e) => handleAudioData(e.inputBuffer.getChannelData(0));
        micSrc.connect(scriptNode);
        scriptNode.connect(c.destination);
      }

      const curMode = Modem.resolveMode(modeSelect.value, 1024, getSelectedInstances());
      scopeStart(micSrc, false, curMode);

      const t0 = performance.now();
      const timer = setInterval(() => {
        const pct = Math.min(100, Math.round(level * 400));
        $('meter').style.width = pct + '%';
        $('meterLabel').textContent = `Pegel: ${pct}%`;
        if (pct > 80) $('meter').style.background = 'var(--bad)';
        else if (pct > 15) $('meter').style.background = 'var(--good)';
        else $('meter').style.background = 'var(--accent)';

        rx.process();
        const t = fmtTime((performance.now() - t0) / 1000);

        if (rx.state === 'PREAMBLE') {
          say($('recStatus'), `Aufnahme ${t} – Warte auf Chirp-Startsignal & Robot-36-Header...`);
        } else {
          $('recSnrBadge').textContent = `SNR: +${Math.max(1, rx.snrDb + 12).toFixed(1)} dB`;
          say(
            $('recStatus'),
            `Aufnahme ${t} – Empfange auf ${rx.instances}× Robot-36-Instanzen: ${rx.lines.size}/${rx.total} Scanlines (${rx.mode.label})`
          );
        }

        if (rx.complete) {
          stopRec();
        }
      }, 150);

      rec = { stream, micSrc, workletNode, scriptNode, silentSink, timer, rx };
      $('rec').disabled = true;
      $('recStop').disabled = false;
    } catch (err) {
      say($('recStatus'), 'Mikrofon fehlgeschlagen: ' + err.message, 'err');
      $('recTag').textContent = 'Fehler';
      $('rec').disabled = false;
    }
  });

  function stopRec() {
    if (!rec) return;
    const r = rec;
    rec = null;
    clearInterval(r.timer);

    if (r.workletNode) {
      try { r.workletNode.disconnect(); } catch (e) { /* ignore */ }
    }
    if (r.scriptNode) {
      try { r.scriptNode.disconnect(); } catch (e) { /* ignore */ }
    }
    if (r.silentSink) {
      try { r.silentSink.disconnect(); } catch (e) { /* ignore */ }
    }
    try { r.micSrc.disconnect(); } catch (e) { /* ignore */ }
    r.stream.getTracks().forEach((t) => t.stop());

    scopeStop();
    $('meter').style.width = '0%';
    $('meterLabel').textContent = 'Pegel: 0%';
    $('rec').disabled = false;
    $('recStop').disabled = true;
    $('recTag').textContent = 'Decodieren...';

    say($('recStatus'), 'Decodieren & Reed-Solomon Fehlerkorrektur über alle Robot-36-Instanzen...');
    setTimeout(() => finish(() => r.rx.finalize()), 40);
  }

  $('recStop').addEventListener('click', stopRec);

  /* Decode uploaded audio file */
  $('audioFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    $('result').hidden = true;
    $('recGridSection').hidden = true;
    $('recInstancesSection').hidden = true;
    $('recTag').textContent = 'Audio laden...';
    say($('recStatus'), `Lade Audiodatei "${f.name}"...`);

    try {
      const c = getCtx();
      const ab = await c.decodeAudioData(await f.arrayBuffer());
      say($('recStatus'), 'Multi-Robot-36-Signal wird decodiert...');
      $('recTag').textContent = 'Decodieren...';

      setTimeout(
        () =>
          finish(() =>
            Modem.decode(ab.getChannelData(0), ab.sampleRate, onLine, onHeader)
          ),
        40
      );
    } catch (err) {
      say($('recStatus'), 'Audiodatei-Fehler: ' + err.message, 'err');
      $('recTag').textContent = 'Fehler';
    }
  });

  /* =========================================================================
   * 7. RESULT HANDLER & PREVIEW
   * ========================================================================= */
  async function finish(fn) {
    try {
      const r = await fn();
      if (r.compressed) {
        if (typeof DecompressionStream === 'undefined') {
          throw new Error('Daten sind komprimiert, aber DecompressionStream fehlt in diesem Browser.');
        }
        r.data = await pipe(r.data, new DecompressionStream('deflate-raw'));
      }
      playChime();
      showResult(r);
    } catch (err) {
      say($('recStatus'), err.message, 'err');
      $('recTag').textContent = 'Fehlgeschlagen';
    }
  }

  let lastDecodedText = '';

  function showResult(r) {
    say($('recStatus'), `Erfolgreich über ${r.instances}× Robot-36-Instanzen empfangen & verifiziert!`, 'ok');
    $('recTag').textContent = `Erfolg (${r.instances}× R36)`;
    if (r.snrDb !== undefined) {
      $('recSnrBadge').textContent = `SNR: +${Math.max(1, r.snrDb + 12).toFixed(1)} dB`;
    }

    const modeLabel = (r.modeLabel || r.mode || 'Robot 36').toUpperCase();
    $('resultInfo').innerHTML = `
      <strong>${escapeHtml(r.name)}</strong> (${fmtSize(r.data.length)})
      <div class="hint-small" style="margin-top:4px;">
        Instanzen: <b style="color:var(--cyan);">${r.instances}× Robot 36 parallel</b> &bull;
        Profil: <b>${escapeHtml(modeLabel)}</b> &bull;
        ${r.linesGot}/${r.linesTotal} Scanlines &bull;
        ${r.fixedBytes > 0 ? `<span style="color:var(--good);">${r.fixedBytes} Bytes via Reed-Solomon repariert!</span>` : '0 Fehler (100% sauber)'}
      </div>
    `;

    const a = $('download');
    if (a.href.startsWith('blob:')) URL.revokeObjectURL(a.href);
    const ext = (r.name.split('.').pop() || '').toLowerCase();
    a.href = URL.createObjectURL(new Blob([r.data], ext === 'svg' ? { type: 'image/svg+xml' } : {}));
    a.download = r.name || 'received.bin';

    const pv = $('preview');
    pv.textContent = '';
    const copyBtn = $('copyText');
    const isText = ['txt', 'md', 'json', 'csv', 'log', 'js', 'html', 'css', 'py', 'c', 'cpp'].includes(ext);

    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      copyBtn.hidden = true;
      const img = document.createElement('img');
      img.src = a.href;
      img.alt = r.name;
      pv.appendChild(img);
    } else if (isText) {
      lastDecodedText = new TextDecoder().decode(r.data);
      copyBtn.hidden = false;
      const pre = document.createElement('pre');
      pre.textContent =
        lastDecodedText.slice(0, 3500) +
        (lastDecodedText.length > 3500 ? '\n... (gekürzt für Vorschau)' : '');
      pv.appendChild(pre);
    } else {
      copyBtn.hidden = true;
    }
    $('result').hidden = false;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  $('copyText').addEventListener('click', async () => {
    if (!lastDecodedText) return;
    try {
      await navigator.clipboard.writeText(lastDecodedText);
      $('copyText').textContent = 'Kopiert!';
      setTimeout(() => ($('copyText').textContent = 'Text kopieren'), 2000);
    } catch (e) {
      alert('Kopieren fehlgeschlagen: ' + e.message);
    }
  });

  // Initial UI render
  updateInstanceUiControls();
  updateTextStats();
})();
