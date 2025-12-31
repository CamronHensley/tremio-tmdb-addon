const { getStore } = require('@netlify/blobs');
const fs = require('fs');
require('dotenv').config();

async function main() {
  const genreToCheck = process.argv[2];

  if (!genreToCheck) {
    console.error('Usage: node scripts/get-genre-movies.js <GENRE_CODE>');
    process.exit(1);
  }

  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  // Extract all movies for this genre
  const genreIds = new Set();

  for (const [movieId, genre] of Object.entries(classificationState.classified)) {
    if (genre === genreToCheck) {
      genreIds.add(parseInt(movieId));
    }
  }

  console.log(`Found ${genreIds.size} movies classified as ${genreToCheck}\n`);

  // Parse full_output.txt to get movie details
  const fullOutput = fs.readFileSync('full_output.txt', 'utf-8');
  const moviePattern = /(\d+)\.\s+(.+?)\s+\((\d{4})\)\s+ID:\s+(\d+)\s+Rating:\s+([\d.]+)\s+Genres:\s+(.+?)\s+Found in:\s+(.+?)\s+Plot:\s+(.+?)(?=\n\n\d+\.|\n\n$|$)/gs;

  const genreDetails = [];
  let match;

  while ((match = moviePattern.exec(fullOutput)) !== null) {
    const movieId = parseInt(match[4]);

    if (genreIds.has(movieId)) {
      genreDetails.push({
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

  // Sort by name
  genreDetails.sort((a, b) => a.name.localeCompare(b.name));

  // Display all movies
  genreDetails.forEach((movie, idx) => {
    console.log(`${idx + 1}. ${movie.name} (${movie.year})`);
    console.log(`   ID: ${movie.movieId}`);
    console.log(`   Genres: ${movie.genres.join(', ')}`);
    console.log(`   Plot: ${movie.plot}`);
    console.log();
  });

  // Save to file for review
  const filename = `${genreToCheck.toLowerCase()}_movies.json`;
  fs.writeFileSync(filename, JSON.stringify(genreDetails, null, 2));

  console.log(`\n✅ Saved ${genreDetails.length} ${genreToCheck} movies to ${filename}`);
}

main().catch(console.error);
