// Französische Zahlen & Zählen (Les Nombres en Français)

const FRENCH_NUMBERS_CATALOG = [
  // 0 - 20 (Basis)
  { num: 0, fr: "zéro", phonetic: "[ze-ro]", math: "0", rule: "Grundzahl", cat: "base" },
  { num: 1, fr: "un", phonetic: "[œ̃]", math: "1", rule: "Weibliche Form: une", cat: "base" },
  { num: 2, fr: "deux", phonetic: "[dø]", math: "2", rule: "x am Ende stumm", cat: "base" },
  { num: 3, fr: "trois", phonetic: "[trwa]", math: "3", rule: "s am Ende stumm", cat: "base" },
  { num: 4, fr: "quatre", phonetic: "[katr]", math: "4", rule: "End-e kaum hörbar", cat: "base" },
  { num: 5, fr: "cinq", phonetic: "[sɛ̃k]", math: "5", rule: "q wird wie k gesprochen", cat: "base" },
  { num: 6, fr: "six", phonetic: "[sis]", math: "6", rule: "x wird wie s gesprochen", cat: "base" },
  { num: 7, fr: "sept", phonetic: "[sɛt]", math: "7", rule: "p ist stumm!", cat: "base" },
  { num: 8, fr: "huit", phonetic: "[ɥit]", math: "8", rule: "h ist stumm, t wird gesprochen", cat: "base" },
  { num: 9, fr: "neuf", phonetic: "[nœf]", math: "9", rule: "f wird gesprochen", cat: "base" },
  { num: 10, fr: "dix", phonetic: "[dis]", math: "10", rule: "x wird wie s gesprochen", cat: "base" },
  { num: 11, fr: "onze", phonetic: "[ɔ̃z]", math: "11", rule: "Nasallaut am Anfang", cat: "base" },
  { num: 12, fr: "douze", phonetic: "[duz]", math: "12", rule: "weiches z am Ende", cat: "base" },
  { num: 13, fr: "treize", phonetic: "[trɛz]", math: "13", rule: "offenes e", cat: "base" },
  { num: 14, fr: "quatorze", phonetic: "[ka-tɔrz]", math: "14", rule: "qu wie k", cat: "base" },
  { num: 15, fr: "quinze", phonetic: "[kɛ̃z]", math: "15", rule: "Nasallaut", cat: "base" },
  { num: 16, fr: "seize", phonetic: "[sɛz]", math: "16", rule: "Letzte eigenständige Zahl vor Zusammensetzungen!", cat: "base" },
  { num: 17, fr: "dix-sept", phonetic: "[di-sɛt]", math: "10 + 7", rule: "Erste zusammengesetzte Zahl mit Bindestrich (-)", cat: "base" },
  { num: 18, fr: "dix-huit", phonetic: "[di-zɥit]", math: "10 + 8", rule: "Liaison: x wird stimmhaft wie z gesprochen", cat: "base" },
  { num: 19, fr: "dix-neuf", phonetic: "[diz-nœf]", math: "10 + 9", rule: "Liaison: x wie z gesprochen", cat: "base" },
  { num: 20, fr: "vingt", phonetic: "[vɛ̃]", math: "20", rule: "g und t sind stumm!", cat: "base" },

  // 21 - 69 (Regelmäßige Zehner)
  { num: 21, fr: "vingt et un", phonetic: "[vɛ̃-t‿e-œ̃]", math: "20 + 1", rule: "Achtung: 'et un' (mit Bindewort 'et', kein Bindestrich)", cat: "tens" },
  { num: 22, fr: "vingt-deux", phonetic: "[vɛ̃t-dø]", math: "20 + 2", rule: "Mit Bindestrich: vingt-deux (t wird oft leicht gehört)", cat: "tens" },
  { num: 25, fr: "vingt-cinq", phonetic: "[vɛ̃t-sɛ̃k]", math: "20 + 5", rule: "Bindestrich-Regel", cat: "tens" },
  { num: 30, fr: "trente", phonetic: "[trɑ̃t]", math: "30", rule: "Zehnerzahl", cat: "tens" },
  { num: 31, fr: "trente et un", phonetic: "[trɑ̃-t‿e-œ̃]", math: "30 + 1", rule: "'et un' wie bei 21", cat: "tens" },
  { num: 35, fr: "trente-cinq", phonetic: "[trɑ̃t-sɛ̃k]", math: "30 + 5", rule: "Regelmäßig mit Bindestrich", cat: "tens" },
  { num: 40, fr: "quarante", phonetic: "[ka-rɑ̃t]", math: "40", rule: "qu wie k", cat: "tens" },
  { num: 41, fr: "quarante et un", phonetic: "[ka-rɑ̃-t‿e-œ̃]", math: "40 + 1", rule: "'et un' Regel", cat: "tens" },
  { num: 50, fr: "cinquante", phonetic: "[sɛ̃-kɑ̃t]", math: "50", rule: "Zehnerzahl", cat: "tens" },
  { num: 51, fr: "cinquante et un", phonetic: "[sɛ̃-kɑ̃-t‿e-œ̃]", math: "50 + 1", rule: "'et un' Regel", cat: "tens" },
  { num: 60, fr: "soixante", phonetic: "[swa-sɑ̃t]", math: "60", rule: "x wird wie ss gesprochen!", cat: "tens" },
  { num: 61, fr: "soixante et un", phonetic: "[swa-sɑ̃-t‿e-œ̃]", math: "60 + 1", rule: "Letzte 'et un' Zahl vor den 70ern!", cat: "tens" },
  { num: 69, fr: "soixante-neuf", phonetic: "[swa-sɑ̃t-nœf]", math: "60 + 9", rule: "Höchste reguläre 60er-Zahl", cat: "tens" },

  // 70 - 79 (Die 70er: 60 + 10 bis 19)
  { num: 70, fr: "soixante-dix", phonetic: "[swa-sɑ̃t-dis]", math: "60 + 10", rule: "Das französische 60er-System! 60 + 10", regional: "Schweiz / Belgien: septante", cat: "special" },
  { num: 71, fr: "soixante et onze", phonetic: "[swa-sɑ̃t e ɔ̃z]", math: "60 + 11", rule: "Wichtig: 'et onze' (60 + 11)", regional: "Schweiz / Belgien: septante et un", cat: "special" },
  { num: 72, fr: "soixante-douze", phonetic: "[swa-sɑ̃t-duz]", math: "60 + 12", rule: "60 + 12 mit Bindestrich", regional: "CH / BE: septante-deux", cat: "special" },
  { num: 73, fr: "soixante-treize", phonetic: "[swa-sɑ̃t-trɛz]", math: "60 + 13", rule: "60 + 13", regional: "CH / BE: septante-trois", cat: "special" },
  { num: 74, fr: "soixante-quatorze", phonetic: "[swa-sɑ̃t-ka-tɔrz]", math: "60 + 14", rule: "60 + 14", regional: "CH / BE: septante-quatorze", cat: "special" },
  { num: 75, fr: "soixante-quinze", phonetic: "[swa-sɑ̃t-kɛ̃z]", math: "60 + 15", rule: "60 + 15", regional: "CH / BE: septante-cinq", cat: "special" },
  { num: 76, fr: "soixante-seize", phonetic: "[swa-sɑ̃t-sɛz]", math: "60 + 16", rule: "60 + 16", regional: "CH / BE: septante-six", cat: "special" },
  { num: 77, fr: "soixante-dix-sept", phonetic: "[swa-sɑ̃t-di-sɛt]", math: "60 + 10 + 7", rule: "60 + 17 (zwei Bindestriche!)", regional: "CH / BE: septante-sept", cat: "special" },
  { num: 78, fr: "soixante-dix-huit", phonetic: "[swa-sɑ̃t-di-zɥit]", math: "60 + 10 + 8", rule: "60 + 18", regional: "CH / BE: septante-huit", cat: "special" },
  { num: 79, fr: "soixante-dix-neuf", phonetic: "[swa-sɑ̃t-diz-nœf]", math: "60 + 10 + 9", rule: "60 + 19", regional: "CH / BE: septante-neuf", cat: "special" },

  // 80 - 89 (Die 80er: 4 × 20)
  { num: 80, fr: "quatre-vingts", phonetic: "[katr-vɛ̃]", math: "4 × 20", rule: "⚠️ Mit Endungs-s wenn genau 80! (Plural von vingt)", regional: "Schweiz: huitante | Belgien: octante", cat: "special" },
  { num: 81, fr: "quatre-vingt-un", phonetic: "[katr-vɛ̃-œ̃]", math: "4 × 20 + 1", rule: "⚠️ KEIN 'et' und KEIN 's'! (Nicht quatre-vingt et un!)", regional: "CH: huitante et un", cat: "special" },
  { num: 82, fr: "quatre-vingt-deux", phonetic: "[katr-vɛ̃-dø]", math: "4 × 20 + 2", rule: "Das 's' bei vingt fällt weg, sobald eine Zahl folgt!", regional: "CH: huitante-deux", cat: "special" },
  { num: 85, fr: "quatre-vingt-cinq", phonetic: "[katr-vɛ̃-sɛ̃k]", math: "4 × 20 + 5", rule: "4 × 20 + 5", regional: "CH: huitante-cinq", cat: "special" },
  { num: 89, fr: "quatre-vingt-neuf", phonetic: "[katr-vɛ̃-nœf]", math: "4 × 20 + 9", rule: "4 × 20 + 9", regional: "CH: huitante-neuf", cat: "special" },

  // 90 - 99 (Die 90er: 4 × 20 + 10 bis 19)
  { num: 90, fr: "quatre-vingt-dix", phonetic: "[katr-vɛ̃-dis]", math: "4 × 20 + 10", rule: "Das ultimative Rechenbeispiel: 4 mal 20 plus 10!", regional: "Schweiz / Belgien: nonante", cat: "special" },
  { num: 91, fr: "quatre-vingt-onze", phonetic: "[katr-vɛ̃-ɔ̃z]", math: "4 × 20 + 11", rule: "⚠️ Auch hier: KEIN 'et'! (4 × 20 + 11)", regional: "CH / BE: nonante et un", cat: "special" },
  { num: 92, fr: "quatre-vingt-douze", phonetic: "[katr-vɛ̃-duz]", math: "4 × 20 + 12", rule: "4 × 20 + 12", regional: "CH / BE: nonante-deux", cat: "special" },
  { num: 95, fr: "quatre-vingt-quinze", phonetic: "[katr-vɛ̃-kɛ̃z]", math: "4 × 20 + 15", rule: "4 × 20 + 15", regional: "CH / BE: nonante-cinq", cat: "special" },
  { num: 99, fr: "quatre-vingt-dix-neuf", phonetic: "[katr-vɛ̃-diz-nœf]", math: "4 × 20 + 10 + 9", rule: "4 × 20 + 19 (Der König der französischen Zahlen)", regional: "CH / BE: nonante-neuf", cat: "special" },

  // 100+ (Hunderter, Tausender, Große Zahlen)
  { num: 100, fr: "cent", phonetic: "[sɑ̃]", math: "100", rule: "Singular ohne 's'", cat: "large" },
  { num: 101, fr: "cent un", phonetic: "[sɑ̃ œ̃]", math: "100 + 1", rule: "Kein Bindestrich, kein 'et', kein 's'", cat: "large" },
  { num: 200, fr: "deux cents", phonetic: "[dø sɑ̃]", math: "2 × 100", rule: "⚠️ Mit 's' am Ende, wenn glatte Hunderter (200, 300, 400...)!", cat: "large" },
  { num: 201, fr: "deux cent un", phonetic: "[dø sɑ̃ œ̃]", math: "2 × 100 + 1", rule: "⚠️ Das 's' entfällt sofort, wenn eine weitere Zahl folgt!", cat: "large" },
  { num: 500, fr: "cinq cents", phonetic: "[sɛ̃k sɑ̃]", math: "5 × 100", rule: "Glatte 500 mit Plural-s", cat: "large" },
  { num: 1000, fr: "mille", phonetic: "[mil]", math: "1000", rule: "⚠️ 'mille' ist UNVERÄNDERLICH! Niemals ein 's' (deux mille, dix mille)!", cat: "large" },
  { num: 1999, fr: "mille neuf cent quatre-vingt-dix-neuf", phonetic: "[mil nœf sɑ̃ katr-vɛ̃-diz-nœf]", math: "1000 + 900 + 99", rule: "cent ohne s, da Zahl folgt", cat: "large" },
  { num: 2026, fr: "deux mille vingt-six", phonetic: "[dø mil vɛ̃t-sis]", math: "2000 + 26", rule: "mille unveränderlich", cat: "large" },
  { num: 1000000, fr: "un million", phonetic: "[œ̃ mi-ljɔ̃]", math: "1.000.000", rule: "Nomen: deux millions erhält ein Plural-s!", cat: "large" },
  { num: 1000000000, fr: "un milliard", phonetic: "[œ̃ mi-ljar]", math: "1.000.000.000", rule: "Nomen: deux milliards erhält ein Plural-s!", cat: "large" }
];

