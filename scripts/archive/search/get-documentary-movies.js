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

  // Extract all DOCUMENTARY movie IDs
  const documentaryIds = new Set();

  for (const [movieId, genre] of Object.entries(classificationState.classified)) {
    if (genre === 'DOCUMENTARY') {
      documentaryIds.add(parseInt(movieId));
    }
  }

  console.log(`Found ${documentaryIds.size} movies classified as DOCUMENTARY\n`);

  // Parse full_output.txt to get movie details
  const fullOutput = fs.readFileSync('full_output.txt', 'utf-8');
  const moviePattern = /(\d+)\.\s+(.+?)\s+\((\d{4})\)\s+ID:\s+(\d+)\s+Rating:\s+([\d.]+)\s+Genres:\s+(.+?)\s+Found in:\s+(.+?)\s+Plot:\s+(.+?)(?=\n\n\d+\.|\n\n$|$)/gs;

  const documentaryDetails = [];
  let match;

  while ((match = moviePattern.exec(fullOutput)) !== null) {
    const movieId = parseInt(match[4]);

    if (documentaryIds.has(movieId)) {
      documentaryDetails.push({
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

  // Display all documentary movies
  documentaryDetails.forEach((movie, idx) => {
    console.log(`${idx + 1}. ${movie.name} (${movie.year})`);
    console.log(`   ID: ${movie.movieId}`);
    console.log(`   Genres: ${movie.genres.join(', ')}`);
    console.log(`   Plot: ${movie.plot}`);
    console.log();
  });

  // Save to file for review
  fs.writeFileSync('documentary_movies.json', JSON.stringify(documentaryDetails, null, 2));

  console.log(`\n✅ Saved ${documentaryDetails.length} documentary movies to documentary_movies.json`);
}

main().catch(console.error);
