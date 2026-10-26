/**
 * Swiss Public Transport Delay Monitor
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

// DOM Elements
const inputFrom = document.getElementById('inputFrom');
const inputTo = document.getElementById('inputTo');
const suggestFrom = document.getElementById('suggestFrom');
const suggestTo = document.getElementById('suggestTo');
const inputDate = document.getElementById('inputDate');
const inputTime = document.getElementById('inputTime');
const searchForm = document.getElementById('searchForm');
const btnSearch = document.getElementById('btnSearch');
const searchSpinner = document.getElementById('searchSpinner');
const btnNow = document.getElementById('btnNow');
const btnSwap = document.getElementById('btnSwap');
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

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initDateTime();
  updatePermissionUI();
  setupEventListeners();
  loadSavedState();
});

function initDateTime() {
  const now = new Date();
  inputDate.value = now.toISOString().split('T')[0];
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  inputTime.value = `${hours}:${minutes}`;
}

function setupEventListeners() {
  // Autocomplete
  setupAutocomplete(inputFrom, suggestFrom);
  setupAutocomplete(inputTo, suggestTo);

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

  // Notification permissions
  btnRequestPerm.addEventListener('click', requestNotificationPermission);
  btnTestNotify.addEventListener('click', () => {
    sendNotification(
      '🚆 Test-Benachrichtigung',
      'Der ÖV-Verspätungs-Wächter ist aktiv und betriebsbereit.'
    );
    playAlertChime();
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

  // Document click to close autocomplete dropdowns
  document.addEventListener('click', (e) => {
    if (!suggestFrom.contains(e.target) && e.target !== inputFrom) suggestFrom.hidden = true;
    if (!suggestTo.contains(e.target) && e.target !== inputTo) suggestTo.hidden = true;
  });
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

  setLoading(true);

  try {
    const url = `${API_BASE}/connections?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&time=${time}&limit=6`;
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
    const maxDelay = Math.max(depDelay || 0, arrDelay || 0, ...getSectionDelays(conn));

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
          <button type="button" class="btn btn-sm ${isCurrentlyMonitored ? 'btn-danger' : 'btn-primary'} btn-monitor-toggle"
                  onclick="toggleMonitorConnection(${index})">
            ${isCurrentlyMonitored ? 'Überwachung aktiv' : '🔔 Diese Verbindung überwachen'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Store connections in window for reference by click handler
  window.lastFoundConnections = connections;
}

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

// --- Monitoring Engine ---
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
  // Ensure notification permission requested if default
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

  // Update list cards to reflect monitored connection
  if (window.lastFoundConnections) {
    renderConnections(window.lastFoundConnections, activeMonitor.fromName, activeMonitor.toName);
  }

  addLogEntry(`Überwachung gestartet für ${activeMonitor.fromName} → ${activeMonitor.toName} (${depTime})`, 'ok');
  showToast(`Wächter aktiv: ${activeMonitor.fromName} → ${activeMonitor.toName}`, 'success');

  // Start polling timer
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

    // Find the exact matching connection by scheduled departure timestamp
    const matched = connections.find(c => c.from.departureTimestamp === activeMonitor.departureTimestamp) || connections[0];

    if (!matched) return;

    renderActiveMonitorCard(matched);

    const depDelay = matched.from.delay || 0;
    const arrDelay = matched.to.delay || 0;
    const sectionDelays = getSectionDelays(matched);
    const currentMaxDelay = Math.max(depDelay, arrDelay, ...sectionDelays);

    // Check if delay state changed or delay detected
    if (currentMaxDelay > 0 && currentMaxDelay !== activeMonitor.lastKnownDelay) {
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
  const body = `${conn.from.station.name} (${formatTime(conn.from.departure)}) → ${conn.to.station.name}. Neu voraussichtlich ${formatTime(conn.from.prognosis?.departure || conn.from.departure)}`;

  // 1. Desktop / Push Web Notification
  sendNotification(title, body);

  // 2. Play Audio Alert Chime
  playAlertChime();

  // 3. UI Toast
  showToast(title, 'danger');

  // 4. Log
  addLogEntry(`⚠️ Verspätung gemeldet: +${delayMinutes} Min bei ${conn.from.station.name} (${activeMonitor.depTime})`, 'delayed');
}

function renderActiveMonitorCard(conn) {
  const depTime = formatTime(conn.from.departure);
  const arrTime = formatTime(conn.to.arrival);
  const depDelay = conn.from.delay;
  const arrDelay = conn.to.delay;
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
  // Example: 00d01:18:00
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
