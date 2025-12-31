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

  console.log('Searching for Frankenweenie in catalog...\n');

  // Search all genres for Frankenweenie
  Object.entries(catalog.genres).forEach(([genreCode, movies]) => {
    movies.forEach(movie => {
      if (movie.name && movie.name.toLowerCase().includes('frankenweenie')) {
        console.log(`Found in ${genreCode}:`);
        console.log(`  ${movie.name} (${movie.releaseInfo})`);
        console.log(`  ID: ${movie.id}`);
        console.log(`  Description: ${movie.description?.substring(0, 100)}...`);
        console.log();
      }
    });
  });

  console.log('Searching for Eternal Sunshine in catalog...\n');

  // Search for Eternal Sunshine
  Object.entries(catalog.genres).forEach(([genreCode, movies]) => {
    movies.forEach(movie => {
      if (movie.name && movie.name.toLowerCase().includes('eternal sunshine')) {
        console.log(`Found in ${genreCode}:`);
        console.log(`  ${movie.name} (${movie.releaseInfo})`);
        console.log(`  ID: ${movie.id}`);
        console.log();
      }
    });
  });
}

main().catch(console.error);
