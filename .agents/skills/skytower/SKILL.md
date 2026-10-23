---
name: skytower
description: >-
  Leitfaden, Spielmechaniken, 3D-Physik-Schnitt-System, Audio-Synthese und Architektur für "Sky Tower 3D: Stack Master".
---

# Sky Tower 3D: Stack Master — Dokumentation & Game Guide

Dieses Dokument beschreibt das 3D-Turmbau-Spiel **Sky Tower 3D: Stack Master** (`games/skytower.html`).

---

## 🎯 Spielkonzept & Kernmechanik

* **Genre:** 3D Timing-Arcade / Isometric Tower Stacker.
* **Ziel:** Baue den höchsten Wolkenkratzer der Menschheit, indem du im perfekten Moment die Maus klickst, auf den Bildschirm tippst oder die Leertaste drückst.
* **Kernmechanik:**
  * Ein neuer Stein fährt gleichmäßig auf einer Achse hin und her.
  * Bei jedem Klick/Tastendruck stoppt der Stein sofort auf dem Turm.
  * **Präzisions-Schnitt (Slicing):** Jeder Überhang, der über den vorherigen Stein hinausragt, wird messerscharf abgeschnitten und stürzt als eigenständiges 3D-Physik-Objekt taumelnd und rotierend in die Tiefe!
  * **"PERFECT!" Snap & Combo-Streak:** Trifft der Spieler den Block mit hoher Präzision (< 0.25 Einheiten Versatz), rastet der Stein perfekt ein, ohne an Fläche zu verlieren.
  * **Pentatonische Klang-Kaskade:** Aufeinanderfolgende Perfect-Treffer erklingen als aufsteigende pentatonische Tonleiter im Web Audio Synthesizer.
  * **Block-Regeneration:** Ab einer 5er-Perfect-Serie wächst der Stein schrittweise wieder an (Combo-Belohnung).
  * **Achsenwechsel:** Der Stein wechselt bei jeder Etage abwechselnd zwischen X-Achse (links-rechts) und Z-Achse (vorne-hinten).

---

## 🕹️ Steuerung

* **Desktop:**
  * **Mausklick (links):** Stein platzieren
  * **Leertaste / Space:** Stein platzieren
  * **Enter:** Stein platzieren / Nach Game Over Neustart
  * **R:** Schnell-Neustart (Restart)
  * **M:** Sound stummschalten / aktivieren
* **Mobile / Touchscreen:**
  * **Tippen überall auf den Bildschirm:** Stein platzieren
  * **Touch-Button:** Responsive Tap-Buttons

---

## 🌌 Atmosphärischer Aufstieg & Höhen-Meilensteine

Während der Turm in den Himmel wächst, passt sich die Spielwelt dynamisch der erreichten Höhe an:
* **0 – 15 Etagen (Sunset Metropolis):** Warmer Sonnenuntergang, leuchtende Stadtsilhouette im Tal.
* **16 – 35 Etagen (Cloud Kingdom):** Schweben durch dichte 3D-Wolkenfetzen, fliegende Ballons & Vögel.
* **36 – 60 Etagen (Aurora Stratosphere):** Übergang ins tiefe Violett-Blau mit tanzenden Polarlichtern.
* **61 – 90 Etagen (Cosmic Orbit):** Erdumlaufbahn, schwebende Satelliten, glitzernde Sterne & Sternschnuppen.
* **91+ Etagen (Deep Space):** Kosmischer Nebel, glühende Gaswolken und das weite Universum.

### Echte Höhenvergleiche beim Game Over:
* **10 Etagen (~30 m):** Pariser Altbau
* **20 Etagen (~56 m):** Schiefer Turm von Pisa
* **35 Etagen (~96 m):** Big Ben (London)
* **50 Etagen (~157 m):** Kölner Dom
* **75 Etagen (~330 m):** Eiffelturm (Paris)
* **100 Etagen (~381 m):** Empire State Building (NYC)
* **150 Etagen (~828 m):** Burj Khalifa (Dubai)
* **200+ Etagen (Kármán-Grenze):** Weltraum-Höhe erreicht!

---

## 🎨 Grafik & Visuelle Identität

* **Darstellung:** Isometrische 3D-Orthogonal-Projektion mit sanfter Tiefenschärfe und weichen Schatten.
* **Farbverlauf:** Dynamisch berechneter HSL-Regenbogen-Farbverlauf pro Etage für ein hypnotisches, befriedigendes Farbspiel.
* **Partikel & FX:**
  * Glitzernde Funken und expandierende Schockwellen bei "PERFECT!"-Treffern.
  * Physikalischer Trümmer-Fall bei abgeschnittenen Kanten.
  * Kamera-Orbiting und dramatischer Zoom-Out bei Spielende zur Bewunderung des gesamten Bauwerks.

---

## 🔊 Web Audio Synthesizer

* **Harmonischer Block-Sound:** Sanfter Marimba/Glockenspiel-Ton bei jedem Platzierten Block.
* **Combo-Tonleiter:** Aufsteigende Frequenzen bei aufeinanderfolgenden Perfects (C4, D4, E4, G4, A4, C5, ...).
* **Physik-Fall-Geräusch:** Weicher "Whoosh"- und Klick-Sound, wenn Überhänge abbrechen.
* **Fanfare & Jubel:** Schöne Synthesizer-Harmonien bei neuen persönlichen Bestleistungen.
* **Ambient Soundscape:** Sanftes, unaufdringliches Hintergrund-Schimmern für maximale Konzentration.
