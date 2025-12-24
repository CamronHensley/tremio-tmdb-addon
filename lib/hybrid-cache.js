const { MOVIES_PER_GENRE } = require('./constants');

class HybridCache {
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

      const topFresh = freshMovies.slice(0, freshCount);
      const topFreshTmdbIds = new Set(topFresh.map(m => String(m.id)));

      const needed = MOVIES_PER_GENRE - topFresh.length;
      const fromPrevious = previousMovies
        .filter(m => {
          let tmdbId;
          if (m.tmdbId) {
            tmdbId = String(m.tmdbId);
          } else if (m.id && m.id.startsWith('tmdb:')) {
            tmdbId = m.id.replace('tmdb:', '');
          } else {
            console.log(`  ⚠️  Skipping movie without TMDB ID: ${m.id} (${m.name})`);
            return false;
          }

          return !topFreshTmdbIds.has(tmdbId);
        })
        .slice(0, needed);

      merged[genreCode] = [...topFresh, ...fromPrevious];

      console.log(`  ${genreCode}: ${topFresh.length} fresh + ${fromPrevious.length} from cache = ${merged[genreCode].length} total`);
    }

    return merged;
  }

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
