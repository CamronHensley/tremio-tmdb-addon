const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // List all blobs
  const { blobs } = await store.list();
  console.log('Available blobs:');
  blobs.forEach(blob => {
    console.log(`  - ${blob.key}`);
  });
}

main().catch(console.error);
