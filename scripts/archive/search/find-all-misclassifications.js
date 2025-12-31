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
  console.log(`FINDING MISCLASSIFICATIONS`);
  console.log(`${'='.repeat(70)}\n`);

  const issues = [];

  // 1. Find superhero movies in ACTION
  console.log('1. SUPERHERO MOVIES MISCLASSIFIED AS ACTION:\n');
  const actionSuperheros = allMovies.filter(m =>
    m.currentGenre === 'ACTION' &&
    (m.genres.some(g => g.toLowerCase().includes('superhero')) ||
     m.name.match(/(Iron Man|Captain America|Thor|Avengers|Guardians|Spider-Man|Batman|Superman|Wonder Woman|Aquaman|Flash|Justice League|Deadpool|X-Men|Wolverine|Black Panther|Doctor Strange|Ant-Man|Shazam|Venom|Morbius)/i))
  );

  actionSuperheros.forEach(m => {
    console.log(`   ${m.name} (${m.year}) [ID: ${m.movieId}]`);
    console.log(`   Genres: ${m.genres.join(', ')}`);
    console.log();
    issues.push({...m, correctGenre: 'SUPERHEROES', reason: 'Superhero movie - SUPERHEROES (Tier 1) priority over ACTION (Tier 4)'});
  });

  // 2. Find romance movies in COMEDY
  console.log(`\n2. ROMANCE MOVIES MISCLASSIFIED AS COMEDY:\n`);
  const comedyRomances = allMovies.filter(m =>
    m.currentGenre === 'COMEDY' &&
    m.genres.includes('Romance') &&
    !m.genres.includes('Comedy')
  );

  comedyRomances.forEach(m => {
    console.log(`   ${m.name} (${m.year}) [ID: ${m.movieId}]`);
    console.log(`   Genres: ${m.genres.join(', ')}`);
    console.log();
    issues.push({...m, correctGenre: 'ROMANCE', reason: 'Romance movie without Comedy genre'});
  });

  // 3. Check Lion King 2019
  console.log(`\n3. THE LION KING 2019 CHECK:\n`);
  const lionKing2019 = allMovies.find(m => m.movieId === 420818);
  if (lionKing2019) {
    console.log(`   ${lionKing2019.name} (${lionKing2019.year}) [ID: ${lionKing2019.movieId}]`);
    console.log(`   Current Genre: ${lionKing2019.currentGenre}`);
    console.log(`   Genres: ${lionKing2019.genres.join(', ')}`);
    console.log();

    // Lion King 2019 is CGI/realistic animation - should still be ANIMATION_KIDS
    if (lionKing2019.currentGenre !== 'ANIMATION_KIDS') {
      issues.push({...lionKing2019, correctGenre: 'ANIMATION_KIDS', reason: 'Animated film - ANIMATION (Tier 1) priority'});
    }
  }

  // 4. Find other CGI/realistic animated films misclassified
  console.log(`\n4. OTHER ANIMATED FILMS POTENTIALLY MISCLASSIFIED:\n`);
  const animatedNotInAnimation = allMovies.filter(m =>
    (m.currentGenre !== 'ANIMATION_KIDS' && m.currentGenre !== 'ANIMATION_ADULT' && m.currentGenre !== 'SEASONAL') &&
    m.genres.includes('Animation')
  );

  animatedNotInAnimation.forEach(m => {
    console.log(`   ${m.name} (${m.year}) [ID: ${m.movieId}]`);
    console.log(`   Current Genre: ${m.currentGenre}`);
    console.log(`   Genres: ${m.genres.join(', ')}`);
    console.log();

    // Determine if kids or adult animation
    const isAdult = m.name.match(/(Robot Chicken|South Park|Sausage Party|Waltz with Bashir)/i) ||
                    m.genres.some(g => g.match(/(War|Crime)/i));
    const correctGenre = isAdult ? 'ANIMATION_ADULT' : 'ANIMATION_KIDS';
    issues.push({...m, correctGenre, reason: `Animated film - ANIMATION (Tier 1) priority`});
  });

  console.log(`\n${'='.repeat(70)}`);
  console.log(`TOTAL ISSUES FOUND: ${issues.length}`);
  console.log(`${'='.repeat(70)}\n`);

  // Save issues to file
  fs.writeFileSync('misclassifications_found.json', JSON.stringify(issues, null, 2));
  console.log(`✅ Saved ${issues.length} issues to misclassifications_found.json\n`);
}

main().catch(console.error);
