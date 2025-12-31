const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function check() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const catalog = await store.get('catalog', { type: 'json' });

  console.log('\n=== Searching catalog ===\n');

  let foundBob = false;
  let foundYesterday = false;

  Object.entries(catalog.genres).forEach(([genre, movies]) => {
    movies.forEach(m => {
      if (m.name && m.name.toLowerCase().includes('bob marley')) {
        console.log('Bob Marley found:', m.name, 'in', genre);
        foundBob = true;
      }
      if (m.name && m.name.toLowerCase() === 'yesterday') {
        console.log('Yesterday found:', m.name, 'in', genre);
        foundYesterday = true;
      }
    });
  });

  if (!foundBob) console.log('Bob Marley: Not found in catalog');
  if (!foundYesterday) console.log('Yesterday: Not found in catalog');
}

check().catch(console.error);
