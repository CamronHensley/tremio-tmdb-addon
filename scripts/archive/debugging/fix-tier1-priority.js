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

  // Parse full_output.txt to get movie details
  const fullOutput = fs.readFileSync('full_output.txt', 'utf-8');
  const moviePattern = /(\d+)\.\s+(.+?)\s+\((\d{4})\)\s+ID:\s+(\d+)\s+Rating:\s+([\d.]+)\s+Genres:\s+(.+?)\s+Found in:\s+(.+?)\s+Plot:\s+(.+?)(?=\n\n\d+\.|\n\n$|$)/gs;

  const allMovies = [];
  let match;

  while ((match = moviePattern.exec(fullOutput)) !== null) {
    const movieId = parseInt(match[4]);
    const currentGenre = classificationState.classified[movieId.toString()];

    if (currentGenre) {
      allMovies.push({
        movieId: movieId,
        name: match[2],
        year: parseInt(match[3]),
        rating: parseFloat(match[5]),
        genres: match[6].split(',').map(g => g.trim()),
        foundIn: match[7].split(',').map(c => c.trim()),
        plot: match[8].replace(/\.\.\.$/, '').trim(),
        currentGenre: currentGenre
      });
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`TIER 1 PRIORITY ORDER VIOLATIONS`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Priority order: SEASONAL → ANIMATION → MUSIC → SUPERHEROES\n`);

  const corrections = [];

  // Find animated films in MUSIC, SUPERHEROES, or FAMILY (should be ANIMATION per priority)
  console.log('ANIMATED FILMS MISCLASSIFIED (should be ANIMATION per Tier 1 priority):\n');

  const animatedInWrongGenre = allMovies.filter(m =>
    m.genres.includes('Animation') &&
    m.currentGenre !== 'ANIMATION_KIDS' &&
    m.currentGenre !== 'ANIMATION_ADULT' &&
    m.currentGenre !== 'SEASONAL'
  );

  animatedInWrongGenre.forEach(m => {
    // Determine if kids or adult
    const isAdult = m.name.match(/(Robot Chicken|DC Showcase|Batman.*Dark Knight Returns|Justice League.*Flashpoint|Beavis|South Park|Sausage Party|Waltz with Bashir)/i);
    const correctGenre = isAdult ? 'ANIMATION_ADULT' : 'ANIMATION_KIDS';

    console.log(`${m.name} (${m.year}) [ID: ${m.movieId}]`);
    console.log(`   Current: ${m.currentGenre} → Should be: ${correctGenre}`);
    console.log(`   TMDB Genres: ${m.genres.join(', ')}`);
    console.log(`   Reason: ANIMATION (Tier 1 #2) comes before ${m.currentGenre}`);
    console.log();

    corrections.push({
      movieId: m.movieId,
      name: m.name,
      year: m.year,
      currentGenre: m.currentGenre,
      correctGenre: correctGenre,
      reason: `ANIMATION (Tier 1 #2) priority over ${m.currentGenre}`
    });
  });

  console.log(`\n${'='.repeat(70)}`);
  console.log(`TOTAL CORRECTIONS NEEDED: ${corrections.length}`);
  console.log(`${'='.repeat(70)}\n`);

  // Save corrections
  fs.writeFileSync('tier1_priority_corrections.json', JSON.stringify(corrections, null, 2));
  console.log(`✅ Saved ${corrections.length} corrections to tier1_priority_corrections.json\n`);
}

main().catch(console.error);
