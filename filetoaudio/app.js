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

  /* =========================================================================
   * 0. AUDIO DEVICES & VOLUME (speakers / headphones / headsets)
   * ========================================================================= */
  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  const outSelect = $('outSelect');
  const inSelect = $('inSelect');
  const vol = $('vol');
  let sendGain = null;

  vol.value = store.get('ft_vol', vol.value);
  const applyVol = () => {
    $('volLabel').textContent = vol.value + '%';
    // squared curve: finer control at low volume (headphones!)
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
      ? 'Bluetooth erkannt: Headset-Mikrofone arbeiten oft nur mit 8–16 kHz. Besser Modus "Robust" nutzen oder Kabel-Kopfhörer.'
      : 'Lautsprecher: ca. 20–50 cm Abstand zum Mikrofon. Kopfhörer: Muschel direkt aufs Mikrofon legen, Lautstärke mittel. Ultraschall geht nur mit Spezial-Hardware.';
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
   * 2. LIVE WATERFALL SPECTROGRAM
   * ========================================================================= */
  const cv = $('scope');
  const g = cv.getContext('2d');
  let analyser = null;
  let scopeRaf = 0;
  let scopeMaxHz = 9000;
  g.fillStyle = '#05070a';
  g.fillRect(0, 0, cv.width, cv.height);

  function scopeStart(node, toSpeakers, isUltra) {
    scopeStop();
    const c = getCtx();
    scopeMaxHz = isUltra ? 21000 : 9000;
    $('scopeRate').textContent = `${(c.sampleRate / 1000).toFixed(1)} kHz | Max ${Math.round(scopeMaxHz / 1000)} kHz`;

    analyser = c.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.1;
    node.connect(analyser);
    if (toSpeakers) analyser.connect(c.destination);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const maxBin = Math.min(
      data.length - 1,
      Math.floor((scopeMaxHz / (c.sampleRate / 2)) * data.length)
    );

    const draw = () => {
      analyser.getByteFrequencyData(data);
      // Scroll left by 2 pixels
      g.drawImage(cv, -2, 0);

      // Draw new 2-pixel column
      for (let y = 0; y < cv.height; y++) {
        const binIdx = Math.floor((1 - y / cv.height) * maxBin);
        const v = data[binIdx] / 255;
        // Color gradient: deep blue -> cyan -> gold -> bright white
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
   * 3. PACKET MATRIX / GRID VISUALIZER
   * ========================================================================= */
  function initGrid(containerEl, total) {
    containerEl.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
      const el = document.createElement('div');
      el.className = 'pkt';
      el.id = `${containerEl.id}_${i}`;
      el.title = `Paket ${i + 1} von ${total}`;
      fragment.appendChild(el);
    }
    containerEl.appendChild(fragment);
  }

  function markGridPkt(containerId, index, state) {
    const el = $(`${containerId}_${index}`);
    if (el) {
      el.className = 'pkt ' + state;
    }
  }

  /* =========================================================================
   * 4. TABS & INPUT HANDLING
   * ========================================================================= */
  let activeTab = 'file';
  let activePayload = null; // { name, bytes }
  const drop = $('drop');
  const fileIn = $('file');
  const modeSelect = $('modeSelect');
  const textInput = $('textInput');
  const textStats = $('textStats');

  $('tabFile').addEventListener('click', () => {
    activeTab = 'file';
    $('tabFile').classList.add('active');
    $('tabText').classList.remove('active');
    $('fileBox').hidden = false;
    $('textBox').hidden = true;
    if (fileIn.files[0]) preparePayload(fileIn.files[0].name, null, fileIn.files[0]);
  });

  $('tabText').addEventListener('click', () => {
    activeTab = 'text';
    $('tabText').classList.add('active');
    $('tabFile').classList.remove('active');
    $('fileBox').hidden = true;
    $('textBox').hidden = false;
    updateTextStats();
    // Don't keep a previously chosen file armed while the text tab is shown
    if (textInput.value.trim()) applyText(true);
    else preparePayload(null);
  });

  const TEXT_NAME = 'nachricht.txt';

  function updateTextStats() {
    const text = textInput.value;
    const bytes = new TextEncoder().encode(text);
    const estSec = Modem.estimateSeconds(TEXT_NAME.length, bytes.length, modeSelect.value);
    textStats.textContent = `${text.length} Zeichen (${fmtSize(bytes.length)}) ~ ${fmtTime(estSec)}`;
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

  // Auto-encode shortly after typing stops
  let textTimer = 0;
  textInput.addEventListener('input', () => {
    updateTextStats();
    clearTimeout(textTimer);
    textTimer = setTimeout(() => applyText(true), 500);
  });

  $('applyText').addEventListener('click', () => {
    clearTimeout(textTimer);
    applyText(false);
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
    $('play').disabled = $('wav').disabled = true;
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
    say($('sendStatus'), 'Codieren...');
    const { name, bytes } = activePayload;

    try {
      const packed = await packBytes(bytes);
      const chosenMode = modeSelect.value;
      enc = Modem.encodeAudio(name, packed.bytes, SEND_RATE, packed.compressed, chosenMode);
      enc.sent = packed;

      const effMode = enc.mode;
      $('modeHint').textContent =
        chosenMode === 'auto'
          ? `Auto: Modus "${effMode.label}" gewählt (${effMode.desc}).`
          : `${effMode.label}: ${effMode.desc}.`;

      if (effMode.ultrasound) {
        $('modeHint').textContent += ' Achtung: Normale Lautsprecher und Kopfhörer übertragen das meist nicht.';
      }

      $('fileInfo').textContent =
        fmtSize(bytes.length) +
        (enc.sent.compressed ? ' (' + fmtSize(enc.sent.bytes.length) + ' komprimiert)' : '') +
        ' → ' + fmtTime(enc.seconds) + ' Ton, ' + enc.total + ' Datenpakete (' + effMode.label + ')';

      $('sendTag').textContent = `${enc.total} Pakete (${fmtTime(enc.seconds)})`;
      say(
        $('sendStatus'),
        enc.seconds > 300 ? 'Große Datei. Schnellerer Modus empfohlen.' : 'Bereit zum Abspielen.',
        'ok'
      );

      $('sendGridSection').hidden = false;
      initGrid($('sendGrid'), enc.total);
      $('play').disabled = $('wav').disabled = false;
    } catch (err) {
      say($('sendStatus'), err.message, 'err');
    }
  }

  modeSelect.addEventListener('change', () => {
    updateTextStats();
    updateEncoding();
  });

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

  function stopPlayback() {
    cancelAnimationFrame(progRaf);
    if (srcNode) {
      srcNode.onended = null;
      try { srcNode.stop(); } catch (e) { /* ignore */ }
      srcNode = null;
    }
    scopeStop();
    $('play').disabled = !enc;
    $('stop').disabled = true;
    $('sendProg').hidden = true;
    $('sendTag').textContent = enc ? `${enc.total} Pakete` : 'Sender bereit';
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
    scopeStart(sendGain, true, enc.mode.ultrasound);

    const t0 = c.currentTime + 0.05;
    srcNode.start(t0);

    srcNode.onended = () => {
      stopPlayback();
      say($('sendStatus'), 'Abspielen vollständig beendet.', 'ok');
      $('sendTag').textContent = 'Gesendet';
    };

    $('play').disabled = true;
    $('stop').disabled = false;
    $('sendProg').hidden = false;
    $('sendTag').textContent = 'Übertragung läuft...';

    initGrid($('sendGrid'), enc.total);

    const chirpLead = (120 + 60 + 15 + 60 + 15) / 1000;
    const hBasis = enc.mode.ultrasound ? { actMs: 28.57, guardMs: 6, groups: 4 } : { actMs: 20, guardMs: 5, groups: 8 };
    const numHSyms = 12 / (hBasis.groups / 2);
    const headerDur = (numHSyms * (hBasis.actMs + hBasis.guardMs)) / 1000;
    const preambleDur = chirpLead + headerDur;

    const symsPerLine = enc.mode.ultrasound ? 10 : 9;
    const linePeriod = (symsPerLine * (enc.mode.actMs + enc.mode.guardMs)) / 1000;

    let activePkt = -1;
    const tick = () => {
      const t = c.currentTime - t0;
      $('sendProg').value = Math.min(1, Math.max(0, t / buf.duration));

      if (t >= preambleDur) {
        const curIdx = Math.min(enc.total - 1, Math.floor((t - preambleDur) / linePeriod));
        if (curIdx !== activePkt) {
          if (activePkt >= 0) markGridPkt('sendGrid', activePkt, 'received');
          markGridPkt('sendGrid', curIdx, 'active');
          activePkt = curIdx;
        }
      }

      say(
        $('sendStatus'),
        'Senden: ' + fmtTime(Math.max(0, t)) + ' / ' + fmtTime(buf.duration) + ` [${enc.mode.label}]`
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
    a.download = activePayload.name + '.wav';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 6000);
  });

  /* =========================================================================
   * 6. RECEIVER CONTROLLER (WORKLET & STREAMING DEMODULATION)
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

  // registerProcessor() throws on a second registration, so load the module once per context
  let workletPromise = null;
  function loadWorklet(c) {
    if (!workletPromise) {
      const url = URL.createObjectURL(new Blob([WORKLET_CODE], { type: 'text/javascript' }));
      workletPromise = c.audioWorklet.addModule(url).finally(() => URL.revokeObjectURL(url));
      workletPromise.catch(() => { workletPromise = null; });
    }
    return workletPromise;
  }

  function onHeader(total, mode) {
    $('recGridSection').hidden = false;
    initGrid($('recGrid'), total);
    $('gridCounter').textContent = `0 / ${total}`;
    $('recTag').textContent = `${mode.label} (${total} Pakete)`;
    say($('recStatus'), `Signal synchronisiert: Modus ${mode.label}, erwarte ${total} Pakete...`, 'ok');
  }

  function onLine(lineIdx, bytes, total, mode) {
    markGridPkt('recGrid', lineIdx, 'received');
    if (rec && rec.rx) {
      $('gridCounter').textContent = `${rec.rx.lines.size} / ${total}`;
    }
  }

  $('rec').addEventListener('click', async () => {
    if (rec) return;
    $('rec').disabled = true; // prevent double start while waiting for mic permission
    $('result').hidden = true;
    $('recGridSection').hidden = true;
    $('recTag').textContent = 'Lausche...';

    try {
      // Browsers only expose the mic API in a secure context (https:// or http://localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          window.isSecureContext === false || location.protocol === 'file:'
            ? 'Mikrofon nur über https:// oder http://localhost verfügbar. Seite über einen lokalen Server öffnen (z. B. "npx serve" oder "python -m http.server", dann http://localhost:…) – oder eine gespeicherte .wav-Datei laden.'
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

      refreshDevices(); // labels become available after mic permission
      const c = getCtx();
      let micSrc = c.createMediaStreamSource(stream);
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

      // Try AudioWorklet first, fall back to ScriptProcessorNode
      try {
        await loadWorklet(c);
        workletNode = new AudioWorkletNode(c, 'rec');
        workletNode.port.onmessage = (e) => handleAudioData(e.data);
        micSrc.connect(workletNode);
        // Keep the node in the rendering graph (silent) so the browser keeps pulling it
        silentSink = c.createGain();
        silentSink.gain.value = 0;
        workletNode.connect(silentSink);
        silentSink.connect(c.destination);
      } catch (workletErr) {
        // Fallback for browsers with restricted AudioWorklet
        scriptNode = c.createScriptProcessor(2048, 1, 1);
        scriptNode.onaudioprocess = (e) => handleAudioData(e.inputBuffer.getChannelData(0));
        micSrc.connect(scriptNode);
        scriptNode.connect(c.destination);
      }

      scopeStart(micSrc, false, modeSelect.value === 'ultrasound');

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
          say($('recStatus'), `Aufnahme ${t} – Warte auf Chirp-Startsignal...`);
        } else {
          say(
            $('recStatus'),
            `Aufnahme ${t} – Empfange: ${rx.lines.size}/${rx.total} Pakete (${rx.mode.label})`
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

    say($('recStatus'), 'Decodieren & Fehlerkorrektur (Reed-Solomon)...');
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
    $('recTag').textContent = 'Audio laden...';
    say($('recStatus'), `Lade Audiodatei "${f.name}"...`);

    try {
      const c = getCtx();
      const ab = await c.decodeAudioData(await f.arrayBuffer());
      say($('recStatus'), 'Signal wird decodiert...');
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
          throw new Error('Daten sind komprimiert, aber dieser Browser kann nicht entpacken (DecompressionStream fehlt).');
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
    say($('recStatus'), 'Erfolgreich übertragen & verifiziert!', 'ok');
    $('recTag').textContent = 'Erfolg';

    const modeLabel = r.mode ? r.mode.toUpperCase() : 'BALANCED';
    $('resultInfo').innerHTML = `
      <strong>${escapeHtml(r.name)}</strong> (${fmtSize(r.data.length)})
      <div class="hint-small" style="margin-top:4px;">
        Modus: <b>${modeLabel}</b> &bull; ${r.linesGot}/${r.linesTotal} Pakete empfangen &bull;
        ${r.fixedBytes > 0 ? `<span style="color:var(--good);">${r.fixedBytes} beschädigte Bytes durch Reed-Solomon repariert!</span>` : '0 Fehler'}
      </div>
    `;

    const a = $('download');
    if (a.href.startsWith('blob:')) URL.revokeObjectURL(a.href);
    const ext = (r.name.split('.').pop() || '').toLowerCase();
    // SVG only renders in <img> with the right MIME type
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
})();
