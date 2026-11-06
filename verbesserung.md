# Verbesserungen – Spiele mit `isNew`-Tag

Stand: 2026-11-05 · Geprüft: alle 9 Spiele mit `isNew: true` in `index.html`.

Automatische Checks (alle bestanden):
- Syntax-Check aller Inline-Skripte mit `node --check`
- Laden jedes Spiels in Headless-Chrome mit Error-Hook: **0 Laufzeitfehler** beim Start

Die Punkte unten stammen aus manuellem Code-Review. Gespielt wurde nichts von Hand. Punkte mit *(prüfen)* sind Verdachtsfälle. Diese erst reproduzieren, dann fixen.

**Prioritäten:** `P1` = Bug / macht das Spiel (teilweise) unspielbar · `P2` = spürbares Problem / wichtige Verbesserung · `P3` = Feinschliff

**Regeln für Agents:**
- Pro Punkt nur die genannte Datei ändern.
- Bestehendes Verhalten sonst unverändert lassen.
- Nach dem Fix den Punkt hier abhaken (`- [x]`).
- Zeilennummern beziehen sich auf Commit `34f36bf`.

---

## Übergreifend (mehrere Spiele)

- [x] **X-1 · P1 · Keine Touch-Steuerung in den 3D-Fahr-/Flugspielen.** `hyperline.html`, `hovercourier.html` und `extrembuegeln.html` sind nur mit Tastatur steuerbar und auf Handy/Tablet unspielbar. In `extrembuegeln.html` ist nur das Hemd-Panel touchfähig, der Flug nicht. **Fix:** On-Screen-Buttons wie in `valetparking.html` (`#touch`, Pointer-Events setzen dieselben Input-Flags). Nur einblenden bei `'ontouchstart' in window || navigator.maxTouchPoints > 0`. **Fertig wenn:** jedes Spiel lässt sich im Chrome-DevTools-Mobile-Modus komplett durchspielen.
- [x] **X-2 · P2 · Kein Fehlerhinweis, wenn CDN oder WebGL ausfällt.** Betrifft alle 3D-Spiele (Three.js per CDN). `hyperline.html` bleibt dann für immer auf „LADE STRECKE …“ stehen (`#loading` wird erst am Modulende versteckt, Z. 1123). **Fix:** `window.addEventListener('error')` plus Timeout. Wenn das Modul nach ~8 s nicht gestartet ist oder `WebGLRenderer` wirft: sichtbare Meldung mit Link zurück zum Hub.
- [x] **X-3 · P3 · 3D-Spiele binden Hub-Standards nicht ein.** `terraform`, `hyperline`, `hovercourier`, `extrembuegeln` und `valetparking` haben kein `<link rel="icon" href="../src/favicon.ico">` und kein Umami-Script. Die 2D-Spiele haben beides. Highscores laufen dort über eigenes `localStorage` statt `ArcadeCore.saveScore`. **Fix:** Favicon und Umami-Tag wie in `kuhski.html` Z. 9–10 ergänzen. Ob `ArcadeCore` eingebunden wird, entscheidet der Owner. Erst nachfragen.
- [x] **X-4 · P3 · Ton-Stummschaltung wird nicht gespeichert.** `hyperline.html` (`sfx.toggleMute`, Z. 665) und `hovercourier.html` (`Audio.setMuted`, Z. 819) vergessen `M` beim Neuladen. **Fix:** im `localStorage` speichern (try/catch), beim Start anwenden.

---

## 🅿️ Valet Parking: Full Contact 3D — `games/valetparking.html`

