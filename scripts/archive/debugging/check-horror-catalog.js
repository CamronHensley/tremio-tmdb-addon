const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const catalog = await store.get('catalog', { type: 'json' });

  if (!catalog || !catalog.genres || !catalog.genres.HORROR) {
    console.log('No horror catalog found');
    return;
  }

  const horrorMovies = catalog.genres.HORROR;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`HORROR CATALOG - ${horrorMovies.length} movies`);
  console.log(`${'='.repeat(80)}\n`);

  // Halloween-related keywords
  const halloweenKeywords = [
    'halloween',
    'trick or treat',
    'pumpkin',
    'october 31',
    'sleepy hollow',
    'hocus pocus',
    'nightmare before christmas',
    'michael myers',
    'samhain'
  ];

  const potentialHalloween = [];

  horrorMovies.forEach(movie => {
    const title = (movie.name || '').toLowerCase();

    // Check for Halloween keywords in title
    const hasKeyword = halloweenKeywords.some(keyword => title.includes(keyword));

    if (hasKeyword) {
      const movieId = movie.tmdbId || (movie.id ? parseInt(movie.id.replace('tmdb:', '')) : null);
      potentialHalloween.push({
        id: movieId,
        name: movie.name,
        year: movie.year || movie.releaseInfo
      });
    }
  });

  console.log(`Found ${potentialHalloween.length} Halloween-themed horror movies:\n`);

  potentialHalloween.forEach((movie, i) => {
    console.log(`${i + 1}. ${movie.name} (${movie.year}) - ID: ${movie.id}`);
  });

  console.log(`\n${'='.repeat(80)}\n`);
}

main().catch(console.error);
