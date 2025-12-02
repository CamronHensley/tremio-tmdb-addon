/**
 * Hybrid caching strategy
 * Merges fresh TMDB data with yesterday's catalog to reduce API calls
 */

const { MOVIES_PER_GENRE } = require('./constants');

class HybridCache {
  /**
   * Merge fresh movies with previous catalog
   * Strategy: Put fresh movies at top, fill rest from yesterday
   *
   * @param {Object} freshMoviesByGenre - Newly fetched movies from TMDB (limited pages)
   * @param {Object} previousCatalog - Yesterday's full catalog with movie details
   * @param {Number} freshCount - How many fresh movies to show at top (default 30)
   * @returns {Object} Merged movies by genre
   */
  static mergeWithPrevious(freshMoviesByGenre, previousCatalog, freshCount = 30) {
    const merged = {};

    if (!previousCatalog || !previousCatalog.genres) {
      console.log('No previous catalog available, using only fresh data');
      return freshMoviesByGenre;
    }

    const genreCodes = Object.keys(freshMoviesByGenre);

    for (const genreCode of genreCodes) {
      const freshMovies = freshMoviesByGenre[genreCode] || [];
      const previousMovies = previousCatalog.genres[genreCode] || [];

      // Take top fresh movies (these will appear first in catalog)
      const topFresh = freshMovies.slice(0, freshCount);

      // Create a set of TMDB IDs from fresh movies for comparison
      // Fresh movies have raw TMDB numeric IDs
      const topFreshTmdbIds = new Set(topFresh.map(m => String(m.id)));

      // Fill remaining slots from previous catalog (skip if already in fresh)
      // Previous catalog uses Stremio format IDs (IMDB or tmdb:123)
      // We need to extract TMDB ID for comparison
      const needed = MOVIES_PER_GENRE - topFresh.length;
      const fromPrevious = previousMovies
        .filter(m => {
          // Extract TMDB ID from previous catalog movie
          let tmdbId;
          if (m.tmdbId) {
            // If we stored it (we don't currently)
            tmdbId = String(m.tmdbId);
          } else if (m.id && m.id.startsWith('tmdb:')) {
            // Extract from tmdb:123 format
            tmdbId = m.id.replace('tmdb:', '');
          } else {
            // It's an IMDB ID - we can't easily compare, so include it
            // (this is safe because IMDB IDs will never match TMDB numeric IDs)
            return true;
          }

          // Exclude if this TMDB ID is in fresh movies
          return !topFreshTmdbIds.has(tmdbId);
        })
        .slice(0, needed);

      // Combine: fresh at top, previous at bottom
      merged[genreCode] = [...topFresh, ...fromPrevious];

      console.log(`  ${genreCode}: ${topFresh.length} fresh + ${fromPrevious.length} from cache = ${merged[genreCode].length} total`);
    }

    return merged;
  }

  /**
   * Extract all movie IDs from a catalog for tracking
   */
  static extractMovieIds(catalog) {
    const ids = [];

    if (catalog && catalog.genres) {
      for (const genreCode in catalog.genres) {
        const movies = catalog.genres[genreCode] || [];
        movies.forEach(m => ids.push(m.id));
      }
    }

    return ids;
  }

  /**
   * Calculate statistics about the merge
   */
  static getMergeStats(mergedCatalog, freshMoviesByGenre) {
    let totalMovies = 0;
    let freshMovies = 0;
    let cachedMovies = 0;

    for (const genreCode in mergedCatalog) {
      const merged = mergedCatalog[genreCode] || [];
      const fresh = freshMoviesByGenre[genreCode] || [];

      totalMovies += merged.length;

      // Count how many are from fresh fetch
      const freshIds = new Set(fresh.map(m => m.id));
      const freshInMerged = merged.filter(m => freshIds.has(m.id)).length;

      freshMovies += freshInMerged;
      cachedMovies += (merged.length - freshInMerged);
    }

    return {
      totalMovies,
      freshMovies,
      cachedMovies,
      freshPercentage: ((freshMovies / totalMovies) * 100).toFixed(1),
      cachedPercentage: ((cachedMovies / totalMovies) * 100).toFixed(1)
    };
  }
}

module.exports = HybridCache;
