/**
 * Nightly Update Script
 * 
 * Runs via GitHub Actions at midnight UTC
 * Fetches fresh data from TMDB, processes it, and stores in Netlify Blobs
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');
const TMDBClient = require('../lib/tmdb-client');
const HybridCache = require('../lib/hybrid-cache');
const { GENRES, MOVIES_PER_GENRE, TARGET_NEW_MOVIES, MAX_PAGES, getCurrentSeason, SEASONAL_HOLIDAYS, MAJOR_STUDIOS } = require('../lib/constants');

// Validate environment variables
function validateEnv() {
  const required = ['TMDB_API_KEY', 'NETLIFY_ACCESS_TOKEN', 'NETLIFY_SITE_ID'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate API key format (basic check)
  if (process.env.TMDB_API_KEY && process.env.TMDB_API_KEY.length < 20) {
    console.warn('⚠️  TMDB_API_KEY seems too short, it may be invalid');
  }

  console.log('✓ Environment variables validated');
}

// Main update function
async function runUpdate() {
  console.log('🎬 Starting nightly TMDB catalog update...');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  
  validateEnv();

  const tmdb = new TMDBClient(process.env.TMDB_API_KEY);

  // Get store for Netlify Blobs
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // Get previous catalog for hybrid caching
  let previousCatalog = null;
  try {
    previousCatalog = await store.get('catalog-previous', { type: 'json' });
    if (previousCatalog && previousCatalog.genres) {
      const prevMovieCount = Object.values(previousCatalog.genres)
        .reduce((sum, movies) => sum + movies.length, 0);
      console.log(`📦 Loaded previous catalog (${prevMovieCount} movies for hybrid merge)`);

      // Validate catalog structure
      if (typeof previousCatalog.genres !== 'object') {
        console.warn('⚠️  Previous catalog has invalid structure, ignoring');
        previousCatalog = null;
      }
    }
  } catch (e) {
    console.log('📦 No previous catalog found (first run or error):', e.message);
  }

  // Get recent movie IDs for historical penalty (used by hybrid cache)
  let recentMovieIds = [];
  try {
    const recentData = await store.get('recent-movies', { type: 'json' });
    recentMovieIds = recentData?.ids || [];
    if (Array.isArray(recentMovieIds)) {
      console.log(`📜 Loaded ${recentMovieIds.length} recent movie IDs for diversity`);
    } else {
      console.warn('⚠️  Recent movie IDs has invalid format, ignoring');
      recentMovieIds = [];
    }
  } catch (e) {
    console.log('📜 No recent movie history found (first run?):', e.message);
  }

  // Load manual classifications from genre-assignments blob
  console.log('\n🏷️  Loading manual genre assignments...');
  let genreAssignments = null;
  try {
    genreAssignments = await store.get('genre-assignments', { type: 'json' });
    if (genreAssignments && genreAssignments.genres) {
      const totalAssigned = Object.values(genreAssignments.genres)
        .reduce((sum, ids) => sum + ids.length, 0);
      console.log(`  ✓ Loaded ${totalAssigned} manually classified movies`);

      // Show breakdown
      const sortedGenres = Object.entries(genreAssignments.genres).sort((a, b) => b[1].length - a[1].length);
      for (const [genreCode, movieIds] of sortedGenres) {
        if (movieIds.length > 0) {
          console.log(`    → ${genreCode}: ${movieIds.length} movies`);
        }
      }
    } else {
      console.log('  ⊘ No manual classifications found - please classify movies first');
      throw new Error('No manual classifications found in genre-assignments blob');
    }
  } catch (e) {
    console.error('  ✗ Failed to load genre-assignments:', e.message);
    throw new Error('Cannot proceed without manual classifications');
  }

  // Fetch detailed info for manually classified movies
  console.log('\n📥 Fetching movie details from TMDB...');
  const allGenreCodes = Object.keys(GENRES);
  const allSelectedIds = [];
  const genresWithDetails = {};

  // Create hybrid cache instance for rotation
  const cache = new HybridCache();

  // Process all genres using ONLY manual classifications
  for (const genreCode of allGenreCodes) {
    const genre = GENRES[genreCode];

    // Get manually classified movie IDs for this genre
    const classifiedIds = (genreAssignments.genres && genreAssignments.genres[genreCode]) || [];

    if (classifiedIds.length === 0) {
      console.log(`  → ${genre.name}: No classified movies yet`);
      genresWithDetails[genreCode] = [];
      continue;
    }

    console.log(`  → ${genre.name}: Fetching ${classifiedIds.length} classified movies`);

    // Deduplicate IDs
    const uniqueMovieIds = [...new Set(classifiedIds)];
    if (uniqueMovieIds.length !== classifiedIds.length) {
      console.log(`    ⚠️  Removed ${classifiedIds.length - uniqueMovieIds.length} duplicate IDs`);
    }

    // Fetch details from TMDB
    const details = await tmdb.fetchMovieDetailsBatch(uniqueMovieIds);

    // Convert to Stremio format (but keep TMDB data for scoring)
    const moviesWithMeta = details.map(movie => {
      const stremioMeta = TMDBClient.toStremioMeta(movie);
      if (!stremioMeta) return null;

      // Add TMDB fields needed for cache scoring
      return {
        ...stremioMeta,
        popularity: movie.popularity,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        release_date: movie.release_date
      };
    }).filter(meta => meta !== null);

    // Apply hybrid cache rotation - select best subset to show today
    const rotatedMovies = cache.selectBestMovies(
      moviesWithMeta,
      genreCode,
      recentMovieIds,
      Math.min(MOVIES_PER_GENRE, moviesWithMeta.length)
    );

    // Remove scoring fields before storing (keep only Stremio format)
    genresWithDetails[genreCode] = rotatedMovies.map(movie => {
      const { popularity, vote_average, vote_count, release_date, ...stremioOnly } = movie;
      return stremioOnly;
    });

    allSelectedIds.push(...uniqueMovieIds);

    console.log(`    ✓ Fetched ${moviesWithMeta.length}, showing ${genresWithDetails[genreCode].length} today`);
  }

  console.log(`\n📊 Total API requests: ${tmdb.getRequestCount()}`);

  // Prepare catalog data
  const today = new Date();
  const dayOfWeek = today.getUTCDay();
  const { DAY_STRATEGIES } = require('../lib/constants');

  const catalogData = {
    genres: genresWithDetails,
    updatedAt: new Date().toISOString()
  };

  // Calculate totals
  const totalMovies = Object.values(genresWithDetails)
    .reduce((sum, movies) => sum + movies.length, 0);

  // Store in Netlify Blobs with error handling
  console.log('\n💾 Storing catalog data...');

  try {
    await store.setJSON('catalog', catalogData);
    console.log('  ✓ Catalog saved');
  } catch (error) {
    console.error('  ✗ Failed to save catalog:', error.message);
    throw error; // Fatal error
  }

  // Store metadata for health checks
  const metadata = {
    updatedAt: new Date().toISOString(),
    strategy: DAY_STRATEGIES[dayOfWeek],
    genreCount: Object.keys(genresWithDetails).length,
    totalMovies,
    apiRequests: tmdb.getRequestCount()
  };

  try {
    await store.setJSON('metadata', metadata);
    console.log('  ✓ Metadata saved');
  } catch (error) {
    console.error('  ✗ Failed to save metadata:', error.message);
    // Non-fatal, continue
  }

  // Store current catalog as previous for next run (hybrid caching)
  try {
    await store.setJSON('catalog-previous', catalogData);
    console.log('  ✓ Saved current catalog for tomorrow\'s hybrid merge');
  } catch (error) {
    console.error('  ✗ Failed to save previous catalog:', error.message);
    // Non-fatal, continue
  }

  // Update recent movie IDs for next run
  const uniqueSelectedIds = [...new Set(allSelectedIds)];
  const updatedRecentIds = [...new Set([...uniqueSelectedIds, ...recentMovieIds])].slice(0, 4000);

  try {
    await store.setJSON('recent-movies', {
      ids: updatedRecentIds,
      updatedAt: new Date().toISOString()
    });
    console.log(`  ✓ Updated recent movies (${updatedRecentIds.length} total)`);
  } catch (error) {
    console.error('  ✗ Failed to save recent movies:', error.message);
    // Non-fatal, continue
  }

  // Summary
  console.log('\n✅ Update complete!');
  console.log('━'.repeat(50));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🎯 Daily Strategy: ${DAY_STRATEGIES[dayOfWeek]}`);
  console.log(`🎬 Total movies: ${totalMovies}`);
  console.log(`📁 Genres: ${Object.keys(genresWithDetails).length}`);
  console.log(`🔗 API requests: ${tmdb.getRequestCount()}`);
  console.log('━'.repeat(50));
}

// Run the update
runUpdate()
  .then(() => {
    console.log('\n🎉 Nightly update finished successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Update failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
