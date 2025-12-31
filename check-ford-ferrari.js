const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function check() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const state = await store.get('classification-state', { type: 'json' });

  console.log('\nFord v Ferrari (ID 359724):');
  console.log('Current classification:', state.classified['359724'] || 'NOT CLASSIFIED');
}

check().catch(console.error);
