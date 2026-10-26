/**
 * Swiss Public Transport Delay Monitor & Stationboard
 * Powered by transport.opendata.ch API
 */

const API_BASE = 'https://transport.opendata.ch/v1';
const POLL_INTERVAL_SECONDS = 45;

// State
let activeMonitor = null;
let monitorIntervalId = null;
let countdownTimerId = null;
let secondsRemaining = POLL_INTERVAL_SECONDS;
let audioContext = null;
let currentStationboardData = null;

// DOM Elements - Tabs
const tabBtnSearch = document.getElementById('tabBtnSearch');
const tabBtnBoard = document.getElementById('tabBtnBoard');
const searchView = document.getElementById('searchView');
const boardView = document.getElementById('boardView');

// DOM Elements - Connection Search
const inputFrom = document.getElementById('inputFrom');
const inputTo = document.getElementById('inputTo');
const btnGpsFrom = document.getElementById('btnGpsFrom');
const suggestFrom = document.getElementById('suggestFrom');
const suggestTo = document.getElementById('suggestTo');
const inputDate = document.getElementById('inputDate');
const inputTime = document.getElementById('inputTime');
const searchForm = document.getElementById('searchForm');
const btnSearch = document.getElementById('btnSearch');
const searchSpinner = document.getElementById('searchSpinner');
const btnNow = document.getElementById('btnNow');
const btnSwap = document.getElementById('btnSwap');
const btnAddFavorite = document.getElementById('btnAddFavorite');
const favoritesList = document.getElementById('favoritesList');
const selectThreshold = document.getElementById('selectThreshold');
const chkAudioAlarm = document.getElementById('chkAudioAlarm');

// DOM Elements - Notifications & Status
const permDot = document.getElementById('permDot');
const permText = document.getElementById('permText');
const btnRequestPerm = document.getElementById('btnRequestPerm');
const btnTestNotify = document.getElementById('btnTestNotify');
const resultsSection = document.getElementById('resultsSection');
const resultsMeta = document.getElementById('resultsMeta');
const connectionsList = document.getElementById('connectionsList');
const monitorCard = document.getElementById('monitorCard');
const monitorDetails = document.getElementById('monitorDetails');
const monitorTimer = document.getElementById('monitorTimer');
const btnStopMonitor = document.getElementById('btnStopMonitor');
const btnRefreshNow = document.getElementById('btnRefreshNow');
const eventLog = document.getElementById('eventLog');
const btnClearLog = document.getElementById('btnClearLog');
const toastContainer = document.getElementById('toastContainer');

// DOM Elements - Stationboard
const boardForm = document.getElementById('boardForm');
const boardStation = document.getElementById('boardStation');
const suggestBoard = document.getElementById('suggestBoard');
const btnGpsBoard = document.getElementById('btnGpsBoard');
const boardLimit = document.getElementById('boardLimit');
const btnLoadBoard = document.getElementById('btnLoadBoard');
const boardSpinner = document.getElementById('boardSpinner');
const boardResultsWrap = document.getElementById('boardResultsWrap');
const boardTitle = document.getElementById('boardTitle');
const boardUpdatedTime = document.getElementById('boardUpdatedTime');
const btnBoardRefresh = document.getElementById('btnBoardRefresh');
const boardList = document.getElementById('boardList');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initDateTime();
  updatePermissionUI();
  setupEventListeners();
  loadSavedState();
  renderFavorites();
});

function initDateTime() {
  const now = new Date();
  inputDate.value = now.toISOString().split('T')[0];
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  inputTime.value = `${hours}:${minutes}`;
}

