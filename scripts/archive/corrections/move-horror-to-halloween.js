const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  const halloweenMovies = [
    { id: 2668, name: 'Sleepy Hollow (1999)' },
    { id: 23202, name: 'Trick \'r Treat (2007)' },
    { id: 927, name: 'Gremlins (1984)' }
  ];

  console.log('\nCurrent classifications:\n');
  halloweenMovies.forEach(movie => {
    const genre = classificationState.classified[movie.id.toString()];
    console.log(`${movie.name}: ${genre || 'NOT CLASSIFIED'}`);
  });

  // Move all to SEASONAL
  console.log('\n\nMoving all movies to SEASONAL...\n');
  halloweenMovies.forEach(movie => {
    const oldGenre = classificationState.classified[movie.id.toString()];
    classificationState.classified[movie.id.toString()] = 'SEASONAL';
    console.log(`✓ ${movie.name}: ${oldGenre} → SEASONAL`);
  });

  console.log('\n📤 Uploading to Netlify...');
  await store.setJSON('classification-state', classificationState);

  console.log('✅ All movies moved to SEASONAL\n');
}

main().catch(console.error);
