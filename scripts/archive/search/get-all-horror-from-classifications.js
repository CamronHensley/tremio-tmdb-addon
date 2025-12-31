const { getStore } = require('@netlify/blobs');
const axios = require('axios');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  // Get all movies classified as HORROR
  const horrorMovies = [];
  for (const [movieId, genre] of Object.entries(classificationState.classified)) {
    if (genre === 'HORROR') {
      horrorMovies.push(movieId);
    }
  }

  console.log(`\nTotal HORROR movies: ${horrorMovies.length}\n`);

  // Fetch details for a sample
  console.log('Fetching movie details from TMDB...\n');

  const tmdbApiKey = process.env.TMDB_API_KEY;
  const halloweenCandidates = [];

  // Check first 50 for speed
  for (let i = 0; i < Math.min(50, horrorMovies.length); i++) {
    const movieId = horrorMovies[i];
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}`
      );
      const movie = response.data;
      const title = (movie.title || '').toLowerCase();

      // Check for Halloween keywords
      if (
        title.includes('halloween') ||
        title.includes('trick') ||
        title.includes('hocus') ||
        title.includes('sleepy hollow')
      ) {
        halloweenCandidates.push({
          id: movieId,
          title: movie.title,
          year: movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'
        });
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      // Skip errors
    }
  }

  console.log(`\nHalloween-themed horror movies found:\n`);
  halloweenCandidates.forEach((movie, i) => {
    console.log(`${i + 1}. ${movie.title} (${movie.year}) - ID: ${movie.id}`);
  });

  console.log('\n');
}

main().catch(console.error);