function setupEventListeners() {
  // Tab Switcher
  tabBtnSearch.addEventListener('click', () => switchTab('search'));
  tabBtnBoard.addEventListener('click', () => switchTab('board'));

  // Autocomplete
  setupAutocomplete(inputFrom, suggestFrom);
  setupAutocomplete(inputTo, suggestTo);
  setupAutocomplete(boardStation, suggestBoard);

  // GPS Locate
  btnGpsFrom.addEventListener('click', () => locateStation(inputFrom));
  btnGpsBoard.addEventListener('click', () => locateStation(boardStation));

  // Swap stations
  btnSwap.addEventListener('click', () => {
    const temp = inputFrom.value;
    inputFrom.value = inputTo.value;
    inputTo.value = temp;
  });

  // Presets
  document.querySelectorAll('.btn-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      inputFrom.value = chip.dataset.from;
      inputTo.value = chip.dataset.to;
      initDateTime();
      searchConnections();
    });
  });

  // "Jetzt abfahren"
  btnNow.addEventListener('click', () => {
    initDateTime();
    if (inputFrom.value && inputTo.value) {
      searchConnections();
    }
  });

  // Search form submit
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchConnections();
  });

  // Favorites
  btnAddFavorite.addEventListener('click', addCurrentRouteToFavorites);

  // Settings persistence
  if (selectThreshold) {
    const savedThreshold = localStorage.getItem('sbb_threshold');
    if (savedThreshold) selectThreshold.value = savedThreshold;
    selectThreshold.addEventListener('change', () => {
      localStorage.setItem('sbb_threshold', selectThreshold.value);
    });
  }

  if (chkAudioAlarm) {
    const savedAudio = localStorage.getItem('sbb_audio_alarm');
    if (savedAudio !== null) chkAudioAlarm.checked = savedAudio === 'true';
    chkAudioAlarm.addEventListener('change', () => {
      localStorage.setItem('sbb_audio_alarm', chkAudioAlarm.checked);
    });
  }

  // Notification permissions
  btnRequestPerm.addEventListener('click', requestNotificationPermission);
  btnTestNotify.addEventListener('click', () => {
    sendNotification(
      '🚆 Test-Benachrichtigung',
      'Der ÖV-Verspätungs-Wächter ist aktiv und betriebsbereit.'
    );
    if (chkAudioAlarm.checked) {
      playAlertChime();
    }
    showToast('Test-Benachrichtigung ausgelöst!', 'success');
  });

  // Monitor actions
  btnStopMonitor.addEventListener('click', stopMonitoring);
  btnRefreshNow.addEventListener('click', () => {
    if (activeMonitor) {
      checkMonitoredConnection();
      secondsRemaining = POLL_INTERVAL_SECONDS;
    }
  });

  // Clear log
  btnClearLog.addEventListener('click', () => {
    eventLog.innerHTML = '<p class="empty-state">Noch keine Ereignisse erfasst.</p>';
  });

  // Stationboard form
  boardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loadStationboard();
  });

  btnBoardRefresh.addEventListener('click', () => {
    if (boardStation.value.trim()) {
      loadStationboard();
    }
  });

  // Document click to close autocomplete dropdowns
  document.addEventListener('click', (e) => {
    if (!suggestFrom.contains(e.target) && e.target !== inputFrom) suggestFrom.hidden = true;
    if (!suggestTo.contains(e.target) && e.target !== inputTo) suggestTo.hidden = true;
    if (!suggestBoard.contains(e.target) && e.target !== boardStation) suggestBoard.hidden = true;
  });
}

// --- Tabs Management ---
function switchTab(target) {
  if (target === 'search') {
    tabBtnSearch.classList.add('active');
    tabBtnSearch.setAttribute('aria-selected', 'true');
    tabBtnBoard.classList.remove('active');
    tabBtnBoard.setAttribute('aria-selected', 'false');
    searchView.hidden = false;
    boardView.hidden = true;
  } else {
    tabBtnBoard.classList.add('active');
    tabBtnBoard.setAttribute('aria-selected', 'true');
    tabBtnSearch.classList.remove('active');
    tabBtnSearch.setAttribute('aria-selected', 'false');
    searchView.hidden = true;
    boardView.hidden = false;
    if (!boardStation.value && inputFrom.value) {
      boardStation.value = inputFrom.value;
    }
  }
}

