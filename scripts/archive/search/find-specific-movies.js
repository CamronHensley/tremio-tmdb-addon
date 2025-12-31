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

  // Movies to check
  const moviesToCheck = [
    { id: 38, name: "Eternal Sunshine of the Spotless Mind" },
    { id: 11361, name: "Frankenweenie" }, // 2012 animated
    { id: 11920, name: "Frankenweenie" }  // 1984 short
  ];

  console.log('Checking movie classifications:\n');

  moviesToCheck.forEach(movie => {
    const currentGenre = classificationState.classified[movie.id.toString()];
    console.log(`${movie.name} [ID: ${movie.id}]`);
    console.log(`   Current Genre: ${currentGenre || 'NOT CLASSIFIED'}`);
    console.log();
  });
}

main().catch(console.error);
