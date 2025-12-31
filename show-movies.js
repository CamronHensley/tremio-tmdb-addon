const movies = require('./next_500_to_classify.json');

// Show first 50 for manual classification
movies.slice(0, 50).forEach((m, i) => {
  console.log(`${i+1}. ${m.name} (${m.year}) - ID: ${m.movieId}`);
  console.log(`   Genres: ${m.genres.join(', ')}`);
  console.log(`   Plot: ${m.plot}`);
  console.log('');
});
