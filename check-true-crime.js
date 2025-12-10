const { getStore } = require('@netlify/blobs');
require('dotenv').config();

(async () => {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  console.log('Checking catalog for TRUE_CRIME genre...\n');

  const catalog = await store.get('catalog', { type: 'json' });

  if (!catalog) {
    console.log('❌ No catalog found!');
    console.log('The GitHub Actions workflow may not have completed successfully.');
    return;
  }

  const genres = Object.keys(catalog.genres || {});
  console.log(`Total genres in catalog: ${genres.length}`);

  if (catalog.genres.TRUE_CRIME) {
    console.log(`✓ TRUE_CRIME exists with ${catalog.genres.TRUE_CRIME.length} movies`);
  } else {
    console.log('❌ TRUE_CRIME genre NOT found in catalog!');
    console.log('\nThis means the GitHub Actions workflow needs to run again.');
    console.log('The workflow fetches movies and populates all genres including TRUE_CRIME.');
  }

  console.log('\nAll genres:', genres.sort().join(', '));
})();
