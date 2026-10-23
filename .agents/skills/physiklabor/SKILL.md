---
name: physiklabor
description: >-
  Leitfaden für games/physiklabor.html (Physik-Labor): Physik-Sandkasten mit eigener 2D-Starrkörper-Engine –
  Look & Feel, Werkzeuge, Materialien, Engine-Aufbau, Aufbauten (Presets) und Audio.
---

# Physik-Labor – Leitfaden

Single-File-Sandkasten (Canvas 2D, keine Bibliothek) mit selbstgeschriebener Engine: Kreise & konvexe Polygone, Reibung, Restitution, Gelenke, Motoren, Wasser mit Auftrieb.

## Look & Feel
* Blaupausen: nachtblaues Konstruktionspapier mit Raster (24 px, alle 120 px stärker), Meter-Skala links (1 m = 92 px), Kreide-Boden mit Schraffur, Consolas-Schrift.
* Körper: flache Farben mit dunkler Kontur, Rotationsstrich + Glanzpunkt; statische Körper grau schraffiert.
* Material-Details: Holz = Maserung, Metall = Nieten/starker Glanz, Eis = durchscheinend mit Lichtkante, Ballon = Knoten + ovaler Glanz, Räder = Reifen mit Profil, Felge & 3 Speichen.
* Verbindungen: Stange (weiß), Seil (hängt durch, wenn schlaff), Feder (Zickzack), Gelenk/Nagel (Pin-Punkt, gelb = Welt-Anker), Motor (türkiser Drehpfeil am Pin).
* Wasser: halbtransparenter Verlauf über die Körper gezeichnet, animierte Doppel-Sinus-Oberfläche (läuft mit Simulationszeit).
* Effekte: Staub bei harten Aufprallen, Wasserspritzer, Explosion (Funken, Rauch, Druckring, Bildschirmwackeln), Flugbahn-Vorschau beim Werfen, Hover-Info (Material · Masse · m/s) im Greifen-Werkzeug.

## Werkzeuge (Tasten 1–0, B, X)
Greifen (dynamisch = Feder-Griff; feste Teile werden kinematisch verschoben, Mausrad / Q E dreht) · Ball · Kiste · Form (Dreieck/Fünfeck/Sechseck oder „Zeichnen“ → konvexe Hülle, max. 10 Ecken) · Brett · Pendel · Kette · Verbinden (Stange/Seil/Feder/Gelenk/Motor) · Nagel · Rad (Motor-Rad an Körper bzw. Drehscheibe an Welt) · Bombe · Radierer. Rechtsklick löscht in jedem Werkzeug.
Regler: Größe, Sprungkraft, Schwerkraft (−1…3×), Wind, Zeit, Wasserstand (0–60 %), Motor (−1…1 × 24 rad/s).
Tasten: Space Pause, N/. Einzelschritt, ← → / A D Motor, R leeren, S Schütteln, Strg+Z Rückgängig (40 Schritte), Strg+S Speichern (localStorage `physiklabor.save.v2`).

## Materialien
Bunt (Zufallsfarbe) · Holz (leicht, schwimmt) · Metall (schwer, sinkt) · Gummi (springt, hohe Reibung) · Eis (fast reibungslos) · Ballon (Auftrieb 2,4 g, Luftwiderstand). Material wählen setzt auch die Sprungkraft. Wasserdichte `RHO_W = 0.0011`.

## Aufbauten
Newton-Wiege, Doppelpendel (Spuren), Pendel-Welle (15 Pendel), Abrissbirne, Motor-Auto (Hügel aus statischen Trapezen), Wasserbecken (schwimmen/sinken, Ballon am Gewicht), Galton-Brett (Spender `emitters`), Kistenturm, Bällebad, Wippe, Hängebrücke, Dominos.

## Engine
* Sequential Impulses mit 8 Substeps × 8 Iterationen (adaptiv 6/4 bei vielen Kontakten), Sweep-and-Prune-Breitphase (Insertion-Sort auf x).
* Polygone: lokale Ecken + Normalen, Schwerpunkt/Trägheit per Dreiecksfächer, Körper liegt immer im Schwerpunkt. Kollision Polygon/Polygon via SAT + Referenz-/Inzidenzkante + Clipping (Box2D-Stil), Kreis/Polygon über Voronoi-Regionen.
* Kontakte: spekulativ bis `MARGIN = 0.6` px, Warmstart über Schlüssel `(idA*2^20+idB)*512+fid` (Paar immer mit kleinerer id als A). **Restitution nur für neue Kontakte** – sonst schaukeln sich ruhende Stapel auf.
* Gelenke: `rod`, `rope` (nur Zug), `spring` (weich, 2,2 Hz), `pin` (2D-Punktgelenk, optional `motor`: Ziel wA − wB = Motordrehzahl, Drehmoment begrenzt). Warmstart mit Faktor `WS_J = 0.8` und `BETA_J = 0.2` – volle Übernahme lässt Brücken/Ketten zittern.
* Auftrieb: exakte Unterwasserfläche (Kreissegment bzw. Sutherland-Hodgman-Schnitt an der Wasserlinie), Kraft im Flächenschwerpunkt → Drehmoment, plus Wasserwiderstand.
* Körper weit außerhalb werden entfernt; Rückgängig/Speichern über `serialize()`/`restore()`.
* Hinweis Canvas: `ctx.save/restore` sichert den Pfad nicht – nach Clip-Schraffur Pfad neu aufbauen, bevor `stroke()`.
* Konflikt-Falle: angenagelte Körper, die in statischen Körpern stecken, kämpfen gegen den Kontakt – Aufbauten so bauen, dass Pins nicht in Festem liegen.

## Audio
Web Audio: Aufprall-Blip pro neuem Kontakt, Klang je Material (Metall = Square-Klirren, Holz = kurzes Klopfen, Gummi/Ballon = weich, Eis = hell), Lautstärke nach Aufprallgeschwindigkeit, max. 5 pro Frame. Explosion = gefiltertes Rauschen + 90→28 Hz-Wumms, Wasserspritzer = Bandpass-Rauschen.
