/**
 * Wikidata Cache Builder
 * Fetches streaming originals data for all movies in catalog
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');
const WikidataClient = require('../lib/wikidata-client');
const { GENRES } = require('../lib/constants');

async function cacheWikidata() {
  console.log('🎬 Starting Wikidata cache build...');
  console.log(`📅 Date: ${new Date().toISOString()}`);

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

  // Load existing Wikidata cache
  console.log('\n💾 Loading existing Wikidata cache...');
  let cachedStreamingOriginals = null;
  try {
    cachedStreamingOriginals = await store.get('wikidata-streaming', { type: 'json' });
    if (cachedStreamingOriginals) {
      console.log(`  ✓ Loaded ${Object.keys(cachedStreamingOriginals).length} cached entries`);
    }
  } catch (error) {
    console.log('  → No cached data found, starting fresh');
  }

  const persistentStreamingCache = WikidataClient.loadPersistentCache(cachedStreamingOriginals);
  const wikidata = new WikidataClient(persistentStreamingCache);

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

  // Fetch streaming data in batches
  console.log('\n🌐 Querying Wikidata for streaming originals...');
  const batchSize = 50;
  const streamingOriginalsMap = new Map();

  for (let i = 0; i < tmdbIds.length; i += batchSize) {
    const batch = tmdbIds.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(tmdbIds.length / batchSize);

    console.log(`  → Batch ${batchNum}/${totalBatches}: ${batch.length} movies`);

    try {
      const results = await wikidata.getStreamingOriginalsBatch(batch);

      for (const [tmdbId, serviceCode] of results.entries()) {
        streamingOriginalsMap.set(tmdbId, serviceCode);
      }

      console.log(`    ✓ Found ${results.size} streaming originals`);

      // Rate limit: 1 second between queries
      if (i + batchSize < tmdbIds.length) {
        await WikidataClient.rateLimit();
      }

    } catch (error) {
      console.error(`    ✗ Batch failed: ${error.message}`);
    }
  }

  console.log(`\n🎯 Results:`);
  console.log(`  → ${streamingOriginalsMap.size} streaming originals found`);
  console.log(`  → ${wikidata.getRequestCount()} API requests`);

  // Save updated cache
  if (wikidata.getNewStreamingOriginals().size > 0) {
    console.log(`\n💾 Saving ${wikidata.getNewStreamingOriginals().size} new entries to cache...`);
    const mergedStreamingCache = WikidataClient.mergeCaches(persistentStreamingCache, wikidata.getNewStreamingOriginals());
    await store.setJSON('wikidata-streaming', mergedStreamingCache);
    console.log(`  ✓ Cache updated (total: ${Object.keys(mergedStreamingCache).length} movies)`);
  } else {
    console.log('\n💾 No new entries to save (all from cache)');
  }

  console.log('\n✅ Wikidata cache build complete!');
}

cacheWikidata().catch(error => {
  console.error('\n❌ Cache build failed:', error);
  process.exit(1);
});
