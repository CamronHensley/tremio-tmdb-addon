const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // Load catalog
  const catalog = await store.get('catalog', { type: 'json' });

  if (!catalog || !catalog.genres) {
    console.log('No catalog found');
    return;
  }

  console.log('SUPERHEROES catalog:\n');

  const superheroes = catalog.genres.SUPERHEROES || [];

  superheroes.forEach((movie, idx) => {
    console.log(`${idx + 1}. ${movie.name} (${movie.releaseInfo})`);
    console.log(`   ID: ${movie.id}`);
    console.log(`   Genres: ${movie.genres?.join(', ') || 'N/A'}`);
    console.log();
  });

  console.log(`\nTotal: ${superheroes.length} movies`);

  // Check for duplicates
  const seen = new Map();
  const duplicates = [];

  superheroes.forEach(movie => {
    if (seen.has(movie.id)) {
      duplicates.push({ id: movie.id, name: movie.name });
    } else {
      seen.set(movie.id, movie.name);
    }
  });

  if (duplicates.length > 0) {
    console.log('\n⚠️  DUPLICATES FOUND:');
    duplicates.forEach(dup => {
      console.log(`   - ${dup.name} (${dup.id})`);
    });
  }

  // Also check classification-state
  const classificationState = await store.get('classification-state', { type: 'json' });

  console.log('\n\nMovies classified as SUPERHEROES in classification-state:');

  const superheroIds = [];
  for (const [movieId, genre] of Object.entries(classificationState.classified)) {
    if (genre === 'SUPERHEROES') {
      superheroIds.push(parseInt(movieId));
    }
  }

  console.log(`\nTotal classified as SUPERHEROES: ${superheroIds.length}`);
  console.log('IDs:', superheroIds.sort((a, b) => a - b).join(', '));
}

main().catch(console.error);
