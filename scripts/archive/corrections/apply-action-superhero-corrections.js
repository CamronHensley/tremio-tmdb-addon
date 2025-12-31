const { getStore } = require('@netlify/blobs');
const fs = require('fs');
require('dotenv').config();

async function main() {
  const corrections = JSON.parse(fs.readFileSync('action_superhero_corrections_verified.json', 'utf-8'));

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📝 FIXING SUPERHERO MOVIES IN ACTION`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Total corrections: ${corrections.length}\n`);

  corrections.forEach((c, idx) => {
    console.log(`${idx + 1}. ${c.name} (${c.year}) [ID: ${c.movieId}]`);
    console.log(`   ${c.currentGenre} → ${c.correctGenre}`);
    console.log();
  });

  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  console.log('📊 Loading classification state...');
  const classificationState = await store.get('classification-state', { type: 'json' });

  let appliedCount = 0;

  corrections.forEach(correction => {
    const movieId = correction.movieId.toString();
    const currentGenre = classificationState.classified[movieId];

    if (currentGenre === correction.currentGenre) {
      classificationState.classified[movieId] = correction.correctGenre;
      appliedCount++;
      console.log(`✓ ${correction.name}: ${correction.currentGenre} → ${correction.correctGenre}`);
    } else {
      console.log(`⚠️  ${correction.name}: Expected ${correction.currentGenre} but found ${currentGenre}`);
    }
  });

  console.log(`\n📤 Uploading to Netlify...`);
  await store.setJSON('classification-state', classificationState);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ Applied ${appliedCount}/${corrections.length} corrections`);
  console.log(`${'='.repeat(70)}\n`);
}

main().catch(console.error);
