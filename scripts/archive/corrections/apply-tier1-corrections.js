const { getStore } = require('@netlify/blobs');
const fs = require('fs');
require('dotenv').config();

async function main() {
  // Load corrections file
  const corrections = JSON.parse(fs.readFileSync('tier1_priority_corrections.json', 'utf-8'));

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📝 APPLYING TIER 1 PRIORITY CORRECTIONS`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Total corrections to apply: ${corrections.length}\n`);

  // Display all corrections
  corrections.forEach((correction, idx) => {
    console.log(`${idx + 1}. ${correction.name} (${correction.year}) [ID: ${correction.movieId}]`);
    console.log(`   Current: ${correction.currentGenre} → Correct: ${correction.correctGenre}`);
    console.log(`   Reason: ${correction.reason}`);
    console.log();
  });

  // Connect to Netlify blob storage
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // Load current classification state
  console.log('📊 Loading current classification state from Netlify...');
  const classificationState = await store.get('classification-state', { type: 'json' });

  // Apply corrections
  let appliedCount = 0;
  let skippedCount = 0;

  corrections.forEach(correction => {
    const movieId = correction.movieId.toString();
    const currentGenre = classificationState.classified[movieId];

    if (currentGenre === correction.currentGenre) {
      classificationState.classified[movieId] = correction.correctGenre;
      appliedCount++;
      console.log(`✓ Corrected ${correction.name}: ${correction.currentGenre} → ${correction.correctGenre}`);
    } else if (currentGenre === correction.correctGenre) {
      console.log(`⊙ Already correct: ${correction.name} is ${currentGenre}`);
      skippedCount++;
    } else {
      console.log(`⚠️  Skipped ${correction.name}: Expected ${correction.currentGenre} but found ${currentGenre}`);
      skippedCount++;
    }
  });

  // Save updated state back to Netlify
  console.log(`\n📤 Uploading corrected classification state to Netlify...`);
  await store.setJSON('classification-state', classificationState);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ CORRECTIONS APPLIED SUCCESSFULLY`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Applied: ${appliedCount}/${corrections.length} corrections`);
  console.log(`Skipped: ${skippedCount}/${corrections.length}`);

  console.log(`\n📊 Updated genre counts:`);

  // Count genres
  const genreCounts = {};
  for (const genre of Object.values(classificationState.classified)) {
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  }

  const relevantGenres = ['ANIMATION_KIDS', 'ANIMATION_ADULT', 'MUSIC', 'SUPERHEROES', 'FAMILY', 'ROMANCE', 'HORROR'];
  relevantGenres.forEach(genre => {
    console.log(`   ${genre}: ${genreCounts[genre] || 0} movies`);
  });

  console.log(`\n📋 NEXT STEPS:`);
  console.log(`   1. Run: node scripts/rebuild-genre-assignments.js`);
  console.log(`   2. Run: npm run update`);
  console.log(`   3. Deploy the updated catalog to production`);
  console.log(`${'='.repeat(70)}\n`);
}

main().catch(console.error);
