---
name: project-structure
description: >-
  Beschreibt die Ordner- und Dateistruktur des Games-Repositories, erklärt welche Dateien
  wo liegen, wie neue Spiele hinzugefügt werden, dass zwingend beide Tracking-Links in allen HTML-Dateien
  enthalten sein müssen und legt fest, dass KEIN GitHub verwendet werden soll.
---

# Projekt- & Ordnerstruktur-Leitfaden (Game Arcade)

Dieses Dokument dient als Skill und Referenz für die Architektur dieses Projekts. Es beschreibt genau, wo welche Dateien liegen, wie die Arcade strukturiert ist, welche Konventionen gelten, dass in **jedem HTML-Dokument die beiden Pflicht-Tracking-Links** eingebunden werden müssen und dass **kein GitHub** verwendet werden darf.

---

## 🚫 Wichtige Grundregel: KEIN GitHub

* **Kein Git Remote / Kein GitHub:** Dieses Projekt ist rein lokal organisiert.
* **Keine GitHub-Befehle ausführen:** Es dürfen keine `git push`, `git pull origin`, GitHub CLI (`gh`) oder sonstige GitHub-spezifische Workflows verwendet oder vorgeschlagen werden.
* **Autarke Spiele:** Alle Spiele müssen lokal im Browser ausführbar sein, ohne externe Hosting- oder Authentifizierungs-Abhängigkeiten.

---

## 📊 Wichtige Grundregel: Pflicht-Tracking-Links in ALLEN HTML-Dateien

In **jedem neuen HTML-Dokument** (sowohl `index.html` als auch jedes Spiel in `games/`) müssen im `<head>` zwingend die beiden folgenden Tracking-Skripte eingebunden werden:

```html
<script defer src="https://umami.lucius-website.xyz/script.js" data-website-id="9d0997fa-7e37-41fa-beb7-d5b67a386b57"></script>
<script defer src="https://umami.lucius-website.xyz/recorder.js" data-website-id="9d0997fa-7e37-41fa-beb7-d5b67a386b57"></script>
```

---

## 🎨 Wichtige Grundregel: Einzigartiger Look & Eigenständiger Skill pro Spiel

* **Kein generischer Einheitsbrei:** Spiele dürfen **nicht alle gleich aussehen**! Jedes Spiel benötigt eine eigene visuelle Identität, stimmungsvolle Farbpalette, passende UI/Schriftarten, maßgeschneiderte Soundeffekte/Audio und individuelle Spielmechaniken. Beachte hierbei stets den Skill `unique-game-design`!
* **Eigener Skill / Leitfaden pro Spiel:** Jedes Spiel (bzw. Spielkonzept) soll seinen eigenen dokumentierten Skill bzw. Leitfaden in `.agents/skills/` erhalten, worin Look & Feel, Mechaniken, Steuerung, Easter Eggs und Features detailliert festgehalten werden.
* **Tiefe statt Fließband-Klone:** Jedes Spiel soll sich wie ein eigenständiges, mit Liebe gestaltetes Werk anfühlen.

---

## 📁 Verzeichnis-Übersicht