// Vollwertiger Zahlen-Konverter (0 bis 999.999.999)
function numberToFrench(n) {
  if (n === 0) return "zéro";
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
                 "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

  function convertBelowHundred(num) {
    if (num < 20) return units[num];
    const t = Math.floor(num / 10);
    const u = num % 10;
    if (t === 7) {
      if (u === 1) return "soixante et onze";
      return "soixante-" + units[10 + u];
    }
    if (t === 8) {
      if (u === 0) return "quatre-vingts";
      return "quatre-vingt-" + units[u];
    }
    if (t === 9) {
      return "quatre-vingt-" + units[10 + u];
    }
    // 20-69
    if (u === 0) return tens[t];
    if (u === 1) return tens[t] + " et un";
    return tens[t] + "-" + units[u];
  }

  function convertBelowThousand(num) {
    if (num < 100) return convertBelowHundred(num);
    const h = Math.floor(num / 100);
    const rest = num % 100;
    let hStr = "";
    if (h === 1) {
      hStr = "cent";
    } else {
      hStr = units[h] + (rest === 0 ? " cents" : " cent");
    }
    if (rest === 0) return hStr;
    return hStr + " " + convertBelowHundred(rest);
  }

  function convert(num) {
    if (num < 1000) return convertBelowThousand(num);
    if (num < 1000000) {
      const k = Math.floor(num / 1000);
      const rest = num % 1000;
      let kStr = k === 1 ? "mille" : convertBelowThousand(k) + " mille";
      if (rest === 0) return kStr;
      return kStr + " " + convertBelowThousand(rest);
    }
    if (num < 1000000000) {
      const m = Math.floor(num / 1000000);
      const rest = num % 1000000;
      let mStr = m === 1 ? "un million" : convert(m) + " millions";
      if (rest === 0) return mStr;
      return mStr + " " + convert(rest);
    }
    return String(num);
  }

  return convert(n);
}

