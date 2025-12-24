/**
 * SIMPLE UPDATE - Just TMDB data, no OMDb, Fanart, Wikidata
 */

require('dotenv').config();

const { getStore } = require('@netlify/blobs');
const TMDBClient = require('../lib/tmdb-client');
const { GENRES, getCurrentSeason, SEASONAL_HOLIDAYS } = require('../lib/constants');

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

async function runUpdate() {
  console.log('🎬 Starting SIMPLE TMDB catalog update...');
  console.log(`📅 Date: ${new Date().toISOString()}`);

  validateEnv();

  const tmdb = new TMDBClient(process.env.TMDB_API_KEY);
  const allGenreCodes = Object.keys(GENRES);

  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  console.log('\n🔍 Fetching from TMDB...');

  const moviesByGenre = {};
  const usedMovieIds = new Set();

  for (const genreCode of allGenreCodes) {
    const genre = GENRES[genreCode];
    console.log(`  → ${genre.name}...`);

    try {
      let movies = [];

      if (genre.isSeasonal) {
        const currentSeason = getCurrentSeason();
        const seasonalHoliday = SEASONAL_HOLIDAYS[currentSeason.key];
        console.log(`    → Current season: ${seasonalHoliday.name}`);

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
        // Fetch top-rated and popular
        console.log(`    → Fetching top-rated...`);
        const topRated = await tmdb.fetchGenreMovies(
          genre.id,
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          'vote_average.desc',
          { minVotes: 500 }
        );

        console.log(`    → Fetching popular...`);
        const popular = await tmdb.fetchGenreMovies(
          genre.id,
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          'popularity.desc',
          { minVotes: 100 }
        );

        // Combine and dedupe
        const allMovies = [...topRated, ...popular];
        const uniqueMovies = Array.from(
          new Map(allMovies.map(m => [m.id, m])).values()
        );

        console.log(`    → Combined: ${topRated.length} top-rated + ${popular.length} popular = ${uniqueMovies.length} unique`);
        movies = uniqueMovies;
      }

      // Filter movies
      const filtered = movies.filter(movie => {
        if (!movie || !movie.id) return false;
        if (usedMovieIds.has(movie.id)) return false;
        if (!movie.title || !movie.poster_path) return false;
        if (genre.filter && !genre.filter(movie)) return false;
        return true;
      });

      console.log(`    ✓ Selected ${filtered.length} movies (from ${movies.length} fetched, ${filtered.length} after filter)`);

      moviesByGenre[genreCode] = filtered;
      filtered.forEach(m => usedMovieIds.add(m.id));

    } catch (error) {
      console.error(`    ✗ Error fetching ${genre.name}:`, error.message);
      moviesByGenre[genreCode] = [];
    }
  }

  const totalMovies = Object.values(moviesByGenre).reduce((sum, movies) => sum + movies.length, 0);
  console.log(`\n🎯 Total unique movies selected: ${totalMovies}`);

  // STEP 2: Fetch movie details from TMDB
  console.log('\n📥 Fetching movie details...');

  for (const [genreCode, movies] of Object.entries(moviesByGenre)) {
    const genre = GENRES[genreCode];
    if (movies.length === 0) continue;

    console.log(`  → ${genre.name}: ${movies.length} movies`);

    const detailedMovies = [];
    for (let i = 0; i < movies.length; i++) {
      try {
        const details = await tmdb.getMovieDetails(movies[i].id);
        if (details) {
          detailedMovies.push(details);
        }
        if ((i + 1) % 100 === 0) {
          console.log(`    → Progress: ${i + 1}/${movies.length}`);
        }
        await sleep(100);
      } catch (error) {
        console.error(`    ✗ Failed to fetch details for movie ${movies[i].id}`);
      }
    }

    console.log(`    ✓ Got details for ${detailedMovies.length} movies`);
    moviesByGenre[genreCode] = detailedMovies;
  }

  console.log(`\n📊 Total API requests: ${tmdb.getRequestCount()}`);

  // STEP 3: Build catalog
  console.log('\n🔨 Building catalog...');

  const catalogData = {
    genres: {},
    metadata: {
      updatedAt: new Date().toISOString(),
      totalMovies: 0,
      version: '2.0-simple'
    }
  };

  for (const [genreCode, movies] of Object.entries(moviesByGenre)) {
    const genre = GENRES[genreCode];

    // Convert to Stremio format
    const metas = movies
      .map(movie => TMDBClient.toStremioMeta(movie))
      .filter(meta => meta && meta.id && meta.name && meta.poster);

    // Sort by TMDB popularity
    metas.sort((a, b) => (b.year || 0) - (a.year || 0));

    catalogData.genres[genreCode] = metas;
    catalogData.metadata.totalMovies += metas.length;

    console.log(`  ✓ ${genre.name}: ${metas.length} movies`);
  }

  // STEP 4: Save to Netlify Blobs
  console.log('\n💾 Saving catalog to Netlify Blobs...');
  await store.setJSON('catalog', catalogData);
  console.log('  ✓ Catalog saved');

  console.log('\n✅ Update complete!');
  Object.entries(catalogData.genres).forEach(([code, movies]) => {
    const genre = GENRES[code];
    if (movies.length > 0) {
      console.log(`  ✅ ${genre.name}: ${movies.length} movies`);
    }
  });

  console.log('\n🎉 Simple update finished successfully!');
}

runUpdate().catch(error => {
  console.error('\n❌ Update failed:', error);
  process.exit(1);
});
