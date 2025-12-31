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

  console.log('\n=== ALL MOVIES IN HISTORY GENRE ===\n');

  const historyMovies = [];

  for (const [movieId, genre] of Object.entries(state.classified)) {
    if (genre === 'HISTORY') {
      const movie = movieData[movieId];
      if (movie) {
        historyMovies.push({
          id: movieId,
          title: movie.title,
          genres: movie.genres,
          plot: movie.plot
        });
      }
    }
  }

  console.log(`Total movies in HISTORY: ${historyMovies.length}\n`);

  historyMovies.forEach(m => {
    console.log(m.title);
    console.log(`  ID: ${m.id}`);
    console.log(`  TMDB Genres: ${m.genres}`);

    // Flag suspicious ones
    const warnings = [];
    const genresLower = (m.genres || '').toLowerCase();

    if (genresLower.includes('music')) {
      warnings.push('⚠️  Has Music genre - should be MUSIC');
    }
    if (genresLower.includes('science fiction')) {
      warnings.push('⚠️  Has Science Fiction - should be SCIFI');
    }
    if (genresLower.includes('fantasy')) {
      warnings.push('⚠️  Has Fantasy - might belong in FANTASY');
    }
    if (genresLower.includes('action') && !genresLower.includes('war') && !genresLower.includes('history')) {
      warnings.push('⚠️  Has Action but not War/History - might be wrong genre');
    }

    warnings.forEach(w => console.log(`  ${w}`));
    console.log('');
  });
}

check().catch(console.error);