// Berechnet mathematische Zerlegung und Erklärung
function explainFrenchNumber(n) {
  if (n < 0 || n > 999999999) return { math: "-", tip: "" };
  if (n >= 70 && n <= 79) {
    const diff = n - 60;
    return {
      math: `60 + ${diff} (soixante + ...)`,
      tip: n === 71 ? "Mit 'et': soixante et onze (60 + 11)" : `Zusammengesetzt aus 60 und ${diff}`,
      regional: "In der Schweiz & Belgien wird stattdessen 'septante' gezählt."
    };
  }
  if (n === 80) {
    return {
      math: "4 × 20 (quatre-vingts)",
      tip: "⚠️ Achtung: Mit 's' am Ende von vingts, da genau 80!",
      regional: "In der Schweiz: huitante | In Belgien: octante"
    };
  }
  if (n > 80 && n < 90) {
    const diff = n - 80;
    return {
      math: `4 × 20 + ${diff}`,
      tip: n === 81 ? "⚠️ Achtung: KEIN 'et' bei 81 (quatre-vingt-un) und das 's' entfällt!" : "Das 's' bei vingt fällt weg, da eine Einerziffer folgt.",
      regional: "In der Schweiz: huitante-..."
    };
  }
  if (n >= 90 && n <= 99) {
    const diff = n - 80;
    return {
      math: `4 × 20 + 10 + ${n - 90} = 4 × 20 + ${diff}`,
      tip: n === 91 ? "⚠️ Achtung: Auch hier KEIN 'et' (quatre-vingt-onze)!" : `Zusammengesetzt aus 4 × 20 und ${diff}`,
      regional: "In der Schweiz & Belgien wird stattdessen 'nonante' gezählt."
    };
  }
  if (n % 100 === 0 && n >= 200 && n < 1000) {
    return {
      math: `${n / 100} × 100`,
      tip: "⚠️ Glatte Hunderter (200, 300...) erhalten ein Plural-'s' bei cents!",
      regional: ""
    };
  }
  if (n >= 1000) {
    return {
      math: "Große Zahl",
      tip: "⚠️ 'mille' bleibt immer unveränderlich ohne 's'! Erst 'million' und 'milliard' als Substantive erhalten ein 's'.",
      regional: ""
    };
  }
  if (n % 10 === 1 && n > 20 && n < 70) {
    return {
      math: `${n - 1} + 1`,
      tip: "Wird mit dem Bindewort 'et un' gebildet (ohne Bindestrich).",
      regional: ""
    };
  }
  return {
    math: `Zahl ${n}`,
    tip: "Reguläre französische Zahlform.",
    regional: ""
  };
}

