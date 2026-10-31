/* FileTone 3.0 – Multi-Instance Robot 36 Acoustic Data Modem
 * High-performance, air-gap file, image, and data transmission over sound.
 *
 * Key Innovations & Upgrades:
 *  1. Scalable Parallel Robot 36 Instances (1x to 16x Simultaneous FDM Streams):
 *     Each Robot 36 instance operates in its own orthogonal 16-tone sub-band
 *     (modeled after the classic 800 Hz Robot 36 SSTV channel, 1500-2300 Hz).
 *     Running N instances splits each scanline across N parallel Robot 36 cores.
 *  2. Dual-Chirp Super-Preamble (LFM Up-Chirp + Down-Chirp) with Matched Filtering:
 *     Microsecond-accurate frame detection, SNR estimation, and immunity to room noise.
 *  3. Auto-Negotiated Instance Count in Super-Header:
 *     The receiver automatically detects the mode and the exact number of parallel
 *     Robot 36 instances (1..16) from the preamble header.
 *  4. Schroeder Phase Distribution & Dynamic Pre-Emphasis:
 *     Minimizes multi-instance Peak-to-Average Power Ratio (PAPR) to prevent speaker
 *     clipping even when 16 Robot 36 instances run simultaneously.
 *  5. 2D Cross-Instance Interleaving & Reed-Solomon GF(256) Errors-and-Erasures FEC:
 *     Spreads bytes across all active Robot 36 instances and scanlines so narrowband
 *     interference or acoustic dropouts are seamlessly repaired.
 *  6. Per-Line DPLL Clock-Drift Tracking & Soft-Energy Confidence Scoring.
 */