- [x] **VP-1 · P2 · Performance im echten Browser ungetestet.** ~51 Autos mit je ~5 Draw Calls, dazu Bloom, 4 Point Lights und 1 SpotLight. Ziel: ≥ 50 FPS auf Laptop mit integrierter GPU. **Wenn zu langsam:** Räder und Blob-Schatten der geparkten Autos als `InstancedMesh` (Matrizen pro Frame aus `dyn` setzen). Bloom-Auflösung halbieren.
- [x] **VP-2 · P2 · Kein Auto-Pause bei Tab-Wechsel / Fokusverlust.** `blur` leert nur `input`. Der Timer läuft weiter, sobald der Tab zurückkommt. **Fix:** in `blur` und `visibilitychange` bei `state === 'play'` auf `'pause'` wechseln und `show('pause')` aufrufen.
- [x] **VP-3 · P2 · Mobile: Minimap überlappt die Schadensbox.** Im `@media (max-width:760px)`-Block steht `#minimap { top:250px }`, `#tr` ist dort aber ähnlich hoch. **Fix:** Minimap mobil z. B. links unter `#tl` platzieren oder verkleinern. Im DevTools-Mobile-Modus prüfen.
- [x] **VP-4 · P3 · Störenfried in der Bucht ist auf der Minimap nicht markiert.** In `drawMinimap()` das Auto hervorheben, dessen Body in der Ziel-Bucht startet, z. B. rot umrandet. Dafür beim Laden in `loadLevel()` merken.
- [x] **VP-5 · P3 · Tote Reste von Reihe C.** `SLOTS.r3` (immer leer) und `ROWNAME.r3` entfernen.
- [x] **VP-6 · P3 · Balancing von Zeitlimits und Trinkgeld nicht von Hand gespielt.** Einmal alle 5 Gäste spielen. Ziel: Level 1 mit 3 Sternen schaffbar, Level 5 knapp. `LEVELS[].time` / `.pot` ggf. anpassen.

---

## 👔 Extrem-Bügeln 3D — `games/extrembuegeln.html`

- [x] **EB-1 · P1 · Mobil unspielbar** (siehe X-1): Lenken, Nase hoch/runter, Fallschirm `F` und Luftbremse brauchen Touch-Buttons.
- [x] **EB-2 · P2 · Ruckler bei jedem Neustart.** `startRun()` (Z. 890) ruft immer `loadLevel()` auf. Das baut das Terrain neu (Vulkan: 320×400 Segmente, plus fbm pro Vertex). Das spürt man bei `R` deutlich. **Fix:** Wenn `levelIdx` gleich bleibt, nur Spielzustand, Bomben und Hemd zurücksetzen und die Level-Geometrie behalten.
- [x] **EB-3 · P2 · Fokusverlust pausiert nicht.** `blur` (Z. 1265) löst nur Tasten und Werkzeug. Der Flug läuft weiter, wenn man z. B. ins Hemd-Panel klickt und das Fenster wechselt. **Fix:** bei `S.state === 'play'` → `S.state = 'paused'; show('pause')`.
- [x] **EB-4 · P3 · Esc während des Countdowns tut nichts.** Keydown-Handler Z. 1253–1263: Pause auch für `S.state === 'count'` erlauben.
- [x] **EB-5 · P3 · Hemd-Panel wird auch im Menü jeden Frame neu gezeichnet.** `uploadShirtTex()` plus `drawShirtTo()` laufen pro Frame über 12.900 Pixel (Z. 1246–1247). **Fix:** nur in `count` / `play` / `paused` zeichnen.

---

## 🚀 Hyperline AG 3D — `games/hyperline.html`

- [x] **HL-1 · P1 · Mobil unspielbar** (siehe X-1): Gas, Bremse, Lenken, Airbrakes Q/E und Boost.
- [x] **HL-2 · P2 · Ewiger Ladebildschirm bei CDN-Fehler** (siehe X-2, Z. 100/1123).
- [x] **HL-3 · P3 · Runde 1 ist ~12 m länger als die anderen.** Das Schiff startet bei `placeShip(N - 6)` (Z. 922) hinter der Startlinie, die Rundenzeit läuft aber ab Rennstart. Die Bestzeit für Runde 1 ist dadurch systematisch schlechter. **Fix:** Rundenzeit von Runde 1 erst ab Überqueren von Index 0 zählen, oder auf `placeShip(0)` starten.
- [x] **HL-4 · P3 · Feature: Ghost der Bestrunde.** Position und Orientierung der Bestrunde alle ~0,1 s speichern (`localStorage`) und als halbtransparentes Schiff abspielen. Das gibt dem Zeitfahren ein Ziel.

---

## 📦 Hover Courier 3D — `games/hovercourier.html`