// --- Geolocation (GPS) ---
function locateStation(targetInput) {
  if (!('geolocation' in navigator)) {
    showToast('Geolocation wird vom Browser nicht unterstützt', 'danger');
    return;
  }

  showToast('GPS-Position wird ermittelt...', 'success');

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`${API_BASE}/locations?x=${latitude}&y=${longitude}&type=station`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const stations = (data.stations || []).filter(s => s.name);

        if (stations.length === 0) {
          showToast('Keine Station in der Nähe gefunden', 'danger');
          return;
        }

        const nearest = stations[0].name;
        targetInput.value = nearest;
        showToast(`📍 Gefunden: ${nearest}`, 'success');
      } catch (err) {
        console.error('GPS station lookup error:', err);
        showToast('Fehler bei Haltestellensuche: ' + err.message, 'danger');
      }
    },
    (err) => {
      showToast('Standortermittlung fehlgeschlagen: ' + err.message, 'danger');
    },
    { enableHighAccuracy: true, timeout: 9000 }
  );
}

// --- Autocomplete ---
function setupAutocomplete(inputElem, suggestElem) {
  let debounceTimeout = null;

  inputElem.addEventListener('input', () => {
    const query = inputElem.value.trim();
    clearTimeout(debounceTimeout);

    if (query.length < 2) {
      suggestElem.innerHTML = '';
      suggestElem.hidden = true;
      return;
    }

    debounceTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/locations?type=station&query=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const data = await res.json();
        const stations = (data.stations || []).filter(s => s.name);

        if (stations.length === 0) {
          suggestElem.hidden = true;
          return;
        }

        suggestElem.innerHTML = stations.slice(0, 6).map(s => `
          <div class="suggestion-item" data-name="${escapeHtml(s.name)}">
            ${escapeHtml(s.name)}
          </div>
        `).join('');
        suggestElem.hidden = false;

        suggestElem.querySelectorAll('.suggestion-item').forEach(item => {
          item.addEventListener('click', () => {
            inputElem.value = item.dataset.name;
            suggestElem.hidden = true;
          });
        });
      } catch (err) {
        console.error('Autocomplete error:', err);
      }
    }, 250);
  });
}

// --- Favorites (Gespeicherte Strecken) ---
function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem('sbb_favorites') || '[]');
  } catch (e) {
    return [];
  }
}

function saveFavorites(favs) {
  localStorage.setItem('sbb_favorites', JSON.stringify(favs));
  renderFavorites();
}

function renderFavorites() {
  const favs = loadFavorites();
  if (favs.length === 0) {
    favoritesList.innerHTML = '<span class="empty-state" style="padding:0;">Keine Favoriten vorhanden. Tippe auf "⭐ Zu Favoriten", um Strecken zu speichern.</span>';
    return;
  }

  favoritesList.innerHTML = favs.map((fav, index) => `
    <span class="fav-chip">
      <span class="fav-chip-name" onclick="loadFavoriteRoute(${index})">${escapeHtml(fav.from)} ➔ ${escapeHtml(fav.to)}</span>
      <button type="button" class="fav-chip-del" onclick="deleteFavoriteRoute(${index})" title="Favorit entfernen">&times;</button>
    </span>
  `).join('');
}

function addCurrentRouteToFavorites() {
  const from = inputFrom.value.trim();
  const to = inputTo.value.trim();

  if (!from || !to) {
    showToast('Bitte zuerst Start- und Zielstation eingeben', 'danger');
    return;
  }

  const favs = loadFavorites();
  const exists = favs.some(f => f.from.toLowerCase() === from.toLowerCase() && f.to.toLowerCase() === to.toLowerCase());

  if (exists) {
    showToast('Diese Strecke ist bereits in den Favoriten', 'success');
    return;
  }

  favs.push({ from, to });
  saveFavorites(favs);
  showToast(`⭐ "${from} ➔ ${to}" zu Favoriten hinzugefügt!`, 'success');
}

window.loadFavoriteRoute = function(index) {
  const favs = loadFavorites();
  const fav = favs[index];
  if (!fav) return;

  inputFrom.value = fav.from;
  inputTo.value = fav.to;
  initDateTime();
  searchConnections();
};

window.deleteFavoriteRoute = function(index) {
  const favs = loadFavorites();
  favs.splice(index, 1);
  saveFavorites(favs);
  showToast('Favorit entfernt', 'success');
};

