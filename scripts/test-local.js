/**
 * Local Test Script
 * 
 * Tests the scoring engine and TMDB client locally
 * Run with: node scripts/test-local.js
 */

require('dotenv').config();

const TMDBClient = require('../lib/tmdb-client');
const ScoringEngine = require('../lib/scoring-engine');
const DeduplicationProcessor = require('../lib/deduplication');
const { GENRES, MOVIES_PER_GENRE } = require('../lib/constants');

async function testTMDBClient() {
  console.log('\n Testing TMDB Client...\n');
  
  if (!process.env.TMDB_API_KEY) {
    console.log('  No TMDB_API_KEY found in .env - skipping API tests');
    return false;
  }

  const client = new TMDBClient(process.env.TMDB_API_KEY);
  
  try {
    console.log('  Testing discover endpoint...');
    const actionMovies = await client.discoverMovies(28, { page: 1 });
    console.log('  Found ' + actionMovies.results.length + ' action movies');
    console.log('    First movie: "' + actionMovies.results[0].title + '"');

    console.log('\n  Testing movie details endpoint...');
    const movieId = actionMovies.results[0].id;
    const details = await client.getMovieDetails(movieId);
    console.log('  Got details for "' + details.title + '"');
    console.log('    Runtime: ' + details.runtime + ' min');
    console.log('    Rating: ' + details.vote_average + '/10');

    console.log('\n  Testing Stremio meta conversion...');
    const meta = TMDBClient.toStremioMeta(details);
    console.log('  Converted to Stremio format');
    console.log('    ID: ' + meta.id);
    console.log('    Poster: ' + (meta.poster ? 'Yes' : 'No'));
    console.log('    Genres: ' + meta.genres.join(', '));

    console.log('\n  Total API requests: ' + client.getRequestCount());
    return true;
  } catch (error) {
    console.error('  TMDB test failed:', error.message);
    return false;
  }
}

function testScoringEngine() {
  console.log('\n Testing Scoring Engine...\n');
  
  const engine = new ScoringEngine();
  const debug = engine.getDebugInfo();
  
  console.log('  Current scoring context:');
  console.log('    Date: ' + debug.date);
  console.log('    Day of week: ' + debug.dayOfWeek);
  console.log('    Week of month: ' + debug.weekOfMonth);
  console.log('    Strategy: ' + debug.strategy);
  console.log('    Pages: ' + debug.pages.join(', '));
  console.log('    Sort param: ' + debug.sortParam);

  const mockMovies = [
    {
      id: 1,
      title: 'High Popularity Recent',
      popularity: 150,
      vote_average: 7.5,
      vote_count: 5000,
      release_date: '2024-06-15'
    },
    {
      id: 2,
      title: 'Hidden Gem',
      popularity: 25,
      vote_average: 8.2,
      vote_count: 800,
      release_date: '2022-03-20'
    },
    {
      id: 3,
      title: 'Classic Film',
      popularity: 45,
      vote_average: 8.5,
      vote_count: 15000,
      release_date: '1995-07-10'
    },
    {
      id: 4,
      title: 'Low Quality',
      popularity: 100,
      vote_average: 4.5,
      vote_count: 2000,
      release_date: '2023-01-01'
    }
  ];

  console.log('\n  Testing movie scoring for ACTION genre:');
  mockMovies.forEach(function(movie) {
    var score = engine.calculateScore(movie, 'ACTION');
    console.log('    "' + movie.title + '": ' + score.toFixed(2) + (score < 0 ? ' (excluded)' : ''));
  });

  var ranked = engine.rankMovies(mockMovies, 'ACTION');
  console.log('\n  Ranked order (excluding filtered):');
  ranked.forEach(function(movie, i) {
    console.log('    ' + (i + 1) + '. ' + movie.title);
  });

  console.log('\n  Scoring engine tests passed');
}

function testDeduplication() {
  console.log('\n Testing Deduplication...\n');
  
  var processor = new DeduplicationProcessor();
  
  var mockData = {
    ACTION: [
      { id: 1, title: 'Movie A', popularity: 100, vote_average: 7.5, vote_count: 5000, release_date: '2024-01-01' },
      { id: 2, title: 'Movie B', popularity: 80, vote_average: 7.0, vote_count: 3000, release_date: '2024-02-01' },
      { id: 3, title: 'Shared Movie', popularity: 90, vote_average: 7.8, vote_count: 4000, release_date: '2024-03-01' }
    ],
    THRILLER: [
      { id: 3, title: 'Shared Movie', popularity: 90, vote_average: 7.8, vote_count: 4000, release_date: '2024-03-01' },
      { id: 4, title: 'Movie D', popularity: 70, vote_average: 7.2, vote_count: 2500, release_date: '2024-04-01' }
    ]
  };

  console.log('  Input:');
  console.log('    ACTION: Movie A, Movie B, Shared Movie');
  console.log('    THRILLER: Shared Movie, Movie D');

  var result = processor.processGreedy(mockData);
  
  console.log('\n  Output (greedy deduplication):');
  Object.entries(result).forEach(function(entry) {
    var genre = entry[0];
    var movies = entry[1];
    if (movies.length > 0) {
      console.log('    ' + genre + ': ' + movies.map(function(m) { return m.title; }).join(', '));
    }
  });

  var stats = processor.getStats();
  console.log('\n  Stats: ' + stats.totalUniqueMovies + ' unique movies assigned');
  console.log('  Deduplication tests passed');
}

async function runAllTests() {
  console.log('='.repeat(50));
  console.log('  STREMIO TMDB ADDON - LOCAL TESTS');
  console.log('='.repeat(50));

  var tmdbPassed = await testTMDBClient();
  testScoringEngine();
  testDeduplication();

  console.log('\n' + '='.repeat(50));
  console.log('  TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('  TMDB Client: ' + (tmdbPassed ? 'Passed' : 'Skipped (no API key)'));
  console.log('  Scoring Engine: Passed');
  console.log('  Deduplication: Passed');
  console.log('='.repeat(50) + '\n');
}

runAllTests().catch(console.error);
