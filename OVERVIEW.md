# System- & Architektur-Übersicht

Kompakte Dokumentation über Aufbau, Tech-Stack und Funktionsweise des Game-Arcade-Repositories.

---

## 1. Philosophie & Tech-Stack

- **Zero-Build & Zero-Dependency:** Keine Bundler (Webpack/Vite), kein Node/npm-Runtime-Zwang, kein Backend.
- **Pure Client-Side:** HTML5, CSS3, Vanilla JavaScript, HTML5 Canvas, WebGL / Three.js (via CDN).
- **Standalone:** Jede HTML-Datei läuft direkt im Browser über einen simplen statischen Webserver.
- **Web Audio API:** Prozedurale Soundeffekte ohne externe MP3/WAV-Dateien.
- **Offline & LocalStorage:** Spielstände und Highscores werden im Browser-Speicher des Clients gehalten.

---

## 2. Verzeichnis-Struktur

```text
├── index.html            # Zentraler Hub (Navigation, Filter, Suche, Highscore-Dashboard)
├── style.css             # Zentrales Styling für Hub, Cards, Modal & Grid
├── games/                # >65 Standalone-Spiele (z. B. thermal_nomad.html, hexfront.html)
├── src/
│   ├── arcade-core.js    # Zentraler Audio-Synthesizer, Mute-State, Highscore-Bridge
│   └── favicon.ico       # Zentrales Favicon
├── audiodecoder/         # SignalScope Live (AFSK, DTMF, Morse, SSTV Audio-Dekoder)
├── filetoaudio/          # FileTone 2.0 (Akustisches Modem, FSK, Reed-Solomon)
├── qraudio/              # QR-Audio-Stream (Optische Datenübertragung per Webcam)
├── sbb/                  # ÖV-Verspätungs-Monitor (Schweizer Fahrplandaten via SBB API)
├── git/                  # GitHistory 3D (3D-Visualisierung von Git-Repositories)
├── tracker/              # Satellite Tracker (Live-Orbit-Berechnung)
├── pixelfont/            # 8x8 Pixel-Font Bitmap-Editor
├── molecule-lab/         # Molekül- & Chemie-Simulator
├── franz/                # Französisch Grammatik- & Vokabel-Trainer
├── games_liste.md        # Vollständiger Katalog aller Spiele mit Tags & Beschreibungen
├── README.md             # Öffentliche Projekt-Dokumentation
├── AGENTS.md / CLAUDE.md # Richtlinien & Git-Workflows für KI-Agenten
└── OVERVIEW.md           # Diese Architektur- & Systemübersicht
```

---

## 3. Kern-Architektur & Funktionsweise

### A. Der Hub (`index.html` & `style.css`)
- **Routing:** Kein Single-Page-App-Router. Cards verlinken direkt auf statische HTML-Pfade (`games/<spiel>.html` oder `<tool>/index.html`).
- **Kategorien & Filter:** JavaScript-Filter für Tabs (*Alle, Games, Tools, Schule*) und Tag-Suche im DOM.
- **Highscore-Sync:** Liest beim Laden Highscores via `ArcadeCore.getAllScores()` aus `localStorage` und rendert Badges auf den Spielkarten.

### B. Shared Utility (`src/arcade-core.js`)
Global als `window.ArcadeCore` eingebunden:
1. **Synthesizer Sounds (`ArcadeCore.sounds`):**
   - Synthese via Web Audio API (`OscillatorNode`, `GainNode`, `BiquadFilterNode`, White-Noise-Buffer).
   - Kein Laden von Audio-Dateien nötig.
   - Methoden: `pop()`, `coin()`, `jump()`, `hit()`, `powerup()`, `explosion()`, `gameOver()`, `merge()`, `playTone(freq, dur, type, gain)`.
   - Automatischer AudioContext-Unlock bei erster Nutzerinteraktion (`pointerdown`, `keydown`).
2. **Mute-Management:**
   - Globaler Schalter `ArcadeCore.toggleMute()`.
   - Zustand persistent in `localStorage('arcade_sound_muted')`.
   - Feuert Custom-Event `arcade_mute_changed`.
3. **Highscore-Storage:**
   - Zentrale Key-Tabelle `SCORE_KEYS` (z. B. `tetrisBest`, `snakeBest`, `ek_best`).
   - `ArcadeCore.saveScore(gameKey, score)`
   - `ArcadeCore.getScore(gameKey)`
   - `ArcadeCore.formatNumber(num)` (Formatierung wie `1.2 Mio.`, `45k`).

### C. Spiele-Muster (`games/*.html`)
Jedes Spiel ist nach einem einheitlichen Muster strukturiert:
- **Single-File oder getrennt:** Meist HTML mit Inline-`<style>` und `<script>` oder separatem Game-Script.
- **Audio-Einbindung:** `<script src="../src/arcade-core.js"></script>` liefert Sound & Highscores.
- **Game-Loop:** Standard `requestAnimationFrame(loop)` mit Delta-Time-Berechnung.
- **Input:** Event-Listener auf `keydown`, `keyup`, `touchstart`, `touchmove`, `touchend`.
- **Render-Technologie je nach Genre:**
  - 2D Arcade: HTML5 Canvas 2D Context (`ctx.drawImage`, Vektorpfade).
  - 3D Simulation: Three.js via CDN (z. B. `thermal_nomad.html`, `lokfuehrer.html`).
  - Physik: Matter.js oder handgeschriebene Euler-Integration (`ballistics.html`, `kofferstapler.html`).

---

## 4. Regeln für neue Spiele & Tools

1. **Git-Branching:**
   - Neues Feature / Game: IMMER auf eigenem Branch entwickeln (`feat/<game-name>`).
   - Große Fixes / Refactors: `fix/<name>` bzw. `refactor/<name>`.
   - Direkte Commits auf `main` nur für minimale Typos / Einzeiler.
2. **Katalog-Registrierung:**
   Bei jedem neuen Spiel müssen Einträge ergänzt werden in:
   - `index.html` (neue Card im Grid mit passenden Tags & Highscore-Attribut)
   - `games_liste.md`
   - `README.md`
3. **Audio & Highscores:**
   - `src/arcade-core.js` für Sounds und Highscores nutzen.
   - Neuer Score-Key bei Bedarf in `SCORE_KEYS` in `src/arcade-core.js` eintragen.

---

## 5. Lokaler Start

Im Wurzelverzeichnis ausführen:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .
```

Im Browser aufrufen: `http://localhost:8000/`
