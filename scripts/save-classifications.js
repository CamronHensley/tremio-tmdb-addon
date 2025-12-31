/**
 * Save Movie Classifications
 *
 * Called by Claude to save genre assignments after manual classification.
 * Each movie should appear in EXACTLY ONE genre (no duplicates).
 *
 * Usage: node scripts/save-classifications.js <json-file>
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');
const fs = require('fs');
const path = require('path');

async function saveClassifications(classificationsFile) {
  if (!classificationsFile) {
    console.error('❌ Usage: node scripts/save-classifications.js <json-file>');
    process.exit(1);
  }

  const filePath = path.resolve(classificationsFile);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log('💾 Saving movie classifications...\n');

  // Load classifications from file
  const classifications = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!Array.isArray(classifications)) {
    console.error('❌ Invalid format: expected array of classifications');
    process.exit(1);
  }

  console.log(`📥 Loaded ${classifications.length} classifications from file`);

  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // Load existing state
  let classificationState = await store.get('classification-state', { type: 'json' }) || {
    classified: {},      // { movieId: genreCode }  <- SINGLE genre per movie
    lastUpdated: null
  };

  let genreAssignments = await store.get('genre-assignments', { type: 'json' }) || {
    genres: {},          // { GENRE_CODE: [movieId1, movieId2, ...] }
    updatedAt: null
  };

  // Process classifications
  let addedCount = 0;
  let skippedCount = 0;

  for (const item of classifications) {
    const { movieId, genreCode, movieName } = item;

    if (!movieId) {
      console.log(`⚠️  Skipping invalid entry (no movieId): ${JSON.stringify(item)}`);
      skippedCount++;
      continue;
    }

    if (!genreCode) {
      console.log(`⚠️  Skipping invalid entry (no genreCode): ${JSON.stringify(item)}`);
      skippedCount++;
      continue;
    }

    // Mark as classified with SINGLE genre
    classificationState.classified[movieId] = genreCode;

    // Add to genre assignments
    if (!genreAssignments.genres[genreCode]) {
      genreAssignments.genres[genreCode] = [];
    }
    if (!genreAssignments.genres[genreCode].includes(movieId)) {
      genreAssignments.genres[genreCode].push(movieId);
    }

    console.log(`✓ ${movieName || movieId}: ${genreCode}`);
    addedCount++;
  }

  // Update timestamps
  classificationState.lastUpdated = new Date().toISOString();
  genreAssignments.updatedAt = new Date().toISOString();

  // Save to blob storage
  await store.setJSON('classification-state', classificationState);
  await store.setJSON('genre-assignments', genreAssignments);

  console.log('\n━'.repeat(60));
  console.log('✅ Classifications saved!');
  console.log(`   Added: ${addedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total classified: ${Object.keys(classificationState.classified).length}`);
  console.log('━'.repeat(60));

  // Show genre stats
  console.log('\n📁 Genre Breakdown:');
  const sortedGenres = Object.entries(genreAssignments.genres).sort((a, b) => b[1].length - a[1].length);
  for (const [genreCode, movieIds] of sortedGenres) {
    console.log(`   ${genreCode}: ${movieIds.length} movies`);
  }

  console.log('\n💡 Next step: Run nightly update to apply these classifications\n');
}

const classificationsFile = process.argv[2];
saveClassifications(classificationsFile)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Save failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
