/**
 * Scoring Engine - Pure Movie Ranking
 *
 * Ranks movies based on quality metrics and genre-specific preferences.
 * Does NOT control TMDB queries - works on whatever data is provided.
 * Used for initial scoring of fresh TMDB results before cache management.
 */

const { GENRE_PERSONALITIES } = require('./constants');

class ScoringEngine {
  constructor() {
    this.today = new Date();
    this.month = this.today.getUTCMonth() + 1;
    this.currentYear = this.today.getUTCFullYear();
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
   * Apply genre-specific personality modifiers
   * Genre personalities add contextual bonuses (seasonal, era-specific, etc.)
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
   * Calculate final score for a movie
   * Used for initial ranking of fresh TMDB results
   */
  calculateScore(movie, genreCode) {
    let score = this.calculateBaseScore(movie);
    score = this.applyGenrePersonality(score, movie, genreCode);
    return score;
  }
}

module.exports = ScoringEngine;
