/**
 * Notenrechner Pro - Vollständige Gewichtungs-, Zeugnis-, Wunschnoten- & Punkteschlüssel-App
 */

const STORAGE_KEY = 'arcade_school_notenrechner_v1';

const GRADE_SYSTEMS = {
  CH: {
    id: 'CH',
    name: 'Schweiz (1–6)',
    min: 1,
    max: 6,
    best: 6,
    worst: 1,
    pass: 4.0,
    higherIsBetter: true,
    defaultRounding: 0.5,
    stepOptions: [6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0]
  },
  DE: {
    id: 'DE',
    name: 'Deutschland (1–6)',
    min: 1,
    max: 6,
    best: 1,
    worst: 6,
    pass: 4.0,
    higherIsBetter: false,
    defaultRounding: 0.5,
    stepOptions: [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
  },
  AT: {
    id: 'AT',
    name: 'Österreich (1–5)',
    min: 1,
    max: 5,
    best: 1,
    worst: 5,
    pass: 4.0,
    higherIsBetter: false,
    defaultRounding: 1.0,
    stepOptions: [1.0, 2.0, 3.0, 4.0, 5.0]
  },
  PT: {
    id: 'PT',
    name: 'Oberstufe Punkte (0–15)',
    min: 0,
    max: 15,
    best: 15,
    worst: 0,
    pass: 5.0,
    higherIsBetter: true,
    defaultRounding: 1.0,
    stepOptions: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5]
  }
};

const ROUNDING_MODES = [
  { val: 0.5, label: '0.5 (Halbe Noten)' },
  { val: 0.1, label: '0.1 (Zehntelnoten)' },
  { val: 0.25, label: '0.25 (Viertelnoten)' },
  { val: 1.0, label: '1.0 (Ganze Noten)' },
  { val: 0.01, label: 'Exakt (2 Dezimalstellen)' }
];

const CATEGORY_LABELS = {
  written: '📝 Schriftlich',
  oral: '🗣️ Mündlich',
  project: '🔬 Projekt'
};

function createDemoState(sysId = 'CH') {
  const isCH = sysId === 'CH';
  const isPT = sysId === 'PT';

  if (isPT) {
    return {
      system: 'PT',
      rounding: 1.0,
      theme: 'dark',
      activeSemesterId: 'sem1',
      semesters: [
        {
          id: 'sem1',
          name: '1. Halbjahr (Q1)',
          subjects: [
            {
              id: 'sub_math',
              name: 'Mathematik (LK)',
              weight: 2,
              mode: 'categories',
              catWeights: { written: 60, oral: 40, project: 0 },
              target: 12,
              core: 'core',
              dropWorst: false,
              grades: [
                { id: 'g1', title: 'Klausur 1 Analysis', value: 13, weight: 2, category: 'written', date: '2026-09-20' },
                { id: 'g2', title: 'Kurztest Ableitungen', value: 11, weight: 1, category: 'written', date: '2026-10-08' },
                { id: 'g3', title: 'Mitarbeit Quartal 1', value: 14, weight: 1, category: 'oral', date: '2026-10-18' }
              ]
            },
            {
              id: 'sub_de',
              name: 'Deutsch',
              weight: 1,
              mode: 'direct',
              catWeights: { written: 50, oral: 50, project: 0 },
              target: 11,
              core: 'core',
              dropWorst: false,
              grades: [
                { id: 'g4', title: 'Erörterung', value: 10, weight: 2, category: 'written', date: '2026-09-28' },
                { id: 'g5', title: 'Referat Sturm & Drang', value: 13, weight: 1, category: 'oral', date: '2026-10-12' }
              ]
            }
          ]
        }
      ]
    };
  }

  return {
    system: sysId,
    rounding: GRADE_SYSTEMS[sysId].defaultRounding,
    theme: 'dark',
    activeSemesterId: 'sem1',
    semesters: [
      {
        id: 'sem1',
        name: '1. Semester (Herbst/Winter)',
        subjects: [
          {
            id: 'sub_math',
            name: 'Mathematik',
            weight: 1,
            mode: 'direct',
            catWeights: { written: 70, oral: 30, project: 0 },
            target: isCH ? 5.0 : 2.0,
            core: 'core',
            dropWorst: false,
            grades: [
              { id: 'g1', title: 'Algebra & Gleichungen', value: isCH ? 5.25 : 1.75, weight: 1, category: 'written', date: '2026-09-14' },
              { id: 'g2', title: 'Geometrie Kurztest', value: isCH ? 4.5 : 2.5, weight: 0.5, category: 'written', date: '2026-09-29' },
              { id: 'g3', title: 'Semesterprüfung Funktionen', value: isCH ? 5.5 : 1.5, weight: 2, category: 'written', date: '2026-10-19' }
            ]
          },
          {
            id: 'sub_franz',
            name: 'Französisch',
            weight: 1,
            mode: 'categories',
            catWeights: { written: 60, oral: 40, project: 0 },
            target: isCH ? 4.5 : 2.5,
            core: 'core',
            dropWorst: false,
            grades: [
              { id: 'g4', title: 'Vocabulaire Unité 1-2', value: isCH ? 4.25 : 2.75, weight: 1, category: 'written', date: '2026-09-10' },
              { id: 'g5', title: 'Grammaire Futur Proche', value: isCH ? 4.75 : 2.25, weight: 2, category: 'written', date: '2026-10-04' },
              { id: 'g6', title: 'Présentation Orale Paris', value: isCH ? 5.25 : 1.75, weight: 1, category: 'oral', date: '2026-10-15' }
            ]
          },
          {
            id: 'sub_de',
            name: 'Deutsch',
            weight: 1,
            mode: 'direct',
            catWeights: { written: 60, oral: 40, project: 0 },
            target: isCH ? 5.0 : 2.0,
            core: 'core',
            dropWorst: false,
            grades: [
              { id: 'g7', title: 'Aufsatz Argumentation', value: isCH ? 5.0 : 2.0, weight: 2, category: 'written', date: '2026-09-22' },
              { id: 'g8', title: 'Buchvortrag', value: isCH ? 5.5 : 1.5, weight: 1, category: 'oral', date: '2026-10-11' }
            ]
          },
          {
            id: 'sub_nmg',
            name: 'Natur & Technik (Physik/Bio)',
            weight: 1,
            mode: 'categories',
            catWeights: { written: 50, oral: 20, project: 30 },
            target: isCH ? 5.0 : 2.0,
            core: 'normal',
            dropWorst: true,
            grades: [
              { id: 'g9', title: 'Optik & Linsen Test', value: isCH ? 4.0 : 3.0, weight: 1, category: 'written', date: '2026-09-18' },
              { id: 'g10', title: 'Labor-Protokoll Mikroskop', value: isCH ? 5.75 : 1.25, weight: 1, category: 'project', date: '2026-10-02' },
              { id: 'g11', title: 'Überraschungstest (Streichnote)', value: isCH ? 3.25 : 3.75, weight: 0.5, category: 'written', date: '2026-10-09' },
              { id: 'g12', title: 'Mündliche Mitarbeit', value: isCH ? 5.0 : 2.0, weight: 1, category: 'oral', date: '2026-10-20' }
            ]
          }
        ]
      },
      {
        id: 'sem2',
        name: '2. Semester (Frühling/Sommer)',
        subjects: []
      }
    ]
  };
}

let state = loadState();
let simHypotheticalGrades = [];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.semesters) && parsed.semesters.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not load Notenrechner state:', e);
  }
  return createDemoState('CH');
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save Notenrechner state:', e);
  }
}

function getSys() {
  return GRADE_SYSTEMS[state.system] || GRADE_SYSTEMS.CH;
}

