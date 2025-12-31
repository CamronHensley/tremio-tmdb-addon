const { getStore } = require('@netlify/blobs');
const fs = require('fs');
require('dotenv').config();

/**
 * This script fixes all known misclassifications by:
 * 1. Loading the misclassified_movies.json file
 * 2. Adding additional manual corrections
 * 3. Updating classification-state blob
 * 4. Rebuilding genre-assignments blob
 * 5. Triggering catalog rebuild
 */

async function fixMisclassifications() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  console.log('\n🔧 FIXING MISCLASSIFICATIONS\n');

  // Load existing misclassifications
  let misclassified = [];
  try {
    misclassified = JSON.parse(fs.readFileSync('misclassified_movies.json', 'utf-8'));
    console.log(`✓ Loaded ${misclassified.length} misclassified movies from file`);
  } catch (err) {
    console.log('⚠️  No misclassified_movies.json found, using manual list only');
  }

  // Additional manual corrections not caught by the scan
  const manualFixes = [
    // Science fiction in HISTORY
    { id: '188927', title: 'Star Trek Beyond', currentGenre: 'HISTORY', newGenre: 'SCIFI', reason: 'Science fiction movie, not historical' },

    // Car racing movies in SPORTS (should be CARS)
    { id: '96721', title: 'Rush', currentGenre: 'SPORTS', newGenre: 'CARS', reason: 'Formula 1 racing movie - about cars, not traditional sports' },
    { id: '359724', title: 'Ford v Ferrari', currentGenre: 'SPORTS', newGenre: 'CARS', reason: 'Le Mans racing movie - about cars, not traditional sports' },

    // Remove PARODY genre - move to COMEDY or ACTION
    { id: '813', title: 'Airplane!', currentGenre: 'PARODY', newGenre: 'COMEDY', reason: 'Parody films are comedies' },
    { id: '816', title: 'Austin Powers', currentGenre: 'PARODY', newGenre: 'COMEDY', reason: 'Parody films are comedies' },
    { id: '7446', title: 'Tropic Thunder', currentGenre: 'PARODY', newGenre: 'COMEDY', reason: 'Parody films are comedies' },
    { id: '37136', title: 'The Naked Gun', currentGenre: 'PARODY', newGenre: 'COMEDY', reason: 'Parody films are comedies' },
    { id: '238713', title: 'Spy', currentGenre: 'PARODY', newGenre: 'COMEDY', reason: 'Parody films are comedies' },
    { id: '207703', title: 'Kingsman: The Secret Service', currentGenre: 'PARODY', newGenre: 'ACTION', reason: 'Action film with comedy elements' },
    { id: '343668', title: 'Kingsman: The Golden Circle', currentGenre: 'PARODY', newGenre: 'ACTION', reason: 'Action film with comedy elements' },
  ];

  console.log(`✓ Added ${manualFixes.length} manual corrections\n`);

  // Load classification state
  const state = await store.get('classification-state', { type: 'json' });
  console.log(`✓ Loaded classification-state: ${Object.keys(state.classified).length} movies\n`);

  // Prepare fixes
  const fixes = [];

  // Process scanned misclassifications
  for (const item of misclassified) {
    const reasons = item.reasons || [];

    // Determine new genre from reasons
    let newGenre = null;

    if (reasons.some(r => r.includes('should likely be MUSIC') || r.includes('should be MUSIC'))) {
      newGenre = 'MUSIC';
    } else if (reasons.some(r => r.includes('should be SUPERHEROES'))) {
      newGenre = 'SUPERHEROES';
    }

    if (newGenre && newGenre !== item.currentGenre) {
      fixes.push({
        id: item.id,
        title: item.title,
        from: item.currentGenre,
        to: newGenre,
        reason: reasons.join('; ')
      });
    }
  }

  // Add manual fixes
  fixes.push(...manualFixes.map(f => ({
    id: f.id,
    title: f.title,
    from: f.currentGenre,
    to: f.newGenre,
    reason: f.reason
  })));

  console.log(`📋 TOTAL FIXES TO APPLY: ${fixes.length}\n`);

  // Group by genre change for display
  const byGenreChange = {};
  fixes.forEach(f => {
    const key = `${f.from} → ${f.to}`;
    if (!byGenreChange[key]) byGenreChange[key] = [];
    byGenreChange[key].push(f);
  });

  Object.entries(byGenreChange).forEach(([change, movies]) => {
    console.log(`${change}: ${movies.length} movies`);
  });

  console.log('\n');

  // Ask for confirmation
  console.log('⚠️  This will update:');
  console.log('   - classification-state blob');
  console.log('   - genre-assignments blob');
  console.log('');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Apply fixes to classification-state
  console.log('🔄 Applying fixes to classification-state...\n');

  let fixedCount = 0;
  for (const fix of fixes) {
    const currentGenre = state.classified[fix.id];

    if (currentGenre !== fix.from) {
      console.log(`⚠️  SKIP: ${fix.title} - expected in ${fix.from}, but found in ${currentGenre || 'UNCLASSIFIED'}`);
      continue;
    }

    state.classified[fix.id] = fix.to;
    fixedCount++;
    console.log(`✓ ${fix.title}: ${fix.from} → ${fix.to}`);
  }

  console.log(`\n✓ Fixed ${fixedCount} movies in classification-state\n`);

  // Save updated classification-state
  await store.set('classification-state', JSON.stringify(state));
  console.log('✓ Saved classification-state blob\n');

  // Rebuild genre-assignments
  console.log('🔄 Rebuilding genre-assignments...\n');

  const genreAssignments = {
    genres: {},
    lastUpdated: new Date().toISOString()
  };

  for (const [movieId, genreCode] of Object.entries(state.classified)) {
    if (!genreAssignments.genres[genreCode]) {
      genreAssignments.genres[genreCode] = [];
    }
    genreAssignments.genres[genreCode].push(movieId);
  }

  // Show counts
  const genreCounts = Object.entries(genreAssignments.genres)
    .map(([genre, ids]) => ({ genre, count: ids.length }))
    .sort((a, b) => b.count - a.count);

  console.log('Genre counts:');
  genreCounts.forEach(g => {
    console.log(`  ${g.genre.padEnd(20)} ${g.count}`);
  });

  await store.set('genre-assignments', JSON.stringify(genreAssignments));
  console.log('\n✓ Saved genre-assignments blob\n');

  // Summary
  console.log('='.repeat(60));
  console.log('✅ MISCLASSIFICATIONS FIXED');
  console.log('='.repeat(60));
  console.log(`Fixed ${fixedCount} movies`);
  console.log('');
  console.log('Next step: Run the nightly update script to rebuild the catalog:');
  console.log('  npm run update:catalog');
  console.log('');
}

fixMisclassifications().catch(console.error);