// --- INTERAKTIVE INITIALISIERUNG DES ZAHLEN-TABS ---
let numbersCurrentCat = 'all';
let numbersSearchQuery = '';

function renderNumbersGrid() {
  const container = document.getElementById('numbers-catalog-grid');
  const countEl = document.getElementById('numbers-count-badge');
  if (!container) return;

  const q = numbersSearchQuery.trim().toLowerCase();
  const list = FRENCH_NUMBERS_CATALOG.filter(item => {
    if (numbersCurrentCat !== 'all' && item.cat !== numbersCurrentCat) return false;
    if (q) {
      const matchNum = String(item.num).includes(q);
      const matchFr = item.fr.toLowerCase().includes(q);
      const matchPhon = item.phonetic ? item.phonetic.toLowerCase().includes(q) : false;
      const matchRule = item.rule ? item.rule.toLowerCase().includes(q) : false;
      return matchNum || matchFr || matchPhon || matchRule;
    }
    return true;
  });

  if (countEl) countEl.textContent = `${list.length} Zahlen`;

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔍</div>
        <h3>Keine Zahl gefunden</h3>
        <p>Probiere eine andere Ziffer oder einen französischen Begriff.</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(item => {
    const isSpecial = item.cat === 'special';
    const isLarge = item.cat === 'large';
    const borderColor = isSpecial ? 'border-left: 4px solid #f59e0b;' : (isLarge ? 'border-left: 4px solid #8b5cf6;' : 'border-left: 4px solid #3b82f6;');
    
    let regionalBadge = '';
    if (item.regional) {
      regionalBadge = `<div style="font-size: 0.76rem; color: #10b981; font-weight: 600; margin-top: 0.25rem;">🇨🇭/🇧🇪 ${item.regional}</div>`;
    }

    return `
      <div class="card" style="margin-bottom: 0; padding: 1.1rem; ${borderColor}; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.15s, box-shadow 0.15s;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 1.6rem; font-weight: 800; font-family: monospace; color: var(--primary);">${item.num}</span>
            <span class="pill" style="font-size: 0.72rem; padding: 2px 7px;">${item.math}</span>
          </div>
          <div style="font-size: 1.12rem; font-weight: 700; color: var(--text); margin-bottom: 0.15rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
            <span>${item.fr}</span>
            <button class="audio-btn" style="width: 28px; height: 28px; font-size: 0.85rem;" onclick="speakText('${item.fr}')" title="Aussprache anhören">🔊</button>
          </div>
          <div style="font-size: 0.82rem; color: var(--text-muted); font-style: italic; margin-bottom: 0.4rem;">${item.phonetic}</div>
          <div style="font-size: 0.82rem; color: var(--text); line-height: 1.35;">${item.rule}</div>
          ${regionalBadge}
        </div>
      </div>
    `;
  }).join('');
}

