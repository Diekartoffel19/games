---
name: xray
description: >-
  Leitfaden, Spielmechaniken, prozedurale Canvas/SVG-Silhouetten, CRT-Scanline-Shader,
  Papers-Please-Regeln und Audio-Synthese für "Airport X-Ray: Scanner Duty".
---

# Airport X-Ray: Scanner Duty — Dokumentation & Game Guide

Dieses Dokument beschreibt das minimalistische Gepäck-Zoll- und Silhouette-Puzzle-Comedy-Spiel **Airport X-Ray: Scanner Duty** (`games/xray.html`), das die bürokratische Satire von *Papers, Please* mit rasanter Röntgen-Silhouetten-Erkennung und absurden Flughafen-Regeln verbindet.

---

## 🎯 Spielkonzept & Kernmechanik

* **Genre:** Satirische Puzzle-Simulation / Reflex-Comedy (*Papers, Please* trifft Silhouette-Scanner).
* **Story:** Du wurdest als Röntgen-Sicherheitsbeamter am chaotischen "Gate 9¾ / Terminal X" des internationalen Flughafens *SkyBaggage International* eingeteilt. Deine Aufgabe: Kontrolliere das Gepäck auf dem Förderband und entscheide in 5 Sekunden, ob eine Tasche genehmigt (`APPROVE`) oder beschlagnahmt (`CONFISCATE`) wird.
* **Kernmechanik:**
  * **Fließband-Förderer (Conveyor Belt):** Gepäckstücke rollen mechanisch von links auf das Förderband, stoppen präzise unter dem bleiabgeschirmten Röntgen-Prüftunnel und setzen sich nach der Entscheidung mit beschleunigtem Ruck in Bewegung (entweder zum Flugzeug-Ladedeck oder durch die Klappe in den Schredder).
  * **5-Sekunden-Countdown:** Pro Gepäckstück tickt eine gut sichtbare analoge/digitale Druck-Uhr von 5.0s auf 0.0s herunter. Läuft die Zeit ab, wird das Gepäck standardmäßig ungeprüft durchgewinkt – und du kassierst eine Rüge!
  * **Zero-Asset Prozedurale Silhouetten:** Alle Gegenstände und Gepäckformen (Taschen, Reißverschlüsse, Schlösser, Griffe sowie über 35 interne Objekte) werden rein mathematisch über HTML5 Canvas 2D Bézier-Pfade, Bögen und Vektoren gerendert. Keine externen Bild- oder Asset-Dateien notwendig!
  * **Neon-Green Phosphor CRT X-Ray Shader:**
    * Authentische Scanlines mit dynamischem Zeilenflackern.
    * Grüne Phosphor-Nachleucht-Aura (`shadowBlur`, additive Lichtmischung bei Überlappungen).
    * Bildschirm-Krümmung / Vignette und Röhren-Glasreflexion.
    * Farbmodi-Umschalter: *Klassisch CRT-Grün* (Monochrom), *Dual-Energy X-Ray* (Orange für Organisches, Cyan für Metalle, Grün für Kunststoffe/Elektronik) und *Invertiertes Röntgen-Negativ*.
  * **Absurde Tages-Richtlinien ("Papers, Please" Comedy):**
    * Tag 1: "Grundkurs Gepäck": Keine Klingen über 6 cm, keine Flüssigkeiten über 100 ml.
    * Tag 2: "Flora & Fauna": Lebendige Hühner und Schlangen verboten (außer Support-Tauben).
    * Tag 3: "Gerade / Ungerade": Omas geheimer Stinkekäse ist an ungeraden Tagen erlaubt, an geraden streng verboten!
    * Tag 4: "Spooky Customs": Menschliche Schädel und Knochen sind verboten (außer Mini-Schlüsselanhänger). Keine Hexentränke.
    * Tag 5+: "Chaos-Airport": Verrückte Kombinationen (z. B. Bowlingkugeln verboten, Quietscheenten nur mit Zahnbürste erlaubt!).

---

