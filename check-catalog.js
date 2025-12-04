const { getStore } = require('@netlify/blobs');
require('dotenv').config();

(async () => {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });
  const catalog = await store.get('catalog', { type: 'json' });

  // Check Superheroes
  console.log('=== SUPERHEROES (first 30) ===');
  const superheroes = catalog.genres.SUPERHEROES || [];
  superheroes.slice(0, 30).forEach(m => {
    console.log(`- ${m.name} (${m.year || 'N/A'})`);
  });

  // Check Action Classic - look for Rambo
  console.log('\n=== ACTION CLASSIC - First 10 & Rambo check ===');
  const actionClassic = catalog.genres.ACTION_CLASSIC || [];
  actionClassic.slice(0, 10).forEach(m => console.log(`- ${m.name} (${m.year})`));
  const rambo = actionClassic.find(m => m.name.includes('Rambo'));
  console.log(rambo ? `✓ Rambo in Action Classic: ${rambo.name} (${rambo.year})` : '✗ Rambo NOT in Action Classic');

  // Check Action - look for Rambo
  console.log('\n=== ACTION - Rambo & superhero check ===');
  const action = catalog.genres.ACTION || [];
  const ramboAction = action.find(m => m.name.includes('Rambo'));
  console.log(ramboAction ? `✗ Rambo WRONGLY in Action: ${ramboAction.name} (${ramboAction.year})` : '✓ Rambo NOT in Action');

  // Check for superhero movies in action
  const superheroesInAction = action.filter(m =>
    /avengers|iron man|thor|captain america|spider-man|batman|superman|wonder woman|black panther|guardians|ant-man/i.test(m.name)
  );
  console.log(`\nSuperhero movies in ACTION: ${superheroesInAction.length}`);
  superheroesInAction.slice(0, 10).forEach(m => console.log(`  - ${m.name}`));

  // Count samurai/kung fu in various genres
  console.log('\n=== SAMURAI/KUNG FU/MARTIAL ARTS DISTRIBUTION ===');
  ['ACTION', 'ACTION_CLASSIC', 'SUPERHEROES'].forEach(genre => {
    const movies = catalog.genres[genre] || [];
    const martial = movies.filter(m =>
      /samurai|kung fu|martial|shaolin|drunken|fist.*legend|enter the dragon|ip man|ong.bak|raid|muay thai|karate|judo/i.test(m.name)
    );
    console.log(`${genre}: ${martial.length} martial arts movies`);
    if (martial.length > 0) {
      martial.slice(0, 15).forEach(m => console.log(`  - ${m.name} (${m.year})`));
    }
  });

  // Check Animation
  console.log('\n=== ANIMATION ADULT - First 20 ===');
  const animAdult = catalog.genres.ANIMATION_ADULT || [];
  animAdult.slice(0, 20).forEach(m => console.log(`- ${m.name}`));

  console.log('\n=== ANIMATION KIDS - First 20 ===');
  const animKids = catalog.genres.ANIMATION_KIDS || [];
  animKids.slice(0, 20).forEach(m => console.log(`- ${m.name}`));

  // Check for animation in other genres
  console.log('\n=== ANIMATION IN OTHER GENRES ===');
  ['ACTION', 'DRAMA', 'COMEDY'].forEach(genre => {
    const movies = catalog.genres[genre] || [];
    const animated = movies.filter(m => m.type === 'movie' && m.genres && m.genres.includes('Animation'));
    if (animated.length > 0) {
      console.log(`${genre}: ${animated.length} animated movies`);
      animated.slice(0, 5).forEach(m => console.log(`  - ${m.name}`));
    }
  });

  // Indian movies count
  console.log('\n=== INDIAN MOVIES COUNT ===');
  Object.keys(catalog.genres).forEach(genre => {
    const movies = catalog.genres[genre] || [];
    const indian = movies.filter(m =>
      /bollywood|telugu|tamil|hindi|malayalam|rrr|baahubali|bajrangi|dangal/i.test(m.name) ||
      (m.posterShape && /india/i.test(m.posterShape))
    );
    if (indian.length > 5) {
      console.log(`${genre}: ${indian.length} Indian movies`);
    }
  });

})();
