const { GENRES, MOVIES_PER_GENRE } = require('./constants');
const ScoringEngine = require('./scoring-engine');

class DeduplicationProcessor {
  constructor() {
    this.scoringEngine = new ScoringEngine();
  }

  processAllGenres(moviesByGenre) {
    const result = {};
    const allGenreCodes = Object.keys(GENRES);

    for (const genreCode of allGenreCodes) {
      const movies = moviesByGenre[genreCode] || [];

      // Use scoring engine for initial quality-based ranking
      const scoredMovies = movies
        .map(movie => ({
          movie,
          score: this.scoringEngine.calculateScore(movie, genreCode)
        }))
        .filter(item => item.score >= 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MOVIES_PER_GENRE * 2) // Get more than needed for cache layer to choose from
        .map(item => item.movie);

      result[genreCode] = scoredMovies;
    }

    return result;
  }
}

module.exports = DeduplicationProcessor;
