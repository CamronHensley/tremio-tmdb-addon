const ScoringEngine = require('../scoring-engine');

describe('ScoringEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new ScoringEngine();
  });

  describe('getRotationPages', () => {
    it('should return valid page arrays', () => {
      const pages = engine.getRotationPages();
      expect(Array.isArray(pages)).toBe(true);
      expect(pages.length).toBeGreaterThan(0);
      pages.forEach(page => {
        expect(typeof page).toBe('number');
        expect(page).toBeGreaterThan(0);
      });
    });

    it('should return different pages based on week of month', () => {
      // Week of month is calculated from date, so we test the logic
      expect(engine.weekOfMonth).toBeGreaterThanOrEqual(0);
      expect(engine.weekOfMonth).toBeLessThan(4);
    });
  });

  describe('getSortParameter', () => {
    it('should return valid TMDB sort parameters', () => {
      const validParams = [
        'popularity.desc',
        'vote_average.desc',
        'revenue.desc',
        'primary_release_date.desc',
        'vote_count.desc'
      ];

      const param = engine.getSortParameter();
      expect(validParams).toContain(param);
    });
  });

  describe('getStrategyParams', () => {
    it('should return an object with valid parameters', () => {
      const params = engine.getStrategyParams();
      expect(typeof params).toBe('object');

      // Check that date parameters are valid ISO format if present
      if (params.releaseDateGte) {
        expect(params.releaseDateGte).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      if (params.releaseDateLte) {
        expect(params.releaseDateLte).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }

      // Check that numeric params are positive if present
      if (params.minVotes) {
        expect(params.minVotes).toBeGreaterThan(0);
      }
      if (params.minRating) {
        expect(params.minRating).toBeGreaterThan(0);
      }
    });
  });

  describe('passesQualityThreshold', () => {
    it('should pass movies meeting minimum requirements', () => {
      const goodMovie = {
        vote_count: 1000,
        vote_average: 7.5,
        popularity: 50
      };

      expect(engine.passesQualityThreshold(goodMovie, 'ACTION')).toBe(true);
    });

    it('should reject movies with low vote count', () => {
      const lowVotesMovie = {
        vote_count: 10,
        vote_average: 7.5,
        popularity: 50
      };

      expect(engine.passesQualityThreshold(lowVotesMovie, 'ACTION')).toBe(false);
    });

    it('should reject movies with low rating', () => {
      const lowRatingMovie = {
        vote_count: 1000,
        vote_average: 4.0,
        popularity: 50
      };

      expect(engine.passesQualityThreshold(lowRatingMovie, 'ACTION')).toBe(false);
    });

    it('should reject movies with low popularity', () => {
      const lowPopularityMovie = {
        vote_count: 1000,
        vote_average: 7.5,
        popularity: 1
      };

      expect(engine.passesQualityThreshold(lowPopularityMovie, 'ACTION')).toBe(false);
    });

    it('should use different thresholds for different genres', () => {
      const movie = {
        vote_count: 400,
        vote_average: 6.0,
        popularity: 10
      };

      // HORROR has lower thresholds
      expect(engine.passesQualityThreshold(movie, 'HORROR')).toBe(true);

      // DOCUMENTARY has higher thresholds
      expect(engine.passesQualityThreshold(movie, 'DOCUMENTARY')).toBe(false);
    });
  });

  describe('calculateBaseScore', () => {
    it('should calculate score with all components', () => {
      const movie = {
        popularity: 100,
        vote_average: 8.0,
        vote_count: 1000
      };

      const score = engine.calculateBaseScore(movie);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher scores to better movies', () => {
      const goodMovie = {
        popularity: 100,
        vote_average: 9.0,
        vote_count: 10000
      };

      const okMovie = {
        popularity: 50,
        vote_average: 6.0,
        vote_count: 500
      };

      const goodScore = engine.calculateBaseScore(goodMovie);
      const okScore = engine.calculateBaseScore(okMovie);

      expect(goodScore).toBeGreaterThan(okScore);
    });

    it('should handle edge cases gracefully', () => {
      const zeroMovie = {
        popularity: 0,
        vote_average: 0,
        vote_count: 0
      };

      const score = engine.calculateBaseScore(zeroMovie);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyStrategyModifier', () => {
    it('should apply modifiers based on strategy', () => {
      const movie = {
        popularity: 100,
        vote_average: 8.0,
        vote_count: 5000,
        release_date: '2024-01-01'
      };

      const baseScore = 50;
      const modifiedScore = engine.applyStrategyModifier(baseScore, movie);

      expect(typeof modifiedScore).toBe('number');
      expect(modifiedScore).toBeGreaterThan(0);
    });

    it('should handle movies without release dates', () => {
      const movie = {
        popularity: 100,
        vote_average: 8.0,
        vote_count: 5000
      };

      const baseScore = 50;
      const modifiedScore = engine.applyStrategyModifier(baseScore, movie);

      expect(typeof modifiedScore).toBe('number');
      expect(modifiedScore).toBeGreaterThan(0);
    });
  });

  describe('applyGenrePersonality', () => {
    it('should apply personality modifiers', () => {
      const movie = {
        popularity: 100,
        vote_average: 8.0,
        vote_count: 5000,
        release_date: '2023-01-01'
      };

      const baseScore = 50;
      const modifiedScore = engine.applyGenrePersonality(baseScore, movie, 'ACTION');

      expect(typeof modifiedScore).toBe('number');
      expect(modifiedScore).toBeGreaterThan(0);
    });

    it('should handle genres without personalities', () => {
      const movie = {
        popularity: 100,
        vote_average: 8.0,
        vote_count: 5000,
        release_date: '2023-01-01'
      };

      const baseScore = 50;
      const modifiedScore = engine.applyGenrePersonality(baseScore, movie, 'NONEXISTENT');

      expect(modifiedScore).toBe(baseScore);
    });
  });

  describe('applyControlledRandom', () => {
    it('should return consistent results for same inputs', () => {
      const movie = { id: 123 };
      const score1 = engine.applyControlledRandom(50, movie, 'ACTION');
      const score2 = engine.applyControlledRandom(50, movie, 'ACTION');

      expect(score1).toBe(score2);
    });

    it('should return different results for different movies', () => {
      const movie1 = { id: 123 };
      const movie2 = { id: 456 };

      const score1 = engine.applyControlledRandom(50, movie1, 'ACTION');
      const score2 = engine.applyControlledRandom(50, movie2, 'ACTION');

      expect(score1).not.toBe(score2);
    });

    it('should apply a small boost (max 15%)', () => {
      const movie = { id: 123 };
      const baseScore = 50;
      const modifiedScore = engine.applyControlledRandom(baseScore, movie, 'ACTION');

      expect(modifiedScore).toBeGreaterThanOrEqual(baseScore);
      expect(modifiedScore).toBeLessThanOrEqual(baseScore * 1.15);
    });
  });

  describe('hashCode', () => {
    it('should return consistent hash for same string', () => {
      const hash1 = engine.hashCode('test');
      const hash2 = engine.hashCode('test');

      expect(hash1).toBe(hash2);
    });

    it('should return different hashes for different strings', () => {
      const hash1 = engine.hashCode('test1');
      const hash2 = engine.hashCode('test2');

      expect(hash1).not.toBe(hash2);
    });

    it('should return a number', () => {
      const hash = engine.hashCode('test');
      expect(typeof hash).toBe('number');
    });
  });

  describe('applyHistoricalPenalty', () => {
    it('should apply penalty to recent movies', () => {
      const movie = { id: 123 };
      const recentIds = [123, 456, 789];

      const score = engine.applyHistoricalPenalty(100, movie, recentIds);
      expect(score).toBe(70); // 30% penalty
    });

    it('should not apply penalty to non-recent movies', () => {
      const movie = { id: 999 };
      const recentIds = [123, 456, 789];

      const score = engine.applyHistoricalPenalty(100, movie, recentIds);
      expect(score).toBe(100);
    });

    it('should handle empty recent list', () => {
      const movie = { id: 123 };
      const score = engine.applyHistoricalPenalty(100, movie, []);
      expect(score).toBe(100);
    });
  });

  describe('calculateScore', () => {
    it('should return -1 for movies failing quality threshold', () => {
      const badMovie = {
        vote_count: 10,
        vote_average: 3.0,
        popularity: 1
      };

      const score = engine.calculateScore(badMovie, 'ACTION', []);
      expect(score).toBe(-1);
    });

    it('should return positive score for good movies', () => {
      const goodMovie = {
        vote_count: 5000,
        vote_average: 8.0,
        popularity: 100,
        release_date: '2023-01-01'
      };

      const score = engine.calculateScore(goodMovie, 'ACTION', []);
      expect(score).toBeGreaterThan(0);
    });

    it('should apply all modifiers in sequence', () => {
      const movie = {
        id: 123,
        vote_count: 5000,
        vote_average: 8.0,
        popularity: 100,
        release_date: '2023-01-01'
      };

      const score = engine.calculateScore(movie, 'ACTION', [123]);

      // Should have base score + modifiers + penalty
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('rankMovies', () => {
    it('should rank movies by score descending', () => {
      const movies = [
        {
          id: 1,
          vote_count: 1000,
          vote_average: 7.0,
          popularity: 50,
          release_date: '2023-01-01'
        },
        {
          id: 2,
          vote_count: 5000,
          vote_average: 9.0,
          popularity: 150,
          release_date: '2023-06-01'
        },
        {
          id: 3,
          vote_count: 2000,
          vote_average: 6.5,
          popularity: 75,
          release_date: '2023-03-01'
        }
      ];

      const ranked = engine.rankMovies(movies, 'ACTION', []);

      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked.length).toBeLessThanOrEqual(movies.length);

      // Verify order is descending
      for (let i = 0; i < ranked.length - 1; i++) {
        const score1 = engine.calculateScore(ranked[i], 'ACTION', []);
        const score2 = engine.calculateScore(ranked[i + 1], 'ACTION', []);
        expect(score1).toBeGreaterThanOrEqual(score2);
      }
    });

    it('should exclude movies below quality threshold', () => {
      const movies = [
        {
          id: 1,
          vote_count: 10, // Too low
          vote_average: 7.0,
          popularity: 50
        },
        {
          id: 2,
          vote_count: 5000,
          vote_average: 9.0,
          popularity: 150
        }
      ];

      const ranked = engine.rankMovies(movies, 'ACTION', []);

      expect(ranked.length).toBe(1);
      expect(ranked[0].id).toBe(2);
    });
  });

  describe('getStrategyName', () => {
    it('should return a valid strategy name', () => {
      const name = engine.getStrategyName();

      const validStrategies = [
        'RISING_STARS',
        'CRITICAL_DARLINGS',
        'HIDDEN_GEMS',
        'BLOCKBUSTERS',
        'FRESH_RELEASES',
        'TIMELESS_CLASSICS',
        'AUDIENCE_FAVORITES'
      ];

      expect(validStrategies).toContain(name);
    });
  });

  describe('getDebugInfo', () => {
    it('should return complete debug information', () => {
      const info = engine.getDebugInfo();

      expect(info).toHaveProperty('date');
      expect(info).toHaveProperty('dayOfWeek');
      expect(info).toHaveProperty('weekOfMonth');
      expect(info).toHaveProperty('month');
      expect(info).toHaveProperty('strategy');
      expect(info).toHaveProperty('pages');
      expect(info).toHaveProperty('sortParam');

      expect(info.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(info.dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(info.dayOfWeek).toBeLessThan(7);
      expect(Array.isArray(info.pages)).toBe(true);
    });
  });
});
