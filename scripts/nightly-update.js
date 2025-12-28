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
const { GENRES, MOVIES_PER_GENRE, TARGET_NEW_MOVIES, MAX_PAGES, getCurrentSeason, SEASONAL_HOLIDAYS } = require('../lib/constants');

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
  const deduplicator = new DeduplicationProcessor();

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

  // Fetch from TMDB with consistent parameters (no strategy-based variation)
  const moviesByGenre = {};
  const allGenreCodes = Object.keys(GENRES);
  const currentPages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Fetch 10 pages for variety
  const sortBy = 'popularity.desc'; // Consistent sorting
  const strategyParams = {}; // No date filters

  console.log('\n🔍 Fetching from TMDB...');
  console.log(`📄 Pages: ${currentPages.join(', ')}`);

  // Initial fetch
  for (const genreCode of allGenreCodes) {
    const genre = GENRES[genreCode];
    console.log(`  → ${genre.name}...`);

    try {
      // Handle SEASONAL genre - switches movies based on current date
      if (genre.isSeasonal) {
        const currentSeason = getCurrentSeason();
        const seasonalHoliday = SEASONAL_HOLIDAYS[currentSeason.key];
        console.log(`    → Current season: ${seasonalHoliday.name}`);

        if (seasonalHoliday.movieIds && seasonalHoliday.movieIds.length > 0) {
          // Fetch details for manually curated movie IDs
          const movieDetails = await tmdb.fetchMovieDetailsBatch(seasonalHoliday.movieIds);
          moviesByGenre[genreCode] = movieDetails;
          console.log(`    ✓ Using ${movieDetails.length} manually curated ${seasonalHoliday.name} movies`);
        } else {
          console.log(`    ⊘ No movies configured for ${seasonalHoliday.name} yet`);
          moviesByGenre[genreCode] = [];
        }
        continue;
      }

      // Skip custom genres without TMDB ID (will be manually sorted later)
      if (!genre.id) {
        console.log(`    ⊘ Skipping (no TMDB ID - manual sorting required)`);
        moviesByGenre[genreCode] = [];
        continue;
      }

      const movies = await tmdb.fetchGenreMovies(
        genre.id,
        currentPages,
        sortBy,
        strategyParams
      );
      moviesByGenre[genreCode] = movies;
      console.log(`    ✓ Found ${movies.length} movies`);
    } catch (error) {
      console.error(`    ✗ Failed: ${error.message}`);
      moviesByGenre[genreCode] = [];
    }

    await sleep(200);
  }

  // Check if we need more pages (only if we have a previous catalog)
  if (previousCatalog && previousCatalog.genres) {
    console.log('\n🔬 Analyzing freshness...');

    let totalNewMovies = 0;
    let totalGenres = 0;

    for (const genreCode of allGenreCodes) {
      const freshMovies = moviesByGenre[genreCode] || [];
      const cachedMovies = previousCatalog.genres[genreCode] || [];
      const cachedIds = new Set(cachedMovies.map(m => m.id));
      const newCount = freshMovies.filter(m => !cachedIds.has(m.id)).length;

      totalNewMovies += newCount;
      totalGenres++;
    }

    const avgNewPerGenre = totalNewMovies / totalGenres;
    console.log(`  → Average new movies per genre: ${avgNewPerGenre.toFixed(1)}`);

    // If we don't have enough new content, fetch more pages
    if (avgNewPerGenre < TARGET_NEW_MOVIES && currentPages.length < MAX_PAGES) {
      const nextPage = Math.max(...currentPages) + 1;
      if (nextPage <= MAX_PAGES) {
        console.log(`  ⚠️  Not enough fresh content, fetching page ${nextPage}...`);

        for (const genreCode of allGenreCodes) {
          const genre = GENRES[genreCode];

          // Skip genres without TMDB ID
          if (!genre.id) continue;

          try {
            const moreMovies = await tmdb.fetchGenreMovies(
              genre.id,
              [nextPage],
              sortBy,
              strategyParams
            );
            moviesByGenre[genreCode] = [...moviesByGenre[genreCode], ...moreMovies];
            console.log(`    → ${genre.name}: +${moreMovies.length} (total: ${moviesByGenre[genreCode].length})`);
          } catch (error) {
            console.error(`    ✗ ${genre.name} failed: ${error.message}`);
          }

          await sleep(200);
        }
      }
    } else {
      console.log(`  ✓ Sufficient fresh content found`);
    }
  }

  console.log(`\n📊 Total API requests for discovery: ${tmdb.getRequestCount()}`);

  // Filter out movies that are already in cache
  console.log('\n🔄 Filtering fresh movies (excluding cached)...');
  const freshMoviesByGenre = {};

  for (const genreCode of allGenreCodes) {
    const movies = moviesByGenre[genreCode] || [];

    // Get cached movie IDs to exclude
    const cachedIds = new Set();
    if (previousCatalog && previousCatalog.genres && previousCatalog.genres[genreCode]) {
      previousCatalog.genres[genreCode].forEach(m => {
        if (m.tmdbId) {
          cachedIds.add(m.tmdbId);
        } else if (m.id && typeof m.id === 'string' && m.id.startsWith('tmdb:')) {
          cachedIds.add(parseInt(m.id.replace('tmdb:', ''), 10));
        }
      });
    }

    // Filter out cached movies
    freshMoviesByGenre[genreCode] = movies.filter(movie => !cachedIds.has(movie.id));
    console.log(`  ${GENRES[genreCode].name}: ${freshMoviesByGenre[genreCode].length} fresh movies`);
  }

  // Merge with previous catalog using intelligent cache selection
  console.log('\n🔀 Merging with cache (applying daily strategy)...');
  const mergedMovies = HybridCache.mergeWithPrevious(freshMoviesByGenre, previousCatalog, recentMovieIds, 20);

  const mergeStats = HybridCache.getMergeStats(mergedMovies, freshMoviesByGenre);
  console.log(`  ✓ Total: ${mergeStats.totalMovies} movies`);
  console.log(`  ✓ Fresh: ${mergeStats.freshMovies} (${mergeStats.freshPercentage}%)`);
  console.log(`  ✓ Cached: ${mergeStats.cachedMovies} (${mergeStats.cachedPercentage}%)`);

  // Fetch detailed info for selected movies
  console.log('\n📥 Fetching movie details...');
  const allSelectedIds = [];
  const genresWithDetails = {};

  for (const genreCode of allGenreCodes) {
    const movies = mergedMovies[genreCode] || [];
    const movieIds = movies.map(m => m.id);

    // Check for duplicates BEFORE fetching details
    const uniqueIds = new Set(movieIds);
    if (movieIds.length !== uniqueIds.size) {
      console.log(`  ⚠️  ${GENRES[genreCode].name} has ${movieIds.length - uniqueIds.size} duplicate IDs in merged movies!`);
      console.log(`    Total: ${movieIds.length}, Unique: ${uniqueIds.size}`);
    }

    allSelectedIds.push(...movieIds);

    console.log(`  → ${GENRES[genreCode].name}: ${movies.length} movies`);

    // Deduplicate movieIds before fetching (in case hybrid cache had issues)
    const uniqueMovieIds = [...new Set(movieIds)];
    if (uniqueMovieIds.length !== movieIds.length) {
      console.log(`    ⚠️  Removed ${movieIds.length - uniqueMovieIds.length} duplicate IDs before fetch`);
    }

    // Fetch details in batches
    const details = await tmdb.fetchMovieDetailsBatch(uniqueMovieIds);

    // Convert to Stremio format
    const moviesWithMeta = details
      .map(movie => TMDBClient.toStremioMeta(movie))
      .filter(meta => meta !== null);

    // Deduplicate by Stremio ID (shouldn't be needed, but just in case)
    const seenIds = new Set();
    const uniqueMovies = moviesWithMeta.filter(meta => {
      if (seenIds.has(meta.id)) {
        console.log(`    ⚠️  Duplicate Stremio ID found: ${meta.id} (${meta.name})`);
        return false;
      }
      seenIds.add(meta.id);
      return true;
    });

    genresWithDetails[genreCode] = uniqueMovies.slice(0, MOVIES_PER_GENRE);

    console.log(`    ✓ Got details for ${genresWithDetails[genreCode].length} movies`);
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