function getActiveSemester() {
  let sem = state.semesters.find(s => s.id === state.activeSemesterId);
  if (!sem) {
    sem = state.semesters[0];
    state.activeSemesterId = sem.id;
  }
  return sem;
}

function roundToStep(value, step) {
  if (value === null || value === undefined || isNaN(value)) return null;
  if (!step || step <= 0.01) return Math.round(value * 100) / 100;
  // Standard commercial rounding (half away from zero / towards better grade)
  const inv = 1 / step;
  return Math.round((value + 1e-9) * inv) / inv;
}

function formatGrade(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '–';
  if (state.rounding === 1.0 && decimals === 1) return Math.round(value).toString();
  return Number(value).toFixed(decimals);
}

function isGradeBetter(a, b, sys = getSys()) {
  return sys.higherIsBetter ? a > b : a < b;
}

function getGradeBadgeClass(value, sys = getSys()) {
  if (value === null || value === undefined || isNaN(value)) return 'grade-neutral';
  if (sys.id === 'CH') {
    if (value >= 5.25) return 'grade-excellent';
    if (value >= 4.5) return 'grade-good';
    if (value >= 4.0) return 'grade-warn';
    return 'grade-bad';
  } else if (sys.id === 'PT') {
    if (value >= 12) return 'grade-excellent';
    if (value >= 8) return 'grade-good';
    if (value >= 5) return 'grade-warn';
    return 'grade-bad';
  } else {
    // DE / AT (1 is best, <= 4.0 is pass)
    if (value <= 1.75) return 'grade-excellent';
    if (value <= 2.75) return 'grade-good';
    if (value <= 4.0) return 'grade-warn';
    return 'grade-bad';
  }
}

/**
 * Calculates exact average, total weight, dropped grade id, and category breakdown for a subject
 */
function calculateSubjectStats(subject, extraGrades = []) {
  const sys = getSys();
  const allGrades = [...(subject.grades || []), ...extraGrades].filter(
    g => g && !isNaN(parseFloat(g.value)) && !isNaN(parseFloat(g.weight)) && parseFloat(g.weight) > 0
  );

  if (allGrades.length === 0) {
    return {
      exactAvg: null,
      roundedAvg: null,
      totalWeight: 0,
      activeCount: 0,
      droppedId: null,
      catAverages: {}
    };
  }

  // Determine if worst grade is dropped (only if at least 2 grades exist)
  let droppedId = null;
  if (subject.dropWorst && allGrades.length >= 2) {
    let worstGrade = allGrades[0];
    for (const g of allGrades) {
      if (sys.higherIsBetter ? g.value < worstGrade.value : g.value > worstGrade.value) {
        worstGrade = g;
      }
    }
    droppedId = worstGrade.id;
  }

  const activeGrades = allGrades.filter(g => g.id !== droppedId);

  // Calculate per-category averages
  const catAverages = {};
  ['written', 'oral', 'project'].forEach(cat => {
    const cg = activeGrades.filter(g => (g.category || 'written') === cat);
    if (cg.length > 0) {
      const wSum = cg.reduce((acc, g) => acc + Number(g.weight), 0);
      const vSum = cg.reduce((acc, g) => acc + Number(g.value) * Number(g.weight), 0);
      catAverages[cat] = wSum > 0 ? vSum / wSum : null;
    } else {
      catAverages[cat] = null;
    }
  });

  let exactAvg = null;
  let totalWeight = activeGrades.reduce((acc, g) => acc + Number(g.weight), 0);

  if (subject.mode === 'categories') {
    const cw = subject.catWeights || { written: 60, oral: 40, project: 0 };
    let activeCatWeightSum = 0;
    let weightedCatSum = 0;

    ['written', 'oral', 'project'].forEach(cat => {
      const cAvg = catAverages[cat];
      const cWeight = Number(cw[cat] || 0);
      if (cAvg !== null && cWeight > 0) {
        activeCatWeightSum += cWeight;
        weightedCatSum += cAvg * cWeight;
      }
    });

    if (activeCatWeightSum > 0) {
      exactAvg = weightedCatSum / activeCatWeightSum;
    } else if (totalWeight > 0) {
      // Fallback if user put grades into a 0%-weight category
      const vSum = activeGrades.reduce((acc, g) => acc + Number(g.value) * Number(g.weight), 0);
      exactAvg = vSum / totalWeight;
    }
  } else {
    // Direct weighted average
    if (totalWeight > 0) {
      const vSum = activeGrades.reduce((acc, g) => acc + Number(g.value) * Number(g.weight), 0);
      exactAvg = vSum / totalWeight;
    }
  }

  const roundedAvg = exactAvg !== null ? roundToStep(exactAvg, state.rounding) : null;

  return {
    exactAvg,
    roundedAvg,
    totalWeight,
    activeCount: activeGrades.length,
    droppedId,
    catAverages
  };
}

/**
 * Calculates semester-level KPIs (exact average, rounded average, plus/minus points, promotion status)
 */