## 💼 Gepäck & Schmuggelgut-Typen

### Gepäck-Außenschalen:
1. 🧳 **Hartschalenkoffer (Hard Suitcase):** Geripptes Gehäuse, Zahlenschloss, Ausziehgriff.
2. 👜 **Duffle-Bag (Sporttasche):** Weiche Textur, Tragegurte, Seitentaschen.
3. 💼 **Aktenkoffer (Vintage Briefcase):** Eckige Ecken, Messingschnallen.
4. 🎒 **Rucksack (Hiker Backpack):** Karabiner, Schnallen, Flaschentasche.
5. 🎸 **Gitarrenkoffer (Guitar Case):** Typische Wespentaille, perfekt für geheime Schmuggelware.
6. 📦 **Paket / Holzkiste (Crate):** Mit Schnüren oder Nägeln umwickelt.

### Silhouetten-Katalog (Canvas 2D Procedural):
* **Waffen & Werkzeuge:** Schere, Küchenmesser, Pistole, Handgranate, Schraubenschlüssel, Hammer, Kettensäge, Ninjastern.
* **Flüssigkeiten:** Soda-Dose (330ml), Mini-Parfümflasche (50ml - Erlaubt!), 1.5L Wasserflasche, Weinflasche, Giftkolben.
* **Lebewesen & Organisches:** Lebendes Huhn (mit wackelndem Kopf), schlafende Katze, Schlange, Omas Käserad, Bananenbündel, Fischgräte, Steak.
* **Elektronik & Skurriles:** Laptop, Smartphone mit Antenne, Kabelgewirr mit Wecker, Spielkonsole, riesige Goldbarren, Piratenschädel, Bowlingkugel, Quietscheente, Zaubertrank.

---

## 🕹️ Steuerung

* **Maus & Touch:**
  * 🟢 **[ APPROVE / GENEHMIGEN ]** (Grüner Riesenstempel)
  * 🔴 **[ CONFISCATE / BESCHLAGNAHMEN ]** (Roter Schredder-Knopf)
  * 🔍 **[ ZOOM / SCANNER LOUPE ]** (Lupe zum Untersuchen verdächtiger Dichten)
  * 📋 **[ REGELBUCH / DIRECTIVES ]** (Klick auf das Klemmbrett zum Einsehen aller Regeln)
  * 🎓 **[ TUTORIAL / TRAINING ]** (Interaktiver Leitfaden mit Silhouette-Guide)
  * 📟 **[ CRT MODE ]** (Umschalten zwischen Grünem CRT, Dual-Energy & Negativ-X-Ray)
* **Tastatur:**
  * <kbd>A</kbd> oder <kbd>←</kbd>: Tasche freigeben (Approve)
  * <kbd>D</kbd> oder <kbd>→</kbd>: Tasche beschlagnahmen (Confiscate)
  * <kbd>Space</kbd> oder <kbd>Tab</kbd>: Regel-Klemmbrett auf-/zuklappen
  * <kbd>T</kbd>: Interaktives Tutorial & Checkliste öffnen/schließen (pausiert die Zeit)
  * <kbd>F</kbd>: Röntgen-Farbfilter wechseln (Dual-Energy empfohlen)
  * <kbd>M</kbd>: Sound stummschalten

---

## 🔊 Audio-Design & Web Audio API

* **Förderband-Motor:** Subtiler tieffrequenter Riemen-Motorsound während der Fahrt.
* **Röntgen-Aktivierung:** Elektrisches Hochspannungs-Summen beim Einfahren der Tasche.
* **Herzschlag-Uhr:** Ticken der 5-Sekunden-Uhr wird in den letzten 2 Sekunden schneller und drängender.
* **Stempel-Wucht:** Satte hydraulische Klack- und Stempel-Geräusche.
* **Verstoß-Alarm:** Markanter Zwei-Ton-Buzzer bei falscher Entscheidung.
* **Bonus & Kasse:** Heller Kassen-Klingelton und Flughafen-Gong (`Ding-Dong-Ding`).
