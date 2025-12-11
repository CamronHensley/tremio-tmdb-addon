/**
 * Nightly Update Script (SIMPLIFIED)
 *
 * Runs via GitHub Actions at midnight UTC
 * Fetches fresh data from TMDB and stores in Netlify Blobs
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');
const TMDBClient = require('../lib/tmdb-client');
const WikidataClient = require('../lib/wikidata-client');
const FanartClient = require('../lib/fanart-client');
const OMDbClient = require('../lib/omdb-client');
const { GENRES, MOVIES_PER_GENRE, STREAMING_SERVICES, getCurrentSeason, SEASONAL_HOLIDAYS } = require('../lib/constants');

// Validate environment variables
function validateEnv() {
  const required = ['TMDB_API_KEY', 'NETLIFY_ACCESS_TOKEN', 'NETLIFY_SITE_ID'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main update function
async function runUpdate() {
  console.log('🎬 Starting nightly TMDB catalog update...');
  console.log(`📅 Date: ${new Date().toISOString()}`);

  validateEnv();

  const tmdb = new TMDBClient(process.env.TMDB_API_KEY);
  const allGenreCodes = Object.keys(GENRES);

  // Get store for Netlify Blobs
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // STEP 1: Fetch movies from TMDB
  console.log('\n🔍 Fetching from TMDB...');
  console.log(`📄 Fetching from BOTH top_rated (all-time classics) AND popular (recent hits)`);
  console.log(`📄 15 pages each = ~600 movies per genre to overcome recency bias`);

  const moviesByGenre = {};
  const usedMovieIds = new Set(); // Global deduplication

  for (const genreCode of allGenreCodes) {
    const genre = GENRES[genreCode];
    console.log(`  → ${genre.name}...`);

    try {
      let movies = [];

      // Handle seasonal genre differently
      if (genre.isSeasonal) {
        const currentSeason = getCurrentSeason();
        const seasonalHoliday = SEASONAL_HOLIDAYS[currentSeason.key];

        console.log(`    → Current season: ${seasonalHoliday.name}`);

        // Fetch seasonal movies using keywords - expanded to 15 pages
        const seasonalMovies = [];
        for (let page = 1; page <= 15; page++) {
          const response = await tmdb.discoverSeasonalMovies(
            seasonalHoliday.tmdbKeywordIds,
            {
              page,
              sortBy: 'popularity.desc',
              minVotes: 100,
              excludeGenres: seasonalHoliday.excludeGenres || []
            }
          );
          if (response.results && response.results.length > 0) {
            seasonalMovies.push(...response.results);
          }
          await sleep(200);
        }
        movies = seasonalMovies;

      } else {
        // DUAL FETCH STRATEGY: Top-rated (classics) + Popular (recent)
        console.log(`    → Fetching top-rated (all-time classics)...`);
        const topRated = await tmdb.fetchGenreMovies(
          genre.id,
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          'vote_average.desc',
          { minVotes: 500 } // Higher threshold for classics
        );

        console.log(`    → Fetching popular (recent hits)...`);
        const popular = await tmdb.fetchGenreMovies(
          genre.id,
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          'popularity.desc',
          { minVotes: 100 }
        );

        // Merge and deduplicate by TMDB ID
        const movieMap = new Map();
        [...topRated, ...popular].forEach(movie => {
          if (!movieMap.has(movie.id)) {
            movieMap.set(movie.id, movie);
          }
        });
        movies = Array.from(movieMap.values());

        console.log(`    → Combined: ${topRated.length} top-rated + ${popular.length} popular = ${movies.length} unique`);
      }

      // Filter: basic quality filter + not already used
      const filtered = movies.filter(movie => {
        // Skip if already used in another genre
        if (usedMovieIds.has(movie.id)) return false;

        // Quality filter (for all-time popular movies)
        return (
          movie.vote_count >= 100 &&
          movie.popularity >= 5
        );
      });

      // Sort by popularity (will cache ALL, not just top 100)
      const sorted = filtered.sort((a, b) => b.popularity - a.popularity);

      // Mark these IDs as used for caching
      sorted.forEach(movie => usedMovieIds.add(movie.id));

      moviesByGenre[genreCode] = sorted;
      console.log(`    ✓ Selected ${sorted.length} movies (from ${movies.length} fetched, ${filtered.length} after filter)`);

    } catch (error) {
      console.error(`    ✗ Failed: ${error.message}`);
      moviesByGenre[genreCode] = [];
    }

    await sleep(200); // Rate limit courtesy delay
  }

  console.log(`\n📊 Total API requests for discovery: ${tmdb.getRequestCount()}`);
  console.log(`🎯 Total unique movies selected: ${usedMovieIds.size}`);

  // STEP 2: Fetch full details for all selected movies
  console.log('\n📥 Fetching movie details...');
  const genresWithDetails = {};

  for (const genreCode of allGenreCodes) {
    const movies = moviesByGenre[genreCode] || [];
    const movieIds = movies.map(m => m.id);

    console.log(`  → ${GENRES[genreCode].name}: ${movies.length} movies`);

    if (movieIds.length === 0) {
      genresWithDetails[genreCode] = [];
      continue;
    }

    // Fetch details in batches
    const details = await tmdb.fetchMovieDetailsBatch(movieIds);

    // Convert to Stremio format
    const moviesWithMeta = details
      .map(movie => TMDBClient.toStremioMeta(movie))
      .filter(meta => meta !== null);

    genresWithDetails[genreCode] = moviesWithMeta;

    console.log(`    ✓ Got details for ${genresWithDetails[genreCode].length} movies`);
  }

  console.log(`\n📊 Total API requests: ${tmdb.getRequestCount()}`);

  // STEP 3: Fetch IMDb ratings from OMDb (optional, with persistent caching)
  console.log('\n⭐ Fetching IMDb ratings from OMDb...');
  const omdbApiKey = process.env.OMDB_API_KEY;
  let imdbRatingsMap = new Map();
  let omdb = null;

  // TEMPORARILY DISABLED: Skip OMDb to let Fanart/Wikidata caches build
  if (false && omdbApiKey) {
    // Load existing IMDb ratings cache from Netlify Blobs
    console.log('  → Loading cached IMDb ratings from Netlify Blobs...');
    let cachedRatings = null;
    try {
      cachedRatings = await store.get('imdb-ratings', { type: 'json' });
      if (cachedRatings) {
        const cacheSize = Object.keys(cachedRatings).length;
        console.log(`  ✓ Loaded ${cacheSize} cached IMDb ratings`);
      } else {
        console.log('  → No cached ratings found, starting fresh');
      }
    } catch (error) {
      console.log('  → No cached ratings found, starting fresh');
    }

    // Initialize OMDb client with persistent cache
    const persistentCache = OMDbClient.loadPersistentCache(cachedRatings);
    omdb = new OMDbClient(omdbApiKey, persistentCache);

    // Collect IMDb IDs - PRIORITIZE top movies per genre first
    // This ensures we fetch ratings for movies that will actually be displayed
    const priorityImdbIds = [];
    const otherImdbIds = [];

    for (const genreCode of allGenreCodes) {
      const movies = genresWithDetails[genreCode] || [];

      movies.forEach((movie, index) => {
        const imdbUrl = movie.links?.imdb;
        if (imdbUrl) {
          const match = imdbUrl.match(/tt\d+/);
          if (match) {
            const imdbId = match[0];
            // Top 100 movies per genre get priority (will be in display catalog)
            if (index < MOVIES_PER_GENRE) {
              priorityImdbIds.push(imdbId);
            } else {
              otherImdbIds.push(imdbId);
            }
          }
        }
      });
    }

    // Fetch priority movies first, then others (so we don't waste API calls on low-priority movies)
    const imdbIds = [...priorityImdbIds, ...otherImdbIds];

    console.log(`  → Found ${imdbIds.length} total movies (${priorityImdbIds.length} priority, ${otherImdbIds.length} overflow)`);

    if (imdbIds.length > 0) {
      // Fetch ratings in batch (will use cache for existing movies)
      imdbRatingsMap = await omdb.getMovieRatingsBatch(imdbIds);

      console.log(`\n🎯 OMDb results: ${imdbRatingsMap.size} movies with IMDb ratings`);
      console.log(`📊 OMDb API requests (new only): ${omdb.getRequestCount()}`);
      console.log(`💾 Cached ratings used: ${imdbRatingsMap.size - omdb.getRequestCount()}`);

      // Save updated cache back to Netlify Blobs
      if (omdb.getNewRatings().size > 0) {
        console.log(`\n💾 Saving ${omdb.getNewRatings().size} new IMDb ratings to cache...`);
        const mergedCache = OMDbClient.mergeCaches(persistentCache, omdb.getNewRatings());
        await store.setJSON('imdb-ratings', mergedCache);
        console.log(`  ✓ IMDb ratings cache updated (total: ${Object.keys(mergedCache).length} movies)`);
      } else {
        console.log('\n💾 No new IMDb ratings to save (all loaded from cache)');
      }

      // Calculate weighted scores and re-sort each genre
      console.log('\n🔢 Calculating weighted scores and re-sorting by all-time popularity...');
      for (const genreCode of allGenreCodes) {
        const movies = genresWithDetails[genreCode] || [];

        // Add weighted scores to movies
        for (const movie of movies) {
          const imdbUrl = movie.links?.imdb;
          if (imdbUrl) {
            const match = imdbUrl.match(/tt\d+/);
            if (match) {
              const imdbId = match[0];
              const ratingData = imdbRatingsMap.get(imdbId);

              if (ratingData) {
                movie.imdbRating = ratingData.rating;
                movie.imdbVotes = ratingData.votes;
                movie.weightedScore = OMDbClient.calculateWeightedScore(ratingData.rating, ratingData.votes);
              } else {
                movie.weightedScore = 0; // No rating available
              }
            }
          } else {
            movie.weightedScore = 0; // No IMDb ID
          }
        }

        // Re-sort by weighted score (descending)
        movies.sort((a, b) => b.weightedScore - a.weightedScore);

        const withRatings = movies.filter(m => m.weightedScore > 0).length;
        console.log(`  → ${GENRES[genreCode].name}: ${withRatings}/${movies.length} movies with IMDb ratings`);
      }
    }
  } else {
    console.log('  ⊘ OMDb API key not provided, using TMDB popularity sorting');
  }

  // STEP 4: Fetch high-quality posters from Fanart.tv (optional)
  console.log('\n🎨 Fetching high-quality posters from Fanart.tv...');
  const fanartApiKey = process.env.FANART_API_KEY;
  let fanartPosterMap = new Map();

  if (fanartApiKey) {
    // Load existing Fanart.tv posters cache from Netlify Blobs
    console.log('  → Loading cached Fanart.tv posters from Netlify Blobs...');
    let cachedPosters = null;
    try {
      cachedPosters = await store.get('fanart-posters', { type: 'json' });
      if (cachedPosters) {
        const cacheSize = Object.keys(cachedPosters).length;
        console.log(`  ✓ Loaded ${cacheSize} cached Fanart.tv posters`);
      }
    } catch (error) {
      console.log('  → No cached posters found, starting fresh');
    }

    // Initialize Fanart client with persistent cache
    const persistentPosterCache = FanartClient.loadPersistentCache(cachedPosters);
    const fanart = new FanartClient(fanartApiKey, persistentPosterCache);

    // Collect TMDB IDs - PRIORITIZE top movies per genre first
    const priorityTmdbIds = [];
    const otherTmdbIds = [];

    for (const genreCode of allGenreCodes) {
      const movies = genresWithDetails[genreCode] || [];
      movies.forEach((movie, index) => {
        const tmdbId = movie.tmdbId;
        if (tmdbId) {
          if (index < MOVIES_PER_GENRE) {
            priorityTmdbIds.push(tmdbId);
          } else {
            otherTmdbIds.push(tmdbId);
          }
        }
      });
    }

    // Fetch priority movies first, then others
    const tmdbIdsWithPosters = [...priorityTmdbIds, ...otherTmdbIds];
    console.log(`  → Checking ${tmdbIdsWithPosters.length} movies (${priorityTmdbIds.length} priority, ${otherTmdbIds.length} overflow)`);

    // Fetch in smaller batches to avoid long waits
    const batchSize = 50;
    for (let i = 0; i < tmdbIdsWithPosters.length; i += batchSize) {
      const batch = tmdbIdsWithPosters.slice(i, i + batchSize);
      console.log(`  → Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tmdbIdsWithPosters.length / batchSize)}: ${batch.length} movies`);

      const batchResults = await fanart.getMovieArtworkBatch(batch);

      // Merge results
      for (const [tmdbId, posterUrl] of batchResults.entries()) {
        fanartPosterMap.set(tmdbId, posterUrl);
      }

      console.log(`    ✓ Found ${batchResults.size} Fanart.tv posters in this batch`);
    }

    console.log(`\n🎯 Fanart.tv results: ${fanartPosterMap.size} high-quality posters found`);
    console.log(`📊 Fanart.tv API requests: ${fanart.getRequestCount()}`);

    // Replace TMDB posters with Fanart.tv posters where available
    console.log('\n🖼️  Replacing posters with Fanart.tv versions...');
    let replacedCount = 0;
    for (const genreCode of allGenreCodes) {
      const movies = genresWithDetails[genreCode] || [];
      for (const movie of movies) {
        // Extract TMDB ID
        let tmdbId = null;
        if (movie.id.startsWith('tmdb:')) {
          tmdbId = parseInt(movie.id.replace('tmdb:', ''), 10);
        }

        if (tmdbId && fanartPosterMap.has(tmdbId)) {
          // Store original TMDB poster as backup
          movie.posterTmdb = movie.poster;
          movie.poster = fanartPosterMap.get(tmdbId);
          replacedCount++;
        }
      }
    }
    console.log(`  ✓ Replaced ${replacedCount} posters with Fanart.tv versions`);

    // Save updated Fanart.tv cache back to Netlify Blobs
    if (fanart.getNewPosters().size > 0) {
      console.log(`\n💾 Saving ${fanart.getNewPosters().size} new Fanart.tv posters to cache...`);
      const mergedPosterCache = FanartClient.mergeCaches(persistentPosterCache, fanart.getNewPosters());
      await store.setJSON('fanart-posters', mergedPosterCache);
      console.log(`  ✓ Fanart.tv posters cache updated (total: ${Object.keys(mergedPosterCache).length} movies)`);
    } else {
      console.log('\n💾 No new Fanart.tv posters to save (all from cache)');
    }
  } else {
    console.log('  ⊘ Fanart.tv API key not provided, using TMDB posters');
  }

  // STEP 5: Query Wikidata for streaming originals
  console.log('\n🌐 Querying Wikidata for streaming originals...');

  // Load existing Wikidata cache from Netlify Blobs
  console.log('  → Loading cached streaming originals from Netlify Blobs...');
  let cachedStreamingOriginals = null;
  try {
    cachedStreamingOriginals = await store.get('wikidata-streaming', { type: 'json' });
    if (cachedStreamingOriginals) {
      const cacheSize = Object.keys(cachedStreamingOriginals).length;
      console.log(`  ✓ Loaded ${cacheSize} cached streaming originals`);
    }
  } catch (error) {
    console.log('  → No cached streaming originals found, starting fresh');
  }

  // Initialize Wikidata client with persistent cache
  const persistentStreamingCache = WikidataClient.loadPersistentCache(cachedStreamingOriginals);
  const wikidata = new WikidataClient(persistentStreamingCache);

  // Collect TMDB IDs - PRIORITIZE top movies per genre first
  const priorityWikidataTmdbIds = [];
  const otherWikidataTmdbIds = [];

  for (const genreCode of allGenreCodes) {
    const movies = genresWithDetails[genreCode] || [];
    movies.forEach((movie, index) => {
      const tmdbId = movie.tmdbId;
      if (tmdbId) {
        if (index < MOVIES_PER_GENRE) {
          priorityWikidataTmdbIds.push(tmdbId);
        } else {
          otherWikidataTmdbIds.push(tmdbId);
        }
      }
    });
  }

  // Fetch priority movies first, then others
  const allTmdbIds = [...priorityWikidataTmdbIds, ...otherWikidataTmdbIds];
  console.log(`  → Checking ${allTmdbIds.length} movies (${priorityWikidataTmdbIds.length} priority, ${otherWikidataTmdbIds.length} overflow)`);

  // Batch queries (50 IDs per query to stay under URL limits)
  const batchSize = 50;
  const streamingOriginalsMap = new Map();

  for (let i = 0; i < allTmdbIds.length; i += batchSize) {
    const batch = allTmdbIds.slice(i, i + batchSize);
    console.log(`  → Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allTmdbIds.length / batchSize)}: ${batch.length} movies`);

    try {
      const results = await wikidata.getStreamingOriginalsBatch(batch);

      // Merge results
      for (const [tmdbId, serviceCode] of results.entries()) {
        streamingOriginalsMap.set(tmdbId, serviceCode);
      }

      console.log(`    ✓ Found ${results.size} streaming originals in this batch`);

      // Rate limit: 1 second between queries
      if (i + batchSize < allTmdbIds.length) {
        await WikidataClient.rateLimit();
      }

    } catch (error) {
      console.error(`    ✗ Batch failed: ${error.message}`);
    }
  }

  console.log(`\n🎯 Wikidata results: ${streamingOriginalsMap.size} streaming originals found`);
  console.log(`📊 Wikidata API requests: ${wikidata.getRequestCount()}`);

  // Show breakdown by service
  const serviceCounts = {};
  for (const serviceCode of streamingOriginalsMap.values()) {
    serviceCounts[serviceCode] = (serviceCounts[serviceCode] || 0) + 1;
  }
  console.log('\n📊 Streaming Originals Breakdown:');
  for (const [serviceCode, count] of Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])) {
    const serviceName = STREAMING_SERVICES[serviceCode]?.name || serviceCode;
    console.log(`  ${serviceName}: ${count} movies`);
  }

  // Save updated Wikidata cache back to Netlify Blobs
  if (wikidata.getNewStreamingOriginals().size > 0) {
    console.log(`\n💾 Saving ${wikidata.getNewStreamingOriginals().size} new streaming originals to cache...`);
    const mergedStreamingCache = WikidataClient.mergeCaches(persistentStreamingCache, wikidata.getNewStreamingOriginals());
    await store.setJSON('wikidata-streaming', mergedStreamingCache);
    console.log(`  ✓ Wikidata streaming originals cache updated (total: ${Object.keys(mergedStreamingCache).length} movies)`);
  } else {
    console.log('\n💾 No new streaming originals to save (all from cache)');
  }

  // STEP 6: Add streaming originals badges to poster URLs
  console.log('\n🏷️  Adding streaming original badges to posters...');

  // Get Netlify site URL from environment (defaults to placeholder for local dev)
  const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'https://your-addon.netlify.app';

  for (const genreCode of allGenreCodes) {
    const movies = genresWithDetails[genreCode] || [];

    for (const movie of movies) {
      // Extract TMDB ID from movie.id (format: "tmdb:12345" or "tt1234567")
      let tmdbId = null;
      if (movie.id.startsWith('tmdb:')) {
        tmdbId = parseInt(movie.id.replace('tmdb:', ''), 10);
      }
      // If it's an IMDB ID, we need to look it up in our original data
      // For now, we'll skip IMDB IDs since we have TMDB IDs from the fetch

      if (tmdbId && streamingOriginalsMap.has(tmdbId)) {
        const serviceCode = streamingOriginalsMap.get(tmdbId);
        const serviceName = STREAMING_SERVICES[serviceCode]?.name || serviceCode;

        // Store streaming original info (for reference/debugging)
        movie.streamingOriginal = {
          service: serviceCode,
          serviceName: serviceName
        };

        // Modify poster URL to use our badge overlay function
        // Works with both TMDB and Fanart.tv URLs
        if (movie.poster) {
          const posterUrl = encodeURIComponent(movie.poster);
          movie.poster = `${siteUrl}/.netlify/functions/poster?url=${posterUrl}&badge=${serviceCode}`;
        }
      }
    }
  }

  const moviesWithBadges = Object.values(genresWithDetails)
    .flat()
    .filter(m => m.streamingOriginal).length;
  console.log(`  ✓ Added badges to ${moviesWithBadges} streaming original posters`);

  // STEP 7: Store in Netlify Blobs

  // Save FULL CACHE (all fetched movies for rotation pool)
  const fullCacheData = {
    genres: genresWithDetails,
    strategy: 'SIMPLE_POPULAR',
    updatedAt: new Date().toISOString()
  };

  const totalMovies = Object.values(genresWithDetails)
    .reduce((sum, movies) => sum + movies.length, 0);

  console.log('\n💾 Storing catalog data...');

  await store.setJSON('catalog-full-cache', fullCacheData);
  console.log(`  ✓ Full cache saved (${totalMovies} total movies across all genres)`);

  // Create DISPLAY CATALOG (top 100 per genre for Stremio)
  const displayGenres = {};
  for (const genreCode of allGenreCodes) {
    const allMovies = genresWithDetails[genreCode] || [];
    // Take top 100 by weighted score (already sorted)
    displayGenres[genreCode] = allMovies.slice(0, MOVIES_PER_GENRE);
  }

  const catalogData = {
    genres: displayGenres,
    strategy: 'SIMPLE_POPULAR',
    updatedAt: new Date().toISOString()
  };

  const displayTotal = Object.values(displayGenres)
    .reduce((sum, movies) => sum + movies.length, 0);

  await store.setJSON('catalog', catalogData);
  console.log(`  ✓ Display catalog saved (${displayTotal} movies = top ${MOVIES_PER_GENRE} per genre)`);

  const metadata = {
    updatedAt: new Date().toISOString(),
    strategy: omdb ? 'IMDB_WEIGHTED' : 'SIMPLE_POPULAR',
    genreCount: Object.keys(genresWithDetails).length,
    totalMovies,
    streamingOriginals: streamingOriginalsMap.size,
    imdbRatings: imdbRatingsMap.size,
    apiRequests: tmdb.getRequestCount(),
    wikidataRequests: wikidata.getRequestCount(),
    omdbRequests: omdb ? omdb.getRequestCount() : 0
  };

  await store.setJSON('metadata', metadata);
  console.log('  ✓ Metadata saved');

  // Summary
  console.log('\n✅ Update complete!');
  console.log('━'.repeat(50));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🎯 Strategy: ${omdb ? 'IMDB_WEIGHTED (all-time popular by IMDb ratings)' : 'SIMPLE_POPULAR (by TMDB popularity)'}`);
  console.log(`🎬 Total movies in cache: ${totalMovies}`);
  console.log(`🎬 Total movies in display catalog: ${displayTotal} (top ${MOVIES_PER_GENRE} per genre)`);
  console.log(`⭐ IMDb ratings: ${imdbRatingsMap.size}`);
  console.log(`🌐 Streaming originals: ${streamingOriginalsMap.size}`);
  console.log(`📁 Genres: ${Object.keys(genresWithDetails).length}`);
  console.log(`🔗 TMDB API requests: ${tmdb.getRequestCount()}`);
  if (omdb) console.log(`🔗 OMDb API requests: ${omdb.getRequestCount()}`);
  console.log(`🔗 Wikidata API requests: ${wikidata.getRequestCount()}`);
  console.log('━'.repeat(50));

  // Show genre breakdown
  console.log('\n📊 Genre Breakdown (Full Cache):');
  for (const genreCode of allGenreCodes) {
    const cacheCount = genresWithDetails[genreCode].length;
    const displayCount = displayGenres[genreCode].length;
    const status = cacheCount >= MOVIES_PER_GENRE ? '✅' : cacheCount >= 50 ? '⚠️ ' : '❌';
    console.log(`  ${status} ${GENRES[genreCode].name}: ${cacheCount} cached / ${displayCount} displayed`);
  }
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