// --- Search Connections ---
async function searchConnections() {
  const from = inputFrom.value.trim();
  const to = inputTo.value.trim();
  const date = inputDate.value;
  const time = inputTime.value;

  if (!from || !to) {
    showToast('Bitte Start- und Zielort angeben', 'danger');
    return;
  }

  // Save last searched stations
  localStorage.setItem('sbb_from', from);
  localStorage.setItem('sbb_to', to);

  // Transportation filters
  const checkedBoxes = Array.from(document.querySelectorAll('input[name="transportType"]:checked'));
  let typeParams = '';
  if (checkedBoxes.length > 0 && checkedBoxes.length < 4) {
    typeParams = checkedBoxes.map(b => `&transportations[]=${encodeURIComponent(b.value)}`).join('');
  }

  setLoading(true);

  try {
    const url = `${API_BASE}/connections?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&time=${time}&limit=6${typeParams}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    renderConnections(data.connections || [], from, to);
    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error('Search failed:', err);
    showToast('Fehler beim Laden der Verbindungen: ' + err.message, 'danger');
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  btnSearch.disabled = isLoading;
  searchSpinner.hidden = !isLoading;
}

function renderConnections(connections, fromName, toName) {
  resultsMeta.textContent = `${connections.length} Verbindungen gefunden`;

  if (connections.length === 0) {
    connectionsList.innerHTML = '<p class="empty-state">Keine Verbindungen für diese Route gefunden.</p>';
    return;
  }

  connectionsList.innerHTML = connections.map((conn, index) => {
    const depTime = formatTime(conn.from.departure);
    const arrTime = formatTime(conn.to.arrival);
    const depDelay = conn.from.delay;
    const arrDelay = conn.to.delay;

    const duration = formatDuration(conn.duration);
    const transfers = conn.transfers;
    const products = conn.products || [];
    const isCurrentlyMonitored = activeMonitor && activeMonitor.departureTimestamp === conn.from.departureTimestamp;

    // Platform info
    const depPlatform = conn.from.prognosis?.platform || conn.from.platform || '-';
    const arrPlatform = conn.to.prognosis?.platform || conn.to.platform || '-';

    return `
      <div class="connection-card ${isCurrentlyMonitored ? 'is-monitored' : ''}" data-index="${index}">
        <div class="connection-main">
          <!-- From -->
          <div class="endpoint-info">
            <div class="time-row">
              <span class="main-time">${depTime}</span>
              ${renderDelayBadge(depDelay, conn.from.prognosis?.departure)}
            </div>
            <span class="station-name">${escapeHtml(conn.from.station.name)}</span>
            <span class="platform-info">Gleis ${escapeHtml(depPlatform)}</span>
          </div>

          <!-- Journey stats -->
          <div class="journey-summary">
            <span class="duration-text">⏱ ${duration}</span>
            <span class="transfers-badge">${transfers === 0 ? 'Direkt' : `${transfers}x Umsteigen`}</span>
          </div>

          <!-- To -->
          <div class="endpoint-info text-right">
            <div class="time-row">
              <span class="main-time">${arrTime}</span>
              ${renderDelayBadge(arrDelay, conn.to.prognosis?.arrival)}
            </div>
            <span class="station-name">${escapeHtml(conn.to.station.name)}</span>
            <span class="platform-info">Gleis ${escapeHtml(arrPlatform)}</span>
          </div>
        </div>

        <div class="connection-meta">
          <div class="products-list">
            ${products.map(p => `<span class="product-tag">${escapeHtml(p)}</span>`).join('')}
          </div>
          <div class="connection-actions">
            <button type="button" class="btn btn-sm btn-ghost" onclick="toggleConnectionLegs(${index})" id="btnLegs-${index}" title="Details und Zwischenhalte einblenden">
              Details & Teilstrecken ▼
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="exportIcs(${index})" title="In Kalender (.ics) exportieren">
              📅 In Kalender
            </button>
            <button type="button" class="btn btn-sm ${isCurrentlyMonitored ? 'btn-danger' : 'btn-primary'} btn-monitor-toggle"
                    onclick="toggleMonitorConnection(${index})">
              ${isCurrentlyMonitored ? 'Überwachung aktiv' : '🔔 Diese Verbindung überwachen'}
            </button>
          </div>
        </div>

        <!-- Expandable Leg Accordion -->
        <div id="legsContainer-${index}" class="legs-container" hidden></div>
      </div>
    `;
  }).join('');

  // Store connections in window for reference
  window.lastFoundConnections = connections;
}

// --- Legs & Intermediate Stops Accordion ---
window.toggleConnectionLegs = function(index) {
  const container = document.getElementById(`legsContainer-${index}`);
  const btn = document.getElementById(`btnLegs-${index}`);
  if (!container || !btn) return;

  if (!container.hidden) {
    container.hidden = true;
    btn.textContent = 'Details & Teilstrecken ▼';
    return;
  }

  const conn = window.lastFoundConnections?.[index];
  if (!conn || !conn.sections) return;

  container.innerHTML = conn.sections.map((sec, secIdx) => {
    // Footpath transfer
    if (sec.walk) {
      const walkMin = sec.walk.duration ? Math.round(sec.walk.duration / 60) : 5;
      return `
        <div class="leg-card walk-leg">
          🚶 Fußweg / Umstieg: ca. <strong>${walkMin} Min</strong>
        </div>
      `;
    }

    if (sec.journey) {
      const cat = sec.journey.category || 'Zug';
      const num = sec.journey.number || '';
      const head = `${cat} ${num}`.trim();
      const depStn = sec.departure?.station?.name || 'Start';
      const arrStn = sec.arrival?.station?.name || 'Ziel';
      const depT = formatTime(sec.departure?.departure);
      const arrT = formatTime(sec.arrival?.arrival);
      const depPlat = sec.departure?.prognosis?.platform || sec.departure?.platform || '-';
      const arrPlat = sec.arrival?.prognosis?.platform || sec.arrival?.platform || '-';
      const depDel = sec.departure?.delay;
      const arrDel = sec.arrival?.delay;

      const passList = (sec.journey.passList || []).slice(1, -1); // Zwischenhalte

      return `
        <div class="leg-card">
          <div class="leg-header">
            <div>
              <span class="leg-transport-badge">${escapeHtml(head)}</span>
              <span style="margin-left: 8px; font-weight: 600;">Richtung: ${escapeHtml(sec.journey.to || arrStn)}</span>
            </div>
            <div>${sec.journey.operator ? `<span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(sec.journey.operator)}</span>` : ''}</div>
          </div>

          <div class="leg-stops">
            <div class="leg-stop-row">
              <span class="leg-stop-name">🟢 Abfahrt: <strong>${escapeHtml(depStn)}</strong> (Gleis ${escapeHtml(depPlat)})</span>
              <div style="display: flex; gap: 6px; align-items: baseline;">
                <span class="leg-stop-time">${depT}</span>
                ${renderDelayBadge(depDel, sec.departure?.prognosis?.departure)}
              </div>
            </div>

            ${passList.length > 0 ? `
              <details style="margin: 4px 0; font-size: 0.8rem; color: var(--text-muted); cursor: pointer;">
                <summary>${passList.length} Zwischenhalte anzeigen</summary>
                <div style="margin-top: 6px; display: flex; flex-direction: column; gap: 3px; padding-left: 8px;">
                  ${passList.map(p => `
                    <div style="display: flex; justify-content: space-between;">
                      <span>• ${escapeHtml(p.station?.name || '')}</span>
                      <span>${formatTime(p.departure || p.arrival)} ${p.delay ? `(+${p.delay}m)` : ''}</span>
                    </div>
                  `).join('')}
                </div>
              </details>
            ` : ''}

            <div class="leg-stop-row">
              <span class="leg-stop-name">🔴 Ankunft: <strong>${escapeHtml(arrStn)}</strong> (Gleis ${escapeHtml(arrPlat)})</span>
              <div style="display: flex; gap: 6px; align-items: baseline;">
                <span class="leg-stop-time">${arrT}</span>
                ${renderDelayBadge(arrDel, sec.arrival?.prognosis?.arrival)}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }).join('');

  container.hidden = false;
  btn.textContent = 'Details & Teilstrecken ▲';
};

