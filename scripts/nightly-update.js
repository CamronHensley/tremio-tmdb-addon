/**
 * Nightly Update Script
 * 
 * Runs via GitHub Actions at midnight UTC
 * Fetches fresh data from TMDB, processes it, and stores in Netlify Blobs
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');
const TMDBClient = require('../lib/tmdb-client');
const ScoringEngine = require('../lib/scoring-engine');
const DeduplicationProcessor = require('../lib/deduplication');
const HybridCache = require('../lib/hybrid-cache');
const { GENRES, MOVIES_PER_GENRE } = require('../lib/constants');

// Validate environment variables
function validateEnv() {
  const required = ['TMDB_API_KEY', 'NETLIFY_ACCESS_TOKEN', 'NETLIFY_SITE_ID'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Main update function
async function runUpdate() {
  console.log('🎬 Starting nightly TMDB catalog update...');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  
  validateEnv();

  const tmdb = new TMDBClient(process.env.TMDB_API_KEY);
  const scoringEngine = new ScoringEngine();
  const deduplicator = new DeduplicationProcessor();

  console.log(`\n📊 Strategy for today: ${scoringEngine.getStrategyName()}`);
  console.log(`📄 Fetching from pages: ${scoringEngine.getRotationPages().join(', ')}`);

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
    }
  } catch (e) {
    console.log('📦 No previous catalog found (first run or error)');
  }

  // Get recent movie IDs for historical penalty
  // TEMPORARILY DISABLED: Clear recent movies to allow catalog to build up to 100 per genre
  let recentMovieIds = [];
  console.log('📜 Recent movie penalty temporarily disabled (building up catalog)');
  // try {
  //   const recentData = await store.get('recent-movies', { type: 'json' });
  //   recentMovieIds = recentData?.ids || [];
  //   console.log(`📜 Loaded ${recentMovieIds.length} recent movie IDs for diversity`);
  // } catch (e) {
  //   console.log('📜 No recent movie history found (first run?)');
  // }

  // Adaptive fetching: Start with 2 pages, fetch more if needed
  const moviesByGenre = {};
  const allGenreCodes = Object.keys(GENRES);
  let currentPages = scoringEngine.getRotationPages();
  const sortBy = scoringEngine.getSortParameter();
  const strategyParams = scoringEngine.getStrategyParams();
  const TARGET_NEW_MOVIES = 30; // Minimum new movies we want per genre
  const MAX_PAGES = 20;  // Fetch ALL the famous movies

  // Fetch 20 pages to build a catalog of the most popular/famous movies
  // With strict deduplication + high quality filter (pop: 50+), we cast a wide net
  currentPages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  console.log('🚀 Fetching 20 pages to get ALL famous movies (popularity 50+), deduplication assigns to best genre');

  console.log('\n🔍 Fetching from TMDB...');
  console.log(`📄 Pages: ${currentPages.join(', ')}`);

  // Initial fetch
  for (const genreCode of allGenreCodes) {
    const genre = GENRES[genreCode];
    console.log(`  → ${genre.name}...`);

    try {
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

  // Process and deduplicate (with optional AI enhancement)
  console.log('\n🔄 Processing and deduplicating movies...');
  const aiEnabled = process.env.AI_ENABLED === 'true';

  let deduplicatedMovies;
  if (aiEnabled) {
    console.log('  🤖 AI classification enabled');
    deduplicatedMovies = await deduplicator.processAllGenresWithAI(moviesByGenre, recentMovieIds);
  } else {
    console.log('  📏 Using rule-based classification only');
    deduplicatedMovies = deduplicator.processAllGenres(moviesByGenre, recentMovieIds);
  }

  const stats = deduplicator.getStats();
  console.log(`  ✓ Assigned ${stats.totalUniqueMovies} unique movies`);

  // Merge with previous catalog (hybrid caching)
  console.log('\n🔀 Merging with previous catalog (hybrid cache)...');
  const mergedMovies = HybridCache.mergeWithPrevious(
    deduplicatedMovies,
    previousCatalog,
    100  // All 100 slots from fresh quality movies, cache only fills if we're short
  );

  const mergeStats = HybridCache.getMergeStats(mergedMovies, deduplicatedMovies);
  console.log(`  ✓ Merged: ${mergeStats.freshMovies} fresh (${mergeStats.freshPercentage}%) + ${mergeStats.cachedMovies} cached (${mergeStats.cachedPercentage}%)`);

  // Fetch detailed info for selected movies
  console.log('\n📥 Fetching movie details...');
  const allSelectedIds = [];
  const genresWithDetails = {};

  for (const genreCode of allGenreCodes) {
    const movies = mergedMovies[genreCode] || [];
    // Extract TMDB numeric IDs for API calls
    // Fresh movies have numeric id, cached movies have tmdbId field
    const movieIds = movies.map(m => m.tmdbId || m.id);

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
  const catalogData = {
    genres: genresWithDetails,
    strategy: scoringEngine.getStrategyName(),
    debug: scoringEngine.getDebugInfo(),
    updatedAt: new Date().toISOString()
  };

  // Calculate totals
  const totalMovies = Object.values(genresWithDetails)
    .reduce((sum, movies) => sum + movies.length, 0);

  // Store in Netlify Blobs
  console.log('\n💾 Storing catalog data...');
  
  await store.setJSON('catalog', catalogData);
  console.log('  ✓ Catalog saved');

  // Store metadata for health checks
  const metadata = {
    updatedAt: new Date().toISOString(),
    strategy: scoringEngine.getStrategyName(),
    genreCount: Object.keys(genresWithDetails).length,
    totalMovies,
    apiRequests: tmdb.getRequestCount()
  };
  
  await store.setJSON('metadata', metadata);
  console.log('  ✓ Metadata saved');

  // Store current catalog as previous for next run (hybrid caching)
  await store.setJSON('catalog-previous', catalogData);
  console.log('  ✓ Saved current catalog for tomorrow\'s hybrid merge');

  // Update recent movie IDs for next run
  const uniqueSelectedIds = [...new Set(allSelectedIds)];
  const updatedRecentIds = [...new Set([...uniqueSelectedIds, ...recentMovieIds])].slice(0, 4000);

  await store.setJSON('recent-movies', {
    ids: updatedRecentIds,
    updatedAt: new Date().toISOString()
  });
  console.log(`  ✓ Updated recent movies (${updatedRecentIds.length} total)`);

  // Summary
  console.log('\n✅ Update complete!');
  console.log('━'.repeat(50));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🎯 Strategy: ${scoringEngine.getStrategyName()}`);
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
