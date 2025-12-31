const { getStore } = require('@netlify/blobs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  // Check the specific movie IDs we corrected
  const corrections = [
    { id: 497802, name: "Pandas", expected: "NATURE" },
    { id: 17700, name: "Deep Sea 3D", expected: "NATURE" },
    { id: 22559, name: "Aliens of the Deep", expected: "NATURE" },
    { id: 36123, name: "Under the Sea 3D", expected: "NATURE" },
    { id: 44639, name: "Inside Job", expected: "TRUE_CRIME" },
    { id: 17208, name: "Paradise Lost 2: Revelations", expected: "TRUE_CRIME" },
    { id: 84351, name: "West of Memphis", expected: "TRUE_CRIME" }
  ];

  console.log('\n📊 Verifying corrections in Netlify blob storage:\n');

  corrections.forEach(correction => {
    const actual = classificationState.classified[correction.id.toString()];
    const status = actual === correction.expected ? '✓' : '✗';
    console.log(`${status} ${correction.name} (${correction.id}): ${actual} (expected: ${correction.expected})`);
  });

  // Count all genres
  const genreCounts = {};
  for (const genre of Object.values(classificationState.classified)) {
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  }

  console.log('\n📊 Current genre counts:');
  console.log(`   DOCUMENTARY: ${genreCounts.DOCUMENTARY || 0}`);
  console.log(`   NATURE: ${genreCounts.NATURE || 0}`);
  console.log(`   TRUE_CRIME: ${genreCounts.TRUE_CRIME || 0}`);
  console.log();
}

main().catch(console.error);
