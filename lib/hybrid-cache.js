const { MOVIES_PER_GENRE, DAY_STRATEGIES } = require('./constants');

/**
 * Hybrid Cache with Intelligent Selection
 *
 * Merges fresh content with cached content using daily rotation strategies.
 * - First 30 positions: Always fresh content (never from cache)
 * - Remaining 70: Mix of fresh overflow + cached (scored and selected)
 * - Applies daily strategies, historical penalties, and controlled randomization
 */
class HybridCache {
  constructor() {
    this.today = new Date();
    this.dayOfWeek = this.today.getUTCDay();
    this.strategy = DAY_STRATEGIES[this.dayOfWeek];
    this.currentYear = this.today.getUTCFullYear();
  }

  /**
   * Calculate base cache score for movie selection
   */
  calculateCacheScore(movie) {
    const popularity = Math.min(movie.popularity / 100, 1) * 40;
    const rating = (movie.vote_average / 10) * 35;
    const votes = Math.min(Math.log10(movie.vote_count + 1) / 5, 1) * 25;
    return popularity + rating + votes;
  }

  /**
   * Apply daily strategy modifiers to cache selection
   */
  applyStrategyModifier(score, movie) {
    const movieYear = movie.release_date
      ? parseInt(movie.release_date.split('-')[0], 10)
      : this.currentYear;
    const age = this.currentYear - movieYear;

    switch (this.strategy) {
      case 'RISING_STARS':
        if (age <= 1) return score * 1.2;
        if (age <= 2) return score * 1.1;
        if (age > 5) return score * 0.9;
        break;

      case 'CRITICAL_DARLINGS':
        return score * (movie.vote_average / 8);

      case 'HIDDEN_GEMS':
        if (movie.popularity < 50 && movie.vote_average >= 7.0) {
          return score * 1.3;
        }
        if (movie.popularity > 200) {
          return score * 0.7;
        }
        break;

      case 'BLOCKBUSTERS':
        if (movie.vote_count > 10000) score *= 1.2;
        if (movie.popularity > 100) score *= 1.1;
        break;

      case 'FRESH_RELEASES':
        if (age === 0) return score * 1.5;
        if (age === 1) return score * 1.2;
        break;

      case 'TIMELESS_CLASSICS':
        if (age >= 10 && movie.vote_count > 5000) score *= 1.3;
        if (age >= 20) score *= 1.1;
        break;

      case 'AUDIENCE_FAVORITES':
        return score * Math.min(Math.log10(movie.vote_count + 1) / 4, 1.5);
    }

    return score;
  }

  /**
   * Apply historical penalty to avoid recently shown movies
   */
  applyHistoricalPenalty(score, movie, recentMovieIds) {
    if (recentMovieIds && recentMovieIds.includes(movie.id)) {
      return score * 0.7; // 30% penalty for recently shown
    }
    return score;
  }

  /**
   * Apply controlled randomization for daily variety
   * Deterministic: same movie gets same boost throughout the day
   */
  applyControlledRandom(score, movie, genreCode) {
    const dateString = this.today.toISOString().split('T')[0];
    const seed = this.hashCode(`${dateString}-${genreCode}-${movie.id}`);
    const randomBoost = (Math.abs(seed) % 1500) / 10000; // 0-15%
    return score * (1 + randomBoost);
  }

