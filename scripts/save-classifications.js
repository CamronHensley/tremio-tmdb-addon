/**
 * Save Movie Classifications
 *
 * Called by Claude to save genre assignments after manual classification.
 * Updates classification state and custom genre assignments.
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
    classified: {},
    unclassified: [],
    lastUpdated: null
  };

  let customAssignments = await store.get('custom-genre-assignments', { type: 'json' }) || {
    genres: {},
    updatedAt: null
  };

  // Process classifications
  let addedCount = 0;
  let skippedCount = 0;

  for (const item of classifications) {
    const { movieId, genreCodes, movieName } = item;

    if (!movieId || !Array.isArray(genreCodes)) {
      console.log(`⚠️  Skipping invalid entry: ${JSON.stringify(item)}`);
      skippedCount++;
      continue;
    }

    // Mark as classified
    classificationState.classified[movieId] = genreCodes;

    // Add to custom genre assignments
    for (const genreCode of genreCodes) {
      if (!customAssignments.genres[genreCode]) {
        customAssignments.genres[genreCode] = [];
      }
      if (!customAssignments.genres[genreCode].includes(movieId)) {
        customAssignments.genres[genreCode].push(movieId);
      }
    }

    console.log(`✓ ${movieName || movieId}: ${genreCodes.join(', ')}`);
    addedCount++;
  }

  // Update timestamps
  classificationState.lastUpdated = new Date().toISOString();
  customAssignments.updatedAt = new Date().toISOString();

  // Save to blob storage
  await store.setJSON('classification-state', classificationState);
  await store.setJSON('custom-genre-assignments', customAssignments);

  console.log('\n━'.repeat(60));
  console.log('✅ Classifications saved!');
  console.log(`   Added: ${addedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total classified: ${Object.keys(classificationState.classified).length}`);
  console.log('━'.repeat(60));

  // Show custom genre stats
  console.log('\n📁 Custom Genre Stats:');
  for (const [genreCode, movieIds] of Object.entries(customAssignments.genres)) {
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
