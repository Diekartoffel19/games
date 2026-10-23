---
name: haircut
description: >-
  Leitfaden, Mechaniken, Kunden-Wackelprofile, Bewertungsformel und Reaktionsstufen für "Bad Haircut Barber" (games/haircut.html).
---

# Bad Haircut Barber — Dokumentation & Game Guide

Single-File-Canvas-Spiel (`games/haircut.html`, 800×600 logische Auflösung, 4:3, skaliert per `devicePixelRatio`). Spieltexte auf Englisch.

## 🎯 Spielkonzept

* Eine Schicht = 6 Kunden. Jeder bestellt einen Schnitt, der als **gestrichelte Guide-Linie** (Marching Ants) über dem Kopf gezeigt wird.
* Maus/Finger **gedrückt halten** = Haarschneider läuft. Jede Strähne, die die Klinge (±`BLADE` px seitlich) überstreicht, wird auf den Abstand zur Klinge gekürzt — kürzen ist endgültig.
* **DONE** (Button, Leertaste oder Enter) beendet den Schnitt; Restzeit gibt Speed-Bonus. Bei 0 s geht der Kunde ("I'm late!").

## ✂️ Haar-Modell

* `NSTR = 130` radiale Strähnen auf dem Skalp-Bogen von −170° bis −10° (Kopfradius `R = 90`), alles in **kopf-lokalen Koordinaten**.
* Pro Strähne: Ziel-Länge `T` (aus `STYLES[style].fn(a)`), Startlänge `L0` (unordentlicher Mopp, mindestens `T + 22`), aktuelle Länge `L`.
* Schnitt-Test: Zeiger wird per `toLocal()` in Kopf-Koordinaten transformiert, Weg zwischen zwei Frames in 4-px-Schritten abgetastet (kein Tunneling bei schnellen Bewegungen oder Kopfrucken).
* Abgeschnittene Stücke fallen als Partikel und werden beim Aufkommen in ein Offscreen-`floorCanvas` gemalt (bleiben die ganze Schicht liegen).
* Rendering: Strähnen als ein gemeinsamer `Path2D` (Outline, Farbe, Highlight), mit Trägheits-Lag aus Kopfgeschwindigkeit.

## 💇 Frisuren (`STYLES`)

Classic (30 überall), Buzz Cut (8), Undercut (Seiten 4, oben 46), Flat Top (waagerechte Linie über dem Kopf, Seiten 8), Mohawk (Mitte 72, Rest rasiert = 0), Mullet (oben 14, Seiten 78).

## 🧑 Kunden & Wackelprofile (`CUSTOMERS`, `updateHead`)

Kopf ist ein Feder-Dämpfer-System (Position + Winkel), das Zielwerten aus Sinus-Mustern folgt; Events geben Impulse.

| Kunde | Frisur | Profil |
|---|---|---|
| Gary | Classic | `calm` – leichtes Schwanken |
| Little Timmy | Buzz Cut | `fidgety` – zufällige Ruck-Impulse |
| Dana | Undercut | `sneezy` – "Ah… ahh…" Ausholen, dann ACHOO-Ruck + Screen-Shake |
| Grandpa Herb | Flat Top | `sleepy` – nickt langsam weg, schreckt hoch |
| Rocco | Mohawk | `headbang` – rhythmisches Nicken + Haar-Flips |
| Chad | Mullet | `chaos` – dreht sich beim Telefonieren hin und her + Rucke |

Extras pro Kunde (`extra`): Brille, Sommersprossen, Ohrringe, Herb-Schnurrbart + Halbmondbrille, Piercings, Handy am Ohr.

## 😱 Live-Reaktionen

* Zu kurz geschnittene Strähnen erhöhen `damage` → Gesicht wird traurig/ängstlich, `nervous` verstärkt das Wackeln (Teufelskreis!).
* Flinch: eskalierende Sprüche (`FLINCH`, 3 Stufen), "Au"-Sound, Kopf-Ruck. Augen verfolgen den Haarschneider.
* Unter 5 s: Ticken, blinkender Timer, ungeduldige Augenbrauen, Schweißtropfen.

## 🪞 Bewertung & Reaktionsstufen

Strähnen-Score: innerhalb ±`TOL` = 1; zu lang = linear bis 0 (ungeschnitten); zu kurz = 0 bei Überschnitt von `0.45·T + 8`. Neatness = Mittelwert.

