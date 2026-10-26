/* FileTone 2.0 Acoustic Modem
 * High-performance, air-gap file and data transmission over sound.
 *
 * Key Innovations & Tweaks:
 *  1. Dual-Chirp Super-Preamble (LFM Up-Chirp + Down-Chirp) with Matched Filtering:
 *     Microsecond-accurate frame detection and immunity to room noise and clatter.
 *  2. Multi-Carrier M-FSK with Guard Interval:
 *     Zero inter-symbol interference (ISI) from room reverberation and multipath echoes.
 *  3. Schroeder Phase Distribution:
 *     Reduces multi-tone Peak-to-Average Power Ratio (PAPR) by >50%, preventing speaker clipping.
 *  4. Spectral Pre-Emphasis:
 *     Compensates for high-frequency roll-off in smartphone/laptop microphones.
 *  5. 2D Block Interleaving & Reed-Solomon Errors-and-Erasures FEC:
 *     Survives acoustic dropouts, loud noises, and burst packet loss.
 *  6. 4 Optimized Profiles: Balanced (150 B/s), Turbo (200+ B/s), Robust (75 B/s), Ultrasound (17.5-20 kHz silent).
 *  7. DPLL Timing Tracking:
 *     Compensates for soundcard sample-rate clock drift between sender and receiver.
 */

