/**
 * Fanart.tv Cache Builder
 * Fetches HD posters for all movies in catalog
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');
const FanartClient = require('../lib/fanart-client');
const { GENRES } = require('../lib/constants');

async function cacheFanart() {
  console.log('🎬 Starting Fanart.tv cache build...');
  console.log(`📅 Date: ${new Date().toISOString()}`);

  const fanartApiKey = process.env.FANART_API_KEY;
  if (!fanartApiKey) {
    console.log('⊘ Fanart.tv API key not provided, skipping');
    return;
  }

  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // Load catalog
  console.log('\n📥 Loading catalog...');
  const catalogFull = await store.get('catalog-full-cache', { type: 'json' });

  if (!catalogFull) {
    console.log('❌ No catalog found. Run nightly-update first.');
    process.exit(1);
  }

  // Load existing Fanart cache
  console.log('\n💾 Loading existing Fanart.tv cache...');
  let cachedPosters = null;
  try {
    cachedPosters = await store.get('fanart-posters', { type: 'json' });
    if (cachedPosters) {
      console.log(`  ✓ Loaded ${Object.keys(cachedPosters).length} cached posters`);
    }
  } catch (error) {
    console.log('  → No cached posters found, starting fresh');
  }

  const persistentPosterCache = FanartClient.loadPersistentCache(cachedPosters);
  const fanart = new FanartClient(fanartApiKey, persistentPosterCache);

  // Collect ALL TMDB IDs from catalog-full-cache
  console.log('\n🔍 Collecting TMDB IDs from all movies...');
  const tmdbIds = [];
  const allGenreCodes = Object.keys(GENRES);

  for (const genreCode of allGenreCodes) {
    const movies = catalogFull.genres?.[genreCode] || [];
    for (const movie of movies) {
      const tmdbId = movie.tmdbId;
      if (tmdbId && !tmdbIds.includes(tmdbId)) {
        tmdbIds.push(tmdbId);
      }
    }
  }

  console.log(`  → Found ${tmdbIds.length} unique movies`);

  // Fetch posters in batches
  console.log('\n🎨 Fetching Fanart.tv posters...');
  const batchSize = 50;
  const fanartPosterMap = new Map();

  for (let i = 0; i < tmdbIds.length; i += batchSize) {
    const batch = tmdbIds.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(tmdbIds.length / batchSize);

    console.log(`  → Batch ${batchNum}/${totalBatches}: ${batch.length} movies`);

    const batchResults = await fanart.getMovieArtworkBatch(batch);

    for (const [tmdbId, posterUrl] of batchResults.entries()) {
      fanartPosterMap.set(tmdbId, posterUrl);
    }

    console.log(`    ✓ Found ${batchResults.size} posters`);
  }

  console.log(`\n🎯 Results:`);
  console.log(`  → ${fanartPosterMap.size} movies with HD posters`);
  console.log(`  → ${fanart.getRequestCount()} API requests`);

  // Save updated cache
  if (fanart.getNewPosters().size > 0) {
    console.log(`\n💾 Saving ${fanart.getNewPosters().size} new posters to cache...`);
    const mergedPosterCache = FanartClient.mergeCaches(persistentPosterCache, fanart.getNewPosters());
    await store.setJSON('fanart-posters', mergedPosterCache);
    console.log(`  ✓ Cache updated (total: ${Object.keys(mergedPosterCache).length} movies)`);
  } else {
    console.log('\n💾 No new posters to save (all from cache)');
  }

  console.log('\n✅ Fanart.tv cache build complete!');
}

cacheFanart().catch(error => {
  console.error('\n❌ Cache build failed:', error);
  process.exit(1);
});
