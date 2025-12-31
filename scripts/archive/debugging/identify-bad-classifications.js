const fs = require('fs');

// Load all the classification files
const next500 = JSON.parse(fs.readFileSync('next_500_to_classify.json', 'utf-8'));
const batch2_1 = require('../next_250_classifications.json');
const batch2_2 = require('../batch_2_remaining_classifications.json');
const batch2_3 = require('../final_160_classifications.json');

const next500Ids = new Set(next500.map(m => m.movieId));
const allBatch2Classified = [...batch2_1, ...batch2_2, ...batch2_3];

// Find movies that are NOT from next_500_to_classify.json
const badClassifications = [];
const seen = new Set();

allBatch2Classified.forEach(m => {
  if (!next500Ids.has(m.movieId) && !seen.has(m.movieId)) {
    badClassifications.push(m.movieId);
    seen.add(m.movieId);
  }
});

console.log(`Found ${badClassifications.length} improperly sourced movie IDs`);

// Save the IDs to delete
fs.writeFileSync('bad_classification_ids.json', JSON.stringify(badClassifications, null, 2));
console.log('Saved to bad_classification_ids.json');

// Also save details for reference
const badDetails = allBatch2Classified
  .filter(m => !next500Ids.has(m.movieId))
  .filter((m, i, arr) => arr.findIndex(x => x.movieId === m.movieId) === i);

fs.writeFileSync('bad_classifications_details.json', JSON.stringify(badDetails, null, 2));
console.log('Saved details to bad_classifications_details.json');
