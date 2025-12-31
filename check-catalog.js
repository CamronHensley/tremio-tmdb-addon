const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function check() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const catalog = await store.get('catalog-data', { type: 'json' });

  if (!catalog || !catalog.genres) {
    console.log('No catalog data found');
    return;
  }

  console.log('Genres in catalog:', Object.keys(catalog.genres).length);
  for (const [genreCode, data] of Object.entries(catalog.genres).sort((a,b) => b[1].movies.length - a[1].movies.length)) {
    console.log(`  ${genreCode}: ${data.movies.length} movies`);
  }

  // Check specific movies user mentioned
  console.log('\n\nChecking specific movies:');
  const problematic = {
    '111161': 'Tropic Thunder',
    '458156': 'John Wick 3',
    '926393': 'Equalizer 3',
    '652': 'Troy',
    '1054867': 'One Battle After Another',
    '798645': 'Running Man'
  };

  for (const [id, name] of Object.entries(problematic)) {
    for (const [genre, data] of Object.entries(catalog.genres)) {
      if (data.movies.some(m => m.id === parseInt(id))) {
        console.log(`  ${name} (${id}): found in ${genre}`);
      }
    }
  }
}

check().catch(console.error);
