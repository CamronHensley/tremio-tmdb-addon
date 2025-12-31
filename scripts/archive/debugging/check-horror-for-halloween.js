const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });
  const genreAssignments = await store.get('genre-assignments', { type: 'json' });

  // Get all HORROR movies
  const horrorMovies = genreAssignments.genres.HORROR || [];

  console.log(`\n${'='.repeat(80)}`);
  console.log(`HORROR CATALOG - Checking for Halloween-themed movies`);
  console.log(`Total Horror Movies: ${horrorMovies.length}`);
  console.log(`${'='.repeat(80)}\n`);

  // Keywords that suggest Halloween themes
  const halloweenKeywords = [
    'halloween',
    'trick or treat',
    'pumpkin',
    'october 31',
    'all hallows',
    'samhain',
    'michael myers'  // Halloween franchise
  ];

  const potentialHalloweenMovies = [];

  horrorMovies.forEach(movie => {
    const name = (movie.name || '').toLowerCase();
    const description = (movie.description || '').toLowerCase();
    const combined = `${name} ${description}`;

    // Check if any Halloween keyword appears
    const hasHalloweenKeyword = halloweenKeywords.some(keyword =>
      combined.includes(keyword)
    );

    if (hasHalloweenKeyword) {
      potentialHalloweenMovies.push({
        id: movie.tmdbId || parseInt((movie.id || '').replace('tmdb:', '')),
        name: movie.name || 'Unknown',
        year: movie.year || 'Unknown',
        description: movie.description ? movie.description.substring(0, 200) + '...' : 'No description'
      });
    }
  });

  console.log(`\nFound ${potentialHalloweenMovies.length} potential Halloween movies:\n`);

  potentialHalloweenMovies.forEach((movie, index) => {
    console.log(`${index + 1}. ${movie.name} (${movie.year}) - ID: ${movie.id}`);
    if (movie.description) {
      console.log(`   ${movie.description}\n`);
    }
  });

  console.log(`\n${'='.repeat(80)}\n`);
}

main().catch(console.error);
