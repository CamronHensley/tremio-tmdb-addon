const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function reset() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  console.log('🗑️  Resetting all classifications...\n');

  // Reset classification state
  await store.setJSON('classification-state', {
    classified: {},
    lastUpdated: new Date().toISOString()
  });

  // Reset genre assignments
  await store.setJSON('genre-assignments', {
    genres: {},
    updatedAt: new Date().toISOString()
  });

  console.log('✅ All classifications cleared');
  console.log('   classification-state: reset');
  console.log('   genre-assignments: reset');
}

reset().catch(console.error);