```text
c:\Users\luciu\Documents\dev\games\
├── .agents/
│   └── skills/
│       ├── project-structure/
│       │   └── SKILL.md       # Dieser Skill (Ordnerstruktur & Regeln)
│       └── unique-game-design/
│           └── SKILL.md       # Design-Unikat-Leitfaden (Anti-Copy-Paste-Regeln)
├── games/                     # Alle eigenständigen Browser-Spiele
│   ├── toast.html             # Toast in the Toaster: Crazy Physics Trickshot (Slingshot-Katapult, 2D Rigid-Body Physik, 6 Szenarien, Ventilatoren, Flipper, Slow-Mo Swish Cam & Web Audio Synthesizer)
│   ├── fidget.html            # Zen Fidget Studio: 14 beruhigende Anti-Stress Toys, ASMR Web Audio Synthese, Ambient Soundscape Mixer & Haptik
│   ├── dropper.html           # Cursed Dropper 3D: Falsche Physik (Surrealer 3D-Dropper, Vertigo Dolly Zoom, 7 unheimliche Schächte, umgekehrte Schwerkraft, fliegende Bürostühle, BSOD, Fleisch-Tunnel, zähe Luft & Web Audio Synthesizer)
│   ├── life.html              # Conway's Game of Life: Pixel Matrix (Zellulärer Automat, B3/S23, HighLife, Seeds, Glider Guns, Methuselahs, Oszillatoren, Heatmap-Alterung & Web Audio Synthesizer)
│   ├── sandbox.html           # Pixel Alchemy: Sandbox Simulator (Falling-Sand Chemie & Physik)
│   ├── schedule1.html         # Schedule I: Hyland Point Empire (Open-World Karte, Skateboard, Grow-Zelte, Packaging Station, Custom Strain Mixing mit Mutationen, Handy-SMS & Counter-Offers, Dealer Benji/Molly/Brad, Immobilien & Geldwäsche)
│   ├── kiez.html              # Kiez Simulator: St. Pauli Nächte (Boulevard, Pfandflaschen-Suche, Kneipe "Zur Rostigen Möwe", Schocken-Würfelspiel, Ritze-Boxbirne, Pegel & Fischmarkt)
│   ├── leveldevil.html        # Level Devil: Chaos Edition (Troll-Platformer, schüchterne Türen, Geister-Körper als Brücken, Schwerkraft-Späße, Fake-UIs & Web Audio)
│   ├── superhot.html          # SUPERHOT 2D (Time Moves Only When You Move, Kristall-Splitter, Wurf-/Fang-Mechanik, Katana-Bullet-Slice, Hotswitch, Replay)
│   ├── fnaf.html              # Five Nights at Faz-Byte's (1-Room Security Guard, 9 CCTV Cams, Blast Doors, Vent Seal, Music Box, Audio Lure & Web Audio Jumpscares)
│   ├── elpatron.html          # El Patrón: Medellín Empire Tycoon (Bargeld bündeln, Gummibänder, Nilpferdzucht & Snack-Frenzy, Paso-Fino-Derby, Cessna-Nachtflug-Minispiel, Karibik-Radar, Kartellkrieg & Reviere, Funktelefon-Dilemmas, La Catedral, $10 Mrd. Staatsschulden-Endspiel & Latin Synth)
│   ├── berghain.html          # Berghain Bouncer: Heute Leider Nicht (Papers Please Club Türsteher Simulator, Ausweise, Dresscode, Pupillen, Techno Web Audio)
│   ├── berghain_rein.html     # Berghain: Rein kommen (Gäste-Perspektive: WG-Vorglühen, Outfit-Wahl, Späti, Warteschlangen-Events & Sven-Türgespräch)
│   ├── breakingchem.html      # Breaking Chem: Heisenberg Lab Simulator (Chemische Synthese, Purity, DEA & Drogenimperium)
│   ├── doodlejump.html        # Doodle Jump Classic (Authentisches Original: Rechenheft-Papier, 4-beiniger Doodler, Federn, Jetpacks, Monster & Pupa-Schuss)
│   ├── buckshot.html          # Buckshot Roulette (12-Gauge Tabletop-Duell, Items, Defibrillator, Dealer-KI)
│   ├── moggspiel.html         # Mogg-Duell (Webcam Face-Off, Mewing, Hunter Eyes & Jawline-Scan)
│   ├── aura.html              # AURA: Infinite Motion (Aura-Schuld, Hallway-Bosse, Gigachad)
│   ├── animeclicker.html      # Anime Waifu Clicker (Spirit, Limit Break, Raids)
│   ├── towerdefense.html      # Tower Defense (Türme, Monsterwellen)
│   ├── suika.html             # Suika Game (Frucht-Merge mit 2D-Physik)
│   ├── frogger.html           # Frogger 2D Retro (Autobahn & Fluss)
│   ├── flappybird.html        # Flappy Bird (Röhren ausweichen)
│   ├── tetris.html            # Tetris (Block-Stapler)
│   ├── racer.html             # Top-down Racer (Rennrunden gegen die Uhr)
│   ├── snake.html             # Snake (Schlangen-Klassiker)
│   ├── 2048.html              # 2048 (Zahlenkacheln verschmelzen)
│   ├── breakout.html          # Breakout (Neon-Bricks zerschlagen)
│   ├── memory.html            # Memory Match (Kartenpaare aufdecken)
│   ├── casino.html            # Grand Casino Royale (3-in-1: Einarmiger Bandit mit Hebel & Jackpot, Blackjack & Kessel-Roulette mit geteiltem Bankroll)
│   ├── marble.html            # 3D Marble Blast (Three.js Murmelbahn)
│   └── maze.html              # Seed Maze (Prozedurales Labyrinth)
├── index.html                 # Startseite / Arcade-Hub mit allen Spielkarten
├── style.css                  # Globale Stylesheets (Hub, Navigation, Buttons)
├── IMPROVEMENTS.md            # Feature-Roadmap & Audit-Dokumentation aller 27 Spiele
└── README.md                  # Projekt-Dokumentation
```

