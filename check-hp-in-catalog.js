const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function check() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const catalog = await store.get('catalog', { type: 'json' });

  const hp = new Map();
  Object.entries(catalog.genres).forEach(([genreCode, movies]) => {
    movies.forEach(m => {
      if (m.name && m.name.toLowerCase().includes('harry potter')) {
        if (!hp.has(m.name)) {
          hp.set(m.name, []);
        }
        hp.get(m.name).push(genreCode);
      }
    });
  });

  console.log('\n=== HARRY POTTER MOVIES IN CATALOG ===\n');
  hp.forEach((genres, title) => {
    console.log(`${title}:`);
    console.log(`  Found in: ${genres.join(', ')}`);
    if (genres.length > 1) {
      console.log(`  ⚠️  DUPLICATE - appears in ${genres.length} genres!`);
    }
  });

  console.log(`\nTotal Harry Potter entries: ${hp.size}`);
}

check().catch(console.error);
