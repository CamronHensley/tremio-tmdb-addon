const fs = require('fs');

const batch1 = require('./500_classifications.json');
const batch2_1 = require('./next_250_classifications.json');
const batch2_2 = require('./batch_2_remaining_classifications.json');
const batch2_3 = require('./final_160_classifications.json');
const badMovies = require('./bad_classifications_details.json');

const batch1Ids = new Set(batch1.map(m => m.movieId));
const allBatch2 = [...batch2_1, ...batch2_2, ...batch2_3];
const batch2Ids = new Set(allBatch2.map(m => m.movieId));

console.log('Checking where the 232 deleted movies came from...\n');

// Show sample
badMovies.slice(0, 10).forEach(m => {
  const b1 = batch1Ids.has(m.movieId);
  const b2 = batch2Ids.has(m.movieId);
  const source = b1 ? 'BATCH 1' : (b2 ? 'BATCH 2' : 'NEITHER');
  console.log(`${m.movieName} (ID: ${m.movieId}): ${source}`);
});

console.log('\n--- Checking all 232 movies ---');
let inBatch1 = 0;
let inBatch2 = 0;
let inNeither = 0;

badMovies.forEach(m => {
  const b1 = batch1Ids.has(m.movieId);
  const b2 = batch2Ids.has(m.movieId);
  if (b1) inBatch1++;
  if (b2) inBatch2++;
  if (!b1 && !b2) inNeither++;
});

console.log(`In batch 1: ${inBatch1}`);
console.log(`In batch 2: ${inBatch2}`);
console.log(`In neither: ${inNeither}`);
