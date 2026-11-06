# 🕹️ 3D-Games & 3D-Transformationsplan

Dieses Dokument enthält:
1. **🚀 Engineering-Blueprint:** Schritt-für-Schritt-Anleitung & Code-Vorlage für die Konvertierung / Neuentwicklung von Spielen in **Three.js 3D** (kompatibel mit dem Repository-Stack).
2. **🧊 Bestehende 3D-Spiele (30 Spiele):** Alle im Repository bereits voll funktionsfähigen 3D-Titel.
3. **⭐ Top 3D-Upgrade-Kandidaten (8 Spiele):** Die 2D-Spiele, bei denen ein 3D-Upgrade massiven spielerischen & visuellen Mehrwert liefert.
4. **🚫 Entfernte 2D-Titel & Begründung:** Warum 53 Minigames (wie *Tetris*, *2048*, *Spire*, *Pixel Alchemy*) bewusst in 2D bleiben und nicht portiert werden sollten.

---

## 🚀 Blueprint: Wie man ein Web-Spiel 3D macht (Three.js Stack)

Alle 3D-Spiele in diesem Projekt laufen **ohne Build-Step**, direkt im Browser via CDN-Imports von [Three.js r128](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js) und dem internen Audio-Synthesizer [`src/arcade-core.js`](src/arcade-core.js).

### 1. Architektur-Schichten

```
┌────────────────────────────────────────────────────────┐
│  HTML5 / CSS 2D-HUD Overlay (Score, HP, Crosshair)     │
├────────────────────────────────────────────────────────┤
│  Three.js WebGLRenderer (Canvas 3D, Viewport)          │
│  ├─ Scene & Fog (Atmosphäre, Distanz-Clipping)         │
│  ├─ Lights (Hemisphere, Ambient, Directional + Shadow) │
│  ├─ Camera (PerspectiveCamera: Chase / First-Person)   │
│  └─ Meshes (Low-Poly Primitives mit flatShading)       │
├────────────────────────────────────────────────────────┤
│  Physik- & Kollisionsschicht                           │
│  ├─ Leicht: Three.js Raycaster + AABB BoundingBoxes    │
│  └─ Schwer: Cannon.js (RigidBody, Gravity, Trägheit)   │
├────────────────────────────────────────────────────────┤
│  Audio & Persistence: arcade-core.js (Web Audio Synth) │
└────────────────────────────────────────────────────────┘
```

### 2. Die 7 Transformations-Schritte

1. **HTML-Shell einrichten:**
   - Einbinden von `style.css`, `arcade-core.js` und `three.min.js` (optional `cannon.min.js`).
   - Ein `<canvas id="webgl-canvas">` über den gesamten Bildschirm spannen.
   - Ein HTML-Container `<div id="hud">` mit `pointer-events: none` darüberlegen.
2. **Kamera & Szene initialisieren:**
   - `THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)`.
   - `scene.fog = new THREE.FogExp2(0x0a0e17, 0.015)` für Tiefenwirkung und weiche Weitsicht.
3. **Beleuchtungs-Setup:**
   - `THREE.AmbientLight(0xffffff, 0.4)` für Grundausleuchtung.
   - `THREE.DirectionalLight(0xffffff, 0.8)` mit aktiviertem Schattenwurf (`castShadow = true`).
   - Schatten-Map aktivieren: `renderer.shadowMap.enabled = true`, `type = THREE.PCFSoftShadowMap`.
4. **Geometrien & Low-Poly Ästhetik (No-Asset-Workflow):**
   - Statt schwerer externer `.gltf`-Dateien werden Objekte prozedural aus Primitiven komponiert (`BoxGeometry`, `CylinderGeometry`, `SphereGeometry`, `ConeGeometry`).
   - Material: `THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.1, flatShading: true })`.
   - `flatShading: true` erzeugt den beliebten Retro-Low-Poly-Look ohne UV-Mapping.
