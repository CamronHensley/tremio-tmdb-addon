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
  let recentMovieIds = [];
  try {
    const recentData = await store.get('recent-movies', { type: 'json' });
    recentMovieIds = recentData?.ids || [];
    console.log(`📜 Loaded ${recentMovieIds.length} recent movie IDs for diversity`);
  } catch (e) {
    console.log('📜 No recent movie history found (first run?)');
  }

  // Adaptive fetching: Start with 2 pages, fetch more if needed
  const moviesByGenre = {};
  const allGenreCodes = Object.keys(GENRES);
  let currentPages = scoringEngine.getRotationPages();
  const sortBy = scoringEngine.getSortParameter();
  const strategyParams = scoringEngine.getStrategyParams();
  const TARGET_NEW_MOVIES = 30; // Minimum new movies we want per genre
  const MAX_PAGES = 5;

  console.log('\n🔍 Adaptive fetching from TMDB...');
  console.log(`📄 Starting with pages: ${currentPages.join(', ')}`);

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

  // Process and deduplicate
  console.log('\n🔄 Processing and deduplicating movies...');
  const deduplicatedMovies = deduplicator.processAllGenres(moviesByGenre, recentMovieIds);

  const stats = deduplicator.getStats();
  console.log(`  ✓ Assigned ${stats.totalUniqueMovies} unique movies`);

  // Merge with previous catalog (hybrid caching)
  console.log('\n🔀 Merging with previous catalog (hybrid cache)...');
  const mergedMovies = HybridCache.mergeWithPrevious(
    deduplicatedMovies,
    previousCatalog,
    30  // Top 30 movies are fresh, rest from cache
  );

  const mergeStats = HybridCache.getMergeStats(mergedMovies, deduplicatedMovies);
  console.log(`  ✓ Merged: ${mergeStats.freshMovies} fresh (${mergeStats.freshPercentage}%) + ${mergeStats.cachedMovies} cached (${mergeStats.cachedPercentage}%)`);

  // Fetch detailed info for selected movies
  console.log('\n📥 Fetching movie details...');
  const allSelectedIds = [];
  const genresWithDetails = {};

  for (const genreCode of allGenreCodes) {
    const movies = mergedMovies[genreCode] || [];
    const movieIds = movies.map(m => m.id);
    allSelectedIds.push(...movieIds);

    console.log(`  → ${GENRES[genreCode].name}: ${movies.length} movies`);

    // Fetch details in batches
    const details = await tmdb.fetchMovieDetailsBatch(movieIds);

    // Convert to Stremio format
    genresWithDetails[genreCode] = details
      .map(movie => TMDBClient.toStremioMeta(movie))
      .filter(meta => meta !== null)
      .slice(0, MOVIES_PER_GENRE);

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
