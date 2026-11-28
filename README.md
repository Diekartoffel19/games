# Game Arcade & Web Tools

Eine umfassende, eigenständige Sammlung von **über 65 Browser-Games, interaktiven Web-Tools und Lern-Apps** — komplett clientseitig in HTML5, Canvas und modernem Vanilla JavaScript umgesetzt, ohne Build-Step, Bundler oder externe Backend-Abhängigkeiten.

🌐 **Live Hub:** [`https://rwpxe.com`](https://rwpxe.com)  
🎮 **Lokae Startseite:** [`index.html`](index.html)

---

## 🌟 Highlights & Kategorien

### 🎮 Spiele (Games)
Der Arcade-Hub bietet über 65 Minigames mit Highscores, Sound-Effekten (Web Audio API via [`src/arcade-core.js`](src/arcade-core.js)) und Touch-/Keyboard-Steuerung:

* **Physik & Ragdoll:**
  * [`games/umzug.html`](games/umzug.html) — *Umzugs-Chaos 3D: Die Altbau-Treppe (Billy-Regal, Sofa, Waschmaschine, Kleiderschrank & Klavier durch ein enges U-Treppenhaus bis zum Umzugswagen fädeln: Möbel als 6-DOF-Boxverbund mit Ecken-/Kanten-Kollision, die an Geländer, Wänden, Heizkörpern und Treppen-Unterseiten verkantet und schwenkt; ankippen & drehen um enge Podeste, PIVOT!-Ruf, Rammen und Schleifen kosten Mietkaution und hinterlassen Kratzer an der Wand, Nachbarn öffnen Türen; 5 Umzüge mit Sternen, Upgrade-Shop mit Tragegurten, Umzugsdecken, Kumpel-Kaffee, Türstopper & Spachtelmasse, Spielstand im localStorage)*
  * [`games/liegenkrieg.html`](games/liegenkrieg.html) — *Liegen-Krieg: Handtuch um 6 Uhr (6:00 im Pool-Hotel: vom Balkon im 3. Stock Handtücher per Schleuder-Wurf auf die Poolliegen werfen, bevor Frühaufsteher sie belegen; echte Stoff-Physik pro Handtuch (Position Based Dynamics) mit Drapieren über Liegenkanten, Abrutschen von Sonnenschirmen, Hängenbleiben in Palmen und Versinken im Pool; Wurfart offen (gute Abdeckung, windanfällig) oder gerollt (weit & windfest, langsames Einrollen); Handtuch-Diebe werfen deine Tücher in den Pool, der Bademeister verteilt Verwarnungen in seinem Sichtkegel, Treffer lassen Leute blind herumtappen oder umfallen; 5 Urlaubstage mit steigendem Wind + Endlos-Tage)*
  * [`games/orbitgolf.html`](games/orbitgolf.html) — *Orbit-Golf 3D (Minigolf zwischen kleinen Planeten: jeder Himmelskörper zieht per Newton-Gravitation am Ball – Bogenschläge, Orbit-Putts um den eigenen Planeten, Schleuder-Manöver an Schwarzem Loch und Sonne, Wurmloch, Boost-Ring, kreisender Mond und Doppelstern; 5 Oberflächen mit eigener Reibung und Sprungkraft (Gras, Eis, Gummi, Sand, Fels), Schleuder-Steuerung mit 1-Sekunden-Flugbahnvorschau und Geisterspur, 12 Löcher mit Par, Kurs-Rekord & Bestwert pro Loch)*
  * [games/thermal_nomad.html](games/thermal_nomad.html) — *Thermal Nomad 3D: Arctic Survival (Exakte Euler-Thermodynamik mit Tsurf & Tcore, Sonnen-Raycasting, Reflektions-Spiegeln, Thermoschilden, Aerosol-Nebel & physikalischem Lastenschlitten)*
  * [`games/ballistics.html`](games/ballistics.html) — *Panzer-Querschnitt: Slow-Mo Ballistik & Zerstörungs-Simulator (Mehrschicht-Panzerung, ERA, Keramik, Spalling & Röntgen-Kill-Cam)*
  * [`games/magnet.html`](games/magnet.html) — *Magnet-Puzzler: Polaritäts-Panik (Coulomb-Physik, Decken-Anziehung & Büroklammern-Abwehr)*
  * [`games/kofferstapler.html`](games/kofferstapler.html) — *Koffer-Stapler Extreme (Airport Jenga mit Matter.js-Physik & Turbulenzen-Test)*
  * [`games/einkaufswagen.html`](games/einkaufswagen.html) — *Einkaufswagen-Rallye (Supermarkt Derby mit klemmendem Rad & Ragdoll)*
  * [`games/fensterputzer.html`](games/fensterputzer.html) — *Fensterputzer 9000 (Wolkenkratzer-Seilgondel mit Balance & Tauben)*
  * [`games/physiklabor.html`](games/physiklabor.html) — *Interaktives 2D-Physik-Labor mit Auftrieb, Federn & Gravitation*
  * [`games/stair_yeet.html`](games/stair_yeet.html) — *Office Yeet: Ragdoll Dismount*
  * [`games/cannon_sheep.html`](games/cannon_sheep.html) — *Cannon Sheep Weitenrekord*
* **Strategie & Simulation:**
  * [`games/fernfahrer.html`](games/fernfahrer.html) — *Fernfahrer 3D (Fahrzeug frei wählen – Go-Kart, Kleinwagen, Pickup, Sattelzug mit schwenkendem Auflieger oder 220-t-Minenkipper – und durch eine endlose, prozedurale Welt fahren: Straßennetz mit Kurven und Kreuzungen, Hügel und Berge, Dörfer, Wälder, Felder, Windräder, KI-Verkehr. Lieferaufträge an Lagern mit Express-Bonus, Zeitlimit und Ladungsschaden, Kipper kippt seine Mulde. Nitro, Schanzen mit Sprung-Geld, Münzen, Drift-Punkte, Blitzer, Fahrzeug anpassen (Lackierung, Felgen, freies Tuning, Welt: Kurven gerade bis Serpentinen, Gelände flach bis bergig), Tag/Nacht mit Scheinwerfern, Minimap. Alle Modelle aus Blender)*
  * [`games/nadelimheu.html`](games/nadelimheu.html) — *Die Nadel im Heuhaufen 3D (First-Person: jeden Halm einzeln mit der Hand aus dem Heuhaufen ziehen, bis irgendwo die Nähnadel glitzert. Taler pro Halm, Werkstatt-Upgrades vom kräftigeren Griff über Metalldetektor mit Nadel/Schrott-Diskriminator, Heugabel und Magnet-Puls bis zum Laubbläser. Handarbeit ermüdet (Kraftbalken, müde Arme greifen langsamer), Von Anfang an ein Riesenhaufen mit vielen Nadeln (jede Nadel +5 % Heuwert). Automation von Hofhühnern über Heu-Roboter bis zur Förderanlage: Trichter, Förderband und Ballenpresse (Ballen bringen mehr, Engpass-Anzeige), Radlader schaufeln in den Trichter, Turmdrehkran, Magnet-Sortierer und Hofcomputer-Autopilot. Werkstatt mit Kategorie-Tabs, Fortschrittsbalken und Shift-Kauf. Heu rutscht nach, Nägel, Hufeisen und Münzen als Köder, Haufen-Stand wird gespeichert. Blender-Modelle, Gemini-Texturen, Bloom & Abendlicht, Spielstand im localStorage)*
  * [`games/drehbank.html`](games/drehbank.html) — *Dreh- & Fräs-Werkstatt: Zerspanungs-Simulator (Material – Alu, Messing, Stahl – sowie Rohling-Durchmesser und -Länge aussuchen, dann an der Drehbank Schritt für Schritt auf die Ziel-Durchmesser abdrehen: Zustelltiefe steuert Oberflächengüte und Ausschuss-Risiko, Untermaß ruiniert das Teil; anschließend eine Nut auf Zieltiefe fräsen und in der Qualitätskontrolle Maß-Genauigkeit, Nut, Güte & Ausschuss bewerten lassen. Sichtbare Zielkontur, Mikrometer-Anzeige, steigende Toleranz-Anforderung pro Auftrag, Highscore im localStorage)*
  * [`games/datacenter.html`](games/datacenter.html) — *Datacenter Tycoon 3D (Rechenzentrum aufbauen: Racks aufstellen, Server kaufen und upgraden – Basic, Pro, GPU-Node –, Switches, PDUs und Klimageräte platzieren und selbst verkabeln: Strom über PDU zum Hauptverteiler, Netz über Switches zum Uplink-Router. Lastgrenzen, Port-Limits, Kupfer vs. Glasfaser, Überhitzung, Wärmekarte, Events wie DDoS und Stromausfall, Hallen-Erweiterung und Upgrades, Spielstand im localStorage)*
  * [`games/winterdienst.html`](games/winterdienst.html) — *Winterdienst 3D: Räumpflicht ab 5:30 (kommunaler Schneepflug im Morgengrauen: Straße und Gehwege bis 7:00 Uhr freiräumen, Schild ±35° schwenken, damit der Schnee massenerhaltend am nachlaufenden Ende zu Wällen auf die Grünstreifen fließt; Autos, Einfahrten oder Haustüren zuschieben = Nachbar im Bademantel mit Bußgeld; verstecktes Glatteis salzen, Schneefall läuft weiter; 5 Bezirke bis zur Bergstraße im Schneesturm, Sterne & Bauhof-Werkstatt mit Hydraulik-Schild, Schneeketten, Salzstreuer XL, Schneefräse & LED-Scheinwerfern, Spielstand im localStorage)*
  * [`games/grillmeister.html`](games/grillmeister.html) — *Grillmeister: Nachbarschafts-BBQ (Holzkohlegrill im Kleingarten in schräger Draufsicht: Grillgut aus der Kühlbox auf den Rost ziehen, jede Seite gart einzeln von roh über perfekt bis Kohle, antippen zum Wenden, auf den richtigen Gast ziehen; Bratwurst „schön schwarz“, Steak medium, Maiskolben, Grillkäse, Tofu-Wurst für die vegane Cousine, Paprika & Marshmallows; Glut mit der Zange schieben, mit dem Pappteller fächeln, mit Wasser löschen; Fett-Stichflammen, Qualm & Nachbar-Beschwerde bis zum Ordnungsamt; Hund, Wespen, Regen, Onkel Gerd, umgekipptes Bier & Grillanzünder-Stichflamme; Abende mit wachsender Gästezahl, Sterne & Trinkgeld, 5 Baumarkt-Upgrades, Spielstand in localStorage)*
  * [`games/amtsschimmel.html`](games/amtsschimmel.html) — *Amtsschimmel: Behörden-Simulator (Sachbearbeiter im Bürgeramt: absurde Anträge per Drag & Lupe gegen täglich absurdere Dienstvorschriften prüfen und GENEHMIGT / ABGELEHNT / FORMULAR FEHLT stempeln; Kaffee-, Wut- & Aktenstapel-Leisten, Mittagspause, Drucker-Stau, Fax-Eilerlasse, Kuchengeld & Behördenprüfung, Rügen vom Amtsleiter, Karriereleiter Praktikant → Amtsleiter mit Freischaltungen, Autosave)*
  * [`games/gassichaos.html`](games/gassichaos.html) — *Gassi-Chaos: Hundesitter-Simulator (bis zu 6 Hunde gleichzeitig an echten Verlet-Seil-Leinen durch Park & Straße führen: Leinen wickeln sich um Laternen, Bäume, Bänke, Hydranten und Passanten und verknoten sich miteinander, zu viel Chaos = Ragdoll-Sturz; 6 Rassen mit eigenem Charakter (Dackel schnüffelt an jedem Pfosten, Husky zieht, Chihuahua kläfft alles an, Labrador rennt zur Wurstbude, Mops streikt, Pudel jagt Tauben), Eichhörnchen, Katzen, Tauben, Briefträger & andere Hundehalter; Hunde an den Häusern abholen, Gassi-Bedarf stillen, pünktlich heimbringen; Haufen eintüten oder der Nachbar kassiert; Upgrades Rollleine, Leckerli, Kotbeutel-Spender, Laufschuhe & Hundeschein, Spielstand im localStorage)*
  * [`games/boersenhai.html`](games/boersenhai.html) — *Börsenhai: Trading-Terminal (Aktien, ETFs, BX10-Index, Anleihen-ETF, Gold, Silber, Öl, Krypto & Devisen mit simulierten Kursen handeln: Kerzen-, Heikin-Ashi- & Liniencharts in 6 Zeiteinheiten mit Zoom/Pan, SMA/EMA/Bollinger/Volumen/RSI; Long & Short mit Hebel und Margin-Call, Markt-/Limit-/Stop-Orders, Stop-Loss, Take-Profit & Trailing-Stop per Chart-Drag, Black-Scholes-Optionen (Call/Put), Spread, Gebühren & Übernacht-Finanzierung, Nachrichten & Wirtschaftskalender mit Quartalszahlen und EZB-Entscheiden, optionale Live-Kurse für Gold, Silber, Öl, Krypto & Devisen per Finnhub-API-Key, Autosave)*
  * [`games/hexfront.html`](games/hexfront.html) — *HEXFRONT: Tactical Warfare (Rundenbasierte Hex-Strategie)*
  * [`games/propaganda.html`](games/propaganda.html) — *Wähl Mich! — Propaganda Simulator*
  * [`games/doener.html`](games/doener.html) — *Döner Tycoon*
  * [`games/boatsim.html`](games/boatsim.html) — *Boot- & Wellen-Simulator*
  * [`games/raketenbau.html`](games/raketenbau.html) — *Raketenbau 3D (Rakete aus 37 Blender-Bauteilen mit SVG-Bauteil-Symbolen bauen, 5 Autopilot-Programme inkl. Orbit-Aufstieg, Hohmann-Transfer & Suicide-Burn-Landung, 3D-Weltraumbahnhof mit Polarlichtern, Tageszeiten & 3D-Kratern, Mehrkörper-Orbitalphysik zu Mond, Mars, Venus, Jupiter, Europa & Titan, 35 Missionen in 5 Kapiteln & wiederholbare Auftragsbörse)*
  * [`games/tycoon.html`](games/tycoon.html) — *3D City Tycoon*
  * [`games/eisangler.html`](games/eisangler.html) — *Eisangler 3D (Eisangeln auf dem zugefrorenen See vom Morgengrauen bis zur Dämmerung: Löcher bohren, Schwärme per Sonar finden, Drill-Minispiel mit Spannungsbalken, 4 Fischarten inkl. seltenem Gold-Saibling, verstecktes dünnes Eis mit wachsenden Rissen, Kälte-Leiste & Ofenhütte, Blender-Modelle; Upgrade-Shop: Fang für € verkaufen, 7 dauerhafte Upgrades im Angelladen)*
  * [`games/leuchtturm.html`](games/leuchtturm.html) — *Leuchtturm 3D (Sturmnacht im Laternenraum: Lichtkegel über die See schwenken, Schiffe anleuchten und anblinken, damit sie vom Riff abdrehen; Fokus breit/eng, Dynamo kurbeln, Möwen auf der Scheibe per Nebelhorn verscheuchen, falsche Feuer der Strandräuber löschen, Käpt’n Korn nur kurz anleuchten; 5 Schichten bis zum Morgengrauen + Endlos-Modus)*
  * [`games/wettermacher.html`](games/wettermacher.html) — *Wettermacher 3D (Du bist das Wetter über einer Low-Poly-Insel: Wolken durch Kreisen übers Meer sammeln, Regen per Halten, Sonne schnippt Wolken weg oder brennt einen Sonnenstrahl, Wisch-Böen, Blitze aus Gewitterwolken; 9 Wetterkräfte inkl. Schnee, Regenbogen, Nebel & Tornado; ein Dorf wächst selbstständig von Hütten bis zu Tempel & Leuchtturm, Wünsche als Sprechblasen, Jahreszeiten mit Tag/Nacht, Heuschrecken, Piraten, Seeschlange, Waldbrand, Vulkan, Sandsturm & Sturmgeist-Boss; Himmelsbaum mit 26 Künsten, 5 Inseln mit eigenem Klima, Chronik, Spielstand in localStorage, Blender-Modelle)*
* **Action & Roguelike:**
  * [`games/hammerzeit.html`](games/hammerzeit.html) — *Hammerzeit 3D: Block-Abriss (Ego-Perspektive mit Hammer in einer zufällig generierten Mini-Block-Stadt: Häuser, Hochhäuser, Läden, Parks, Zikkurats und Autos zerschlagen, Schlag per Maustaste aufladen, Teile ohne Bodenkontakt stürzen als Trümmer ein, TNT-Kisten lösen Kettenexplosionen aus; Hammer-Upgrades nach Zerstörungsgrad bis zum Mega-Hammer, Flugmodus, Rekord im localStorage)*
  * [`games/spickalarm.html`](games/spickalarm.html) — *Spick-Alarm 3D: Quanten-BWL (First-Person-Schummel-Stealth im Hörsaal: Spicker im Mäppchen, Kevins Blatt & Tafel-Reste per Zoom scharfstellen, Verdachts-Meter mit Sichtkegel & Sichtlinie von Prof. Knurr, Husten-Vorwarnung, Laserpointer, Radiergummi-Ablenkung an die Heizung, Papierflieger fangen, Assistentin als zweite Aufsicht, Petze Pascal im Finale, 5 Klausuren mit Noten 1,0–5,0)*
  * [`games/wellenbrecher.html`](games/wellenbrecher.html) — *Wellenbrecher (2.5D-Pixel-Horden-Survival: Spieler immer in der Bildmitte auf einer prozedural generierten 200×200-Insel mit Ruinen, Truhen & Schreinen; 7 Auto-Waffen, 6 Fähigkeiten, 13 Werte-Upgrades, Wanderhändler zwischen den Wellen, Tag-Nacht-Wechsel & Bosse alle 5 Wellen)*
  * [`games/tiefenrausch.html`](games/tiefenrausch.html) — *Tiefenrausch 3D (Tiefsee-Bergbau-Roguelite: U-Boot in einen prozeduralen Graben mit 7 Zonen vom Kelpwald bis zum Schlund, Erz bohren, O₂/Hülle/Akku & Druck managen, Sonar-Ping, Quallen, Muränen, Anglerfisch, Riesenkalmar & Leviathan, Harpune & Wasserbomben, Station mit 18 Upgrades, Aufträgen, Logbuch, Wracks und Erfolgen, Blender-Modelle)*
  * [`games/pollenflug.html`](games/pollenflug.html) — *Pollenflug 3D (Honigbiene über einer sonnigen Three.js-Wiese: langsam auf Blüten in 4 Farben landen, Pollen-Ladung macht langsamer & schwerer, Aufträge am Bienenkorb, Schwänzeltanz-Minispiel markiert das beste Blumenfeld; Wespe, Spinnennetze & wandernder Regenschauer mit Blatt-Unterständen, 4-Minuten-Tag bis Sonnenuntergang, Blender-Modelle; Upgrade-Shop: Honiggläser für Flügelkraft, Pollenkörbchen, Kräftige Beine, Schnellsammler, Wachsamkeit, Spinnenschere, Regenhaube & Langer Tag)*
  * [`games/echolot.html`](games/echolot.html) — *Echolot 3D: Blinde Fledermaus (stockdunkle Three.js-Höhle, nur Sonar-Pings zeigen die Wände als verblassende Umrisse; Atem-Leiste, laut = mehr sehen aber die Eule hört dich, Motten nur sichtbar wenn sie flattern, Blender-Modelle)*
  * [`games/tresorknacker.html`](games/tresorknacker.html) — *Tresorknacker 3D: Nacht in der Bank (First-Person-Banküberfall bei Nacht: 3 Zahlenschloss-Tresore per Gehör knacken – Stereo-Klick pro Zahl, lauter & höher auf der richtigen; Wachleute mit Taschenlampen-Kegel, Ducken & Rennen mit Lärm-Anzeige, Takt-Laser im Tresorgang, Flucht zum Wagen vor der Dämmerung, Blender-Modelle; Upgrade-Shop: Stethoskop, Leise Sohlen, Schnelle Schuhe, Früher Start, Laser-Brille, Großer Sack & Rauchbomben für die Beute-Kasse)*
  * [`games/seiltaenzer.html`](games/seiltaenzer.html) — *Seiltänzer 3D (Hochseil zwischen Wolkenkratzern in der Abenddämmerung: Neigung als invertiertes Pendel, Gegensteuern mit der Balancierstange, angekündigte Windböen, schwingendes Seil, Tauben auf der Stange, schlaffes Seil & Regen in späteren Spannweiten, Dächer als Checkpoints, Stilpunkte für perfekte Balance, Blender-Modelle, Upgrade-Shop mit Trinkgeld: Stange, Gummisohlen, Windwarner, Taubenschreck, Extra-Versuch, Schnelle Füße, Stil-Trainer, Sicherheitsnetz)*
  * [`games/scharfschuetze.html`](games/scharfschuetze.html) — *Scharfschütze 3D: Ziel-Einsatz (Three.js 3D-Scharfschützen-Schießstand: 11 Zieltypen inkl. Gepanzerten mit Visier-Weakspot, 3D-Drohnen, Explosiv-Fässern, Zivilisten, Gegen-Scharfschützen, Geiselnehmern, Zielpersonen, Deckungsschützen & Bonus-Ballons; FFP-MIL-DOT-Zielfernrohr 4x–12x, 3D-Wind & Kugel-Drop, 3D-Gewehr mit Repetier-Animation, 7 Missionen mit Bonuszielen & Endlos-Modus)*
  * [`games/omaswlan.html`](games/omaswlan.html) — *Omas WLAN (Top-Down-Schleich-Horror im Dunkeln: Handy-Licht mit Sichtlinien-Schatten, Lärm durch Wände & Etagen, knarzende Dielen, Physik-Krempel, Chihuahua-KI mit Leckerli-Ablenkung, Oma-KI mit Taschenlampe & Klo-Gängen, Router-Steck-Minispiel, 3 Nächte inkl. Gewitter)*
  * [`games/heapbreach.html`](games/heapbreach.html) — *HEAP//BREACH (Terminal Architecture Hacking Rogue-lite: Live-Bytecode-Manipulation im CPU-Heap, Pointer-Hijacking, 0xCC-Wall-Allokation & Register-Overflow-Bomben gegen Garbage Collectors, Watchdog Timers & OS Kernels)*
  * [`games/microwave.html`](games/microwave.html) — *Microwave Meltdown: Die Büro-Mikrowelle (High-Stakes Plasma & Kernschmelze-Timing)*
  * [`games/survivor.html`](games/survivor.html) — *Crypt Survivor: Rogue Dawn (Bullet-Heaven Roguelite)*
  * [`games/grundriss.html`](games/grundriss.html) — *Grundriss: Das gezeichnete Herrenhaus (Roguelike-Raum-Drafting, Schritte/Schlüssel/Edelsteine & Sigillen-Deduktion über mehrere Tage)*
  * [`games/spire.html`](games/spire.html) — *Spire of Cards (Deckbuilder)*
  * [`games/neondefense.html`](games/neondefense.html) — *Cyber Defense: Neon Grid (Sci-Fi Tower Defense)*
  * [`games/squidgame.html`](games/squidgame.html) — *Squid Survival 3D: Die 45.6 Mrd. Won Spiele (Three.js-Survival-Show: 5 Minispiele in Low-Poly-3D-Arenen – Rotes Licht mit Wächter-Roboter, Dalgona-Keks, Tauziehen über dem Abgrund, Glasbrücke mit Splitter-Physik, Finale im Regen)*
  * [`games/superhot.html`](games/superhot.html) — *SUPERHOT 2D (Time moves only when you move)*
  * [`games/buckshot.html`](games/buckshot.html) — *Buckshot Roulette*
* **Racing & 3D:**
  * [`games/schrottkiste.html`](games/schrottkiste.html) — *Schrottkiste: Block-Rallye (2D-Seitenansicht im Block-Stil, flüssig in voller Auflösung mit interpolierter Matter.js-Physik und Längslenker-Federung: nur Gas & Rückwärts vom Start ins Ziel, in der Luft kippt man das Auto damit – Saltos geben Punkte, Dauergas löst keinen ungewollten Salto aus; Rampen & Schanzen, Loopings, Treppen, Wippen, Wackelbrücken, Kistenstapel, Fässer & Abrissbirnen; 6 Autos (Käfer, Pickup, Rennwagen, Monstertruck, Kleinbus, Jeep) mit eigener Physik zum Freischalten, 36 Level in 4 Themen, Bestzeiten & Punkte-Rekorde im localStorage, Touch-Pedale)*
  * [`games/gischtjagd.html`](games/gischtjagd.html) — *Gischtjagd 3D (Rennboot-Grand-Prix: Drift-Turbo, Nitro, Schanzen, 3 Strecken, 5 KI-Gegner)*
  * [`games/lokfuehrer.html`](games/lokfuehrer.html) — *ICE-Lokführer 3D: Bitte zurückbleiben! (Führerstand-Simulation, Spline-Gleise, Sifa, Bahnsteighalte & Verspätungen)*
  * [`games/stadiumrush.html`](games/stadiumrush.html) — *Stadium Rush (Polytrack & Trackmania 3D-Zeitfahren, 80 Strecken A01–B80 in 6 Saisons, Online-Multiplayer)*
  * [`games/buerostuhl.html`](games/buerostuhl.html) — *Bürostuhl GP*
  * [`games/skytower.html`](games/skytower.html) — *Sky Tower 3D Stack Master*
  * [`games/kranfuehrer.html`](games/kranfuehrer.html) — *Kranführer 3D (Turmdrehkran: Pendeln abfangen, Bauteile präzise absetzen, Wind & Bauarbeiter, 5 Level)*
* **Klassiker & Puzzles:**
  * [`games/altbaubohrer.html`](games/altbaubohrer.html) — *Altbau-Bohrer 3D: Leitung oder Stein? (First-Person-Heimwerker-Puzzle: Altbau-Wände abklopfen – die Shader-Welle verrät Hohlräume, Rohre & Ständer –, Leitungssucher schwenken, Installationszonen an Steckdosen, Schaltern, Türen & Revisionsklappen lesen, dann mit Drehzahl, Hitze und driftender Lot-Blase senkrecht bohren; Wasserrohr-Fontäne mit Daumen-Minispiel, 230-V-Funken & Sicherungskasten, Bewehrungs-Rückschlag, springende 70er-Fliesen, Mittagsruhe-Nachbarin mit Besen; Dübel wählen, Belastungstest bis zum Abriss und Röntgen-Enthüllung am Ende; 8 Aufträge, Kaution, Sterne, Baumarkt-Upgrades, Spielstand im localStorage)*
  * [`games/schattenkunst.html`](games/schattenkunst.html) — *Schattenkunst 3D: Müll im Rampenlicht (Schattenpuzzle im Künstleratelier: Klobürste, Brezel, Quietscheente, Pümpel & Co. aus Low-Poly-Primitiven vor parallelem Scheinwerfer drehen und schieben, bis der Echtzeit-Schatten ein Motiv ergibt – Sektglas, Segelboot, Tannenbaum, Hasenente; Deckung per IoU-Maskenvergleich mit Live-Balken & Wärmer/Kälter-Ton, ab Werk 6 zweites Motiv auf der Seitenwand, symmetriebewusste Einrast-Hilfe, Tipp-Geisterbild, Rückgängig, Konfetti-Enthüllung, 10 Werke mit Sternen, bissiger Kunstkritiker & Meisterprüfung auf Zeit)*
  * [`games/dominokette.html`](games/dominokette.html) — *Dominokette 3D (Wohnzimmer-Physikpuzzle mit cannon.js: Steine setzen oder als Kurve ziehen, Treppe & Bücher hoch, Finger-Schubs, Zeitlupen-Kamera an der Wellenfront; Klingel, Tasse & Aufziehauto als Ziele, 8 Level mit Sternen, Blender-Modelle; Upgrade-Shop „Bastelladen“ mit Münzen: Extra-Steine, Bauzeit, Ketten-Vorschau, Lineal, Turbo, Sparschwein & Stein-Skins)*
  * [`games/zauberwuerfel.html`](games/zauberwuerfel.html) — *Zauberwürfel 3D (Three.js, 2×2 bis 7×7, animierte Drehungen, Tastatursteuerung mit Ebenenwahl, Tastenhilfe, Timer & Auto-Lösen)*
  * [`games/bubblefusion.html`](games/bubblefusion.html) — *Bubble Fusion (Squishy 2048 im gezeichneten Sobosuba-Stil: verformbare Gelee-Blobs mit leichter Anziehungskraft aus der oberen Reihe in den Behälter schießen und gleiche Zahlen verschmelzen)*
  * Tetris, Snake, 2048, Suika Game, Flappy Bird, Doodle Jump, Breakout, Globle Earth u.v.m.

---

### 🛠️ Web Tools & Air-Gap Utilities
Nützliche Browser-Werkzeuge mit modernem Canvas-, Web Audio- und Sensor-Support:

* **[`audiodecoder/index.html`](audiodecoder/index.html)** — *SignalScope Live (Echtzeit Audio-Empfänger & Multi-Decoder)*: Empfängt Audio live über Mikrofon oder Loopback und dekodiert Morse-Code (CW), DTMF-Touch-Tones, AFSK Text-/Hex-Datenströme, Live-SSTV-Bilder und Frequenzen/Noten in Echtzeit mit Wasserfall-Spektrogramm.
* **[`filetoaudio/index.html`](filetoaudio/index.html)** — *FileTone 2.0 (Acoustic Modem)*: Überträgt Dateien und Text als hochfrequente akustische Datenpakete über Lautsprecher und Mikrofon (Air-Gap Data Transfer mit Reed-Solomon-Fehlerkorrektur).
* **[`qraudio/index.html`](qraudio/index.html)** — *QR Audio Stream*: Optische Daten- und Audioübertragung über animierte QR-Codes per Webcam.
* **[`sbb/index.html`](sbb/index.html)** — *ÖV Verspätungs-Wächter*: Echtzeit-Abfahrten, Störungen & Verspätungen für Schweizer Züge (SBB API).
* **[`git/index.html`](git/index.html)** — *GitHistory 3D*: Interaktive 3D-Visualisierung von Git-Repositories mit Bloom-Shadern.
* **[`pixelfont/index.html`](pixelfont/index.html)** — *8x8 Pixel Font Studio*: Bitmap-Schrifteditor mit CRT-Vorschau und Export.
* **[`tracker/index.html`](tracker/index.html)** — *Satellite Tracker*: Live-Überflugrechner und Weltkarten-Tracking.
* **ConsensusGraph** — *Wissenschaftliche Papers & Studien*: Evidenz- und Konsens-Suche via PubMed ([historie.rwpxe.com](https://historie.rwpxe.com)).
* **[`bitlocker/index.html`](bitlocker/index.html)** — *BitLocker Recovery Screen (Prank)*: Pixelgenauer, rein optischer Nachbau des Windows-BitLocker-Wiederherstellungsbildschirms. Reine Scherz-/Deko-Seite — das Eingabefeld ist kosmetisch, sendet nichts und schaltet nichts frei.

---

### 📚 Schule & Lernen
* **Notenrechner Pro** — *Gewichtete Durchschnitte, Wunschnoten & Prüfungsschnitt nach CH/DE/AT-System ([noten-rechner.ch](https://noten-rechner.ch))*
* **[`franz/index.html`](franz/index.html)** — *Französisch Grammatik-, Verben- & Zahlen-Trainer*

---

## 🚀 Lokale Nutzung

Da alle Spiele und Tools statische Web-Technologien nutzen, ist keine Installation von Node, Python oder externen Datenbanken zwingend erforderlich.

Einfach einen lokalen HTTP-Server im Repository-Root starten:

```bash
# Mit Python 3:
python -m http.server 8000

# Oder mit Node (z.B. npx serve):
npx serve .
```

Anschließend im Browser öffnen:
```
http://localhost:8000/
```

---

## 📁 Projektstruktur

```
├── index.html            # Haupt-Arcade-Hub mit Tabs (Spiele, Tools, Schule) & Suche
├── style.css             # Zentrales Stylesheet für Hub, Navigation & Responsive Grid
├── ideas.md              # Backlog & Notizen für neue Spiel-Ideen
├── src/
│   ├── arcade-core.js    # Globaler Sound-Synthesizer, Highscore-Storage & Pop-Effekte
│   └── favicon.ico       # Arcade-Favicon
├── games/                # Alle eigenständigen HTML5-Spiele (Englisch / Standard)
├── filetoaudio/          # Akustisches Datenmodem (Web Audio FSK / Reed-Solomon)
├── qraudio/              # QR-Code Video-Stream Datenübertragung
├── git/                  # 3D Git-Repository Visualizer
├── sbb/                  # Schweizer ÖV Verspätungs-Monitor
├── tracker/              # Satelliten-Tracker & Orbit-Berechnung
├── pixelfont/            # 8x8 Bitmap Font Editor
└── franz/                # Französisch Lern-App
```

---

## 🌍 Mehrsprachigkeit (i18n)
Der Hub unterstützt flüssiges Umschalten zwischen **Deutsch (DE)** und **Englisch (EN)** mit automatischer Speicherung in `localStorage`. Alle Spiele laufen standardmäßig auf Englisch.
