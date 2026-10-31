# 🕹️ Game Arcade & Web Tools

Eine umfassende, eigenständige Sammlung von **über 65 Browser-Games, interaktiven Web-Tools und Lern-Apps** — komplett clientseitig in HTML5, Canvas und modernem Vanilla JavaScript umgesetzt, ohne Build-Step, Bundler oder externe Backend-Abhängigkeiten.

🌐 **Live Hub:** [`https://rwpxe.com`](https://rwpxe.com)  
🎮 **Lokale Startseite:** [`index.html`](index.html)

---

## 🌟 Highlights & Kategorien

### 🎮 Spiele (Games)
Der Arcade-Hub bietet über 65 Minigames mit Highscores, Sound-Effekten (Web Audio API via [`src/arcade-core.js`](src/arcade-core.js)) und Touch-/Keyboard-Steuerung:

* **Physik & Ragdoll:**
  * [`games/magnet.html`](games/magnet.html) — *Magnet-Puzzler: Polaritäts-Panik (Coulomb-Physik, Decken-Anziehung & Büroklammern-Abwehr)*
  * [`games/kofferstapler.html`](games/kofferstapler.html) — *Koffer-Stapler Extreme (Airport Jenga mit Matter.js-Physik & Turbulenzen-Test)*
  * [`games/einkaufswagen.html`](games/einkaufswagen.html) — *Einkaufswagen-Rallye (Supermarkt Derby mit klemmendem Rad & Ragdoll)*
  * [`games/fensterputzer.html`](games/fensterputzer.html) — *Fensterputzer 9000 (Wolkenkratzer-Seilgondel mit Balance & Tauben)*
  * [`games/physiklabor.html`](games/physiklabor.html) — *Interaktives 2D-Physik-Labor mit Auftrieb, Federn & Gravitation*
  * [`games/stair_yeet.html`](games/stair_yeet.html) — *Office Yeet: Ragdoll Dismount*
  * [`games/cannon_sheep.html`](games/cannon_sheep.html) — *Cannon Sheep Weitenrekord*
* **Strategie & Simulation:**
  * [`games/hexfront.html`](games/hexfront.html) — *HEXFRONT: Tactical Warfare (Rundenbasierte Hex-Strategie)*
  * [`games/propaganda.html`](games/propaganda.html) — *Wähl Mich! — Propaganda Simulator*
  * [`games/doener.html`](games/doener.html) — *Döner Tycoon*
  * [`games/boatsim.html`](games/boatsim.html) — *Boot- & Wellen-Simulator*
  * [`games/tycoon.html`](games/tycoon.html) — *3D City Tycoon*
* **Action & Roguelike:**
  * [`games/microwave.html`](games/microwave.html) — *Microwave Meltdown: Die Büro-Mikrowelle (High-Stakes Plasma & Kernschmelze-Timing)*
  * [`games/survivor.html`](games/survivor.html) — *Crypt Survivor: Rogue Dawn (Bullet-Heaven Roguelite)*
  * [`games/spire.html`](games/spire.html) — *Spire of Cards (Deckbuilder)*
  * [`games/neondefense.html`](games/neondefense.html) — *Cyber Defense: Neon Grid (Sci-Fi Tower Defense)*
  * [`games/squidgame.html`](games/squidgame.html) — *Squid Survival: Die 45.6 Mrd. Won Spiele*
  * [`games/superhot.html`](games/superhot.html) — *SUPERHOT 2D (Time moves only when you move)*
  * [`games/buckshot.html`](games/buckshot.html) — *Buckshot Roulette*
* **Racing & 3D:**
  * [`games/stadiumrush.html`](games/stadiumrush.html) — *Stadium Rush (Polytrack & Trackmania 3D-Zeitfahren)*
  * [`games/buerostuhl.html`](games/buerostuhl.html) — *Bürostuhl GP*
  * [`games/skytower.html`](games/skytower.html) — *Sky Tower 3D Stack Master*
* **Klassiker & Puzzles:**
  * Tetris, Snake, 2048, Suika Game, Flappy Bird, Doodle Jump, Breakout, Globle Earth u.v.m.

---

### 🛠️ Web Tools & Air-Gap Utilities
Nützliche Browser-Werkzeuge mit modernem Canvas-, Web Audio- und Sensor-Support:

* **[`filetoaudio/index.html`](filetoaudio/index.html)** — *FileTone 2.0 (Acoustic Modem)*: Überträgt Dateien und Text als hochfrequente akustische Datenpakete über Lautsprecher und Mikrofon (Air-Gap Data Transfer mit Reed-Solomon-Fehlerkorrektur).
* **[`qraudio/index.html`](qraudio/index.html)** — *QR Audio Stream*: Optische Daten- und Audioübertragung über animierte QR-Codes per Webcam.
* **[`sbb/index.html`](sbb/index.html)** — *ÖV Verspätungs-Wächter*: Echtzeit-Abfahrten, Störungen & Verspätungen für Schweizer Züge (SBB API).
* **[`git/index.html`](git/index.html)** — *GitHistory 3D*: Interaktive 3D-Visualisierung von Git-Repositories mit Bloom-Shadern.
* **[`pixelfont/index.html`](pixelfont/index.html)** — *8x8 Pixel Font Studio*: Bitmap-Schrifteditor mit CRT-Vorschau und Export.
* **[`tracker/index.html`](tracker/index.html)** — *Satellite Tracker*: Live-Überflugrechner und Weltkarten-Tracking.
* **ConsensusGraph** — *Wissenschaftliche Papers & Studien*: Evidenz- und Konsens-Suche via PubMed ([historie.rwpxe.com](https://historie.rwpxe.com)).

---

### 📚 Schule & Lernen
* **Notenrechner Pro** — *Gewichtete Durchschnitte, Wunschnoten & Prüfungsschnitt nach CH/DE/AT-System ([noten-rechner.ch](https://noten-rechner.ch))*
* **[`franz/index.html`](franz/index.html)** — *Französisch Grammatik-, Verben- & Zahlen-Trainer*

---

## 🚀 Lokale Nutzung

Da alle Spiele und Tools statische Web-Technologien nutzen, ist keine Installation von Node, Python oder externen Datenbanken zwingend erforderlich.

Einfach einen lokalen HTTP-Server im Repository-Root starten:

```bash
# Mit Python 3:
python -m http.server 8000

# Oder mit Node (z.B. npx serve):
npx serve .
```

Anschließend im Browser öffnen:
```
http://localhost:8000/
```

---

## 📁 Projektstruktur

```
├── index.html            # Haupt-Arcade-Hub mit Tabs (Games, Tools, School), Suche & Sprachumschaltung
├── style.css             # Zentrales Stylesheet für Hub, Navigation & Responsive Grid
├── ideas.md              # Backlog & Notizen für neue Spiel-Ideen
├── src/
│   ├── arcade-core.js    # Globaler Sound-Synthesizer, Highscore-Storage & Pop-Effekte
│   ├── hub-en.js         # Englische Übersetzungen & Metadaten für den Hub
│   └── favicon.ico       # Arcade-Favicon
├── games/                # Alle eigenständigen HTML5-Spiele (Englisch / Standard)
│   └── de/               # Deutsche Versionen der Spiele
├── filetoaudio/          # Akustisches Datenmodem (Web Audio FSK / Reed-Solomon)
├── qraudio/              # QR-Code Video-Stream Datenübertragung
├── git/                  # 3D Git-Repository Visualizer
├── sbb/                  # Schweizer ÖV Verspätungs-Monitor
├── tracker/              # Satelliten-Tracker & Orbit-Berechnung
├── pixelfont/            # 8x8 Bitmap Font Editor
└── franz/                # Französisch Lern-App
```

---

## 🌍 Mehrsprachigkeit (i18n)
Der Hub unterstützt flüssiges Umschalten zwischen **Deutsch (DE)** und **Englisch (EN)** mit automatischer Speicherung in `localStorage`. Spiele verfügen über synchronisierte DE-Pendants im Ordner [`games/de/`](games/de/).
