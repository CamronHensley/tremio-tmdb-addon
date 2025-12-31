const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const catalog = await store.get('catalog', { type: 'json' });
  const seasonalMovies = catalog.genres.SEASONAL || [];

  console.log('\nSEASONAL MOVIES IN CATALOG:\n');
  console.log('='.repeat(70));

  seasonalMovies.forEach((movie, idx) => {
    console.log(`${idx + 1}. ${movie.name} (${movie.releaseInfo})`);
    console.log(`   ID: ${movie.id}, TMDB: ${movie.tmdbId || 'N/A'}`);
    if (movie.description) {
      console.log(`   Plot: ${movie.description.substring(0, 100)}...`);
    }
    console.log();
  });

  console.log('='.repeat(70));
  console.log(`Total: ${seasonalMovies.length} movies\n`);
}

main().catch(console.error);
