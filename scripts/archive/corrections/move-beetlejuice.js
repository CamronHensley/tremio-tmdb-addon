const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  const beetlejuiceMovies = [
    { id: 4011, name: 'Beetlejuice (1988)' },
    { id: 917496, name: 'Beetlejuice Beetlejuice (2024)' }
  ];

  console.log('\nCurrent Beetlejuice classifications:\n');
  beetlejuiceMovies.forEach(movie => {
    const genre = classificationState.classified[movie.id.toString()];
    console.log(`${movie.name}: ${genre || 'NOT CLASSIFIED'}`);
  });

  // Move all to SEASONAL
  console.log('\n\nMoving all Beetlejuice movies to SEASONAL...\n');
  beetlejuiceMovies.forEach(movie => {
    const oldGenre = classificationState.classified[movie.id.toString()];
    classificationState.classified[movie.id.toString()] = 'SEASONAL';
    console.log(`✓ ${movie.name}: ${oldGenre} → SEASONAL`);
  });

  console.log('\n📤 Uploading to Netlify...');
  await store.setJSON('classification-state', classificationState);

  console.log('✅ All Beetlejuice movies moved to SEASONAL\n');
}

main().catch(console.error);
