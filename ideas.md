# 🎮 Arcade Hub – Verrückte & Geniale Game-Ideen (ideas.md)

Dieses Dokument sammelt innovative, humorvolle und extrem suchterzeugende Spielideen, maßgeschneidert für das Web-Arcade-Format (HTML5 Canvas, Matter.js Physik, Web Audio API, Standalone ohne externe Server).

---

## 📑 Inhaltsverzeichnis
1. [Chaotische Physik & Ragdolls](#1-chaotische-physik--ragdolls)
2. [Meme- & Alltag-Extrem-Simulationen](#2-meme--alltag-extrem-simulationen)
3. [Quirky Stealth, Heists & Sabotage](#3-quirky-stealth-heists--sabotage)
4. [Action, Roguelites & Arcade-Chaos](#4-action-roguelites--arcade-chaos)
5. [Brain-Breaking Puzzle & Zeit-Mechaniken](#5-brain-breaking-puzzle--zeit-mechaniken)
6. [2-Spieler Party- & Duell-Spiele (Eine Tastatur)](#6-2-spieler-party--duell-spiele-eine-tastatur)

---

## 1. Chaotische Physik & Ragdolls

### 🎡 4. Kirmes-Schaukel 360 (Looping Overload)
* **Tagline:** Schaukel auf der Schiffschaukel so hoch, bis du den vollen 360°-Überschlag schaffst!
* **Genre:** Timing / Rhythmus / Physik
* **Core Loop:**
  * Wie auf dem Spielplatz: Durch perfektes Timing beim Hocken und Aufstehen pumpst du kinetische Energie in die Schaukel.
  * Je höher du kommst, desto krasser pfeift der Wind und desto höher steigt der Übelkeits-Balken deines Charakters.
* **Chaos-Faktor:**
  * Schaffst du den Überschlag oder fliegt der Charakter bei Überlastung aus dem Sitz quer über den Kirmesplatz?
* **Tech-Stack:** Physikalisches Pendel mit variablem Trägheitsmoment (Schwerpunktverlagerung) + Zentrifugalkraft-Audioeffekt.

---

## 2. Meme- & Alltag-Extrem-Simulationen

### 🍾 5. Pfandflaschen-Tycoon: Der Automat des Grauens
* **Tagline:** Der Pfandautomat nimmt deine Flasche nicht an. Nicht beim ersten Mal. Nicht beim zehnten Mal.
* **Genre:** Geschicklichkeit / Rage-Game / Comedy
* **Core Loop:**
  * Du stehst vor dem Scanner-Schacht. Die Flasche ist leicht eingedellt, das Etikett etwas schief.
  * Drehe die Flasche millimetergenau mit der Maus, glätte verbeulte Stellen und schiebe sie im perfekten Winkel hinein.
  * Die Schlange hinter dir murrt und wird wütender (Timer läuft ab).
* **Chaos-Faktor:**
  * Der Automat wirft Flaschen mit 100 km/h wieder aus. Finde absurde Tricks: Flasche mit Kaugummi reparieren oder den Automaten vorsichtig treten!
* **Tech-Stack:** 2D Drag-&-Drop mit Rotations- & Kollisionstracking, witzige Sprach-Samples via Web Audio.

---

### ☕ 6. Kaffee-Sprint im Großraumbüro (Don't Spill!)
* **Tagline:** Balanciere 5 randvolle Tassen heißen Kaffee vom Pausenraum zum Konferenztisch!
* **Genre:** Balancier-Simulator / Top-Down Reflex
* **Core Loop:**
  * Physikbasierte Flüssigkeit in den Bechern: Jedes Beschleunigen oder plötzliche Bremsen lässt Kaffee überschwappen.
  * Weiche herumrollenden Bürostühlen, Druckerkabeln, Putzeimern und Smalltalk-süchtigen Kollegen aus ("Hey, hast du mal 5 Minuten?").
* **Chaos-Faktor:**
  * Verschütteter Kaffee macht den Boden rutschig für dich selbst! Wenn du fällst: Zeitlupen-Splat mit Kaffeeflecken-Statistik.
* **Tech-Stack:** 2D Feder-Gitter-Flüssigkeitssimulation (Liquid Wave Grid) im Becher.

---

### 🛋️ 7. IKEA-Möbelbau: Die fehlende Schraube
* **Tagline:** Baue einen Kleiderschrank nach einer unverständlichen Anleitung auf – mit nur einem winzigen Inbusschlüssel.
* **Genre:** Montage-Puzzle / Physik
* **Core Loop:**
  * Finde die passenden Bretter und stecke Dübel hinein.
  * Setze den Inbusschlüssel an und drehe mit der Maus im Kreis. Wenn du abrutschst, nudelst du die Schraube aus!
  * Am Ende fehlt garantiert ein Holzteil – improvisiere mit Kugelschreibern oder Klebeband!
* **Chaos-Faktor:**
  * Stabilitätstest am Ende: Tippe den Schrank an. Bleibt er stehen oder klappt er wie ein Kartenhaus zusammen?
* **Tech-Stack:** Gelenk- und Bruchphysik (Joint Break Stress Thresholds).

---

### 🚇 8. U-Bahn-Surfen: Der Stehplatz-König
* **Tagline:** Überlebe eine Fahrt in der vollen U-Bahn, OHNE dich an den Haltestangen festzuhalten!
* **Genre:** Balance / Inverted Pendulum
* **Core Loop:**
  * Der Zug ruckelt, bremst in Kurven und beschleunigt plötzlich.
  * Du verlagerst dein Gewicht mit Pfeiltasten, um auf den Beinen zu bleiben.
* **Chaos-Faktor:**
  * Wenn du kippst, entsteht ein Domino-Effekt und du reißt drei Business-Leute und einen Typen mit Döner um!
* **Tech-Stack:** Physikalisches inverses Pendel mit Trägheitskräften der Bahn.

---

## 3. Quirky Stealth, Heists & Sabotage

### 🍿 9. Kino-Schmuggler (Smuggle the Feast)
* **Tagline:** Schmuggle Pizza, 2L-Flaschen und eine Fritteuse unter deinem Mantel am Ticket-Kontrolleur vorbei.
* **Genre:** Stealth / Silhouette Management
* **Core Loop:**
  * Je mehr Essen du einsteckst, desto unförmiger, breiter und lauter (Rascheln) wird deine Figur.
  * Passe deinen Gang an, huste im richtigen Moment, um Dosenklimpern zu übertönen, und weiche dem Blick des Kontrolleurs aus.
* **Chaos-Faktor:**
  * Wenn du niest oder stolperst, explodiert dein Mantel und Popcorn, Burger und Pommes fliegen wie Feuerwerk durchs Foyer.
* **Tech-Stack:** Raycast-Sichtkegel, dynamische Geräuschpegel-Erkennung, Deformierbare Hitboxen.

---

### 👶 10. Das schlafende Baby: Der knarrende Parkettboden
* **Tagline:** Das Baby schläft endlich. Jetzt musst du nur noch unbemerkt aus dem Kinderzimmer schleichen...
* **Genre:** Taktik-Stealth / Puzzle
* **Core Loop:**
  * Jede Diele im Raum hat eine andere Knarr-Wahrscheinlichkeit und Lautstärke.
  * Teste Dielen mit vorsichtigem Antippen. Weiche herumliegenden Quietsche-Enten und Lego-Steinen aus.
  * Ein Dezibel-Pegel zeigt die Aufwach-Gefahr des Babys.
* **Chaos-Faktor:**
  * Wenn du auf Lego trittst: Unterdrücke den Schrei durch schnelles Tastenhämmern!
* **Tech-Stack:** Dezibel-Meter mit akustischer Raumresonanz via Web Audio, Tilemap-Soundmatrix.

---

### 🍤 11. Buffet-Bandit (All You Can Stack)
* **Tagline:** Die goldene Regel: Du darfst nur EINMAL ans All-You-Can-Eat-Buffet. Also bau einen 1-Meter-Turm auf deinen Teller!
* **Genre:** Physik-Stapler / Geschicklichkeit
* **Core Loop:**
  * Wähle aus Pommes, Garnelen, Wassermelonen und Frühlingsrollen.
  * Nutze klebrige Lebensmittel (Reis, Saucen) als "Mörtel" für schwere Dinge.
  * Balanciere den gigantischen Turm vorsichtig zurück an deinen Tisch, ohne dass etwas herunterkollert.
* **Chaos-Faktor:**
  * Der strenge Restaurant-Chef beobachtet dich mit Argusaugen – fällt eine Garnele auf den Boden, wirst du rausgeworfen!
* **Tech-Stack:** Reibungskoeffizienten je Zutat, dynamischer Massenschwerpunkt.

---

## 4. Action, Roguelites & Arcade-Chaos

### 🚜 12. Rasentrecker-Massaker (Mow & Grow)
* **Tagline:** Das Unkraut mutiert und wächst im Sekundentakt nach. Rüste deinen Aufsitzmäher mit Flammenwerfern aus!
* **Genre:** Top-Down Bullet-Heaven / Roguelite (inspiriert von Vampire Survivors)
* **Core Loop:**
  * Fahre mit dem Aufsitzmäher über gigantische Rasenflächen.
  * Sammle Grasschnitt als Währung, schalte rotierende Zwillings-Klingen, Düngemittel-Bomben und Lachgas-Turbos frei.
  * Horden von mutierten Löwenzahn-Monstern und Hecken-Bossen greifen an.
* **Chaos-Faktor:**
  * Perfekter Drift-Radius schneidet mehr Gras für extra Combo-Multiplikatoren!
* **Tech-Stack:** Canvas 2D Gras-Partikelfeld, Top-Down Fahrzeug-Driftphysik, Wellen-Spawning.

---

### 🍲 13. Microwave Meltdown (Die Büro-Mikrowelle)
* **Tagline:** Was passiert, wenn man Alufolie, eine CD und ein rohes Ei in die Mikrowelle packt? Finde es heraus – stoppe aber rechtzeitig!
* **Genre:** High-Stakes Timing / Chain Reaction
* **Core Loop:**
  * Bestücke die Mikrowelle mit absurden Objekten.
  * Starte den Timer: Je länger es brutzelt, desto mehr Punkte und Plasma-Entladungen entstehen.
  * Du musst die Mikrowelle exakt 0,1 Sekunden vor der Zerstörung stoppen!
* **Chaos-Faktor:**
  * Wunderschöne, bunte Funken- und Plasma-Shader-Effekte auf Retro-Mikrowellen-Display.
* **Tech-Stack:** Partikel-Plasma-Systeme, summende Mikrowellen-Audiofrequenzen per Oszillator.

---

### 🐦 14. Tauben-Börse: Das Brotkrumen-Monopol
* **Tagline:** Kontrolliere den 500-köpfigen Taubenschwarm im Park wie eine gigantische Naturgewalt!
* **Genre:** Schwarm-Simulator / Arcade
* **Core Loop:**
  * Wirf Brotkrumen, Dönerfleisch und Pommes taktisch auf den Parkboden.
  * Der riesige Taubenschwarm bewegt sich fluid wie Wasser über den Bildschirm.
  * Lenke den Schwarm auf Radfahrer, Parkwächter oder gegnerische Tauben-Fütterer, um sie in die Flucht zu schlagen.
* **Chaos-Faktor:**
  * Füttere eine Taube zu viel und sie wird zur gigantischen "Mega-Taube", die ganze Parkbänke umschmeißt.
* **Tech-Stack:** Flocking-Algorithmus (Boids: Separation, Alignment, Cohesion) mit bis zu 1.000 Vögeln bei flüssigen 60 FPS.

---

### 🚦 15. Ampel-Gott: Verkehrschaos City
* **Tagline:** Kontrolliere die Ampeln einer gigantischen Kreuzung – sorge für Flow oder provoziere Jahrhundert-Staus!
* **Genre:** Traffic Management / Chaos Puzzle
* **Core Loop:**
  * Klicke Ampeln an, um zwischen Rot und Grün zu schalten.
  * Unterschiedliche Fahrzeuge: Krankenwagen (hohe Priorität), ungeduldige Taxis (hupen schnell), schwere LKW (brauchen ewig zum Anfahren).
  * Lass niemanden zu lange warten, sonst drehen Autofahrer durch und wenden mitten auf der Kreuzung.
* **Chaos-Faktor:**
  * Wenn zwei Autos crashen: Rette die Situation mit Abschleppern oder schaue genüsslich zu, wie sich ein 50-Auto-Stau bildet!
* **Tech-Stack:** 2D Pathfinding-KI mit Bremswegberechnung und Kreuzungs-Grid.

---

## 5. Brain-Breaking Puzzle & Zeit-Mechaniken

### ⌨️ 16. Tastatur-Verwirrung (Ctrl+Alt+Panic)
* **Tagline:** Ein böswilliger Virus vertauscht alle 15 Sekunden deine Tastaturbelegung!
* **Genre:** Retro-Platformer / Mental Gymnastics
* **Core Loop:**
  * Ein klassischer Pixel-Platformer: Springe über Stacheln, sammle Schlüssel, erreiche die Tür.
  * Der Haken: Plötzlich ist "W" nach links laufen, "Leertaste" bückt sich und "D" springt.
  * Auf dem Bildschirm siehst du eine virtuelle Tastatur, die das neue Layout für 2 Sekunden aufblitzen lässt.
* **Chaos-Faktor:**
  * Fake-Tasten (z.B. "Drücke F für Respekt" löst eine Selbstzerstörung aus).
* **Tech-Stack:** Dynamisches Input-Remapping mit CRT-Scanline-Filter.

---

### 👥 17. Der Zeitschleifen-Schatten (Echo Duplicate)
* **Tagline:** Jede deiner Bewegungen wird 4 Sekunden später von deinem bösen Klon wiederholt!
* **Genre:** Puzzle Platformer / Temporal Strategy
* **Core Loop:**
  * Du musst Schalter drücken, um Türen zu öffnen.
  * Doch dein Klon läuft zeitversetzt deinen exakten Pfad ab.
  * Wenn er dich berührt oder versehentlich eine Falltür unter dir öffnet, stirbst du.
  * Nutze deinen Klon: Lass ihn einen Schalter halten, während du durch die Tür rennst!
* **Chaos-Faktor:**
  * In späteren Levels gibt es bis zu 3 Klone aus unterschiedlichen Zeitepochen gleichzeitig!
* **Tech-Stack:** Frame-by-Frame Input-Recording & Replay-Ghost Queue.

---

### 🧲 18. Magnet-Puzzler: Polaritäts-Panik
* **Tagline:** Du bist ein Magnet. Schalte zwischen PLUS und MINUS um, um dich durch ein Feld aus Metallträgern zu katapultieren.
* **Genre:** Physics Puzzle / Momentum
* **Core Loop:**
  * Blau stößt Blau ab und zieht Rot an.
  * Nutze die Anziehungskraft, um an Decken zu hängen oder die Abstoßung für meterhohe Super-Jumps.
* **Chaos-Faktor:**
  * Metallschrott und lose Büroklammern im Raum fliegen dir bei falscher Polung wie Pfeile ins Gesicht.
* **Tech-Stack:** Physikalisches Coulomb-Kraft-Modell ($F = k \cdot \frac{q_1 q_2}{r^2}$) in Echtzeit.

---

## 6. 2-Spieler Party- & Duell-Spiele (Eine Tastatur)

### 🤺 19. Bürostuhl-Lanzenstechen (Office Jousting)
* **Tagline:** 2 Spieler, 1 Tastatur, 2 Bürostühle, 2 Klobürsten. Möge der Bessere gewinnen!
* **Genre:** 2-Player Local Duel / Ragdoll Physics
* **Core Loop:**
  * Spieler 1: `W-A-S-D` (Vor, Zurück, Drehen).
  * Spieler 2: `Pfeiltasten` (Vor, Zurück, Drehen).
  * Werfe Schwung durch Drehen auf und ramme die Klobürste gegen den Kopf des Gegners.
* **Chaos-Faktor:**
  * Wenn der Stuhl umkippt, krabbelt der Ragdoll-Spieler verzweifelt über den Boden, um wieder aufzusteigen!
* **Tech-Stack:** Matter.js 2-Player Rigid Body mit Federachsen und Drehmoment.

---

### 🍕 20. Pizza-Präzisionsschnitt (Pixel-Cut Showdown)
* **Tagline:** Schneide die Pizza mit einem Schnitt in exakt 50,0% / 50,0%. Wer ungenauer ist, zahlt die Rechnung!
* **Genre:** Geometrie-Duell / Party Game
* **Core Loop:**
  * Ein Pizzamesser rotiert über einer wild belegten Pizza.
  * Beide Spieler drücken ihre Taste für Start- und Endpunkt des Schnitts.
  * Die Engine berechnet in Millisekunden die Flächen beider Hälften auf Nachkommastellen genau.
  * Salami-, Pilz- und Käseanteile geben Bonus-Gewichtung.
* **Chaos-Faktor:**
  * Zeitlimit: Wer zögert, schneidet blind! Bizarre Pizzas (sternförmig, sechseckig).
* **Tech-Stack:** Polygon-Clipping Algorithmus (Sutherland-Hodgman) mit Canvas-Flächenintegration.

---

### 🏗️ 21. Spaghetti-Brücken-Duell (Statik-Crash)
* **Tagline:** Baue eine Brücke nur aus rohen Nudeln und Marshmallows – welcher Konstruktion hält den dicken Hamster aus?
* **Genre:** Physik-Baumeister / Statik
* **Core Loop:**
  * Beide Spieler haben 45 Sekunden Zeit, um Gitterträger aus Nudeln zu setzen.
  * Farbige Spannungs-Visualisierung: Grün (stabil), Gelb (hohe Last), Rot (bricht gleich!).
  * Anschließend rollt ein physikalischer Hamster im Ball über beide Brücken. Wessen Brücke hält länger stand?
* **Chaos-Faktor:**
  * Instabile Nudeln zersplittern mit knackigen Soundeffekten in hunderte Einzelteile.
* **Tech-Stack:** Finite-Elemente-Gitter / Feder-Dämpfer-System mit Spannungsgrenzen.

---

## 💡 Nächste Schritte & Umsetzungsempfehlungen
1. **Top-Favoriten für schnelle Prototypen (1 Datei):**
   * *Pfandflaschen-Tycoon* (sofortiger Lacherfolg, einfaches Drag & Drop).
   * *Bürostuhl-Lanzenstechen* (perfektes 2-Spieler-Pausenspiel).
   * *Rasentrecker-Massaker* (starkes Suchtpotenzial & Arcade-Feeling).
2. **Arcade-Core Integration:**
   * Highscores via `window.ArcadeCore.submitScore(gameId, score)`.
   * Standard-Mute-Button & ESC-Menü für sofortige Einbettung in `index.html`.
