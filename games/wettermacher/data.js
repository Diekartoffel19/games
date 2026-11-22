// Wettermacher 3D – Daten: Kräfte, Himmelsbaum, Inseln, Texte, Balance
(() => {
'use strict';
const D = {};

D.SEASON_LEN = 150;          // Sekunden je Jahreszeit (Jahr = 10 min)
D.DAY_LEN = 50;              // 3 Tage je Jahreszeit
D.CLOUD_Y = 10;
D.SEASONS = [
  { id: 'spring', n: 'Frühling', e: '🌱', evap: 0.0035, grow: 1.1, eat: 1.0, heat: 0, clouds: 0.5, tint: [1, 1, 1] },
  { id: 'summer', n: 'Sommer', e: '☀️', evap: 0.005, grow: 1.2, eat: 1.0, heat: 0, clouds: 0.25, tint: [1.06, 1.02, 0.86] },
  { id: 'autumn', n: 'Herbst', e: '🍂', evap: 0.0028, grow: 0.8, eat: 1.0, heat: 0.4, clouds: 0.7, tint: [1.12, 0.9, 0.68] },
  { id: 'winter', n: 'Winter', e: '❄️', evap: 0.001, grow: 0, eat: 1.1, heat: 1, clouds: 0.5, tint: [0.9, 0.95, 1.02] },
];

// Wetterkräfte: Taste = Index+1. cost: einmalig, costS: pro Sekunde, costD: pro Welteinheit Wischweg
D.POWERS = [
  { id: 'cloud', e: '☁️', n: 'Wolke', key: '1', costD: 0.55, d: 'Übers Meer ziehen sammelt Feuchtigkeit. Wolken greifen und schieben.' },
  { id: 'rain', e: '🌧️', n: 'Regen', key: '2', costS: 1.2, d: 'Auf einer Wolke gedrückt halten lässt sie abregnen. Ziehen lenkt den Schauer.' },
  { id: 'sun', e: '☀️', n: 'Sonne', key: '3', cost: 4, costS: 6, d: 'Wolken wegschnippen – oder auf dem Boden halten: Sonnenstrahl wärmt, trocknet, lässt reifen.' },
  { id: 'wind', e: '💨', n: 'Wind', key: '4', costD: 0.9, d: 'Wischen erzeugt Böen: Mühle, Schiffe, Heuschrecken, Wolken, Feuer, Samen.' },
  { id: 'bolt', e: '⚡', n: 'Blitz', key: '5', cost: 18, d: 'Braucht eine dunkle Gewitterwolke in der Nähe. Ziel antippen. Vorsicht mit Dorf & Wald!' },
  { id: 'snow', e: '❄️', n: 'Schnee', key: '6', costS: 2.5, skill: 'w5', d: 'Auf einer Wolke halten: Schnee löscht Feuer, friert Heuschrecken ein, kühlt Vorräte.' },
  { id: 'rainbow', e: '🌈', n: 'Regenbogen', key: '7', cost: 40, skill: 's3', d: 'Nach einem Schauer bei Sonne antippen: Freude, Fest & Touristen.' },
  { id: 'fog', e: '🌫️', n: 'Nebel', key: '8', costD: 1.1, skill: 'w4', d: 'Nebelbänke malen: Piraten verirren sich darin. Tau befeuchtet Felder.' },
  { id: 'tornado', e: '🌪️', n: 'Tornado', key: '9', cost: 60, costS: 4, skill: 'v4', d: 'Gedrückt halten und lenken: zerschmettert alles – auch Eigenes!' },
];

// Himmelsbaum. c: Kosten je Stufe, req: Voraussetzung (id oder [id, Stufe])
D.SKILLS = [
  { id: 'w1', b: 0, e: '🌀', n: 'Saugkraft', d: 'Wolken laden sich 30 % schneller auf.', c: [15, 45, 110] },
  { id: 'w2', b: 0, e: '☁️', n: 'Wolkenfelder', d: '+2 Wolken gleichzeitig am Himmel.', c: [30, 90], req: 'w1' },
  { id: 'w3', b: 0, e: '🌦️', n: 'Sanfter Landregen', d: 'Regen fällt breiter und überschwemmt seltener.', c: [60], req: 'w1' },
  { id: 'w5', b: 0, e: '❄️', n: 'Schneeflocken', d: 'Neue Kraft: Schnee.', c: [80], req: 'w1' },
  { id: 'w4', b: 0, e: '🌫️', n: 'Nebelbank', d: 'Neue Kraft: Nebel.', c: [120], req: 'w2' },
  { id: 'w6', b: 0, e: '💧', n: 'Morgentau', d: 'Nachts befeuchtet Tau alle Felder ein wenig.', c: [200], req: 'w3' },
  { id: 's1', b: 1, e: '🔆', n: 'Brennglas', d: 'Sonnenstrahl wirkt 35 % stärker und kostet weniger.', c: [15, 50, 120] },
  { id: 's2', b: 1, e: '🌻', n: 'Wärmende Strahlen', d: 'Sonnige Felder wachsen 15 % schneller.', c: [40, 120], req: 's1' },
  { id: 's3', b: 1, e: '🌈', n: 'Regenbogen', d: 'Neue Kraft: Regenbogen.', c: [100], req: 's1' },
  { id: 's4', b: 1, e: '🌾', n: 'Goldene Ernte', d: 'Ernten bringen 20 % mehr Nahrung.', c: [80, 200], req: 's2' },
  { id: 's5', b: 1, e: '🎉', n: 'Sonnenwende', d: 'Feste und Regenbögen schenken doppelten Glauben.', c: [250], req: 's3' },
  { id: 'v1', b: 2, e: '💨', n: 'Böenkraft', d: 'Böen sind 30 % stärker und breiter.', c: [15, 45, 110] },
  { id: 'v5', b: 2, e: '🌬️', n: 'Passatwind', d: 'Die Mühle dreht nach einer Böe doppelt so lange.', c: [60], req: 'v1' },
  { id: 'v3', b: 2, e: '🌱', n: 'Samenflug', d: 'Böen über dem Wald säen neue Bäume.', c: [50], req: 'v1' },
  { id: 'v2', b: 2, e: '⛵', n: 'Seemannswind', d: 'Handelsschiffe bringen 50 % mehr Waren.', c: [70], req: 'v5' },
  { id: 'v4', b: 2, e: '🌪️', n: 'Windhose', d: 'Neue Kraft: Tornado.', c: [300], req: ['v1', 3] },
  { id: 'b1', b: 3, e: '🎯', n: 'Zielsicher', d: 'Blitze treffen genauer und reichen weiter.', c: [20, 70] },
  { id: 'b4', b: 3, e: '🥁', n: 'Donnerhall', d: 'Piraten fliehen schon nach dem ersten Treffer.', c: [90], req: 'b1' },
  { id: 'b5', b: 3, e: '🗼', n: 'Blitzableiter', d: 'Fehlblitze setzen keine Häuser mehr in Brand.', c: [130], req: 'b1' },
  { id: 'b3', b: 3, e: '🧊', n: 'Hagelschlag', d: 'Blitz-Modus: auf Gewitterwolke halten lässt es hageln.', c: [120], req: 'b4' },
  { id: 'b2', b: 3, e: '⛓️', n: 'Kettenblitz', d: 'Blitze springen auf eine zweite Bedrohung über.', c: [150], req: 'b3' },
  { id: 'g1', b: 4, e: '🫁', n: 'Tiefer Atem', d: '+20 maximale Wetterkraft.', c: [20, 50, 100, 180, 300] },
  { id: 'g2', b: 4, e: '🧘', n: 'Ruhiger Geist', d: 'Wetterkraft lädt 15 % schneller.', c: [25, 60, 120, 200, 320] },
  { id: 'g3', b: 4, e: '🙏', n: 'Gebete', d: '+25 % Glaube aus erfüllten Wünschen.', c: [40, 100, 220], req: 'g2' },
  { id: 'g4', b: 4, e: '🔮', n: 'Vorahnung', d: 'Wünsche warten länger, Gefahren werden früher angekündigt.', c: [60], req: 'g1' },
  { id: 'g5', b: 4, e: '🛕', n: 'Pilgerfahrt', d: 'Tempel anderer Inseln schicken doppelte Pilgergaben.', c: [250], req: 'g3' },
];
D.BRANCHES = [['☁️', 'Wolken'], ['☀️', 'Sonne'], ['💨', 'Wind'], ['⚡', 'Sturm'], ['✨', 'Geist']];

// Inseln: model, Klima-Modifikatoren, Dorfmitte (Three-Koordinaten x,z), Hafen-Winkel, Ziel
D.ISLANDS = [
  { id: 'wiege', n: 'Grüne Wiege', e: '🌿', model: 'island_meadow', village: [2, 1.5], cove: 0, temple: [-5.5, -4.5], light: 2.4,
    evap: 1, grow: 1, warm: 1, natClouds: 1, trees: ['oak', 'oak', 'poplar', 'pine'], grass: null, faithK: 1,
    threats: ['locusts', 'pirates', 'fire', 'serpent', 'drought', 'storm'], goal: { pop: 30, b: ['temple'] },
    goalTxt: 'Tempel bauen & 30 Bewohner', sky: ['#7ec8f0', '#d7f0ff'] },
  { id: 'glut', n: 'Glutpalme', e: '🌋', model: 'island_volcano', village: [3, -1], cove: -0.2, temple: [1, -7], volcano: [-5.5, 2.5], light: 2.0,
    evap: 1.35, grow: 1.15, warm: 0, natClouds: 1.3, tropical: true, trees: ['palm', 'palm', 'oak', 'bush'], faithK: 1.25,
    threats: ['locusts', 'pirates', 'fire', 'serpent', 'monsoon', 'volcano'], goal: { pop: 36, b: ['temple', 'lighthouse'] },
    goalTxt: 'Tempel, Leuchtturm & 36 Bewohner', sky: ['#5fc6e8', '#e8fbff'] },
  { id: 'frost', n: 'Frostzahn', e: '🏔️', model: 'island_crag', village: [3, 1], cove: 0.1, temple: [-4, 5], light: 2.8,
    evap: 0.7, grow: 0.8, warm: 2, natClouds: 1, polar: true, trees: ['pine', 'pine', 'pine', 'poplar'],
    grass: [[0.86, 0.9, 0.95], [0.62, 0.72, 0.62]], faithK: 1.5,
    threats: ['pirates', 'fire', 'serpent', 'blizzard', 'storm'], goal: { pop: 34, b: ['temple', 'lighthouse'] },
    goalTxt: 'Tempel, Leuchtturm & 34 Bewohner', sky: ['#8fb8e0', '#eef6ff'] },
  { id: 'sand', n: 'Sandkrone', e: '🏜️', model: 'island_dune', village: [3, -1], cove: -0.1, temple: [-6, -3], light: 2.2,
    evap: 1.8, grow: 1.1, warm: 0.5, natClouds: 0.35, desert: true, trees: ['palm', 'cactus', 'palm', 'bush'], faithK: 1.75,
    threats: ['locusts', 'pirates', 'fire', 'sandstorm', 'drought'], goal: { pop: 40, b: ['temple', 'lighthouse'] },
    goalTxt: 'Tempel, Leuchtturm & 40 Bewohner', sky: ['#f0c890', '#fff3dc'] },
  { id: 'sturm', n: 'Sturmhorn', e: '⛈️', model: 'island_crag', village: [3, 1], cove: 0.1, temple: [-4, 5], light: 2.8, rot: 2.2,
    evap: 0.9, grow: 0.95, warm: 1.2, natClouds: 1.6, stormy: true, trees: ['pine', 'oak', 'pine', 'poplar'],
    grass: [[0.42, 0.62, 0.4], [0.3, 0.45, 0.3]], faithK: 2,
    threats: ['pirates', 'fire', 'serpent', 'storm', 'boss', 'locusts'], goal: { pop: 45, b: ['temple', 'lighthouse'], boss: true },
    goalTxt: 'Den Sturmgeist besiegen & 45 Bewohner', sky: ['#6f8aa8', '#c9d6e4'] },
];

// Gebäude. cap: Wohnplätze, r: Platzbedarf, wood: Baukosten
D.BUILD = {
  hut: { n: 'Hütte', cap: 3, r: 1.0, wood: 8 },
  house: { n: 'Fachwerkhaus', cap: 5, r: 1.1, wood: 14 },
  manor: { n: 'Gutshaus', cap: 8, r: 1.25, wood: 26 },
  field: { n: 'Feld', r: 1.6, wood: 5 },
  well: { n: 'Zisterne', r: 0.8, wood: 6 },
  maypole: { n: 'Festplatz', r: 1.2, wood: 6 },
  mill: { n: 'Windmühle', r: 1.0, wood: 16 },
  harbour: { n: 'Hafen', r: 2.0, wood: 20 },
  granary: { n: 'Kornspeicher', r: 1.0, wood: 15 },
  temple: { n: 'Wettertempel', r: 1.7, wood: 40 },
  lighthouse: { n: 'Leuchtturm', r: 1.2, wood: 30 },
};
// Bauplan (außer Wohnhäusern & Feldern, die bedarfsgesteuert entstehen): [typ, Mindestbevölkerung]
D.PLAN = [['maypole', 6], ['mill', 7], ['harbour', 11], ['granary', 13], ['well', 16], ['temple', 20], ['lighthouse', 24], ['granary', 30], ['well', 34]];

D.BAL = {
  eat: 0.028, drink: 0.012, heat: 0.018, fieldYield: 10, growBase: 1 / 70, popTick: 16, starveTick: 20,
  manaBase: 100, manaRegen: 3.2, cloudMaxBase: 4, rainRate: 0.13, rainUse: 0.075, floodAt: 1.05, dryAt: 0.12,
  woodPerTree: 6, chop: 0.15, fish: 0.06, tradeWood: 18, tradeFood: 14,
};

// Wünsche (Sprechblasen) – Texte von agy, überarbeitet
D.REQ = {
  rain: ['Unser Weizen hat Durst, Wettergeist!', 'Ein kleiner Schauer fürs Feld, bitte!', 'Gieß doch bitte unser Feld!', 'Regen fürs Feld? Der Boden staubt!',
    'Ohne Regen wird das nur Knäckebrot.', 'Schick uns eine Regenwolke, bitte!', 'Der Weizen träumt von Regentropfen.', 'Ein paar Tropfen aufs Korn, bitte!'],
  sun: ['Sonne bitte, die Ernte will reifen!', 'Lass die Ähren in der Sonne reifen!', 'Mehr Sonne, sonst reift hier nichts!', 'Gib den Ähren goldene Farbe!',
    'Die Ernte fröstelt im grauen Schatten.', 'Ein bisschen Sonnenschein fürs Feld!', 'Das Korn wartet auf ein Sonnenbad.'],
  wind: ['Die Mühle steht still! Pust mal!', 'Mehr Wind für die Mühlenflügel!', 'Ohne Wind gibt es kein frisches Mehl.', 'Dreh die Mühle an, Wettergeist!',
    'Flaute! Die Mühle braucht Schwung.', 'Schick der Mühle eine steife Brise!'],
  ship: ['Puste das Handelsschiff in den Hafen!', 'Gib dem Schiff Wind Richtung Hafen!', 'Füll die Segel! Wir warten auf Waren!', 'Weh den Händler sicher an den Kai!', 'Flaute vorm Hafen! Schubs die Segel!'],
  rainbow: ['Ein Regenbogen fürs Fest, Wettergeist!', 'Mal uns einen Regenbogen!', 'Zum Feiern fehlt ein Regenbogen!', 'Kein Dorffest ohne Regenbogen!'],
  snow: ['Schneeflocken fürs Winterfest, bitte!', 'Ein Winterfest ohne Schnee? Geht nicht!', 'Wir wollen Schneemänner bauen!', 'Ein weißer Mantel fürs Winterfest!'],
  fest: ['Viel Sonnenschein fürs Erntefest!', 'Beim Erntefest muss die Sonne lachen!', 'Kein Wölkchen überm Festplatz, bitte!', 'Sonnenglanz fürs große Erntefest!'],
  fire: ['Feuer! Lösch es mit Regen!', 'Es brennt! Schnell, eine Regenwolke!', 'Hilfe, die Flammen kommen näher!'],
  pirates: ['Piraten! Vertreib sie, Wettergeist!', 'Ein Piratenschiff! Blitz oder Nebel, schnell!', 'Die Piraten wollen unsere Vorräte!'],
  locusts: ['Heuschrecken! Puste sie aufs Meer!', 'Die Plage frisst unser Korn!', 'Wind oder Blitz – weg mit dem Schwarm!'],
  serpent: ['Die Seeschlange! Blitz sie weg!', 'Ein Ungeheuer frisst unsere Fischerboote!'],
  warm: ['Brrr! Sonne fürs Dorf, bitte!', 'Wärm uns ein bisschen auf!'],
};
D.THANKS = ['Danke, lieber Wettergeist!', 'Genau das haben wir gebraucht!', 'Hoch lebe der Wettergeist!', 'Du bist der beste Geist am Himmel!', 'Perfektes Timing! Tausend Dank!',
  'Wie bestellt! Wundervoll!', 'Die Insel jubelt dir zu!', 'Besser geht Wetter nicht!', 'Was für ein Glück mit dir!', 'Danke, du himmlischer Helfer!'];
D.COMPLAIN = {
  flood: ['Hilfe, das Feld wird zum Ententeich!', 'Genug gegossen! Alles matscht!'],
  dry: ['Hier vertrocknet sogar das Unkraut!', 'Staub im Hals und Risse im Acker!'],
  bolt: ['Vorsicht! Blitz mitten ins Dorf!', 'He! Unsere Hütte braucht keinen Blitz!'],
  cold: ['Brrr! Meine Nase wird zum Eiszapfen!', 'Bibberkalt hier!'],
  hunger: ['Mein Bauch knurrt lauter als Donner!', 'Hunger! Die Speisekammer ist leer!'],
  thirst: ['Die Zisterne ist leer!', 'Wasser! Wir brauchen Regen!'],
  fail: ['Schade… vielleicht nächstes Mal.', 'Der Wettergeist hört uns wohl nicht.', 'Na gut, dann eben nicht.'],
};

// Tutorial-Hinweise (Reihenfolge = Fortschritt). k: Auslöser-Schlüssel, den main.js prüft
D.HINTS = [
  { k: 'cloud', t: '☁️ Halte die Maus gedrückt und kreise über dem <b>Meer</b> – so saugst du Feuchtigkeit in eine Wolke.' },
  { k: 'move', t: 'Schieb die Wolke über das <b>durstige Feld</b> (die Sprechblase zeigt es dir).' },
  { k: 'rain', t: '🌧️ Wähle <b>Regen</b> (Taste 2) und halte auf der Wolke gedrückt. Ziehen lenkt den Schauer – aber nicht zu viel!' },
  { k: 'camera', t: '🧭 Kamera: <b>rechte Maustaste</b> / zwei Finger drehen, <b>Mausrad</b> / Pinch zoomt, Q/E drehen.' },
  { k: 'sun', t: '☀️ <b>Sonne</b> (3): Wolken schnell wegschnippen – oder auf einem Feld halten für einen wärmenden Sonnenstrahl.' },
  { k: 'wind', t: '💨 <b>Wind</b> (4): Wisch schwungvoll über die Insel. Mühlen, Segel und Bäume lieben das.' },
  { k: 'faith', t: '✨ Du hast Glauben gesammelt! Öffne den <b>Himmelsbaum</b> (T) und lerne neue Wetterkunst.' },
  { k: 'bolt', t: '⚡ <b>Blitz</b> (5) braucht eine dunkle, schwere Gewitterwolke in der Nähe. Dann das Ziel antippen.' },
  { k: 'season', t: '🍂 Jede Jahreszeit will anderes Wetter: Sommer dörrt, Herbst stürmt, im Winter ruhen die Felder.' },
  { k: 'mana', t: '💙 Wetterkraft lädt von selbst – glückliche Inselbewohner beschleunigen sie.' },
];

D.SEASON_TXT = [
  'Der Frühling erwacht: sanfter Regen und milde Sonne lassen die Saat sprießen.',
  'Im Sommer glüht die Luft: viel Sonne für die Ernte – aber lass nichts vertrocknen.',
  'Der Herbst weht heran: letzte Ernte, kräftiger Wind für die Mühle, Stürme ziehen auf.',
  'Der Winter legt sich übers Land: die Felder ruhen, das Dorf braucht Wärme – und Schnee zum Fest.',
];
D.ISLAND_TXT = [
  'Willkommen auf der Grünen Wiege, deiner sanften Startinsel mit mildem Klima für erste Wetterkunst.',
  'Glutpalme lockt mit Tropenhitze, wilden Monsunen und einem Vulkan mit sehr heißem Temperament.',
  'Frostzahn glänzt unter Polarlichtern im ewigen Eis und verlangt von dir wärmendes Feingefühl.',
  'Auf der Wüsteninsel Sandkrone lechzt jeder Halm nach deiner liebevollen Bewässerung.',
  'An Sturmhorns wilder Küste neckt dich ein rivalisierender Sturmgeist mit frechen Böen.',
];

// Gefahren-Ankündigungen
D.THREAT_TXT = {
  locusts: ['🦗 Heuschreckenplage!', 'Puste den Schwarm mit Wind aufs Meer oder triff ihn mit Blitz/Schnee.'],
  pirates: ['🏴‍☠️ Piraten in Sicht!', 'Blitze versenken sie, Nebel verwirrt sie, Wind treibt sie zurück.'],
  serpent: ['🐉 Die Seeschlange taucht auf!', 'Drei Blitztreffer vertreiben sie – sonst frisst sie Boote.'],
  drought: ['🔥 Dürre!', 'Die Sonne brennt doppelt. Sammle Wolken und gieß die Felder.'],
  storm: ['⛈️ Ein Sturm zieht auf!', 'Fremde Gewitterwolken – puste sie weg oder nutze sie für deine Blitze.'],
  monsoon: ['🌊 Monsun!', 'Schwere Regenwolken treiben heran. Lenke sie weg, bevor die Felder ertrinken.'],
  volcano: ['🌋 Der Vulkan grollt!', 'Lavabrocken entzünden den Wald. Halte Regenwolken bereit.'],
  sandstorm: ['🏜️ Sandsturm!', 'Gegenwind bremst ihn, nasser Boden schützt die Felder.'],
  blizzard: ['🌨️ Schneesturm!', 'Eisige Kälte. Ein Sonnenstrahl aufs Dorf wärmt die Leute.'],
  boss: ['👁️ Der Sturmgeist Borrasco!', 'Ein rivalisierender Wettergeist! Triff sein Auge mit Blitzen, wenn es offen ist.'],
};

// Chronik: id, Titel, Text; Bedingungen prüft main.js über check(id)
D.CHRONIK = [
  ['firstCloud', 'Erste Wolke', 'Du hast deine erste Wolke aus dem Meer gezogen.'],
  ['firstRain', 'Segensregen', 'Dein erster Regen fiel auf durstige Felder.'],
  ['firstWish', 'Erhörtes Gebet', 'Der erste Wunsch der Inselleute ging in Erfüllung.'],
  ['firstHarvest', 'Erste Ernte', 'Das Dorf hat seine erste Ernte eingefahren.'],
  ['firstSkill', 'Himmelsschüler', 'Du hast deine erste Kunst im Himmelsbaum gelernt.'],
  ['pop10', 'Ein kleines Dorf', '10 Menschen leben auf deiner Insel.'],
  ['mill', 'Mehl im Wind', 'Die erste Windmühle dreht sich.'],
  ['firstFest', 'Erstes Erntefest', 'Unter strahlender Sonne tanzte das Dorf um den Maibaum.'],
  ['harbour', 'Ahoi!', 'Der Hafen ist fertig – die Boote fahren aus.'],
  ['firstShip', 'Erstes Handelsschiff', 'Dein Wind brachte ein Handelsschiff sicher in den Hafen.'],
  ['firstYear', 'Ein volles Jahr', 'Die Insel hat ihr erstes Jahr unter deinem Himmel überstanden.'],
  ['firstBolt', 'Donnerwetter', 'Dein erster Blitz zuckte vom Himmel.'],
  ['pirates', 'Piratenschreck', 'Ein Piratenschiff sank oder floh vor deinem Zorn.'],
  ['locusts', 'Plage gebannt', 'Ein Heuschreckenschwarm wurde vertrieben.'],
  ['fireOut', 'Feuerwehr des Himmels', 'Du hast einen Brand gelöscht.'],
  ['temple', 'Wettertempel', 'Die Menschen bauten dir einen Tempel.'],
  ['pop30', 'Blühendes Dorf', '30 Menschen leben auf einer deiner Inseln.'],
  ['serpent', 'Schlangenbändiger', 'Die Seeschlange ist geflohen.'],
  ['rainbow', 'Farbenpracht', 'Dein erster Regenbogen spannte sich über die Insel.'],
  ['lighthouse', 'Leuchtfeuer', 'Ein Leuchtturm weist den Schiffen den Weg.'],
  ['island2', 'Neue Ufer', 'Du hast eine zweite Insel betreten.'],
  ['tornado', 'Windhose', 'Dein erster Tornado wirbelte übers Meer.'],
  ['bigStorm', 'Der große Sturm', 'Du hast einen Sturm überstanden.'],
  ['volcano', 'Feuerberg', 'Der Vulkan hat sich wieder beruhigt.'],
  ['aurora', 'Polarlicht', 'Unter klarem Nachthimmel tanzten Polarlichter.'],
  ['sandstorm', 'Sandbändiger', 'Ein Sandsturm zog vorüber, ohne die Felder zu begraben.'],
  ['pop100', 'Hundert Seelen', 'Auf all deinen Inseln leben zusammen 100 Menschen.'],
  ['boss', 'Herr des Himmels', 'Der Sturmgeist Borrasco ist besiegt.'],
  ['allIslands', 'Archipel', 'Alle fünf Inseln blühen unter deinem Wetter.'],
  ['treeDone', 'Meister des Wetters', 'Du hast jede Kunst des Himmelsbaums gemeistert.'],
];

window.WM_DATA = D;
})();
