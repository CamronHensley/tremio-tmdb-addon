const movies = require('./next_500_to_classify.json');

console.log('Total movies to classify:', movies.length);
console.log('\nFirst 100 movies:\n');

movies.slice(0, 100).forEach((movie, i) => {
  console.log(`${i+1}. ${movie.name} (${movie.year}) [ID: ${movie.movieId}]`);
  console.log(`   Genres: ${movie.genres.join(', ')}`);
  console.log(`   Plot: ${movie.plot.substring(0, 100)}...`);
  console.log('');
});
