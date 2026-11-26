# 🕹️ 3D-Games & 3D-Transformationsplan

Dieses Dokument enthält:
1. **🚀 Engineering-Blueprint:** Schritt-für-Schritt-Anleitung & Code-Vorlage für die Konvertierung / Neuentwicklung von Spielen in **Three.js 3D** (kompatibel mit dem Repository-Stack).
## 🧊 Bestehende 3D-Spiele (58 Spiele)
3. **⭐ Top 3D-Upgrade-Kandidaten (5 Spiele):** Die 2D-Spiele, bei denen ein 3D-Upgrade massiven spielerischen & visuellen Mehrwert liefert.
4. **🚫 Entfernte 2D-Titel & Begründung:** Warum 55 Minigames (wie *Tetris*, *2048*, *Spire*, *Pixel Alchemy*) bewusst in 2D bleiben und nicht portiert werden sollten.

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

## 🧊 Bestehende 3D-Spiele (58 Spiele)

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
| 10 | 🏎️ **Stadium Rush (Polytrack 3D)** | [`games/stadiumrush.html`](games/stadiumrush.html) | `racing` | Three.js | 80 Strecken in 6 Saisons (Season 4: lange Endurance-Strecken, Season 5+6: Themen-Strecken), 3D-Rampen & Rampenkurven, Drift-Spuren, Ghost-Car, Online-Multiplayer (Time Attack, P2P mit Server-Relais-Fallback) |
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
| 30 | 🌊 **Boot- & Wellen-Simulator 3D** | [`games/boatsim.html`](games/boatsim.html) | `sim` | Three.js | Gerstner-Wellen, eigene Auftriebs-Rigid-Body-Physik, 8 Schiffe, Monsterwelle, Sturm-Challenge, Bojen-Jagd, Verfolgerkamera |
| 31 | 🔦 **Nachtwache 3D: Mall Security** | [`games/securityguard.html`](games/securityguard.html) | `stealth` | Three.js | First-Person-Patrouille, Taschenlampen-Spotlight, 6 CCTV-Kameras mit Nachtsicht-Rendertarget, Einbrecher-KI mit Sichtlinie, Schaufensterpuppen-Phantom |
| 32 | 🧹 **WG Putzen 3D** | [`games/wg_putzen.html`](games/wg_putzen.html) | `action` | Three.js | First-Person-WG, Dreck als Raster-alphaMap per Raycast wegschrubben, Sauger-Sog für Krümel & teilende Staubmonster, Müll-Wurfphysik mit Korb-Bonus, verstopfte Abflüsse, Mitbewohner-KI |
| 33 | 🚅 **ICE-Lokführer 3D** | [`games/lokfuehrer.html`](games/lokfuehrer.html) | `racing` | Three.js | First-Person ICE-Führerstand, CatmullRom-Spline, Schienen/Schwellen/Oberleitung, Sifa-Schaltung, millimetergenaue Bahnsteighalte, Kaffee-Balance |
| 34 | ❄️ **Thermal Nomad 3D** | [games/thermal_nomad.html](games/thermal_nomad.html) | physics | Three.js + Godot 4.3 C# | Arktisches Thermoregulation-Survival: Exakte Euler-Differentialgleichungen (Tsurf, Tcore), Sonnen-Okklusion per Multi-Raycast, Reflektions-Spiegel, Thermo-Schilde, Aerosol-Nebel, gezogener Lastenschlitten & Heat Spire Trek |
| 35 | 🌝 **Mondputzer 3D** | [`games/mondputzer.html`](games/mondputzer.html) | `sim` | Three.js | First-Person-Kehrsimulation auf Kugel-Planeten (Quaternion-Tangentenbewegung, Pointer-Lock): Kehren nur bei gehaltener Maustaste mit Tempo-Bonus und begrenzter Stiel-Reichweite, Staub als 512×256-Kugelraster mit Displacement, Waben-Sektoren (Fibonacci-Gitter) mit Abschluss-Bonus, Behälter → Kapseln → Depot-Verkauf, 8 Werkzeuge von Zahnbürste bis Mega-Sauger, 10 Upgrades, Saugroboter-KI, Meteoriten, Helmlampe für die Nachtseite, 5 Monde + Endlosschleife, Spielstand im localStorage |
| 36 | 🚤 **Gischtjagd 3D** | [`games/gischtjagd.html`](games/gischtjagd.html) | `racing` | Three.js | Rennboot-Grand-Prix auf 3 Spline-Strecken, Wellen-Shader mit Streckenmaske, Arcade-Driftphysik mit Drift-Turbo, Nitro, Schanzen, Boost-Pads, Windschatten, 5 KI-Gegner mit Gummiband |
| 37 | 🧊 **Zauberwürfel 3D** | [`games/zauberwuerfel.html`](games/zauberwuerfel.html) | `puzzle` | Three.js | NxN-Würfel 2×2 bis 7×7, Schicht-Rotation per Pivot-Group mit Easing, Orbit-Kamera, Tastatur mit Ebenenwahl, Auto-Lösen über invertierte Zughistorie |
| 38 | 🦑 **Squid Survival 3D** | [`games/squidgame.html`](games/squidgame.html) | `action` | Three.js | Low-Poly-Survival-Show mit 5 Minispielen: Wächter-Roboter dreht den Kopf um 180° mit Scharfschützen-Lasern, Dalgona-Keks als CanvasTexture mit Nadel-Raycast & Feuerzeug, Tauziehen über dem Abgrund mit Sturz-Animation, Glasbrücke mit Splitter-Physik & NPC-Vorgängern, Schlamm-Finale im Regen (LineSegments-Regen, Blitze), Shader-Partikel |
| 39 | 🚀 **Raketenbau 3D** | [`games/raketenbau.html`](games/raketenbau.html) | `sim` | Three.js | Raketen-Werkstatt mit 37 Blender-modellierten Bauteilen und maßgeschneiderten SVG-Symbolen (Kapseln, Mondfähre, Kosmos-Sonde, Rettungsturm, Aerospitze, Hitzeschilde 1,25/2,5m, Tanks S–XXL inkl. Kryo-Kugeltank & 1,25→2,5m-Adapter, 11 Triebwerke inkl. Kolibri, Falke-Zwilling, Aerospike, Nuklear, Ionen, Vasimr-Plasma & Titan-V 5×-Cluster, 3 Feststoffbooster, Stufentrenner 1,25/2,5m, Leitwerk, Gitterflossen, Landebeine, Solar-/RCS-Modul, RTG-Isotopenbatterie, Fallschirm) inkl. Δv-/TWR-Analyse pro Stufe; Flug mit Mehrkörper-Orbitalmechanik zu 8 Himmelskörpern (Erde, Mond, Phobos, Venus, Mars, Jupiter mit Ringen, Europa, Titan), SOI-Wechsel, 5 Flugcomputer-Autopiloten (Orbit-Aufstieg mit Gravity-Turn & Max-Q, Zirkularisierung, Hohmann-Transfer, Suicide-Burn-Landung, Hover) + Auto-Staging, 3D-Weltraumbahnhof (Wasserturm, Kontrollturm, rotierendes Radar, Windsack, Flutlichter, Gebirge, Vogelschwarm, Polarlichter, 3D-Krater & Eistürme), Tageszeiten-Wahl, Zeitraffer bis ×2000, Sonnensystem-Kartenansicht mit Kegelschnitt-Bahn & Ap/Pe, 35 Missionen in 5 Kapiteln (inkl. Meisterprüfungen wie Grand Tour, Mond-/Mars-Rückkehr, Landung ohne Fallschirm) + Auftragsbörse mit 3 wiederholbaren, zufällig generierten Kundenaufträgen (Höhenmessung, Windkanal, Bauteil-Test, Low-Cost-Flug, Probenbergung, Weltraumtourist, Satelliten-Bahn, Vorbeiflug, Orbit-Kartierung, Bodenprobe) mit Geld & Forschungspunkten |
| 40 | 🎯 **Scharfschütze 3D** | [`games/scharfschuetze.html`](games/scharfschuetze.html) | `action` | Three.js | 3D-Scharfschützen-Tal vom Hochstand (75m–260m+): 11 Zieltypen (3D-Zielscheibe mit Ringen, artikulierter Läufer hinter 3D-Deckung, Gepanzert mit zerstörbarer Brustplatte & leuchtendem Visier-Weakspot, 3D-Drohne mit Rotoren, Explosiv-Fass mit 3D-Druckwelle, Zivilisten-Sperrziel, Gegen-Scharfschütze mit Zielfernrohr-Glitzern & Warnpfeilen, Geiselnehmer hinter Geisel, fliehende Zielperson, Deckungsschütze hinter Sandsäcken, Bonus-Ballon mit Magazin-Refill), 3D-Gewehr-Viewmodel mit Rückstoß, Kammerstängel-Animation & Hülsenauswurf, FFP-MIL-DOT-Zielfernrohr (4×–12×) mit Laser-Entfernungsmesser & Windage-Baum, 3D-Windfahnen, Atem-Schwanken, 7 Themen-Missionen (Tag, Industrie, Gebirge, Nacht mit Scheinwerfer, Dämmerungs-Dorf, Wüstenschlucht, Schneelager) mit je 2 Bonuszielen, Treffer-Distanz-Popups & Endlos-Schießstand |
| 41 | 🏗️ **Kranführer 3D** | [`games/kranfuehrer.html`](games/kranfuehrer.html) | `sim` | Three.js | Turmdrehkran mit selbstgerechneter 2-Achsen-Pendelphysik (Verlet + Seil-Constraint), Torsion langer Stahlträger um die Seilachse, Windböen ab Level 3 mit Windsack & HUD-Pfeil, AABB-Absetzen mit Einrast-Ghost, Schaden bei hartem Aufprall, laufende Bauarbeiter, 5 Level mit Containern, Trägern, Betonplatten & Dachkranz, Kabinenansicht, Touch-Doppelstick |
| 42 | 🦇 **Echolot 3D: Blinde Fledermaus** | [`games/echolot.html`](games/echolot.html) | `action` | Three.js | Komplett schwarze Höhle (418 m Rundkurs mit 3 Hallen, Engstellen, Tropfsteinen & Säulen, in Blender modelliert und in 16 Stücke geteilt): ShaderMaterial mit 4 gleichzeitigen Ping-Slots lässt Flächen & Quad-Kanten nur dort aufleuchten, wo die Schallwelle vorbeizieht, und nach 1,5 s verblassen; Halten = lauter Ping (mehr Reichweite, scheucht Motten auf, aber größerer Hörradius der Eule), Atem-Leiste, Echo-Ton mit Verzögerung & Tonhöhe nach Wandabstand, Eulen-KI (kreisen/lauschen/jagen/abziehen) entlang der Höhlen-Mittellinie mit Stereo-Flügelschlägen & glühenden Augen, 6-Strahl-Kollision + Sweep mit Betäubung, Motten-Kombos, Touch-Joystick |
| 43 | 🔐 **Tresorknacker 3D: Nacht in der Bank** | [`games/tresorknacker.html`](games/tresorknacker.html) | `action` | Three.js | First-Person-Einbruch (PointerLock + WASD) in eine nächtliche Bank aus Rastergrundriss (Direktion, Schalterhalle, Tresorgang, Tresorraum, Hinterhof): 3 Tresore mit Zahlenschloss (0–39), deren Klicks per Web Audio pro Zahl eigene Tonhöhe & Stereo-Position haben und auf der richtigen Zahl lauter/höher werden (pro Tresor subtiler, Fehlversuch klappert hörbar); Nahansicht der in Blender modellierten Drehscheibe, aufschwingende Tresortür; 3 Wachleute mit Wegpunkt-Patrouillen, SpotLight-Taschenlampe mit Schatten & sichtbarem Lichtkegel, Sicht-Akku (>0,6 s = Alarm), Hören nach Lärmradius (Ducken/Gehen/Rennen, durch Wände gedämpft) mit Nachsehen & Rückkehr; geduckt verdecken Schalter die Sicht; Laser-Gitter im Takt mit Vorwarn-Blinken; Bonusbeute, Uhr 01:00→06:00, Zeit- & Perfekt-Bonus, Touch-Joystick + Wisch-Blick. Upgrade-Shop: „Werkstatt“ mit dauerhafter Beute-Kasse (auch bei Fehlschlag) für Stethoskop, Leise Sohlen, Schnelle Schuhe, Früher Start, Laser-Brille (Countdown), Großer Sack und Rauchbomben (F) |
| 44 | 🎪 **Seiltänzer 3D** | [`games/seiltaenzer.html`](games/seiltaenzer.html) | `action` | Three.js | Hochseil-Balance zwischen Wolkenkratzern in der Abenddämmerung (Verfolgerkamera mit Blick 180 m in die Tiefe): Neigung als invertiertes Pendel, Gegensteuern durch Kippen der Balancierstange (A/D, Maus-X oder Handy-Neigung), schnelleres Gehen = mehr Wackeln; angekündigte Windböen mit Windlinien, Stereo-Rauschen & Richtungspfeil, seitliches Seil-Schwingen das zur Mitte hin wächst, Tauben landen auf der Stange (Leertaste schüttelt sie ab), ab Seil 4 schlaffes Seil, ab Seil 5 Regen; jedes Dach ist ein Checkpoint (3 Versuche), Punkte aus Strecke + Stil (Zeit in perfekter Balance), Balance-Bogen-Anzeige, Touch-Hälften + Gehen-Taste, Blender-Modelle (Läufer, Taube, 3 Dach-Varianten mit Wassertanks & Antennen); Upgrade-Shop: Trinkgeld pro Vorstellung (gesicherte Punkte voll, Rest halb), 7 dauerhafte Upgrades (Längere Stange, Gummisohlen, Windwarner, Taubenschreck, Extra-Versuch, Schnelle Füße, Stil-Trainer) + Sicherheitsnetz als Verbrauchsgut |
| 45 | 🐝 **Pollenflug 3D** | [`games/pollenflug.html`](games/pollenflug.html) | `action` | Three.js | Honigbiene in 3rd-Person-Verfolgerkamera über einer sonnigen Hügelwiese (Biene mit separat schlagenden Flügeln, Wespe, Blume, Strohkorb & Riesenblatt in Blender modelliert, Vertex-Farben ohne Texturen): 150 Blumen in 10 Farbfeldern als InstancedMesh (Stiel/Blüte/Mitte, instanceColor) wachsen, blühen und welken; langsam landen sammelt Pollen (Ladung bremst, senkt Flughöhe & Decke, Pollenhöschen wachsen sichtbar), Abliefern am Korb → Honig + Großladungs-Bonus, Farb-Aufträge mit Bonus, Schwänzeltanz-Pfeil-Minispiel markiert das ergiebigste Feld mit goldener Lichtsäule & Minikarten-Ring; Wespen-KI (patrouillieren/jagen beladene Bienen/Wächterbienen verjagen sie) mit Stich & Pollenverlust, Spinnennetze zum Freihämmern, über die Karte ziehender Regenschauer (Tropfen drücken zu Boden, Schutz unter Riesenblättern), Sonnenlauf mit Abendrot, Kompass & Minikarte, Summ-Synth, Touch-Joystick. Upgrade-Shop: Honiggläser (1 je 8 Honig) dauerhaft in 8 Upgrades investieren (Tempo, Tragekraft, Ladungslast, Sammelzeit, Wespe, Netze, Regen, Tageslänge) |
| 46 | 🎣 **Eisangler 3D** | [`games/eisangler.html`](games/eisangler.html) | `sim` | Three.js | Zugefrorener See im Morgengrauen bis zur Dämmerung (Tageslauf mit Himmels-Shader, wanderndem Sonnenstand & Schattenwurf, Schneefall): Third-Person-Angler (in Blender modelliert wie Eisbohrer, Rute, Ofenhütte, Kiefern & 4 Fischarten) läuft per WASD übers Eis; versteckte Eisdicke-Karte mit dünnen Stellen, die nur als klares, dunkles Eis zu erkennen sind – wer dort stillsteht, hört es knacken, sieht Risse wachsen und bricht ein; Leertaste halten bohrt ein Loch (Eisspäne, Dicke-Anzeige), Sonar (Q) zeigt wandernde Schwärme als Silhouetten; Biss mit tauchender Pose, Anschlag-Fenster, Drill mit Spannungsbalken (zu locker = Fisch weg, zu straff = Schnur reißt) und eigenen Kampfmustern je Art (Barsch-Stöße, Hecht-Fluchten, Zander-Dauerzug, unberechenbarer Gold-Saibling); Kälte-Leiste, Aufwärmen am Ofen, Fangliste & Gesamtgewicht als Highscore, Touch-Steuerung. Upgrade-Shop: Fang wird nach jedem Tag pro kg verkauft (Kassenbon), im Angelladen 7 dauerhafte Upgrades (Motorbohrer, Geflochtene Schnur, Sonar, Thermo-Parka, Lockköder, Eisdickenmesser, Schneller Anschlag), gespeichert in localStorage |
| 47 | 🎲 **Dominokette 3D** | [`games/dominokette.html`](games/dominokette.html) | `puzzle` | Three.js + cannon.js | Physik-Puzzle im gemütlichen Wohnzimmer (Sofa, Couchtisch, Teppich, Regal – alles in Blender modelliert): Dominosteine per Klick setzen oder als Kurve ziehen (automatischer Abstand, Ausrichtung entlang der Bahn, Stufen-Kanten-Check, Fortsetzen/Gabeln durch Ziehen ab einem Stein), Rechtsklick entfernt, Orbit-Kamera mit Zoom und Zwei-Finger-Touch; Start lässt einen Finger den ersten Stein anschubsen, danach echte Rigid-Body-Physik (cannon.js) mit Zeitlupe nahe den Zielen, Kamera folgt der Wellenfront und das Klacken wird mit dem Tempo der Kette höher; Ziele: Tischklingel läuten, Tasse vom Tisch stoßen, Aufziehauto die Rampe hinunter ins Ziel schicken; Bücherstapel & Treppe als Stufen, begrenzter Steinvorrat & Bauzeit, 8 Level mit je 3 Sternen (Ziel, Steine übrig, alle umgefallen), Fortschritt im localStorage; Upgrade-Shop: „Bastelladen“ mit Münzen (für neue Sterne, abnehmend für Wiederholungen) – Extra-Steine (Spar-Stern zählt weiter gegen den Grundvorrat), mehr Bauzeit, Ketten-Vorschau (unerreichte Steine rot, Ziele in Reichweite), Lineal mit 45°/15°-Raster, schnellerer Zeitraffer, Sparschwein und Skins Walnuss/Neon/Gold, gespeichert in `dominokette_save` |
| 48 | 🤿 **Tiefenrausch 3D** | [`games/tiefenrausch.html`](games/tiefenrausch.html) | `action` | Three.js | Tiefsee-Bergbau-Roguelite: kleines U-Boot (Blender: Rumpf, Turm, Glaskuppel, Lampen, drehender Propeller, zielender Bohrarm) taucht in einen pro Tauchgang neu gewürfelten, chunkweise erzeugten Graben (Rauschfunktion für Mitte & Wandradius, analytische Kollision, Chunks werden entsorgt); 7 Zonen von Kelpwald bis Der Schlund mit eigenem Nebel, Licht, Wandfarben, Drone-Musik und Erzen (10 Sorten von Kupfer bis Leerenkristall, Bohrer-Härtestufen, leuchtende Glücksadern); Scheinwerfer-Spotlicht mit Lichtkegel, Sonar-Ping als Shader-Welle auf allen Materialien + Radar, Meeresschnee, Lichtstrahlen; O₂, Hülle (Druckschaden unter der Nenntiefe mit Knarzen & Glasrissen), Akku; Bohr-Serien mit Bonus, Erzbrocken-Magnet; Kreaturen: Fischschwärme (Instancing), Quallen, Muränen aus Spalten, Anglerfisch mit Köder, der wie Erz aussieht, Riesenkalmar-Griff (Hämmern zum Abschütteln), Schattenaal, Leviathan-Boss; Harpune mit Zielhilfe, Treffer-Blitz & Rückstoß, Wasserbomben, Notboje, Bergbau-Drohnen; Ereignisse (Strömung, Steinschlag, Notsignal, Schatzkiste, Luftblasen); Station mit Werft (18 Upgrades, viele Stufen), Aufträgen, Logbuch (Arten scannen, Wrack-Logbuchseiten der Voss-Expedition), 25 Erfolgen; Tod = Fracht weg, Geld & Upgrades bleiben; Speicherstand `tiefenrausch_save`, Touch-Steuerung |
| 49 | 🌦️ **Wettermacher 3D** | [`games/wettermacher.html`](games/wettermacher.html) | `sim` | Three.js | Gott-Spiel ohne direkte Kontrolle: Der Spieler IST das Wetter über einer schwebenden Diorama-Insel (Orbit-Kamera, Tag/Nacht, 4 Jahreszeiten à 2,5 min, Meer mit Wellen-Shader & Wassersäulen-Schnitt). Taktile Kräfte: über dem Meer kreisen saugt Feuchtigkeit in eine Wolke (Dampfpartikel, Wolke wächst & dunkelt), Wolken greifen/schieben, Halten lässt regnen (zu viel → Überflutung mit Pfützen, zu wenig → Dürre), Sonne schnippt Wolken weg oder brennt einen Sonnenstrahl, Wisch-Böen biegen Bäume & Felder, drehen die Mühle, schieben Schiffe/Heuschrecken, Blitze aus dunklen Gewitterwolken (Donner mit Entfernungs-Verzögerung, Fehlblitze zünden Wald & Dächer); per Himmelsbaum Schnee, Regenbogen, Nebel, Tornado & Hagel. Feuchte-/Schneeraster färbt den Boden nass/trocken/weiß. Das Dorf (instanzierte Bewohner mit animierten Gliedmaßen) wächst selbstständig: Hütte→Fachwerkhaus→Gutshaus, Felder in 4 Wachstumsstufen, Zisterne, Festplatz, Windmühle, Hafen mit Fischerboot, Kornspeicher, Wettertempel, Leuchtturm; Bedürfnisse Nahrung/Wasser/Holz-Wärme/Zufriedenheit, Wünsche als 3D-Sprechblasen bringen Glauben. Gefahren: Heuschrecken, Piraten, Seeschlange, Waldbrand, Dürre, Herbststurm, Monsun, Vulkan, Sandsturm, Schneesturm & Sturmgeist-Boss. Himmelsbaum mit 26 Künsten in 5 Zweigen, 5 Inseln mit eigenem Klima & Ziel (Grüne Wiege, Glutpalme, Frostzahn, Sandkrone, Sturmhorn), Chronik mit 30 Einträgen, Pilgergaben, versionierter Spielstand. Alle Modelle per bpy/bmesh in Blender gebaut (4 Inselformen, Gebäude, Schiffe, Bäume, Seeschlange …), Web-Audio-Ambiente & Jahreszeiten-Musik |
| 50 | ⛳ **Orbit-Golf 3D** | [`games/orbitgolf.html`](games/orbitgolf.html) | `skill` | Three.js | Minigolf zwischen Low-Poly-Planeten mit echter Punktmassen-Gravitation (Substeps à 1/240 s): Ball rollt auf Kugeloberflächen mit Roll- und Stoßreibung, hebt oberhalb der Orbitalgeschwindigkeit ab, Orbit-Putts und Gravitationsschleudern. 5 Oberflächen (Gras, Eis, Gummi, Sand-Bunker, Fels), Sonne (verglüht) und Schwarzes Loch (Akkretionsscheiben-Shader, verschluckt), Wurmloch-Paar, Boost-Ring, kinematisch kreisender Mond und Doppelstern. Schleuder-Steuerung relativ zur Kamera im Tangentialraum, separat einstellbarer Abschusswinkel, 1,25-s-Flugbahnvorschau aus derselben Physik, Geisterspur des letzten Schlags, Kamera mit Parallel-Transport des Up-Vektors. 12 Löcher (Kurs-Par 35), Strafschläge, Scorecard, Kurs-Rekord |
| 51 | 🗼 **Leuchtturm 3D** | [`games/leuchtturm.html`](games/leuchtturm.html) | `sim` | Three.js | Leuchtturmwärter in der Sturmnacht, Kamera im gläsernen Laternenraum: SpotLight + additiver Lichtkegel per Maus-Raycast auf die Wasserebene oder A/D schwenken, Fokus breit (kurz, weit gefächert) bis eng (lang, schmal) per Mausrad/W/S/Pinch; unbeleuchtete Schiffe halten stur aufs Riff zu, angeleuchtet + Blinken (Klick/Leertaste) drehen sie ab. Dynamo entlädt sich bei Licht und Blinken, F/Button kurbelt; Möwen landen auf der Scheibe und verdecken die Sicht, Nebelhorn (H/Rechtsklick, Cooldown, eigener WebAudio-Klang) verscheucht sie. Ab Schicht 3 falsche Feuer der Strandräuber auf den Klippen (locken Schiffe, 1,5 s engen Strahl draufhalten) und Käpt’n Korn (zu lange angeleuchtet → fährt auf den Turm zu). CPU-Wellen auf PlaneGeometry mit Flat-Shading, Regen-Linien, Blitze mit Donner, Dämmerungs-Himmel am Schichtende, prozedurale rot-weiße Ziegel-CanvasTexture; 5 Schiffstypen (Fischkutter, Gummienten-Frachter mit Entenflut beim Wrack, Influencer-Speedboot, Butterfahrt-Dampfer mit 2 Blinkern, Käpt’n Korn), Punkte mit Kombo bis ×5 & Fernrettungs-Bonus, rotes Blinklicht + Hilferuf-Sprechblasen bei Kollisionskurs, Nebelhorn bremst alle Schiffe, Möwen-Kleckse auf der Scheibe; 5 Schichten mit steigendem Nebel, Tempo, Verkehr & Möwen, danach Endlos-Modus mit Punkte-Rekord |
| 52 | 🎭 **Schattenkunst 3D** | [`games/schattenkunst.html`](games/schattenkunst.html) | `puzzle` | Three.js | Schattenpuzzle im Künstleratelier: Haushaltsmüll aus gruppierten Primitiven (Klobürste, Brezel, Quietscheente, Wäscheklammer, Kleiderbügel, Pümpel, Banane) schwebt vor einem DirectionalLight mit Shadow-Map, der Schatten fällt als orthografische Projektion auf die Wand. Zielsilhouette wird aus der versteckten Lösungspose per OrthographicCamera entlang der Lichtachse in ein 96×96-WebGLRenderTarget gerendert (Layer + overrideMaterial) und als CanvasTexture-Umriss an die Wand gelegt; aktuelle Pose wird alle 150 ms gleich gerendert, per readRenderTargetPixels gelesen und per IoU verglichen. Lösungsposen sind so komponiert, dass der Schatten ein echtes Motiv zeigt (Ente, Schweinenase aus Brezel, Sektglas aus Pümpel + Brezel, Segelboot aus Bügel + Banane, Tannenbaum aus Klobürste + Bügeln; ab Werk 6 zweites Motiv auf der Seitenwand, z. B. Hase/Dampfer-Ente nach Wittgenstein). Masken mit 1-px-Dilatation (dünner Draht verzeiht Versatz), symmetriebewusste Einrast-Hilfe ab 95 % (Drehsymmetrie von Klobürste/Pümpel, z-Spiegelung, austauschbare Gleichteile). Live-Deckungsbalken mit Wärmer/Kälter-Ton, Enthüllung mit gefüllter Silhouette, Konfetti, Applaus & Kritiker-Sprechblase, Tipp-Geisterbild (−1 Stern), Rückgängig, geführter Einstieg in Werk 1; Mausrad-Tiefe nur mit Seitenlicht. Steuerung per WASDQE/Maus-Trackball/Touch, 10 Werke mit Sternen nach Zeit, Fehlversuchen & Tipps, Meisterprüfung als Endlosmodus auf Zeit |
| 53 | 📝 **Spick-Alarm 3D: Quanten-BWL** | [`games/spickalarm.html`](games/spickalarm.html) | `stealth` | Three.js | First-Person-Klausur-Stealth im Low-Poly-Hörsaal: sitzend umsehen (Pointer-Lock, begrenzter Blickwinkel), Spick-Quellen (Spicker im Mäppchen mit Klappdeckel, Kevins Blatt, Altklausur-Reste an der Tafel) werden per Zoom-Halten schrittweise scharf (CanvasTexture mit Unschärfe-Filter & Buchstaben-Enthüllung); Verdachts-Meter aus Sichtkegel + Raycast-Sichtlinie (Mitstudierende verdecken), schneller bei Zoom & Nähe. Prof. Knurr läuft auf einem Ring-Pfad um die Bänke: Tafel-Phasen (sicher), Rundumblick, Laserpointer auf Reihen, plötzliches Umdrehen mit Husten-Vorwarnung, Schritt-Sounds nach Entfernung. Radiergummi an die Heizung lenkt ab, Papierflieger fangen verrät Antworten, Assistentin ab Klausur 4, Petze Pascal in Klausur 5 (Zettel zuschnippen, damit Knurr ihn rauswirft). Klausurblatt per Raycast-UV ankreuzen, Notenschlüssel 1,0–5,0, Bestnote je Klausur in `spickalarm_grades` |
| 54 | 🛋️ **Umzugs-Chaos 3D: Die Altbau-Treppe** | [`games/umzug.html`](games/umzug.html) | `physics` | Three.js | Sperrige Möbel (Billy-Regal, Ektorp-Sofa, Waschmaschine ohne Transportsicherung, Omas Kleiderschrank, Klavier) durch ein enges U-Treppenhaus im Altbau bis in den Umzugswagen tragen: Möbel als 6-DOF-Verbund aus Boxen, pro Substep werden Ecken/Kanten-Samples gegen OBB-Kollider (Podeste, Treppenläufe als schräge Platten, Geländer, Heizkörper, Nachbartüren) geprüft und in beide Richtungen aufgelöst – Positionskorrektur mit Drehmoment um den Kontaktpunkt, sodass Möbel verkanten und schwenken statt durchzuclippen; Treppen laufen die Träger automatisch mit (Höhe folgt der höchsten Stufe unter dem Grundriss). Steuerung: Ziehen/WASD tragen, Q/E drehen, R/F/Mausrad ankippen (hochkant um die Kurve), Rechtsklick-Orbit, Touch mit Zwei-Finger-Drehen; PIVOT!-Ruf des Kumpels (Sprachausgabe) dreht kurz schneller. Rammen kostet Mietkaution nach Aufprallgeschwindigkeit, Schleifen malt dauerhafte Kratzer in die Wand-CanvasTextures, Pflanzen/Fahrräder/Kinderwagen kippen um, Nachbarn öffnen Türen ins Treppenhaus. Cutaway-Kamera blendet Etagen darüber aus, gelbe Pfeile zeigen den Weg. 5 Umzüge mit 3 Sternen, Upgrade-Shop aus zurückgezahlter Kaution (Tragegurte, Umzugsdecken, Kumpel-Kaffee, Türstopper, Spachtelmasse), Speicherstand `umzug_save` |
| 55 | ❄️ **Winterdienst 3D: Räumpflicht ab 5:30** | [`games/winterdienst.html`](games/winterdienst.html) | `sim` | Three.js | Kommunaler Räumdienst im Morgengrauen (5:30 → 7:00, Himmel färbt sich zum Sonnenaufgang): massenerhaltendes Schnee-Heightfield (128×256-Raster als PlaneGeometry mit Float32-Höhen-, Eis- & Salzrastern, nur schmutzige Zeilen per updateRange hochgeladen, flatShading statt Normalen-Neuberechnung), Schild ±35° sammelt Schnee als Ladung und lässt ihn am nachlaufenden Ende zu wachsenden Wällen ausfließen (Schüttwinkel-Relaxation), Überladung bremst; Schnee auf Grünstreifen/Feld legal, auf Autos, Einfahrten & Hauseingängen = Nachbar im Bademantel mit Sprechblase und Bußgeld; unsichtbares Glatteis mit Rutsch-Physik, Salzstreuer taut es weg; 5 Bezirke bis zur steilen Bergstraße im Schneesturm, Sterne, Bauhof-Werkstatt (Hydraulik-Schild, Schneeketten, Salzstreuer XL, Schneefräse, LED-Scheinwerfer), Räumplan-Draufsicht mit Zonenfarben, Touch-Joystick |
| 56 | 🔩 **Altbau-Bohrer 3D: Leitung oder Stein?** | [`games/altbaubohrer.html`](games/altbaubohrer.html) | `puzzle` | Three.js | First-Person-Heimwerker-Puzzle wie Bombenentschärfen mit Bohrmaschine: 8 Aufträge (Wohnzimmer-Regal, Küchen-Hängeschrank, Spiegelschrank auf 70er-Fliesen, TV an Stahlbeton, Wolkenregal im Kinderzimmer, Pokal-Leiste an der Dachschräge, Riesen-TV an Rigips-Ständerwand, Omas Eichenschrank im Flur). Versteckte Rohre, 230-V-Leitungen, Pfusch-Kabel, Ständer, Sparren, Bewehrung & Nägel als CatmullRomCurve3-Splines in der Wandtiefe, Hohlkammern als Boxen; Klopfen löst eine ShaderMaterial-Welle aus, deren Farbe aus einer DataTexture der verborgenen Innereien moduliert wird (gelb hohl, blau Rohr, weiß massiv/Ständer), Leitungssucher piept nach Abstand (auch bei Nägeln/Stahl, Profi-Version unterscheidet), Hinweise nach DIN-18015-3-Installationszonen (Steckdosen, Schalter, Türen, Fenster, Revisionsklappe, Steigleitungen). Bohren mit Drehzahl-Bändern je Material, driftender Lot-Blase (Maus kontert, Schräglage lässt das Loch wandern), Hitze, Materialschichten Fliese→Putz→Ziegel→Hohlraum/Beton/Bewehrungs-Rückschlag, Querschnitt-Anzeige und Nah-Kamera; Wasserrohr = Partikel-Parabelstrahl + wachsende Pfütze + Daumen-drauf-Minispiel, Leitung = Funken, Licht aus, Sicherungskasten; Mittagsruhe 13–15 Uhr mit Besen-klopfender Nachbarin & Kaffeepause. Dübelwahl, Möbel hängt nach echten Lochpositionen (schief bei Höhenversatz), Belastungstest mit Büchern/Tellern/Pokalen bis zum Abriss mit Putzbrocken, dramatischer Röntgen-Wisch mit Beschriftung und „nur 0,4 cm neben der Leitung!“-Hinweisen; Kaution, 3 Sterne (Präzision, Schaden, Zeit), Baumarkt mit 7 Upgrades, Spielstand `altbaubohrer_save` |
| 57 | 🖥️ **Datacenter Tycoon 3D** | [`games/datacenter.html`](games/datacenter.html) | `sim` | Three.js | Rechenzentrums-Aufbausim auf 16×12-Raster (Startzone 8×6, per Hallen-Erweiterung vergrößerbar): Racks aufstellen, Server einbauen (Basic → Pro → GPU-Node), Switches, PDUs und Klimageräte platzieren und alles selbst verkabeln – Stromkabel Gerät → PDU → Hauptverteiler, Netzkabel Rack → Switch → Uplink-Router, als 3D-Tubes rechtwinklig in Kabeltrassen über den Racks verlegt. Simulation: PDU- und Hausanschluss-Lastgrenzen (Sicherung fliegt), Switch-Port-Limits, Bandbreiten-Baum per BFS (Kupfer 10 / Glasfaser 40 Gbit/s pro Kabel, Uplink-Limit), Wärme mit thermischer Trägheit und Notabschaltung ab 60 °C, Klimageräte verteilen Kühlleistung im Radius. Status-Icons und LED-Flackern an jedem Gerät, Wärmekarte, Events (DDoS, Stromausfall, Hitzewelle) mit USV/DDoS-Schutz-Upgrades, 6 Meilensteine bis Hyperscaler, Speicherstand `datacenter_save`, Selbsttest `?test=1`. Balancing-Konzept und Screenshot-Review mit agy (Gemini) |
| 58 | 🔨 **Hammerzeit 3D: Block-Abriss** | [`games/hammerzeit.html`](games/hammerzeit.html) | `action` | Three.js | First-Person-Zerstörung in einer prozeduralen 72×40×72-Voxel-Stadt: nur freiliegende Blöcke als eine InstancedMesh (Swap-Remove beim Abbauen), Voxel-DDA-Raycast für Ziel und Treffer, Schlag-Radius wächst mit Aufladung und Hammer-Stufe; Einsturz per begrenzter Flood-Fill-Suche nach Bodenkontakt, losgelöste Teile fallen als Trümmer-Instanzen und zerbröseln beim Aufprall; TNT-Kettenreaktionen mit Rückstoß, AABB-Spielerkollision mit Substeps, Flugmodus, Rekord `hammerzeit_best` |