---

## 📄 Dateien im Root-Verzeichnis

### 1. `index.html` (Der Arcade-Hub)
* **Zweck:** Die zentrale Übersichtsseite aller Minispiele im Retro-Arcade-Look.
* **Funktionsweise:**
  * Enthält ein dynamisches JavaScript-Array `const games = [...]`.
  * Jedes Spiel ist ein Objekt mit `{ name, emoji, url, desc }`.
  * Rendert interaktive Karten mit Hover-Effekten, Emojis und Beschreibungen.

### 2. `style.css` (Gemeinsame Styles)
* **Zweck:** Einheitliche Gestaltung für die Hub-Seite und gemeinsame Klassen.
* **Wichtige Klassen für Spiele:**
  * `.back`: Schwebender, abgerundeter Zurück-Button (`← Arcade`) oben links für alle Spiele.
  * `.touch-controls` / `.touch-btn`: Einheitliche On-Screen-Touch-Bedienelemente für mobile Endgeräte.
  * `canvas`: Zentriertes, abgerundetes Canvas-Styling mit responsivem Verhalten.

---

## 🎮 Der `games/`-Ordner (Spielekatalog)

Jedes Spiel in `games/` ist als **eigenständige HTML-Datei** realisiert (Single-File Architecture). Das bedeutet:
* HTML-Struktur, Inline-CSS für spielspezifisches Layout und JavaScript-Spiellogik liegen gebündelt in der jeweiligen Datei.
* **Audio-Effekte:** Werden bevorzugt über die native `Web Audio API` direkt im Script synthetisiert, um externe Ladefehler oder Abhängigkeiten von Online-Sounddateien zu vermeiden.
* **Mobile & Touch:** Alle Spiele unterstützen Touchevents und Touch-Controls (`touch-action: manipulation`).

