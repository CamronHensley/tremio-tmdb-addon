const { GENRES, MOVIES_PER_GENRE } = require('./constants');
const ScoringEngine = require('./scoring-engine');

class DeduplicationProcessor {
  constructor() {
    this.scoringEngine = new ScoringEngine();
  }

  processAllGenres(moviesByGenre, recentMovieIds = []) {
    const result = {};
    const allGenreCodes = Object.keys(GENRES);

    for (const genreCode of allGenreCodes) {
      const movies = moviesByGenre[genreCode] || [];

      const scoredMovies = movies
        .map(movie => ({
          movie,
          score: this.scoringEngine.calculateScore(movie, genreCode, recentMovieIds)
        }))
        .filter(item => item.score >= 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MOVIES_PER_GENRE)
        .map(item => item.movie);

      result[genreCode] = scoredMovies;
    }

    return result;
  }

  getStats() {
    return {
      totalUniqueMovies: 0,
      expectedTotal: Object.keys(GENRES).length * MOVIES_PER_GENRE
    };
  }
}

module.exports = DeduplicationProcessor;