*(Zusätzliches 3D-Entwicklertool: [`git/index.html`](git/index.html) – GitHistory 3D Commit-Visualizer mit Shadern).*

---

## ⭐ Kuratierte 3D-Upgrade-Kandidaten (5 Spiele)

Diese 5 Spiele sind aktuell in 2D umgesetzt, profitieren jedoch **enorm von einem Umstieg auf 3D** (bessere Physik, räumliche Immersion, First-Person-Perspektive oder echtes Ragdoll):

| # | Spiel | Aktuelle Datei | Warum 3D massiven Mehrwert bringt | Geplantes 3D-Konzept |
|---|-------|----------------|------------------------------------|----------------------|
| 1 | 🚇 **Subway Dodger (Schwarzfahrer)** | [`games/schwarzfahrer.html`](games/schwarzfahrer.html) | Waggon-Flucht & Sitze-Verstecken sind 3D-Raumprobleme | Durch 3D-U-Bahn-Waggons hechten, hinter Sitzen ducken, Kontrolleur umkurven |
| 2 | 🚀 **Furz-Rakete** | [`games/furzrakete.html`](games/furzrakete.html) | Raketenstart vom Klo zum Mond erfordert sphärischen Raum | 3D-Erde verlassen, Wolkenschichten durchstoßen, Mondkrater-Landung |
| 3 | 🗺️ **HEXFRONT: Tactical Warfare** | [`games/hexfront.html`](games/hexfront.html) | Tabletop-Spiele wirken als 3D-Diorama unvergleichlich | Tilt-Shift Miniatur-3D-Schlachtfeld, 3D-Hexfelder mit Höhenstufen |
| 4 | 🥙 **Döner Tycoon** | [`games/doener.html`](games/doener.html) | Fleisch am rotierenden Spieß schneiden ist 3D-Handwerk | First-Person-Theke: 3D-Spieß drehen, Streifen schneiden, Brot befüllen |
| 5 | 🍲 **Microwave Meltdown** | [`games/microwave.html`](games/microwave.html) | Aufblähende Marshmallows & Plasma funken räumlich | Blick durch 3D-Sicherheitsglas in Mikrowelle, rotierender 3D-Glasteller |

