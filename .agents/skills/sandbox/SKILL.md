---
name: sandbox
description: >-
  Leitfaden, Spielmechaniken, Thermodynamik, Elektronik-Schaltkreise, EMP-Schockwellen,
  Neal.fun-Gravitations- & Kraftfeld-Physik sowie Alchemie-Architektur für "Pixel Alchemy: Sandbox Simulator" (games/sandbox.html).
---

# Pixel Alchemy: Sandbox Simulator (games/sandbox.html)

Ein hochentwickelter 2D-Partikel- & Pixel-Physik-Simulator im Stil von The Powder Toy, Sandspiel und Neal.fun mit über 110 realen und physischen Materialien, kontinuierlicher Thermodynamik, geschlossenen Stromkreisen, elektromagnetischen Impulsen (EMP), Kraftfeldern und interaktiven Alchemie-Entdeckungen.

---

## 🎨 Look & Feel & visuelle Identität

* **Farbpalette:** Tiefer Cyber-Labor-Hintergrund (`#07090e`), neon-leuchtende Schockwellen, farbcodierte thermische Strahlung, dynamische Spektral-Färbung bei Regenbogen-Sand und RGB-LEDs.
* **Pixel-Auflösung:** 260 × 175 Simulations-Grid (45.500 autarke Partikel-Zellen) mit 60 FPS ImageData Direct-Buffer-Rendering.
* **Canvas-Overlay-Effekte:** Konzentrische glühende EMP-Schockwellen-Ringe (`#06b6d4`), verästelte Hochspannungs-Tesla-Lichtbögen (`#c084fc`), ruler/line Preview und Kraftfeld-Pinsel.

---

## ⚡ Elektro- & Tech-Systeme

1. **Batterie (`E_BATTERY`, 🔋):**
   * Kontinuierliche Gleichstromquelle.
   * Speist elektrische Impulse (`E_SPARK`) in alle angrenzenden Leiter ein (Kupfer, Gold, Stahl, Salzwasser, Supraleiter, Tesla-Spulen, Schalter, LEDs).
2. **Interaktiver Schalter (`E_SWITCH`, 🎚️):**
   * Kann per Mausklick direkt zwischen AN (Grün / Leuchtend) und AUS (Dunkel / Rot) umgeschaltet werden.
   * **Cluster-Toggle (BFS-Flood-Fill):** Klick auf einen beliebigen Schalter-Pixel schaltet die gesamte zusammenhängende Schalter-Komponente simultan um.
   * Visuelle Indikatoren mit Metallic-Rahmen, LED-Status, Stromstoß-Aura und interaktivem Hover-Badge (`[AN ⏻]` / `[AUS ⭘]`).
   * Synthetisiertes mechanisches Relais-Klicken (`playSfx('switch')`).
3. **Drucktaster (`E_BUTTON`, 🔘):**
   * Taster mit transientem Stromimpuls: Schließt den Kreis für ca. 22 Frames (ca. 0,4s) und springt selbstständig zurück auf AUS.
   * Perfekt für getaktete Signale, EMP-Fernauslöser und Schuss-Impulse.
4. **Logik-Transistor (`E_TRANSISTOR`, 🔀):**
   * Elektronisches Halbleiter-Gate: Öffnet die Leitfähigkeit nur, wenn ein Steuersignal (Strom / Funke) am Gate anliegt.
   * Ermöglicht UND/ODER-Schaltungen, Logikgatter und bistabile Kippstufen.
5. **Tesla-Spule (`E_TESLA`, ⚡):**
   * Speichert Hochspannung und entlädt sich periodisch in gewaltigen, zuckenden Funken-Lichtbögen durch die Luft auf benachbarte Leiter oder geerdete Ziele (bis zu 18 Pixel Distanz).
4. **RGB-Neon-LED (`E_LED`, 💡):**
   * Diode, die bei fließendem Strom in brillanten, wechselnden Cyberpunk-Neonfarben erstrahlt.
5. **EMP-Impulsbombe (`E_EMP`, 💥):**
   * Zündet bei Stromkontakt, Hitze (>100°C) oder Mausklick.
   * Feuert eine massive, expandierende elektromagnetische Schockwelle ab.
   * Überlastet Leiter, schaltet Schalter um, entlädt Schaltkreise, bringt Neongas zum Leuchten, detoniert Sprengstoffe (C4, Nitro) und vernichtet Schädlinge.