### Vorhandene Spiele:
1. **`dropper.html`**: Cursed Dropper 3D (Falsche Physik & Uncanny Abyss): 3D-Dropper im Minecraft-Dropper-Stil mit 7 surrealen Schächten (Backrooms, Windows BSOD Fehlercode, pulsierender Fleischtunnel mit starrenden Riesenaugen, umgekehrte Schwerkraft/nach oben fallen, Mikrowellen-Fiebertraum um 03:33, rutschige Honig-Matrix mit Eis-Trägheit, optische Hypnose-Spiralen), Vertigo Dolly-Zoom bei High-Speed, 1st & 3rd-Person Ragdoll-Sicht, Flatter-Notbremse, Sturzflug-Boost, lustig-fiesen Todesnachrichten und nativem Web Audio Synthesizer (Wind, Herzschlag-Drohne, Knochenknacken & Wasser-Splash).
2. **`schedule1.html`**: Schedule I (Hyland Point Empire): Open-World Karte, Skateboard, Grow-Zelte, Packaging Station, Custom Strain Mixing mit Mutationen, Handy-SMS & Counter-Offers, Dealer Benji/Molly/Brad, Immobilien & Geldwäsche.
2. **`kiez.html`**: Kiez Simulator (St. Pauli Nächte): Authentischer Kiez- & Reeperbahn-Simulator mit animierter Neon-Street-Skyline, Hamburger Schietwetter-Regen, anklickbaren Pfandflaschen & Passanten, Eckkneipe "Zur Rostigen Möwe" mit Astra & Mexikaner, Tresen-Würfelspiel "Schocken" gegen Kalle, Ritze-Boxkeller mit Timing-Kraftmesser, Kiez-Kiosk zum Pfand-Einlösen, dynamischem Pegel- & Respektsystem, und dem großen Fischmarkt-Sonntagmorgen-Finale samt vollsynthetisiertem Web-Audio (Schifferklavier, Astra-Plopp, Nebelhorn, Münzen & Boxhiebe).
2. **`leveldevil.html`**: Level Devil (Original Edition): Der authentische Troll-Platformer nach dem Original von Unept mit minimalistischer Ästhetik (heller Hintergrund, solide schwarze Blöcke, quadratischer schwarzer Held, gelbe Exit-Tür), originalgetreuer Levelstruktur nach Welten (Pits mit nachgebenden/absinkenden Böden, Spikes mit Pop-up- und Decken-Stacheln, Push-Wände & Deckenquetscher, flüchtende & rennende Türen, vertauschte Tasten, Springs, Screen-Wraps und Schwerkraftumkehrung) und authentischen Soundeffekten via Web Audio API.
2. **`superhot.html`**: SUPERHOT 2D (Time Moves Only When You Move): Taktischer Top-Down-Zeitlupen-Shooter im ikonischen Weiß-Rot-Schwarz-Look mit facettierten Kristall-Gegnern, eingefrorenen Kugeln samt roten Schweifen, Waffen-Wurf & Luft-Fang-Mechanik (Air-Catch), Katana-Projektil-Zerschneiden, Hotswitch-Körpertausch, 10 Kampagnen-Nodes + Endless Arena, 1.0x Echtzeit-Replay und dynamischem Web-Audio-Synthesizer.
2. **`fnaf.html`**: Five Nights at Faz-Byte's (1-Room Security Guard / FNAF): Überlebe von 12:00 AM bis 6:00 AM im Sicherheitsbüro mit 9 Nachtsicht-Überwachungskameras, hydraulischen Schotttüren, Flurlichtern, Deckenlüftungs-Schott, aufziehbarer Spieluhr (Prize Corner), Audio-Ködern, Handkurbel-Notstromgenerator, System-Reboots, 5 Nächten + Custom Night (20/20/20/20), Upgrade-Shop und Web-Audio-Jumpscares.
5. **`elpatron.html`**: El Patrón (Medellín Empire Tycoon): Umfassender Kartell-Simulator rund um Pablo Escobar mit Bargeld-Zähler & Gummiband-Mechanik, Nilpferdzucht & Snack-Frenzy Minispiel, Paso-Fino Vollblut-Derby (Pferderennen-Casino), interaktivem Cessna-Nachtflug-Arcade Minispiel nach Florida, Karibik-Schmuggel-Radar (Flugzeuge, Boote, U-Boote), neuem Tab "Reviere & Kartellkrieg" (5 Zonen, Sicario-Truppen, Gefechte gegen Cali & Los Pepes), rotem Funktelefon mit Notfall-Dilemmas (Plata o Plomo), Dschungel-Laboren, Geldwäsche-Firmen & Caleta-Bunkern, La-Catedral-Luxusgefängnis, dem $10 Milliarden Staatsschulden-Endspiel und authentischem Latin Web Audio Synthesizer.
2. **`berghain.html`**: Berghain Bouncer (Heute Leider Nicht): Papers-Please-inspirierter Türsteher-Simulator für den berüchtigtsten Club Berlins mit proceduralen Ravern, Ausweisprüfung (Alter, Ablauf, Stadt), Schwarzlicht-UV-Lampe für Wasserzeichen, Pupillen-Lupe, Handy-Kamera-Sticker-Pflicht, DJ-Lineup-Quiz, witzigen Dialogen & Ausreden, 4 Shifts / Nächten und vollsynthetisiertem Dark-Techno-Soundtrack via Web Audio API.
2. **`breakingchem.html`**: Breaking Chem (Heisenberg Lab Simulator): Tiefgründige Chemielabor-Synthesen mit 4 Messinstrumenten (Temperatur, Druck, pH-Wert, Reinheit), Brandgefahr & Feuerlöscher, Reagenzien-Knappheit, Methylamin-Zugüberfall Minispiel, Gus Fring Superlab, Jesse & Saul als Crew, Geldwäsche und Prestige ("Say My Name").
3. **`doodlejump.html`**: Doodle Jump Classic: Das authentische Original auf kariertem Notizheft-Papier mit 4-beinigem Doodler, beweglichen/bröckelnden Plattformen, Sprungfedern, Trampolinen, Propeller-Mützen, Raketen-Jetpacks, Aliens, Schwarzen Löchern, Nasen-Geschossen und echten Retro-Soundeffekten via Web Audio API.
2. **`buckshot.html`**: Buckshot Roulette: 12-Gauge Tabletop-Duell gegen den Dealer mit Schrotpatronen (scharf/blind), taktischen Items (Lupe, Säge, Bier, Handschellen, Konverter, Burner Phone, Zigaretten), 3 Runden, Defibrillator-Ladungen, echter Dealer-KI und Web Audio Sound-Synthesizer.
2. **`moggspiel.html`**: Mogg-Duell Webcam Mogger: Lokales Kamera-Spiel mit Hunter Eyes, Mewing-Gesten-Erkennung, Jawline-Winkel-Scan, Boss-Kämpfen, Phonk-Synthesizer und Schnappschuss-Zertifikat.
2. **`aura.html`**: AURA Infinite Motion Simulator: Schuldenabbau, Hallway-Bosse, Sigma/Mewing & Gigachad-Stufen.
3. **`animeclicker.html`**: Tiefgründiger Anime Clicker mit 5 freischaltbaren Waifus, Limit Break, Demon Lord Raid, Alliierten, Isekai-Reinkarnation (Truck-kun Prestige) und Web Audio Synthesizer.
2. **`towerdefense.html`**: Strategisches Tower Defense mit Platzierung von Geschütztürmen, Upgrades und anstürmenden Monsterwellen.
3. **`suika.html`**: Physik-basiertes Frucht-Drop- und Verschmelzungsspiel.
4. **`frogger.html`**: Detailgetreues Retro-Frogger mit Autos, LKWs, Baumstämmen und Schildkröten.
5. **`flappybird.html`**: One-Button Geschicklichkeitsspiel durch Röhrenhindernisse.
6. **`tetris.html`**: Klassische Tetrominos, Linienräumung und Highscore-System.
7. **`racer.html`**: 2D-Rennstrecke aus der Vogelperspektive mit Rundenzeiten und Beschleunigungsphysik.
8. **`snake.html`**: Rasterbasiertes Schlangenspiel mit wachsendem Schweif und Kollisionsabfrage.
9. **`2048.html`**: Schiebepuzzle mit Zahlenwerten und flüssigen Kachel-Animationen.
10. **`breakout.html`**: Brick-Breaker mit Ballphysik, Paddle-Steuerung und bunten Neonblöcken.
11. **`memory.html`**: Gedächtnistraining mit umdrehbaren Kartenpaaren.
12. **`casino.html`**: Grand Casino Royale: Umfassendes 3-in-1 Casino-Erlebnis mit Einarmigem Bandit (Slots mit Zughebel, 3x3 Walzen, 5 Gewinnlinien, Wilds & progressivem Mega-Jackpot), Kessel-Roulette (europäisches Rad, Setzfeld, Dutzende, Kolonnen, Kugelphysik & Historie), klassischem 6-Deck Blackjack (Austeilen, Hit, Stand, Verdoppeln, Kartenschuh-Zähler & Basisstrategie-Berater) sowie zentralem High-Roller-Guthaben, VIP-Geldautomat und Web Audio Soundeffekten.
13. **`marble.html`**: 3D Physikspiel basierend auf Three.js mit Murmel, Rampen und Juwelen.
14. **`maze.html`**: Prozedurales Labyrinth, reproduzierbar über Seed-Eingaben generiert.