function calculateSemesterStats(semester) {
  const sys = getSys();
  const subjects = semester.subjects || [];

  let exactWeightedSum = 0;
  let roundedWeightedSum = 0;
  let subjectWeightSum = 0;
  let totalExams = 0;

  let plusPoints = 0;
  let minusPoints = 0;
  let doubleMinusPoints = 0;
  let failingSubjectsCount = 0;

  subjects.forEach(sub => {
    totalExams += (sub.grades || []).length;
    const st = calculateSubjectStats(sub);
    if (st.exactAvg !== null && sub.core !== 'none' && Number(sub.weight) > 0) {
      const w = Number(sub.weight);
      exactWeightedSum += st.exactAvg * w;
      roundedWeightedSum += st.roundedAvg * w;
      subjectWeightSum += w;

      // Plus / Minus points relative to pass mark (4.0 in CH/DE/AT, 5.0 in PT)
      const g = st.roundedAvg;
      if (sys.higherIsBetter) {
        if (g > sys.pass) {
          plusPoints += (g - sys.pass) * w;
        } else if (g < sys.pass) {
          const deficit = (sys.pass - g) * w;
          minusPoints += deficit;
          doubleMinusPoints += deficit * 2;
          failingSubjectsCount++;
        }
      } else {
        // DE / AT: lower is better, pass is 4.0
        if (g < sys.pass) {
          plusPoints += (sys.pass - g) * w;
        } else if (g > sys.pass) {
          const deficit = (g - sys.pass) * w;
          minusPoints += deficit;
          doubleMinusPoints += deficit * 2;
          failingSubjectsCount++;
        }
      }
    }
  });

  const exactOverall = subjectWeightSum > 0 ? exactWeightedSum / subjectWeightSum : null;
  const roundedOverall = subjectWeightSum > 0 ? roundedWeightedSum / subjectWeightSum : null;
  const netBalance = plusPoints - minusPoints;
  const netDoubleCompensation = plusPoints - doubleMinusPoints;

  return {
    exactOverall,
    roundedOverall,
    totalExams,
    plusPoints: Math.round(plusPoints * 100) / 100,
    minusPoints: Math.round(minusPoints * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
    netDoubleCompensation: Math.round(netDoubleCompensation * 100) / 100,
    failingSubjectsCount
  };
}

// ==========================================
// UI RENDERING
// ==========================================

function applyTheme() {
  const isDark = state.theme === 'dark';
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  const icon = document.getElementById('themeIcon');
  const text = document.getElementById('themeText');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  if (text) text.textContent = isDark ? 'Light' : 'Dark';
}

function renderHeaderControls() {
  const sysSelect = document.getElementById('systemSelect');
  if (sysSelect) sysSelect.value = state.system;

  const roundingText = document.getElementById('roundingText');
  if (roundingText) {
    const mode = ROUNDING_MODES.find(m => m.val === state.rounding) || ROUNDING_MODES[0];
    roundingText.textContent = `Rundung: ${mode.val === 0.01 ? 'Exakt' : mode.val}`;
  }
}

function renderSemesterBar() {
  const container = document.getElementById('semesterTabs');
  if (!container) return;

  const tabsHtml = state.semesters.map(sem => {
    const isActive = sem.id === state.activeSemesterId ? 'active' : '';
    return `
      <button class="sem-tab ${isActive}" onclick="selectSemester('${sem.id}')" ondblclick="renameSemester('${sem.id}')" title="Doppelklick zum Umbenennen">
        <span>📅 ${escapeHtml(sem.name)}</span>
        ${state.semesters.length > 1 ? `<span onclick="event.stopPropagation(); deleteSemester('${sem.id}')" style="opacity:0.7; font-size:0.75rem; margin-left:4px;" title="Semester löschen">✕</span>` : ''}
      </button>
    `;
  }).join('');

  container.innerHTML = tabsHtml + `<button class="sem-add-btn" onclick="addSemester()">+ Semester</button>`;
}

function renderKPIs() {
  const sem = getActiveSemester();
  const stats = calculateSemesterStats(sem);
  const sys = getSys();

  const exactEl = document.getElementById('kpiExactAvg');
  const roundedEl = document.getElementById('kpiRoundedAvg');
  const balValEl = document.getElementById('kpiBalanceValue');
  const balSubEl = document.getElementById('kpiBalanceSub');
  const examsEl = document.getElementById('kpiTotalExams');
  const subsEl = document.getElementById('kpiTotalSubjects');

  if (exactEl) {
    exactEl.textContent = stats.exactOverall !== null ? stats.exactOverall.toFixed(2) : '–';
    exactEl.className = 'kpi-value ' + (stats.exactOverall !== null ? getGradeBadgeClass(stats.exactOverall, sys) : '');
    exactEl.style.background = 'transparent';
    exactEl.style.border = 'none';
    exactEl.style.padding = '0';
  }

  if (roundedEl) {
    roundedEl.textContent = stats.roundedOverall !== null ? stats.roundedOverall.toFixed(2) : '–';
  }

  if (balValEl) {
    if (stats.exactOverall === null) {
      balValEl.textContent = '–';
    } else {
      const sign = stats.netBalance >= 0 ? '+' : '';
      balValEl.textContent = `${sign}${stats.netBalance.toFixed(2)}`;
      balValEl.style.color = stats.netDoubleCompensation >= 0 ? 'var(--success)' : 'var(--danger)';
    }
  }

  if (balSubEl) {
    balSubEl.textContent = `+${stats.plusPoints} Plus / -${stats.minusPoints} Minus (${stats.failingSubjectsCount} ungenügend)`;
  }

  if (examsEl) examsEl.textContent = stats.totalExams;
  if (subsEl) subsEl.textContent = `${sem.subjects.length} Fächer in ${sem.name}`;
}

function renderSubjectsGrid() {
  const container = document.getElementById('subjectsContainer');
  if (!container) return;

  const sem = getActiveSemester();
  const sys = getSys();

  if (!sem.subjects || sem.subjects.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align:center; padding:2.5rem 1.5rem;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">📚</div>
        <h3 style="margin-bottom:0.4rem;">Noch keine Fächer in diesem Semester</h3>
        <p style="color:var(--text-muted); margin-bottom:1rem;">Füge oben ein neues Fach hinzu oder lade die Beispiel-Fächer.</p>
        <button class="btn btn-primary" onclick="resetDemoData()">✨ Beispiel-Fächer laden</button>
      </div>
    `;
    return;
  }

  container.innerHTML = sem.subjects.map(sub => {
    const st = calculateSubjectStats(sub);
    const badgeClass = getGradeBadgeClass(st.exactAvg, sys);
    const roundedDecimals = state.rounding === 0.25 || state.rounding === 0.01 ? 2 : (state.rounding === 1.0 ? 0 : 1);

    // Category breakdown pill if in category mode
    let modePill = `<span class="pill">⚖️ Faktor ${sub.weight}x</span>`;
    if (sub.core === 'core') {
      modePill += `<span class="pill pill-core">⭐ Kernfach</span>`;
    } else if (sub.core === 'none') {
      modePill += `<span class="pill">💤 Ohne Zeugnis-Einfluss</span>`;
    }
    if (sub.dropWorst) {
      modePill += `<span class="pill" title="Schlechteste Note wird automatisch gestrichen">✂️ Streichnote aktiv</span>`;
    }

    let catSummaryHtml = '';
    if (sub.mode === 'categories') {
      const cw = sub.catWeights || { written: 60, oral: 40, project: 0 };
      const parts = [];
      if (cw.written > 0) parts.push(`📝 ${cw.written}% (${st.catAverages.written !== null ? st.catAverages.written.toFixed(2) : '–'})`);
      if (cw.oral > 0) parts.push(`🗣️ ${cw.oral}% (${st.catAverages.oral !== null ? st.catAverages.oral.toFixed(2) : '–'})`);
      if (cw.project > 0) parts.push(`🔬 ${cw.project}% (${st.catAverages.project !== null ? st.catAverages.project.toFixed(2) : '–'})`);
      catSummaryHtml = `<div style="font-size:0.75rem; color:var(--text-muted); background:var(--surface-alt); padding:0.35rem 0.6rem; border-radius:6px; border:1px solid var(--border);"><strong>Kategorien:</strong> ${parts.join(' · ')}</div>`;
    }

    // Target / Required next grade hint
    let targetHintHtml = '';
    if (sub.target && !isNaN(parseFloat(sub.target)) && st.exactAvg !== null) {
      const targetVal = parseFloat(sub.target);
      const curW = st.totalWeight || 1;
      const neededNext = (targetVal * (curW + 1)) - (st.exactAvg * curW);
      const reached = sys.higherIsBetter ? st.exactAvg >= targetVal : st.exactAvg <= targetVal;
      targetHintHtml = `
        <div class="target-bar-wrap">
          <span>🎯 Ziel: <strong>${targetVal.toFixed(1)}</strong></span>
          <span>${reached ? '✅ Ziel erreicht!' : `Nächster Test (1x) für Ziel: <strong>${neededNext.toFixed(2)}</strong>`}</span>
        </div>
      `;
    }

    // Grades items
    const gradesHtml = (sub.grades || []).length === 0
      ? `<div style="font-size:0.82rem; color:var(--text-muted); text-align:center; padding:0.75rem;">Noch keine Noten eingetragen.</div>`
      : (sub.grades || []).map(g => {
          const isDropped = st.droppedId === g.id;
          const gBadge = getGradeBadgeClass(g.value, sys);
          const catIcon = g.category === 'oral' ? '🗣️' : (g.category === 'project' ? '🔬' : '📝');
          return `
            <div class="grade-item ${isDropped ? 'dropped' : ''}" title="${isDropped ? 'Als schlechteste Note gestrichen' : ''}">
              <div class="grade-item-left">
                <span class="grade-badge ${gBadge}">${Number(g.value).toFixed(2).replace(/\.00$/, '.0')}</span>
                <div style="min-width:0;">
                  <div class="grade-item-title">${escapeHtml(g.title || 'Prüfung')}</div>
                  <div class="grade-item-cat">${catIcon} ${CATEGORY_LABELS[g.category || 'written'].replace(/^[^\s]+\s/, '')} ${g.date ? '· ' + g.date : ''} ${isDropped ? '· (Gestrichen)' : ''}</div>
                </div>
              </div>
              <div class="grade-item-right">
                <span class="weight-tag" title="Gewichtung dieser Note">${g.weight}x</span>
                <button class="icon-btn" onclick="editGradePrompt('${sub.id}', '${g.id}')" title="Note oder Gewichtung bearbeiten">✏️</button>
                <button class="icon-btn" onclick="deleteGrade('${sub.id}', '${g.id}')" title="Note löschen">✕</button>
              </div>
            </div>
          `;
        }).join('');

    return `
      <div class="subject-card">
        <div class="subject-top">
          <div>
            <div class="subject-title-group">
              <span class="subject-name">${escapeHtml(sub.name)}</span>
              <button class="icon-btn" onclick="openSubjectModal('${sub.id}')" title="Fach-Gewichtung, Kategorien & Streichnote einstellen">⚙️</button>
            </div>
            <div class="subject-meta-pills">${modePill}</div>
          </div>
          <div class="subject-avg-box">
            <div class="subject-avg-main">
              <span class="grade-badge ${badgeClass}" style="font-size:1.15rem; padding:0.25rem 0.7rem;">
                ${st.exactAvg !== null ? st.exactAvg.toFixed(2) : '–'}
              </span>
            </div>
            <div class="subject-avg-rounded">
              Zeugnis: <strong>${st.roundedAvg !== null ? st.roundedAvg.toFixed(roundedDecimals) : '–'}</strong>
            </div>
          </div>
        </div>

        ${catSummaryHtml}

        <div class="grades-list">
          ${gradesHtml}
        </div>

        ${targetHintHtml}

        <form class="quick-add-row" onsubmit="handleQuickAddGrade(event, '${sub.id}')">
          <input type="text" name="title" class="input" placeholder="Prüfung / Thema..." required>
          <input type="number" name="value" class="input" placeholder="Note" step="0.01" min="${sys.min}" max="${sys.max}" required>
          <input type="number" name="weight" class="input" placeholder="Gewicht" value="1" step="0.05" min="0.05" max="20" title="Gewichtung (z.B. 1 = Einfach, 2 = Doppelt, 0.5 = Halb)" required>
          <select name="category" class="select" title="Kategorie">
            <option value="written">📝 Schriftl.</option>
            <option value="oral">🗣️ Mündl.</option>
            <option value="project">🔬 Projekt</option>
          </select>
          <button type="submit" class="btn btn-primary btn-sm" title="Note hinzufügen">+</button>
        </form>
      </div>
    `;
  }).join('');
}

// ==========================================
// TAB 2: WUNSCHNOTEN & SIMULATOR
// ==========================================

function populateSubjectSelects() {
  const sem = getActiveSemester();
  const subs = sem.subjects || [];

  const targetSel = document.getElementById('targetSubjectSelect');
  const simSel = document.getElementById('simSubjectSelect');
  const ptSel = document.getElementById('ptTransferSubject');

  if (targetSel) {
    const prev = targetSel.value;
    targetSel.innerHTML = `<option value="__manual__">✍️ Manuelle Eingabe (Freie Werte)</option>` +
      subs.map(s => `<option value="${s.id}">📘 ${escapeHtml(s.name)}</option>`).join('');
    if (subs.some(s => s.id === prev)) {
      targetSel.value = prev;
    } else if (subs.length > 0 && prev !== '__manual__') {
      targetSel.value = subs[0].id;
    }
  }

  if (simSel) {
    const prev = simSel.value;
    simSel.innerHTML = subs.length === 0
      ? `<option value="">Keine Fächer vorhanden</option>`
      : subs.map(s => `<option value="${s.id}">📘 ${escapeHtml(s.name)}</option>`).join('');
    if (subs.some(s => s.id === prev)) simSel.value = prev;
  }

  if (ptSel) {
    const prev = ptSel.value;
    ptSel.innerHTML = subs.length === 0
      ? `<option value="">Erst ein Fach anlegen</option>`
      : subs.map(s => `<option value="${s.id}">📘 ${escapeHtml(s.name)}</option>`).join('');
    if (subs.some(s => s.id === prev)) ptSel.value = prev;
  }
}

function syncTargetInputsFromSubject() {
  const sel = document.getElementById('targetSubjectSelect');
  if (!sel || sel.value === '__manual__') {
    updateTargetCalculator();
    return;
  }
  const sem = getActiveSemester();
  const sub = sem.subjects.find(s => s.id === sel.value);
  if (!sub) return;

  const st = calculateSubjectStats(sub);
  const sys = getSys();

  const curAvgEl = document.getElementById('targetCurAvg');
  const curWeightEl = document.getElementById('targetCurWeight');
  const goalEl = document.getElementById('targetGoalGrade');

  if (curAvgEl) curAvgEl.value = st.exactAvg !== null ? st.exactAvg.toFixed(2) : (sys.higherIsBetter ? 4.5 : 2.5);
  if (curWeightEl) curWeightEl.value = st.totalWeight > 0 ? st.totalWeight : 1;
  if (goalEl && sub.target) {
    goalEl.value = sub.target;
  } else if (goalEl && st.exactAvg !== null) {
    // Default goal: next half grade step for rounding threshold
    if (sys.id === 'CH') goalEl.value = 4.75;
    else if (sys.id === 'DE' || sys.id === 'AT') goalEl.value = 2.25;
    else goalEl.value = 11;
  }

  updateTargetCalculator();
}

function updateTargetCalculator() {
  const sys = getSys();
  const curAvg = parseFloat(document.getElementById('targetCurAvg')?.value || 0);
  const curWeight = parseFloat(document.getElementById('targetCurWeight')?.value || 1);
  const goalGrade = parseFloat(document.getElementById('targetGoalGrade')?.value || 0);
  const nextWeight = parseFloat(document.getElementById('targetNextWeight')?.value || 1);

  const resBox = document.getElementById('targetResultBox');
  const tbody = document.querySelector('#targetStepsTable tbody');
  if (!resBox || !tbody) return;

  if (nextWeight <= 0 || curWeight < 0) {
    resBox.innerHTML = 'Bitte gültige Gewichtungen (> 0) eingeben.';
    return;
  }

  const requiredGrade = (goalGrade * (curWeight + nextWeight) - curAvg * curWeight) / nextWeight;
  const possible = requiredGrade >= sys.min && requiredGrade <= sys.max;

  let statusClass = 'callout-success';
  let statusText = '';

  if (sys.higherIsBetter) {
    if (requiredGrade <= sys.min) {
      statusText = `🎉 Selbst mit einer <strong>${sys.min.toFixed(1)}</strong> bleibst du über dem Ziel von ${goalGrade.toFixed(2)}!`;
    } else if (requiredGrade > sys.max) {
      statusClass = 'callout-danger';
      statusText = `⚠️ Mit einer einzelnen Prüfung (Gewicht ${nextWeight}x) nicht direkt erreichbar – du bräuchtest rechnerisch eine <strong>${requiredGrade.toFixed(2)}</strong> (Maximum ist ${sys.max}). Tipp: Höhere Prüfungsgewichtung oder mehrere Prüfungen einplanen.`;
    } else {
      statusText = `🎯 Du benötigst in der nächsten Prüfung (Gewichtung ${nextWeight}x) mindestens eine <strong>${requiredGrade.toFixed(2)}</strong>, um auf genau <strong>${goalGrade.toFixed(2)}</strong> zu kommen.`;
    }
  } else {
    // Lower is better (DE / AT)
    if (requiredGrade >= sys.max) {
      statusText = `🎉 Selbst mit einer <strong>${sys.max.toFixed(1)}</strong> bleibst du im Schnitt auf oder besser als ${goalGrade.toFixed(2)}!`;
    } else if (requiredGrade < sys.min) {
      statusClass = 'callout-danger';
      statusText = `⚠️ Mit einer einzelnen Prüfung (Gewicht ${nextWeight}x) nicht auf Anhieb erreichbar – du bräuchtest rechnerisch eine <strong>${requiredGrade.toFixed(2)}</strong> (Beste Note ist ${sys.min}).`;
    } else {
      statusText = `🎯 Du benötigst in der nächsten Prüfung (Gewichtung ${nextWeight}x) mindestens eine <strong>${requiredGrade.toFixed(2)}</strong>, um auf einen Schnitt von <strong>${goalGrade.toFixed(2)}</strong> zu kommen.`;
    }
  }

  resBox.className = `callout ${statusClass}`;
  resBox.innerHTML = statusText;

  // Populate steps table
  const halfStep = state.rounding === 1.0 ? 0.5 : (state.rounding === 0.5 ? 0.25 : 0);
  tbody.innerHTML = sys.stepOptions.map(step => {
    // Threshold needed before rounding
    let threshold = step;
    if (halfStep > 0) {
      threshold = sys.higherIsBetter ? (step - halfStep) : (step + halfStep);
    }
    const req = (threshold * (curWeight + nextWeight) - curAvg * curWeight) / nextWeight;
    let badge = '';
    if (sys.higherIsBetter) {
      if (req <= sys.min) badge = '<span class="grade-badge grade-excellent">Sicher erreicht</span>';
      else if (req <= sys.pass) badge = '<span class="grade-badge grade-good">Gut machbar</span>';
      else if (req <= sys.max) badge = '<span class="grade-badge grade-warn">Anspruchsvoll</span>';
      else badge = '<span class="grade-badge grade-bad">Unmöglich (1 Test)</span>';
    } else {
      if (req >= sys.max) badge = '<span class="grade-badge grade-excellent">Sicher erreicht</span>';
      else if (req >= sys.pass) badge = '<span class="grade-badge grade-good">Gut machbar</span>';
      else if (req >= sys.min) badge = '<span class="grade-badge grade-warn">Anspruchsvoll</span>';
      else badge = '<span class="grade-badge grade-bad">Unmöglich (1 Test)</span>';
    }

    return `
      <tr>
        <td><strong>${step.toFixed(sys.id === 'PT' ? 0 : 1)}</strong></td>
        <td>${threshold.toFixed(2)}</td>
        <td><strong>${req.toFixed(2)}</strong></td>
        <td>${badge}</td>
      </tr>
    `;
  }).join('');
}

function renderSimulator() {
  const sel = document.getElementById('simSubjectSelect');
  const listEl = document.getElementById('simGradesList');
  const compEl = document.getElementById('simComparisonBox');
  if (!sel || !listEl || !compEl) return;

  const sem = getActiveSemester();
  const sub = sem.subjects.find(s => s.id === sel.value);
  const sys = getSys();

  if (!sub) {
    listEl.innerHTML = '';
    compEl.innerHTML = 'Bitte zuerst ein Fach auswählen.';
    return;
  }

  if (simHypotheticalGrades.length === 0) {
    listEl.innerHTML = `<div style="font-size:0.82rem; color:var(--text-muted); padding:0.5rem;">Noch keine hypothetischen Prüfungen hinzugefügt.</div>`;
  } else {
    listEl.innerHTML = simHypotheticalGrades.map((g, idx) => `
      <div class="grade-item">
        <div class="grade-item-left">
          <span class="grade-badge ${getGradeBadgeClass(g.value, sys)}">${Number(g.value).toFixed(2)}</span>
          <div>
            <div class="grade-item-title">Simulierte Prüfung #${idx + 1}</div>
            <div class="grade-item-cat">${CATEGORY_LABELS[g.category]}</div>
          </div>
        </div>
        <div class="grade-item-right">
          <span class="weight-tag">${g.weight}x</span>
          <button class="icon-btn" onclick="removeSimGrade(${idx})">✕</button>
        </div>
      </div>
    `).join('');
  }

  const beforeStats = calculateSubjectStats(sub);
  const afterStats = calculateSubjectStats(sub, simHypotheticalGrades);

  const bAvg = beforeStats.exactAvg !== null ? beforeStats.exactAvg.toFixed(2) : '–';
  const aAvg = afterStats.exactAvg !== null ? afterStats.exactAvg.toFixed(2) : '–';
  const diff = (beforeStats.exactAvg !== null && afterStats.exactAvg !== null)
    ? (afterStats.exactAvg - beforeStats.exactAvg)
    : 0;
  const diffStr = diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);

  compEl.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
      <div>
        <div style="font-size:0.78rem; color:var(--text-muted);">Aktueller Schnitt (${ escapeHtml(sub.name) })</div>
        <div style="font-size:1.3rem; font-weight:800;">${bAvg} <span style="font-size:0.85rem; color:var(--text-muted);">(Zeugnis: ${beforeStats.roundedAvg !== null ? beforeStats.roundedAvg : '–'})</span></div>
      </div>
      <div style="font-size:1.4rem;">➔</div>
      <div>
        <div style="font-size:0.78rem; color:var(--text-muted);">Simulierter neuer Schnitt</div>
        <div style="font-size:1.3rem; font-weight:800;">${aAvg} <span style="font-size:0.85rem; color:var(--text-muted);">(Zeugnis: ${afterStats.roundedAvg !== null ? afterStats.roundedAvg : '–'})</span></div>
      </div>
      <div>
        <span class="grade-badge ${getGradeBadgeClass(afterStats.exactAvg, sys)}">Veränderung: ${diffStr}</span>
      </div>
    </div>
  `;
}

// ==========================================
// TAB 3: PUNKTE -> NOTE RECHNER
// ==========================================

function computeGradeFromPoints(earned, max, formula, passPct, sys = getSys()) {
  const pct = max > 0 ? Math.max(0, Math.min(1.5, earned / max)) : 0;
  const pPass = Math.max(0.1, Math.min(0.95, passPct / 100));

  if (sys.id === 'CH') {
    if (formula === 'linear') {
      // Classic Swiss formula: (earned / max) * 5 + 1
      return Math.min(6, Math.max(1, pct * 5 + 1));
    } else if (formula === 'threshold') {
      // Knick-Skala: 0 -> 1.0, passPct -> 4.0, 100% -> 6.0
      if (pct <= pPass) {
        return 1 + 3 * (pct / pPass);
      } else {
        return Math.min(6, 4 + 2 * ((pct - pPass) / (1 - pPass)));
      }
    } else {
      // KMK mapped to Swiss
      return Math.min(6, Math.max(1, pct * 5 + 1));
    }
  } else if (sys.id === 'PT') {
    return Math.min(15, Math.max(0, pct * 15));
  } else {
    // DE / AT (1 is best, 6 or 5 is worst)
    const worst = sys.worst;
    if (formula === 'linear') {
      return Math.max(1, Math.min(worst, worst - pct * (worst - 1)));
    } else if (formula === 'threshold') {
      if (pct >= pPass) {
        return Math.max(1, 4 - 3 * ((pct - pPass) / (1 - pPass)));
      } else {
        return Math.min(worst, worst - (worst - 4) * (pct / pPass));
      }
    } else {
      // KMK / IHK Standard
      const p100 = pct * 100;
      if (p100 >= 92) return 1.0 + (100 - Math.min(100, p100)) / 8 * 0.4;
      if (p100 >= 81) return 1.5 + (92 - p100) / 11 * 0.9;
      if (p100 >= 67) return 2.5 + (81 - p100) / 14 * 0.9;
      if (p100 >= 50) return 3.5 + (67 - p100) / 17 * 0.9;
      if (p100 >= 30) return 4.5 + (50 - p100) / 20 * 0.9;
      return worst;
    }
  }
}

function updatePointsCalculator() {
  const sys = getSys();
  const max = parseFloat(document.getElementById('ptMax')?.value || 40);
  const earned = parseFloat(document.getElementById('ptEarned')?.value || 0);
  const formula = document.getElementById('ptFormula')?.value || 'linear';
  const passPct = parseFloat(document.getElementById('ptPassPct')?.value || 60);
  const stepMode = document.getElementById('ptStepSelect')?.value || '0.5';

  const resBox = document.getElementById('ptResultBox');
  const tbody = document.querySelector('#ptScaleTable tbody');
  if (!resBox || !tbody || max <= 0) return;

  const exactGrade = computeGradeFromPoints(earned, max, formula, passPct, sys);
  const roundedGrade = roundToStep(exactGrade, state.rounding);
  const pct = (earned / max) * 100;
  const passPoints = (max * passPct) / 100;

  resBox.className = `callout ${getGradeBadgeClass(exactGrade, sys) === 'grade-bad' ? 'callout-danger' : 'callout-success'}`;
  resBox.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
      <div>
        <div style="font-size:0.8rem; opacity:0.85;">Erreichte Leistung: <strong>${earned} / ${max} Pkt. (${pct.toFixed(1)}%)</strong></div>
        <div style="font-size:1.45rem; font-weight:800; margin-top:0.2rem;">
          Exakte Note: ${exactGrade.toFixed(2)} &nbsp;·&nbsp; Gerundet: <span class="grade-badge ${getGradeBadgeClass(roundedGrade, sys)}">${roundedGrade.toFixed(state.rounding === 1 ? 0 : 2)}</span>
        </div>
      </div>
      <div style="font-size:0.82rem; text-align:right;">
        <div>Bestehensgrenze (${sys.pass.toFixed(1)}): <strong>ab ${ (formula === 'linear' && sys.id === 'CH' ? max * 0.6 : passPoints).toFixed(1) } Pkt.</strong></div>
      </div>
    </div>
  `;

  // Render full table
  const rows = [];
  if (stepMode === 'grades') {
    sys.stepOptions.forEach(gTarget => {
      // Find points needed for gTarget
      let ptsNeeded = 0;
      if (sys.id === 'CH' && formula === 'linear') {
        ptsNeeded = ((gTarget - 1) / 5) * max;
      } else {
        // Binary search in [0, max]
        let lo = 0, hi = max;
        for (let i = 0; i < 25; i++) {
          const mid = (lo + hi) / 2;
          const g = computeGradeFromPoints(mid, max, formula, passPct, sys);
          if ((sys.higherIsBetter && g < gTarget) || (!sys.higherIsBetter && g > gTarget)) {
            lo = mid;
          } else {
            hi = mid;
          }
        }
        ptsNeeded = (lo + hi) / 2;
      }
      const pPct = (ptsNeeded / max) * 100;
      rows.push(`
        <tr>
          <td>ab <strong>${ptsNeeded.toFixed(1)} Pkt.</strong></td>
          <td>${pPct.toFixed(1)}%</td>
          <td>${gTarget.toFixed(2)}</td>
          <td><span class="grade-badge ${getGradeBadgeClass(gTarget, sys)}">${gTarget.toFixed(state.rounding === 1 ? 0 : 1)}</span></td>
        </tr>
      `);
    });
  } else {
    const step = parseFloat(stepMode) || 1;
    // Limit max rows to 120 so huge point totals don't lag
    const effectiveStep = max / step > 120 ? Math.ceil(max / 80) : step;
    for (let p = max; p >= 0; p = Math.round((p - effectiveStep) * 100) / 100) {
      const g = computeGradeFromPoints(p, max, formula, passPct, sys);
      const gr = roundToStep(g, state.rounding);
      const isCurrent = Math.abs(p - earned) < effectiveStep / 2;
      rows.push(`
        <tr style="${isCurrent ? 'background:var(--primary-light); font-weight:700;' : ''}">
          <td>${p.toFixed(effectiveStep % 1 === 0 ? 0 : 1)} / ${max}</td>
          <td>${((p / max) * 100).toFixed(1)}%</td>
          <td>${g.toFixed(2)}</td>
          <td><span class="grade-badge ${getGradeBadgeClass(gr, sys)}">${gr.toFixed(state.rounding === 1 ? 0 : 2)}</span></td>
        </tr>
      `);
    }
  }

  tbody.innerHTML = rows.join('');
}

// ==========================================
// TAB 4: ZEUGNIS, PROMOTION & STATISTIK
// ==========================================

function renderPromotionAndStats() {
  const sem = getActiveSemester();
  const sys = getSys();
  const semStats = calculateSemesterStats(sem);

  const promoBox = document.getElementById('promotionStatusBox');
  const reportTbody = document.querySelector('#reportCardTable tbody');
  const chartContainer = document.getElementById('subjectChartContainer');
  const allSemTbody = document.querySelector('#allSemestersTable tbody');

  if (promoBox) {
    if (semStats.exactOverall === null) {
      promoBox.className = 'callout';
      promoBox.innerHTML = 'Trage Noten ein, um deine Promotions- und Kompensationsbilanz zu sehen.';
    } else {
      const passedOverall = sys.higherIsBetter
        ? semStats.roundedOverall >= sys.pass
        : semStats.roundedOverall <= sys.pass;
      const passedComp = semStats.netDoubleCompensation >= 0;
      const isPromoted = passedOverall && passedComp && semStats.failingSubjectsCount <= 3;

      promoBox.className = `callout ${isPromoted ? 'callout-success' : 'callout-warn'}`;
      promoBox.innerHTML = `
        <div style="font-weight:800; font-size:1rem; margin-bottom:0.35rem;">
          ${isPromoted ? '✅ Promotionsbedingungen erfüllt!' : '⚠️ Achtung: Promotionsbedingungen kritisch'}
        </div>
        <div style="font-size:0.86rem; display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.5rem;">
          <div>➕ Pluspunkte: <strong>+${semStats.plusPoints.toFixed(2)}</strong></div>
          <div>➖ Minuspunkte (Einfach): <strong>-${semStats.minusPoints.toFixed(2)}</strong></div>
          <div>⚖️ Doppelte Kompensation: <strong>${semStats.netDoubleCompensation >= 0 ? '+' : ''}${semStats.netDoubleCompensation.toFixed(2)}</strong> ${semStats.netDoubleCompensation >= 0 ? '(Genügend)' : '(Unterdeckung)'}</div>
          <div>🚨 Ungenügende Fächer: <strong>${semStats.failingSubjectsCount}</strong></div>
        </div>
      `;
    }
  }

  if (reportTbody) {
    reportTbody.innerHTML = (sem.subjects || []).map(sub => {
      const st = calculateSubjectStats(sub);
      const g = st.roundedAvg;
      let pmText = '–';
      if (g !== null && sub.core !== 'none') {
        const diff = sys.higherIsBetter ? (g - sys.pass) * sub.weight : (sys.pass - g) * sub.weight;
        pmText = diff > 0 ? `<span style="color:var(--success);font-weight:700;">+${diff.toFixed(2)}</span>`
          : (diff < 0 ? `<span style="color:var(--danger);font-weight:700;">${diff.toFixed(2)}</span>` : '±0.0');
      }
      return `
        <tr>
          <td><strong>${escapeHtml(sub.name)}</strong></td>
          <td>${sub.core === 'core' ? '⭐ Kernfach' : (sub.core === 'none' ? '💤 Ohne Wertung' : '📘 Nebenfach')}</td>
          <td>${sub.weight}x</td>
          <td>${st.exactAvg !== null ? st.exactAvg.toFixed(2) : '–'}</td>
          <td><span class="grade-badge ${getGradeBadgeClass(st.roundedAvg, sys)}">${st.roundedAvg !== null ? st.roundedAvg.toFixed(state.rounding === 1 ? 0 : 2) : '–'}</span></td>
          <td>${pmText}</td>
        </tr>
      `;
    }).join('');
  }

  if (chartContainer) {
    const validSubs = (sem.subjects || [])
      .map(s => ({ sub: s, st: calculateSubjectStats(s) }))
      .filter(item => item.st.exactAvg !== null);

    if (validSubs.length === 0) {
      chartContainer.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted);">Noch keine Daten für das Diagramm.</div>`;
    } else {
      chartContainer.innerHTML = validSubs.map(({ sub, st }) => {
        let pct = 50;
        if (sys.id === 'CH') pct = ((st.exactAvg - 1) / 5) * 100;
        else if (sys.id === 'PT') pct = (st.exactAvg / 15) * 100;
        else pct = ((sys.worst - st.exactAvg) / (sys.worst - 1)) * 100;
        pct = Math.max(6, Math.min(100, pct));

        const color = getGradeBadgeClass(st.exactAvg, sys) === 'grade-excellent' ? 'var(--success)'
          : (getGradeBadgeClass(st.exactAvg, sys) === 'grade-good' ? 'var(--secondary)'
            : (getGradeBadgeClass(st.exactAvg, sys) === 'grade-warn' ? 'var(--warning)' : 'var(--danger)'));

        return `
          <div class="bar-row">
            <div class="bar-label" title="${escapeHtml(sub.name)}">${escapeHtml(sub.name)}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${pct.toFixed(1)}%; background:${color};"></div>
            </div>
            <div class="bar-val">${st.exactAvg.toFixed(2)}</div>
          </div>
        `;
      }).join('');
    }
  }

  if (allSemTbody) {
    allSemTbody.innerHTML = state.semesters.map(s => {
      const st = calculateSemesterStats(s);
      return `
        <tr>
          <td><strong>${escapeHtml(s.name)}</strong></td>
          <td>${(s.subjects || []).length}</td>
          <td>${st.totalExams}</td>
          <td>${st.exactOverall !== null ? st.exactOverall.toFixed(2) : '–'}</td>
          <td><span class="grade-badge ${getGradeBadgeClass(st.roundedOverall, sys)}">${st.roundedOverall !== null ? st.roundedOverall.toFixed(2) : '–'}</span></td>
        </tr>
      `;
    }).join('');
  }
}

