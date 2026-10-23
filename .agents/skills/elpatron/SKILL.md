---
name: elpatron
description: >-
  Leitfaden, Spielmechaniken, 3D-First-Person-Cockpit-Landeanflug, Aerodynamik-Physik,
  PAPI-Gleitpfad-Berechnung, Web-Audio-Flug-Synthese und Imperium-Tycoon-Architektur für "El Patrón: Medellín Empire Tycoon".
---

# El Patrón: Medellín Empire Tycoon — Dokumentation & Game Guide

Dieses Dokument beschreibt das Spiel **El Patrón: Medellín Empire Tycoon** (`games/elpatron.html`) mit besonderem Fokus auf den **3D First-Person Cockpit-Landeanflug** (Cessna 182 Skylane / Piper Aztec).

---

## 🎯 Spielkonzept & Übersicht

* **Genre:** Kartell- & Wirtschafts-Tycoon kombiniert mit Action-Minispielen (2D Cessna-Nachtschmuggel & 3D First-Person Cockpit-Landeanflug).
* **Thema:** Baue das Medellín-Kartell von Don Pablo Escobar Gaviria in den 1980er Jahren auf:
  * Bargeld zählen, stapeln und mit Gummibändern bündeln
  * Dschungel-Labore und Kokain-Raffinerien managen
  * Nilpferdzucht & "Hippo Snack Frenzy" Minispiel auf der Hacienda Nápoles
  * Schmuggel-Flotte (Cessnas, Schnellboote, U-Boote) koordinieren
  * **3D Cockpit-Landeanflug:** Lande die schwer beladene Cessna persönlich im Cockpit auf geheimen Dschungelpisten!
  * Reviere erobern im Kartellkrieg gegen das Cali-Kartell und Los Pepes
  * Rotes Funktelefon: Eil-Dilemmas ("Plata o Plomo")
  * Endspiel: Tilge die 10 Milliarden Dollar Auslandsschulden Kolumbiens!

---

## 🛩️ Neuer Spielmodus: 3D First-Person Cockpit-Landeanflug

Im Tab **"Schmuggel & Flotte"** (sowie als optionales Finale des 2D-Schmuggelflugs) kann Don Pablo persönlich auf dem Pilotensitz der Cessna 182 Platz nehmen.

### 1. Das Cockpit & Die Instrumente ("Six-Pack")

Der Spieler blickt direkt durch die Windschutzscheibe auf die Dschungellandebahn. Im unteren Cockpit-Panel befinden sich die echten Fluginstrumente:
1. **Airspeed Indicator (ASI, Fahrtmesser):**
   * Messbereich: 0–140 Knoten (kts).
   * Weißer Bogen (40–85 kts): Sicherer Bereich für ausgefahrene Landeklappen.
   * Grüner Bogen (55–115 kts): Normaler Reise- und Anflugbereich.
   * Ideale Touchdown-Geschwindigkeit: 55–65 kts.
   * Warnung: Bei unter 45 kts ertönt der akustische **Stall Warning Buzzer**!
2. **Attitude Indicator (Künstlicher Horizont):**
   * Kreiselhorizont mit Neigungs- (Pitch) und Querneigungs-Leiter (Bank Angle) zur perfekten Orientierung bei Nacht und Nebel.
3. **Altimeter (Höhenmesser):**
   * Zeigt die Höhe über Grund (FT AGL) mit Doppelzeiger und digitaler Einblendung.
4. **Vertical Speed Indicator (VSI, Variometer):**
   * Zeigt die Steig-/Sinkrate in Fuß pro Minute (ft/min).
   * Idealer 3°-Gleitpfad: ca. **-450 bis -600 ft/min**.
   * Kritischer Sinkrate-Alarm bei > -1000 ft/min ("SINK RATE!").
5. **Directional Gyro (Kurskreisel):**
   * Kursanzeige zur Zentrierung auf Landebahn 09 (090°).
6. **Turn Coordinator & Inclinometer (Wendezeiger & Scheinlot-Kugel):**
   * Zeigt koordinierte Kurven ohne Schieben oder Schieren ("Step on the ball").

