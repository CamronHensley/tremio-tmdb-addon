const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function check() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const assignments = await store.get('genre-assignments', { type: 'json' });
  const catalog = await store.get('catalog', { type: 'json' });

  console.log('\n=== CLASSIFIED vs CATALOG COMPARISON ===\n');
  console.log('Genre                  | Classified | In Catalog | Missing');
  console.log('-'.repeat(65));

  const allGenres = Object.keys(assignments.genres).sort((a,b) =>
    (assignments.genres[b]?.length || 0) - (assignments.genres[a]?.length || 0)
  );

  let totalClassified = 0;
  let totalInCatalog = 0;
  let totalMissing = 0;

  for (const genre of allGenres) {
    const classified = assignments.genres[genre]?.length || 0;
    const inCatalog = catalog.genres[genre]?.length || 0;
    const missing = classified - inCatalog;

    totalClassified += classified;
    totalInCatalog += inCatalog;
    totalMissing += missing;

    const genreName = genre.padEnd(22);
    const classifiedStr = String(classified).padStart(10);
    const catalogStr = String(inCatalog).padStart(10);
    const missingStr = String(missing).padStart(7);

    console.log(`${genreName} | ${classifiedStr} | ${catalogStr} | ${missingStr}`);
  }

  console.log('-'.repeat(65));
  console.log(`${'TOTAL'.padEnd(22)} | ${String(totalClassified).padStart(10)} | ${String(totalInCatalog).padStart(10)} | ${String(totalMissing).padStart(7)}`);

  console.log('\n=== SUMMARY ===');
  console.log(`Total classified movies: ${totalClassified}`);
  console.log(`Total in catalog: ${totalInCatalog}`);
  console.log(`Movies missing from catalog: ${totalMissing}`);
  console.log(`\nReason: MOVIES_PER_GENRE is capped at 100, so genres with >100 movies are limited`);
}

check().catch(console.error);
