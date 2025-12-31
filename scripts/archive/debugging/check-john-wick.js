const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  const johnWickMovies = [
    { id: 245891, name: 'John Wick (2014)' },
    { id: 324552, name: 'John Wick: Chapter 2 (2017)' },
    { id: 458156, name: 'John Wick: Chapter 3 - Parabellum (2019)' },
    { id: 603692, name: 'John Wick: Chapter 4 (2023)' }
  ];

  console.log('\nCurrent John Wick classifications:\n');
  johnWickMovies.forEach(movie => {
    const genre = classificationState.classified[movie.id.toString()];
    console.log(`${movie.name}: ${genre || 'NOT CLASSIFIED'}`);
  });

  // Move all to ACTION
  console.log('\n\nMoving all John Wick movies to ACTION...\n');
  johnWickMovies.forEach(movie => {
    const oldGenre = classificationState.classified[movie.id.toString()];
    classificationState.classified[movie.id.toString()] = 'ACTION';
    console.log(`✓ ${movie.name}: ${oldGenre} → ACTION`);
  });

  console.log('\n📤 Uploading to Netlify...');
  await store.setJSON('classification-state', classificationState);

  console.log('✅ All John Wick movies moved to ACTION\n');
}

main().catch(console.error);
