const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function check() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const state = await store.get('classification-state', { type: 'json' });
  const catalog = await store.get('catalog', { type: 'json' });

  console.log('\n=== Star Trek Beyond (ID 188927) ===\n');

  const classification = state.classified['188927'];
  console.log('Classification in classification-state:', classification || 'NOT CLASSIFIED');

  let foundIn = [];
  Object.entries(catalog.genres).forEach(([genre, movies]) => {
    const found = movies.find(m => {
      const tmdbId = m.tmdbId || (m.id && m.id.replace('tmdb:', ''));
      return tmdbId == 188927;
    });
    if (found) {
      foundIn.push({ genre, movie: found });
    }
  });

  if (foundIn.length > 0) {
    console.log('\nFound in catalog:');
    foundIn.forEach(f => {
      console.log(`  Genre: ${f.genre}`);
      console.log(`  Movie name: ${f.movie.name}`);
      console.log(`  Movie ID: ${f.movie.id}`);
    });
  } else {
    console.log('\nNOT FOUND in catalog');
  }
}

check().catch(console.error);