---

## 🚫 Warum 60 Spiele bewusst in 2D bleiben (Entfernungs-Begründung)

Die restlichen 60 Spiele wurden aus der 3D-Kandidatenliste entfernt, da eine 3D-Konvertierung dem Gameplay schaden würde oder keinen Sinn ergibt:

1. **Reine Gitter- & Zahlenspiele (Grid Classics & Terminal Roguelikes):**
   - *2048, Tetris, Snake, Breakout, Doodle Jump, Frogger, Memory Match, HEAP//BREACH (`games/heapbreach.html`), Bubble Fusion (`games/bubblefusion.html`)*  
   *Begründung:* Präzise Eingaben im Millisekundentakt und Hex-/Bytecode-Matrizen erfordern maximale Übersicht ohne Kamera-Verdeckung, Tiefenunschärfe oder Perspektivverzerrung. 3D-Tetris oder 3D-Snake schaffen visuelle Hürden statt Spielspaß.
2. **Karten- & Deckbuilder-Systeme:**
   - *Spire of Cards, Backpack Gladiator, Grundriss (Raum-Drafting-Roguelike, `games/grundriss.html`)*  
   *Begründung:* Inventarverwaltung und Kartenstapel benötigen saubere 2D-GUIs mit Tooltips und Hover-Zuständen. 3D-Karten verlangsamen das schnelle Lesen.
