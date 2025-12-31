const fs = require('fs');

// Load all classifications
const batch1 = require('./500_classifications.json');
const batch2_1 = require('./next_250_classifications.json');
const batch2_2 = require('./batch_2_remaining_classifications.json');
const batch2_3 = require('./final_160_classifications.json');
const batch2_4 = require('./batch_2_missing_227_classifications.json');

const allClassified = [...batch1, ...batch2_1, ...batch2_2, ...batch2_3, ...batch2_4];

// Load full movie data
const fullOutput = fs.readFileSync('full_output.txt', 'utf-8');
const movies = fullOutput.trim().split('\n').map(line => JSON.parse(line));

// Create lookup
const movieLookup = {};
movies.forEach(m => {
  movieLookup[m.id] = m;
});

console.log('Checking for potentially misclassified movies...\n');

const potentiallyMisclassified = [];

allClassified.forEach(classified => {
  const movie = movieLookup[classified.movieId];
  if (!movie) return;

  const issues = [];

  // Check for superhero keywords in title
  const superheroKeywords = ['spider-man', 'batman', 'superman', 'iron man', 'avengers', 'captain america', 'thor', 'hulk', 'wonder woman', 'x-men', 'guardians', 'deadpool', 'black panther', 'aquaman', 'justice league', 'suicide squad', 'ant-man', 'doctor strange', 'venom', 'shazam', 'black widow', 'captain marvel'];
  const titleLower = movie.title.toLowerCase();
  if (superheroKeywords.some(kw => titleLower.includes(kw)) && classified.genreCode !== 'SUPERHEROES') {
    issues.push(`Likely SUPERHERO (currently ${classified.genreCode})`);
  }

  // Check for music keywords
  const musicKeywords = ['concert', 'live at', 'the musical', 'symphony', 'opera', 'choir'];
  if (musicKeywords.some(kw => titleLower.includes(kw)) && classified.genreCode !== 'MUSIC') {
    issues.push(`Likely MUSIC (currently ${classified.genreCode})`);
  }

  // Check TMDB genres for music genre (10402)
  if (movie.genres && movie.genres.includes('10402') && classified.genreCode !== 'MUSIC') {
    issues.push(`Has TMDB Music genre (currently ${classified.genreCode})`);
  }

  if (issues.length > 0) {
    potentiallyMisclassified.push({
      movieId: classified.movieId,
      title: movie.title,
      year: movie.year,
      currentGenre: classified.genreCode,
      issues: issues
    });
  }
});

console.log(`Found ${potentiallyMisclassified.length} potentially misclassified movies:\n`);

potentiallyMisclassified.slice(0, 50).forEach(m => {
  console.log(`${m.title} (${m.year}) - ID: ${m.movieId}`);
  m.issues.forEach(issue => console.log(`  → ${issue}`));
  console.log('');
});

if (potentiallyMisclassified.length > 50) {
  console.log(`... and ${potentiallyMisclassified.length - 50} more\n`);
}

fs.writeFileSync('potentially_misclassified.json', JSON.stringify(potentiallyMisclassified, null, 2));
console.log('Saved full list to potentially_misclassified.json');
