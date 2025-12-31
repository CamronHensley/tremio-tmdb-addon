const { getStore } = require('@netlify/blobs');
const fs = require('fs');
require('dotenv').config();

async function main() {
  // Load corrections file
  const corrections = JSON.parse(fs.readFileSync('superhero_corrections.json', 'utf-8'));

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📝 APPLYING SUPERHERO CORRECTIONS`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Total corrections to apply: ${corrections.length}\n`);

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

  corrections.forEach(correction => {
    const movieId = correction.movieId.toString();
    const currentGenre = classificationState.classified[movieId];

    if (currentGenre === correction.currentGenre) {
      classificationState.classified[movieId] = correction.correctGenre;
      appliedCount++;
      console.log(`✓ ${correction.name}: ${correction.currentGenre} → ${correction.correctGenre}`);
    } else {
      console.log(`⚠️  Skipped ${correction.name}: Expected ${correction.currentGenre} but found ${currentGenre}`);
    }
  });

  // Save updated state back to Netlify
  console.log(`\n📤 Uploading corrected classification state to Netlify...`);
  await store.setJSON('classification-state', classificationState);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ CORRECTIONS APPLIED SUCCESSFULLY`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Applied: ${appliedCount}/${corrections.length} corrections`);

  // Count genres
  const genreCounts = {};
  for (const genre of Object.values(classificationState.classified)) {
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  }

  console.log(`\n📊 Updated genre counts:`);
  console.log(`   SUPERHEROES: ${genreCounts.SUPERHEROES || 0} movies`);
  console.log(`   DOCUMENTARY: ${genreCounts.DOCUMENTARY || 0} movies`);

  console.log(`\n📋 NEXT STEPS:`);
  console.log(`   1. Run: node scripts/rebuild-genre-assignments.js`);
  console.log(`   2. Run: npm run update`);
  console.log(`${'='.repeat(70)}\n`);
}

main().catch(console.error);
