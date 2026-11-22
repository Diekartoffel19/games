// Tiefenrausch 3D – Spieldaten: Zonen, Erze, Upgrades, Kreaturen, Codex-Texte, Aufträge, Erfolge.
// Tiefen in Metern (Anzeige). Welt: 1 Einheit = DEPTH_SCALE m Tiefe.
(function () {
'use strict';
const ZONES = [
  { id: 'kelp', n: 'Kelpwald', e: '🌿', from: 0, wall: 0x5f7a46, wall2: 0x8a7a52, fog: 0x1f6f86, fogD: 0.012, amb: 1.0,
    ores: { kupfer: 70, eisen: 30 }, life: ['kelpbarsch'], drone: [55, 62], radius: 46 },
  { id: 'coral', n: 'Korallenhang', e: '🪸', from: 150, wall: 0x8a6a5a, wall2: 0xb4705a, fog: 0x14506e, fogD: 0.015, amb: 0.75,
    ores: { kupfer: 25, eisen: 45, silber: 30 }, life: ['riffdruecker', 'muraene'], drone: [49, 55], radius: 40 },
  { id: 'twilight', n: 'Zwielichtzone', e: '🌒', from: 400, wall: 0x46505e, wall2: 0x5d5a70, fog: 0x0a2840, fogD: 0.02, amb: 0.5,
    ores: { eisen: 20, silber: 45, kobalt: 35 }, life: ['laternenfisch', 'leuchtqualle', 'muraene'], drone: [41, 49], radius: 34 },
  { id: 'abyss', n: 'Schwarzer Abgrund', e: '🌑', from: 800, wall: 0x3a3a4a, wall2: 0x4a3c5c, fog: 0x060e20, fogD: 0.026, amb: 0.32,
    ores: { silber: 10, kobalt: 35, mangan: 35, gold: 20 }, life: ['laternenfisch', 'geisterqualle', 'anglerfisch'], drone: [36, 43], radius: 32 },
  { id: 'vents', n: 'Hydrothermale Schlote', e: '🌋', from: 1300, wall: 0x3a2a24, wall2: 0x5a3020, fog: 0x220d08, fogD: 0.025, amb: 0.34,
    ores: { kobalt: 10, gold: 40, titan: 32, feueropal: 18 }, life: ['schlotfisch', 'riesenkalmar', 'geisterqualle'], drone: [33, 40], radius: 36 },
  { id: 'hadal', n: 'Hadal-Graben', e: '🐉', from: 2000, wall: 0x38424a, wall2: 0x2e3440, fog: 0x050a1c, fogD: 0.028, amb: 0.28,
    ores: { gold: 15, titan: 45, feueropal: 22, schwarzperle: 18 }, life: ['schneckenfisch', 'riesenkalmar', 'anglerfisch'], drone: [29, 35], radius: 30 },
  { id: 'maw', n: 'Der Schlund', e: '🕳️', from: 3000, wall: 0x2c2236, wall2: 0x3e2450, fog: 0x10051c, fogD: 0.03, amb: 0.26,
    ores: { titan: 25, feueropal: 28, schwarzperle: 27, leerenkristall: 20 }, life: ['schattenaal', 'geisterqualle', 'riesenkalmar'], drone: [26, 31], radius: 28 },
];

// v = Verkaufswert, h = Bohrzeit (s je Brocken bei Bohrer-Stufe 0), tier = nötige Bohrer-Stufe, shape = Modell
const ORES = {
  kupfer: { n: 'Kupfer', e: '🟠', v: 4, h: 0.8, tier: 0, col: 0xd9773a, shape: 'vein' },
  eisen: { n: 'Eisen', e: '⚫', v: 7, h: 1.0, tier: 0, col: 0x9a8f88, shape: 'vein' },
  silber: { n: 'Silber', e: '⚪', v: 15, h: 1.3, tier: 1, col: 0xdde6f2, shape: 'vein' },
  kobalt: { n: 'Kobalt', e: '🔵', v: 30, h: 1.6, tier: 2, col: 0x3d6dff, shape: 'crystal' },
  mangan: { n: 'Mangan-Knollen', e: '🟤', v: 52, h: 1.2, tier: 3, col: 0x6b4a3a, shape: 'nodule' },
  gold: { n: 'Gold', e: '🟡', v: 95, h: 2.0, tier: 4, col: 0xffc83a, shape: 'vein' },
  titan: { n: 'Titan', e: '🔷', v: 170, h: 2.4, tier: 6, col: 0x9fc6d8, shape: 'crystal' },
  feueropal: { n: 'Feueropal', e: '🔥', v: 300, h: 2.2, tier: 7, col: 0xff5a1e, shape: 'crystal' },
  schwarzperle: { n: 'Schwarzperle', e: '🖤', v: 520, h: 2.8, tier: 9, col: 0x30264a, shape: 'pearl' },
  leerenkristall: { n: 'Leerenkristall', e: '🔮', v: 880, h: 3.4, tier: 11, col: 0xb04dff, shape: 'crystal' },
};

// Druckhülle: Nenntiefe je Stufe (m)
const HULL_DEPTH = [120, 200, 290, 400, 520, 650, 800, 950, 1100, 1300, 1500, 1750, 2000, 2300, 2650, 3050, 3500, 4100, 5000];

// Upgrades: max Stufen, Preis = base * g^Stufe (gerundet), need = nötige Rekordtiefe in m
const UPGRADES = [
  { id: 'hull', e: '🛡️', n: 'Druckhülle', d: 'Größere Nenntiefe – darunter knackt die Hülle', max: HULL_DEPTH.length - 1, base: 45, g: 1.62 },
  { id: 'armor', e: '🧱', n: 'Panzerung', d: 'Mehr Hüllenpunkte', max: 10, base: 40, g: 1.55 },
  { id: 'o2', e: '🫧', n: 'Sauerstofftank', d: 'Längere Tauchgänge', max: 12, base: 30, g: 1.56 },
  { id: 'battery', e: '🔋', n: 'Akku', d: 'Mehr Energie für Licht, Bohrer, Sonar, Turbo', max: 10, base: 35, g: 1.55 },
  { id: 'drill', e: '⛏️', n: 'Bohrer', d: 'Schneller bohren · härtere Erze', max: 12, base: 40, g: 1.57 },
  { id: 'cargo', e: '📦', n: 'Frachtraum', d: 'Mehr Platz für Erz', max: 12, base: 35, g: 1.48 },
  { id: 'engine', e: '⚙️', n: 'Antrieb', d: 'Höheres Tempo', max: 10, base: 35, g: 1.55 },
  { id: 'boost', e: '💨', n: 'Turbo', d: 'Stärkerer, sparsamerer Turbo', max: 6, base: 60, g: 1.7 },
  { id: 'light', e: '🔦', n: 'Scheinwerfer', d: 'Hellerer, weiterer Lichtkegel', max: 6, base: 50, g: 1.7 },
  { id: 'sonar', e: '📡', n: 'Sonar', d: 'Größere Reichweite, weniger Energie', max: 8, base: 45, g: 1.6 },
  { id: 'harpoon', e: '🔱', n: 'Harpune', d: 'Mehr Schaden, schnelleres Nachladen', max: 8, base: 70, g: 1.65, need: 150 },
  { id: 'repair', e: '🩹', n: 'Nanoreparatur', d: 'Hülle repariert sich langsam selbst', max: 6, base: 400, g: 1.9, need: 400 },
  { id: 'buoy', e: '🎈', n: 'Notboje', d: 'B-Taste: sofort mit Fracht auftauchen (je Tauchgang)', max: 3, base: 250, g: 3, need: 200 },
  { id: 'magnet', e: '🧲', n: 'Erzmagnet', d: 'Größerer Bohr- und Sammelradius', max: 5, base: 150, g: 1.9, need: 150 },
  { id: 'thermal', e: '🧯', n: 'Thermoschild', d: 'Schützt vor Hitze an den Schloten', max: 3, base: 3500, g: 2.2, need: 1300 },
  { id: 'drone', e: '🛸', n: 'Bergbau-Drohne', d: 'Bohrt selbstständig Erz in deiner Nähe', max: 4, base: 2200, g: 2.3, need: 650 },
  { id: 'charges', e: '💣', n: 'Wasserbomben', d: 'X-Taste: Sprengladung (Erz + Monster), mehr je Stufe', max: 4, base: 5000, g: 2.0, need: 1100 },
  { id: 'scanner', e: '🛰️', n: 'Tiefenscanner', d: 'Erz und Monster dauerhaft auf dem Radar', max: 1, base: 9000, g: 1, need: 800 },
];

// Effektwerte aus Stufen. L(id) -> Stufe
function stats(L) {
  return {
    rating: HULL_DEPTH[L('hull')],
    hullMax: 100 + 35 * L('armor'),
    o2Max: 90 + 35 * L('o2'),
    batMax: 100 + 55 * L('battery'),
    drillSpeed: 1 + 0.28 * L('drill'), drillTier: L('drill'),
    cargo: 8 + 4 * L('cargo') + (L('cargo') >= 8 ? 4 * (L('cargo') - 7) : 0),
    speed: 7 + 0.85 * L('engine'),
    boostMul: 1.6 + 0.15 * L('boost'), boostDrain: 7 - 0.7 * L('boost'),
    lightRange: 32 + 9 * L('light'), lightPow: 2.0 + 0.3 * L('light'),
    sonarR: 34 + 12 * L('sonar'), sonarCost: Math.max(3, 10 - L('sonar')),
    harpoonDmg: 1 + 0.6 * L('harpoon'), harpoonCD: Math.max(0.35, 1.1 - 0.09 * L('harpoon')),
    repair: 0.35 * L('repair'),
    buoys: L('buoy'),
    reach: 6.5 + 1.2 * L('magnet'), pickup: 3 + 2 * L('magnet'),
    heatK: [1, 0.45, 0.15, 0][L('thermal')],
    drones: L('drone'),
    charges: L('charges') ? 1 + L('charges') : 0,
    scanner: L('scanner') > 0,
  };
}

// Kreaturen: kind steuert die KI; hostile = Harpunen-Ziel
const CREATURES = {
  kelpbarsch: { n: 'Kelpbarsch', kind: 'school', col: 0xc9b25a, glow: 0, size: 0.8 },
  riffdruecker: { n: 'Riffdrücker', kind: 'school', col: 0xff7a4a, glow: 0, size: 0.75 },
  laternenfisch: { n: 'Laternenfisch', kind: 'school', col: 0x6fa8c8, glow: 0x5ff0ff, size: 0.6 },
  schlotfisch: { n: 'Schlotfisch', kind: 'school', col: 0xd06a5a, glow: 0xff9a4a, size: 0.7 },
  schneckenfisch: { n: 'Hadal-Schneckenfisch', kind: 'school', col: 0xe8d8e0, glow: 0, size: 0.7 },
  muraene: { n: 'Muräne', kind: 'eel', hostile: true, hp: 3, dmg: 12, col: 0x5a6a2a, glow: 0, speed: 16 },
  schattenaal: { n: 'Schattenaal', kind: 'eel', hostile: true, hp: 9, dmg: 26, col: 0x1a1024, glow: 0xb04dff, speed: 22 },
  leuchtqualle: { n: 'Leuchtqualle', kind: 'jelly', hostile: true, hp: 2, dmg: 8, col: 0x6fd0ff, glow: 0x4fe0ff },
  geisterqualle: { n: 'Geisterqualle', kind: 'jelly', hostile: true, hp: 4, dmg: 15, col: 0xc08aff, glow: 0xd08aff },
  anglerfisch: { n: 'Anglerfisch', kind: 'angler', hostile: true, hp: 5, dmg: 20, col: 0x3a3440, glow: 0xffe28a, speed: 18 },
  riesenkalmar: { n: 'Riesenkalmar', kind: 'squid', hostile: true, hp: 9, dmg: 4, col: 0xa8424a, glow: 0xff5a7a, speed: 12 },
  leviathan: { n: 'Leviathan', kind: 'boss', hostile: true, hp: 70, dmg: 30, col: 0x2a4a48, glow: 0x6affd0, speed: 20 },
};

// Codex-Texte (Entwurf: agy/Gemini, geprüft)
const TEXT = {"zones":{"kelp":"Sonnenlicht tanzt durch hohe Tangwälder und neugierige Fische mustern dein Bullauge. Hier fühlt sich sogar dein klappriges U-Boot fast sicher an.","coral":"Farbenfrohe Korallenriffe voller Spalten, Höhlen und launischer Bewohner. Wunderschön, solange man nicht den teuren Lack daran abschleift.","twilight":"Das letzte Blau der Sonne verblasst zu kühlem Grau. Ab hier zählt jedes Watt aus der Batterie und jedes unheimliche Knacken im Rumpf doppelt.","abyss":"Ewige Nacht, erhellt vom geisterhaften Glühen fremdartiger Wesen. Wunderschöne Biolumineszenz – auch wenn man nie weiß, was gerade zurückstarrt.","vents":"Kochende Geysire schießen aus schwarzen Schloten in die eisige Tiefe. Ideal zum Schürfen, solange die Hülle nicht wie eine Suppenterrine brodelt.","hadal":"Am tiefsten Grabenrand knarrt der Stahl unter unvorstellbarem Druck. Und irgendwo in der Finsternis zieht ein uralter Gigant seine hungrigen Kreise.","maw":"Jenseits von dreitausend Metern enden alle Karten und jede Vernunft. Ein bodenloser Abgrund, in dem selbst dein Echolot nur zitternd flüstert."},"ores":{"kupfer":"Schimmert grünlich im Scheinwerferlicht und ist weich genug für stumpfe Bohrer. Das Brot-und-Butter-Erz für jede erste Tauchfahrt.","eisen":"Schwer, grau und zuverlässig wie ein alter Schiffsanker. Ohne Eisen bleibt deine Hülle nur eine teure Blechdose.","silber":"Kühler Glanz im trüben Wasser, der sofort die Geldgier der Crew weckt. Leitet Strom hervorragend und bezahlt die nächste Reparaturrechnung.","kobalt":"Tiefblaues Erz mit sturer Härte und ordentlich Energiedichte. Genau das Richtige für Batterien, die nicht schon vor dem Mittagessen schlappmachen.","mangan":"Knolliges Tiefsee-Gestein, das aussieht wie versteinerte Kartoffeln. In der Schmelze wird daraus zäher Stahl gegen fiese Fischzähne.","gold":"Selten, schwer und im Scheinwerferlicht absolut unwiderstehlich. Schon mancher Kapitän hat dafür die Tiefenanzeige gefährlich lange ignoriert.","titan":"Ultraleicht, knochenhart und fast unzerstörbar. Das einzige Material, das zwischen dir und tausenden Tonnen Meerwasser Sinn ergibt.","feueropal":"Glüht im Gestein der Schlote wie gefangene Lava. Hält extreme Hitze aus und sieht im Frachtraum verdammt edel aus.","schwarzperle":"Pechschwarze Kugeln, geformt unter mörderischem Druck. Manche behaupten, sie flüstern im Frachtraum – wahrscheinlich nur der Tiefenrausch.","leerenkristall":"Ein violettschwarzer Kristall, der Licht schluckt und leise summt. Niemand kennt seinen Ursprung, doch an der Oberfläche zahlt man dafür jeden Preis."},"creatures":{"kelpbarsch":"Stolzer Wächter des Tangwalds mit mehr Attitüde als Gewicht. Stupst dein U-Boot neugierig an, bevor er beleidigt im Grün verschwindet.","riffdruecker":"Ein buntes Muskelpaket mit schlechter Laune und Zähnen wie Seitenschneider. Verteidigt seinen Korallenblock notfalls gegen zehn Tonnen Stahl.","muraene":"Lauert schlangenlang in dunklen Felsspalten und schnappt blitzschnell zu. Wer zu nah an die Wand bohrt, holt sich mehr als nur Erz.","laternenfisch":"Trägt seine eigene Taschenlampe am Bauch durch die Zwielichtzone. Leider reicht das Licht gerade so weit, dass er rechtzeitig Panik bekommt.","leuchtqualle":"Schwebt wie eine hübsche Neonlampe durch das Dunkel. Einmal zu nah berührt, verpasst sie deinem ganzen Rumpf einen elektrischen Schlag.","anglerfisch":"Lässt eine verlockend warme Leuchtkugel vor deinem Visier baumeln. Wer ihr blind folgt, landet schnurstracks zwischen nadelscharfen Zähnen.","geisterqualle":"Durchsichtig wie ein böser Gedanke und geladen wie ein Gewitter. Ihre Berührung lässt jede Anzeige im Cockpit gleichzeitig flackern.","schlotfisch":"Tanzt fröhlich zwischen kochenden Schwefelwolken, wo alles andere gegart würde. Sieht ständig aus, als hätte er zu scharf gegessen.","riesenkalmar":"Zehn Meter Muskelmasse und acht Arme voller Saugnäpfe. Wenn er dein U-Boot umklammert, hilft nur noch Vollgas – oder ein gutes Gebet.","schneckenfisch":"Sieht aus wie eine blasse Kaulquappe im Schlafanzug, trotzt aber mühelos jedem Druckrekord. Der heimliche Überlebenskünstler der tiefsten Gräben.","leviathan":"Ein lebender Gebirgszug aus Schuppen, Zähnen und uraltem Zorn. Wenn er im Hadal-Graben das Maul öffnet, wirkt dein U-Boot wie ein Zahnstocher.","schattenaal":"Ein Jäger aus reiner Schwärze, den das Sonar erst meldet, wenn er schon angreift. Im Schlund verfolgt er alles, was noch einen Funken Licht sendet."},"wrecks":{"kelp":{"name":"Fischkutter „Silbermöwe“","text":"Ein umgebauter Kutter, halb begraben unter Schlick und Kelpranken. Statt Fangnetzen hängen noch verrostete Bohrkabel von der Reling.","notes":["Tag 1: Haben den alten Kutter mit Bohrern und billigem Kaffee vollgepackt. Leiter Voss schwört, unter diesem Riff beginnen die sagenhaften Erzadern.","Tag 2: Ein Sog zog uns aufs Riff, doch unsere Tauchkapseln sind noch heil. Niemand kehrt um, solange tief unten noch Reichtum wartet."]},"coral":{"name":"Tauchglocke „Korallenfuchs“","text":"Die gelbe Stahlkugel klemmt schräg zwischen zwei Kalkfelsen fest. Ein zerbrochenes Bullauge dient inzwischen einer Krabbenfamilie als Balkon.","notes":["Tag 4: Steuerbord im Riff verkeilt, weil Steuermann Kalle einem wütenden Drückerfisch auswich. Wenigstens glitzert im Schutt bereits reines Silber.","Tag 5: Voss hat den Tiefenscan entschlüsselt: Unter uns liegen gigantische Titanflöze. Wir lassen die verbeulte Glocke zurück und wechseln ins Beiboot."]},"twilight":{"name":"Forschungs-U-Boot „Dämmerlicht“","text":"Ein schlankes Erkundungsboot, das reglos auf einem Felsvorsprung ruht. Auf dem Bug klebt noch ein verblichener Aufkleber: „Tiefer geht immer“.","notes":["Tag 7: Hier endet das Sonnenlicht. Unsere Scheinwerfer locken nur gefräßige Muränen an, aber die Funkortung von weiter unten wird immer stärker.","Tag 9: Ein Felsbiss hat den Ballasttank aufgeschlitzt. Wir steigen in den Tiefseeschlepper um – Voss behauptet, unten schlagen alle Kompasse verrückt."]},"abyss":{"name":"Tiefseeschlepper „Nachtfalter“","text":"Uralter Stahl, umwickelt von leuchtenden Algen wie ein vergessener Weihnachtsbaum. Die geschmolzenen Sicherungen riechen selbst unter Wasser noch verbrannt.","notes":["Tag 12: Ringsum schwebt kaltes blaues Licht in der Schwärze. Die Crew wird nervös – jemand behauptet, das Dunkel draußen hätte eben zurückgeblinzelt.","Tag 14: Eine Geisterqualle hat unseren Antrieb gegrillt. Statt aufzutauchen, lädt Voss alles ins Reserve-Bathyscaph um und peilt die Schlote an."]},"vents":{"name":"Bergbau-Bathyscaph „Glühwurm“","text":"Rußgeschwärzt und verkrustet von Mineralien steht das Gefährt neben einem rauchenden Schlot. Sein Bohrer steckt noch immer in einer Ader Feueropal.","notes":["Tag 16: Kochendes Wasser umspült die Hülle, während wir Opale schürfen. Endlich bleibt der Kaffee warm, doch dafür lösen sich unsere Gummidichtungen auf.","Tag 18: Die Hitze frisst die Kabel, und tief aus dem Graben grollt ein Schatten auf dem Sonar. Voss lacht nur: Das wahre Erz liegt gleich dahinter."]},"hadal":{"name":"Panzer-Tauchboot „Titan-IX“","text":"Die armdicke Außenhülle trägt drei gewaltige, parallele Bissspuren. Wer auch immer das war, hatte offenbar Hunger auf Dosenfleisch.","notes":["Tag 21: Der Druck lässt die Nieten singen. Eben zog etwas Riesiges am Fenster vorbei – wir hielten es erst für eine Felswand, bis sich ein Auge öffnete.","Tag 22: Der Leviathan hat das Heck zerfetzt und Kalle mitgerissen. Durch eine Felsspalte fliehen wir in der Notkapsel noch weiter hinab."]},"maw":{"name":"Rettungskapsel „Nautilus-0“","text":"Eine winzige, unversehrte Kapsel, die lautlos über dem schwarzen Abgrund schwebt. Keine Kratzer, kein Rost – nur eine offene Luke und eisige Stille.","notes":["Tag 25: Tiefer als jede Karte reicht. Unser Echolot sendet kein Signal mehr aus – es empfängt nur noch Echos, die wie ruhiges Atmen klingen.","Tag 26: Im Schlund pulsiert ein Meer aus Leerenkristallen. Voss öffnet bereits die Luke zu diesem schönen Summen – ich komme gleich nach."]}}};

// Codex: alle Einträge (Zonen, Erze, Kreaturen, Wracks)
const CODEX = [];
ZONES.forEach(z => CODEX.push({ id: 'z_' + z.id, cat: 'Zonen', n: z.e + ' ' + z.n + ' (ab ' + z.from + ' m)', t: TEXT.zones[z.id] }));
Object.keys(ORES).forEach(k => CODEX.push({ id: 'o_' + k, cat: 'Erze', n: ORES[k].e + ' ' + ORES[k].n + ' (' + ORES[k].v + ' Cr)', t: TEXT.ores[k] }));
Object.keys(CREATURES).forEach(k => CODEX.push({ id: 'c_' + k, cat: 'Lebewesen', n: CREATURES[k].n, t: TEXT.creatures[k] }));
ZONES.forEach(z => CODEX.push({ id: 'w_' + z.id, cat: 'Wracks', n: TEXT.wrecks[z.id].name, t: TEXT.wrecks[z.id].text }));

// Erfolge: test(s) bekommt den Spielstand, r = Belohnung
const ACH = [
  { id: 'dive1', n: 'Erster Tauchgang', d: 'Kehre von einem Tauchgang zurück', r: 25, test: s => s.stats.surfaced >= 1 },
  { id: 'd100', n: 'Hundert Meter', d: 'Erreiche 100 m', r: 40, test: s => s.record >= 100 },
  { id: 'd300', n: 'Korallengarten', d: 'Erreiche 300 m', r: 150, test: s => s.record >= 300 },
  { id: 'd600', n: 'Zwielicht', d: 'Erreiche 600 m', r: 500, test: s => s.record >= 600 },
  { id: 'd1000', n: 'Tausender', d: 'Erreiche 1000 m', r: 1500, test: s => s.record >= 1000 },
  { id: 'd1500', n: 'Heißes Wasser', d: 'Erreiche 1500 m', r: 3500, test: s => s.record >= 1500 },
  { id: 'd2000', n: 'Hadal', d: 'Erreiche 2000 m', r: 7000, test: s => s.record >= 2000 },
  { id: 'd3000', n: 'In den Schlund', d: 'Erreiche 3000 m', r: 20000, test: s => s.record >= 3000 },
  { id: 'd4000', n: 'Tiefenrausch', d: 'Erreiche 4000 m', r: 50000, test: s => s.record >= 4000 },
  { id: 'ore100', n: 'Kumpel', d: 'Baue 100 Erzbrocken ab', r: 100, test: s => s.stats.ore >= 100 },
  { id: 'ore1000', n: 'Bergwerksdirektor', d: 'Baue 1000 Erzbrocken ab', r: 2500, test: s => s.stats.ore >= 1000 },
  { id: 'rich10k', n: 'Erste Zehntausend', d: 'Verdiene insgesamt 10.000 Cr', r: 500, test: s => s.stats.earned >= 10000 },
  { id: 'rich250k', n: 'Tiefsee-Tycoon', d: 'Verdiene insgesamt 250.000 Cr', r: 10000, test: s => s.stats.earned >= 250000 },
  { id: 'kill10', n: 'Harpunier', d: 'Erlege 10 Raubtiere', r: 300, test: s => s.stats.kills >= 10 },
  { id: 'kill100', n: 'Schrecken der Tiefe', d: 'Erlege 100 Raubtiere', r: 4000, test: s => s.stats.kills >= 100 },
  { id: 'wreck1', n: 'Schatztaucher', d: 'Plündere ein Wrack', r: 100, test: s => s.stats.wrecks >= 1 },
  { id: 'notes', n: 'Die Voss-Expedition', d: 'Finde alle 14 Logbuchseiten', r: 15000, test: s => Object.keys(s.notes).length >= 14 },
  { id: 'codex50', n: 'Meeresforscher', d: 'Fülle 50 % des Logbuchs', r: 1000, test: s => s.codexPct >= 50 },
  { id: 'codex100', n: 'Ozeanograf', d: 'Fülle das Logbuch vollständig', r: 25000, test: s => s.codexPct >= 100 },
  { id: 'leviathan', n: 'Leviathan-Bezwinger', d: 'Besiege den Leviathan', r: 0, test: s => s.stats.leviathan >= 1 },
  { id: 'contracts10', n: 'Zuverlässig', d: 'Erfülle 10 Aufträge', r: 600, test: s => s.stats.contracts >= 10 },
  { id: 'contracts50', n: 'Vertragspartner', d: 'Erfülle 50 Aufträge', r: 8000, test: s => s.stats.contracts >= 50 },
  { id: 'jackpot', n: 'Glücksader', d: 'Baue eine leuchtende Glücksader ab', r: 300, test: s => s.stats.jackpots >= 1 },
  { id: 'combo15', n: 'Akkordarbeit', d: 'Erreiche eine 15er Bohr-Serie', r: 400, test: s => s.stats.bestCombo >= 15 },
  { id: 'maxall', n: 'Vollausstattung', d: 'Alle Upgrades auf Maximum', r: 0, test: s => s.maxed },
];

window.TR_DATA = { DEPTH_SCALE: 2, ZONES, ORES, HULL_DEPTH, UPGRADES, stats, CREATURES, TEXT, CODEX, ACH };
if (typeof module !== 'undefined') module.exports = window.TR_DATA;
})();
