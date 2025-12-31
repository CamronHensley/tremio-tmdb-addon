const fs = require('fs');
const { getStore } = require('@netlify/blobs');
require('dotenv').config();

// ============================================================
// MANUAL CLASSIFICATION SCRIPT
// This script prepares movies for MANUAL review - NO AUTOMATION
// Always processes in chunks of 500 movies
// Tracks progress to survive context loss
// ============================================================

const CHUNK_SIZE = 500;

async function main() {
  // Load classified movies from Netlify blob storage
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  // Create a Set of already classified movie IDs for fast lookup
  const classifiedIds = new Set(Object.keys(classificationState.classified).map(id => parseInt(id)));

  const totalClassified = classifiedIds.size;
  const currentBatch = Math.floor(totalClassified / CHUNK_SIZE) + 1;

  console.log(`📊 Loading from Netlify blob storage`);
  console.log(`📊 Total classified so far: ${totalClassified}`);

// Read the full output file
const fullOutput = fs.readFileSync('full_output.txt', 'utf-8');

// Parse movies from the output
const movies = [];
const moviePattern = /(\d+)\.\s+(.+?)\s+\((\d{4})\)\s+ID:\s+(\d+)\s+Rating:\s+([\d.]+)\s+Genres:\s+(.+?)\s+Found in:\s+(.+?)\s+Plot:\s+(.+?)(?=\n\n\d+\.|\n\n$|$)/gs;

let match;
while ((match = moviePattern.exec(fullOutput)) !== null) {
  const movieId = parseInt(match[4]);

  // Skip if already classified
  if (!classifiedIds.has(movieId)) {
    movies.push({
      index: parseInt(match[1]),
      name: match[2],
      year: parseInt(match[3]),
      movieId: movieId,
      rating: parseFloat(match[5]),
      genres: match[6].split(',').map(g => g.trim()),
      foundIn: match[7].split(',').map(c => c.trim()),
      plot: match[8].replace(/\.\.\.$/, '').trim()
    });
  }
}

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 PROGRESS REPORT`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Total movies in full_output.txt: ${movies.length + classifiedIds.size}`);
  console.log(`Already classified: ${classifiedIds.size}`);
  console.log(`Unclassified movies remaining: ${movies.length}`);
  console.log(`Current batch number: ${currentBatch}`);
  console.log(`Movies in this batch: ${Math.min(CHUNK_SIZE, movies.length)}`);
  console.log(`${'='.repeat(70)}\n`);

  // ALWAYS take exactly 500 movies (or remaining if less than 500)
  const next500 = movies.slice(0, CHUNK_SIZE);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`⚠️  MANUAL CLASSIFICATION REQUIRED - NO AUTOMATION ALLOWED ⚠️`);
  console.log(`${'='.repeat(70)}`);
  console.log(`This script prepares ${next500.length} movies for MANUAL classification.`);
  console.log(`Each movie MUST be individually reviewed and classified by a human.`);
  console.log(`\n🚫 CRITICAL: Auto-classification scripts have been REMOVED.`);
  console.log(`🚫 DO NOT attempt to automate this process.`);
  console.log(`🚫 Quality requires manual review of every single movie.`);
  console.log(`${'='.repeat(70)}\n`);

  // Output the movies in a format that can be easily classified
  next500.forEach((movie, idx) => {
    console.log(`${idx + 1}. ${movie.name} (${movie.year})`);
    console.log(`   ID: ${movie.movieId}`);
    console.log(`   Genres: ${movie.genres.join(', ')}`);
    console.log(`   Plot: ${movie.plot}`);
    console.log();
  });

  // Save the movie data to a JSON file for processing
  fs.writeFileSync('next_500_to_classify.json', JSON.stringify(next500, null, 2));

  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ Saved ${next500.length} movies to next_500_to_classify.json`);
  console.log(`${'='.repeat(70)}`);
  console.log(`\n📊 PROGRESS TRACKING:`);
  console.log(`   Batch ${currentBatch} prepared`);
  console.log(`   Movies ${totalClassified + 1} - ${totalClassified + next500.length}`);
  console.log(`   This batch has ${next500.length} movies to classify`);
  console.log(`\n📋 NEXT STEPS:`);
  console.log(`   1. Open next_500_to_classify.json`);
  console.log(`   2. Review each movie individually`);
  console.log(`   3. Assign EXACTLY ONE genre code per movie`);
  console.log(`   4. Save classifications to a JSON file`);
  console.log(`   5. Upload to Netlify using scripts/save-classifications.js`);
  console.log(`   6. Run this script again to get the next batch`);
  console.log(`\n📖 See scripts/README_CLASSIFICATION.md for full guidelines`);
  console.log(`\n⚠️  WARNING: Automation = Poor Quality = Wasted Effort`);
  console.log(`⚠️  Take your time. Each movie deserves individual attention.\n`);
}

main().catch(console.error);
