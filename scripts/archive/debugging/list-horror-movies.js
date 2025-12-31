const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const genreAssignments = await store.get('genre-assignments', { type: 'json' });

  // Get all HORROR movies
  const horrorMovies = genreAssignments.genres.HORROR || [];

  console.log(`\nTotal Horror Movies: ${horrorMovies.length}\n`);
  console.log('First 20 Horror Movies:\n');

  horrorMovies.slice(0, 20).forEach((movie, index) => {
    const movieId = movie.tmdbId || (movie.id ? movie.id.replace('tmdb:', '') : 'unknown');
    console.log(`${index + 1}. ${movie.name || 'Unknown'} (${movie.year || 'N/A'}) - ID: ${movieId}`);
  });

  console.log('\n\nSearching for specific Halloween-related titles...\n');

  const halloweenRelated = horrorMovies.filter(movie => {
    const name = (movie.name || '').toLowerCase();
    return name.includes('halloween') ||
           name.includes('trick') ||
           name.includes('hocus') ||
           name.includes('sleepy hollow') ||
           name.includes('nightmare before');
  });

  console.log(`Found ${halloweenRelated.length} Halloween-related movies:\n`);
  halloweenRelated.forEach(movie => {
    const movieId = movie.tmdbId || (movie.id ? movie.id.replace('tmdb:', '') : 'unknown');
    console.log(`- ${movie.name} (${movie.year || 'N/A'}) - ID: ${movieId}`);
  });
}

main().catch(console.error);
