/**
 * OMDb Cache Builder
 * Fetches OMDb ratings for all movies in catalog
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');
const OMDbClient = require('../lib/omdb-client');
const { GENRES } = require('../lib/constants');

async function cacheOMDb() {
  console.log('🎬 Starting OMDb cache build...');
  console.log(`📅 Date: ${new Date().toISOString()}`);

  const omdbApiKey = process.env.OMDB_API_KEY;
  if (!omdbApiKey) {
    console.log('⊘ OMDb API key not provided, skipping');
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

  // Load existing OMDb cache
  console.log('\n💾 Loading existing OMDb cache...');
  let cachedRatings = null;
  try {
    cachedRatings = await store.get('imdb-ratings', { type: 'json' });
    if (cachedRatings) {
      console.log(`  ✓ Loaded ${Object.keys(cachedRatings).length} cached ratings`);
    }
  } catch (error) {
    console.log('  → No cached ratings found, starting fresh');
  }

  const persistentCache = OMDbClient.loadPersistentCache(cachedRatings);
  const omdb = new OMDbClient(omdbApiKey, persistentCache);

  // Collect ALL IMDb IDs from catalog-full-cache
  console.log('\n🔍 Collecting IMDb IDs from all movies...');
  const imdbIds = [];
  const allGenreCodes = Object.keys(GENRES);

  for (const genreCode of allGenreCodes) {
    const movies = catalogFull.genres?.[genreCode] || [];
    for (const movie of movies) {
      const imdbUrl = movie.links?.imdb;
      if (imdbUrl) {
        const match = imdbUrl.match(/tt\d+/);
        if (match && !imdbIds.includes(match[0])) {
          imdbIds.push(match[0]);
        }
      }
    }
  }

  console.log(`  → Found ${imdbIds.length} unique movies with IMDb IDs`);

  // Fetch ratings
  console.log('\n⭐ Fetching OMDb ratings...');
  const imdbRatingsMap = await omdb.getMovieRatingsBatch(imdbIds);

  console.log(`\n🎯 Results:`);
  console.log(`  → ${imdbRatingsMap.size} movies with ratings`);
  console.log(`  → ${omdb.getRequestCount()} new API requests`);
  console.log(`  → ${imdbRatingsMap.size - omdb.getRequestCount()} from cache`);

  // Save updated cache
  if (omdb.getNewRatings().size > 0) {
    console.log(`\n💾 Saving ${omdb.getNewRatings().size} new ratings to cache...`);
    const mergedCache = OMDbClient.mergeCaches(persistentCache, omdb.getNewRatings());
    await store.setJSON('imdb-ratings', mergedCache);
    console.log(`  ✓ Cache updated (total: ${Object.keys(mergedCache).length} movies)`);
  } else {
    console.log('\n💾 No new ratings to save (all from cache)');
  }

  console.log('\n✅ OMDb cache build complete!');
}

cacheOMDb().catch(error => {
  console.error('\n❌ Cache build failed:', error);
  process.exit(1);
});