function renderAll() {
  applyTheme();
  renderHeaderControls();
  renderSemesterBar();
  renderKPIs();
  renderSubjectsGrid();
  populateSubjectSelects();
  updateTargetCalculator();
  renderSimulator();
  updatePointsCalculator();
  renderPromotionAndStats();
}

// ==========================================
// ACTIONS & EVENT HANDLERS
// ==========================================

function selectSemester(semId) {
  state.activeSemesterId = semId;
  saveState();
  renderAll();
  syncTargetInputsFromSubject();
}

function addSemester() {
  const name = prompt('Name für das neue Semester / Halbjahr:', `${state.semesters.length + 1}. Semester`);
  if (!name || !name.trim()) return;
  const newSem = {
    id: 'sem_' + Date.now(),
    name: name.trim(),
    subjects: []
  };
  state.semesters.push(newSem);
  state.activeSemesterId = newSem.id;
  saveState();
  renderAll();
}

function renameSemester(semId) {
  const sem = state.semesters.find(s => s.id === semId);
  if (!sem) return;
  const name = prompt('Semester umbenennen:', sem.name);
  if (name && name.trim()) {
    sem.name = name.trim();
    saveState();
    renderAll();
  }
}

function deleteSemester(semId) {
  if (state.semesters.length <= 1) return;
  const sem = state.semesters.find(s => s.id === semId);
  if (!sem) return;
  if (!confirm(`Semester "${sem.name}" wirklich löschen?`)) return;
  state.semesters = state.semesters.filter(s => s.id !== semId);
  if (state.activeSemesterId === semId) {
    state.activeSemesterId = state.semesters[0].id;
  }
  saveState();
  renderAll();
}

