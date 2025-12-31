/**
 * Rebuild Catalog from Manual Classifications
 *
 * Clears the entire catalog and rebuilds it using ONLY manual classifications.
 * This removes all auto-classified movies and duplicates.
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');
const TMDBClient = require('../lib/tmdb-client');
const HybridCache = require('../lib/hybrid-cache');
const { GENRES, MOVIES_PER_GENRE } = require('../lib/constants');

async function rebuildCatalog() {
  console.log('🔄 Rebuilding catalog from manual classifications...\n');

  const tmdb = new TMDBClient(process.env.TMDB_API_KEY);
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // Load manual classifications
  console.log('📥 Loading manual classifications...');
  const genreAssignments = await store.get('genre-assignments', { type: 'json' });

  if (!genreAssignments || !genreAssignments.genres) {
    console.error('❌ No genre-assignments found!');
    process.exit(1);
  }

  const totalClassified = Object.values(genreAssignments.genres)
    .reduce((sum, ids) => sum + ids.length, 0);
  console.log(`✓ Found ${totalClassified} manually classified movies\n`);

  // Build new catalog
  console.log('🎬 Fetching movie details from TMDB...\n');
  const allGenreCodes = Object.keys(GENRES);
  const genresWithDetails = {};
  const cache = new HybridCache();

  for (const genreCode of allGenreCodes) {
    const genre = GENRES[genreCode];
    const classifiedIds = (genreAssignments.genres && genreAssignments.genres[genreCode]) || [];

    if (classifiedIds.length === 0) {
      console.log(`  → ${genre.name}: No classified movies`);
      genresWithDetails[genreCode] = [];
      continue;
    }

    console.log(`  → ${genre.name}: Fetching ${classifiedIds.length} movies`);

    // Deduplicate IDs
    const uniqueMovieIds = [...new Set(classifiedIds)];
    if (uniqueMovieIds.length !== classifiedIds.length) {
      console.log(`    ⚠️  Removed ${classifiedIds.length - uniqueMovieIds.length} duplicates`);
    }

    // Fetch details from TMDB
    const details = await tmdb.fetchMovieDetailsBatch(uniqueMovieIds);

    // Convert to Stremio format (keep TMDB data for scoring)
    const moviesWithMeta = details.map(movie => {
      const stremioMeta = TMDBClient.toStremioMeta(movie);
      if (!stremioMeta) return null;

      return {
        ...stremioMeta,
        popularity: movie.popularity,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        release_date: movie.release_date
      };
    }).filter(meta => meta !== null);

    // Select best movies for initial catalog
    const selectedMovies = cache.selectBestMovies(
      moviesWithMeta,
      genreCode,
      [],
      Math.min(MOVIES_PER_GENRE, moviesWithMeta.length)
    );

    // Remove scoring fields
    genresWithDetails[genreCode] = selectedMovies.map(movie => {
      const { popularity, vote_average, vote_count, release_date, ...stremioOnly } = movie;
      return stremioOnly;
    });

    console.log(`    ✓ Added ${genresWithDetails[genreCode].length} movies`);
  }

  console.log(`\n📊 Total API requests: ${tmdb.getRequestCount()}`);

  // Create new catalog
  const catalogData = {
    genres: genresWithDetails,
    updatedAt: new Date().toISOString()
  };

  const totalMovies = Object.values(genresWithDetails)
    .reduce((sum, movies) => sum + movies.length, 0);

  // Save catalog
  console.log('\n💾 Saving new catalog...');
  await store.setJSON('catalog', catalogData);
  console.log('  ✓ Catalog saved');

  // Save as previous catalog for hybrid cache
  await store.setJSON('catalog-previous', catalogData);
  console.log('  ✓ Saved as previous catalog');

  // Clear recent movies (fresh start)
  await store.setJSON('recent-movies', {
    ids: [],
    updatedAt: new Date().toISOString()
  });
  console.log('  ✓ Cleared recent movies history');

  // Summary
  console.log('\n✅ Catalog rebuilt successfully!');
  console.log('━'.repeat(50));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🎬 Total movies in catalog: ${totalMovies}`);
  console.log(`📁 Genres populated: ${Object.keys(genresWithDetails).filter(g => genresWithDetails[g].length > 0).length}`);
  console.log('━'.repeat(50));

  console.log('\n📊 Genre breakdown:');
  const sortedGenres = Object.entries(genresWithDetails)
    .filter(([_, movies]) => movies.length > 0)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [genreCode, movies] of sortedGenres) {
    console.log(`  ${genreCode}: ${movies.length} movies`);
  }
}

rebuildCatalog()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Rebuild failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