// Live Converter Controller
function updateLiveNumberConverter() {
  const input = document.getElementById('num-converter-input');
  const frenchOut = document.getElementById('num-converter-french');
  const mathOut = document.getElementById('num-converter-math');
  const tipOut = document.getElementById('num-converter-tip');
  const regionalOut = document.getElementById('num-converter-regional');
  const audioBtn = document.getElementById('num-converter-audio');

  if (!input || !frenchOut) return;

  let val = parseInt(input.value, 10);
  if (isNaN(val) || val < 0) val = 0;
  if (val > 999999999) val = 999999999;
  input.value = val;

  const frenchText = numberToFrench(val);
  const info = explainFrenchNumber(val);

  frenchOut.textContent = frenchText;
  if (mathOut) mathOut.textContent = info.math;
  if (tipOut) tipOut.textContent = info.tip;
  if (regionalOut) {
    if (info.regional) {
      regionalOut.style.display = 'block';
      regionalOut.textContent = `🇨🇭 / 🇧🇪 Regional: ${info.regional}`;
    } else {
      regionalOut.style.display = 'none';
    }
  }

  if (audioBtn) {
    audioBtn.onclick = () => speakText(frenchText);
  }
}

function setConverterNumber(n) {
  const input = document.getElementById('num-converter-input');
  if (input) {
    input.value = n;
    updateLiveNumberConverter();
  }
}