5. **Kamerasteuerung implementieren:**
   - **Racer / Flieger (3rd-Person):** Kamera folgt dem Spieler per `lerp` mit gedämpftem Abstand und schaut auf den Spieler (`camera.lookAt(player.position)`).
   - **Ego-Perspektive (Horror / Shooter):** Maus-Look via PointerLock-API, Kamera ist Kind-Objekt oder direkt an den Spieler-Kopf gebunden.
   - **Isometrisch / Top-Down:** Fixer Blickwinkel (45° Neigung) von schräg oben mit Positions-Offset.
6. **Kollisionserkennung & Physik:**
   - *Option Einfach:* `THREE.Box3().setFromObject(mesh)` für AABB-Schnittmengen oder `THREE.Raycaster` nach unten für Bodenhöhe.
   - *Option Vollphysik:* Jedes visuelle `THREE.Mesh` erhält einen parallelen `CANNON.Body`; in der Render-Schleife werden Position und Rotation synchronisiert.
7. **Game Loop & Delta-Time:**
   - `const clock = new THREE.Clock();`
   - Im Loop: `const dt = Math.min(clock.getDelta(), 0.1);`
   - Alle Bewegungen mit `dt` multiplizieren, damit das Spiel bei 60 Hz, 120 Hz und 144 Hz exakt gleich schnell läuft.

---

### 3. Kopierbare 3D-Startervorlage (Minimal Template)

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>3D Game Template</title>
  <link rel="stylesheet" href="../style.css">
  <script src="../src/arcade-core.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    body { margin: 0; overflow: hidden; background: #0a0e17; font-family: sans-serif; }
    #hud { position: absolute; top: 16px; left: 16px; color: #fff; pointer-events: none; z-index: 10; font-size: 1.2rem; }
    #canvas-container { width: 100vw; height: 100vh; display: block; }
  </style>
