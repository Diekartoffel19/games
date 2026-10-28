// Französisch Grammatik- und Verben-App

// --- Text-to-Speech (Sprachausgabe) ---
function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert("Sprachausgabe wird von diesem Browser leider nicht unterstützt.");
    return;
  }
  window.speechSynthesis.cancel(); // Stoppe vorherige Ausgabe
  const clean = text.replace(/<[^>]*>/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = 'fr-FR';
  utterance.rate = 0.9; // Leicht langsamer für Sprachlerner
  window.speechSynthesis.speak(utterance);
}

// Hilfsfunktion: Beginnt das Wort mit Vokal oder stummem h?
function startsWithVowel(word) {
  if (!word) return false;
  const first = word.trim().toLowerCase()[0];
  return ['a', 'e', 'i', 'o', 'u', 'y', 'é', 'è', 'ê', 'h'].includes(first);
}

// --- TAB NAVIGATION ---
function initTabs() {
  const tabs = document.querySelectorAll('.nav-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function switchToTab(tabId) {
  const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  if (targetBtn) targetBtn.click();
}

function filterDictionaryGroup(group) {
  switchToTab('tab-dictionary');
  setTimeout(() => {
    const pill = document.querySelector(`.filter-pill[data-filter="${group}"]`);
    if (pill) pill.click();
  }, 100);
}

// --- INTERAKTIVER SATZ-BAUKASTEN ---
function initSentenceBuilder() {
  const selectVerb = document.getElementById('builder-verb');
  const selectPronoun = document.getElementById('builder-pronoun');
  const selectTense = document.getElementById('builder-tense');
  const selectNegation = document.getElementById('builder-negation');
  const audioBtn = document.getElementById('builder-audio-btn');

  // Populate verbs dropdown alphabetically
  const sorted = [...VERBS_DATABASE].sort((a, b) => a.infinitive.localeCompare(b.infinitive));
  selectVerb.innerHTML = sorted.map(v => 
    `<option value="${v.infinitive}">${v.infinitive} (${v.german}) [${v.group}]</option>`
  ).join('');

  // Default to parler
  selectVerb.value = 'parler';

  function updateBuilder() {
    const verbInf = selectVerb.value;
    const pronounKey = selectPronoun.value;
    const tense = selectTense.value;
    const negation = selectNegation.value;

    const verbObj = VERBS_DATABASE.find(v => v.infinitive === verbInf);
    if (!verbObj) return;

    // Pronomen Labels & German
    const pronounMap = {
      je: { fr: "je", frVowel: "j'", de: "ich" },
      tu: { fr: "tu", frVowel: "tu", de: "du" },
      il: { fr: "il", frVowel: "il", de: "er" },
      nous: { fr: "nous", frVowel: "nous", de: "wir" },
      vous: { fr: "vous", frVowel: "vous", de: "ihr" },
      ils: { fr: "ils", frVowel: "ils", de: "sie" }
    };

    const pData = pronounMap[pronounKey];
    let chipsHtml = "";
    let germanTranslation = "";
    let explanationHtml = "";
    let fullFrenchText = "";

    // Bei unpersönlichen Verben (falloir, pleuvoir)
    if (verbObj.type === "impersonal" && pronounKey !== "il") {
      document.getElementById('builder-sentence-output').innerHTML = 
        `<span style="color:#f87171; font-size:1.1rem;">⚠️ Das Verb "<em>${verbObj.infinitive}</em>" existiert nur in der 3. Person Singular (il)! Bitte wähle "il" als Subjekt.</span>`;
      document.getElementById('builder-translation-output').innerHTML = "";
      document.getElementById('builder-explanation').innerHTML = "Unpersönliches Verb: wird nur mit dem neutralen 'il' gebraucht.";
      return;
    }

    if (tense === "present") {
      const conjugatedVerb = verbObj.present[pronounKey];

      if (negation === "none") {
        // Bejaht im Präsens
        let sub = pData.fr;
        if (pronounKey === "je" && startsWithVowel(conjugatedVerb)) {
          sub = pData.frVowel;
        }

        chipsHtml = `
          <span class="word-chip chip-subject">${sub} <span class="word-role">Subjekt</span></span>
          <span class="word-chip chip-present">${conjugatedVerb} <span class="word-role">Präsens (${verbObj.group})</span></span>
        `;
        fullFrenchText = `${sub} ${conjugatedVerb}`;
        germanTranslation = `${pData.de} [${verbObj.german}]`;

        explanationHtml = `
          <strong>Grammatik-Erklärung (Präsens bejahend):</strong>
          <br>• <strong>Subjekt:</strong> <code>${sub}</code> (${pData.de})
          <br>• <strong>Konjugiertes Verb:</strong> Stamm + Endung der Gruppe <code>${verbObj.group}</code> ➔ <code>${conjugatedVerb}</code>
          ${pronounKey === 'je' && startsWithVowel(conjugatedVerb) ? '<br>• <em>Apostroph-Regel:</em> Vor Vokal wird <em>je</em> zu <em>j\'</em> zusammengezogen!' : ''}
        `;
      } else {
        // Verneint im Präsens
        const firstNeg = startsWithVowel(conjugatedVerb) ? "n'" : "ne";
        const secondNeg = negation;
        const negDeMap = { pas: "nicht", plus: "nicht mehr", jamais: "nie", rien: "nichts", personne: "niemanden" };

        let sub = pData.fr; // bei Verneinung steht vor dem Verb "ne", daher bleibt "je" erhalten

        chipsHtml = `
          <span class="word-chip chip-subject">${sub} <span class="word-role">Subjekt</span></span>
          <span class="word-chip chip-negation">${firstNeg} <span class="word-role">Verneinung 1</span></span>
          <span class="word-chip chip-present">${conjugatedVerb} <span class="word-role">Verb</span></span>
          <span class="word-chip chip-negation">${secondNeg} <span class="word-role">Verneinung 2</span></span>
        `;
        fullFrenchText = `${sub} ${firstNeg} ${conjugatedVerb} ${secondNeg}`;
        germanTranslation = `${pData.de} [${verbObj.german}] ${negDeMap[negation]}`;

        explanationHtml = `
          <strong>Grammatik-Erklärung (Präsens verneint):</strong>
          <br>• <strong>Klammer-Regel:</strong> <code>${firstNeg}</code> und <code>${secondNeg}</code> umschließen das konjugierte Verb <code>${conjugatedVerb}</code>.
          ${firstNeg === "n'" ? '<br>• <em>Apostroph:</em> Da <code>' + conjugatedVerb + '</code> mit Vokal/stummem h beginnt, wird <em>ne</em> zu <em>n\'</em>!' : ''}
          <br>• <strong>Bedeutung von ${firstNeg} ... ${secondNeg}:</strong> <em>${negDeMap[negation]}</em>
        `;
      }
    } else {
      // FUTUR PROCHE
      const allerForm = ALLER_CONJUGATION[pronounKey];
      const mainInf = verbObj.infinitive;

      if (negation === "none") {
        // Bejaht im Futur proche
        const sub = pData.fr; // aller beginnt mit 'v' bei je vais, oder 'a' bei j'allons (aber nous allons) -> also immer je vais!
        chipsHtml = `
          <span class="word-chip chip-subject">${sub} <span class="word-role">Subjekt</span></span>
          <span class="word-chip chip-aller">${allerForm} <span class="word-role">aller (Hilfsverb)</span></span>
          <span class="word-chip chip-infinitive">${mainInf} <span class="word-role">Infinitiv</span></span>
        `;
        fullFrenchText = `${sub} ${allerForm} ${mainInf}`;
        germanTranslation = `${pData.de} werde/wird [${verbObj.german}]`;

        explanationHtml = `
          <strong>Grammatik-Erklärung (Futur proche bejahend):</strong>
          <br>• <strong>Hilfsverb aller:</strong> Präsensform von <em>aller</em> passend zum Subjekt <code>${sub}</code> ➔ <code>${allerForm}</code>
          <br>• <strong>Hauptverb:</strong> Bleibt unverändert im <strong>Infinitiv</strong> ➔ <code>${mainInf}</code>
          <br>• Drückt eine feste Absicht oder unmittelbar bevorstehende Handlung in der Zukunft aus.
        `;
      } else {
        // Verneint im Futur proche
        const firstNeg = startsWithVowel(allerForm) ? "n'" : "ne"; // nous n'allons pas
        const secondNeg = negation;
        const negDeMap = { pas: "nicht", plus: "nicht mehr", jamais: "nie", rien: "nichts", personne: "niemanden" };
        const sub = pData.fr;

        chipsHtml = `
          <span class="word-chip chip-subject">${sub} <span class="word-role">Subjekt</span></span>
          <span class="word-chip chip-negation">${firstNeg} <span class="word-role">Verneinung 1</span></span>
          <span class="word-chip chip-aller">${allerForm} <span class="word-role">aller</span></span>
          <span class="word-chip chip-negation">${secondNeg} <span class="word-role">Verneinung 2</span></span>
          <span class="word-chip chip-infinitive">${mainInf} <span class="word-role">Infinitiv</span></span>
        `;
        fullFrenchText = `${sub} ${firstNeg} ${allerForm} ${secondNeg} ${mainInf}`;
        germanTranslation = `${pData.de} werde/wird ${negDeMap[negation]} [${verbObj.german}]`;

        explanationHtml = `
          <strong>Wichtige Verneinungsregel im Futur proche:</strong>
          <br>• Die Verneinungsklammer <code>${firstNeg} ... ${secondNeg}</code> umschließt <strong>NUR das Hilfsverb <em>aller</em></strong> (<code>${allerForm}</code>)!
          <br>• Der Infinitiv <code>${mainInf}</code> steht <strong>hinter</strong> dem zweiten Verneinungswort!
          <br>• <em>Falsch wäre:</em> Je vais ne pas ${mainInf}. ❌
          <br>• <em>Richtig:</em> ${fullFrenchText}. ✅
        `;
      }
    }

    document.getElementById('builder-sentence-output').innerHTML = chipsHtml;
    document.getElementById('builder-translation-output').innerHTML = `<span>🇩🇪 ${germanTranslation}</span>`;
    document.getElementById('builder-explanation').innerHTML = explanationHtml;

    audioBtn.onclick = () => speakText(fullFrenchText);
  }

  [selectVerb, selectPronoun, selectTense, selectNegation].forEach(elem => {
    elem.addEventListener('change', updateBuilder);
  });

  updateBuilder();
}

// --- VERBEN-LEXIKON & SUCHE ---
let currentGroupFilter = 'all';

function renderVerbsList(filterText = '') {
  const container = document.getElementById('verbs-grid');
  const countBadge = document.getElementById('verbs-count-badge');
  const q = filterText.trim().toLowerCase();

  const filtered = VERBS_DATABASE.filter(v => {
    // Group filter
    if (currentGroupFilter !== 'all' && v.group !== currentGroupFilter) {
      return false;
    }
    // Search text filter (search French infinitive or German translation)
    if (q) {
      const matchFr = v.infinitive.toLowerCase().includes(q);
      const matchDe = v.german.toLowerCase().includes(q);
      const matchNotes = v.notes ? v.notes.toLowerCase().includes(q) : false;
      return matchFr || matchDe || matchNotes;
    }
    return true;
  });

  countBadge.textContent = `${filtered.length} von ${VERBS_DATABASE.length} Verben`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
        <h3>Kein Verb gefunden</h3>
        <p>Versuche es mit einem anderen deutschen oder französischen Suchbegriff.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(v => {
    const badgeClass = v.group.replace('-', '');
    return `
      <div class="verb-card">
        <div>
          <div class="verb-top">
            <span class="verb-french">
              ${v.infinitive}
              <button class="audio-btn" onclick="speakText('${v.infinitive}')" title="Aussprache anhören">🔊</button>
            </span>
            <span class="group-badge ${badgeClass}">${v.group}</span>
          </div>
          <div class="verb-german">🇩🇪 ${v.german}</div>
          
          <div class="mini-conjugation">
            <div><strong>je:</strong> ${v.present.je}</div>
            <div><strong>nous:</strong> ${v.present.nous}</div>
            <div><strong>tu:</strong> ${v.present.tu}</div>
            <div><strong>vous:</strong> ${v.present.vous}</div>
            <div><strong>il:</strong> ${v.present.il}</div>
            <div><strong>ils:</strong> ${v.present.ils}</div>
          </div>

          ${v.sample ? `<div class="mini-sample">"${v.sample}"</div>` : ''}
        </div>

        <div class="verb-actions">
          <button class="btn-sm btn-primary-sm" onclick="openVerbModal('${v.infinitive}')" style="width: 100%;">
            📖 Vollständige Konjugation & Details
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function initDictionary() {
  const searchInput = document.getElementById('verb-search');
  const filterPills = document.querySelectorAll('#group-filters .filter-pill');

  searchInput.addEventListener('input', (e) => {
    renderVerbsList(e.target.value);
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentGroupFilter = pill.getAttribute('data-filter');
      renderVerbsList(searchInput.value);
    });
  });

  renderVerbsList();
}

// --- VERB DETAILS MODAL ---
function openVerbModal(infinitive) {
  const verb = VERBS_DATABASE.find(v => v.infinitive === infinitive);
  if (!verb) return;

  const modal = document.getElementById('verb-modal');
  document.getElementById('modal-verb-name').textContent = verb.infinitive;
  document.getElementById('modal-verb-german').textContent = `🇩🇪 ${verb.german}`;
  
  const badge = document.getElementById('modal-group-badge');
  badge.textContent = verb.group;
  badge.className = `group-badge ${verb.group.replace('-', '')}`;

  document.getElementById('modal-verb-notes').innerHTML = `
    <strong>Besonderheit & Lerntipp:</strong> ${verb.notes || "Regelmässige Form."}
  `;

  // Present table
  const presTbody = PRONOUNS.map(p => {
    const conj = verb.present[p.key];
    return `
      <tr>
        <td style="width: 35%;"><strong>${p.label}</strong> <span style="color:var(--text-muted); font-size:0.8rem;">(${p.de})</span></td>
        <td><strong style="color:var(--primary); font-size:1.05rem;">${conj}</strong></td>
        <td style="width: 50px; text-align:right;">
          <button class="audio-btn" onclick="speakText('${p.key === 'je' && startsWithVowel(conj) ? "j'" : p.key} ${conj}')">🔊</button>
        </td>
      </tr>
    `;
  }).join('');
  document.getElementById('modal-present-table').innerHTML = `<tbody>${presTbody}</tbody>`;

  // Futur Proche table
  const futTbody = PRONOUNS.map(p => {
    const aller = ALLER_CONJUGATION[p.key];
    const sentence = `${p.key} ${aller} ${verb.infinitive}`;
    return `
      <tr>
        <td style="width: 35%;"><strong>${p.label}</strong></td>
        <td>${p.key} <strong style="color:#8b5cf6;">${aller}</strong> <span style="color:#059669; font-weight:600;">${verb.infinitive}</span></td>
        <td style="width: 50px; text-align:right;">
          <button class="audio-btn" onclick="speakText('${sentence}')">🔊</button>
        </td>
      </tr>
    `;
  }).join('');
  document.getElementById('modal-futur-table').innerHTML = `<tbody>${futTbody}</tbody>`;

  // Negation example
  document.getElementById('modal-neg-example').innerHTML = `
    Je <strong style="color:#dc2626;">ne</strong> vais <strong style="color:#dc2626;">pas</strong> ${verb.infinitive}.
    <button class="audio-btn" onclick="speakText('Je ne vais pas ${verb.infinitive}')" style="vertical-align:middle; margin-left:0.5rem;">🔊</button>
  `;

  // Sample sentence
  document.getElementById('modal-sample').textContent = `"${verb.sample}"`;
  document.getElementById('modal-sample-de').textContent = `🇩🇪 ${verb.sampleDe}`;

  document.getElementById('modal-audio-btn').onclick = () => speakText(verb.infinitive);

  modal.classList.add('show');
}

function initModal() {
  const modal = document.getElementById('verb-modal');
  const closeBtn = document.getElementById('modal-close');

  closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      modal.classList.remove('show');
    }
  });
}

// --- QUIZ & TRAINER (DE <-> FR) ---
let quizScore = 0;
let quizStreak = 0;
let quizCurrentIndex = 1;
let currentQuestion = null;

function generateQuestion() {
  // Vier Fragen-Typen:
  // 1: DE -> FR Vokabel ("Was heißt 'schlafen' auf Französisch?")
  // 2: Konjugation Präsens ("Was ist die richtige Form für 'wir beenden' (finir)?")
  // 3: Futur proche ("Wie bildet man 'er wird machen' (faire) im Futur proche?")
  // 4: Verneinung ("Wie verneint man 'Je vais manger' mit 'ne...pas'?")
  const types = ['vocab', 'present', 'futur', 'negation'];
  const type = types[Math.floor(Math.random() * types.length)];

  const randomVerb = VERBS_DATABASE[Math.floor(Math.random() * VERBS_DATABASE.length)];
  const randomPronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)];

  if (type === 'vocab') {
    // Falsche Optionen wählen
    const distractors = VERBS_DATABASE
      .filter(v => v.infinitive !== randomVerb.infinitive)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(v => v.infinitive);

    const options = [...distractors, randomVerb.infinitive].sort(() => 0.5 - Math.random());

    return {
      category: "Vokabeltrainer: DE ➔ FR",
      prompt: `Wie heißt "${randomVerb.german}" auf Französisch?`,
      subprompt: `Wähle das richtige Infinitiv-Verb (${randomVerb.group}):`,
      options: options,
      correct: randomVerb.infinitive,
      explanation: `<strong>${randomVerb.infinitive}</strong> bedeutet "${randomVerb.german}". Verbgruppe: ${randomVerb.group}.`
    };
  } else if (type === 'present') {
    // Unpersönliche Verben überspringen wenn nicht 'il'
    let v = randomVerb;
    let p = randomPronoun;
    if (v.type === "impersonal") p = PRONOUNS.find(x => x.key === 'il');

    const correctForm = v.present[p.key];

    // Distraktoren generieren (aus anderen Formen des Verbs oder leicht verändert)
    const optionsSet = new Set([correctForm]);
    Object.values(v.present).forEach(form => {
      if (form !== "-" && form !== correctForm) optionsSet.add(form);
    });
    // Falls noch zu wenige Optionen
    const otherVerbs = VERBS_DATABASE.filter(x => x.infinitive !== v.infinitive);
    for (let ov of otherVerbs) {
      if (optionsSet.size >= 4) break;
      if (ov.present[p.key] && ov.present[p.key] !== "-") {
        optionsSet.add(ov.present[p.key]);
      }
    }

    const options = Array.from(optionsSet).slice(0, 4).sort(() => 0.5 - Math.random());

    return {
      category: "Présent Konjugation",
      prompt: `Konjugiere im Präsens: "${p.de} + ${v.german}"`,
      subprompt: `Verb: <em>${v.infinitive}</em> mit Subjekt: <em>${p.label}</em>`,
      options: options,
      correct: correctForm,
      explanation: `Richtig: <strong>${p.label} ${correctForm}</strong>. (${v.notes || 'Regelmässige Form'}).`
    };
  } else if (type === 'futur') {
    const aller = ALLER_CONJUGATION[randomPronoun.key];
    const correctStr = `${aller} ${randomVerb.infinitive}`;

    // Falsche Aller-Formen oder falscher Infinitiv
    const wrongAller = randomPronoun.key === 'nous' ? 'allez' : 'allons';
    const wrongOpt1 = `${wrongAller} ${randomVerb.infinitive}`;
    const wrongOpt2 = `${aller} ${randomVerb.present[randomPronoun.key]}`;
    const wrongOpt3 = `${randomVerb.present[randomPronoun.key]}`;

    const options = [correctStr, wrongOpt1, wrongOpt2, wrongOpt3].sort(() => 0.5 - Math.random());

    return {
      category: "Futur Proche Bildung",
      prompt: `Wie lautet das Futur proche für "${randomPronoun.de} werde/wird ${randomVerb.german}"?`,
      subprompt: `Subjekt: <em>${randomPronoun.label}</em> + Verb: <em>${randomVerb.infinitive}</em>`,
      options: options,
      correct: correctStr,
      explanation: `Formel: <strong>aller im Präsens (${aller}) + Infinitiv (${randomVerb.infinitive})</strong>. Zusammen: <em>${randomPronoun.key} ${correctStr}</em>.`
    };
  } else {
    // Negation question
    const verb = randomVerb;
    const correctNeg = `Je ne vais pas ${verb.infinitive}.`;
    const wrong1 = `Je vais ne pas ${verb.infinitive}.`;
    const wrong2 = `Je ne ${verb.infinitive} pas vais.`;
    const wrong3 = `Je vais pas ${verb.infinitive}.`;

    const options = [correctNeg, wrong1, wrong2, wrong3].sort(() => 0.5 - Math.random());

    return {
      category: "Verneinung im Futur Proche",
      prompt: `Welcher Satz ist grammatikalisch KORREKT verneint?`,
      subprompt: `Aussage: "Ich werde nicht ${verb.german}" (${verb.infinitive})`,
      options: options,
      correct: correctNeg,
      explanation: `Die Verneinungsklammer <strong>ne ... pas</strong> muss immer <u>das Hilfsverb aller</u> umschließen: <em>Je <strong>ne</strong> vais <strong>pas</strong> ${verb.infinitive}</em>!`
    };
  }
}

function loadNextQuizQuestion() {
  currentQuestion = generateQuestion();
  
  document.getElementById('quiz-question-num').textContent = quizCurrentIndex;
  document.getElementById('quiz-category-tag').textContent = currentQuestion.category;
  document.getElementById('quiz-prompt').innerHTML = currentQuestion.prompt;
  document.getElementById('quiz-subprompt').innerHTML = currentQuestion.subprompt;

  const optionsContainer = document.getElementById('quiz-options');
  const feedback = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('quiz-next-btn');

  feedback.className = 'quiz-feedback';
  feedback.innerHTML = '';
  nextBtn.style.display = 'none';

  optionsContainer.innerHTML = currentQuestion.options.map(opt => `
    <button class="quiz-btn" onclick="selectQuizAnswer('${opt.replace(/'/g, "\\'")}')">
      <span>${opt}</span>
      <span>➔</span>
    </button>
  `).join('');
}

function selectQuizAnswer(selected) {
  const buttons = document.querySelectorAll('.quiz-btn');
  buttons.forEach(b => b.disabled = true);

  const feedback = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('quiz-next-btn');
  const isCorrect = (selected === currentQuestion.correct);

  buttons.forEach(btn => {
    const text = btn.querySelector('span').textContent.trim();
    if (text === currentQuestion.correct) {
      btn.classList.add('correct');
    } else if (text === selected && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  if (isCorrect) {
    quizScore += 10;
    quizStreak += 1;
    feedback.className = 'quiz-feedback show callout callout-success';
    feedback.innerHTML = `<strong>🎉 Ausgezeichnet!</strong> ${currentQuestion.explanation}`;
  } else {
    quizStreak = 0;
    feedback.className = 'quiz-feedback show callout callout-danger';
    feedback.innerHTML = `<strong>❌ Leider nicht ganz richtig.</strong> Richtige Antwort: <strong>${currentQuestion.correct}</strong>.<br>${currentQuestion.explanation}`;
  }

  document.getElementById('quiz-score').textContent = quizScore;
  document.getElementById('quiz-streak').textContent = quizStreak;
  nextBtn.style.display = 'inline-block';
}

function initQuiz() {
  const nextBtn = document.getElementById('quiz-next-btn');
  nextBtn.addEventListener('click', () => {
    quizCurrentIndex++;
    loadNextQuizQuestion();
  });

  loadNextQuizQuestion();
}

// --- DARK MODE THEME MANAGEMENT ---
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const iconSpan = document.getElementById('theme-icon');
  const textSpan = document.getElementById('theme-text');

  const savedTheme = localStorage.getItem('franz_theme');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('franz_theme', theme);
    if (theme === 'dark') {
      if (iconSpan) iconSpan.textContent = '☀️';
      if (textSpan) textSpan.textContent = 'Light Mode';
      if (toggleBtn) toggleBtn.setAttribute('title', 'Zu hellem Modus wechseln');
    } else {
      if (iconSpan) iconSpan.textContent = '🌙';
      if (textSpan) textSpan.textContent = 'Dark Mode';
      if (toggleBtn) toggleBtn.setAttribute('title', 'Zu dunklem Modus wechseln');
    }
  }

  applyTheme(initialTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('franz_theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initSentenceBuilder();
  initDictionary();
  initModal();
  initQuiz();
});
