/**
 * Deduplication processor to ensure each movie appears in only one genre
 */

const { GENRES, MOVIES_PER_GENRE } = require('./constants');
const ScoringEngine = require('./scoring-engine');

class DeduplicationProcessor {
  constructor() {
    this.usedMovieIds = new Set();
    this.scoringEngine = new ScoringEngine();
  }

  /**
   * Process all genres and assign movies with deduplication
   * @param {Object} moviesByGenre - Object with genre codes as keys and movie arrays as values
   * @param {Array} recentMovieIds - Movie IDs shown in last 7 days
   * @returns {Object} Deduplicated movies by genre
   */
  processAllGenres(moviesByGenre, recentMovieIds = []) {
    const result = {};
    const allGenreCodes = Object.keys(GENRES);
    
    // First pass: Calculate best genre for each movie
    const movieGenreScores = new Map();  // movieId -> { genreCode, score }
    
    for (const genreCode of allGenreCodes) {
      const movies = moviesByGenre[genreCode] || [];
      
      for (const movie of movies) {
        const score = this.scoringEngine.calculateScore(movie, genreCode, recentMovieIds);
        
        if (score < 0) continue;  // Excluded by quality threshold
        
        const existingBest = movieGenreScores.get(movie.id);
        
        if (!existingBest || score > existingBest.score) {
          movieGenreScores.set(movie.id, {
            genreCode,
            score,
            movie
          });
        }
      }
    }

    // Second pass: Assign movies to their best genre
    const moviesByBestGenre = {};
    for (const genreCode of allGenreCodes) {
      moviesByBestGenre[genreCode] = [];
    }

    for (const [movieId, data] of movieGenreScores) {
      moviesByBestGenre[data.genreCode].push({
        movie: data.movie,
        score: data.score
      });
    }

    // Third pass: Sort each genre and take top N, handling genres that need more movies
    for (const genreCode of allGenreCodes) {
      // Sort by score
      moviesByBestGenre[genreCode].sort((a, b) => b.score - a.score);
      
      // Take top movies
      const topMovies = moviesByBestGenre[genreCode]
        .slice(0, MOVIES_PER_GENRE)
        .map(item => item.movie);
      
      result[genreCode] = topMovies;
      
      // Track used IDs
      topMovies.forEach(movie => this.usedMovieIds.add(movie.id));
    }

    // Fourth pass: Fill any genres that are short on movies
    for (const genreCode of allGenreCodes) {
      if (result[genreCode].length < MOVIES_PER_GENRE) {
        this.fillGenreFromPool(result, genreCode, moviesByGenre, recentMovieIds);
      }
    }

    // Fifth pass: Ensure all genres have exactly MOVIES_PER_GENRE
    // If some genres are still short, fetch more pages or lower standards
    const shortGenres = allGenreCodes.filter(code => result[code].length < MOVIES_PER_GENRE);
    if (shortGenres.length > 0) {
      console.log(`Genres still short: ${shortGenres.join(', ')}`);
      // Try one more time with even lower standards for short genres
      for (const genreCode of shortGenres) {
        const needed = MOVIES_PER_GENRE - result[genreCode].length;
        if (needed > 0) {
          console.log(`Final attempt to fill ${genreCode}, need ${needed} more movies`);
          this.fillGenreAggressive(result, genreCode, moviesByGenre);
        }
      }
    }

    return result;
  }