- [x] **HC-1 · P1 · Mobil unspielbar** (siehe X-1): Gas, Bremse, Lenken, Drift (Leertaste) und Turbo (Shift/E).
- [x] **HC-2 · P3 · Unnötiger Raycast gegen den flachen Boden.** In `physics()` (Z. 1037–1040) läuft pro Substep ein `raycaster.intersectObject(ground)`. Der Boden ist eine flache Ebene bei y = 0. **Fix:** `groundY = 0` direkt setzen.
- [x] **HC-3 · P3 · Drift-Anzeige flackert.** Mehrere Drifts kurz hintereinander starten überlappende `setTimeout(() => ui.drift.style.opacity = 0, 900)` (Z. 986). Ein alter Timer blendet dann den neuen Drift-Text aus. **Fix:** Timer-ID speichern und vor dem Neusetzen `clearTimeout`.
- [x] **HC-4 · P3 · Zielentfernung nur Luftlinie.** `spawnTarget()` (Z. 864) misst die Distanz in Luftlinie, Punkte gibt es nach `targetDist0`. Durch die Straßenführung sind manche Ziele viel weiter als bezahlt. Optional: Manhattan-Distanz für Punkte und Mindestdistanz verwenden.

---

## 🏝️ Insel-Schmiede 3D — `games/terraform.html`

- [x] **TF-1 · P2 · Keine Rückgängig-Funktion.** Ein falscher Pinselstrich lässt sich nicht zurücknehmen. **Fix:** Bei `pointerdown` mit Pinsel einen Snapshot von `H` ablegen (`H.slice()`, max. ~20 Stück). `Strg+Z` stellt wieder her: `tPos` setzen, `computeVertexNormals()` aufrufen, `updateColors(0, SEG, 0, SEG)` aufrufen.
- [x] **TF-2 · P2 · Insel wird nicht gespeichert.** Nach dem Neuladen ist alles weg. **Fix:** `H` (Float32Array, 161² Werte) und Bäume (x, z, s) beim Verlassen bzw. alle ~10 s in `localStorage` speichern (z. B. als Base64 von `Int16Array`, mit try/catch) und beim Start laden. Der Button „Insel zurücksetzen“ löscht den Speicherstand.
- [x] **TF-3 · P2 · Wasser-Animation kostet unnötig CPU.** `animateWater()` (Z. 276–285) setzt pro Frame 19.881 Vertices auf der CPU und ruft `computeVertexNormals()` auf. **Fix:** Wellen in einen Vertex-Shader verlagern (`onBeforeCompile` an `MeshPhysicalMaterial`) oder das Wasser-Grid stark verkleinern.
- [x] **TF-4 · P3 *(prüfen)* · Leertaste nach Button-Klick.** Nach einem Klick auf „Neue Insel“ hat der Button den Fokus. Leertaste + Ziehen (Kamera drehen) könnte den Button erneut auslösen und die Insel neu generieren. Der Keydown-Handler ruft zwar `preventDefault()` auf, Buttons lösen aber bei `keyup` aus. **Fix:** nach jedem Button-Klick `e.currentTarget.blur()` aufrufen.

---

## ⚡ Mini-Wahnsinn — `games/miniwahnsinn.html`

- [x] **MW-1 · P2 · Ab ca. Level 8 werden Spiele unmöglich.** `dur = m.time * 0.9 ** level` (Z. 287) hat keine Untergrenze. Beispiel „PUSTEN!“: bis zu 14 Taps (`n = 3 + min(d, 4)`, zwei Taps pro Kerze, Z. 72–74) in irgendwann < 1,5 s. **Fix:** `dur = Math.max(m.minTime ?? 1.4, …)` und den Schwierigkeitsanstieg pro Spiel deckeln, z. B. `level = Math.min(level, 8)` für Zeit, Zuwachs nur über Inhalt.
- [x] **MW-2 · P3 · Keine Tastatur zum Starten/Neustarten.** Enter bzw. Leertaste sollte `start()` auslösen, wenn `#menu` oder `#over` sichtbar ist (wie in `wackelkellner.html` Z. 359).
- [x] **MW-3 · P3 · „HALT DEN FURZ!“ bestraft `pointercancel`.** Ein System-Gesture auf dem Handy (z. B. Wisch vom Rand) löst sofort „verloren“ aus (Z. 350 ruft `m.up()` auf). **Fix:** bei `pointercancel` nur `down = false` setzen und die `grace`-Logik greifen lassen.

---

## 👵 Omas Nachschlag — `games/omanachschlag.html`

