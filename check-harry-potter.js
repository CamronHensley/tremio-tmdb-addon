const { getStore } = require('@netlify/blobs');
const fs = require('fs');
require('dotenv').config();

async function check() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const state = await store.get('classification-state', { type: 'json' });
  const lines = fs.readFileSync('full_output.txt', 'utf-8').split('\n');

  let hpMovies = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('harry potter')) {
      const titleLine = lines[i];
      const nextLine = lines[i+1] || '';
      const idMatch = nextLine.match(/ID: (\d+)/);

      if (idMatch) {
        const id = idMatch[1];
        const isClassified = state.classified[id];
        hpMovies.push({
          title: titleLine.trim(),
          id: id,
          classified: isClassified || 'NOT CLASSIFIED'
        });
      }
    }
  }

  console.log('\n=== HARRY POTTER MOVIES IN DATABASE ===\n');

  if (hpMovies.length === 0) {
    console.log('❌ No Harry Potter movies found in full_output.txt');
    console.log('\nThis means Harry Potter movies are NOT in the source database.');
    console.log('They cannot be classified because they do not exist in the movie list.');
  } else {
    hpMovies.forEach(m => {
      console.log(`${m.title}`);
      console.log(`  ID: ${m.id} → ${m.classified}`);
      console.log('');
    });
    console.log(`Total Harry Potter movies found: ${hpMovies.length}`);
  }
}

check().catch(console.error);