function handleQuickAddGrade(e, subId) {
  e.preventDefault();
  const form = e.target;
  const title = form.title.value.trim();
  const value = parseFloat(form.value.value);
  const weight = parseFloat(form.weight.value);
  const category = form.category.value;

  if (!title || isNaN(value) || isNaN(weight) || weight <= 0) return;

  const sem = getActiveSemester();
  const sub = sem.subjects.find(s => s.id === subId);
  if (!sub) return;

  sub.grades.push({
    id: 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    title,
    value,
    weight,
    category,
    date: new Date().toISOString().slice(0, 10)
  });

  form.reset();
  form.weight.value = '1';
  saveState();
  renderAll();
  syncTargetInputsFromSubject();
}

function deleteGrade(subId, gradeId) {
  const sem = getActiveSemester();
  const sub = sem.subjects.find(s => s.id === subId);
  if (!sub) return;
  sub.grades = sub.grades.filter(g => g.id !== gradeId);
  saveState();
  renderAll();
  syncTargetInputsFromSubject();
}

function editGradePrompt(subId, gradeId) {
  const sem = getActiveSemester();
  const sub = sem.subjects.find(s => s.id === subId);
  if (!sub) return;
  const g = sub.grades.find(item => item.id === gradeId);
  if (!g) return;

  const newTitle = prompt('Bezeichnung der Prüfung:', g.title);
  if (newTitle === null) return;
  const newVal = prompt('Note:', g.value);
  if (newVal === null) return;
  const newWeight = prompt('Gewichtung (z.B. 1, 2, 0.5):', g.weight);
  if (newWeight === null) return;

  const parsedVal = parseFloat(newVal.replace(',', '.'));
  const parsedWeight = parseFloat(newWeight.replace(',', '.'));

  if (!isNaN(parsedVal) && !isNaN(parsedWeight) && parsedWeight > 0) {
    g.title = newTitle.trim() || g.title;
    g.value = parsedVal;
    g.weight = parsedWeight;
    saveState();
    renderAll();
    syncTargetInputsFromSubject();
  }
}