---

## 🛠️ Workflow: Wie ein neues Spiel hinzugefügt wird

Wenn ein neues Spiel erstellt werden soll, sind genau diese 3 Schritte einzuhalten:

### Schritt 1: Neue HTML-Datei in `games/` anlegen
Erstelle `games/<spielname>.html` mit dem Standard-Kopfbereich:

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>Mein Spielname</title>
<link rel="stylesheet" href="../style.css">
<link rel="icon" type="image/x-icon" href="../src/favicon.ico">
<!-- Pflicht-Tracking-Skripte für alle HTML-Seiten -->
<script defer src="https://umami.lucius-website.xyz/script.js" data-website-id="9d0997fa-7e37-41fa-beb7-d5b67a386b57"></script>
<script defer src="https://umami.lucius-website.xyz/recorder.js" data-website-id="9d0997fa-7e37-41fa-beb7-d5b67a386b57"></script>
<style>
  /* Spielspezifische Stile */
</style>
</head>
<body>

<!-- Einheitlicher Zurück-Button -->
<a href="../index.html" class="back">← Arcade</a>

<main>
  <!-- Spielfeld / Canvas / UI -->
</main>

<script>
  // Spiellogik, Event-Listener, Web Audio
</script>
</body>
</html>
```

### Schritt 2: Verlinkung im Hub `index.html`
Öffne `index.html` und trage das neue Spiel in das `games`-Array ein:

```javascript
{ name: "Mein Spielname", emoji: "🎯", url: "games/spielname.html", desc: "Spannende Kurzbeschreibung des Spiels." },
```

### Schritt 3: Lokale Verifikation
* Stelle sicher, dass die Datei lokal ohne Serverfehler läuft.
* **Tracking-Check:** Prüfe, dass **beide Tracking-Skripte** (`script.js` und `recorder.js`) mit der Website-ID `9d0997fa-7e37-41fa-beb7-d5b67a386b57` im `<head>` enthalten sind.
* Prüfe, dass die `../style.css` korrekt eingebunden ist und der Zurück-Button funktioniert.
* **Niemals GitHub-Aktionen oder Git-Push durchführen!**
