/**
 * Rebuild genre-assignments blob from classification-state
 */

require('dotenv').config();
const { getStore } = require('@netlify/blobs');

async function rebuild() {
  console.log('🔄 Rebuilding genre-assignments from classification-state...\n');

  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // Load classification-state
  const classificationState = await store.get('classification-state', { type: 'json' });

  if (!classificationState || !classificationState.classified) {
    console.error('❌ No classification-state found!');
    process.exit(1);
  }

  console.log(`✓ Found ${Object.keys(classificationState.classified).length} classified movies\n`);

  // Build genre-assignments
  const genreAssignments = {
    genres: {},
    updatedAt: new Date().toISOString()
  };

  for (const [movieId, genreCode] of Object.entries(classificationState.classified)) {
    if (!genreAssignments.genres[genreCode]) {
      genreAssignments.genres[genreCode] = [];
    }
    genreAssignments.genres[genreCode].push(parseInt(movieId));
  }

  // Save
  await store.setJSON('genre-assignments', genreAssignments);

  console.log('✅ Genre-assignments rebuilt!\n');
  console.log('📊 Breakdown:');
  const sortedGenres = Object.entries(genreAssignments.genres).sort((a, b) => b[1].length - a[1].length);
  for (const [genreCode, movieIds] of sortedGenres) {
    console.log(`  ${genreCode}: ${movieIds.length} movies`);
  }
}

rebuild()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
