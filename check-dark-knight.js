const { getStore } = require('@netlify/blobs');
require('dotenv').config();

(async () => {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });
  const catalog = await store.get('catalog', { type: 'json' });

  // Search for Dark Knight in all genres
  console.log('=== SEARCHING FOR DARK KNIGHT ===');
  Object.keys(catalog.genres).forEach(genre => {
    const movies = catalog.genres[genre] || [];
    const darkKnight = movies.filter(m => m.name.includes('Dark Knight'));
    if (darkKnight.length > 0) {
      console.log(`\n${genre}:`);
      darkKnight.forEach(m => console.log(`  - ${m.name} (${m.year})`));
    }
  });

  // Check all superhero movies in ACTION and ACTION_CLASSIC
  console.log('\n=== SUPERHERO MOVIES IN ACTION ===');
  const action = catalog.genres.ACTION || [];
  const superheroesInAction = action.filter(m =>
    /avengers|iron man|thor|captain|spider-man|batman|superman|wonder woman|black panther|guardians|ant-man|dark knight|joker|aquaman|flash|shazam|x-men|wolverine|deadpool/i.test(m.name)
  );
  if (superheroesInAction.length > 0) {
    superheroesInAction.forEach(m => console.log(`  - ${m.name} (${m.year})`));
  } else {
    console.log('  (none found)');
  }

  console.log('\n=== SUPERHERO MOVIES IN ACTION_CLASSIC ===');
  const actionClassic = catalog.genres.ACTION_CLASSIC || [];
  const superheroesInClassic = actionClassic.filter(m =>
    /avengers|iron man|thor|captain|spider-man|batman|superman|wonder woman|black panther|guardians|ant-man|dark knight|joker|aquaman|flash|shazam|x-men|wolverine/i.test(m.name)
  );
  if (superheroesInClassic.length > 0) {
    superheroesInClassic.forEach(m => console.log(`  - ${m.name} (${m.year})`));
  } else {
    console.log('  (none found)');
  }

})();
