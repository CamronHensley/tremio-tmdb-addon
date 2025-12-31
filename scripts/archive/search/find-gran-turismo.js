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
  const classificationState = await store.get('classification-state', { type: 'json' });

  console.log('Searching for Gran Turismo...\n');

  // Search all genres
  Object.entries(catalog.genres).forEach(([genreCode, movies]) => {
    movies.forEach(movie => {
      if (movie.name && movie.name.toLowerCase().includes('gran turismo')) {
        console.log(`Found in ${genreCode}:`);
        console.log(`  ${movie.name} (${movie.releaseInfo})`);
        console.log(`  IMDB ID: ${movie.id}`);
        console.log();
      }
    });
  });

  // Check classification-state
  for (const [movieId, genre] of Object.entries(classificationState.classified)) {
    const fs = require('fs');
    const fullOutput = fs.readFileSync('full_output.txt', 'utf-8');

    if (fullOutput.includes('Gran Turismo') && fullOutput.includes(`ID: ${movieId}`)) {
      console.log(`Gran Turismo classified as: ${genre} (TMDB ID: ${movieId})`);
    }
  }
}

main().catch(console.error);
