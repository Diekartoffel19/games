# 🕹️ 3D-Games & 3D-Transformationsplan

Dieses Dokument enthält:
1. **🚀 Engineering-Blueprint:** Schritt-für-Schritt-Anleitung & Code-Vorlage für die Konvertierung / Neuentwicklung von Spielen in **Three.js 3D** (kompatibel mit dem Repository-Stack).
## 🧊 Bestehende 3D-Spiele (43 Spiele)
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

## 🧊 Bestehende 3D-Spiele (43 Spiele)

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
| 10 | 🏎️ **Stadium Rush (Polytrack 3D)** | [`games/stadiumrush.html`](games/stadiumrush.html) | `racing` | Three.js | 68 Strecken in 5 Saisons (Season 4: lange Endurance-Strecken, Season 5: Themen-Strecken), 3D-Rampen & Rampenkurven, Drift-Spuren, Ghost-Car, LAN-Multiplayer (Time Attack) |
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
| 43 | 🐝 **Pollenflug 3D** | [`games/pollenflug.html`](games/pollenflug.html) | `action` | Three.js | Honigbiene in 3rd-Person-Verfolgerkamera über einer sonnigen Hügelwiese (Biene mit separat schlagenden Flügeln, Wespe, Blume, Strohkorb & Riesenblatt in Blender modelliert, Vertex-Farben ohne Texturen): 150 Blumen in 10 Farbfeldern als InstancedMesh (Stiel/Blüte/Mitte, instanceColor) wachsen, blühen und welken; langsam landen sammelt Pollen (Ladung bremst, senkt Flughöhe & Decke, Pollenhöschen wachsen sichtbar), Abliefern am Korb → Honig + Großladungs-Bonus, Farb-Aufträge mit Bonus, Schwänzeltanz-Pfeil-Minispiel markiert das ergiebigste Feld mit goldener Lichtsäule & Minikarten-Ring; Wespen-KI (patrouillieren/jagen beladene Bienen/Wächterbienen verjagen sie) mit Stich & Pollenverlust, Spinnennetze zum Freihämmern, über die Karte ziehender Regenschauer (Tropfen drücken zu Boden, Schutz unter Riesenblättern), Sonnenlauf mit Abendrot, Kompass & Minikarte, Summ-Synth, Touch-Joystick |

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

## 🚫 Warum 55 Spiele bewusst in 2D bleiben (Entfernungs-Begründung)

Die restlichen 55 Spiele wurden aus der 3D-Kandidatenliste entfernt, da eine 3D-Konvertierung dem Gameplay schaden würde oder keinen Sinn ergibt:

1. **Reine Gitter- & Zahlenspiele (Grid Classics & Terminal Roguelikes):**
   - *2048, Tetris, Snake, Breakout, Doodle Jump, Frogger, Memory Match, HEAP//BREACH (`games/heapbreach.html`), Bubble Fusion (`games/bubblefusion.html`)*  
   *Begründung:* Präzise Eingaben im Millisekundentakt und Hex-/Bytecode-Matrizen erfordern maximale Übersicht ohne Kamera-Verdeckung, Tiefenunschärfe oder Perspektivverzerrung. 3D-Tetris oder 3D-Snake schaffen visuelle Hürden statt Spielspaß.
2. **Karten- & Deckbuilder-Systeme:**
   - *Spire of Cards, Backpack Gladiator, Grundriss (Raum-Drafting-Roguelike, `games/grundriss.html`)*  
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
8. **Top-Down-Schleichspiele mit Licht & Schatten:**
   - *Omas WLAN (`games/omaswlan.html`)*  
   *Begründung:* Das Spiel lebt von der Draufsicht: Handy-Licht und Taschenlampen-Kegel werden per 2D-Raycasting als Sichtlinien-Polygone in eine Dunkelheitsebene geschnitten, Lärmringe breiten sich sichtbar durch Wände aus. In 3D würden Decken und Wände genau diese Übersicht über Geräusche, Licht und Sichtlinien verdecken.
9. **2.5D-Pixel-Horden-Survival:**
   - *Wellenbrecher (`games/wellenbrecher.html`)*  
   *Begründung:* Das Spiel ist bewusst 2.5D statt echtem 3D: Pixel-Sprites werden nach Fußpunkt (Y) sortiert, Felsen und Ruinenmauern bestehen aus Deck- und Frontfläche, Gegner, Münzen und Projektile haben eine Höhe (z) mit Bodenschatten. So bleibt der knackige Pixel-Look erhalten, während Hunderte Gegner auf einer riesigen Insel flüssig laufen – eine echte 3D-Kamera würde die Übersicht über die Horden um den zentrierten Spieler zerstören.
