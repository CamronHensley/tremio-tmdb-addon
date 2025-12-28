/**
 * Cache Reset Script
 *
 * Clears all cached data from Netlify Blobs
 * Forces fresh fetch on next nightly update
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');

async function resetCache() {
  console.log('🗑️  Resetting cache...');

  if (!process.env.NETLIFY_ACCESS_TOKEN || !process.env.NETLIFY_SITE_ID) {
    throw new Error('❌ Missing NETLIFY_ACCESS_TOKEN or NETLIFY_SITE_ID');
  }

  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const blobsToDelete = ['catalog', 'catalog-previous', 'metadata', 'recent-movies'];

  for (const blob of blobsToDelete) {
    try {
      await store.delete(blob);
      console.log(`  ✓ Deleted: ${blob}`);
    } catch (error) {
      console.log(`  ⊘ ${blob}: ${error.message}`);
    }
  }

  console.log('\n✅ Cache reset complete!');
  console.log('Next nightly update will fetch completely fresh data.');
}

resetCache()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  });
