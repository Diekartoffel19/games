# Game Arcade & Web Tools

Eine umfassende, eigenständige Sammlung von **über 65 Browser-Games, interaktiven Web-Tools und Lern-Apps** — komplett clientseitig in HTML5, Canvas und modernem Vanilla JavaScript umgesetzt, ohne Build-Step, Bundler oder externe Backend-Abhängigkeiten.

🌐 **Live Hub:** [`https://rwpxe.com`](https://rwpxe.com)  
🎮 **Lokae Startseite:** [`index.html`](index.html)

---

## 🌟 Highlights & Kategorien

### 🎮 Spiele (Games)
Der Arcade-Hub bietet über 65 Minigames mit Highscores, Sound-Effekten (Web Audio API via [`src/arcade-core.js`](src/arcade-core.js)) und Touch-/Keyboard-Steuerung:

* **Physik & Ragdoll:**
  * [`games/orbitgolf.html`](games/orbitgolf.html) — *Orbit-Golf 3D (Minigolf zwischen kleinen Planeten: jeder Himmelskörper zieht per Newton-Gravitation am Ball – Bogenschläge, Orbit-Putts um den eigenen Planeten, Schleuder-Manöver an Schwarzem Loch und Sonne, Wurmloch, Boost-Ring, kreisender Mond und Doppelstern; 5 Oberflächen mit eigener Reibung und Sprungkraft (Gras, Eis, Gummi, Sand, Fels), Schleuder-Steuerung mit 1-Sekunden-Flugbahnvorschau und Geisterspur, 12 Löcher mit Par, Kurs-Rekord & Bestwert pro Loch)*
  * [games/thermal_nomad.html](games/thermal_nomad.html) — *Thermal Nomad 3D: Arctic Survival (Exakte Euler-Thermodynamik mit Tsurf & Tcore, Sonnen-Raycasting, Reflektions-Spiegeln, Thermoschilden, Aerosol-Nebel & physikalischem Lastenschlitten)*
  * [`games/ballistics.html`](games/ballistics.html) — *Panzer-Querschnitt: Slow-Mo Ballistik & Zerstörungs-Simulator (Mehrschicht-Panzerung, ERA, Keramik, Spalling & Röntgen-Kill-Cam)*
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
  * [`games/raketenbau.html`](games/raketenbau.html) — *Raketenbau 3D (Rakete aus 37 Blender-Bauteilen mit SVG-Bauteil-Symbolen bauen, 5 Autopilot-Programme inkl. Orbit-Aufstieg, Hohmann-Transfer & Suicide-Burn-Landung, 3D-Weltraumbahnhof mit Polarlichtern, Tageszeiten & 3D-Kratern, Mehrkörper-Orbitalphysik zu Mond, Mars, Venus, Jupiter, Europa & Titan, 35 Missionen in 5 Kapiteln & wiederholbare Auftragsbörse)*
  * [`games/tycoon.html`](games/tycoon.html) — *3D City Tycoon*
  * [`games/eisangler.html`](games/eisangler.html) — *Eisangler 3D (Eisangeln auf dem zugefrorenen See vom Morgengrauen bis zur Dämmerung: Löcher bohren, Schwärme per Sonar finden, Drill-Minispiel mit Spannungsbalken, 4 Fischarten inkl. seltenem Gold-Saibling, verstecktes dünnes Eis mit wachsenden Rissen, Kälte-Leiste & Ofenhütte, Blender-Modelle; Upgrade-Shop: Fang für € verkaufen, 7 dauerhafte Upgrades im Angelladen)*
  * [`games/leuchtturm.html`](games/leuchtturm.html) — *Leuchtturm 3D (Sturmnacht im Laternenraum: Lichtkegel über die See schwenken, Schiffe anleuchten und anblinken, damit sie vom Riff abdrehen; Fokus breit/eng, Dynamo kurbeln, Möwen auf der Scheibe per Nebelhorn verscheuchen, falsche Feuer der Strandräuber löschen, Käpt’n Korn nur kurz anleuchten; 5 Schichten bis zum Morgengrauen + Endlos-Modus)*
  * [`games/wettermacher.html`](games/wettermacher.html) — *Wettermacher 3D (Du bist das Wetter über einer Low-Poly-Insel: Wolken durch Kreisen übers Meer sammeln, Regen per Halten, Sonne schnippt Wolken weg oder brennt einen Sonnenstrahl, Wisch-Böen, Blitze aus Gewitterwolken; 9 Wetterkräfte inkl. Schnee, Regenbogen, Nebel & Tornado; ein Dorf wächst selbstständig von Hütten bis zu Tempel & Leuchtturm, Wünsche als Sprechblasen, Jahreszeiten mit Tag/Nacht, Heuschrecken, Piraten, Seeschlange, Waldbrand, Vulkan, Sandsturm & Sturmgeist-Boss; Himmelsbaum mit 26 Künsten, 5 Inseln mit eigenem Klima, Chronik, Spielstand in localStorage, Blender-Modelle)*
* **Action & Roguelike:**
  * [`games/wellenbrecher.html`](games/wellenbrecher.html) — *Wellenbrecher (2.5D-Pixel-Horden-Survival: Spieler immer in der Bildmitte auf einer prozedural generierten 200×200-Insel mit Ruinen, Truhen & Schreinen; 7 Auto-Waffen, 6 Fähigkeiten, 13 Werte-Upgrades, Wanderhändler zwischen den Wellen, Tag-Nacht-Wechsel & Bosse alle 5 Wellen)*
  * [`games/tiefenrausch.html`](games/tiefenrausch.html) — *Tiefenrausch 3D (Tiefsee-Bergbau-Roguelite: U-Boot in einen prozeduralen Graben mit 7 Zonen vom Kelpwald bis zum Schlund, Erz bohren, O₂/Hülle/Akku & Druck managen, Sonar-Ping, Quallen, Muränen, Anglerfisch, Riesenkalmar & Leviathan, Harpune & Wasserbomben, Station mit 18 Upgrades, Aufträgen, Logbuch, Wracks und Erfolgen, Blender-Modelle)*
  * [`games/pollenflug.html`](games/pollenflug.html) — *Pollenflug 3D (Honigbiene über einer sonnigen Three.js-Wiese: langsam auf Blüten in 4 Farben landen, Pollen-Ladung macht langsamer & schwerer, Aufträge am Bienenkorb, Schwänzeltanz-Minispiel markiert das beste Blumenfeld; Wespe, Spinnennetze & wandernder Regenschauer mit Blatt-Unterständen, 4-Minuten-Tag bis Sonnenuntergang, Blender-Modelle; Upgrade-Shop: Honiggläser für Flügelkraft, Pollenkörbchen, Kräftige Beine, Schnellsammler, Wachsamkeit, Spinnenschere, Regenhaube & Langer Tag)*
  * [`games/echolot.html`](games/echolot.html) — *Echolot 3D: Blinde Fledermaus (stockdunkle Three.js-Höhle, nur Sonar-Pings zeigen die Wände als verblassende Umrisse; Atem-Leiste, laut = mehr sehen aber die Eule hört dich, Motten nur sichtbar wenn sie flattern, Blender-Modelle)*
  * [`games/tresorknacker.html`](games/tresorknacker.html) — *Tresorknacker 3D: Nacht in der Bank (First-Person-Banküberfall bei Nacht: 3 Zahlenschloss-Tresore per Gehör knacken – Stereo-Klick pro Zahl, lauter & höher auf der richtigen; Wachleute mit Taschenlampen-Kegel, Ducken & Rennen mit Lärm-Anzeige, Takt-Laser im Tresorgang, Flucht zum Wagen vor der Dämmerung, Blender-Modelle; Upgrade-Shop: Stethoskop, Leise Sohlen, Schnelle Schuhe, Früher Start, Laser-Brille, Großer Sack & Rauchbomben für die Beute-Kasse)*
  * [`games/seiltaenzer.html`](games/seiltaenzer.html) — *Seiltänzer 3D (Hochseil zwischen Wolkenkratzern in der Abenddämmerung: Neigung als invertiertes Pendel, Gegensteuern mit der Balancierstange, angekündigte Windböen, schwingendes Seil, Tauben auf der Stange, schlaffes Seil & Regen in späteren Spannweiten, Dächer als Checkpoints, Stilpunkte für perfekte Balance, Blender-Modelle, Upgrade-Shop mit Trinkgeld: Stange, Gummisohlen, Windwarner, Taubenschreck, Extra-Versuch, Schnelle Füße, Stil-Trainer, Sicherheitsnetz)*
  * [`games/scharfschuetze.html`](games/scharfschuetze.html) — *Scharfschütze 3D: Ziel-Einsatz (Three.js 3D-Scharfschützen-Schießstand: 11 Zieltypen inkl. Gepanzerten mit Visier-Weakspot, 3D-Drohnen, Explosiv-Fässern, Zivilisten, Gegen-Scharfschützen, Geiselnehmern, Zielpersonen, Deckungsschützen & Bonus-Ballons; FFP-MIL-DOT-Zielfernrohr 4x–12x, 3D-Wind & Kugel-Drop, 3D-Gewehr mit Repetier-Animation, 7 Missionen mit Bonuszielen & Endlos-Modus)*
  * [`games/omaswlan.html`](games/omaswlan.html) — *Omas WLAN (Top-Down-Schleich-Horror im Dunkeln: Handy-Licht mit Sichtlinien-Schatten, Lärm durch Wände & Etagen, knarzende Dielen, Physik-Krempel, Chihuahua-KI mit Leckerli-Ablenkung, Oma-KI mit Taschenlampe & Klo-Gängen, Router-Steck-Minispiel, 3 Nächte inkl. Gewitter)*
  * [`games/heapbreach.html`](games/heapbreach.html) — *HEAP//BREACH (Terminal Architecture Hacking Rogue-lite: Live-Bytecode-Manipulation im CPU-Heap, Pointer-Hijacking, 0xCC-Wall-Allokation & Register-Overflow-Bomben gegen Garbage Collectors, Watchdog Timers & OS Kernels)*
  * [`games/microwave.html`](games/microwave.html) — *Microwave Meltdown: Die Büro-Mikrowelle (High-Stakes Plasma & Kernschmelze-Timing)*
  * [`games/survivor.html`](games/survivor.html) — *Crypt Survivor: Rogue Dawn (Bullet-Heaven Roguelite)*
  * [`games/grundriss.html`](games/grundriss.html) — *Grundriss: Das gezeichnete Herrenhaus (Roguelike-Raum-Drafting, Schritte/Schlüssel/Edelsteine & Sigillen-Deduktion über mehrere Tage)*
  * [`games/spire.html`](games/spire.html) — *Spire of Cards (Deckbuilder)*
  * [`games/neondefense.html`](games/neondefense.html) — *Cyber Defense: Neon Grid (Sci-Fi Tower Defense)*
  * [`games/squidgame.html`](games/squidgame.html) — *Squid Survival 3D: Die 45.6 Mrd. Won Spiele (Three.js-Survival-Show: 5 Minispiele in Low-Poly-3D-Arenen – Rotes Licht mit Wächter-Roboter, Dalgona-Keks, Tauziehen über dem Abgrund, Glasbrücke mit Splitter-Physik, Finale im Regen)*
  * [`games/superhot.html`](games/superhot.html) — *SUPERHOT 2D (Time moves only when you move)*
  * [`games/buckshot.html`](games/buckshot.html) — *Buckshot Roulette*
* **Racing & 3D:**
  * [`games/gischtjagd.html`](games/gischtjagd.html) — *Gischtjagd 3D (Rennboot-Grand-Prix: Drift-Turbo, Nitro, Schanzen, 3 Strecken, 5 KI-Gegner)*
  * [`games/lokfuehrer.html`](games/lokfuehrer.html) — *ICE-Lokführer 3D: Bitte zurückbleiben! (Führerstand-Simulation, Spline-Gleise, Sifa, Bahnsteighalte & Verspätungen)*
  * [`games/stadiumrush.html`](games/stadiumrush.html) — *Stadium Rush (Polytrack & Trackmania 3D-Zeitfahren, 68 Strecken A01–P68 in 5 Saisons, LAN-Multiplayer)*
  * [`games/buerostuhl.html`](games/buerostuhl.html) — *Bürostuhl GP*
  * [`games/skytower.html`](games/skytower.html) — *Sky Tower 3D Stack Master*
  * [`games/kranfuehrer.html`](games/kranfuehrer.html) — *Kranführer 3D (Turmdrehkran: Pendeln abfangen, Bauteile präzise absetzen, Wind & Bauarbeiter, 5 Level)*
* **Klassiker & Puzzles:**
  * [`games/dominokette.html`](games/dominokette.html) — *Dominokette 3D (Wohnzimmer-Physikpuzzle mit cannon.js: Steine setzen oder als Kurve ziehen, Treppe & Bücher hoch, Finger-Schubs, Zeitlupen-Kamera an der Wellenfront; Klingel, Tasse & Aufziehauto als Ziele, 8 Level mit Sternen, Blender-Modelle; Upgrade-Shop „Bastelladen“ mit Münzen: Extra-Steine, Bauzeit, Ketten-Vorschau, Lineal, Turbo, Sparschwein & Stein-Skins)*
  * [`games/zauberwuerfel.html`](games/zauberwuerfel.html) — *Zauberwürfel 3D (Three.js, 2×2 bis 7×7, animierte Drehungen, Tastatursteuerung mit Ebenenwahl, Tastenhilfe, Timer & Auto-Lösen)*
  * [`games/bubblefusion.html`](games/bubblefusion.html) — *Bubble Fusion (Squishy 2048 im gezeichneten Sobosuba-Stil: verformbare Gelee-Blobs mit leichter Anziehungskraft aus der oberen Reihe in den Behälter schießen und gleiche Zahlen verschmelzen)*
  * Tetris, Snake, 2048, Suika Game, Flappy Bird, Doodle Jump, Breakout, Globle Earth u.v.m.

---

### 🛠️ Web Tools & Air-Gap Utilities
Nützliche Browser-Werkzeuge mit modernem Canvas-, Web Audio- und Sensor-Support:

* **[`audiodecoder/index.html`](audiodecoder/index.html)** — *SignalScope Live (Echtzeit Audio-Empfänger & Multi-Decoder)*: Empfängt Audio live über Mikrofon oder Loopback und dekodiert Morse-Code (CW), DTMF-Touch-Tones, AFSK Text-/Hex-Datenströme, Live-SSTV-Bilder und Frequenzen/Noten in Echtzeit mit Wasserfall-Spektrogramm.
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
├── index.html            # Haupt-Arcade-Hub mit Tabs (Spiele, Tools, Schule) & Suche
├── style.css             # Zentrales Stylesheet für Hub, Navigation & Responsive Grid
├── ideas.md              # Backlog & Notizen für neue Spiel-Ideen
├── src/
│   ├── arcade-core.js    # Globaler Sound-Synthesizer, Highscore-Storage & Pop-Effekte
│   └── favicon.ico       # Arcade-Favicon
├── games/                # Alle eigenständigen HTML5-Spiele (Englisch / Standard)
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
Der Hub unterstützt flüssiges Umschalten zwischen **Deutsch (DE)** und **Englisch (EN)** mit automatischer Speicherung in `localStorage`. Alle Spiele laufen standardmäßig auf Englisch.
