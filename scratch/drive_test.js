// Start game
await ev("document.getElementById('btn-start-game').click()");
logs.push("game started");

// Step on throttle
for (let i = 0; i < 5; i++) {
  await key('w', 'KeyW', true);
  await sleep(100);
}
logs.push("throttle up");

// Let train accelerate for 12 seconds
for (let s = 0; s < 6; s++) {
  await sleep(2000);
  const info = await ev("({ speed: Math.round(trainSpeed * 3.6), dist: Math.round(trainDist), notch: trainNotch, sifa: Math.round(sifaTimer), score: totalScore, stationIdx: currentStationIdx })");
  logs.push("status: " + JSON.stringify(info));
  // Keep Sifa happy
  await key('q', 'KeyQ', true);
}

await shot("lokfuehrer_driving");
