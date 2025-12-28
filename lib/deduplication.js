const { GENRES } = require('./constants');
const ScoringEngine = require('./scoring-engine');

class DeduplicationProcessor {
  constructor() {
    this.scoringEngine = new ScoringEngine();
  }

  processAllGenres(moviesByGenre, cachedCatalog = null) {
    const result = {};
    const allGenreCodes = Object.keys(GENRES);

    for (const genreCode of allGenreCodes) {
      const movies = moviesByGenre[genreCode] || [];

      // Get cached movie IDs to exclude from fresh results (deduplicate against cache)
      const cachedIds = new Set();
      if (cachedCatalog && cachedCatalog.genres && cachedCatalog.genres[genreCode]) {
        cachedCatalog.genres[genreCode].forEach(m => {
          if (m.tmdbId) {
            cachedIds.add(m.tmdbId);
          } else if (m.id && typeof m.id === 'string' && m.id.startsWith('tmdb:')) {
            cachedIds.add(parseInt(m.id.replace('tmdb:', ''), 10));
          }
        });
      }

      // Filter out movies that are already in cache
      const freshOnly = movies.filter(movie => !cachedIds.has(movie.id));

      // Use scoring engine for initial quality-based ranking
      const scoredMovies = freshOnly
        .map(movie => ({
          movie,
          score: this.scoringEngine.calculateScore(movie, genreCode)
        }))
        .filter(item => item.score >= 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.movie);

      result[genreCode] = scoredMovies;
    }

    return result;
  }
}

module.exports = DeduplicationProcessor;