  /**
   * Fill a genre that has fewer than required movies
   */
  fillGenreFromPool(result, genreCode, moviesByGenre, recentMovieIds) {
    const needed = MOVIES_PER_GENRE - result[genreCode].length;
    if (needed <= 0) return;

    const currentIds = new Set(result[genreCode].map(m => m.id));

    // First try: Get movies that pass quality threshold and aren't used
    let candidates = (moviesByGenre[genreCode] || [])
      .filter(movie =>
        !currentIds.has(movie.id) &&
        !this.usedMovieIds.has(movie.id)
      )
      .map(movie => ({
        movie,
        score: this.scoringEngine.calculateScore(movie, genreCode, recentMovieIds)
      }))
      .filter(item => item.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, needed);

    // If still not enough, lower quality threshold and try again
    if (candidates.length < needed) {
      console.log(`Genre ${genreCode} only has ${result[genreCode].length + candidates.length} movies, need ${MOVIES_PER_GENRE}. Lowering quality threshold...`);

      const stillNeeded = needed - candidates.length;
      const additionalCandidates = (moviesByGenre[genreCode] || [])
        .filter(movie =>
          !currentIds.has(movie.id) &&
          !this.usedMovieIds.has(movie.id) &&
          !candidates.some(c => c.movie.id === movie.id) &&
          // Lower threshold: accept any movie with some votes
          movie.vote_count >= 50 &&
          movie.vote_average >= 5.0
        )
        .map(movie => ({
          movie,
          score: this.scoringEngine.calculateBaseScore(movie) // Use base score only
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, stillNeeded);

      candidates = [...candidates, ...additionalCandidates];
    }

    for (const { movie } of candidates) {
      result[genreCode].push(movie);
      this.usedMovieIds.add(movie.id);
    }

    // Log warning if still short
    if (result[genreCode].length < MOVIES_PER_GENRE) {
      console.warn(`Warning: Genre ${genreCode} only has ${result[genreCode].length} movies (target: ${MOVIES_PER_GENRE})`);
    }
  }

  /**
   * Aggressively fill genre with minimal quality requirements
   * Used as last resort to ensure all genres have equal movie counts
   */
  fillGenreAggressive(result, genreCode, moviesByGenre) {
    const needed = MOVIES_PER_GENRE - result[genreCode].length;
    if (needed <= 0) return;

    const currentIds = new Set(result[genreCode].map(m => m.id));

    // Accept almost any movie: just needs to have some basic data
    const candidates = (moviesByGenre[genreCode] || [])
      .filter(movie =>
        !currentIds.has(movie.id) &&
        !this.usedMovieIds.has(movie.id) &&
        movie.vote_count >= 10 &&  // Very minimal threshold
        movie.vote_average >= 4.0   // Very low bar
      )
      .map(movie => ({
        movie,
        score: movie.popularity + movie.vote_average // Simple score
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, needed);

    for (const { movie } of candidates) {
      result[genreCode].push(movie);
      this.usedMovieIds.add(movie.id);
    }

    console.log(`Aggressively filled ${genreCode} with ${candidates.length} movies (still need ${MOVIES_PER_GENRE - result[genreCode].length})`);
  }

  /**
   * Alternative: Simple greedy deduplication (process genres in order)
   * Faster but may not give optimal genre assignments
   */
  processGreedy(moviesByGenre, recentMovieIds = []) {
    const result = {};
    this.usedMovieIds.clear();
    
    const allGenreCodes = Object.keys(GENRES);

    for (const genreCode of allGenreCodes) {
      const movies = moviesByGenre[genreCode] || [];
      
      const ranked = this.scoringEngine.rankMovies(movies, genreCode, recentMovieIds);
      
      const selectedMovies = [];
      for (const movie of ranked) {
        if (selectedMovies.length >= MOVIES_PER_GENRE) break;
        
        if (!this.usedMovieIds.has(movie.id)) {
          selectedMovies.push(movie);
          this.usedMovieIds.add(movie.id);
        }
      }
      
      result[genreCode] = selectedMovies;
    }

    return result;
  }

  /**
   * Get statistics about deduplication
   */
  getStats() {
    return {
      totalUniqueMovies: this.usedMovieIds.size,
      expectedTotal: Object.keys(GENRES).length * MOVIES_PER_GENRE
    };
  }

  /**
   * Reset state for new processing run
   */
  reset() {
    this.usedMovieIds.clear();
  }
}

module.exports = DeduplicationProcessor;