// --- Kalender Export (.ics) ---
window.exportIcs = function(index) {
  const conn = window.lastFoundConnections?.[index];
  if (!conn) return;

  const toIcsDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startUtc = toIcsDate(conn.from.departure);
  const endUtc = toIcsDate(conn.to.arrival);
  const nowUtc = toIcsDate(new Date().toISOString());

  const fromName = conn.from.station.name;
  const toName = conn.to.station.name;
  const depPlatform = conn.from.prognosis?.platform || conn.from.platform || '-';
  const products = (conn.products || []).join(', ');

  const summary = `🚆 ${fromName} -> ${toName} (${products})`;
  const description = `ÖV-Fahrt von ${fromName} (Gleis ${depPlatform}) nach ${toName}.\\nLinien: ${products}\\nUmstiege: ${conn.transfers}\\nDauer: ${formatDuration(conn.duration)}`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SBB Verspaetungs-Waechter//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:sbb-${conn.from.departureTimestamp}-${Date.now()}@sbb-waechter`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${fromName}, Gleis ${depPlatform}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanDate = conn.from.departure.substring(0, 10);
  a.download = `sbb_${fromName}_${toName}_${cleanDate}.ics`.replace(/\s+/g, '_');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Kalender-Termin (.ics) gespeichert!', 'success');
};

