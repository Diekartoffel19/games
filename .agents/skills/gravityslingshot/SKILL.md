---
name: gravityslingshot
description: >-
  Leitfaden, Spielmechaniken, Newtonsche Gravitationsphysik (F = G*m1*m2/r^2), Velocity-Verlet-Integration,
  Doppler-Web-Audio-Synthese, Trajektorien-Prädiktor und Level-Architektur für "Gravity Slingshot Sniper: Orbital Trickshots".
---

# Gravity Slingshot Sniper: Orbital Trickshots — Dokumentation & Game Guide

Dieses Dokument beschreibt das minimalistische Physik-Puzzle **Gravity Slingshot Sniper: Orbital Trickshots** (`games/gravitysniper.html`).

---

## 🎯 Spielkonzept & Kernmechanik

* **Genre:** Minimalistisches 2D Orbital-Physik-Puzzle / Precision Gravity Slingshot.
* **Ziel:** Schieße mit einer stationären Ion-Kanone ein hochenergetisches Photon-Projektil quer durchs Sonnensystem ab, nutze die Anziehungskraft mehrerer massereicher Himmelskörper (Planeten, Sterne, Schwarze Löcher, Repulsoren, Wurmlöcher) und eliminiere das Ziel (Satelliten-Relay) in spektakulären Trickshots.
* **Kernphysik (Newtons universelles Gravitationsgesetz):**
  $$\vec{F} = G \cdot \frac{m_1 \cdot m_2}{r^2 + \epsilon^2} \cdot \hat{r}$$
  * Die Bewegungsgleichungen werden über einen **Velocity-Verlet-Integrator** mit 8–32 Sub-Steps pro Frame gelöst, um absolut ruckelfreie, deterministische und numerisch stabile Kepler- und Mehrkörperbahnen zu garantieren.
* **Trajektorien-Prädiktor (Forward Lookahead):**
  * Berechnet in Echtzeit 420 Zeitschritte in die Zukunft.
  * Animierte, vorwärts marschierende Neon-Dashes zeigen exakt die voraussichtliche Bahn, Periapsis-Punkte, Kollisionen (roter Gefahren-Marker) und Treffer (goldener Puls-Marker).
* **Doppler-Effekt & Neon-Trail:**
  * Das Projektil hinterlässt ein sanft abklingendes leuchtendes Plasmaband.
  * Bei hoher Beschleunigung am Periapsis-Punkt eines Schwerefeldes verschiebt sich die Farbe dynamisch von Cyan über Magenta bis ins heiße Rubinrot, begleitet von einem aufsteigenden Doppler-Ton im Synthesizer!

---

## 🎮 Steuerung & Speed-Einstellung

* **Maus & Touch:**
  * **Mausrad (Scrollrad):** Drehe das Mausrad überall auf dem Spielfeld oder über dem Speed-Slider, um die Abschussgeschwindigkeit feinfühlig anzupassen ($\pm 0.5$, mit gedrückter Shift-Taste ultra-fein $\pm 0.1$).
  * **Direkte Zahleneingabe:** Klicke direkt in das Zahlenfeld der Geschwindigkeit oder des Winkels und tippe deinen Wunschwert exakt ein.
  * **Direktes Slingshot-Aiming:** Klicke und ziehe an der Kanone wie an einer Steinschleuder. *Tipp:* Halte `Shift` oder Rechtsklick gedrückt, um nur den Winkel zu verändern und deine fein eingestellte Geschwindigkeit fixiert zu lassen!
  * **Präzisions-Dock:**
    * **Winkel-Steuerung:** $0.0^\circ$ bis $360.0^\circ$ mit $\pm 0.2^\circ$, $\pm 1^\circ$ und $\pm 5^\circ$ Nudge-Buttons sowie Direkteingabe.
    * **Speed-Steuerung:** $5.0$ bis $100.0$ mit $\pm 0.1$, $\pm 1$ und $\pm 5$ Feintuning-Buttons sowie Direkteingabe.
  * **Flug-Tempo & Zeitraffer / Zeitlupe:** Direktauswahl von $0.25\times$ (Super Slow-Mo), $0.5\times$ (Slow-Mo), $1\times$ (Normal), $2\times$ (Fast) und $4\times$ (Hyperspeed).
  * **⏸️ Pause:** Simulation einfrieren und fortsetzen.
  * **🚀 FIRE-Button:** Projektil abfeuern.
  * **↺ Reset-Button:** Sofortiger Rückruf des Projektils.
