const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });
  const catalog = await store.get('catalog', { type: 'json' });

  // Get all movies classified as HORROR from classification-state
  const horrorIds = [];
  for (const [movieId, genre] of Object.entries(classificationState.classified)) {
    if (genre === 'HORROR') {
      horrorIds.push(parseInt(movieId));
    }
  }

  console.log(`\nTotal HORROR movies in classification-state: ${horrorIds.length}\n`);

  // Get catalog horror movies with full metadata
  const catalogHorror = catalog.genres.HORROR || [];
  console.log(`Horror movies in current catalog: ${catalogHorror.length}\n`);

  console.log('All catalog horror movies:\n');
  catalogHorror.forEach((movie, i) => {
    const id = movie.tmdbId || (movie.id ? parseInt(movie.id.replace('tmdb:', '')) : 'unknown');
    console.log(`${i + 1}. ${movie.name} (${movie.year || movie.releaseInfo || 'N/A'}) - ID: ${id}`);
  });

  // Known Halloween franchise movie IDs to check
  const knownHalloweenIds = [
    948, // Halloween (1978)
    11121, // Halloween (2007)
    424139, // Halloween (2018)
    616820, // Halloween Kills
    882598, // Halloween Ends
    4257, // Halloween II (1981)
    4258, // Halloween III: Season of the Witch
    4259, // Halloween 4: The Return of Michael Myers
    4260, // Halloween 5: The Revenge of Michael Myers
    4261, // Halloween: The Curse of Michael Myers
    4262, // Halloween H20: 20 Years Later
    4263  // Halloween: Resurrection
  ];

  console.log('\n\nChecking for Halloween franchise movies in HORROR classification:\n');
  const foundHalloweenMovies = horrorIds.filter(id => knownHalloweenIds.includes(id));
  console.log(`Found ${foundHalloweenMovies.length} Halloween franchise movies: ${foundHalloweenMovies.join(', ')}`);
}

main().catch(console.error);
