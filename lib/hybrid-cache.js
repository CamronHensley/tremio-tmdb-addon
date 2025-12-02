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

      // Create sets for deduplication comparison
      // Fresh movies have raw TMDB numeric IDs before detail fetch
      const topFreshTmdbIds = new Set(topFresh.map(m => String(m.id)));

      // Fill remaining slots from previous catalog (skip if already in fresh)
      const needed = MOVIES_PER_GENRE - topFresh.length;
      const fromPrevious = previousMovies
        .filter(m => {
          // Previous catalog movies have been through toStremioMeta()
          // They have tmdbId field (if created with new code) OR can extract from id field

          let tmdbId;
          if (m.tmdbId) {
            // New format: has tmdbId field
            tmdbId = String(m.tmdbId);
          } else if (m.id && m.id.startsWith('tmdb:')) {
            // Old format: tmdb:123 format
            tmdbId = m.id.replace('tmdb:', '');
          } else {
            // It's an IMDB ID (tt123) with no tmdbId field
            // This happens during transition period (old catalog-previous)
            // We CANNOT reliably deduplicate these, so EXCLUDE them to be safe
            // They'll be refreshed with proper tmdbId on next run
            console.log(`  ⚠️  Skipping movie without TMDB ID: ${m.id} (${m.name})`);
            return false;  // Exclude movies without TMDB ID
          }

          // Exclude if this TMDB ID is in fresh movies (duplicate)
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