6. **Supraleiter (`E_SUPERCOND`, 🧲):**
   * Null elektrischer Widerstand (spontane blitzschnelle Weiterleitung).
   * **Meißner-Ochsenfeld-Effekt:** Übt eine magnetische Levitation nach oben aus, sodass Metalle und Schüttgüter darüber in der Luft schweben.
7. **Solarzelle / Photosensor (`E_SOLAR`, ☀️):**
   * Wandelt Licht (Laserstrahlen, Flammen, Plasma, Blitze) in elektrische Energie um.

---

## 🪐 Kräfte & Neal.fun-Physik

1. **Schwarzes Loch (`E_BLACKHOLE`, 🪐):**
   * Starker gravitativer Sog: Zieht alle ungebundenen Partikel in einem weiten Umkreis in eine spiralförmige Akkretionsscheibe.
   * Partikel, die den Ereignishorizont überqueren, werden verschlungen und in winzige Hawking-Strahlungs-Funken umgewandelt.
2. **Kraftfeld-Repulsor (`E_REPULSOR`, 🛡️):**
   * Weißes Loch / Schutzschild-Generator: Stößt herabfallende Stoffe mit einer kontinuierlichen Druckwelle ab.
3. **Antigravitation (`E_ANTIGRAV`, 🛸):**
   * Zero-G Feld: Kehrt die Schwerkraft lokal im Kegel/Spalte darüber um; Partikel steigen schwerelos auf.
4. **Wind-Turbine (`E_FAN`, 💨):**
   * Erzeugt einen horizontalen Hochgeschwindigkeits-Windkanal, der Sand, Rauch, Dämpfe und Tropfen weit wegpustet.
5. **Flummi-Gel (`E_BOUNCE`, 🦘):**
   * Super-elastisches Trampolin: Sand, Steine und Flüssigkeiten prallen hochelastisch meterhoch ab.
6. **Antimaterie (`E_ANTIMATTER`, 🌌):**
   * Vernichtet normale Materie bei Berührung in einer blendenden Gamma-Blitz-Explosion (3500°C).
7. **Regenbogen-Sand (`E_RAINBOW`, 🌈):**
   * Hypnotischer Zaubersand wie bei Neal.fun: Rieselt seidenweich und durchläuft kontinuierlich das gesamte HSL-Farbspektrum.

---

## 🧰 Interaktive Werkzeuge & Pinsel

* **🧲 Gravitations-Sog (`attract`):** Maus gedrückt halten, um Partikel wie ein kosmischer Magnet zur Maus zu ziehen.
* **💨 Kraft-Stoß (`repel`):** Schleudert Partikel mit einer kinetischen Druckwelle vom Cursor weg.
* **🌪️ Strudel (`vortex`):** Versetzt Partikel im Pinselbereich in eine wirbelnde Rotation.
* **⚡ Gewitter-Blitz (`lightning`):** Klick erzeugt einen verästelten Blitzschlag vom Himmel zum Zielpunkt mit Donnerhall.
* **🔥 Aufheizen / ❄️ Abkühlen:** Direkte Thermodynamik-Manipulation.

---

## 🗺️ Neue Labor-Szenarien

1. **⚡ Tesla-Labor & Stromkreis:** Komplettes Kraftwerk mit Batterie, Schalter, LEDs, Tesla-Spule und Neon-Kammer.
2. **💥 EMP-Schockwelle & Reaktoren:** Elektronikanlage mit EMP-Kern, Neonröhren und C4-Ladungen.
3. **🪐 Schwarzes Loch & Orbital-Strudel:** Gravitations-Singularität im Zero-G-Modus mit rotierenden Partikel-Ringen.
4. **🦘 Flummi-Flipper & Antigrav:** Flipper-/Pachinko-Parcours mit Bouncing-Gel, Windkanal und Antigrav-Lift.

---

## 🔊 Web Audio Synthesizer

* `emp`: Sub-Bass Drop (140 Hz → 26 Hz) mit High-Pass gefiltertem elektrischem Entladungsknistern.
* `tesla`: Kräftige, modulierende Sägezahn-Lichtbogen-Impulse.
* `bounce`: Frequenzsweep (180 Hz → 540 Hz) für elastischen Trampolin-Effekt.
* `thunder`: Knackiger weißer Rausch-Kanal mit tiefem resonanten Nachhall.
