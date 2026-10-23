---
name: duckskate
description: >-
  Leitfaden für games/duckskate.html (Duck Ice Skating): Look & Feel, Steuerung, Sprung-/Spin-Physik,
  Wertungssystem des grantigen Gans-Richters Gerald, Easter Eggs und Audio.
---

# Duck Ice Skating – Leitfaden

Eine Ente mit roter Bommelmütze und Ringelschal läuft 90 Sekunden Kür auf einem zugefrorenen Teich.
Bewertet wird sie von **Gerald**, einer Kanadagans hinter einem Holzpult, die seit 1987 jede Kür hasst.

## Look & Feel
* **Stimmung:** Winterdämmerung – Indigo-Himmel mit rosa Horizont, Vollmond, funkelnde Sterne, Lichterkette, zwei Gaslaternen mit flackerndem Schein, Schneefall, Vignette.
* **Perspektive:** Teich von oben (Ente top-down mit Höhen-Offset + Schatten), Bäume/Gans/Entenküken in Seitenansicht.
* **UI:** Vintage-Eiskunstlauf-Programmheft – Georgia-Serif kursiv, cremefarbenes liniertes Papier, roter Doppelrahmen, Small-Caps.
* **Kufenspuren** werden auf ein Offscreen-Canvas gezeichnet und verblassen langsam (leichte Restkratzer bleiben). Stürze und große Sprünge hinterlassen **Risse** im Eis.
* Hintergrund wird einmalig in ein 2×-Offscreen-Canvas gerendert (Seeded Random → immer gleicher Wald).

## Steuerung
| Taste | Am Boden | In der Luft |
|---|---|---|
| ↑ / W (halten) | Abstoßen in Schritten (Stride alle 0,36 s) | Spread-Wing-Pose (Stilbonus, Spin ×0,55) |
| ← → / A D | Kurven fahren | Drehen |
| ↓ / S | Bremsen; schnell (>210) = Hockey-Stop-Schneefontäne | Tuck (Spin ×1,75) |
| Space / Z / J | Springen (ab Speed 80) | – |
| P / Esc, M, Enter | Pause, Musik, Start | |

Touch: Steuerkreuz + runder Jump-Button (nur bei `pointer: coarse`).

## Physik
* Welt 1200×760, Teich-Ellipse (600,430, rx 520, ry 270) mit Abprallen am Schneewall (>170 = „Bonk“).
* Eis-Grip: Geschwindigkeitsvektor dreht sich zur Blickrichtung (auch rückwärts fahren möglich).
* Sprung: `vz = 240 + speed·0.6`, Gravitation 1350 → Airtime ≈ 0,35–0,85 s.
* Landung: Winkel zwischen Blickrichtung und Fahrtrichtung (vorwärts **oder** rückwärts): < 0,5 rad clean, < 0,95 scratchy, sonst Sturz. Rückwärtslandung → automatische Mohawk-Drehung.

## Tricks (nach halben Umdrehungen)
Puddle Hop · Waddle Toe · Single Quack · Quack Axel · Double Duckling · Double Quaxel · Triple Mallard · Triple Quaxel · Quad Feather · Quad Quaxel · Unspeakable Goose-Bane.
Präfixe: *Spread-Wing* (>35 % der Airtime gespreizt), *Tucked* (ab 1,5 Umdrehungen).

## Wertung (Gerald)
* Rohwert = Basis × (clean 1 / scratchy 0,55) + Speed-Bonus + Pose-Boni + Big-Air (>0,75 s).
* Wiederholung desselben Tricks innerhalb der letzten 3 → ×0,5 und spitzer Kommentar.
* Karte = Rohwert × (1 − Grummel/220) × Combo (bis ×1,5 für Clean-Serien), max. 9,9.
* **Grummel-Meter** (0–100, Start 70): Stürze +12, wackelig +4, Wiederholung +6, Bummeln +4 (alle 8 s), Bonk +3; saubere Sprünge senken ihn. HUD-Stufen: Livid → Irritated → Grumbling → Tolerating → Almost Impressed → Secretly Delighted.
* Sturz = Karte 0,0 (15 %: −1,0 „für emotionalen Schaden“).
* Endwertung: Soggy Breadcrumb < 12 · Bronze Crumb < 30 · Silver Puddle < 55 · Golden Feather < 85 · The Goose's Grudging Respect. Bestwert in `localStorage` (`duckskate-best`).

## Easter Eggs
* **Gans einschneien:** Hockey-Stop in Richtung Pult → Schnee auf Gerald, Tee-Drama, Grummel +25.
* **Gans-Jagd:** Jede 3. Schneedusche (oder Grummel 100) → Gerald watschelt aufs Eis und jagt die Ente 7 s lang („BACK IN 5 MIN“-Schild am Pult). Erwischt er sie: Sturz + „Justice.“ Tricks während der Jagd sind „UNJUDGED“. Eine Schneedusche ins Gesicht lässt ihn ausrutschen.
* **Perfekte 10:** Nur bei Grummel < 15 und Karte ≥ 9,5 – „...10. Fine. FINE. Tell no one.“
* Gerald schlürft in ruhigen Momenten Tee; die Entenküken (Schilder „GO MUM!“, „QUACK“, „10/10“, „♥“) jubeln bei guten Karten und erschrecken bei Stürzen.

## Audio (Web Audio, komplett synthetisiert)
Spieluhr-Walzer im 3/4-Takt (132 BPM, 8-Takt-Progression, Delay-Echo), Kufenkratzen als gefiltertes Dauerrauschen (Lautstärke/Frequenz nach Speed), Stride-Zischen, Sprung-Whoosh, Lande-Thump, Quaken (Sägezahn + Bandpass), Gans-Hupen (detunte Rechteckwellen), Sturz-„Wah-Wah“, Karten-Klick, Glockenspiel bei hohen Wertungen.