</head>
<body>
  <div id="hud">Punkte: <span id="score">0</span></div>
  <div id="canvas-container"></div>

  <script>
    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.02);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 2. Beleuchtung
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 3. Boden & Spieler
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1f293d, roughness: 0.8, flatShading: true });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const playerGeo = new THREE.BoxGeometry(1, 1, 1);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, flatShading: true });
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 0.5;
    player.castShadow = true;
    scene.add(player);

    camera.position.set(0, 5, 8);
    camera.lookAt(player.position);

    // 4. Loop & Resize
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const dt = clock.getDelta();
      // Update Logik hier...
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>
```

---

## 🧊 Bestehende 3D-Spiele (30 Spiele)

Diese Spiele sind bereits vollumfänglich in **Three.js / WebGL** realisiert:

| # | Spiel | Datei | Kategorie | Engine & Besonderheiten |
|---|-------|-------|-----------|-------------------------|
| 1 | ✈️ **Paper Plane Glider 3D** | [`games/paperplane.html`](games/paperplane.html) | `skill` | Three.js | Thermik-Aufwinde, Gleitphysik im Zimmer |
| 2 | 🍉 **Melonen-Schießstand 3D** | [`games/melonenstand.html`](games/melonenstand.html) | `action` | Three.js | Drehbare Scheiben-Arena, Splitter-Partikel |
| 3 | 🅿️ **Valet Parking: Full Contact 3D** | [`games/valetparking.html`](games/valetparking.html) | `racing` | Three.js | Drift-Physik, VIP-Buchten, Fahrzeug-Rammen |
| 4 | 👔 **Extrem-Bügeln 3D** | [`games/extrembuegeln.html`](games/extrembuegeln.html) | `skill` | Three.js | Wingsuit-Flug über 3D-Landschaften mit Fallschirm |
| 5 | 🚀 **Hyperline AG 3D** | [`games/hyperline.html`](games/hyperline.html) | `racing` | Three.js | Anti-Gravity WipEout-Racer mit Airbrakes & Boosts |
| 6 | 📦 **Hover Courier 3D** | [`games/hovercourier.html`](games/hovercourier.html) | `racing` | Three.js | Cyberpunk-Lieferstadt, Schwebegleiter & Hitze |
| 7 | 🏝️ **Insel-Schmiede 3D** | [`games/terraform.html`](games/terraform.html) | `sim` | Three.js | Dynamisches Höhennetz (Deformable Mesh) & Wälder |
| 8 | ⛷️ **Kuh auf Ski 3D** | [`games/kuhski3d.html`](games/kuhski3d.html) | `racing` | Three.js | Endlose 3D-Alpenpiste, Schanzen & Muh-Saltos |
| 9 | 🦹 **Das stille Badezimmer 3D** | [`games/badezimmer.html`](games/badezimmer.html) | `stealth` | Three.js | First-Person Ego-Schleichen, Quietsch-Dielen |
| 10 | 🏎️ **Stadium Rush (Polytrack 3D)** | [`games/stadiumrush.html`](games/stadiumrush.html) | `racing` | Three.js | 24 Strecken, 3D-Rampen, Drift-Spuren, Ghost-Car |
| 11 | 🏝️ **Drift Isles** | [`games/driftisles.html`](games/driftisles.html) | `action` | Three.js | 3D-Voxel-Welt, Höhlen, Crafting, Tag/Nacht |
| 12 | 🏗️ **Sky Tower 3D: Stack Master** | [`games/skytower.html`](games/skytower.html) | `skill` | Three.js | 3D-Block-Stapeln mit Kantenabschnitt |
| 13 | 🏃‍♂️ **Mega Obby 3D: Sky Parkour** | [`games/obby.html`](games/obby.html) | `skill` | Three.js | 3D-Jump'n'Run mit 15 Plattform-Stages |
| 14 | 🌀 **Cursed Dropper 3D** | [`games/dropper.html`](games/dropper.html) | `skill` | Three.js | 3D-Freifall-Tunnel, Backrooms & Wasser-Landing |
| 15 | 🍉 **Suika Game 3D: Teller-Wurf** | [`games/suika3d.html`](games/suika3d.html) | `puzzle` | Three.js | Parabolische Flugbahn auf Porzellanteller, Fruchtberg-Balance & Tellerrand-Absturz |
| 16 | 🔮 **3D Marble Blast** | [`games/marble.html`](games/marble.html) | `physics` | Three.js + Cannon.js | Echte 3D-Rigid-Body-Murmelbahn & Booster |
| 17 | 🏙️ **3D City Tycoon** | [`games/tycoon.html`](games/tycoon.html) | `puzzle` | Three.js | Isometrische 3D-Stadt, Raketenstarts & Drohnen |
| 18 | 🛴 **Paris Protest 3D: Gen Z** | [`games/paris_protest.html`](games/paris_protest.html) | `racing` | Three.js | E-Scooter 3D-Fahrt durch Paris, Barrikaden |
| 19 | 💺 **Bürostuhl GP 3D** | [`games/buerostuhl.html`](games/buerostuhl.html) | `racing` | Three.js | Drehstuhl-Kart, CO₂-Boost, Drift, KI-Kollegen |
| 20 | ⚙️ **Stillstand 3D** | [`games/superhot.html`](games/superhot.html) | `action` | Three.js | First-Person, Zeit läuft nur bei Bewegung |
| 21 | ☠️ **Geisterkäpt'n 3D** | [`games/buckshot.html`](games/buckshot.html) | `action` | Three.js | Kajüten-Duell, 9 Items (Klau, Umpolen, Elixier), Bloom-Post-FX, Doppelt-oder-nichts |
| 22 | 🪜 **Office Yeet 3D** | [`games/stair_yeet.html`](games/stair_yeet.html) | `physics` | Three.js | Eigene Verlet-Ragdoll, Brüche, Atrium-Sturz |
| 23 | 🎯 **Panzer-Röntgen 3D** | [`games/ballistics.html`](games/ballistics.html) | `physics` | Three.js | Plattenneigung, Abpraller, Röntgen-Splitter |
| 24 | 🕯️ **Wachsnacht 3D** | [`games/fnaf.html`](games/fnaf.html) | `action` | Three.js | Echte 3D-CCTV-Kameras, Figuren nur unbeobachtet |
| 25 | 🛒 **Einkaufswagen-Rallye 3D** | [`games/einkaufswagen.html`](games/einkaufswagen.html) | `racing` | Three.js | Klemmendes Vorderrad, Dosen-Pyramiden, Einkaufsliste, Slow-Mo-Ragdoll-Crash, Pfand-Shop |
| 26 | 🪟 **Fensterputzer 9000 3D** | [`games/fensterputzer.html`](games/fensterputzer.html) | `physics` | Three.js | Zwei-Seil-Gondel mit Kipp-Physik, Canvas-Dreck per Raycast wegwischen, Tauben, Straßenschlucht |
| 27 | 🧳 **Koffer-Stapler 3D** | [`games/kofferstapler.html`](games/kofferstapler.html) | `physics` | Three.js + cannon-es | Rigid-Body-Gepäck im kinematischen Frachtraum, Tür-Linie, Turbulenz-Test |
| 28 | 🐑 **Cannon Sheep 3D** | [`games/cannon_sheep.html`](games/cannon_sheep.html) | `physics` | Three.js | Endlose Alpen-Chunks, Trampoline, Windmühlen-Flügel, Booster-Kanonen, Wollschirm, Goldklee-Shop |
| 29 | ⚔️ **Crypt Survivor 3D** | [`games/survivor.html`](games/survivor.html) | `action` | Three.js | Isometrische Gruft, InstancedMesh-Horden (600+), Spatial Hash, 7 Waffen, Lich-Bosse |
| 30 | 🌊 **Boot- & Wellen-Simulator 3D** | [`games/boatsim.html`](games/boatsim.html) | `sim` | Three.js | Gerstner-Wellen, eigene Auftriebs-Rigid-Body-Physik, 8 Schiffe, Monsterwelle, Sturm-Challenge |

*(Zusätzliches 3D-Entwicklertool: [`git/index.html`](git/index.html) – GitHistory 3D Commit-Visualizer mit Shadern).*

---

## ⭐ Kuratierte 3D-Upgrade-Kandidaten (8 Spiele)

Diese 8 Spiele sind aktuell in 2D umgesetzt, profitieren jedoch **enorm von einem Umstieg auf 3D** (bessere Physik, räumliche Immersion, First-Person-Perspektive oder echtes Ragdoll):

| # | Spiel | Aktuelle Datei | Warum 3D massiven Mehrwert bringt | Geplantes 3D-Konzept |
|---|-------|----------------|------------------------------------|----------------------|
| 1 | 🔦 **Nachtwache: Mall Security** | [`games/securityguard.html`](games/securityguard.html) | Taschenlampen-Horror & Sichtkegel leben von 3D-Räumen | First-Person-Patrouille mit volumetrischem Taschenlampenkegel in Mall |
| 2 | 🧹 **WG Putzen Chaos** | [`games/wg_putzen.html`](games/wg_putzen.html) | Reinigungs-Simulatoren (PowerWash) sind 3D-Kult | First-Person-Wohnungsputz: Pizzakartons greifen, Waschbecken schrubben |
| 3 | 🚇 **Subway Dodger (Schwarzfahrer)** | [`games/schwarzfahrer.html`](games/schwarzfahrer.html) | Waggon-Flucht & Sitze-Verstecken sind 3D-Raumprobleme | Durch 3D-U-Bahn-Waggons hechten, hinter Sitzen ducken, Kontrolleur umkurven |
| 4 | 🦑 **Squid Survival (Rotes Licht)** | [`games/squidgame.html`](games/squidgame.html) | Das Erkennen der drehenden Riesenpuppe verlangt Tiefe | 3D-Arena, Roboter-Puppe dreht Kopf um 180°, Glasbrücke mit Fall-Physik |
| 5 | 🚀 **Furz-Rakete** | [`games/furzrakete.html`](games/furzrakete.html) | Raketenstart vom Klo zum Mond erfordert sphärischen Raum | 3D-Erde verlassen, Wolkenschichten durchstoßen, Mondkrater-Landung |
| 6 | 🗺️ **HEXFRONT: Tactical Warfare** | [`games/hexfront.html`](games/hexfront.html) | Tabletop-Spiele wirken als 3D-Diorama unvergleichlich | Tilt-Shift Miniatur-3D-Schlachtfeld, 3D-Hexfelder mit Höhenstufen |
| 7 | 🥙 **Döner Tycoon** | [`games/doener.html`](games/doener.html) | Fleisch am rotierenden Spieß schneiden ist 3D-Handwerk | First-Person-Theke: 3D-Spieß drehen, Streifen schneiden, Brot befüllen |
| 8 | 🍲 **Microwave Meltdown** | [`games/microwave.html`](games/microwave.html) | Aufblähende Marshmallows & Plasma funken räumlich | Blick durch 3D-Sicherheitsglas in Mikrowelle, rotierender 3D-Glasteller |

---

## 🚫 Warum 53 Spiele bewusst in 2D bleiben (Entfernungs-Begründung)

Die restlichen 53 Spiele wurden aus der 3D-Kandidatenliste entfernt, da eine 3D-Konvertierung dem Gameplay schaden würde oder keinen Sinn ergibt:

1. **Reine Gitter- & Zahlenspiele (Grid Classics):**
   - *2048, Tetris, Snake, Breakout, Doodle Jump, Frogger, Memory Match*  
   *Begründung:* Präzise Eingaben im Millisekundentakt erfordern maximale Übersicht ohne Kamera-Verdeckung, Tiefenunschärfe oder Perspektivverzerrung. 3D-Tetris oder 3D-Snake schaffen visuelle Hürden statt Spielspaß.
2. **Karten- & Deckbuilder-Systeme:**
   - *Spire of Cards, Backpack Gladiator*  
   *Begründung:* Inventarverwaltung und Kartenstapel benötigen saubere 2D-GUIs mit Tooltips und Hover-Zuständen. 3D-Karten verlangsamen das schnelle Lesen.
3. **Finanz-, Strategie- & Text-Simulationen:**
   - *Wall Street Trader (Stocks), Wähl Mich! (Propaganda), El Patrón, Kiez Simulator*  
   *Begründung:* Diese Spiele basieren auf Diagrammen, Zeitreihen, Dialogbäumen und Menüentscheidungen. Ein 3D-Canvas böte keinerlei spielmechanischen Nutzen.
4. **Zelluläre Automaten & Pixel-Physik:**
   - *Pixel Alchemy (Sandbox), Game of Life*  
   *Begründung:* Partikelsimulationen mit fallendem Sand, Wasser und Feuer leben von der schnellen 2D-Zellmatrix. In 3D (Voxel-Physik) sinkt die Partikelanzahl von Millionen auf wenige Tausend bei extremem Rechenaufwand.
5. **Reine 2D-Geometrie- & Schnitt-Puzzles:**
   - *Pizza-Präzisionsschnitt, Spiegel-Zwillinge, Seed Maze, Zeitschleife, Echo-Dunkel*  
   *Begründung:* Mechaniken wie exaktes 50/50-Zerschneiden einer Fläche oder parallele Spiegelung auf X/Y-Achsen sind mathematisch an 2D-Flächen gebunden.
6. **2D-Physikbrücken & Seil-Simulationen:**
   - *Brückenbauer, Spaghetti-Brücken-Duell, Physik-Labor, Magnet-Puzzler*  
   *Begründung:* Fachwerk- und Seilstatik (Euler-Bernoulli-Balken, Zug/Druck) lässt sich in 2D didaktisch perfekt ablesen. 3D-Balkenbau macht die Konstruktionsbedienung am Bildschirm extrem hakelig.
7. **Kurzweilige Cartoon- & Reaktions-Microgames:**
   - *Mini-Wahnsinn, Omas Nachschlag, Katzen-Chaos, Tauben-Terror, Flappy Bird, Knet-Sumo, Anime Clicker, Bad Haircut, Stinkefuß*  
   *Begründung:* Der Charme dieser Spiele beruht auf spontanem WarioWare-Slapstick und handgezeichneten 2D-Vektor-/Pixel-Sprites.