### 2. PAPI-Lichtsystem (Precision Approach Path Indicator)

Links neben der Aufsetzzone stehen 4 PAPI-Leuchten, die sich je nach Anflugwinkel in Echtzeit verfärben:
* **⚪ ⚪ ⚪ ⚪ (4 Weiß):** Viel zu hoch! (Gleitwinkel > 3.5°)
* **⚪ ⚪ ⚪ 🔴 (3 Weiß, 1 Rot):** Leicht zu hoch.
* **⚪ ⚪ 🔴 🔴 (2 Weiß, 2 Rot):** **Perfekter Gleitpfad (3.0°)!** *"Two white, two red, you're doing all right!"*
* **⚪ 🔴 🔴 🔴 (1 Weiß, 3 Rot):** Leicht zu tief.
* **🔴 🔴 🔴 🔴 (4 Rot):** Lebensgefahr! Zu tief – Kollision mit Baumkronen droht!

### 3. Aerodynamisches Flugmodell

* **Steuerung (6 Freiheitsgrade):**
  * **Höhenruder (Pitch):** Hebt/senkt die Nase. Beim Lande-Abfangen (**Flare**) kurz vor dem Boden sanft ziehen!
  * **Querruder (Roll):** Rollt das Flugzeug nach links/rechts für Kurskorrekturen.
  * **Schubhebel (Throttle, 0–100%):** Reguliert Motorkraft und Geschwindigkeit.
  * **Landeklappen (Flaps, 0° / 10° / 20° / 30°):** Erhöhen Auftrieb und Luftwiderstand, senken die Abreißgeschwindigkeit (Stall Speed) und ermöglichen steilere Anflüge.
  * **Fahrwerk (Gear):** Muss vor dem Aufsetzen ausgefahren sein (3 grüne Lichter).
  * **Bodeneffekt (Ground Effect):** In unter 10 Metern Höhe sinkt der induzierte Widerstand, das Flugzeug erfährt ein sanftes Luftkissen für den Flare.
  * **Radbremsen:** Nach Bodenkontakt [B] oder [Leertaste] gedrückt halten, um vor dem Pistenende zum Stehen zu kommen.

### 4. Drei anspruchsvolle Szenarien

1. **🇨🇴 Hacienda Nápoles (Standard / Dämmerung):**
   * Sanfter Wind (4 kts), gut beleuchtete Piste mit Scheinwerfern von Cartel-SUVs, Palmen und Hangars. Ideal zum Üben.
2. **🇧🇸 Norman's Cay (Insel / Starker Seitenwind):**
   * 14 kts Querwind von links! Erfordert Vorhaltewinkel (Crab Angle) gegen den Wind und Ausrichten kurz vor dem Aufsetzen.
3. **⛈️ El Limonar (Nacht & Gewittersturm):**
   * Nullsicht, strömender Regen, Blitze, 18 kts böiger Wind. Reine Instrumentenlandung (IFR)!

### 5. Touchdown-Bewertung & Belohnungen

* **🧈 BUTTER LANDING (Sinkrate < 150 ft/min, Zentriert):**
  * 5 Sterne: *"¡Extraordinario Patrón! Sanft wie auf Wolken!"*
  * Belohnung: **+$300.000 Schwarzgeld & +100 Respekt**.
* **🛬 GUTE LANDUNG (Sinkrate 150–350 ft/min):**
  * 4 Sterne: Professionell aufgesetzt. **+$200.000**.
* **⚠️ HARTE LANDUNG (Sinkrate 350–550 ft/min):**
  * 3 Sterne: Bumpy, ein Reifen beschädigt. **+$100.000**.
* **💥 CRASH (> 550 ft/min, ohne Fahrwerk oder Schräglage):**
  * Fahrwerk gebrochen oder Kisten explodiert! Reparaturkosten: **-$50.000**.

---

## 🎮 Steuerung im Cockpit

