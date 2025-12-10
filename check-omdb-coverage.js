const { getStore } = require('@netlify/blobs');
require('dotenv').config();

const store = getStore({
  name: 'tmdb-catalog',
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_ACCESS_TOKEN
});

(async () => {
  console.log('Checking catalog vs OMDb cache coverage...\n');

  const catalog = await store.get('catalog', { type: 'json' });
  const imdbCache = await store.get('imdb-ratings', { type: 'json' });

  if (!catalog) {
    console.log('❌ No catalog found - workflow needs to run first');
    return;
  }

  if (!imdbCache) {
    console.log('❌ No OMDb cache found');
    return;
  }

  let totalMovies = 0;
  let moviesWithImdbId = 0;
  let moviesWithCachedRating = 0;
  let moviesNeedingRating = 0;
  const moviesNeedingRatingList = [];

  const genreCodes = Object.keys(catalog.genres || {});

  for (const genreCode of genreCodes) {
    const movies = catalog.genres[genreCode] || [];
    totalMovies += movies.length;

    for (const movie of movies) {
      const imdbUrl = movie.links?.imdb;
      if (imdbUrl) {
        const match = imdbUrl.match(/tt\d+/);
        if (match) {
          const imdbId = match[0];
          moviesWithImdbId++;

          if (imdbCache[imdbId]) {
            moviesWithCachedRating++;
          } else {
            moviesNeedingRating++;
            if (moviesNeedingRatingList.length < 10) {
              moviesNeedingRatingList.push(`${imdbId} - ${movie.name}`);
            }
          }
        }
      }
    }
  }

  console.log('Catalog Coverage Statistics:');
  console.log('═══════════════════════════════════');
  console.log(`Total movies in catalog: ${totalMovies}`);
  console.log(`Movies with IMDb ID: ${moviesWithImdbId}`);
  console.log(`Movies with cached OMDb rating: ${moviesWithCachedRating}`);
  console.log(`Movies needing OMDb rating: ${moviesNeedingRating}`);
  console.log('');
  console.log(`Coverage: ${((moviesWithCachedRating / moviesWithImdbId) * 100).toFixed(1)}%`);
  console.log('');

  if (moviesNeedingRating > 0) {
    console.log('Sample movies needing ratings (first 10):');
    moviesNeedingRatingList.forEach((movie, i) => {
      console.log(`  ${i + 1}. ${movie}`);
    });
    console.log('');
    console.log('Next workflow run will fetch ratings for these movies.');
  } else {
    console.log('✅ All movies in catalog have OMDb ratings cached!');
  }
})();
