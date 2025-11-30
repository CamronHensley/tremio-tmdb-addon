/**
 * Scoring engine for movie ranking with daily rotation strategies
 * and genre-specific personalities
 */

const {
  QUALITY_THRESHOLDS,
  DAY_STRATEGIES,
  PAGE_ROTATION,
  GENRE_PERSONALITIES,
  GENRES
} = require('./constants');

class ScoringEngine {
  constructor() {
    this.today = new Date();
    this.dayOfWeek = this.today.getUTCDay();
    this.weekOfMonth = Math.floor((this.today.getUTCDate() - 1) / 7) % 4;
    this.month = this.today.getUTCMonth() + 1;
    this.currentYear = this.today.getUTCFullYear();
    this.strategy = DAY_STRATEGIES[this.dayOfWeek];
  }

  /**
   * Get the pages to fetch based on 28-day rotation
   */
  getRotationPages() {
    return PAGE_ROTATION[this.weekOfMonth] || [1, 2, 3];
  }

  /**
   * Get sort parameter for TMDB based on daily strategy
   */
  getSortParameter() {
    switch (this.strategy) {
      case 'RISING_STARS':
        return 'popularity.desc';
      case 'CRITICAL_DARLINGS':
        return 'vote_average.desc';
      case 'HIDDEN_GEMS':
        return 'vote_average.desc';
      case 'BLOCKBUSTERS':
        return 'revenue.desc';
      case 'FRESH_RELEASES':
        return 'primary_release_date.desc';
      case 'TIMELESS_CLASSICS':
        return 'vote_count.desc';
      case 'AUDIENCE_FAVORITES':
        return 'vote_count.desc';
      default:
        return 'popularity.desc';
    }
  }