  /**
   * Simple hash function for deterministic randomness
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * Select best movies from a pool using cache scoring
   */
  selectBestMovies(movies, genreCode, recentMovieIds, count) {
    const scored = movies.map(movie => {
      let score = this.calculateCacheScore(movie);
      score = this.applyStrategyModifier(score, movie);
      score = this.applyHistoricalPenalty(score, movie, recentMovieIds);
      score = this.applyControlledRandom(score, movie, genreCode);
      return { movie, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.movie);
  }

  /**
   * Merge fresh and cached content with intelligent selection
   *
   * Strategy: First 30 positions prioritize fresh but allow high-scoring cached to compete
   *
   * @param {Object} freshMoviesByGenre - Fresh movies fetched from TMDB
   * @param {Object} previousCatalog - Yesterday's catalog
   * @param {Array} recentMovieIds - Recently shown movie IDs for diversity
   * @param {Number} minFreshInTop30 - Minimum fresh movies in top 30 (default 20)
   * @returns {Object} Merged catalog with intelligent selection
   */
  static mergeWithPrevious(freshMoviesByGenre, previousCatalog, recentMovieIds = [], minFreshInTop30 = 20) {
    const cache = new HybridCache();
    const merged = {};

    if (!previousCatalog || !previousCatalog.genres) {
      console.log('No previous catalog available, using only fresh data');
      return freshMoviesByGenre;
    }

    const genreCodes = Object.keys(freshMoviesByGenre);

    for (const genreCode of genreCodes) {
      const freshMovies = freshMoviesByGenre[genreCode] || [];
      const cachedMovies = previousCatalog.genres[genreCode] || [];

      // Get all cached IDs for deduplication
      const cachedIds = new Set();
      cachedMovies.forEach(m => {
        let movieId;
        if (m.tmdbId) {
          movieId = String(m.tmdbId);
        } else if (m.id && typeof m.id === 'string' && m.id.startsWith('tmdb:')) {
          movieId = m.id.replace('tmdb:', '');
        }
        if (movieId) cachedIds.add(movieId);
      });

      // Remove cached movies that are in fresh set (avoid duplicates)
      const uniqueCached = cachedMovies.filter(m => {
        let movieId;
        if (m.tmdbId) {
          movieId = String(m.tmdbId);
        } else if (m.id && typeof m.id === 'string' && m.id.startsWith('tmdb:')) {
          movieId = m.id.replace('tmdb:', '');
        }
        if (!movieId) return false;

        // Check if this cached movie is in fresh set
        return !freshMovies.some(f => String(f.id) === movieId);
      });

      // STRATEGY: Top 30 positions
      // - Guarantee at least 20 are fresh (variety)
      // - Remaining 10 can be filled by whoever scores highest (fresh or cached)

      // Select best 20 fresh for guaranteed positions
      const guaranteedFresh = cache.selectBestMovies(
        freshMovies,
        genreCode,
        recentMovieIds,
        minFreshInTop30
      );

      const guaranteedFreshIds = new Set(guaranteedFresh.map(m => String(m.id)));

      // Pool for competing positions (top 30): remaining fresh + all cached
      const remainingFresh = freshMovies.filter(m => !guaranteedFreshIds.has(String(m.id)));
      const poolForTop30 = [...remainingFresh, ...uniqueCached];

      // Select best 10 from the pool to fill positions 21-30
      const competingTop30 = cache.selectBestMovies(
        poolForTop30,
        genreCode,
        recentMovieIds,
        30 - minFreshInTop30
      );

      const top30Ids = new Set([
        ...guaranteedFresh.map(m => String(m.id)),
        ...competingTop30.map(m => {
          if (m.tmdbId) return String(m.tmdbId);
          if (m.id && typeof m.id === 'string' && m.id.startsWith('tmdb:')) return m.id.replace('tmdb:', '');
          return String(m.id);
        })
      ]);

      // Pool for positions 31-100: fresh + cached that didn't make top 30
      const freshForBottom70 = freshMovies.filter(m => !top30Ids.has(String(m.id)));
      const cachedForBottom70 = uniqueCached.filter(m => {
        let movieId;
        if (m.tmdbId) movieId = String(m.tmdbId);
        else if (m.id && typeof m.id === 'string' && m.id.startsWith('tmdb:')) movieId = m.id.replace('tmdb:', '');
        else movieId = String(m.id);
        return !top30Ids.has(movieId);
      });

      const poolForBottom70 = [...freshForBottom70, ...cachedForBottom70];

      // Select best 70 for remaining positions
      const bottom70 = cache.selectBestMovies(
        poolForBottom70,
        genreCode,
        recentMovieIds,
        MOVIES_PER_GENRE - 30
      );

      // Final merge: guaranteed fresh + competing top 30 + bottom 70
      merged[genreCode] = [...guaranteedFresh, ...competingTop30, ...bottom70];

      // Count fresh vs cached
      const freshInTop30 = guaranteedFresh.length + competingTop30.filter(m =>
        freshMovies.some(f => String(f.id) === String(m.id || m.tmdbId))
      ).length;

      const cachedInTop30 = competingTop30.filter(m =>
        !freshMovies.some(f => String(f.id) === String(m.id || m.tmdbId))
      ).length;

      console.log(`  ${genreCode}: Top 30 (${freshInTop30} fresh, ${cachedInTop30} cached) + Bottom 70 = ${merged[genreCode].length} total`);
    }

    return merged;
  }

  /**
   * Get merge statistics
   */
  static getMergeStats(mergedCatalog, freshMoviesByGenre) {
    let totalMovies = 0;
    let freshMovies = 0;
    let cachedMovies = 0;

    for (const genreCode in mergedCatalog) {
      const merged = mergedCatalog[genreCode] || [];
      const fresh = freshMoviesByGenre[genreCode] || [];

      totalMovies += merged.length;

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
