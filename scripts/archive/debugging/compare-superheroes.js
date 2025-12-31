const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });
  const catalog = await store.get('catalog', { type: 'json' });

  // Get TMDB IDs classified as SUPERHEROES
  const classifiedSuperheroIds = [];
  for (const [movieId, genre] of Object.entries(classificationState.classified)) {
    if (genre === 'SUPERHEROES') {
      classifiedSuperheroIds.push(parseInt(movieId));
    }
  }

  console.log('TMDB IDs classified as SUPERHEROES in classification-state:');
  console.log(classifiedSuperheroIds.sort((a, b) => a - b));
  console.log();

  // Get what's actually in the catalog
  const catalogSuperheroMovies = catalog.genres.SUPERHEROES || [];

  console.log(`\nMovies in SUPERHEROES catalog: ${catalogSuperheroMovies.length}`);
  catalogSuperheroMovies.forEach((movie, idx) => {
    console.log(`\n${idx + 1}. ${movie.name} (${movie.releaseInfo})`);
    console.log(`   IMDB ID: ${movie.id}`);
    console.log(`   TMDB ID: ${movie.tmdbId || 'N/A'}`);
  });
}

main().catch(console.error);
