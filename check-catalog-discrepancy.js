const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function checkDiscrepancy() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const catalog = await store.get('catalog', { type: 'json' });
  const classificationState = await store.get('classification-state', { type: 'json' });

  console.log('\n=== CATALOG ANALYSIS ===\n');

  // Count movies in catalog
  const catalogMovieIds = new Set();
  const catalogMovies = new Map(); // id -> {title, genres}
  if (catalog && catalog.genres) {
    Object.entries(catalog.genres).forEach(([genreCode, movies]) => {
      if (Array.isArray(movies)) {
        movies.forEach(movie => {
          const movieId = movie.tmdbId || (movie.id && movie.id.startsWith('tmdb:') ? parseInt(movie.id.replace('tmdb:', '')) : null);
          if (movieId) {
            catalogMovieIds.add(movieId);
            if (!catalogMovies.has(movieId)) {
              catalogMovies.set(movieId, { title: movie.name, genres: [genreCode] });
            } else {
              catalogMovies.get(movieId).genres.push(genreCode);
            }
          }
        });
      }
    });
  }

  console.log('Total unique movies in catalog:', catalogMovieIds.size);
  console.log('Movies in classification-state:', Object.keys(classificationState.classified).length);
  console.log('Difference:', catalogMovieIds.size - Object.keys(classificationState.classified).length);

  // Find movies in catalog but NOT in classification-state
  const catalogOnly = [];
  catalogMovieIds.forEach(id => {
    if (!classificationState.classified[id]) {
      catalogOnly.push(id);
    }
  });

  console.log('\n=== MOVIES IN CATALOG BUT NOT IN CLASSIFICATION-STATE ===');
  console.log('Count:', catalogOnly.length);

  if (catalogOnly.length > 0) {
    console.log('\nSample IDs (first 20):');
    catalogOnly.slice(0, 20).forEach(id => console.log('  -', id));

    // Show details of mystery movies
    console.log('\n=== MYSTERY MOVIE DETAILS (first 20) ===');
    catalogOnly.slice(0, 20).forEach(id => {
      const movie = catalogMovies.get(id);
      if (movie) {
        console.log(`ID ${id}: ${movie.title}`);
        console.log(`  Found in genres: ${movie.genres.join(', ')}`);
      }
    });
  }
}

checkDiscrepancy().catch(console.error);
