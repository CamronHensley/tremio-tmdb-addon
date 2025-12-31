/**
 * Interactive Movie Classification Script
 *
 * Run this script whenever you want Claude to help classify movies.
 * Loads unclassified movies and presents them for manual genre assignment.
 *
 * Usage: npm run classify
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');
const { GENRES } = require('../lib/constants');

// Validate environment variables
function validateEnv() {
  const required = ['NETLIFY_ACCESS_TOKEN', 'NETLIFY_SITE_ID'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function loadClassificationState() {
  console.log('🎬 Movie Classification System\n');
  console.log('━'.repeat(60));

  validateEnv();

  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // Load current catalog
  const catalog = await store.get('catalog', { type: 'json' });
  if (!catalog || !catalog.genres) {
    console.log('❌ No catalog found. Run nightly update first.');
    process.exit(1);
  }

  // Load classification state (tracks which movies are classified)
  let classificationState = await store.get('classification-state', { type: 'json' });
  if (!classificationState) {
    classificationState = {
      classified: {},      // { movieId: [genreCode1, genreCode2, ...] }
      unclassified: [],    // [movieId1, movieId2, ...]
      lastUpdated: null
    };
  }

  // Load custom genre assignments
  let customAssignments = await store.get('custom-genre-assignments', { type: 'json' });
  if (!customAssignments) {
    customAssignments = {
      genres: {},  // { SPORTS: [movieId1, movieId2], HEIST: [...], ... }
      updatedAt: null
    };
  }

  // Collect all unique movies from catalog
  const allMovies = new Map(); // movieId -> movie object
  for (const [genreCode, movies] of Object.entries(catalog.genres)) {
    for (const movie of movies) {
      const movieId = movie.tmdbId || (movie.id && movie.id.startsWith('tmdb:') ? parseInt(movie.id.replace('tmdb:', '')) : null);
      if (movieId && !allMovies.has(movieId)) {
        allMovies.set(movieId, {
          id: movieId,
          name: movie.name,
          year: movie.year,
          genres: movie.genres || [],
          description: movie.description || '',
          imdbRating: movie.imdbRating,
          stremioId: movie.id,
          foundInGenres: [genreCode]
        });
      } else if (movieId && allMovies.has(movieId)) {
        // Movie appears in multiple genres
        allMovies.get(movieId).foundInGenres.push(genreCode);
      }
    }
  }

  // Identify unclassified movies (not in classification state)
  const unclassified = [];
  for (const [movieId, movie] of allMovies.entries()) {
    if (!classificationState.classified[movieId]) {
      unclassified.push(movie);
    }
  }

  // Get custom genres (genres that need manual classification)
  const customGenres = Object.entries(GENRES)
    .filter(([code, genre]) => genre.isCustom || !genre.id)
    .map(([code, genre]) => ({ code, name: genre.name }));

  // Display statistics
  console.log(`📊 Classification Status:`);
  console.log(`   Total unique movies: ${allMovies.size}`);
  console.log(`   Classified: ${Object.keys(classificationState.classified).length}`);
  console.log(`   Unclassified: ${unclassified.length}`);
  console.log(`\n📁 Custom Genres (${customGenres.length}):`);
  customGenres.forEach(g => {
    const count = customAssignments.genres[g.code]?.length || 0;
    console.log(`   - ${g.name}: ${count} movies`);
  });
  console.log('━'.repeat(60));

  if (unclassified.length === 0) {
    console.log('\n✅ All movies are classified!');
    console.log('Run nightly update to fetch new movies, then classify again.');
    process.exit(0);
  }

  console.log(`\n🎯 Ready to classify ${unclassified.length} unclassified movies.`);
  console.log('\n📝 Next Steps:');
  console.log('   1. Copy this output to Claude in VS Code');
  console.log('   2. Claude will analyze movies and suggest classifications');
  console.log('   3. Approve classifications and Claude will save them');
  console.log('\n💡 Tip: Process movies in batches (e.g., 20-50 at a time)\n');

  // Output ALL unclassified movies in a format ready for Claude
  console.log('━'.repeat(60));
  console.log(`UNCLASSIFIED MOVIES (All ${unclassified.length}):`);
  console.log('━'.repeat(60));

  unclassified.forEach((movie, idx) => {
    console.log(`\n${idx + 1}. ${movie.name} (${movie.year || 'N/A'})`);
    console.log(`   ID: ${movie.id}`);
    console.log(`   Rating: ${movie.imdbRating || 'N/A'}`);
    console.log(`   Genres: ${movie.genres.join(', ') || 'None'}`);
    console.log(`   Found in: ${movie.foundInGenres.join(', ')}`);
    if (movie.description) {
      const shortDesc = movie.description.substring(0, 150);
      console.log(`   Plot: ${shortDesc}${movie.description.length > 150 ? '...' : ''}`);
    }
  });

  console.log('\n━'.repeat(60));
  console.log(`Total: ${unclassified.length} unclassified movies`);
  console.log('━'.repeat(60));

  // Save current state for reference
  await store.setJSON('classification-session', {
    sessionStarted: new Date().toISOString(),
    totalUnclassified: unclassified.length,
    allMovieIds: unclassified.map(m => m.id),
    customGenres: customGenres.map(g => g.code)
  });

  console.log('\n✓ Session state saved. Ready for Claude!\n');
}

loadClassificationState()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Classification script failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