- [x] **ON-1 · P2 · Gefangen, obwohl man nichts geschmuggelt hat.** `omaTurnsAround()` (Z. 409) ruft `caughtDrag()` auf, sobald `drag` existiert. Das passiert auch, wenn der Finger nur auf dem Essen liegt (`drag.moved === false`), also wenn man gerade *essen* will. **Fix:** nur bestrafen bei `drag && drag.moved`.
- [x] **ON-2 · P3 · Text stimmt nicht mit der Logik überein.** Das Menü sagt „-22% Bauch“ (Z. 45), der Code zieht 24 ab (`Math.min(belly, 24)`, Z. 323). Eins von beiden angleichen.
- [x] **ON-3 · P3 · Kein Neustart per Tastatur auf dem Endbildschirm.** Im Keydown-Handler (Z. 985) bei `state === 'over'` Enter/Leertaste → `start()`.
- [x] **ON-4 · P3 *(prüfen)* · Layout auf schmalen Hochformat-Screens.** Tee-Tasse (`W/2 - S*0.30`), Tellerrand und Serviette (`W*0.33, H*0.83`) liegen bei ~390 px Breite sehr nah beieinander. Antippen kann das falsche Ziel treffen. Im DevTools-Modus iPhone SE/12 prüfen.

---

## 🐄 Kuh auf Ski — `games/kuhski.html`

- [x] **KS-1 · P1 · Touch: Lenken löst ungewollte Saltos aus.** `pointerdown` setzt `targetX` und ruft immer `trick()` auf (Z. 268). Wer in der Luft per Finger nachlenkt, startet Drehungen, die er nicht vor der Landung beenden kann. Ergebnis: Bauchlandung mit Lebensverlust. **Fix:** Trick nur auf kurzen Tap ohne Bewegung (pointerup < 200 ms, < 10 px Weg) oder über einen eigenen Trick-Button.
- [x] **KS-2 · P2 · Geschwindigkeit skaliert nicht mit der Bildschirmhöhe.** Die Kuh sitzt bei `H * 0.3` (Z. 62), Objekte kommen von unten mit bis zu 1.100 px/s (Z. 127). Auf Handy quer (H ≈ 380) bleiben ~0,25 s Reaktionszeit, auf großen Monitoren viel mehr. **Fix:** Geschwindigkeiten und Abstände relativ zu `H` rechnen (z. B. `speed * H / 800`).
- [x] **KS-3 · P3 · Tasten `A`/`D` funktionieren nicht mit Caps Lock / Shift.** In Z. 271–277 vor dem Vergleich `e.key.toLowerCase()` aufrufen.
- [x] **KS-4 · P3 · Keine Pause / kein Start per Tastatur.** `P`/`Esc` für Pause (wie `wackelkellner.html` Z. 341–345, inkl. `visibilitychange`), Enter für Start/Neustart.
- [x] **KS-5 · P3 · Schneeflocken verschwinden links.** `fx = (f.x*W + sin(...)*18) % W` (Z. 212) kann negativ werden. Fix: `((… % W) + W) % W`.

---

## 🍽️ Wackel-Kellner — `games/wackelkellner.html`

- [x] **WK-1 · P1 · Hohe Türme ragen aus dem Bild.** Das Tablett liegt fest bei `H * 0.42` (Z. 151). Bei bis zu 11 Teilen (Z. 83) mit ~30–42 px Höhe wird der Turm ~350 px hoch. Auf 720p-Laptops und im Querformat auf dem Handy sind die obersten (wertvollsten, rutschigsten) Teile unsichtbar und von HUD/Sprechblase verdeckt. **Fix:** Szene mit `scale = Math.min(1, H / 800)` zeichnen (Tablett, Emojis, Physik-Limits), oder die Kamera bei hohem Stapel nach oben schwenken.
- [x] **WK-2 · P3 · Scherben fliegen vom falschen Punkt los.** `shatter()` (Z. 107–122) berechnet den Startpunkt ohne die Tablett-Neigung `tilt`. Bei stark gekipptem Tablett springen Teile sichtbar. **Fix:** Offset `(it.x, -yy)` mit `tilt` rotieren.
- [x] **WK-3 · P3 · Lieferung mit leerem Tablett zählt als Fortschritt.** `deliver()` (Z. 133–150) erhöht `delivered` auch bei `n === 0`. Damit steigen Schwierigkeit und Trinkgeld-Multiplikator, ohne dass man etwas geschafft hat. Entscheiden, ob gewollt. Sonst `delivered` nur bei `n > 0` erhöhen.