function openSubjectModal(subId) {
  const sem = getActiveSemester();
  const sub = sem.subjects.find(s => s.id === subId);
  if (!sub) return;

  document.getElementById('editSubId').value = sub.id;
  document.getElementById('editSubName').value = sub.name;
  document.getElementById('editSubWeight').value = sub.weight;
  document.getElementById('editSubTarget').value = sub.target || '';
  document.getElementById('editSubCore').value = sub.core || 'normal';
  document.getElementById('editSubDropWorst').value = sub.dropWorst ? 'yes' : 'no';
  document.getElementById('editSubMode').value = sub.mode || 'direct';

  const cw = sub.catWeights || { written: 60, oral: 40, project: 0 };
  document.getElementById('catWeightWritten').value = cw.written ?? 60;
  document.getElementById('catWeightOral').value = cw.oral ?? 40;
  document.getElementById('catWeightProject').value = cw.project ?? 0;

  toggleCategoryWeightsVisibility();
  document.getElementById('subjectModalBackdrop').classList.add('open');
}

function toggleCategoryWeightsVisibility() {
  const mode = document.getElementById('editSubMode')?.value;
  const box = document.getElementById('categoryWeightsBox');
  if (box) box.style.display = mode === 'categories' ? 'block' : 'none';
}

function closeSubjectModal() {
  document.getElementById('subjectModalBackdrop')?.classList.remove('open');
}

