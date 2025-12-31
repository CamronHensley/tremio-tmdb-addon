const fs = require('fs');

const movies = JSON.parse(fs.readFileSync('next_500_to_classify.json', 'utf-8'));

console.log(`Total movies to classify: ${movies.length}\n`);

movies.forEach((m, i) => {
  console.log(`${i+1}. ${m.name} (${m.year}) | ID: ${m.movieId}`);
  console.log(`   Genres: ${m.genres.join(', ')}`);
  console.log(`   Plot: ${m.plot}`);
  console.log();
});
