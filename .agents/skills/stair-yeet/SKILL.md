---
name: stair-yeet
description: >-
  Leitfaden, Spielmechaniken, anatomisches Matter.js Ragdoll-Rig, Schubs-Vektoren, Bullet-Time Slow-Mo,
  dynamische Krankenhaus-Rechnungen (Medical Bill) und Web-Audio-Synthese für "Office Yeet: Ragdoll Dismount".
---

# Office Yeet: Ragdoll Dismount (Skill & Referenz)

Dieses Dokument beschreibt die Architektur, Physik-Rig-Konfiguration, Szenarien-Design, Audio-Synthese-Rezepte und Spielmechaniken von **"Office Yeet: Ragdoll Dismount"** (`games/stair_yeet.html`), inspiriert von Klassikern wie *Stair Dismount* und *Turbo Dismount*.

---

## 1. Physik-Architektur & Ragdoll-Rig (Matter.js)

### Negativer Collision Filter (Anti-Explosion)
Um zu verhindern, dass die Gliedmaßen der Puppe sich gegenseitig schneiden, verklemmen oder explosionsartig abstoßen:
```javascript
const RAGDOLL_GROUP = -1;
const filter = { group: RAGDOLL_GROUP, category: 0x0001, mask: 0xFFFE };
```
Alle 11 Ragdoll-Körperteile (`head`, `chest`, `pelvis`, `armL_up`, `armL_low`, `armR_up`, `armR_low`, `legL_up`, `legL_low`, `legR_up`, `legR_low`) erhalten diesen Filter. Dadurch kollidieren sie physikalisch einwandfrei mit Stufen, Möbeln, Wänden und Pflöcken, ignorieren sich aber gegenseitig.

### Gelenke & Anatomie (Constraints)
- **Hals:** Kopf zu oberem Torso (`stiffness: 0.90`)
- **Wirbelsäule:** Brustkorb zu Becken (`stiffness: 0.88`)
- **Schultern & Ellbogen:** Ober- und Unterarme mit Gelenkkugeln (`stiffness: 0.80 - 0.85`)
- **Hüften & Knie:** Oberschenkel und Unterschenkel (`stiffness: 0.85`)
- **Pin Constraint:** Im Zustand `READY` hält ein temporärer Halte-Constraint am Brustkorb die Puppe aufrecht auf dem Startpodest, der beim Yeet-Befehl gelöst wird.

---

## 2. Interactive Launch & Yeet-System

1. **Charakter- & Skin-Auswahl:**
   - 🪵 **Holz-Dummy:** Klassische Gliederpuppe mit Holzmaserung & Gelenkkugeln.
   - 🕶️ **Don Pablo (Cartel Edition):** 80er-Schnauzer, goldene Pilotenbrille, kolumbianisches Smaragd-Polo, Goldkette, Zigarre, Latin-Brass-Soundtrack, fliegende $100-Geldschein-Partikel & Cartel-Zitate (*"¡Plata o Plomo!"*).
   - 👔 **Chef Dr. Meyer (Corporate Edition):** Nadelstreifen-Anzug, wehende rote Krawatte, Brille & fliegende Akten-Memos.
2. **Trefferzonen-Auswahl:**
   - Genick / Kopf (`head`)
   - Brustkorb (`chest`)
   - Kreuz / Rücken (`pelvis`, oben)
   - Kniekehle (`leg_up`, unten)
   - Steißbein (`pelvis`, unten)
3. **Pulsierendes Fadenkreuz & Trajektorien-Prädiktor:**
   - Zeigt den exakten Krafteinleitungspunkt an.
   - Parabolische Flugbahn-Vorschau mit dynamischen Leuchtpunkten.
4. **Winkel- & Kraft-Regelung (Slingshot & Schieberegler):**
   - Oszillierender Kraft-Balken (30% bis 100%) mit visueller Farbskala (Grün → Gelb → Glühendes Rot).
   - Interaktiver Winkel-Slider (-60° bis +60°) und Slingshot-Drag (Richtung & Impuls per Maus/Touch frei bestimmbar).
5. **Impuls-Übertragung:**
   - Sauberes Lösen aller temporären Startpodest-Pins (`temporaryPins: [pinConstraint, feetPin]`).
   - `Body.applyForce(targetBody, applyPoint, forceVector)`
   - Leichte Rotation (`Body.setAngularVelocity`) für spektakuläre Saltos und Stürze.

---

## 3. Die 4 abwechslungsreichen Szenarien

1. **Chefetagen-Treppe (`executive`):**
   - 30 steile Marmorstufen auf zwei Treppenabsätzen mit Messingkanten.
   - Roter Teppichläufer, Handläufe und eine zerbrechliche Panzerglas-Brüstung am Ende.
2. **Großraumbüro-Chaos (`cubicle`):**
   - Steile Schreibtisch-Terrassen mit rollenden Drehstühlen (`friction: 0.04`).
   - Wasserspender (spritzt Wasserpartikel bei Aufprall), Aktenschränke und ein laufender Aktenvernichter am Boden.
3. **Baustellen-Rutsche (`construction`):**
   - Schräge gelb-schwarze Stahlträger.
   - Flipper-Bumper (`restitution: 1.95`), die den Dummy explosiv wegschleudern.
   - Trampolin-Sicherheitsnetz und Schuttcontainer.
4. **Flipper-Abgrund Plinko (`plinko`):**
   - Senkrechte Wand mit über 60 versetzten Pflöcken (`restitution: 0.88`).
   - Zwei motorisierte rotierende Kreuzbalken-Spinner.
   - 5 Multiplikator-Schächte unten mit **$100.000 JACKPOT** in der Mitte.

---

## 4. Bullet-Time Slow-Mo & "Medical Bill"-System

- **Impact-Sensorik:**
  - `Vector.magnitude(Vector.sub(bodyA.velocity, bodyB.velocity))`
  - Bei Treffern > 7.5 (oder Kopf/Rücken > 5.2): Umschalten auf **0.15x Zeitlupe** für 420ms.
  - Dynamischer Kamera-Zoom (+35%) auf die Aufprallstelle und Screen Shake.
- **Krankenhaus-Rechnung (Patient Discharge Report):**
  - Generiert detaillierte Rechnungszeilen je nach getroffenem Körperteil und Objekt.
  - Fliegende Comic-Zahlen steigen empor (`+$4,200!`).
  - Wenn alle Gliedmaßen für 1,2 Sekunden zur Ruhe kommen (`speed < 0.38`), öffnet sich die Quittung mit rotem Stempel.

---

## 5. Native Web-Audio-Synthesizer-Rezepte

1. **Yeet-Kick & Whoosh:**
   - 160Hz → 35Hz Sinus-Pitchdrop + Bandpass-gefiltertes Rauschen bei 600Hz.
2. **Knochen-Knacken & Holz-Thuds:**
   - Frequenz-Sweep 850Hz → 45Hz Dreieckswelle in 80ms + 1.400Hz Rechteck-Klicktransiente.
3. **Kassen-Klingeln (Cha-Ching!):**
   - Zweiton-Glocke: Sinustöne bei 1.318,5Hz (E6) und 2.093,0Hz (C7).
4. **Schrei / Stöhnen:**
   - Sägezahn-Oszillator 420Hz → 140Hz mit 800Hz Tiefpassfilter und exponentiellem Decay.
5. **Flipper-Bumper Boing:**
   - 260Hz → 750Hz → 120Hz Dreieckswelle mit schnellem Attack.
6. **Panzerglas-Splittern:**
   - 4 versetzte Sweep-Oszillatoren (2.200Hz - 4.000Hz).