// --- Monitoring Engine ---
function getSectionDelays(conn) {
  const delays = [];
  if (conn.sections && Array.isArray(conn.sections)) {
    conn.sections.forEach(sec => {
      if (sec.departure?.delay) delays.push(sec.departure.delay);
      if (sec.arrival?.delay) delays.push(sec.arrival.delay);
    });
  }
  return delays;
}

function renderDelayBadge(delay, prognosisTime) {
  if (delay === null || delay === undefined || delay === 0) {
    return `<span class="delay-badge ok">✓ Pünktlich</span>`;
  }
  const progText = prognosisTime ? ` (neu: ${formatTime(prognosisTime)})` : '';
  return `<span class="delay-badge warn">⚠️ +${delay} Min${progText}</span>`;
}

window.toggleMonitorConnection = function(index) {
  const conn = window.lastFoundConnections?.[index];
  if (!conn) return;

  if (activeMonitor && activeMonitor.departureTimestamp === conn.from.departureTimestamp) {
    stopMonitoring();
    return;
  }

  startMonitoring(conn);
};

function startMonitoring(conn) {
  if (Notification.permission === 'default') {
    requestNotificationPermission();
  }

  const depTime = formatTime(conn.from.departure);
  const arrTime = formatTime(conn.to.arrival);

  activeMonitor = {
    fromName: conn.from.station.name,
    toName: conn.to.station.name,
    scheduledDeparture: conn.from.departure,
    departureTimestamp: conn.from.departureTimestamp,
    lastKnownDelay: conn.from.delay || 0,
    depTime,
    arrTime,
    products: conn.products || []
  };

  renderActiveMonitorCard(conn);
  monitorCard.hidden = false;
  monitorCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (window.lastFoundConnections) {
    renderConnections(window.lastFoundConnections, activeMonitor.fromName, activeMonitor.toName);
  }

  addLogEntry(`Überwachung gestartet für ${activeMonitor.fromName} → ${activeMonitor.toName} (${depTime})`, 'ok');
  showToast(`Wächter aktiv: ${activeMonitor.fromName} → ${activeMonitor.toName}`, 'success');

  clearInterval(monitorIntervalId);
  clearInterval(countdownTimerId);

  secondsRemaining = POLL_INTERVAL_SECONDS;
  updateTimerUI();

  countdownTimerId = setInterval(() => {
    secondsRemaining--;
    if (secondsRemaining <= 0) {
      secondsRemaining = POLL_INTERVAL_SECONDS;
      checkMonitoredConnection();
    }
    updateTimerUI();
  }, 1000);
}

function updateTimerUI() {
  monitorTimer.innerHTML = `Nächste Aktualisierung in: <strong>${secondsRemaining}s</strong>`;
}

