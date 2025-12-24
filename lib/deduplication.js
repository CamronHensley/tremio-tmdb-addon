/**
 * Simple pass-through processor for manual curation
 * All genres will be manually sorted, so no deduplication needed
 */

const { GENRES, MOVIES_PER_GENRE } = require('./constants');
const ScoringEngine = require('./scoring-engine');

class DeduplicationProcessor {
  constructor() {
    this.scoringEngine = new ScoringEngine();
  }

  /**
   * Process genres with scoring but no deduplication
   * Just rank movies by score and take top N per genre
   * @param {Object} moviesByGenre - Object with genre codes as keys and movie arrays as values
   * @param {Array} recentMovieIds - Movie IDs shown recently (for diversity)
   * @returns {Object} Scored movies by genre
   */
  processAllGenres(moviesByGenre, recentMovieIds = []) {
    const result = {};
    const allGenreCodes = Object.keys(GENRES);

    for (const genreCode of allGenreCodes) {
      const movies = moviesByGenre[genreCode] || [];

      // Score and rank movies
      const scoredMovies = movies
        .map(movie => ({
          movie,
          score: this.scoringEngine.calculateScore(movie, genreCode, recentMovieIds)
        }))
        .filter(item => item.score >= 0)  // Filter out low quality
        .sort((a, b) => b.score - a.score)
        .slice(0, MOVIES_PER_GENRE)
        .map(item => item.movie);

      result[genreCode] = scoredMovies;
    }

    return result;
  }


  /**
   * Get statistics about processing
   */
  getStats() {
    return {
      totalUniqueMovies: 0,  // No deduplication tracking
      expectedTotal: Object.keys(GENRES).length * MOVIES_PER_GENRE
    };
  }
}

module.exports = DeduplicationProcessor;
