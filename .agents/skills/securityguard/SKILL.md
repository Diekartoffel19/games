---
name: securityguard
description: >-
  Leitfaden, Spielmechaniken, Steuerung, Audio-Design und Architektur für "Nachtwache: Mall Security Guard Simulator".
---

# Nachtwache: Mall Security Guard Simulator — Dokumentation & Game Guide

Dieses Dokument beschreibt das Spiel **Nachtwache: Mall Security Guard Simulator** (`games/securityguard.html`).

---

## 🎯 Spielkonzept & Atmosphäre

* **Setting:** Nachtschicht (22:00 bis 06:00 Uhr) im geschlossenen Einkaufszentrum "Galaxy Mall".
* **Rolle:** Du bist Kevin, der Sicherheitswachmann von Wachdienst Alpha.
* **Dualer Gameplay-Loop:**
  1. **🖥️ CCTV-Überwachungszentrale (Kommando-Pult):** 6 CRT-Monitore mit Live-Kamerafeeds (Atrium, Juwelier, CyberTech, Food Court, Laderampe, Tresor/Generator). Auslösen von Magnetschlössern, Flutlicht, Megaphon-Durchsagen und Feuersprinklern.
  2. **🚶 Live-Patrouille (Flashlight Canvas Action):** Vor-Ort-Erkundung der finsteren Mall mit Raycast-Taschenlampe, Prüfen von RFID-Kontrollpunkten, Sichern von Türen, Beheben von Stromausfällen am Sicherungskasten und Fahren auf dem Segway.

---

## 🕹️ Steuerung

### PC / Desktop
* **W, A, S, D / Pfeiltasten:** Bewegen
* **Maus:** Zielen / Blickrichtung / Taschenlampenstrahl
* **Linksklick:** Ausgewähltes Ausrüstungswerkzeug einsetzen (Tasern, Festnehmen, Sprayen)
* **Shift (halten):** Sprinten (verbraucht Ausdauer)
* **Tab:** Nahtloser Wechsel zwischen CCTV-Pult und Patrouille
* **E:** Interagieren (RFID-Kontrollpunkt stempeln, Segway auf-/absteigen)
* **Space:** Segway-Klingel ("Ring ring!")
* **F:** Stroboskop-Blitz (blendet Verdächtige im Lichtkegel für 3 Sekunden)
* **1 - 4:** Schnellauswahl der Ausrüstung (1: Handschellen, 2: Taser, 3: Pfefferspray, 4: K9-Hund Buster)

### Mobile / Touch
* **Virtueller Joystick (links):** Intuitive Bewegung in 360 Grad
* **Touch-Aktionsknöpfe (rechts):**
  * `⚡` Ausrüstung / Festnahme
  * `🔦` Taschenlampe ein/aus
  * `🛴` Segway auf-/absteigen

---

## 🛒 Ausrüstungs-Depot & Upgrades (Terminal)

* **🔦 Mag-Beam Tactical 5000 (120 €):** Größerer Lichtkegel und längere Blendung beim Strobe-Blitz.
* **🐕 K9 Schäferhund "Buster" (250 €):** Treuer Begleiter, der automatisch anschlägt, Täter hetzt und zu Boden reißt.
* **🛴 Patrouillen-Segway Turbo (180 €):** 2.2-faches Reisetempo mit Scheinwerfer und Hupe.
* **⚡ Taser-Magazin (40 €):** 3 frische Hochvolt-Elektrogeschosse für Distanz-Neutralisierung.
* **📡 CCTV KI-Tracker Software (200 €):** Markiert verdächtige Bewegungen auf den CRT-Monitoren rot.
* **☕ Premium Espresso & Donut Box (25 €):** Sofortige Regeneration von Ausdauer und Wachheit (Alertness).

---

## 🔊 Audio-Synthese (Web Audio API)

Alle Soundeffekte werden vollkommen autark ohne externe Audiofiles über den Browser-Synthesizer generiert:
* **Walkie-Talkie Funkspruch:** Hochfrequenter Funk-Pipser und atmosphärisches Rauschen (Squelch-Burst).
* **Taser-Schock:** Sägezahn-Elektroknistern mit multiplen Schockimpulsen.
* **Handschellen:** Metallisches Zweifach-Klicken (Click-Clack).
* **RFID-Stempel:** Positiver Doppelton-Gong beim Erfassen von Kontrollpunkten.
* **Segway-Klingel:** Reine Sinus-Doppelglocke (2000Hz / 2400Hz).
* **K9-Hundebellen:** Dreiecks-Oszillator mit Pitch-Fall für authentisches Bellen.
* **Alarmsirene:** Wiegende Frequenzmodulation zwischen 650Hz und 950Hz.