function stepConverterNumber(delta) {
  const input = document.getElementById('num-converter-input');
  if (input) {
    let val = parseInt(input.value, 10) || 0;
    val = Math.max(0, val + delta);
    input.value = val;
    updateLiveNumberConverter();
  }
}

// --- NUMBERS MINI TRAINER / QUIZ ---
let numQuizScore = 0;
let numQuizCurrentAnswer = null;
let numQuizMode = 'fr_to_num'; // 'num_to_fr', 'fr_to_num', 'listen'

const QUIZ_NUMBERS_POOL = [
  0, 1, 7, 11, 14, 16, 17, 18, 19, 20, 21, 22, 31, 45, 50, 60, 61,
  70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
  80, 81, 82, 85, 89, 90, 91, 92, 95, 98, 99,
  100, 101, 200, 201, 500, 1000
];

function generateNumQuizQuestion() {
  const target = QUIZ_NUMBERS_POOL[Math.floor(Math.random() * QUIZ_NUMBERS_POOL.length)];
  const correctFr = numberToFrench(target);
  const modes = ['num_to_fr', 'fr_to_num', 'listen'];
  const mode = modes[Math.floor(Math.random() * modes.length)];

  // Generate 3 plausible distractors
  const distractors = new Set();
  while (distractors.size < 3) {
    let fake;
    const r = Math.random();
    if (target >= 70 && target <= 79 && r < 0.5) {
      fake = 60 + Math.floor(Math.random() * 10);
    } else if (target >= 80 && target <= 89 && r < 0.5) {
      fake = target + (Math.random() > 0.5 ? 10 : -10);
    } else if (target >= 90 && target <= 99 && r < 0.5) {
      fake = target - 10;
    } else {
      fake = QUIZ_NUMBERS_POOL[Math.floor(Math.random() * QUIZ_NUMBERS_POOL.length)];
    }
    if (fake !== target && fake >= 0) distractors.add(fake);
  }

  const allNums = [target, ...Array.from(distractors)].sort(() => 0.5 - Math.random());

  return {
    targetNum: target,
    correctFr: correctFr,
    mode: mode,
    options: allNums
  };
}

function loadNextNumQuiz() {
  const q = generateNumQuizQuestion();
  numQuizCurrentAnswer = q;

  const promptEl = document.getElementById('num-quiz-prompt');
  const subpromptEl = document.getElementById('num-quiz-subprompt');
  const optionsEl = document.getElementById('num-quiz-options');
  const feedbackEl = document.getElementById('num-quiz-feedback');
  const nextBtn = document.getElementById('num-quiz-next-btn');

  if (!promptEl || !optionsEl) return;

  if (feedbackEl) {
    feedbackEl.innerHTML = '';
    feedbackEl.className = 'quiz-feedback';
  }
  if (nextBtn) nextBtn.style.display = 'none';

  if (q.mode === 'num_to_fr') {
    promptEl.innerHTML = `Wie lautet die Zahl <strong>${q.targetNum}</strong> auf Französisch?`;
    subpromptEl.textContent = "Wähle das richtige französische Wort:";
    optionsEl.innerHTML = q.options.map(n => {
      const fr = numberToFrench(n);
      return `<button class="quiz-btn" onclick="checkNumQuizAnswer('${fr.replace(/'/g, "\\'")}')"><span>${fr}</span> <span>➔</span></button>`;
    }).join('');
  } else if (q.mode === 'fr_to_num') {
    promptEl.innerHTML = `Welche Zahl ist: <strong>"${q.correctFr}"</strong>?`;
    subpromptEl.innerHTML = `Klicke auf den Lautsprecher, um die Aussprache zu hören: <button class="audio-btn" style="width:28px;height:28px;font-size:0.85rem;" onclick="speakText('${q.correctFr}')">🔊</button>`;
    optionsEl.innerHTML = q.options.map(n => {
      return `<button class="quiz-btn" onclick="checkNumQuizAnswer(${n})"><span style="font-weight:800; font-size:1.15rem; font-family:monospace;">${n}</span> <span>➔</span></button>`;
    }).join('');
  } else {
    // Listen mode
    promptEl.innerHTML = `🎧 Hör-Verstehen: Klicke und höre dir die Zahl an!`;
    subpromptEl.innerHTML = `<button class="filter-pill active" style="font-size:1rem; padding:8px 18px;" onclick="speakText('${q.correctFr}')">🔊 Zahl jetzt abspielen</button>`;
    optionsEl.innerHTML = q.options.map(n => {
      return `<button class="quiz-btn" onclick="checkNumQuizAnswer(${n})"><span style="font-weight:800; font-size:1.15rem; font-family:monospace;">${n}</span> <span>➔</span></button>`;
    }).join('');
    // Auto-speak after a tiny delay
    setTimeout(() => speakText(q.correctFr), 250);
  }
}

