---
name: globle
description: >-
  Leitfaden, Spielmechaniken, Großkreis-Distanzberechnung (Haversine), Kompass-Peilung,
  hochauflösende NASA-Satellitenkarte und Architektur für "Globle Earth: World Country Guesser".
---

# Globle Earth: World Country Guesser — Game Guide & Architecture

Dieses Dokument beschreibt das Spielkonzept, die geographischen Berechnungen, die Karten-Projektion, das Audio-Design und die Code-Architektur von **Globle Earth** (`games/globle.html`).

---

## 🎯 Spielidee & Konzept

In **Globle Earth** müssen Spieler ein geheimes Land der Erde erraten. Nach jedem Tipp gibt das Spiel sofortiges Feedback:
1. **Exakte Großkreis-Distanz in Kilometern** zwischen den geographischen Mittelpunkten beider Länder (berechnet mit der sphärischen Haversine-Formel).
2. **Kompass-Peilrichtung & Pfeil** (z.B. ↗️ Nordost, ⬇️ Süd) vom getippten Land zum Zielland.
3. **Farb-Temperaturzone** von Eiskalt (blau) bis Kochend heiß (rot) und Treffer (grün).
4. **Interaktive Weltkarte & Playability-Engine**:
   - Echte hochauflösende **NASA Blue Marble Satelliten- und Meerestiefen-Aufnahme** (`src/world_map.jpg`) mit nahtlosem 360°-Horizont-Wrap.
   - Gestochen scharfe Vektorgrenzen aller 173 Länder-Polygone mit echter 2:1-Seitenverhältnis-Wahrung (keine Stauchung/Verzerrung).
   - **Reines Namens-Eingabe-Prinzip (Authentisches Globle)**: Tipps erfolgen ausschließlich über das Textfeld mit Autocomplete. Die Karte verrät vorab keine unbekannten Ländernamen oder Klick-Lösungen.
   - **Hover-Tooltip nur für getippte Länder**: Zeigt für bereits erratene Länder Distanz, Peilung und Hitze-Status an; unbekannte Länder bleiben geheim.
   - **Cursor-Locked Zooming**: Mausrad-Zoom zentriert exakt auf die Cursor-Position statt starr auf die Bildschirmmitte. Doppelklick zum Hineinzoomen.
   - **Kontinente-Schnellwahltasten**: 🌍 Welt, 🇪🇺 Europa, 🌏 Asien, 🌍 Afrika, 🌎 Nordamerika, 🌎 Südamerika, 🌊 Ozeanien.
   - **Theater-/Vollbildmodus (⛶)**: Vergrößert die Karte auf 78vh für ein immersives Erkundungserlebnis.
   - **Koordinaten-Anzeige & Gradnetz**: Äquator, Wendekreise, Polarkreise und Längenmeridiane im Radar- und Atlas-Modus mit Live-Koordinatenanzeige (z.B. `48.2° N, 16.3° E`).
   - Farbig leuchtende Länder-Polygone für alle bisherigen Tipps.
   - Marker-Pins mit Flaggen und Distanz-Badges für alle bisherigen Tipps.
   - Peilungs-Vektoren und animierte Radarwellen.

---

## 📐 Mathematische & Geographische Grundlagen

### 1. Haversine-Großkreis-Distanz
Die exakte Distanz $d$ zwischen zwei Punkten $(\varphi_1, \lambda_1)$ und $(\varphi_2, \lambda_2)$ auf der Erdoberfläche:

$$\Delta\varphi = \frac{(\varphi_2 - \varphi_1) \cdot \pi}{180}, \quad \Delta\lambda = \frac{(\lambda_2 - \lambda_1) \cdot \pi}{180}$$

$$a = \sin^2\left(\frac{\Delta\varphi}{2}\right) + \cos\left(\frac{\varphi_1 \cdot \pi}{180}\right) \cdot \cos\left(\frac{\varphi_2 \cdot \pi}{180}\right) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$c = 2 \cdot \text{atan2}(\sqrt{a}, \sqrt{1 - a}), \quad d = R \cdot c \quad (R = 6371 \text{ km})$$

### 2. Anfangspeilung (Initial Bearing)
Der Azimut-Winkel vom getippten Land zum Zielland:

$$y = \sin(\Delta\lambda) \cdot \cos(\varphi_2)$$
$$x = \cos(\varphi_1) \cdot \sin(\varphi_2) - \sin(\varphi_1) \cdot \cos(\varphi_2) \cdot \cos(\Delta\lambda)$$
$$\theta = (\text{atan2}(y, x) \cdot \frac{180}{\pi} + 360) \pmod{360}$$

### 3. Equirectangulare Kartenprojektion (Plate Carrée)
Die NASA Blue Marble Textur liegt im Standard-Verhältnis 2:1 vor. Longitude $\in [-180^\circ, +180^\circ]$ und Latitude $\in [-90^\circ, +90^\circ]$ werden linear abgebildet:

$$\text{normX} = \frac{\lambda + 180}{360}, \quad \text{normY} = \frac{90 - \varphi}{180}$$

Dadurch passen die Vektorgrenzen der Länder aus dem Natural Earth Datensatz auf den Pixel genau auf die NASA-Satellitentextur.

---

## 🎨 Hitze- & Farbskala

* **0 km:** 🟢 `GEFUNDEN` (`#10b981`)
* **< 600 km:** 🔴 `Kochend heiß` (`#ef4444`)
* **600 – 1.500 km:** 🟠 `Sehr warm` (`#f97316`)
* **1.500 – 3.500 km:** 🟡 `Warm` (`#eab308`)
* **3.500 – 7.000 km:** 🟢 `Lauwarm` (`#06b6d4`)
* **7.000 – 11.000 km:** 🔵 `Kühl` (`#3b82f6`)
* **> 11.000 km:** ❄️ `Eiskalt` (`#6366f1`)

---

## 🔊 Web Audio Synthese
* **Radar-Sonar Ping:** Modulierter Sinus-Oszillator mit Pitch-Shift nach oben, je geringer die Distanz.
* **Victory Fanfare:** Vierstimmiger C-Dur Dreiklang-Akkord (C5, E5, G5, C6) bei Erfolg.
* **Persistent Mute:** Stummschaltung wird in `localStorage` gemerkt.

---

## 📂 Dateien & Komponenten
* `games/globle.html`: Spielseite mit HTML5 Canvas, HUD und Logik.
* `src/world-data.js`: Kompiliertes Vektor-Atlas- und Länder-Paket (249 Länder, Topo-Polygone, Flaggen, Koordinaten).
* `src/world_map.jpg`: Hochauflösendes NASA Blue Marble Satellitenbild der Erde.
