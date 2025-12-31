const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  // Search for Frankenweenie
  const fs = require('fs');
  const fullOutput = fs.readFileSync('full_output.txt', 'utf-8');
  const moviePattern = /(\d+)\.\s+(.+?)\s+\((\d{4})\)\s+ID:\s+(\d+)\s+Rating:\s+([\d.]+)\s+Genres:\s+(.+?)\s+Found in:\s+(.+?)\s+Plot:\s+(.+?)(?=\n\n\d+\.|\n\n$|$)/gs;

  let match;
  while ((match = moviePattern.exec(fullOutput)) !== null) {
    const name = match[2];
    const movieId = parseInt(match[4]);

    if (name.toLowerCase().includes('frankenweenie')) {
      const currentGenre = classificationState.classified[movieId.toString()];
      console.log(`Found: ${name} (${match[3]}) [ID: ${movieId}]`);
      console.log(`   Current Genre: ${currentGenre || 'NOT CLASSIFIED'}`);
      console.log(`   TMDB Genres: ${match[6]}`);
      console.log(`   Plot: ${match[8].replace(/\.\.\.$/, '').trim()}`);
      console.log();
    }
  }
}

main().catch(console.error);