function checkNumQuizAnswer(userAnswer) {
  if (!numQuizCurrentAnswer) return;
  const q = numQuizCurrentAnswer;
  const feedbackEl = document.getElementById('num-quiz-feedback');
  const nextBtn = document.getElementById('num-quiz-next-btn');
  const scoreEl = document.getElementById('num-quiz-score');

  let isCorrect = false;
  if (q.mode === 'num_to_fr') {
    isCorrect = (userAnswer === q.correctFr);
  } else {
    isCorrect = (Number(userAnswer) === q.targetNum);
  }

  // Disable option buttons
  const btns = document.querySelectorAll('#num-quiz-options button');
  btns.forEach(b => b.disabled = true);

  const info = explainFrenchNumber(q.targetNum);

  if (isCorrect) {
    numQuizScore += 10;
    if (scoreEl) scoreEl.textContent = numQuizScore;
    if (feedbackEl) {
      feedbackEl.className = 'quiz-feedback correct';
      feedbackEl.innerHTML = `
        <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 0.25rem;">🎉 Richtig! Bravo!</div>
        <div><strong>${q.targetNum}</strong> heißt auf Französisch: <em>"${q.correctFr}"</em>.</div>
        <div style="font-size: 0.88rem; margin-top: 0.25rem; color: #166534;">${info.math} — ${info.tip}</div>
      `;
    }
  } else {
    if (feedbackEl) {
      feedbackEl.className = 'quiz-feedback wrong';
      feedbackEl.innerHTML = `
        <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 0.25rem;">❌ Leider nicht ganz richtig.</div>
        <div>Die richtige Antwort für <strong>${q.targetNum}</strong> ist: <strong>"${q.correctFr}"</strong>.</div>
        <div style="font-size: 0.88rem; margin-top: 0.25rem; color: #991b1b;">Erklärung: ${info.math} — ${info.tip}</div>
      `;
    }
  }

  if (nextBtn) nextBtn.style.display = 'inline-block';
}

function initNumbers() {
  // Live converter listeners
  const input = document.getElementById('num-converter-input');
  if (input) {
    input.addEventListener('input', updateLiveNumberConverter);
    input.addEventListener('change', updateLiveNumberConverter);
  }

  // Filter pills for numbers catalog
  const pills = document.querySelectorAll('.num-filter-pill');
  pills.forEach(p => {
    p.addEventListener('click', () => {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      numbersCurrentCat = p.getAttribute('data-cat') || 'all';
      renderNumbersGrid();
    });
  });

  // Search input for numbers catalog
  const searchInput = document.getElementById('numbers-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      numbersSearchQuery = e.target.value;
      renderNumbersGrid();
    });
  }

  // Initial renders
  updateLiveNumberConverter();
  renderNumbersGrid();
  loadNextNumQuiz();
}

// Exports for global access
window.initNumbers = initNumbers;
window.numberToFrench = numberToFrench;
window.setConverterNumber = setConverterNumber;
window.stepConverterNumber = stepConverterNumber;
window.checkNumQuizAnswer = checkNumQuizAnswer;
window.loadNextNumQuiz = loadNextNumQuiz;
