const { getStore } = require('@netlify/blobs');
const fs = require('fs');
require('dotenv').config();

async function findMisclassified() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const state = await store.get('classification-state', { type: 'json' });

  // Load full_output.txt
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

  console.log('\n=== LIKELY MISCLASSIFICATIONS ===\n');

  const issues = [];

  for (const [movieId, currentGenre] of Object.entries(state.classified)) {
    const movie = movieData[movieId];
    if (!movie) continue;

    const reasons = [];

    // Check for MUSIC genre (TIER 1 - highest priority)
    if (movie.genres && movie.genres.toLowerCase().includes('music') && currentGenre !== 'MUSIC') {
      reasons.push(`Has "Music" in TMDB genres, should likely be MUSIC (currently ${currentGenre})`);
    }

    // Check for music-related keywords in title
    const musicKeywords = ['biopic', 'musical', 'symphony', 'concert', 'band', 'singer', 'musician'];
    const titleLower = movie.title.toLowerCase();
    if (musicKeywords.some(kw => titleLower.includes(kw)) && currentGenre !== 'MUSIC') {
      if (movie.genres && movie.genres.toLowerCase().includes('music')) {
        reasons.push(`Music-related title + Music genre, should be MUSIC (currently ${currentGenre})`);
      }
    }

    // Check for superhero movies (TIER 1)
    const superheroKeywords = ['spider-man', 'batman', 'superman', 'avengers', 'captain america',
                               'iron man', 'thor', 'hulk', 'wonder woman', 'x-men', 'guardians',
                               'deadpool', 'black panther', 'aquaman', 'justice league', 'suicide squad',
                               'ant-man', 'doctor strange', 'venom', 'shazam', 'black widow',
                               'captain marvel', 'madame web', 'morbius', 'eternals'];
    if (superheroKeywords.some(kw => titleLower.includes(kw)) && currentGenre !== 'SUPERHEROES') {
      reasons.push(`Superhero movie, should be SUPERHEROES (currently ${currentGenre})`);
    }

    // Check for modern history movies that shouldn't be in HISTORY
    if (currentGenre === 'HISTORY' && movie.genres && movie.genres.toLowerCase().includes('music')) {
      reasons.push(`Music biopic in HISTORY - should be MUSIC`);
    }

    if (reasons.length > 0) {
      issues.push({
        id: movieId,
        title: movie.title,
        currentGenre,
        tmdbGenres: movie.genres,
        reasons
      });
    }
  }

  // Sort by genre for easier review
  issues.sort((a, b) => {
    if (a.currentGenre === b.currentGenre) return a.title.localeCompare(b.title);
    return a.currentGenre.localeCompare(b.currentGenre);
  });

  let lastGenre = '';
  for (const issue of issues) {
    if (issue.currentGenre !== lastGenre) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`CURRENTLY IN: ${issue.currentGenre}`);
      console.log('='.repeat(60));
      lastGenre = issue.currentGenre;
    }

    console.log(`\n${issue.title}`);
    console.log(`  ID: ${issue.id}`);
    console.log(`  TMDB Genres: ${issue.tmdbGenres}`);
    issue.reasons.forEach(r => console.log(`  ⚠️  ${r}`));
  }

  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`TOTAL LIKELY MISCLASSIFICATIONS: ${issues.length}`);
  console.log('='.repeat(60));

  // Save to file for fixing
  fs.writeFileSync('misclassified_movies.json', JSON.stringify(issues, null, 2));
  console.log('\n✅ Saved detailed list to misclassified_movies.json');
}

findMisclassified().catch(console.error);