| Neatness | Stufe | Reaktion | Tipp |
|---|---|---|---|
| ≥ 92 % | MASTERPIECE | Hüpfen, Herzen & Sterne, Fanfare | q·60 + Speed |
| ≥ 80 % | Sharp! | Nicken, Funkeln | q·60 + Speed |
| ≥ 65 % | Passable | Kopf neigen, Schweiß, "Hmm" | q·60 + Speed |
| ≥ 48 % | Rough | Augenzucken, Zittern, rot, Posaune | q·20 |
| ≥ 30 % | Devastating | Tränenfontänen, Schluchzen, Heulen | 0 |
| < 30 % | CATASTROPHE | Knallrot, Dampf aus den Ohren, Schrei, Screen-Shake | −$20 Rückerstattung |

Speed-Bonus = `50 · q · (Restzeit / Zeitlimit)`. Vor jeder Reaktion: "*you hold up the mirror…*" mit Trommelwirbel.

## 🏆 Schicht-Ende & Salon-Konto

Rang nach Gesamt-Tipps (Butcher of the Block → Scissor Sensei). Bestwert via `ArcadeCore.saveScore('haircut', …)`; der Hub zeigt ihn über die Karten-ID `haircut`. Gesamt-Einnahmen fließen dauerhaft in das Salon-Sparkonto (`localStorage` `barber_bank_v1`) und können im Barber Supply Shop reinvestiert werden.

## 💈 Barber Supply Co. (Upgrades & Shop)

Das Spiel verfügt über einen Upgrade-Shop, der im Hauptmenü, zwischen Kunden (Result-Card) und am Schicht-Ende aufgerufen werden kann. Gekaufte Upgrades werden persistent in `localStorage` (`barber_upgrades_v1`) gespeichert und schalten sofort wirksame Gameplay-Boni sowie sichtbare Clipper-Modifikationen frei:

| Upgrade | Icon | Stufen & Kosten | Mechanik / Gameplay-Effekt | Visuelle / Audio-Effekte |
|---|---|---|---|---|
| **Safety Guard** | 🛡️ | L1 ($35), L2 ($85), L3 ($160) | Erhöht `TOL` (+2px / +4px / +7px) und reduziert Flinch-Schaden um 30% / 60% / 85%. Verhindert Katastrophen. | Echter Clipper-Kammaufsatz (Blau, Bernstein, Rot) vor der Klinge. |
| **Titanium Clipper** | ✂️ | L1 ($45), L2 ($95), L3 ($190) | Verbreitert den Scherkopf (`BLADE` von 9px auf 13px / 17px / 22px). Erlaubt viel schnelleres, gleichmäßiges Stutzen. | Klinge wird breiter; L2 Keramik-Weiß, L3 Gold-Titanium mit Schimmer. |
| **Chamomile Mist** | 🌿 | L1 ($40), L2 ($90), L3 ($175) | Beruhigt Kunden (`calm`: −30% / −55% / −75% Wobble- und Ruck-Amplitude). Mehr Zeit zwischen Niesern & Zuckungen. | Grüner Kräuternebel (`tonic`-Partikel) mit "Pschhh"-Sound beim Start; entspannte Kundensprüche. |
| **Espresso Bar** | ☕ | L1 ($30), L2 ($75), L3 ($145) | Verlängert die Schicht-Zeit pro Kunde (+5s / +10s / +16s). Ermöglicht höhere Speed-Boni und saubere Schnitte. | Timer-Balken verlängert sich im HUD. |
| **Barber Charm** | 💈 | L1 ($50), L2 ($110), L3 ($220) | Heiße Handtücher & Luxus-Lederstuhl steigern Basis-Trinkgeld & Speed-Bonus (+20% / +45% / +80%). | Münz-Sound und höhere Rechnungsbeträge. |
| **Clipp-o-Vac 3000** | 🌀 | L1 ($65), L2 ($130), L3 ($240) | Saugt fliegende Haarabschnitte direkt im Flug ein. Gibt automatischen Sauberkeitsbonus (+$10 / +$22 / +$40 pro Kunde). | Transparenter Absaugschlauch am Clipper, Saug-Partikel & Whoosh-Audio. |

Aktive Upgrades werden im oberen HUD als Abzeichen (z. B. `🛡️2  ✂️1  🌿3  🌀2`) angezeigt.

## 🔊 Audio (Web Audio, respektiert `ArcadeCore.isMuted()`)

Haarschneider-Brummen (Sägezahn + Rechteck, Tiefpass, sackt beim Schneiden ab), Schnipp-Rauschen, Au-Stimme, Türglocke, Trommelwirbel, Fanfare, Posaune, Heulen mit Vibrato, Schrei + Dampfzischen, Nies-Sounds, Timer-Ticks, Kassen-Klingeln (Cha-ching beim Kauf), Kräuterspray-Pschhh, Haarsauger-Whoosh.