* **Tastatur:**
  * `[W]` / `[S]` oder `[↑]` / `[↓]`: Höhenruder (Nase Heben / Senken)
  * `[A]` / `[D]` oder `[←]` / `[→]`: Querruder (Rollen / Kurve fliegen)
  * `[Shift]` / `[Ctrl]` oder Schub-Schieberegler: Gas / Throttle (0–100%)
  * `[F]`: Landeklappen umschalten (0° -> 10° -> 20° -> 30°)
  * `[G]`: Fahrwerk ausfahren / einziehen
  * `[B]` oder `[LEERTASTE]`: Radbremsen betätigen (am Boden)
* **Maus-Steuerung:**
  * Direktes Ziehen auf der Windschutzscheibe fungiert als virtuelles Steuerhorn (Yoke).
* **Mobile & Touch:**
  * Virtueller Flight-Stick (D-Pad) links für Pitch & Roll
  * Vertikaler Throttle-Schieber
  * Große Buttons für Klappen (`FLAPS`), Fahrwerk (`GEAR`) und Bremsen (`BRAKE`)

---

## 🔊 Sound-Synthese (Web Audio API)

* **Kontinuierlicher Kolbenmotor-Sound:** Tiefe Oszillatoren mit harmonischer Modulation, Frequenz proportional zur Drehzahl (RPM).
* **Wind-Rauschen:** Skaliert dynamisch mit der Fluggeschwindigkeit.
* **Akustischer Stall Warning Horn:** 800-Hz-Rechteckwellen-Dauerton bei Strömungsabriss.
* **Fahrwerk & Klappen Mechanik:** Metallisches Klacken bei Betätigung.
* **Reifenquietscher (Touchdown Tire Screech):** Scharfer Weißrauschen-Burst mit Filterabsenkung beim ersten Bodenkontakt.
* **Copilot Jorge Funkrufe:** Synthetisierte Audio-Chimes und Textansagen ("Piste in Sicht!", "Perfekter Gleitpfad!", "FLARE! Ziehen!").


---

## 🏇 Pablos Vollblut-Derby: Paso-Fino Pferderennen

Auf der privaten Reitbahn der Hacienda Nápoles können Spieler Schwarzgeld auf Don Pablos edelste Vollblüter setzen.

### 1. Die vier Paso-Fino-Rennpferde
1. **👑 El Terremoto (2.0x):** Pablos persönlicher Lieblingshengst, exzellente Beschleunigung und kraftvoller Tölt.
2. **Sicario Express (3.2x):** Turbo-Sprinter für hohe Anfangsgeschwindigkeiten.
3. **Reina de Envigado (4.5x):** Ausdauerstute mit starkem Finish auf den letzten 30 Metern.
4. **El Fantasma (8.0x):** Außenseiter-Hengst mit spektakulären Quoten.

### 2. Gewinn-Mechaniken & Kartell-Vorteil ("Damit das Rennen gut geht")
* **🔥 Interaktive Peitsche (`[🏇 PEITSCHE! (+BOOST)]` / Leertaste):**
  * Während des Rennens kann der Spieler aktiv eingreifen: Jeder Klick oder Druck auf die Leertaste löst einen authentischen Lederpeitschen-Sound aus und katapultiert das eigene Pferd mit einem kräftigen Schub nach vorne!
* **💼 Kartell-Schmiergeld ($25.000):**
  * Don Pablos Sicarios bestechen die gegnerischen Jockeys: Alle anderen Pferde werden um 35–40% verlangsamt, während Pablos Pferd secret Cartel Energy erhält. Sieg-Garantie!
* **Inhärente Pablo-Gewinnquote:**
  * Das Pferd, auf das Don Pablo wettet, erhält einen permanenten Basis-Geschwindigkeitsvorteil (+60%), sodass der Spieler bei aktivem Anfeuern fast jedes Rennen gewinnt.
* **Audio & Animation:**
  * Rhythmisches Zweiton-Hufgetrappel ("Clip-Clop"), Staubwolken-Partikel, Renn-Galopp-Animation und Live-Kommentator-Ticker über der Bahn.