  /**
   * Get additional TMDB query parameters based on strategy
   */
  getStrategyParams() {
    const params = {};
    const today = this.today.toISOString().split('T')[0];
    
    switch (this.strategy) {
      case 'RISING_STARS':
        // Recent movies with mid-tier popularity
        params.releaseDateGte = `${this.currentYear - 2}-01-01`;
        params.minVotes = 100;
        break;
        
      case 'CRITICAL_DARLINGS':
        params.minRating = 7.5;
        params.minVotes = 1000;
        break;
        
      case 'HIDDEN_GEMS':
        params.minRating = 7.0;
        params.minVotes = 200;
        // Lower popularity range handled in scoring
        break;
        
      case 'BLOCKBUSTERS':
        params.minVotes = 2000;
        break;
        
      case 'FRESH_RELEASES':
        const threeMonthsAgo = new Date(this.today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        params.releaseDateGte = threeMonthsAgo.toISOString().split('T')[0];
        params.releaseDateLte = today;
        params.minVotes = 50;  // Lower threshold for new releases
        break;
        
      case 'TIMELESS_CLASSICS':
        params.releaseDateLte = `${this.currentYear - 3}-12-31`;
        params.minRating = 7.0;
        params.minVotes = 5000;
        break;
        
      case 'AUDIENCE_FAVORITES':
        params.minVotes = 3000;
        break;
    }
    
    return params;
  }

  /**
   * Check if movie passes quality thresholds for genre
   */
  passesQualityThreshold(movie, genreCode) {
    const thresholds = QUALITY_THRESHOLDS[genreCode] || QUALITY_THRESHOLDS.DEFAULT;
    
    return (
      movie.vote_count >= thresholds.minVotes &&
      movie.vote_average >= thresholds.minRating &&
      movie.popularity >= thresholds.minPopularity
    );
  }

  /**
   * Calculate the base score for a movie
   */
  calculateBaseScore(movie) {
    // Normalize metrics to 0-100 scale
    const popularityScore = Math.min(movie.popularity / 100, 1) * 40;  // Max 40 points
    const ratingScore = (movie.vote_average / 10) * 35;                // Max 35 points
    const voteScore = Math.min(Math.log10(movie.vote_count + 1) / 5, 1) * 25;  // Max 25 points
    
    return popularityScore + ratingScore + voteScore;
  }

  /**
   * Apply strategy-specific modifiers
   */
  applyStrategyModifier(score, movie) {
    const movieYear = movie.release_date 
      ? parseInt(movie.release_date.split('-')[0], 10) 
      : this.currentYear;
    const age = this.currentYear - movieYear;

    switch (this.strategy) {
      case 'RISING_STARS':
        // Bonus for recent movies, penalty for old
        if (age <= 1) score *= 1.2;
        else if (age <= 2) score *= 1.1;
        else if (age > 5) score *= 0.9;
        break;
        
      case 'CRITICAL_DARLINGS':
        // Heavy emphasis on rating
        score *= (movie.vote_average / 8);
        break;
        
      case 'HIDDEN_GEMS':
        // Bonus for lower popularity but high rating
        if (movie.popularity < 50 && movie.vote_average >= 7.0) {
          score *= 1.3;
        }
        // Penalty for very popular movies
        if (movie.popularity > 200) {
          score *= 0.7;
        }
        break;
        
      case 'BLOCKBUSTERS':
        // Bonus for high vote count and popularity
        if (movie.vote_count > 10000) score *= 1.2;
        if (movie.popularity > 100) score *= 1.1;
        break;
        
      case 'FRESH_RELEASES':
        // Heavy bonus for recency
        if (age === 0) score *= 1.5;
        else if (age === 1) score *= 1.2;
        break;
        
      case 'TIMELESS_CLASSICS':
        // Bonus for older films with high votes
        if (age >= 10 && movie.vote_count > 5000) score *= 1.3;
        if (age >= 20) score *= 1.1;
        break;
        
      case 'AUDIENCE_FAVORITES':
        // Heavy emphasis on vote count
        score *= Math.min(Math.log10(movie.vote_count + 1) / 4, 1.5);
        break;
    }
    
    return score;
  }

  /**
   * Apply genre-specific personality modifiers
   */
  applyGenrePersonality(score, movie, genreCode) {
    const personality = GENRE_PERSONALITIES[genreCode];
    if (!personality) return score;

    const movieYear = movie.release_date 
      ? parseInt(movie.release_date.split('-')[0], 10) 
      : this.currentYear;
    const age = this.currentYear - movieYear;

    // Recent year bonus
    if (personality.recentYearBonus && age <= 2) {
      score *= (1 + personality.recentYearBonus);
    }

    // High budget bonus (approximate by popularity for blockbusters)
    if (personality.highBudgetBonus && movie.popularity > 100) {
      score *= (1 + personality.highBudgetBonus);
    }

    // Cult film bonus (lower popularity but decent rating)
    if (personality.cultFilmBonus && movie.popularity < 30 && movie.vote_average >= 6.5) {
      score *= (1 + personality.cultFilmBonus);
    }

    // Audience validation weight
    if (personality.audienceValidationWeight) {
      const voteBonus = Math.min(Math.log10(movie.vote_count + 1) / 5, 1) * 0.1;
      score *= (1 + voteBonus * (personality.audienceValidationWeight - 1));
    }

    // Older film penalty
    if (personality.olderFilmPenalty && age > 20) {
      score *= (1 - personality.olderFilmPenalty);
    }

    // Critical acclaim weight
    if (personality.criticalAcclaimWeight && movie.vote_average >= 7.5) {
      score *= personality.criticalAcclaimWeight;
    }

    // Recency weight
    if (personality.recencyWeight && age <= 2) {
      score *= personality.recencyWeight;
    }

    // Seasonal boost
    if (personality.seasonalBoost) {
      const { months, bonus } = personality.seasonalBoost;
      if (months.includes(this.month)) {
        score *= (1 + bonus);
      }
    }

    // Award season bonus
    if (personality.awardSeasonBonus) {
      const { months, bonus } = personality.awardSeasonBonus;
      if (months.includes(this.month) && movie.vote_average >= 7.5) {
        score *= (1 + bonus);
      }
    }

    // Golden era bonus
    if (personality.goldenEraBonus) {
      const { yearRange, bonus } = personality.goldenEraBonus;
      if (movieYear >= yearRange[0] && movieYear <= yearRange[1]) {
        score *= (1 + bonus);
      }
    }

    // Classic era bonus
    if (personality.classicEraBonus) {
      const { yearRange, bonus } = personality.classicEraBonus;
      if (movieYear >= yearRange[0] && movieYear <= yearRange[1]) {
        score *= (1 + bonus);
      }
    }

    // Sweet spot rating bonus
    if (personality.sweetSpotRating) {
      const { min, max, bonus } = personality.sweetSpotRating;
      if (movie.vote_average >= min && movie.vote_average <= max) {
        score *= (1 + bonus);
      }
    }

    return score;
  }

  /**
   * Apply controlled randomization for variety
   * Same result for same day + genre + movie
   */
  applyControlledRandom(score, movie, genreCode) {
    // Create a deterministic but varying seed
    const dateString = this.today.toISOString().split('T')[0];
    const seed = this.hashCode(`${dateString}-${genreCode}-${movie.id}`);
    
    // Generate pseudo-random value between 0 and 0.15 (max 15% boost)
    const randomBoost = (Math.abs(seed) % 1500) / 10000;
    
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
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Apply historical penalty for recently shown movies
   */
  applyHistoricalPenalty(score, movie, recentMovieIds) {
    if (recentMovieIds && recentMovieIds.includes(movie.id)) {
      return score * 0.7;  // 30% penalty
    }
    return score;
  }

  /**
   * Calculate final score for a movie
   */
  calculateScore(movie, genreCode, recentMovieIds = []) {
    // Check quality threshold first
    if (!this.passesQualityThreshold(movie, genreCode)) {
      return -1;  // Mark as excluded
    }

    let score = this.calculateBaseScore(movie);
    score = this.applyStrategyModifier(score, movie);
    score = this.applyGenrePersonality(score, movie, genreCode);
    score = this.applyControlledRandom(score, movie, genreCode);
    score = this.applyHistoricalPenalty(score, movie, recentMovieIds);

    return score;
  }

  /**
   * Score and rank movies for a genre
   */
  rankMovies(movies, genreCode, recentMovieIds = []) {
    const scored = movies.map(movie => ({
      movie,
      score: this.calculateScore(movie, genreCode, recentMovieIds)
    }));

    // Filter out excluded movies and sort by score
    return scored
      .filter(item => item.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.movie);
  }

  /**
   * Get current strategy name for logging
   */
  getStrategyName() {
    return this.strategy;
  }

  /**
   * Get debug info about current scoring context
   */
  getDebugInfo() {
    return {
      date: this.today.toISOString().split('T')[0],
      dayOfWeek: this.dayOfWeek,
      weekOfMonth: this.weekOfMonth,
      month: this.month,
      strategy: this.strategy,
      pages: this.getRotationPages(),
      sortParam: this.getSortParameter()
    };
  }
}

module.exports = ScoringEngine;
