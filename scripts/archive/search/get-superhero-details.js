const { getStore } = require('@netlify/blobs');
const fs = require('fs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  // Get all SUPERHEROES IDs
  const superheroIds = [];
  for (const [movieId, genre] of Object.entries(classificationState.classified)) {
    if (genre === 'SUPERHEROES') {
      superheroIds.push(parseInt(movieId));
    }
  }

  console.log(`\nMovies classified as SUPERHEROES: ${superheroIds.length}\n`);

  // Parse full_output.txt to get movie details
  const fullOutput = fs.readFileSync('full_output.txt', 'utf-8');
  const moviePattern = /(\d+)\.\s+(.+?)\s+\((\d{4})\)\s+ID:\s+(\d+)\s+Rating:\s+([\d.]+)\s+Genres:\s+(.+?)\s+Found in:\s+(.+?)\s+Plot:\s+(.+?)(?=\n\n\d+\.|\n\n$|$)/gs;

  const superheroMovies = [];
  let match;

  while ((match = moviePattern.exec(fullOutput)) !== null) {
    const movieId = parseInt(match[4]);

    if (superheroIds.includes(movieId)) {
      superheroMovies.push({
        movieId: movieId,
        name: match[2],
        year: parseInt(match[3]),
        rating: parseFloat(match[5]),
        genres: match[6].split(',').map(g => g.trim()),
        foundIn: match[7].split(',').map(c => c.trim()),
        plot: match[8].replace(/\.\.\.$/, '').trim()
      });
    }
  }

  // Display all
  superheroMovies.forEach((movie, idx) => {
    console.log(`${idx + 1}. ${movie.name} (${movie.year}) [ID: ${movie.movieId}]`);
    console.log(`   Genres: ${movie.genres.join(', ')}`);
    console.log(`   Plot: ${movie.plot.substring(0, 100)}...`);
    console.log();
  });

  // Find documentaries that should be moved
  const docsToMove = superheroMovies.filter(m => m.genres.includes('Documentary'));

  if (docsToMove.length > 0) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`DOCUMENTARIES MISCLASSIFIED AS SUPERHEROES:`);
    console.log(`${'='.repeat(70)}\n`);

    docsToMove.forEach(m => {
      console.log(`${m.name} (${m.year}) [ID: ${m.movieId}]`);
      console.log(`   Should be: DOCUMENTARY`);
      console.log();
    });
  }

  // Save corrections
  const corrections = docsToMove.map(m => ({
    movieId: m.movieId,
    name: m.name,
    year: m.year,
    currentGenre: 'SUPERHEROES',
    correctGenre: 'DOCUMENTARY',
    reason: 'Documentary about superheroes - should be DOCUMENTARY not SUPERHEROES'
  }));

  fs.writeFileSync('superhero_corrections.json', JSON.stringify(corrections, null, 2));
  console.log(`\n✅ Saved ${corrections.length} corrections to superhero_corrections.json`);
}

main().catch(console.error);