async function checkMonitoredConnection() {
  if (!activeMonitor) return;

  try {
    const depDate = activeMonitor.scheduledDeparture.split('T')[0];
    const depHourMin = activeMonitor.depTime;
    const url = `${API_BASE}/connections?from=${encodeURIComponent(activeMonitor.fromName)}&to=${encodeURIComponent(activeMonitor.toName)}&date=${depDate}&time=${depHourMin}&limit=4`;
    
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    const connections = data.connections || [];

    const matched = connections.find(c => c.from.departureTimestamp === activeMonitor.departureTimestamp) || connections[0];
    if (!matched) return;

    renderActiveMonitorCard(matched);

    const depDelay = matched.from.delay || 0;
    const arrDelay = matched.to.delay || 0;
    const sectionDelays = getSectionDelays(matched);
    const currentMaxDelay = Math.max(depDelay, arrDelay, ...sectionDelays);

    const threshold = parseInt(selectThreshold?.value || '1', 10);

    // Trigger alert if delay meets or exceeds threshold
    if (currentMaxDelay >= threshold && currentMaxDelay !== activeMonitor.lastKnownDelay) {
      triggerDelayAlarm(matched, currentMaxDelay);
    } else if (currentMaxDelay === 0 && activeMonitor.lastKnownDelay > 0) {
      addLogEntry(`Verbindung wieder pünktlich! (${activeMonitor.depTime} ${activeMonitor.fromName})`, 'ok');
      showToast(`Zug wieder im Fahrplan (${activeMonitor.fromName})`, 'success');
    }

    activeMonitor.lastKnownDelay = currentMaxDelay;
  } catch (err) {
    console.error('Monitor check failed:', err);
  }
}

function triggerDelayAlarm(conn, delayMinutes) {
  const line = (conn.products && conn.products[0]) ? conn.products[0] : 'Verbindung';
  const title = `⚠️ Verspätung: +${delayMinutes} Min für ${line}`;
  const body = `${conn.from.station.name} (${formatTime(conn.from.departure)}) → ${conn.to.station.name}. Neu ca. ${formatTime(conn.from.prognosis?.departure || conn.from.departure)}`;

  // 1. Desktop Notification
  sendNotification(title, body);

  // 2. Play Audio Alert Chime (if enabled)
  if (chkAudioAlarm && chkAudioAlarm.checked) {
    playAlertChime();
  }

  // 3. UI Toast
  showToast(title, 'danger');

  // 4. Log
  addLogEntry(`⚠️ Verspätung gemeldet: +${delayMinutes} Min bei ${conn.from.station.name} (${activeMonitor.depTime})`, 'delayed');
}

