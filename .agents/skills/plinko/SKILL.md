---
name: plinko
description: >-
  Leitfaden für Plinko Pyramide in games/casino.html (Grand Casino Royale):
  Galton-Zufallspyramide, Stift-Kollisionsphysik, 8–16 Reihen, 3 Risiko-Stufen,
  Rand-Multiplikatoren bis 1.000x, Multi- & Auto-Drop und Web-Audio-Chimes.
---

# Plinko Pyramide (Grand Casino Royale)

Dieses Dokument dient als Skill und Dokumentation für das Spiel **Plinko Pyramide** innerhalb von `games/casino.html`.

---

## 🎯 Spielkonzept & Grundprinzip

Plinko basiert auf dem mathematischen **Galton-Brett (Quincunx)**:
* Bälle werden oben an der Spitze einer Stift-Pyramide (Peg Pyramid) eingeworfen.
* An jedem Pin prallt der Ball mit physikalischen Stößen nach links oder rechts ab (50/50 Binomialverteilung).
* Am Boden der Pyramide befinden sich Fächer mit Multiplikatoren:
  * **Zentrum (Mitte):** Höchste Wahrscheinlichkeit, moderate bis niedrige Quoten (z. B. 0.2x bis 0.5x).
  * **Ränder (Außen):** Geringste Wahrscheinlichkeit, spektakuläre Multiplikatoren (z. B. 29x bis **1.000x**)!

---

## ⚙️ Physik & Berechnungsmodell

1. **Sub-Stepping:** Die Simulation läuft mit 4 Sub-Steps pro Frame (ca. 240 Hz), um Tunneling von High-Speed-Bällen durch Pins zu verhindern.
2. **Kollisionsauflösung:**
   * Distanzberechnung zwischen Kugelmittelpunkt und Stiftzentrum.
   * Elastischer Stoß mit Restitution (~0.58), Velocity-Vektor-Reflexion am Normalenvektor.
   * Micro-Random-Horizontal-Nudge bei exaktem Scheitelpunkt-Treffer verhindert unnatürliches Ausbalancieren auf dem Pin.
3. **Audio-Synthese:**
   * Jeder Pin-Treffer erzeugt einen harmonischen Sinus-Ton auf einer Pentatonik-Tonleiter.
   * Je nach horizontaler Position und Treffergeschwindigkeit erklingen leise, melodiöse Glocken-Akkorde (Cascading Harp Effect).
   * Zielfach-Treffer triggern maßgeschneiderte Sounds (Subtiler Akkord bei <2x, Fanfare bei >=2x, Jackpot-Sirene bei >=10x).

---

## 📊 Quoten- & Risiko-Matrix (RTP ~97%)

* **Reihen (Tiefe):** Wählbar zwischen 8, 10, 12, 14 und 16 Reihen (ergibt 9 bis 17 Zielfächer).
* **Risiko-Stufen:**
  * 🟢 **Niedrig (Low):** Zentrum 0.5x, Ränder bis 16x (geringe Schwankung, Guthaben-Schutz).
  * 🟡 **Mittel (Medium):** Zentrum 0.3x–0.4x, Ränder bis 110x (ausgewogene Casino-Formel).
  * 🔴 **Hoch (High):** Zentrum 0.2x, Ränder bis zu **1.000x** (maximaler Nervenkitzel für High Roller).

---

## 🕹️ Steuerung & Features

* **Einwurf:**
  * `Space` / `Enter` oder Klick auf "Ball werfen"
  * Klick direkt in den oberen Canvas-Bereich: Ball fällt an der angeklickten X-Koordinate ein.
* **Multi-Drop & Auto-Drop:**
  * `⚡ 5 Bälle` und `🔥 10 Bälle` werfen Salven in 120–130 ms Abständen ab.
  * `🔄 Auto-Drop` läuft kontinuierlich bis zum manuellen Stopp oder Notkredit-Bedarf.
* **Bankroll- & VIP-Integration:**
  * Geteiltes Casino-Konto mit Slots, Roulette und Blackjack.
  * 3 % jedes Ball-Einsatzes fließen automatisch in den progressiven Mega-Jackpot.
  * Tracking in den VIP-Statistiken: *Plinko Bälle geworfen* und *Bester Plinko Treffer*.
