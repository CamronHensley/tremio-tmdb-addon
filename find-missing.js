const fs = require('fs');

const next500 = JSON.parse(fs.readFileSync('next_500_to_classify.json', 'utf-8'));
const batch1 = require('./500_classifications.json');
const batch2_1 = require('./next_250_classifications.json');
const batch2_2 = require('./batch_2_remaining_classifications.json');
const batch2_3 = require('./final_160_classifications.json');

const batch1Ids = new Set(batch1.map(m => m.movieId));
const next500Ids = new Set(next500.map(m => m.movieId));
const allBatch2Classified = [...batch2_1, ...batch2_2, ...batch2_3];

console.log('='.repeat(70));
console.log('BATCH ANALYSIS');
console.log('='.repeat(70));
console.log('Batch 1 movies:', batch1.length);
console.log('Next 500 to classify:', next500.length);
console.log('\nBatch 2 classification files total entries:', allBatch2Classified.length);

const uniqueBatch2 = new Set(allBatch2Classified.map(m => m.movieId));
console.log('Unique movies in batch 2 files:', uniqueBatch2.size);

const fromNext500 = allBatch2Classified.filter(m => next500Ids.has(m.movieId));
const uniqueFromNext500 = new Set(fromNext500.map(m => m.movieId));
console.log('\nOf batch 2 classifications, how many are FROM next_500_to_classify.json:', uniqueFromNext500.size);

const notFromNext500 = allBatch2Classified.filter(m => !next500Ids.has(m.movieId));
const uniqueNotFromNext500 = new Set(notFromNext500.map(m => m.movieId));
console.log('Of batch 2 classifications, how many are NOT from next_500_to_classify.json:', uniqueNotFromNext500.size);

console.log('\nWhere did those NOT from next_500 come from?');
const notFromNext500Unique = [];
const seen = new Set();
for (const m of notFromNext500) {
  if (!seen.has(m.movieId)) {
    seen.add(m.movieId);
    notFromNext500Unique.push(m);
  }
}
notFromNext500Unique.slice(0, 20).forEach(m => {
  const inBatch1 = batch1Ids.has(m.movieId);
  console.log(`  - ${m.movieName} (ID: ${m.movieId}) - ${inBatch1 ? 'WAS in batch 1' : 'NOT in batch 1 or next_500'}`);
});

const classifiedIds = new Set(allBatch2Classified.map(m => m.movieId));
const missing = next500.filter(m => !classifiedIds.has(m.movieId));

console.log('\n' + '='.repeat(70));
console.log('MISSING FROM BATCH 2');
console.log('='.repeat(70));
console.log('Movies from next_500_to_classify.json that were NOT classified:', missing.length);

// Export missing movies to file
fs.writeFileSync('remaining_227_to_classify.json', JSON.stringify(missing, null, 2));
console.log('Saved to remaining_227_to_classify.json');
