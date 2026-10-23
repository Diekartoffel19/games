---
name: stadiumrush
description: >-
  Leitfaden für games/stadiumrush.html (Stadium Rush): Trackmania-artiges 3D-Zeitfahren im Stadion –
  Blockstrecken, Fahrphysik, Drift, Booster, Checkpoints, Ghosts, Medaillen, Look & Audio.
---

# Stadium Rush – Leitfaden

Trackmania-(Nations-)inspiriertes Zeitfahren als Single-File (Three.js r128). Ziel: sich so nah wie möglich wie
das Original anfühlen – sofortiger Neustart, Respawn am Checkpoint, Ghost, Medaillen, Hundertstel-Jagd.

## Look & Feel
* Stadion: gemähter Rasen, weiß/blaue Plattformblöcke, dunkler Asphalt mit weißen Randlinien, rot/weiße Curbs in Kurven.
* Tribünen mit Zuschauer-Pixeln, Werbebanden ("STADIUM RUSH / VOLLGAS / TURBO / CHECKPOINT"), Flutlichtmasten.
* Tore: blauer CHECKPOINT-Bogen (wird nach Durchfahrt grün), START-Bogen, ZIEL-Bogen mit Schachbrett.
* Auto: weiß/rotes Stadion-Car (offene Räder, Front-/Heckflügel), Räder drehen & lenken sichtbar.
* HUD: kursive Ziffern auf schrägen dunklen Panels; Zeit unten mittig, km/h unten rechts, CP-Zähler oben,
  Split-Popup mit blau (schneller) / rot (langsamer) gegenüber der PB.
* 5 Himmelsstimmungen (Tag → Sonnenuntergang D04 → Dämmerung E05).

## Strecken
* Definiert als Blockkette in `TRACKS` (32-m-Raster): `['S',n,{dh,boost,cp,start,finish}]`, `['L'|'R',n]` (90°-Kurve,
  Radius n·32−16), `['G',n,{dh}]` (Lücke). `dh` = Höhenänderung (8 m = 1 Ebene).
* Rampen vor einer Lücke sind lineare Kicker (Absprung), alle anderen Rampen haben weiche Übergänge (`ease`).
* A01 Aufwärmrunde (weiß), B02 Turbo-Allee (grün), C03 Sprungfestival (blau), D04 Hochbahn (rot), E05 Grand Finale (schwarz).
* Neue Strecken: Beim Laden prüft der Autor-Bot (`runAuthor`), ob die Strecke fahrbar ist. Liefert er `null`,
  ist ein Abschnitt zu schnell (meist Booster/Kuppe direkt vor einer Kurve) → Layout entschärfen.

## Physik
* Feste 120-Hz-Schritte, 2.5D-Höhenfeld (`surf`/`heightAt`): Blockoberfläche oder Rasen (y=0).
* Grip-Modell: Längskräfte (Gas/Bremse/Rollwiderstand/Hangabtrieb), Gierrate sinkt mit Tempo, Seitenschlupf wird gedämpft.
* **Drift**: bei >72 km/h lenken + bremsen → weniger Grip, schnellere Drehung, nur noch leichte Bremswirkung.
* Rasen: starker Bremswiderstand (~28 km/h max); Tore (CP/Ziel) zählen nur auf der Strecke, Abkürzen über Rasen ist ungültig.
* Abheben, wenn die Oberfläche schneller abfällt als die Schwerkraft zieht (Kuppen/Kicker); Luftsteuerung = leichtes Drehen.
* Seitenwände erhöhter Blöcke und die Stadionbande prallen ab.
* Turbo-Pads: gelb (+20 m/s² für 1,1 s), rot (+30 m/s² für 1,6 s), über VMAX hinaus möglich.

## Ablauf & Steuerung
* Countdown 3-2-1-GO, Zeit läuft in Physikschritten (exakte ms).
* Alle CPs (beliebige Reihenfolge) nötig, sonst "Checkpoints fehlen".
* `Enter`/`⌫` Respawn am letzten CP **mit dem Fahrzustand bei der Durchfahrt** (Zeit läuft weiter), `R`/`Entf` Neustart,
  `C` 3 Kameras (Verfolger weit/nah, Cockpit), `G` Ghost (PB/Autor/Aus), `M` Ton, `Esc` Pause.
* Touch-Buttons nur bei `pointer: coarse`.

## Medaillen & Speicher
* Autorzeit = Zeit des Mittellinien-Bots, Gold ×1,1, Silber ×1,3, Bronze ×1,6 (gerundet).
* `localStorage` `stadiumrush_v1`: pro Strecke PB, Split-Zeiten, Ghost (30 Hz Frames `[x,y,z,yaw,pitch,roll]`), plus Optionen.

## Audio (Web Audio)
* Motor: Sägezahn + Rechteck + Sub über Tiefpass, simulierte Gänge (Drehzahl springt beim Hochschalten).
* Rauschen für Reifenquietschen (Drift/Schlupf) und Fahrtwind, Turbo-Pfeifen, Countdown-Beeps, CP-Ding, Ziel-Arpeggio,
  Lande-Rumms, Wand-Crash.
