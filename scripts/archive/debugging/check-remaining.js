const fs = require('fs');

const allMovies = JSON.parse(fs.readFileSync('next_500_to_classify.json', 'utf-8'));
const classified = JSON.parse(fs.readFileSync('500_classifications.json', 'utf-8'));
const classifiedIds = new Set(classified.map(c => c.movieId));
const remaining = allMovies.filter(m => !classifiedIds.has(m.movieId));

console.log('Remaining unclassified from this batch:', remaining.length);
console.log('Total classified:', classified.length);
console.log('\nFirst 30 remaining:');
remaining.slice(0, 30).forEach((m, i) => {
  console.log(`${i+1}. ${m.name} (${m.year}) ID: ${m.movieId}`);
  console.log(`   Genres: ${m.genres.join(', ')}`);
  console.log(`   Plot: ${m.plot}`);
  console.log();
});