3. **Finanz-, Strategie- & Text-Simulationen:**
   - *Börsenhai: Trading-Terminal (`games/boersenhai.html`), Amtsschimmel: Behörden-Simulator (`games/amtsschimmel.html`), Wähl Mich! (Propaganda), El Patrón, Kiez Simulator*  
   *Begründung:* Diese Spiele basieren auf Diagrammen, Zeitreihen, Dialogbäumen, Formularen und Menüentscheidungen. Ein 3D-Canvas böte keinerlei spielmechanischen Nutzen.
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
8. **Top-Down-Schleichspiele mit Licht & Schatten:**
   - *Omas WLAN (`games/omaswlan.html`)*  
   *Begründung:* Das Spiel lebt von der Draufsicht: Handy-Licht und Taschenlampen-Kegel werden per 2D-Raycasting als Sichtlinien-Polygone in eine Dunkelheitsebene geschnitten, Lärmringe breiten sich sichtbar durch Wände aus. In 3D würden Decken und Wände genau diese Übersicht über Geräusche, Licht und Sichtlinien verdecken.
9. **2.5D-Pixel-Horden-Survival:**
   - *Wellenbrecher (`games/wellenbrecher.html`)*  
   *Begründung:* Das Spiel ist bewusst 2.5D statt echtem 3D: Pixel-Sprites werden nach Fußpunkt (Y) sortiert, Felsen und Ruinenmauern bestehen aus Deck- und Frontfläche, Gegner, Münzen und Projektile haben eine Höhe (z) mit Bodenschatten. So bleibt der knackige Pixel-Look erhalten, während Hunderte Gegner auf einer riesigen Insel flüssig laufen – eine echte 3D-Kamera würde die Übersicht über die Horden um den zentrierten Spieler zerstören.