* **Tastatur-Shortcuts:**
  * **Leertaste (Space):** Projektil abfeuern (bzw. während des Fluges Simulation pausieren/fortsetzen).
  * **P:** Simulation pausieren / fortsetzen.
  * **R:** Projektil zurücksetzen.
  * **F:** Fluggeschwindigkeit durchschalten ($0.25\times \to 0.5\times \to 1\times \to 2\times \to 4\times$).
  * **Ziffern 1–5:** Flugtempo direkt anwählen ($1 = 0.25\times$, $2 = 0.5\times$, $3 = 1\times$, $4 = 2\times$, $5 = 4\times$).
  * **[ / ]:** Flugtempo schrittweise verlangsamen / beschleunigen.
  * **T:** Trajektorien-Vorschau an- und ausschalten.
  * **Pfeiltasten Links / Rechts:** Winkel um $\pm 1^\circ$ justieren (mit Shift: $\pm 0.2^\circ$, mit Strg/Alt: $\pm 5^\circ$).
  * **Pfeiltasten Oben / Unten:** Speed um $\pm 0.5$ justieren (mit Shift: $\pm 0.1$, mit Strg/Alt: $\pm 5.0$).

---

## 🪐 Himmelskörper & Raumzeit-Phänomene

1. **Terrestrische Planeten:** Feste Gesteinswelten mit blau/grüner Atmosphäre, erzeugen solide Gravitationssenken für klassische Slingshots.
2. **Gasriesen (Jovians):** Enorme Masse, dichte Streifenatmosphäre und schimmernde Ringe für kraftvolle High-Speed-Beschleunigung.
3. **Zwergsonnen / Sterne:** Lodernde Korona mit starker Anziehungskraft.
4. **Schwarze Löcher (Singularitäten):** Supermassive Kerne mit leuchtender Akkretionsscheibe und Ereignishorizont. Bei Berührung wird das Projektil verschlungen – enges Vorbeifliegen erzeugt den begehrten *Event Horizon Grazer*.
5. **Dunkle Energie Repulsoren (Weiße Löcher):** Negative Masse, stoßen Projektile mit umgekehrter $1/r^2$-Kraft ab.
6. **Wurmlöcher (Einstein-Rosen-Brücken):** Gepaarte Portale (Eingang/Ausgang). Das Projektil tritt mit identischer kinetischer Energie an neuer Position hervor.
7. **Satelliten-Relays (Ziele):** Rotierende Solarpaneele, blinkende Telemetrie-LEDs und konzentrische Sonar-Funkwellen. In späteren Sektoren bewegen sie sich auf orbitalen Bahnen!
8. **Stardust-Kristalle:** Optionale goldene Sammelobjekte in kniffligen Gravitationskorridoren für die 3-Sterne-Meisterschaft.

---

## 🏆 Orbital Trickshot System & Punkte

* **Gravitations-Slingshot (+500 Pkt):** Richtungsänderung um $>90^\circ$ im Nahfeld eines Himmelskörpers.
* **360° Voll-Orbit (+1.000 Pkt):** Vollständige $360^\circ$-Umrundung eines Himmelskörpers vor dem Treffer.
* **Figure-8 Trickshot (+1.500 Pkt):** Verketten zweier entgegengesetzter Kreisbahnen um zwei verschiedene Himmelskörper.
* **Event Horizon Grazer (+1.500 Pkt):** Vorbeiflug in unmittelbarer Nähe des Ereignishorizonts eines Schwarzen Lochs.
* **3-Sterne-Wertung:**
  * ⭐ **1 Stern:** Ziel erfolgreich eliminiert.
  * ⭐⭐ **2 Sterne:** Unter Par-Versuchen getroffen.
  * ⭐⭐⭐ **3 Sterne:** Mindestens 1 Orbital Trickshot ODER alle Stardust-Kristalle gesammelt!

---

## 🗺️ Galaktische Kampagne (24 Hand-crafted Levels)

* **Sektor I: Solar Nursery (Level 1–5):** Erste Newton-Kurven, Mond-Slingshots, Jupiter-Schwerkraft, Dreifach-Asteroiden und Sonnenschatten.
* **Sektor II: Binary Systems (Level 6–10):** Doppelstern-Tanz, Lagrange-Punkte, planetarer Flipper und enge Eklipsen-Passagen.
* **Sektor III: Singularity & Anomalies (Level 11–15):** Erstes Schwarzes Loch, weiße Repulsoren, Push-Pull-Kräfte und Wurmlöcher.
* **Sektor IV: Orbital Mastery (Level 16–20):** Der 360°-Voll-Loop, Grand Tour Zickzack, kreisende bewegliche Satelliten und Zwillingspulsare.
* **Sektor V: Galactic Core (Level 21–24):** Sagittarius Prime mit 4 Monden, Doppel-Wurmlöcher, kosmisches Spießrutenlaufen und das Grand Finale: *Omega Singularity*.

---

## 🧪 Orbital Sandbox & Random Mission Generator

* **Zufalls-Missionen:** Prozedural generierte Sonnensysteme mit zufälligen Gravitationsquellen und garantierten Flugkorridoren.
* **Orbit Lab (Sandbox):**
  * Eigene Sonnensysteme per Klick erstellen: Planeten, Gasriesen, Schwarze Löcher, Repulsoren, Portale und Ziele frei platzieren und austesten!
