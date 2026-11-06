#!/usr/bin/env node

/**
 * Würfel-Simulator CLI Tool
 * Benutzung: node wuerfel.js <AnzahlWürfe> [Seiten] [WürfelAnzahl]
 * Beispiel: node wuerfel.js 10000 6
 */

const args = process.argv.slice(2);
let rolls = parseInt(args[0], 10);
const sides = parseInt(args[1], 10) || 6;
const diceCount = parseInt(args[2], 10) || 1;

if (isNaN(rolls) || rolls <= 0) {
  if (args.length === 0) {
    rolls = 1000;
    console.log(`Keine Anzahl angegeben. Verwende Standard: ${rolls} Würfe.\n`);
  } else {
    console.error('Ungültige Anzahl von Würfen! Bitte eine positive Ganzzahl angeben.');
    console.error('Beispiel: node wuerfel.js 1000 6');
    process.exit(1);
  }
}

if (sides < 2) {
  console.error('Ein Würfel muss mindestens 2 Seiten haben!');
  process.exit(1);
}

if (diceCount < 1) {
  console.error('Mindestens 1 Würfel erforderlich!');
  process.exit(1);
}

const minVal = diceCount;
const maxVal = diceCount * sides;
const counts = new Map();

for (let i = minVal; i <= maxVal; i++) {
  counts.set(i, 0);
}

// Roll simulation
let sum = 0;
for (let r = 0; r < rolls; r++) {
  let rollSum = 0;
  for (let d = 0; d < diceCount; d++) {
    rollSum += Math.floor(Math.random() * sides) + 1;
  }
  counts.set(rollSum, counts.get(rollSum) + 1);
  sum += rollSum;
}

// Compute theoretical distribution for diceCount dice
function getTheoreticalProbs(nDice, nSides) {
  let dist = { 0: 1 };
  for (let d = 0; d < nDice; d++) {
    const nextDist = {};
    for (const [valStr, count] of Object.entries(dist)) {
      const val = parseInt(valStr, 10);
      for (let s = 1; s <= nSides; s++) {
        const nextVal = val + s;
        nextDist[nextVal] = (nextDist[nextVal] || 0) + count;
      }
    }
    dist = nextDist;
  }
  const totalPossibilities = Math.pow(nSides, nDice);
  const probs = {};
  for (const [valStr, count] of Object.entries(dist)) {
    probs[valStr] = count / totalPossibilities;
  }
  return probs;
}

const theoProbs = getTheoreticalProbs(diceCount, sides);

// Header
console.log('='.repeat(68));
console.log(`🎲 WÜRFEL-SIMULATION: ${rolls.toLocaleString('de-DE')} Würfe (D${sides}${diceCount > 1 ? ', ' + diceCount + ' Würfel' : ''})`);
console.log('='.repeat(68));
console.log(
  'Zahl'.padStart(6) + ' | ' +
  'Häufigkeit'.padStart(12) + ' | ' +
  'Anteil'.padStart(9) + ' | ' +
  'Erwartet'.padStart(9) + ' | ' +
  'Verteilung'
);
console.log('-'.repeat(68));

let maxCount = 0;
let minCount = Infinity;
let mostFrequent = [];
let leastFrequent = [];

for (let i = minVal; i <= maxVal; i++) {
  const c = counts.get(i);
  if (c > maxCount) maxCount = c;
  if (c < minCount) minCount = c;
}

for (let i = minVal; i <= maxVal; i++) {
  const c = counts.get(i);
  if (c === maxCount) mostFrequent.push(i);
  if (c === minCount) leastFrequent.push(i);
}

const BAR_WIDTH = 22;
for (let i = minVal; i <= maxVal; i++) {
  const c = counts.get(i);
  const pct = (c / rolls) * 100;
  const theo = (theoProbs[i] || 0) * 100;
  
  const barFilled = maxCount > 0 ? Math.round((c / maxCount) * BAR_WIDTH) : 0;
  const bar = '█'.repeat(barFilled) + '░'.repeat(BAR_WIDTH - barFilled);

  const numLabel = i.toString().padStart(6);
  const countLabel = c.toLocaleString('de-DE').padStart(12);
  const pctLabel = (pct.toFixed(2) + ' %').padStart(9);
  const theoLabel = (theo.toFixed(2) + ' %').padStart(9);

  console.log(`${numLabel} | ${countLabel} | ${pctLabel} | ${theoLabel} | ${bar}`);
}

console.log('-'.repeat(68));
const mean = (sum / rolls).toFixed(3);
const theoMean = ((diceCount * (sides + 1)) / 2).toFixed(3);

console.log(`Gesamtwürfe:       ${rolls.toLocaleString('de-DE')}`);
console.log(`Mittelwert:        ${mean} (Erwartungswert: ${theoMean})`);
console.log(`Häufigste Zahl:    ${mostFrequent.join(', ')} (${maxCount.toLocaleString('de-DE')}x, ${(maxCount / rolls * 100).toFixed(2)}%)`);
console.log(`Seltenste Zahl:    ${leastFrequent.join(', ')} (${minCount.toLocaleString('de-DE')}x, ${(minCount / rolls * 100).toFixed(2)}%)`);
console.log('='.repeat(68));
