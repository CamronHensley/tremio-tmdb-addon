/**
 * Clear all cached data from Netlify Blobs
 * Deletes: catalog.json, catalog-previous, ai-classification-cache, recent-movies
 */

require('dotenv').config();
const { getStore } = require('@netlify/blobs');

async function clearCache() {
  console.log('🗑️  Clearing all cached data from Netlify Blobs...\n');

  if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_ACCESS_TOKEN) {
    console.error('❌ Missing NETLIFY_SITE_ID or NETLIFY_ACCESS_TOKEN');
    process.exit(1);
  }

  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const blobsToDelete = [
    'catalog.json',
    'catalog-previous',
    'ai-classification-cache',
    'recent-movies'
  ];

  for (const blobName of blobsToDelete) {
    try {
      await store.delete(blobName);
      console.log(`  ✓ Deleted: ${blobName}`);
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log(`  ⚠️  ${blobName} - not found (already deleted)`);
      } else {
        console.error(`  ✗ Failed to delete ${blobName}:`, error.message);
      }
    }
  }

  console.log('\n✅ Cache clearing complete!');
  console.log('Next run of npm run update will regenerate everything from scratch.');
}

clearCache().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