10. **2.5D-Stoff-Physik-Wurfspiel:**
   - *Liegen-Krieg: Handtuch um 6 Uhr (`games/liegenkrieg.html`)*  
   *Begründung:* Die Draufsicht ist die Spielmechanik: Man muss alle Liegen, die Laufwege der Frühaufsteher und den Sichtkegel des Bademeisters gleichzeitig überblicken. Die Höhe (z) steckt trotzdem in der Simulation: Jedes Handtuch ist ein 6×8-Massepunkt-Netz (PBD) mit Luftwiderstand, Wind, Kollision mit Liegen, Schirmen und Palmen, wird mit leichter Kamera-Perspektive und Sonnenschatten gezeichnet und braucht deshalb kein Three.js.

11. **2.5D-Grill-Simulation mit Hitzefeld:**
   - *Grillmeister: Nachbarschafts-BBQ (`games/grillmeister.html`)*  
   *Begründung:* Die schräge Draufsicht auf den Rost ist die Spielmechanik: Glut-Verteilung, Hitzezonen, Stichflammen, Grillgut und alle Gäste müssen gleichzeitig im Blick bleiben, und Ziehen/Antippen/Wenden funktioniert per Maus und Touch ohne Kamerasteuerung. Das Hitzefeld (Gauß-Summe über verschiebbare Kohlen) und die Garstufe je Seite werden in 2D-Rostkoordinaten simuliert; eine 3D-Kamera brächte nur Verdeckung.