function removeSimGrade(idx) {
  simHypotheticalGrades.splice(idx, 1);
  renderSimulator();
}

function resetDemoData() {
  state = createDemoState(state.system);
  saveState();
  renderAll();
  syncTargetInputsFromSubject();
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Navigation tabs
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // Grade System switcher
  document.getElementById('systemSelect')?.addEventListener('change', e => {
    const newSys = e.target.value;
    state.system = newSys;
    state.rounding = GRADE_SYSTEMS[newSys].defaultRounding;
    saveState();
    renderAll();
    syncTargetInputsFromSubject();
  });

  // Rounding button cycle
  document.getElementById('roundingBtn')?.addEventListener('click', () => {
    const idx = ROUNDING_MODES.findIndex(m => m.val === state.rounding);
    const next = ROUNDING_MODES[(idx + 1) % ROUNDING_MODES.length];
    state.rounding = next.val;
    saveState();
    renderAll();
  });

  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    saveState();
    applyTheme();
  });

  // Add Subject form
  document.getElementById('addSubjectForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('subName').value.trim();
    const weight = parseFloat(document.getElementById('subWeight').value) || 1;
    const mode = document.getElementById('subMode').value;
    const targetRaw = document.getElementById('subTarget').value;
    const target = targetRaw ? parseFloat(targetRaw) : null;
    const core = document.getElementById('subCore').value;

    if (!name) return;

    const sem = getActiveSemester();
    const newSub = {
      id: 'sub_' + Date.now(),
      name,
      weight,
      mode,
      catWeights: { written: 60, oral: 40, project: 0 },
      target,
      core,
      dropWorst: false,
      grades: []
    };
    sem.subjects.push(newSub);
    document.getElementById('subName').value = '';
    document.getElementById('subTarget').value = '';
    saveState();
    renderAll();

    if (mode === 'categories') {
      openSubjectModal(newSub.id);
    }
  });

  // Subject Modal handlers
  document.getElementById('editSubMode')?.addEventListener('change', toggleCategoryWeightsVisibility);
  document.getElementById('closeSubjectModal')?.addEventListener('click', closeSubjectModal);
  document.getElementById('cancelSubjectModal')?.addEventListener('click', closeSubjectModal);

  document.getElementById('editSubjectForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('editSubId').value;
    const sem = getActiveSemester();
    const sub = sem.subjects.find(s => s.id === id);
    if (!sub) return;

    sub.name = document.getElementById('editSubName').value.trim() || sub.name;
    sub.weight = parseFloat(document.getElementById('editSubWeight').value) || 1;
    const tVal = document.getElementById('editSubTarget').value;
    sub.target = tVal !== '' ? parseFloat(tVal) : null;
    sub.core = document.getElementById('editSubCore').value;
    sub.dropWorst = document.getElementById('editSubDropWorst').value === 'yes';
    sub.mode = document.getElementById('editSubMode').value;
    sub.catWeights = {
      written: parseFloat(document.getElementById('catWeightWritten').value) || 0,
      oral: parseFloat(document.getElementById('catWeightOral').value) || 0,
      project: parseFloat(document.getElementById('catWeightProject').value) || 0
    };

    closeSubjectModal();
    saveState();
    renderAll();
    syncTargetInputsFromSubject();
  });

  document.getElementById('deleteSubjectBtn')?.addEventListener('click', () => {
    const id = document.getElementById('editSubId').value;
    const sem = getActiveSemester();
    const sub = sem.subjects.find(s => s.id === id);
    if (!sub) return;
    if (!confirm(`Fach "${sub.name}" samt allen Noten löschen?`)) return;
    sem.subjects = sem.subjects.filter(s => s.id !== id);
    closeSubjectModal();
    saveState();
    renderAll();
  });

  // Target calculator inputs
  document.getElementById('targetSubjectSelect')?.addEventListener('change', syncTargetInputsFromSubject);
  ['targetCurAvg', 'targetCurWeight', 'targetGoalGrade', 'targetNextWeight'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateTargetCalculator);
  });

  // Simulator inputs
  document.getElementById('simSubjectSelect')?.addEventListener('change', () => {
    simHypotheticalGrades = [];
    renderSimulator();
  });

  document.getElementById('addSimGradeBtn')?.addEventListener('click', () => {
    const val = parseFloat(document.getElementById('simGradeVal').value);
    const weight = parseFloat(document.getElementById('simGradeWeight').value);
    const category = document.getElementById('simGradeCat').value;
    if (isNaN(val) || isNaN(weight) || weight <= 0) return;
    simHypotheticalGrades.push({
      id: 'sim_' + Date.now() + '_' + Math.random(),
      value: val,
      weight,
      category
    });
    renderSimulator();
  });

  // Points calculator inputs
  ['ptMax', 'ptEarned', 'ptFormula', 'ptPassPct', 'ptStepSelect'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updatePointsCalculator);
    document.getElementById(id)?.addEventListener('change', updatePointsCalculator);
  });

  document.getElementById('ptTransferBtn')?.addEventListener('click', () => {
    const subId = document.getElementById('ptTransferSubject')?.value;
    const sem = getActiveSemester();
    const sub = sem.subjects.find(s => s.id === subId);
    if (!sub) return;

    const max = parseFloat(document.getElementById('ptMax')?.value || 40);
    const earned = parseFloat(document.getElementById('ptEarned')?.value || 0);
    const formula = document.getElementById('ptFormula')?.value || 'linear';
    const passPct = parseFloat(document.getElementById('ptPassPct')?.value || 60);
    const exact = computeGradeFromPoints(earned, max, formula, passPct, getSys());
    const rounded = roundToStep(exact, state.rounding);
    const title = document.getElementById('ptTransferTitle')?.value.trim() || `Prüfung (${earned}/${max} Pkt.)`;

    sub.grades.push({
      id: 'g_' + Date.now(),
      title,
      value: Math.round(exact * 100) / 100,
      weight: 1,
      category: 'written',
      date: new Date().toISOString().slice(0, 10)
    });

    saveState();
    renderAll();
    alert(`Note ${exact.toFixed(2)} (Gerundet ${rounded}) wurde in "${sub.name}" eingetragen!`);
  });

  // Demo, Export & Import
  document.getElementById('loadDemoBtn')?.addEventListener('click', () => {
    if (confirm('Beispiel-Daten für das gewählte Notensystem laden?')) {
      resetDemoData();
    }
  });

  document.getElementById('exportBtn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notenrechner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('importBtn')?.addEventListener('click', () => {
    document.getElementById('importFileInput')?.click();
  });

  document.getElementById('importFileInput')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported && Array.isArray(imported.semesters)) {
          state = imported;
          saveState();
          renderAll();
          syncTargetInputsFromSubject();
        }
      } catch (err) {
        alert('Ungültige JSON-Datei.');
      }
    };
    reader.readAsText(file);
  });

  // Quick multi exam button focuses subject name input
  document.getElementById('openQuickMultiExamBtn')?.addEventListener('click', () => {
    document.getElementById('subName')?.focus();
  });

  renderAll();
  syncTargetInputsFromSubject();
});

// Expose functions used by inline handlers
window.selectSemester = selectSemester;
window.addSemester = addSemester;
window.renameSemester = renameSemester;
window.deleteSemester = deleteSemester;
window.handleQuickAddGrade = handleQuickAddGrade;
window.deleteGrade = deleteGrade;
window.editGradePrompt = editGradePrompt;
window.openSubjectModal = openSubjectModal;
window.removeSimGrade = removeSimGrade;
window.resetDemoData = resetDemoData;