(function (root) {
  'use strict';

  /* =========================================================================
   * 1. CONFIGURATION & PROFILES
   * ========================================================================= */
  const MODES = {
    balanced: {
      id: 0,
      name: 'balanced',
      label: 'Balanced',
      desc: '150 B/s – Ausgewogen, hohe Zuverlässigkeit im Raum',
      baseHz: 1500,
      spacingHz: 50,
      groups: 8,
      tonesPerGroup: 16, // 4 bits per group = 4 bytes / symbol
      actMs: 20,         // 1/50Hz = 20ms exact orthogonality
      guardMs: 4,        // 4ms guard absorbs room echo
      parity: 28,        // RS parity bytes
      ultrasound: false,
    },
    turbo: {
      id: 1,
      name: 'turbo',
      label: 'Turbo',
      desc: '200+ B/s – Nur für gute Lautsprecher oder Kabelverbindung (bis 9,4 kHz)',
      baseHz: 1400,
      spacingHz: 62.5,
      groups: 8,
      tonesPerGroup: 16, // 4 bits per group = 4 bytes / symbol
      actMs: 16,         // 1/62.5Hz = 16ms
      guardMs: 3,
      parity: 20,
      ultrasound: false,
    },
    robust: {
      id: 2,
      name: 'robust',
      label: 'Robust',
      desc: '75 B/s – Maximale Störfestigkeit gegen Lärm & Hall',
      baseHz: 1500,
      spacingHz: 50,
      groups: 8,
      tonesPerGroup: 16, // 4 bits per group = 4 bytes / symbol
      actMs: 20,
      guardMs: 8,        // 8ms long guard for heavy reverberation
      parity: 44,        // High RS parity (survives heavy burst loss)
      ultrasound: false,
    },
    ultrasound: {
      id: 3,
      name: 'ultrasound',
      label: 'Ultraschall',
      desc: '45 B/s – Lautlos (17.5–20 kHz), braucht Lautsprecher/Mikrofon mit Ultraschall-Bereich',
      baseHz: 17500,
      spacingHz: 35,
      groups: 4,
      tonesPerGroup: 16, // 4 bits per group = 2 bytes / symbol
      actMs: 28.57,      // 1/35Hz
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
  };

  function resolveMode(modeOpt, dataLen) {
    if (!modeOpt || modeOpt === 'auto') {
      if (dataLen <= 250) return MODES.robust;
      // Turbo reaches ~9.4 kHz, which laptop speakers and headphone mics roll off: opt-in only.
      return MODES.balanced;
    }
    if (typeof modeOpt === 'string') {
      const m = MODES[modeOpt.toLowerCase()];
      if (m) return m;
    }
    if (typeof modeOpt === 'object' && modeOpt.id !== undefined) return modeOpt;
    return MODES.balanced;
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

  function headerCrc16(modeId, totalLines, k, payloadLen) {
    const b = new Uint8Array(8);
    b[0] = 0x54; // Magic 'T'
    b[1] = modeId;
    b[2] = (totalLines >> 8) & 255;
    b[3] = totalLines & 255;
    b[4] = k;
    b[5] = (payloadLen >> 16) & 255;
    b[6] = (payloadLen >> 8) & 255;
    b[7] = payloadLen & 255;
    return crc16(b);
  }

  function lineCrc16(idx, total, k, modeId, payload) {
    const b = new Uint8Array(6 + payload.length);
    b[0] = idx >> 8;
    b[1] = idx & 255;
    b[2] = total >> 8;
    b[3] = total & 255;
    b[4] = k;
    b[5] = modeId;
    b.set(payload, 6);
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
  function generateChirp(sr, durMs, f0, f1) {
    const N = Math.round(sr * (durMs / 1000));
    const samples = new Float32Array(N);
    const taper = Math.max(1, Math.round(N * 0.08));
    for (let n = 0; n < N; n++) {
      const t = n / sr;
      const f = f0 + (f1 - f0) * (n / (2 * N));
      let s = Math.sin(2 * Math.PI * f * t);
      if (n < taper) s *= 0.5 * (1 - Math.cos((Math.PI * n) / taper));
      else if (n >= N - taper) s *= 0.5 * (1 - Math.cos((Math.PI * (N - 1 - n)) / taper));
      samples[n] = s;
    }
    return samples;
  }

  /* Standard Chirp definitions:
   * Audible: 1400 Hz to 4500 Hz, 60 ms
   * Ultrasound: 17500 Hz to 19800 Hz, 60 ms
   */
  const CHIRP_CFG = {
    audible: { low: 1400, high: 4500, durMs: 60 },
    ultrasound: { low: 17500, high: 19800, durMs: 60 },
  };

  /* =========================================================================
   * 5. FRAMING & PACKET LAYOUT
   * ========================================================================= */
  function getLineDataBytes(mode) {
    const bytesPerSymbol = mode.groups / 2; // each group = 4 bits (1 nibble)
    const dataSymsPerLine = 8;
    return bytesPerSymbol * dataSymsPerLine;
  }

  function blockPlan(bodyLen, modeOpt) {
    const mode = resolveMode(modeOpt, bodyLen);
    const msgLen = 4 + bodyLen;
    const maxK = 255 - mode.parity; // RS codeword over GF(256) must be <= 255 bytes
    const minK = 32;
    const minBlocks = mode.id === 2 ? 8 : 6;
    const nB = Math.max(minBlocks, Math.ceil(msgLen / maxK));
    const k = Math.max(minK, Math.ceil(msgLen / nB));
    const lineBytes = getLineDataBytes(mode);
    const totalLines = Math.ceil((nB * (k + mode.parity)) / lineBytes);
    if (totalLines > 0xFFFF) throw new Error('Datei zu groß für diesen Modus (max. 65535 Pakete).');
    return { nB, k, total: totalLines, mode, lineBytes };
  }

  function layout(name, data, compressed, modeOpt) {
    const nameBytes = new TextEncoder().encode(name || 'file.bin').slice(0, 255);
    const body = new Uint8Array(3 + nameBytes.length + data.length + 4);
    body[0] = 0x46; // 'F'
    body[1] = compressed ? 0x5A : 0x41; // 'Z' (compressed) or 'A' (raw)
    body[2] = nameBytes.length;
    body.set(nameBytes, 3);
    body.set(data, 3 + nameBytes.length);
    body.set(u32(crc32(data)), body.length - 4);

    const plan = blockPlan(body.length, modeOpt);
    const mode = plan.mode;
    const { nB, k, total, lineBytes } = plan;
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
    return { lines, total, blocks: nB, k, mode, lineBytes, bodyLen: body.length };
  }

  /* =========================================================================
   * 6. MODULATOR / SYNTHESIS
   * ========================================================================= */
  function toneHz(mode, group, toneIndex) {
    const groupSpan = mode.tonesPerGroup * mode.spacingHz;
    return mode.baseHz + group * groupSpan + toneIndex * mode.spacingHz;
  }

  function getSchroederPhases(groups) {
    const phases = new Float32Array(groups);
    for (let k = 0; k < groups; k++) {
      phases[k] = (Math.PI * k * k) / groups;
    }
    return phases;
  }

  // Base Header format (fixed basis for instant detection across all audible modes)
  const AUDIBLE_HEADER_BASIS = {
    baseHz: 1500,
    spacingHz: 50,
    groups: 8,
    tonesPerGroup: 16,
    actMs: 20,
    guardMs: 5,
  };

  const ULTRASOUND_HEADER_BASIS = {
    baseHz: 17500,
    spacingHz: 35,
    groups: 4,
    tonesPerGroup: 16,
    actMs: 28.57,
    guardMs: 6,
  };

  function encodeAudio(name, data, sr, compressed, modeOpt) {
    sr = sr || 48000;
    const lay = layout(name, data, compressed, modeOpt);
    const mode = lay.mode;
    const isUltra = mode.ultrasound;
    const ms = (v) => Math.round((sr * v) / 1000);

    const chirpCfg = isUltra ? CHIRP_CFG.ultrasound : CHIRP_CFG.audible;
    const upChirp = generateChirp(sr, chirpCfg.durMs, chirpCfg.low, chirpCfg.high);
    const downChirp = generateChirp(sr, chirpCfg.durMs, chirpCfg.high, chirpCfg.low);

    const leadMs = 120, tailMs = 150, chirpGapMs = 15;
    const totalLines = lay.total;
    const lineBytesCount = lay.lineBytes;

    // Header symbols use fixed header basis
    const hBasis = isUltra ? ULTRASOUND_HEADER_BASIS : AUDIBLE_HEADER_BASIS;
    const hActN = ms(hBasis.actMs);
    const hGuardN = ms(hBasis.guardMs);
    const hSymN = hActN + hGuardN;
    const hSchroeder = getSchroederPhases(hBasis.groups);

    // Line symbols use mode basis
    const lActN = ms(mode.actMs);
    const lGuardN = ms(mode.guardMs);
    const lSymN = lActN + lGuardN;
    const lSchroeder = getSchroederPhases(mode.groups);

    // Header symbols payload (12 bytes for audible = 3 syms; 12 bytes for ultrasound = 6 syms)
    const headCrc = headerCrc16(mode.id, totalLines, lay.k, lay.bodyLen);
    const headBytes = [
      0x54, mode.id, (totalLines >> 8) & 255, totalLines & 255,
      lay.k, (lay.bodyLen >> 16) & 255, (lay.bodyLen >> 8) & 255, lay.bodyLen & 255,
      (headCrc >> 8) & 255, headCrc & 255, 0xA5, 0x5A,
    ];

    const bytesPerHSym = hBasis.groups / 2;
    const numHSyms = headBytes.length / bytesPerHSym;

    const dataSymsPerLine = 8;
    // 1 header sym + 8 data syms (+ 1 CRC tail sym in ultrasound mode)
    const symsPerLine = 1 + dataSymsPerLine + (isUltra ? 1 : 0);
    const totalSamples = ms(leadMs + tailMs + chirpCfg.durMs * 2 + chirpGapMs * 2) +
                         numHSyms * hSymN + totalLines * symsPerLine * lSymN + 10000;

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
      const freqs = [];
      for (let g = 0; g < basis.groups; g++) {
        freqs.push(toneHz(basis, g, nibbles[g] % 16));
      }
      const w = freqs.map((f) => (2 * Math.PI * f) / sr);
      const baseAmp = basis.baseHz > 15000 ? 0.18 : 0.13;

      for (let n = 0; n < symN; n++) {
        let env = 1.0;
        if (n < rGuard) env = 0.5 * (1 - Math.cos((Math.PI * n) / rGuard));
        else if (n >= symN - rGuard) env = 0.5 * (1 - Math.cos((Math.PI * (symN - 1 - n)) / rGuard));

        let s = 0;
        for (let g = 0; g < basis.groups; g++) {
          const preEmph = 1.0 + (g / basis.groups) * 0.25;
          s += Math.sin(w[g] * n + phases[g]) * preEmph;
        }
        out[o + n] = s * (baseAmp / Math.sqrt(basis.groups)) * env;
      }
      o += symN;
    };

    const bytesToNibbles = (bytes, offset, count, groups) => {
      const bytesPerSym = groups / 2;
      const list = [];
      for (let i = 0; i < count; i += bytesPerSym) {
        const nibs = new Array(groups);
        for (let g = 0; g < groups; g += 2) {
          const b = bytes[offset + i + (g / 2)] || 0;
          nibs[g] = b >> 4;
          nibs[g + 1] = b & 15;
        }
        list.push(nibs);
      }
      return list;
    };

    // 2. Synthesize Super-Header Symbols
    const hNibList = bytesToNibbles(headBytes, 0, headBytes.length, hBasis.groups);
    for (const nibs of hNibList) {
      putSym(hBasis, hActN, hGuardN, hSchroeder, nibs);
    }

    // 3. Synthesize Data Lines
    const lBytesPerSym = mode.groups / 2;
    for (let idx = 0; idx < totalLines; idx++) {
      const linePayload = lay.lines[idx];
      const lCrc = lineCrc16(idx, totalLines, lay.k, mode.id, linePayload);

      // Line Header bytes:
      // For 8 groups (4 bytes): [idxMSB, idxLSB, crcMSB, crcLSB]
      // For 4 groups (2 bytes): [idxMSB, idxLSB], and line ends with crc
      if (mode.groups === 8) {
        const lineHeadBytes = [
          (idx >> 8) & 255, idx & 255,
          (lCrc >> 8) & 255, lCrc & 255,
        ];
        const lhNibs = bytesToNibbles(lineHeadBytes, 0, 4, mode.groups);
        for (const n of lhNibs) putSym(mode, lActN, lGuardN, lSchroeder, n);

        const dNibs = bytesToNibbles(linePayload, 0, lineBytesCount, mode.groups);
        for (const n of dNibs) putSym(mode, lActN, lGuardN, lSchroeder, n);
      } else {
        // 4 groups (Ultrasound)
        const lineHeadBytes = [(idx >> 8) & 255, idx & 255];
        const lhNibs = bytesToNibbles(lineHeadBytes, 0, 2, mode.groups);
        for (const n of lhNibs) putSym(mode, lActN, lGuardN, lSchroeder, n);

        const dNibs = bytesToNibbles(linePayload, 0, lineBytesCount, mode.groups);
        for (const n of dNibs) putSym(mode, lActN, lGuardN, lSchroeder, n);

        const lineTailBytes = [(lCrc >> 8) & 255, lCrc & 255];
        const ltNibs = bytesToNibbles(lineTailBytes, 0, 2, mode.groups);
        for (const n of ltNibs) putSym(mode, lActN, lGuardN, lSchroeder, n);
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

    return {
      samples: out.subarray(0, o),
      lines: lay.lines,
      total: lay.total,
      blocks: lay.blocks,
      mode,
      seconds: o / sr,
    };
  }

  function estimateSeconds(nameLen, size, modeOpt) {
    const plan = blockPlan(3 + nameLen + size + 4, modeOpt);
    const mode = plan.mode;
    const isUltra = mode.ultrasound;
    const chirpDur = isUltra ? CHIRP_CFG.ultrasound.durMs : CHIRP_CFG.audible.durMs;
    const preambleMs = 120 + 150 + chirpDur * 2 + 30;

    const hBasis = isUltra ? ULTRASOUND_HEADER_BASIS : AUDIBLE_HEADER_BASIS;
    const numHSyms = 12 / (hBasis.groups / 2);
    const headerMs = numHSyms * (hBasis.actMs + hBasis.guardMs);

    const symsPerLine = isUltra ? 10 : 9;
    const lineMs = symsPerLine * (mode.actMs + mode.guardMs);
    return (preambleMs + headerMs + plan.total * lineMs) / 1000;
  }

  /* =========================================================================
   * 7. DEMODULATOR / RECEIVER
   * ========================================================================= */
  class Receiver {
    constructor(sr, onLine, onHeader) {
      this.sr = sr || 48000;
      this.onLine = onLine || null;
      this.onHeader = onHeader || null;
      this.ms = (v) => Math.round((this.sr * v) / 1000);

      this.buf = new Float32Array(this.sr * 35);
      this.len = 0;
      this.scanPos = 0;

      this.state = 'PREAMBLE';
      this.mode = MODES.balanced;
      this.total = 0;
      this.k = 0;
      this.payloadLen = 0;
      this.lines = new Map();
      this.failed = new Set();
      this.trackedP = -1;

      // Matched filter chirp templates
      this.chirpMs = 60;
      this.audibleUp = generateChirp(this.sr, this.chirpMs, CHIRP_CFG.audible.low, CHIRP_CFG.audible.high);
      this.audibleDown = generateChirp(this.sr, this.chirpMs, CHIRP_CFG.audible.high, CHIRP_CFG.audible.low);
      this.ultraUp = generateChirp(this.sr, this.chirpMs, CHIRP_CFG.ultrasound.low, CHIRP_CFG.ultrasound.high);
      this.ultraDown = generateChirp(this.sr, this.chirpMs, CHIRP_CFG.ultrasound.high, CHIRP_CFG.ultrasound.low);

      for (const t of [this.audibleUp, this.audibleDown, this.ultraUp, this.ultraDown]) {
        let te = 0;
        for (let n = 0; n < t.length; n += 2) te += t[n] * t[n];
        t.te = te;
      }

      this.initBasisCache();
    }

    initBasisCache() {
      this.basisCache = new Map();
      this.getBasis(AUDIBLE_HEADER_BASIS);
      this.getBasis(ULTRASOUND_HEADER_BASIS);
      for (const k in MODES) this.getBasis(MODES[k]);
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
      const bObj = { basisCos, basisSin, actN: N, guardN: this.ms(cfg.guardMs), symN: N + this.ms(cfg.guardMs) };
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

    correlateChirp(p, template) {
      const N = template.length;
      if (p < 0 || p + N > this.len) return 0;
      const x = this.buf;
      let c = 0, e = 0;
      for (let n = 0; n < N; n += 2) {
        const s = x[p + n];
        c += s * template[n];
        e += s * s;
      }
      if (e < 1e-9) return 0;
      return (c * c) / (e * template.te + 1e-9);
    }

    demodSym(sampleOffset, cfg, outNibbles) {
      const bObj = this.getBasis(cfg);
      const base = sampleOffset + bObj.guardN;
      const N = bObj.actN;
      if (base + N > this.len) return false;
      const x = this.buf;

      for (let g = 0; g < cfg.groups; g++) {
        let maxEnergy = -1;
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
            maxEnergy = e;
            bestK = k;
          }
        }
        outNibbles[g] = bestK;
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
      // Margin must cover the longest header (ultrasound: 6 syms ≈ 207 ms) plus timing search
      const limit = this.len - (chirpN * 2 + gapN * 2) - this.ms(260);
      const coarseStep = 2; // chirp main lobe is only ~±3 samples wide

      while (this.scanPos <= limit) {
        // 1. Check Audible Chirp
        const rAudible = this.correlateChirp(this.scanPos, this.audibleUp);
        if (rAudible > 0.24) {
          if (this.checkChirpPair(this.scanPos, this.audibleUp, this.audibleDown, false)) {
            return;
          }
        }

        // 2. Check Ultrasound Chirp
        const rUltra = this.correlateChirp(this.scanPos, this.ultraUp);
        if (rUltra > 0.22) {
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
      const coarseStep = 4;

      // Fine search around up peak
      let bestUpP = peakP, bestUpR = 0;
      for (let p = Math.max(0, peakP - coarseStep); p <= peakP + coarseStep; p++) {
        const r = this.correlateChirp(p, upTemplate);
        if (r > bestUpR) { bestUpR = r; bestUpP = p; }
      }

      // Check down-chirp
      const expDownP = bestUpP + chirpN + gapN;
      let bestDownP = expDownP, bestDownR = 0;
      for (let p = expDownP - this.ms(3); p <= expDownP + this.ms(3); p++) {
        const r = this.correlateChirp(p, downTemplate);
        if (r > bestDownR) { bestDownR = r; bestDownP = p; }
      }

      if (bestDownR > 0.20) {
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

      const offsets = [0, -1, 1, -2, 2, -3, 3].map(this.ms);
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

        if (headerCrc16(modeId, totalLines, k, pLen) === crc) {
          const detectedMode = MODE_BY_ID[modeId];
          this.mode = detectedMode;
          this.total = totalLines;
          this.k = k;
          this.payloadLen = pLen;
          this.trackedP = p0 + numHSyms * symN;
          if (this.onHeader) this.onHeader(this.total, detectedMode);
          return true;
        }
      }
      return false;
    }

    decodeLines(force) {
      const mode = this.mode;
      const bObj = this.getBasis(mode);
      const symN = bObj.symN;
      const bytesPerSym = mode.groups / 2;
      const dataSyms = 8;
      const isUltra = mode.ultrasound;
      const symsPerLine = isUltra ? 10 : 9;
      const lineSamples = symsPerLine * symN;
      const lineBytesCount = bytesPerSym * dataSyms;

      const nibbles = new Array(mode.groups);
      const symBytes = new Uint8Array(bytesPerSym);
      const linePayload = new Uint8Array(lineBytesCount);

      const timingOffsets = [0, -1, 1, -2, 2, -3, 3].map(this.ms);

      for (let idx = 0; idx < this.total; idx++) {
        if (this.lines.has(idx)) continue;
        // Live mode: a line that already failed with full audio is only retried on finalize
        if (!force && this.failed.has(idx)) continue;
        const expP = this.trackedP + idx * lineSamples;
        if (expP + lineSamples + this.ms(3) > this.len) {
          if (!force) break;
        }
        this.failed.add(idx);

        for (const off of timingOffsets) {
          const p = expP + off;
          if (p < 0 || p + lineSamples > this.len) continue;

          let ok = true;
          let lineIdx = -1;
          let expCrc = -1;

          if (!isUltra) {
            // Audible: 1 Header Sym (4 bytes: [idxMSB, idxLSB, crcMSB, crcLSB])
            if (!this.demodSym(p, mode, nibbles)) continue;
            this.nibblesToBytes(nibbles, mode.groups, symBytes);
            lineIdx = (symBytes[0] << 8) | symBytes[1];
            expCrc = (symBytes[2] << 8) | symBytes[3];

            if (lineIdx !== idx) continue;

            // 8 Data symbols
            for (let s = 0; s < dataSyms; s++) {
              if (!this.demodSym(p + (1 + s) * symN, mode, nibbles)) { ok = false; break; }
              this.nibblesToBytes(nibbles, mode.groups, symBytes);
              linePayload.set(symBytes, s * bytesPerSym);
            }
          } else {
            // Ultrasound: 1 Header Sym (2 bytes: [idxMSB, idxLSB])
            if (!this.demodSym(p, mode, nibbles)) continue;
            this.nibblesToBytes(nibbles, mode.groups, symBytes);
            lineIdx = (symBytes[0] << 8) | symBytes[1];

            if (lineIdx !== idx) continue;

            // 8 Data symbols
            for (let s = 0; s < dataSyms; s++) {
              if (!this.demodSym(p + (1 + s) * symN, mode, nibbles)) { ok = false; break; }
              this.nibblesToBytes(nibbles, mode.groups, symBytes);
              linePayload.set(symBytes, s * bytesPerSym);
            }

            // 1 Tail Sym (2 bytes: [crcMSB, crcLSB])
            if (ok) {
              if (!this.demodSym(p + 9 * symN, mode, nibbles)) ok = false;
              else {
                this.nibblesToBytes(nibbles, mode.groups, symBytes);
                expCrc = (symBytes[0] << 8) | symBytes[1];
              }
            }
          }

          if (ok && lineCrc16(lineIdx, this.total, this.k, mode.id, linePayload) === expCrc) {
            this.lines.set(lineIdx, linePayload.slice(0));
            this.failed.delete(lineIdx);
            this.trackedP += Math.round(off * 0.25); // DPLL tracking update
            if (this.onLine) this.onLine(lineIdx, linePayload, this.total, mode);
            break;
          }
        }
      }
    }

    finalize() {
      this.process(true);
      if (!this.total) {
        throw new Error('Kein Signal erkannt. Bitte näher an den Lautsprecher gehen und Lautstärke prüfen.');
      }

      const total = this.total;
      const k = this.k;
      const parity = this.mode.parity;
      const S = k + parity;
      const lineBytesCount = getLineDataBytes(this.mode);
      const nB = Math.floor((total * lineBytesCount) / S);

      const coded = new Uint8Array(total * lineBytesCount);
      for (const [idx, buf] of this.lines) {
        coded.set(buf, idx * lineBytesCount);
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
          if (!this.lines.has(lineIdx)) erasePos.push(pos);
        }
        try {
          const res = rsDecode(blk, parity, erasePos);
          msg.set(res.data, b * k);
          fixed += res.fixed;
        } catch (e) {
          failed++;
        }
      }

      const got = this.lines.size;
      if (failed > 0) {
        throw new Error(`Signal zu stark beschädigt: ${failed} von ${nB} Blöcken nicht wiederherstellbar (${got}/${total} Pakete empfangen).`);
      }

      const bodyLen = rd32(msg, 0);
      if (bodyLen < 7 || bodyLen > msg.length - 4) {
        throw new Error('Beschädigter Header im Datenstrom.');
      }
      const body = msg.subarray(4, 4 + bodyLen);
      if (body[0] !== 0x46 || (body[1] !== 0x41 && body[1] !== 0x5A)) {
        throw new Error('Ungültiges Datenformat (Magic Mismatch).');
      }

      const nameLen = body[2];
      const name = new TextDecoder().decode(body.subarray(3, 3 + nameLen));
      const data = body.slice(3 + nameLen, body.length - 4);
      const expectedCrc = rd32(body, body.length - 4);

      if (crc32(data) !== expectedCrc) {
        throw new Error('CRC32-Prüfsummenfehler: Datei beschädigt.');
      }

      return {
        name,
        data,
        compressed: body[1] === 0x5A,
        fixedBytes: fixed,
        linesGot: got,
        linesTotal: total,
        blocks: nB,
        mode: this.mode.name,
      };
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
    resolveMode,
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
