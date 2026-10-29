/**
 * Game Arcade - Core Audio & Storage Utility (arcade-core.js)
 * Einheitlicher Web Audio Synthesizer, Highscore-Sync & QoL-Helfer
 */

const ArcadeCore = (() => {
  let audioCtx = null;
  let muted = typeof localStorage !== 'undefined' ? localStorage.getItem('arcade_sound_muted') === 'true' : false;

  function getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Interaktions-Trigger für AudioContext
  if (typeof window !== 'undefined') {
    const unlock = () => {
      getAudioContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  // Web Audio Synthesizer Sounds
  const Sounds = {
    playTone(freq = 440, duration = 0.1, type = 'sine', gainVal = 0.15) {
      if (muted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    },

    pop(pitch = 1) {
      if (muted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(320 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(140 * pitch, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {}
    },

    merge(level = 1) {
      if (muted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const baseFreq = 220 * Math.pow(1.12, Math.min(level, 16));
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {}
    },

    coin() {
      if (muted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [987.77, 1318.51].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.08);
          gain.gain.setValueAtTime(0.18, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + (i + 1) * 0.18);
        });
      } catch (e) {}
    },

    jump() {
      if (muted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    },

    hit() {
      if (muted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } catch (e) {}
    },

    powerup() {
      if (muted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [261, 329, 392, 523].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + i * 0.05);
          gain.gain.setValueAtTime(0.18, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + (i + 1) * 0.12);
        });
      } catch (e) {}
    },

    explosion() {
      if (muted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        // White noise buffer
        const bufferSize = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } catch (e) {}
    },

    gameOver() {
      if (muted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [220, 196, 174, 146].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now + i * 0.15);
          gain.gain.setValueAtTime(0.15, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.15);
          osc.stop(now + (i + 1) * 0.18);
        });
      } catch (e) {}
    }
  };

  // Mute / Sound Toggle
  function isMuted() { return muted; }
  function toggleMute() {
    muted = !muted;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('arcade_sound_muted', muted ? 'true' : 'false');
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('arcade_mute_changed', { detail: { muted } }));
      } catch (e) {}
    }
    return muted;
  }

  // Canonical Highscore Mapping
  const SCORE_KEYS = {
    '2048': 'best2048',
    'tetris': 'tetrisBest',
    'flappybird': 'flappyBest',
    'snake': 'snakeBest',
    'breakout': 'breakoutBest',
    'memory': 'memory_best_normal',
    'racer': 'racer_best_lap',
    'doodlejump': 'doodle_highscore',
    'frogger': 'froggerBest',
    'suika': 'suika_highscore',
    'leveldevil': 'leveldevil_deaths',
    'berghain': 'berghain_best_shift',
    'berghain_rein': 'berghain_stamps',
    'buckshot': 'buckshot_wins',
    'casino': 'casino_balance',
    'elpatron': 'elpatron_networth',
    'gettingoverit': 'gettingoverit_best',
    'securityguard': 'securityguard_score',
    'skytower': 'skytower_best',
    'duckskate': 'duckskate-best',
    'survivor': 'crypt_survivor_kills',
    'spire': 'spire_cards_best',
    'neondefense': 'cyber_defense_stars',
    'doener': 'doener_highscore',
    'wg_putzen': 'wg_putzen_highscore',
    'cannon_sheep': 'cannon_sheep_best_dist',
    'buerostuhl': 'buerostuhl_best_lap',
    'schwarzfahrer': 'schwarzfahrer_highscore',
    'squidgame': 'squidgame_won',
    'propaganda': 'propaganda_votes',
    'hexfront': 'hexfront_score'
  };

  function getScore(gameKey) {
    if (typeof localStorage === 'undefined') return null;
    try {
      const storageKey = SCORE_KEYS[gameKey] || gameKey;
      let val = localStorage.getItem(storageKey);
      if (val === null && storageKey !== gameKey) {
        val = localStorage.getItem(gameKey);
      }
      return val !== null ? Number(val) || val : null;
    } catch (e) {
      return null;
    }
  }

  function saveScore(gameKey, val) {
    if (typeof localStorage === 'undefined') return;
    try {
      const storageKey = SCORE_KEYS[gameKey] || gameKey;
      localStorage.setItem(storageKey, val);
    } catch (e) {}
  }

  function getAllScores() {
    const scores = {};
    if (typeof localStorage === 'undefined') return scores;
    try {
      for (const [k, sk] of Object.entries(SCORE_KEYS)) {
        const v = localStorage.getItem(sk);
        if (v !== null) scores[k] = v;
      }
    } catch (e) {}
    return scores;
  }

  function formatNumber(num) {
    if (typeof num !== 'number') num = Number(num) || 0;
    if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + ' Mrd.';
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + ' Mio.';
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toLocaleString('de-DE');
  }

  return {
    getAudioContext,
    sounds: Sounds,
    playTone: Sounds.playTone,
    pop: Sounds.pop,
    merge: Sounds.merge,
    coin: Sounds.coin,
    jump: Sounds.jump,
    hit: Sounds.hit,
    powerup: Sounds.powerup,
    explosion: Sounds.explosion,
    gameOver: Sounds.gameOver,
    isMuted,
    toggleMute,
    getScore,
    saveScore,
    getAllScores,
    formatNumber
  };
})();

if (typeof window !== 'undefined') {
  window.ArcadeCore = ArcadeCore;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ArcadeCore;
}
