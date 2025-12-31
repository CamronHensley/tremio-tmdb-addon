const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function checkMissingGenres() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  // All possible genre codes from lib/constants.js
  const allGenres = [
    'SEASONAL',
    'ACTION',
    'ACTION_CLASSIC',
    'ADVENTURE',
    'ANIMATION_KIDS',
    'ANIMATION_ADULT',
    'CARS',
    'COMEDY',
    'CRIME',
    'DISASTER',
    'DOCUMENTARY',
    'NATURE',
    'DRAMA',
    'TRUE_CRIME',
    'FAMILY',
    'FANTASY',
    'HISTORY',
    'HORROR',
    'MARTIAL_ARTS',
    'MUSIC',
    'MYSTERY',
    'ROMANCE',
    'SCIFI',
    'SPORTS',
    'STAND_UP_COMEDY',
    'SUPERHEROES',
    'TVMOVIE',
    'THRILLER',
    'WAR',
    'WESTERN'
  ];

  // Count by genre
  const genreCounts = {};
  for (const genreCode of Object.values(classificationState.classified)) {
    genreCounts[genreCode] = (genreCounts[genreCode] || 0) + 1;
  }

  console.log('\n=== GENRES WITH MOVIES ===');
  allGenres.forEach(genre => {
    const count = genreCounts[genre] || 0;
    if (count > 0) {
      console.log(`  ${genre}: ${count} movies`);
    }
  });

  console.log('\n=== GENRES WITH 0 MOVIES ===');
  const missingGenres = [];
  allGenres.forEach(genre => {
    const count = genreCounts[genre] || 0;
    if (count === 0) {
      missingGenres.push(genre);
      console.log(`  ${genre}: 0 movies`);
    }
  });

  console.log(`\nTotal genres with 0 movies: ${missingGenres.length}`);
}

checkMissingGenres().catch(console.error);
