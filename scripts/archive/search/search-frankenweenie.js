const TMDBClient = require('../lib/tmdb-client');
require('dotenv').config();

async function main() {
  const tmdb = new TMDBClient(process.env.TMDB_API_KEY);

  // Search for Frankenweenie
  const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=Frankenweenie`;
  const response = await fetch(searchUrl);
  const data = await response.json();

  console.log('Frankenweenie search results:\n');
  data.results.forEach(movie => {
    console.log(`${movie.title} (${movie.release_date?.substring(0, 4) || 'N/A'})`);
    console.log(`   ID: ${movie.id}`);
    console.log(`   Overview: ${movie.overview}`);
    console.log();
  });
}

main().catch(console.error);