function renderActiveMonitorCard(conn) {
  const depTime = formatTime(conn.from.departure);
  const arrTime = formatTime(conn.to.arrival);
  const depDelay = conn.from.delay;
  const products = (conn.products || []).join(', ');

  monitorDetails.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
      <div>
        <div style="font-size: 1.15rem; font-weight: 700;">
          ${escapeHtml(conn.from.station.name)} → ${escapeHtml(conn.to.station.name)}
        </div>
        <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">
          Linie: <strong>${escapeHtml(products || 'ÖV')}</strong> | Abfahrt: <strong>${depTime}</strong> | Ankunft: <strong>${arrTime}</strong>
        </div>
      </div>
      <div>
        ${renderDelayBadge(depDelay, conn.from.prognosis?.departure)}
      </div>
    </div>
  `;
}

function stopMonitoring() {
  clearInterval(monitorIntervalId);
  clearInterval(countdownTimerId);
  if (activeMonitor) {
    addLogEntry(`Überwachung beendet (${activeMonitor.fromName} → ${activeMonitor.toName})`, 'ok');
  }
  activeMonitor = null;
  monitorCard.hidden = true;
  if (window.lastFoundConnections) {
    renderConnections(window.lastFoundConnections, inputFrom.value, inputTo.value);
  }
  showToast('Überwachung gestoppt', 'success');
}

// --- Live Stationboard Engine ---
async function loadStationboard() {
  const station = boardStation.value.trim();
  if (!station) {
    showToast('Bitte eine Haltestelle angeben', 'danger');
    return;
  }

  const limit = boardLimit.value || '20';
  boardSpinner.hidden = false;
  btnLoadBoard.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/stationboard?station=${encodeURIComponent(station)}&limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    currentStationboardData = data;
    renderStationboard(data);
    boardResultsWrap.hidden = false;
  } catch (err) {
    console.error('Stationboard error:', err);
    showToast('Fehler beim Laden der Abfahrten: ' + err.message, 'danger');
  } finally {
    boardSpinner.hidden = true;
    btnLoadBoard.disabled = false;
  }
}

function renderStationboard(data) {
  const stationName = data.station?.name || boardStation.value;
  boardTitle.textContent = `Abfahrten ab: ${stationName}`;
  boardUpdatedTime.textContent = `Stand: ${new Date().toLocaleTimeString('de-CH')}`;

  const list = data.stationboard || [];
  if (list.length === 0) {
    boardList.innerHTML = '<p class="empty-state">Keine Abfahrten gefunden.</p>';
    return;
  }

  boardList.innerHTML = list.map(item => {
    const time = formatTime(item.stop?.departure);
    const delay = item.stop?.delay;
    const prognosisDep = item.stop?.prognosis?.departure;
    const cat = item.category || 'ÖV';
    const num = item.number || '';
    const lineLabel = `${cat} ${num}`.trim();
    const to = item.to || 'Unbekannt';
    const platform = item.stop?.prognosis?.platform || item.stop?.platform || '-';

    return `
      <div class="board-row">
        <span class="board-time-cell">${time}</span>
        <div><span class="board-line-tag">${escapeHtml(lineLabel)}</span></div>
        <span class="board-dest-cell" title="${escapeHtml(to)}">${escapeHtml(to)}</span>
        <span class="board-plat-cell">Gleis ${escapeHtml(platform)}</span>
        <div style="text-align: right;">${renderDelayBadge(delay, prognosisDep)}</div>
      </div>
    `;
  }).join('');
}

// --- Notifications & Audio ---
function updatePermissionUI() {
  if (!('Notification' in window)) {
    permDot.className = 'status-dot denied';
    permText.textContent = 'Browser unterstützt keine Benachrichtigungen';
    btnRequestPerm.hidden = true;
    return;
  }

  const perm = Notification.permission;
  permDot.className = `status-dot ${perm}`;

  if (perm === 'granted') {
    permText.textContent = 'Benachrichtigungen: Aktiviert ✓';
    btnRequestPerm.hidden = true;
  } else if (perm === 'denied') {
    permText.textContent = 'Benachrichtigungen: Im Browser blockiert ✗';
    btnRequestPerm.hidden = true;
  } else {
    permText.textContent = 'Benachrichtigungen: Erlaubnis erforderlich';
    btnRequestPerm.hidden = false;
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  const permission = await Notification.requestPermission();
  updatePermissionUI();
  if (permission === 'granted') {
    showToast('Benachrichtigungen erfolgreich aktiviert!', 'success');
  }
}

function sendNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚆</text></svg>'
      });
    } catch (e) {
      console.error('Notification creation failed:', e);
    }
  }
}

/**
 * Web Audio Melodic Chime
 * Synthesizes a crisp, clear 2-tone chime without external audio files
 */
function playAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 880 Hz (A5)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.error('Audio chime error:', e);
  }
}

// --- Helpers ---
function formatTime(isoString) {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(durationStr) {
  if (!durationStr) return '--';
  const match = durationStr.match(/(\d+)d(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return durationStr;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

function addLogEntry(text, type = 'ok') {
  const time = new Date().toLocaleTimeString('de-CH');
  const empty = eventLog.querySelector('.empty-state');
  if (empty) empty.remove();

  const item = document.createElement('div');
  item.className = `log-item ${type}`;
  item.innerHTML = `
    <span>${escapeHtml(text)}</span>
    <span class="log-time">${time}</span>
  `;
  eventLog.prepend(item);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'danger' ? '⚠️' : '✓'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function loadSavedState() {
  const savedFrom = localStorage.getItem('sbb_from');
  const savedTo = localStorage.getItem('sbb_to');
  if (savedFrom) inputFrom.value = savedFrom;
  if (savedTo) inputTo.value = savedTo;
}