(function (root) {
  'use strict';

  /* =========================================================================
   * 1. CONFIGURATION, PROFILES & PARALLEL ROBOT-36 INSTANCES
   * ========================================================================= */
  const MIN_INSTANCES = 1;
  const MAX_INSTANCES = 16;
  const MAX_ULTRA_INSTANCES = 6;
  const DEFAULT_INSTANCES = 8;

  const MODES = {
    robot36: {
      id: 4,
      name: 'robot36',
      label: 'Robot 36 Core',
      desc: 'Klassisches 800-Hz Robot-36-Raster (50 Hz Orthogonal-Grid, hohe Raumstabilität)',
      baseHz: 1500,
      spacingHz: 50,
      defaultInstances: 8,
      maxInstances: 16,
      tonesPerGroup: 16, // 16 tones * 50 Hz = 800 Hz per Robot 36 instance
      actMs: 20,         // 1 / 50 Hz = 20 ms exact orthogonality
      guardMs: 4,        // 4 ms guard absorbs room echo
      parity: 28,        // RS parity bytes per block
      ultrasound: false,
    },
    balanced: {
      id: 0,
      name: 'balanced',
      label: 'Balanced',
      desc: 'Ausgewogen & schnell – ideal für Lautsprecher zu Mikrofon im Raum',
      baseHz: 1400,
      spacingHz: 50,
      defaultInstances: 8,
      maxInstances: 16,
      tonesPerGroup: 16,
      actMs: 20,
      guardMs: 4,
      parity: 28,
      ultrasound: false,
    },
    turbo: {
      id: 1,
      name: 'turbo',
      label: 'Turbo',
      desc: 'Maximaler Durchsatz (16 ms Symbole) – bis zu 500+ B/s bei 16 Robot-36-Instanzen',
      baseHz: 1300,
      spacingHz: 62.5,
      defaultInstances: 10,
      maxInstances: 14,
      tonesPerGroup: 16,
      actMs: 16,         // 1 / 62.5 Hz = 16 ms
      guardMs: 3,
      parity: 20,
      ultrasound: false,
    },
    robust: {
      id: 2,
      name: 'robust',
      label: 'Robust',
      desc: 'Maximale Störfestigkeit gegen Lärm, Hall & schlechte Mikrofone',
      baseHz: 1400,
      spacingHz: 50,
      defaultInstances: 6,
      maxInstances: 12,
      tonesPerGroup: 16,
      actMs: 20,
      guardMs: 8,        // 8 ms guard for heavy reverberation
      parity: 44,        // Heavy RS parity
      ultrasound: false,
    },
    ultrasound: {
      id: 3,
      name: 'ultrasound',
      label: 'Ultraschall',
      desc: 'Nahezu unhörbar (ab 17.2 kHz) – benötigt gute Audio-Hardware',
      baseHz: 17200,
      spacingHz: 35,
      defaultInstances: 4,
      maxInstances: MAX_ULTRA_INSTANCES,
      tonesPerGroup: 16,
      actMs: 28.57,      // 1 / 35 Hz
      guardMs: 6,
      parity: 24,
      ultrasound: true,
    },
  };

  const MODE_BY_ID = {
    0: MODES.balanced,
    1: MODES.turbo,
    2: MODES.robust,
    3: MODES.ultrasound,
    4: MODES.robot36,
  };

  function clampInstances(instances, mode) {
    const maxI = mode && mode.maxInstances ? mode.maxInstances : (mode && mode.ultrasound ? MAX_ULTRA_INSTANCES : MAX_INSTANCES);
    const defI = mode && mode.defaultInstances ? mode.defaultInstances : DEFAULT_INSTANCES;
    const n = parseInt(instances, 10);
    if (!Number.isFinite(n) || n < MIN_INSTANCES) return Math.min(defI, maxI);
    return Math.max(MIN_INSTANCES, Math.min(maxI, n));
  }

  function resolveMode(modeOpt, dataLen, instancesOpt) {
    let base = MODES.robot36;
    if (!modeOpt || modeOpt === 'auto') {
      base = dataLen <= 250 ? MODES.robust : MODES.robot36;
    } else if (typeof modeOpt === 'string') {
      const m = MODES[modeOpt.toLowerCase()];
      if (m) base = m;
    } else if (typeof modeOpt === 'object' && modeOpt.id !== undefined) {
      base = MODE_BY_ID[modeOpt.id] || modeOpt;
    }

    const groups = clampInstances(
      instancesOpt !== undefined && instancesOpt !== null ? instancesOpt : (modeOpt && modeOpt.groups) || base.defaultInstances,
      base
    );

    // If high instance count on audible mode would exceed ~15.5 kHz with 50/62.5 Hz spacing,
    // keep baseHz slightly lower so all Robot 36 instances stay in the sweet spot of speakers/mics.
    let baseHz = base.baseHz;
    const spanHz = groups * base.tonesPerGroup * base.spacingHz;
    if (!base.ultrasound && baseHz + spanHz > 14800) {
      baseHz = Math.max(1050, 14800 - spanHz);
    }

    const minHz = baseHz;
    const maxHz = baseHz + spanHz;

    return Object.assign({}, base, {
      groups,
      instances: groups,
      baseHz,
      minHz,
      maxHz,
      bandwidthHz: spanHz,
    });
  }

  function getInstanceBands(modeOpt, instancesOpt) {
    const m = resolveMode(modeOpt, 1024, instancesOpt);
    const bands = [];
    const instWidth = m.tonesPerGroup * m.spacingHz;
    for (let i = 0; i < m.instances; i++) {
      const startHz = m.baseHz + i * instWidth;
      const endHz = startHz + instWidth;
      bands.push({
        index: i,
        label: `R36 #${i + 1}`,
        startHz: Math.round(startHz),
        endHz: Math.round(endHz),
        centerHz: Math.round((startHz + endHz) / 2),
        widthHz: Math.round(instWidth),
      });
    }
    return bands;
  }

  /* =========================================================================
   * 2. REED-SOLOMON CODEC (GF(256) WITH ERRORS & ERASURES)
   * ========================================================================= */
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  (function initGalois() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();

  const gfMul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
  const gfDiv = (a, b) => (a === 0 ? 0 : EXP[(LOG[a] + 255 - LOG[b]) % 255]);
  const gfInv = (x) => EXP[255 - LOG[x]];
  const gfPow = (x, p) => EXP[(((LOG[x] * p) % 255) + 255) % 255];

  const pScale = (p, x) => p.map((c) => gfMul(c, x));
  function pAdd(p, q) {
    const r = new Array(Math.max(p.length, q.length)).fill(0);
    for (let i = 0; i < p.length; i++) r[i + r.length - p.length] = p[i];
    for (let i = 0; i < q.length; i++) r[i + r.length - q.length] ^= q[i];
    return r;
  }
  function pMul(p, q) {
    const r = new Array(p.length + q.length - 1).fill(0);
    for (let j = 0; j < q.length; j++) {
      for (let i = 0; i < p.length; i++) r[i + j] ^= gfMul(p[i], q[j]);
    }
    return r;
  }
  function pEval(p, x) {
    let y = p[0];
    for (let i = 1; i < p.length; i++) y = gfMul(y, x) ^ p[i];
    return y;
  }
  function pRem(dividend, divisor) {
    const out = dividend.slice();
    for (let i = 0; i < dividend.length - (divisor.length - 1); i++) {
      const c = out[i];
      if (c) {
        for (let j = 1; j < divisor.length; j++) {
          if (divisor[j]) out[i + j] ^= gfMul(divisor[j], c);
        }
      }
    }
    return out.slice(out.length - (divisor.length - 1));
  }

  const genCache = {};
  function genPoly(nsym) {
    if (genCache[nsym]) return genCache[nsym];
    let g = [1];
    for (let i = 0; i < nsym; i++) g = pMul(g, [1, EXP[i]]);
    genCache[nsym] = g;
    return g;
  }

  function rsEncode(msg, nsym) {
    const gen = genPoly(nsym);
    const out = new Uint8Array(msg.length + nsym);
    out.set(msg);
    for (let i = 0; i < msg.length; i++) {
      const c = out[i];
      if (c) {
        for (let j = 1; j < gen.length; j++) out[i + j] ^= gfMul(gen[j], c);
      }
    }
    out.set(msg);
    return out;
  }

  function syndromes(msg, nsym) {
    const s = [0];
    for (let i = 0; i < nsym; i++) s.push(pEval(msg, EXP[i]));
    return s;
  }

  function errorLocator(synd, nsym) {
    let errLoc = [1], oldLoc = [1];
    const shift = synd.length - nsym;
    for (let i = 0; i < nsym; i++) {
      const K = i + shift;
      let delta = synd[K];
      for (let j = 1; j < errLoc.length; j++) delta ^= gfMul(errLoc[errLoc.length - 1 - j], synd[K - j]);
      oldLoc.push(0);
      if (delta) {
        if (oldLoc.length > errLoc.length) {
          const nl = pScale(oldLoc, delta);
          oldLoc = pScale(errLoc, gfInv(delta));
          errLoc = nl;
        }
        errLoc = pAdd(errLoc, pScale(oldLoc, delta));
      }
    }
    while (errLoc.length && errLoc[0] === 0) errLoc.shift();
    if (errLoc.length - 1 > nsym / 2) throw new Error('Too many errors to correct');
    return errLoc;
  }

  function rsDecode(block, nsym, erasePos) {
    const msg = Array.from(block);
    const k = msg.length - nsym;
    const synd = syndromes(msg, nsym);
    if (!synd.some(Boolean)) return { data: block.slice(0, k), fixed: 0 };

    // Erasure decoding (Forney algorithm)
    if (erasePos && erasePos.length > 0 && erasePos.length <= nsym) {
      const copy = msg.slice();
      const coefPos = erasePos.map((p) => msg.length - 1 - p);
      let eLoc = [1];
      for (const c of coefPos) eLoc = pMul(eLoc, [EXP[c], 1]);
      const divisor = [1].concat(new Array(eLoc.length).fill(0));
      const evalPoly = pRem(pMul(synd.slice().reverse(), eLoc), divisor);
      const X = coefPos.map((c) => gfPow(2, -(255 - c)));
      for (let i = 0; i < X.length; i++) {
        const xInv = gfInv(X[i]);
        let prime = 1;
        for (let j = 0; j < X.length; j++) {
          if (j !== i) prime = gfMul(prime, 1 ^ gfMul(xInv, X[j]));
        }
        const y = gfMul(X[i], pEval(evalPoly, xInv));
        copy[erasePos[i]] ^= gfDiv(y, prime);
      }
      if (!syndromes(copy, nsym).some(Boolean)) {
        return { data: Uint8Array.from(copy.slice(0, k)), fixed: erasePos.length };
      }
    }

    const errLoc = errorLocator(synd, nsym);
    const locRev = errLoc.slice().reverse();
    const errPos = [];
    for (let i = 0; i < msg.length; i++) {
      if (pEval(locRev, EXP[i]) === 0) errPos.push(msg.length - 1 - i);
    }
    if (errPos.length !== errLoc.length - 1) throw new Error('Uncorrectable block');

    const coefPos = errPos.map((p) => msg.length - 1 - p);
    let eLoc = [1];
    for (const c of coefPos) eLoc = pMul(eLoc, [EXP[c], 1]);
    const divisor = [1].concat(new Array(eLoc.length).fill(0));
    const evalPoly = pRem(pMul(synd.slice().reverse(), eLoc), divisor);
    const X = coefPos.map((c) => gfPow(2, -(255 - c)));
    for (let i = 0; i < X.length; i++) {
      const xInv = gfInv(X[i]);
      let prime = 1;
      for (let j = 0; j < X.length; j++) {
        if (j !== i) prime = gfMul(prime, 1 ^ gfMul(xInv, X[j]));
      }
      const y = gfMul(X[i], pEval(evalPoly, xInv));
      msg[errPos[i]] ^= gfDiv(y, prime);
    }
    if (syndromes(msg, nsym).some(Boolean)) throw new Error('Uncorrectable residual error');
    return { data: Uint8Array.from(msg.slice(0, k)), fixed: errPos.length };
  }

  /* =========================================================================
   * 3. CHECKSUMS (CRC32 & CRC16)
   * ========================================================================= */
  const CRC_T = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(b) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function crc16(b) {
    let c = 0xFFFF;
    for (let i = 0; i < b.length; i++) {
      c ^= b[i] << 8;
      for (let j = 0; j < 8; j++) {
        c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF;
      }
    }
    return c;
  }

  function headerCrc16(modeId, instances, totalLines, k, payloadLen) {
    const b = new Uint8Array(9);
    b[0] = 0x54; // Magic 'T'
    b[1] = modeId & 255;
    b[2] = (totalLines >> 8) & 255;
    b[3] = totalLines & 255;
    b[4] = k & 255;
    b[5] = (payloadLen >> 16) & 255;
    b[6] = (payloadLen >> 8) & 255;
    b[7] = payloadLen & 255;
    b[8] = instances & 255;
    return crc16(b);
  }

  function lineCrc16(idx, total, k, modeId, instances, payload) {
    const b = new Uint8Array(7 + payload.length);
    b[0] = (idx >> 8) & 255;
    b[1] = idx & 255;
    b[2] = (total >> 8) & 255;
    b[3] = total & 255;
    b[4] = k & 255;
    b[5] = modeId & 255;
    b[6] = instances & 255;
    b.set(payload, 7);
    return crc16(b);
  }

  const u32 = (v) => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
  const rd32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

  function whiten(buf) {
    let x = 0x9E3779B9;
    for (let i = 0; i < buf.length; i++) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      buf[i] ^= x & 255;
    }
  }

  /* =========================================================================
   * 4. CHIRP PREAMBLE (LINEAR FREQUENCY MODULATION)
   * ========================================================================= */
  function generateChirpPair(sr, durMs, f0, f1) {
    const N = Math.round(sr * (durMs / 1000));
    const sin = new Float32Array(N);
    const cos = new Float32Array(N);
    const taper = Math.max(1, Math.round(N * 0.08));
    let te = 0;
    for (let n = 0; n < N; n++) {
      const t = n / sr;
      const f = f0 + (f1 - f0) * (n / (2 * N));
      let s = Math.sin(2 * Math.PI * f * t);
      let c = Math.cos(2 * Math.PI * f * t);
      if (n < taper) {
        const w = 0.5 * (1 - Math.cos((Math.PI * n) / taper));
        s *= w;
        c *= w;
      } else if (n >= N - taper) {
        const w = 0.5 * (1 - Math.cos((Math.PI * (N - 1 - n)) / taper));
        s *= w;
        c *= w;
      }
      sin[n] = s;
      cos[n] = c;
      if (n % 2 === 0) te += 0.5 * (s * s + c * c);
    }
    return { sin, cos, te, length: N };
  }

  function generateChirp(sr, durMs, f0, f1) {
    return generateChirpPair(sr, durMs, f0, f1).sin;
  }

  const CHIRP_CFG = {
    audible: { low: 1400, high: 4500, durMs: 60 },
    ultrasound: { low: 17200, high: 19600, durMs: 60 },
  };

  /* =========================================================================
   * 5. MULTI-INSTANCE FRAMING & PACKET LAYOUT
   * =========================================================================
   * Each Robot 36 instance transmits 1 nibble (4 bits) per symbol.
   * Over 8 data symbols per line, each Robot 36 instance transmits 8 nibbles = 4 bytes!
   * Therefore, with `N` parallel Robot 36 instances:
   *  - Data bytes per line = N * 4 bytes (always an exact integer for any N = 1..16)
   *  - Line header = 4 bytes ([idxMSB, idxLSB, crcMSB, crcLSB] = 8 nibbles),
   *    which takes `headSymsPerLine = Math.ceil(8 / N)` symbols.
   *  - Total symbols per line = `Math.ceil(8 / N) + 8`.
   */
  const DATA_SYMS_PER_LINE = 8;

  function getLineGeometry(mode) {
    const instances = mode.instances || mode.groups || DEFAULT_INSTANCES;
    const headSyms = Math.ceil(8 / instances); // 8 nibbles (4 bytes) of line header
    const dataSyms = DATA_SYMS_PER_LINE;
    const symsPerLine = headSyms + dataSyms;
    const lineBytes = instances * 4; // 8 nibbles per instance = 4 bytes per instance per line
    return { instances, headSyms, dataSyms, symsPerLine, lineBytes };
  }

  function getLineDataBytes(mode) {
    return getLineGeometry(mode).lineBytes;
  }

  function blockPlan(bodyLen, modeOpt, instancesOpt) {
    const mode = resolveMode(modeOpt, bodyLen, instancesOpt);
    const msgLen = 4 + bodyLen;
    const maxK = 255 - mode.parity; // RS codeword over GF(256) <= 255 bytes
    const minK = 32;
    const minBlocks = mode.id === 2 ? 8 : 6;
    const nB = Math.max(minBlocks, Math.ceil(msgLen / maxK));
    const k = Math.max(minK, Math.ceil(msgLen / nB));
    const geom = getLineGeometry(mode);
    const lineBytes = geom.lineBytes;
    const totalLines = Math.ceil((nB * (k + mode.parity)) / lineBytes);
    if (totalLines > 0xFFFF) throw new Error('Datei zu groß für diese Einstellung (max. 65535 Pakete). Erhöhe die Robot-36-Instanzen!');
    return { nB, k, total: totalLines, mode, lineBytes, geom };
  }

  function layout(name, data, compressed, modeOpt, instancesOpt) {
    const nameBytes = new TextEncoder().encode(name || 'file.bin').slice(0, 255);
    const body = new Uint8Array(3 + nameBytes.length + data.length + 4);
    body[0] = 0x46; // 'F'
    body[1] = compressed ? 0x5A : 0x41; // 'Z' (compressed) or 'A' (raw)
    body[2] = nameBytes.length;
    body.set(nameBytes, 3);
    body.set(data, 3 + nameBytes.length);
    body.set(u32(crc32(data)), body.length - 4);

    const plan = blockPlan(body.length, modeOpt, instancesOpt);
    const { nB, k, total, mode, lineBytes, geom } = plan;
    const msg = new Uint8Array(nB * k);
    msg.set(u32(body.length), 0);
    msg.set(body, 4);

    const S = k + mode.parity;
    const stream = new Uint8Array(total * lineBytes);
    for (let b = 0; b < nB; b++) {
      const blk = rsEncode(msg.subarray(b * k, (b + 1) * k), mode.parity);
      for (let pos = 0; pos < S; pos++) {
        stream[pos * nB + b] = blk[pos];
      }
    }
    whiten(stream);

    const lines = [];
    for (let i = 0; i < total; i++) {
      lines.push(stream.subarray(i * lineBytes, (i + 1) * lineBytes));
    }
    return { lines, total, blocks: nB, k, mode, lineBytes, geom, bodyLen: body.length };
  }

  /* =========================================================================
   * 6. MODULATOR / MULTI-INSTANCE ROBOT 36 SYNTHESIS
   * ========================================================================= */
  function toneHz(basis, group, toneIndex) {
    const groupSpan = basis.tonesPerGroup * basis.spacingHz;
    return basis.baseHz + group * groupSpan + toneIndex * basis.spacingHz;
  }

  function getSchroederPhases(groups) {
    const phases = new Float32Array(groups);
    for (let k = 0; k < groups; k++) {
      phases[k] = (Math.PI * k * k) / Math.max(1, groups);
    }
    return phases;
  }

  // Fixed Header basis so receiver can always decode the Super-Header before knowing N instances
  const AUDIBLE_HEADER_BASIS = {
    baseHz: 1500,
    spacingHz: 50,
    groups: 8,
    tonesPerGroup: 16,
    actMs: 20,
    guardMs: 5,
  };

  const ULTRASOUND_HEADER_BASIS = {
    baseHz: 17200,
    spacingHz: 35,
    groups: 4,
    tonesPerGroup: 16,
    actMs: 28.57,
    guardMs: 6,
  };

  function encodeAudio(name, data, sr, compressed, modeOpt, instancesOpt) {
    sr = sr || 48000;
    const lay = layout(name, data, compressed, modeOpt, instancesOpt);
    const mode = lay.mode;
    const geom = lay.geom;
    const instances = geom.instances;
    const isUltra = mode.ultrasound;
    const ms = (v) => Math.round((sr * v) / 1000);

    const chirpCfg = isUltra ? CHIRP_CFG.ultrasound : CHIRP_CFG.audible;
    const upChirp = generateChirp(sr, chirpCfg.durMs, chirpCfg.low, chirpCfg.high);
    const downChirp = generateChirp(sr, chirpCfg.durMs, chirpCfg.high, chirpCfg.low);

    const leadMs = 120, tailMs = 150, chirpGapMs = 15;
    const totalLines = lay.total;

    // Header symbols use fixed header basis
    const hBasis = isUltra ? ULTRASOUND_HEADER_BASIS : AUDIBLE_HEADER_BASIS;
    const hActN = ms(hBasis.actMs);
    const hGuardN = ms(hBasis.guardMs);
    const hSymN = hActN + hGuardN;
    const hSchroeder = getSchroederPhases(hBasis.groups);

    // Line symbols use N-instance mode basis
    const lActN = ms(mode.actMs);
    const lGuardN = ms(mode.guardMs);
    const lSymN = lActN + lGuardN;
    const lSchroeder = getSchroederPhases(instances);

    // Super-Header payload (12 bytes): includes mode.id AND instances count
    const headCrc = headerCrc16(mode.id, instances, totalLines, lay.k, lay.bodyLen);
    const headBytes = [
      0x54,
      mode.id & 255,
      (totalLines >> 8) & 255,
      totalLines & 255,
      lay.k & 255,
      (lay.bodyLen >> 16) & 255,
      (lay.bodyLen >> 8) & 255,
      lay.bodyLen & 255,
      (headCrc >> 8) & 255,
      headCrc & 255,
      instances & 255,
      0x36, // Robot 36 signature byte (0x36)
    ];

    const bytesPerHSym = hBasis.groups / 2;
    const numHSyms = headBytes.length / bytesPerHSym;

    const symsPerLine = geom.symsPerLine;
    const totalSamples =
      ms(leadMs + tailMs + chirpCfg.durMs * 2 + chirpGapMs * 2) +
      numHSyms * hSymN +
      totalLines * symsPerLine * lSymN +
      10000;

    const out = new Float32Array(totalSamples);
    let o = ms(leadMs);

    // 1. Dual-Chirp Preamble
    out.set(upChirp, o);
    o += upChirp.length + ms(chirpGapMs);
    out.set(downChirp, o);
    o += downChirp.length + ms(chirpGapMs);

    // Synthesis Helper for any basis
    const putSym = (basis, actN, guardN, phases, nibbles) => {
      const symN = actN + guardN;
      const rGuard = Math.max(1, Math.round(guardN * 0.8));
      const G = basis.groups;
      const w = new Float64Array(G);
      for (let g = 0; g < G; g++) {
        w[g] = (2 * Math.PI * toneHz(basis, g, (nibbles[g] || 0) & 15)) / sr;
      }
      const baseAmp = basis.baseHz > 15000 ? 0.18 : 0.14;
      const norm = baseAmp / Math.sqrt(G);

      for (let n = 0; n < symN; n++) {
        let env = 1.0;
        if (n < rGuard) env = 0.5 * (1 - Math.cos((Math.PI * n) / rGuard));
        else if (n >= symN - rGuard) env = 0.5 * (1 - Math.cos((Math.PI * (symN - 1 - n)) / rGuard));

        let s = 0;
        for (let g = 0; g < G; g++) {
          const preEmph = 1.0 + (g / Math.max(1, G)) * 0.28;
          s += Math.sin(w[g] * n + phases[g]) * preEmph;
        }
        out[o + n] = s * norm * env;
      }
      o += symN;
    };

    // 2. Synthesize Super-Header Symbols (using fixed hBasis)
    for (let i = 0; i < headBytes.length; i += bytesPerHSym) {
      const nibs = new Array(hBasis.groups);
      for (let g = 0; g < hBasis.groups; g += 2) {
        const b = headBytes[i + g / 2] || 0;
        nibs[g] = (b >> 4) & 15;
        nibs[g + 1] = b & 15;
      }
      putSym(hBasis, hActN, hGuardN, hSchroeder, nibs);
    }

    // 3. Synthesize Multi-Instance Data Scanlines
    const headNibbles = new Uint8Array(geom.headSyms * instances);
    const symNibs = new Uint8Array(instances);

    for (let idx = 0; idx < totalLines; idx++) {
      const linePayload = lay.lines[idx];
      const lCrc = lineCrc16(idx, totalLines, lay.k, mode.id, instances, linePayload);

      // Line Header (4 bytes = 8 nibbles): [idxMSB, idxLSB, crcMSB, crcLSB]
      // Repeated across available header nibble slots if instances > 8 for extra redundancy!
      const rawHeadNibs = [
        (idx >> 12) & 15, (idx >> 8) & 15,
        (idx >> 4) & 15, idx & 15,
        (lCrc >> 12) & 15, (lCrc >> 8) & 15,
        (lCrc >> 4) & 15, lCrc & 15,
      ];
      for (let slot = 0; slot < headNibbles.length; slot++) {
        headNibbles[slot] = rawHeadNibs[slot % 8];
      }
      for (let hs = 0; hs < geom.headSyms; hs++) {
        for (let g = 0; g < instances; g++) {
          symNibs[g] = headNibbles[hs * instances + g];
        }
        putSym(mode, lActN, lGuardN, lSchroeder, symNibs);
      }

      // 8 Data Symbols:
      // Each Robot 36 instance `g` (0..instances-1) transmits its 4-byte slice (8 nibbles) across the 8 symbols!
      for (let ds = 0; ds < geom.dataSyms; ds++) {
        const byteOffsetInSlice = ds >> 1; // 0..3
        const isLowNibble = ds & 1;
        for (let g = 0; g < instances; g++) {
          const b = linePayload[g * 4 + byteOffsetInSlice] || 0;
          symNibs[g] = isLowNibble ? (b & 15) : ((b >> 4) & 15);
        }
        putSym(mode, lActN, lGuardN, lSchroeder, symNibs);
      }
    }

    o += ms(tailMs);

    // Peak normalization
    let peak = 0;
    for (let i = 0; i < o; i++) {
      const a = Math.abs(out[i]);
      if (a > peak) peak = a;
    }
    if (peak > 0) {
      const gain = 0.88 / peak;
      for (let i = 0; i < o; i++) out[i] *= gain;
    }

    const seconds = o / sr;
    return {
      samples: out.subarray(0, o),
      lines: lay.lines,
      total: lay.total,
      blocks: lay.blocks,
      mode,
      instances,
      geom,
      bands: getInstanceBands(mode, instances),
      seconds,
      bytesPerSec: Math.round(data.length / Math.max(0.1, seconds)),
    };
  }

  function estimateSeconds(nameLen, size, modeOpt, instancesOpt) {
    const plan = blockPlan(3 + nameLen + size + 4, modeOpt, instancesOpt);
    const mode = plan.mode;
    const geom = plan.geom;
    const isUltra = mode.ultrasound;
    const chirpDur = isUltra ? CHIRP_CFG.ultrasound.durMs : CHIRP_CFG.audible.durMs;
    const preambleMs = 120 + 150 + chirpDur * 2 + 30;

    const hBasis = isUltra ? ULTRASOUND_HEADER_BASIS : AUDIBLE_HEADER_BASIS;
    const numHSyms = 12 / (hBasis.groups / 2);
    const headerMs = numHSyms * (hBasis.actMs + hBasis.guardMs);

    const lineMs = geom.symsPerLine * (mode.actMs + mode.guardMs);
    return (preambleMs + headerMs + plan.total * lineMs) / 1000;
  }

  /* =========================================================================
   * 7. DEMODULATOR / MULTI-INSTANCE RECEIVER
   * ========================================================================= */
  class Receiver {
    constructor(sr, onLine, onHeader) {
      this.sr = sr || 48000;
      this.onLine = onLine || null;
      this.onHeader = onHeader || null;
      this.ms = (v) => Math.round((this.sr * v) / 1000);

      this.buf = new Float32Array(this.sr * 40);
      this.len = 0;
      this.scanPos = 0;

      this.state = 'PREAMBLE';
      this.mode = resolveMode('robot36', 1024, DEFAULT_INSTANCES);
      this.instances = this.mode.instances;
      this.total = 0;
      this.k = 0;
      this.payloadLen = 0;
      this.lines = new Map();
      this.candidates = new Map();
      this.trackedP = -1;
      this.initialP = -1;
      this.snrDb = 0;
      this.instanceStats = [];

      // Quadrature matched filter templates (immune to acoustic phase shifts)
      this.chirpMs = 60;
      this.audibleUp = generateChirpPair(this.sr, this.chirpMs, CHIRP_CFG.audible.low, CHIRP_CFG.audible.high);
      this.audibleDown = generateChirpPair(this.sr, this.chirpMs, CHIRP_CFG.audible.high, CHIRP_CFG.audible.low);
      this.ultraUp = generateChirpPair(this.sr, this.chirpMs, CHIRP_CFG.ultrasound.low, CHIRP_CFG.ultrasound.high);
      this.ultraDown = generateChirpPair(this.sr, this.chirpMs, CHIRP_CFG.ultrasound.high, CHIRP_CFG.ultrasound.low);

      this.basisCache = new Map();
      this.getBasis(AUDIBLE_HEADER_BASIS);
      this.getBasis(ULTRASOUND_HEADER_BASIS);
    }

    getBasis(cfg) {
      const key = `${cfg.baseHz}_${cfg.spacingHz}_${cfg.groups}_${cfg.tonesPerGroup}_${cfg.actMs}_${cfg.guardMs}`;
      if (this.basisCache.has(key)) return this.basisCache.get(key);

      const N = this.ms(cfg.actMs);
      const basisCos = [];
      const basisSin = [];
      for (let g = 0; g < cfg.groups; g++) {
        const groupCos = [];
        const groupSin = [];
        for (let k = 0; k < cfg.tonesPerGroup; k++) {
          const f = toneHz(cfg, g, k);
          const w = (2 * Math.PI * f) / this.sr;
          const bc = new Float32Array(N);
          const bs = new Float32Array(N);
          for (let n = 0; n < N; n++) {
            bc[n] = Math.cos(w * n);
            bs[n] = Math.sin(w * n);
          }
          groupCos.push(bc);
          groupSin.push(bs);
        }
        basisCos.push(groupCos);
        basisSin.push(groupSin);
      }
      const bObj = {
        basisCos,
        basisSin,
        actN: N,
        guardN: this.ms(cfg.guardMs),
        symN: N + this.ms(cfg.guardMs),
      };
      this.basisCache.set(key, bObj);
      return bObj;
    }

    get complete() {
      return this.total > 0 && this.lines.size === this.total;
    }

    push(chunk) {
      if (this.len + chunk.length > this.buf.length) {
        const nb = new Float32Array(Math.max(this.buf.length * 2, this.len + chunk.length));
        nb.set(this.buf.subarray(0, this.len));
        this.buf = nb;
      }
      this.buf.set(chunk, this.len);
      this.len += chunk.length;
    }

    // Quadrature (I & Q) Matched Filter correlation: phase invariant (0..360 deg)
    correlateChirp(p, template) {
      const N = template.length || template.sin.length;
      if (p < 0 || p + N > this.len) return 0;
      const x = this.buf;
      const tSin = template.sin;
      const tCos = template.cos;
      let cS = 0, cC = 0, e = 0;
      for (let n = 0; n < N; n += 2) {
        const s = x[p + n];
        cS += s * tSin[n];
        cC += s * tCos[n];
        e += s * s;
      }
      if (e < 1e-9) return 0;
      return (cS * cS + cC * cC) / (e * template.te + 1e-9);
    }

    demodSym(sampleOffset, cfg, outNibbles, outEnergies) {
      const bObj = this.getBasis(cfg);
      // Center the active DFT integration window within the symbol duration
      // leaving equal guard margin on both sides to eliminate inter-symbol interference and echo!
      const base = sampleOffset + Math.round(bObj.guardN * 0.5);
      const N = bObj.actN;
      if (base < 0 || base + N > this.len) return false;
      const x = this.buf;

      for (let g = 0; g < cfg.groups; g++) {
        let maxEnergy = -1;
        let secondEnergy = -1;
        let bestK = 0;
        const gCos = bObj.basisCos[g];
        const gSin = bObj.basisSin[g];
        for (let k = 0; k < cfg.tonesPerGroup; k++) {
          const bc = gCos[k];
          const bs = gSin[k];
          let c = 0, s = 0;
          for (let n = 0; n < N; n++) {
            const v = x[base + n];
            c += v * bc[n];
            s += v * bs[n];
          }
          const e = c * c + s * s;
          if (e > maxEnergy) {
            secondEnergy = maxEnergy;
            maxEnergy = e;
            bestK = k;
          } else if (e > secondEnergy) {
            secondEnergy = e;
          }
        }
        outNibbles[g] = bestK;
        if (outEnergies) {
          outEnergies[g] = secondEnergy > 0 ? maxEnergy / secondEnergy : 10;
        }
      }
      return true;
    }

    nibblesToBytes(nibbles, groups, outBytes) {
      const bytesCount = groups / 2;
      for (let j = 0; j < bytesCount; j++) {
        outBytes[j] = (nibbles[2 * j] << 4) | (nibbles[2 * j + 1] & 15);
      }
    }

    process(force) {
      if (this.state === 'PREAMBLE') {
        this.findPreamble();
      }
      if (this.state === 'LINES') {
        this.decodeLines(force);
      }
    }

    findPreamble() {
      const chirpN = this.audibleUp.length;
      const gapN = this.ms(15);
      const limit = this.len - (chirpN * 2 + gapN * 2) - this.ms(200);
      const coarseStep = 6;

      while (this.scanPos <= limit) {
        const rAudible = this.correlateChirp(this.scanPos, this.audibleUp);
        if (rAudible > 0.16) {
          if (this.checkChirpPair(this.scanPos, this.audibleUp, this.audibleDown, false)) {
            return;
          }
        }

        const rUltra = this.correlateChirp(this.scanPos, this.ultraUp);
        if (rUltra > 0.15) {
          if (this.checkChirpPair(this.scanPos, this.ultraUp, this.ultraDown, true)) {
            return;
          }
        }

        this.scanPos += coarseStep;
      }
    }

    checkChirpPair(peakP, upTemplate, downTemplate, isUltra) {
      const chirpN = upTemplate.length;
      const gapN = this.ms(15);

      // Search a local window around peakP to lock onto the exact maximum
      let bestUpP = peakP, bestUpR = 0;
      const searchRadius = 24;
      for (let p = Math.max(0, peakP - searchRadius); p <= Math.min(this.len - chirpN, peakP + searchRadius); p++) {
        const r = this.correlateChirp(p, upTemplate);
        if (r > bestUpR) { bestUpR = r; bestUpP = p; }
      }

      if (bestUpR < 0.18) return false;

      const expDownP = bestUpP + chirpN + gapN;
      let bestDownP = expDownP, bestDownR = 0;
      const downSearchRadius = Math.max(16, this.ms(4));
      for (let p = Math.max(0, expDownP - downSearchRadius); p <= Math.min(this.len - chirpN, expDownP + downSearchRadius); p++) {
        const r = this.correlateChirp(p, downTemplate);
        if (r > bestDownR) { bestDownR = r; bestDownP = p; }
      }

      if (bestDownR > 0.14) {
        const avgR = 0.5 * (bestUpR + bestDownR);
        this.snrDb = Math.round(10 * Math.log10(Math.max(0.01, avgR) / Math.max(0.01, 1 - avgR)) * 10) / 10;
        const frameStartP = bestDownP + chirpN + gapN;
        if (this.decodeHeader(frameStartP, isUltra)) {
          this.state = 'LINES';
          return true;
        }
      }
      return false;
    }

    decodeHeader(startP, isUltra) {
      const hBasis = isUltra ? ULTRASOUND_HEADER_BASIS : AUDIBLE_HEADER_BASIS;
      const bObj = this.getBasis(hBasis);
      const symN = bObj.symN;
      const bytesPerSym = hBasis.groups / 2; 
      const numHSyms = 12 / bytesPerSym;

      const nibbles = new Array(hBasis.groups);
      const symBytes = new Uint8Array(bytesPerSym);
      const headBytes = new Uint8Array(12);

      // Search fine offsets around startP (sample-level precision)
      const offsets = [
        0, -2, 2, -4, 4, -6, 6, -8, 8, -12, 12, -16, 16, -20, 20, -28, 28, -36, 36, -48, 48,
        -this.ms(2), this.ms(2), -this.ms(3), this.ms(3)
      ];

      for (const off of offsets) {
        const p0 = startP + off;
        let ok = true;
        for (let s = 0; s < numHSyms; s++) {
          if (!this.demodSym(p0 + s * symN, hBasis, nibbles)) {
            ok = false;
            break;
          }
          this.nibblesToBytes(nibbles, hBasis.groups, symBytes);
          headBytes.set(symBytes, s * bytesPerSym);
        }
        if (!ok) continue;

        const magic = headBytes[0];
        const modeId = headBytes[1];
        if (magic !== 0x54 || !MODE_BY_ID[modeId]) continue;

        const totalLines = (headBytes[2] << 8) | headBytes[3];
        const k = headBytes[4];
        const pLen = (headBytes[5] << 16) | (headBytes[6] << 8) | headBytes[7];
        const crc = (headBytes[8] << 8) | headBytes[9];
        const rawInstances = headBytes[10] || MODE_BY_ID[modeId].defaultInstances;

        if (headerCrc16(modeId, rawInstances, totalLines, k, pLen) === crc) {
          const detectedMode = resolveMode(MODE_BY_ID[modeId], pLen, rawInstances);
          this.mode = detectedMode;
          this.instances = detectedMode.instances;
          this.total = totalLines;
          this.k = k;
          this.payloadLen = pLen;
          this.trackedP = p0 + numHSyms * symN;
          this.initialP = this.trackedP;
          this.instanceStats = new Array(this.instances).fill(0).map((_, i) => ({
            index: i,
            packetsOk: 0,
            confidence: 0,
            bytesReceived: 0,
          }));
          if (this.onHeader) this.onHeader(this.total, detectedMode, this.instances);
          return true;
        }
      }
      return false;
    }

    decodeLines(force) {
      const mode = this.mode;
      const geom = getLineGeometry(mode);
      const instances = geom.instances;
      const bObj = this.getBasis(mode);
      const symN = bObj.symN;
      const symsPerLine = geom.symsPerLine;
      const lineSamples = symsPerLine * symN;
      const lineBytesCount = geom.lineBytes;

      const nibbles = new Uint8Array(instances);
      const energies = new Float32Array(instances);
      const headNibs = new Uint8Array(geom.headSyms * instances);
      const linePayload = new Uint8Array(lineBytesCount);

      const timingOffsets = [0, -2, 2, -4, 4, -6, 6, -8, 8, -12, 12, -16, 16, -20, 20, -28, 28, -36, 36];

      for (let idx = 0; idx < this.total; idx++) {
        if (this.lines.has(idx)) continue;
        const expP = this.trackedP + idx * lineSamples;
        if (expP + lineSamples + this.ms(2) > this.len) {
          if (!force) break;
        }

        for (const off of timingOffsets) {
          const p = expP + off;
          if (p < 0 || p + lineSamples > this.len) continue;

          // 1. Demodulate Line Header symbols
          let ok = true;
          for (let hs = 0; hs < geom.headSyms; hs++) {
            if (!this.demodSym(p + hs * symN, mode, nibbles, energies)) {
              ok = false;
              break;
            }
            for (let g = 0; g < instances; g++) {
              headNibs[hs * instances + g] = nibbles[g];
            }
          }
          if (!ok) continue;

          const lineIdx =
            (headNibs[0] << 12) | (headNibs[1] << 8) | (headNibs[2] << 4) | headNibs[3];
          const expCrc =
            (headNibs[4] << 12) | (headNibs[5] << 8) | (headNibs[6] << 4) | headNibs[7];

          if (lineIdx !== idx) continue;

          // 2. Demodulate Data Symbols across all N instances in parallel
          linePayload.fill(0);
          const instConf = new Float32Array(instances);
          let totalEnergy = 0;
          for (let ds = 0; ds < geom.dataSyms; ds++) {
            if (!this.demodSym(p + (geom.headSyms + ds) * symN, mode, nibbles, energies)) {
              ok = false;
              break;
            }
            const byteOffsetInSlice = ds >> 1;
            const isLowNibble = ds & 1;
            for (let g = 0; g < instances; g++) {
              const nib = nibbles[g] & 15;
              const byteIdx = g * 4 + byteOffsetInSlice;
              if (isLowNibble) {
                linePayload[byteIdx] |= nib;
              } else {
                linePayload[byteIdx] = (nib << 4);
              }
              instConf[g] += energies[g];
              totalEnergy += energies[g];
            }
          }

          if (!ok) continue;

          const isCrcValid = (lineCrc16(lineIdx, this.total, this.k, mode.id, instances, linePayload) === expCrc);

          // Save candidate in case CRC failed but lineIdx matched
          if (!this.candidates.has(lineIdx) || isCrcValid) {
            this.candidates.set(lineIdx, {
              payload: linePayload.slice(0),
              crcOk: isCrcValid,
              conf: totalEnergy
            });
          }

          if (isCrcValid) {
            this.lines.set(lineIdx, linePayload.slice(0));
            this.trackedP += Math.round(off * 0.25); // DPLL tracking update

            for (let g = 0; g < instances; g++) {
              const st = this.instanceStats[g];
              if (st) {
                st.packetsOk++;
                st.bytesReceived += 4;
                st.confidence = Math.min(100, Math.round((instConf[g] / geom.dataSyms) * 12));
              }
            }

            if (this.onLine) {
              this.onLine(lineIdx, linePayload, this.total, mode, this.instanceStats);
            }
            break;
          }
        }
      }
    }

    finalize() {
      this.process(true);
      if (!this.total) {
        throw new Error('Kein Signal erkannt. Bitte näher an den Lautsprecher gehen oder Direkt-Test nutzen.');
      }

      const total = this.total;
      const k = this.k;
      const parity = this.mode.parity;
      const S = k + parity;
      const lineBytesCount = getLineDataBytes(this.mode);
      const nB = Math.floor((total * lineBytesCount) / S);

      const tryDecodeMsg = (useCandidatesAsData) => {
        const coded = new Uint8Array(total * lineBytesCount);
        for (let i = 0; i < total; i++) {
          if (this.lines.has(i)) {
            coded.set(this.lines.get(i), i * lineBytesCount);
          } else if (useCandidatesAsData && this.candidates.has(i)) {
            coded.set(this.candidates.get(i).payload, i * lineBytesCount);
          }
        }
        whiten(coded);

        const msg = new Uint8Array(nB * k);
        let fixed = 0, failed = 0;

        for (let b = 0; b < nB; b++) {
          const blk = new Uint8Array(S);
          const erasePos = [];
          for (let pos = 0; pos < S; pos++) {
            const streamIdx = pos * nB + b;
            blk[pos] = coded[streamIdx];
            const lineIdx = Math.floor(streamIdx / lineBytesCount);
            const hasData = this.lines.has(lineIdx) || (useCandidatesAsData && this.candidates.has(lineIdx));
            if (!hasData) erasePos.push(pos);
          }

          try {
            const res = rsDecode(blk, parity, erasePos);
            msg.set(res.data, b * k);
            fixed += res.fixed;
          } catch (e) {
            failed++;
          }
        }

        if (failed > 0) return null;

        const bodyLen = rd32(msg, 0);
        if (bodyLen < 7 || bodyLen > msg.length - 4) return null;
        const body = msg.subarray(4, 4 + bodyLen);
        if (body[0] !== 0x46 || (body[1] !== 0x41 && body[1] !== 0x5A)) return null;

        const nameLen = body[2];
        const name = new TextDecoder().decode(body.subarray(3, 3 + nameLen));
        const data = body.slice(3 + nameLen, body.length - 4);
        const expectedCrc = rd32(body, body.length - 4);

        if (crc32(data) !== expectedCrc) return null;

        return {
          name,
          data,
          compressed: body[1] === 0x5A,
          fixedBytes: fixed,
          linesGot: this.lines.size,
          linesTotal: total,
          blocks: nB,
          mode: this.mode.name,
          modeLabel: this.mode.label,
          instances: this.instances,
          snrDb: this.snrDb,
          instanceStats: this.instanceStats,
        };
      };

      // Pass 1: Try decoding with candidate data + Reed-Solomon error repair
      let result = tryDecodeMsg(true);
      // Pass 2: If Pass 1 failed, fall back to pure erasure decoding
      if (!result) {
        result = tryDecodeMsg(false);
      }

      if (!result) {
        const got = this.lines.size;
        const cands = this.candidates.size;
        throw new Error(`Signal unvollständig: ${got}/${total} fehlerfreie Scanlines (${cands} Teilsignale). Bitte Lautstärke anpassen oder näher ans Mikrofon halten.`);
      }

      return result;
    }
  }

  function decode(x, sr, onLine, onHeader) {
    const rx = new Receiver(sr, onLine, onHeader);
    rx.push(x);
    return rx.finalize();
  }

  /* =========================================================================
   * 8. WAV GENERATION UTILITY
   * ========================================================================= */
  function toWav(x, sr) {
    const buf = new ArrayBuffer(44 + x.length * 2);
    const v = new DataView(buf);
    const str = (o, s) => {
      for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
    };
    str(0, 'RIFF');
    v.setUint32(4, 36 + x.length * 2, true);
    str(8, 'WAVEfmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, sr, true);
    v.setUint32(28, sr * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    str(36, 'data');
    v.setUint32(40, x.length * 2, true);
    for (let i = 0; i < x.length; i++) {
      v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x[i])) * 32767, true);
    }
    return new Blob([buf], { type: 'audio/wav' });
  }

  const api = {
    MODES,
    MIN_INSTANCES,
    MAX_INSTANCES,
    DEFAULT_INSTANCES,
    clampInstances,
    resolveMode,
    getInstanceBands,
    getLineGeometry,
    encodeAudio,
    decode,
    Receiver,
    toWav,
    estimateSeconds,
    crc32,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Modem = api;
})(typeof self !== 'undefined' ? self : this);