12. **Top-Down-Seilphysik-Simulation:**
   - *Gassi-Chaos: Hundesitter-Simulator (`games/gassichaos.html`)*  
   *Begründung:* Der Witz entsteht aus der Draufsicht: Bis zu sechs Verlet-Leinen wickeln sich sichtbar um Laternen, Bäume und Passanten und kreuzen sich zu Knoten – das muss man auf einen Blick überblicken, um rechtzeitig zurückzulaufen oder zu entwirren. Eine 3D-Kamera würde Leinen, Hunde und Hindernisse gegenseitig verdecken, und die Wicklungs-Erkennung (Umlaufwinkel um Hindernisse) ist ohnehin eine reine 2D-Rechnung.

13. **Seitenansicht-Physik-Rennen im Block-Stil:**
   - *Schrottkiste: Block-Rallye (`games/schrottkiste.html`)*  
   *Begründung:* Das Spiel lebt von der reinen Seitenansicht: Rampen, Loopings, Wippen und Abrissbirnen sind 2D-Starrkörper-Physik (Matter.js), und die einzige Steuerung – Gas und Rückwärts, in der Luft zum Kippen – setzt voraus, dass man Neigung und Gelände auf einen Blick sieht. Eine 3D-Kamera würde die Landewinkel verschleiern und den Block-Look zerstören.

14. **Technische Zerspanungs-Simulation (Dreh- & Fräs-Werkstatt):**
   - *Dreh- & Fräs-Werkstatt: Zerspanungs-Simulator (`games/drehbank.html`)*  
   *Begründung:* Die Mechanik ist die technische Zeichnung: Das rotationssymmetrische Werkstück wird als Radius-pro-Station-Profil im Querschnitt simuliert, Ist-Kontur gegen gestrichelte Soll-Kontur mit Mikrometer-Maßanzeige verglichen, und Zustelltiefe, Toleranzband und Untermaß müssen auf einen Blick ablesbar sein. Genau diese Maßgenauigkeit lebt von der verzerrungsfreien 2D-Seitenansicht; eine 3D-Kamera mit Perspektive und Tiefenunschärfe würde das Ablesen von Ø-Maßen und Toleranzen unmöglich machen.
