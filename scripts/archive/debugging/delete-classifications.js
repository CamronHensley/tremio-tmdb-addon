const { getStore } = require('@netlify/blobs');
const fs = require('fs');
require('dotenv').config();

async function deleteClassifications() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // Read the file containing movie IDs to delete
  const deleteFilePath = process.argv[2];

  if (!deleteFilePath) {
    console.error('❌ Error: Please provide a file path with movie IDs to delete');
    console.log('Usage: node scripts/delete-classifications.js <file-with-ids.json>');
    process.exit(1);
  }

  const movieIdsToDelete = JSON.parse(fs.readFileSync(deleteFilePath, 'utf-8'));

  console.log(`\n🗑️  Deleting ${movieIdsToDelete.length} movie classifications from Netlify blobs...\n`);

  // Load existing classification state
  let classificationState = await store.get('classification-state', { type: 'json' });

  if (!classificationState || !classificationState.classified) {
    console.error('❌ No classification data found in Netlify blobs');
    return;
  }

  const originalCount = Object.keys(classificationState.classified).length;
  console.log(`📊 Original total: ${originalCount} movies`);

  // Delete the specified movie IDs
  let deletedCount = 0;
  let notFoundCount = 0;

  movieIdsToDelete.forEach(movieId => {
    if (classificationState.classified[movieId]) {
      delete classificationState.classified[movieId];
      deletedCount++;
    } else {
      notFoundCount++;
    }
  });

  console.log(`✅ Deleted: ${deletedCount} movies`);
  console.log(`⚠️  Not found: ${notFoundCount} movie IDs`);

  // Update the timestamp
  classificationState.lastUpdated = new Date().toISOString();

  // Save back to blob storage
  await store.setJSON('classification-state', classificationState);

  const newCount = Object.keys(classificationState.classified).length;
  console.log(`\n📊 New total: ${newCount} movies`);
  console.log(`📉 Removed: ${originalCount - newCount} movies\n`);

  // Also update genre-assignments
  const genreAssignments = {};
  for (const [movieId, genreCode] of Object.entries(classificationState.classified)) {
    if (!genreAssignments[genreCode]) {
      genreAssignments[genreCode] = [];
    }
    genreAssignments[genreCode].push(parseInt(movieId));
  }

  await store.setJSON('genre-assignments', genreAssignments);
  console.log('✅ Updated genre-assignments in blob storage\n');
}

deleteClassifications().catch(console.error);
