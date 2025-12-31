const fs = require('fs');

// Read all movies to classify
const moviesToClassify = JSON.parse(fs.readFileSync('next_500_to_classify.json', 'utf-8'));

console.log(`Loaded ${moviesToClassify.length} movies to classify\n`);

// Display in batches for manual classification
const BATCH_SIZE = 50;
let currentBatch = 0;

function displayBatch(batchNum) {
  const start = batchNum * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, moviesToClassify.length);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`BATCH ${batchNum + 1}: Movies ${start + 1}-${end}`);
  console.log(`${'='.repeat(70)}\n`);

  for (let i = start; i < end; i++) {
    const movie = moviesToClassify[i];
    console.log(`${i + 1}. ${movie.name} (${movie.year})`);
    console.log(`   ID: ${movie.movieId}`);
    console.log(`   Genres: ${movie.genres.join(', ')}`);
    console.log(`   Plot: ${movie.plot}`);
    console.log();
  }
}

// Display first batch
displayBatch(0);

console.log(`\nShowing batch 1 of ${Math.ceil(moviesToClassify.length / BATCH_SIZE)}`);
console.log(`\nTo see next batch, modify this script to increment currentBatch`);
