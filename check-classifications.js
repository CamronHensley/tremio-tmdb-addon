const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function checkClassifications() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  if (!classificationState || !classificationState.classified) {
    console.log('No classification data found in Netlify blobs');
    return;
  }

  const totalMovies = Object.keys(classificationState.classified).length;
  console.log(`\nTotal movies in Netlify blobs: ${totalMovies}`);
  console.log(`Last updated: ${classificationState.lastUpdated}`);

  // Check if specific mystery movies are in the blobs
  const mysteryMovies = [238, 155, 497, 680, 13, 278, 389, 11, 603, 120, 121, 122, 424, 550, 807, 769, 637];
  console.log('\nChecking mystery movies in Netlify blobs:');
  let foundCount = 0;
  mysteryMovies.forEach(id => {
    if (classificationState.classified[id]) {
      foundCount++;
      console.log(`  ID ${id}: FOUND - ${classificationState.classified[id]}`);
    }
  });
  console.log(`\nMystery movies found: ${foundCount}/${mysteryMovies.length}`);

  // Count by genre
  const genreCounts = {};
  for (const genreCode of Object.values(classificationState.classified)) {
    genreCounts[genreCode] = (genreCounts[genreCode] || 0) + 1;
  }

  console.log('\nGenre breakdown:');
  Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([genre, count]) => {
      console.log(`  ${genre}: ${count} movies`);
    });
}

checkClassifications().catch(console.error);
