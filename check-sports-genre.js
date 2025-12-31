const { getStore } = require('@netlify/blobs');
const fs = require('fs');
require('dotenv').config();

async function check() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const state = await store.get('classification-state', { type: 'json' });
  const lines = fs.readFileSync('full_output.txt', 'utf-8').split('\n');

  const movieData = {};
  let currentMovie = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^\d+\./)) {
      if (currentMovie) movieData[currentMovie.id] = currentMovie;
      currentMovie = { title: line.trim() };
    } else if (line.includes('ID:') && currentMovie) {
      const match = line.match(/ID: (\d+)/);
      if (match) currentMovie.id = match[1];
    } else if (line.includes('Genres:') && currentMovie) {
      currentMovie.genres = line.replace('   Genres:', '').trim();
    } else if (line.includes('Plot:') && currentMovie) {
      currentMovie.plot = line.replace('   Plot:', '').trim();
    }
  }

  if (currentMovie) movieData[currentMovie.id] = currentMovie;

  console.log('\n=== ALL MOVIES IN SPORTS GENRE ===\n');

  const sportsMovies = [];

  for (const [movieId, genre] of Object.entries(state.classified)) {
    if (genre === 'SPORTS') {
      const movie = movieData[movieId];
      if (movie) {
        sportsMovies.push({
          id: movieId,
          title: movie.title,
          genres: movie.genres,
          plot: movie.plot
        });
      }
    }
  }

  console.log(`Total movies in SPORTS: ${sportsMovies.length}\n`);

  sportsMovies.forEach(m => {
    console.log(m.title);
    console.log(`  ID: ${m.id}`);
    console.log(`  TMDB Genres: ${m.genres}`);

    // Flag car racing movies
    const titleLower = (m.title || '').toLowerCase();
    const plotLower = (m.plot || '').toLowerCase();

    const warnings = [];

    // Check for car racing keywords
    const carKeywords = ['racing', 'race car', 'formula', 'nascar', 'rally', 'ferrari', 'lemans', 'le mans', 'grand prix'];
    if (carKeywords.some(kw => titleLower.includes(kw) || plotLower.includes(kw))) {
      warnings.push('⚠️  Car/racing movie - should likely be CARS');
    }

    warnings.forEach(w => console.log(`  ${w}`));
    console.log('');
  });
}

check().catch(console.error);
