const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function check() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const customAssignments = await store.get('custom-genre-assignments', { type: 'json' });
  const classificationState = await store.get('classification-state', { type: 'json' });

  console.log('\n=== BLOB COMPARISON ===\n');

  console.log('custom-genre-assignments exists:', !!customAssignments);
  if (customAssignments && customAssignments.genres) {
    const total = Object.values(customAssignments.genres).reduce((sum, ids) => sum + ids.length, 0);
    console.log('  Total movies in custom-genre-assignments:', total);
  }

  console.log('\nclassification-state exists:', !!classificationState);
  if (classificationState && classificationState.classified) {
    console.log('  Total movies in classification-state:', Object.keys(classificationState.classified).length);
  }

  console.log('\n=== NIGHTLY UPDATE USES: custom-genre-assignments ===');
  console.log('=== YOU ARE SAVING TO: classification-state ===');
  console.log('\nTHIS IS THE PROBLEM!');
}

check().catch(console.error);
