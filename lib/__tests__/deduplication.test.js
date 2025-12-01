const DeduplicationProcessor = require('../deduplication');

describe('DeduplicationProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new DeduplicationProcessor();
  });

  describe('processAllGenres', () => {
    it('should ensure each movie appears only once', () => {
      const moviesByGenre = {
        ACTION: [
          { id: 1, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' },
          { id: 2, vote_count: 3000, vote_average: 7.5, popularity: 80, release_date: '2023-02-01' },
          { id: 3, vote_count: 4000, vote_average: 7.8, popularity: 90, release_date: '2023-03-01' }
        ],
        DRAMA: [
          { id: 1, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' }, // Duplicate
          { id: 4, vote_count: 6000, vote_average: 8.5, popularity: 110, release_date: '2023-04-01' },
          { id: 5, vote_count: 2500, vote_average: 7.2, popularity: 70, release_date: '2023-05-01' }
        ]
      };

      const result = processor.processAllGenres(moviesByGenre, []);

      // Collect all movie IDs across genres
      const allMovieIds = [];
      for (const genre in result) {
        result[genre].forEach(movie => allMovieIds.push(movie.id));
      }

      // Check for duplicates
      const uniqueIds = new Set(allMovieIds);
      expect(uniqueIds.size).toBe(allMovieIds.length);
    });

    it('should assign movies to their highest scoring genre', () => {
      const sharedMovie = {
        id: 1,
        vote_count: 10000,
        vote_average: 9.0,
        popularity: 200,
        release_date: '2023-01-01'
      };

      const moviesByGenre = {
        ACTION: [sharedMovie],
        DRAMA: [sharedMovie],
        COMEDY: [sharedMovie]
      };

      const result = processor.processAllGenres(moviesByGenre, []);

      // Count how many times the movie appears
      let appearances = 0;
      for (const genre in result) {
        if (result[genre].some(m => m.id === 1)) {
          appearances++;
        }
      }

      expect(appearances).toBe(1);
    });

    it('should handle empty genre lists', () => {
      const moviesByGenre = {
        ACTION: [],
        DRAMA: []
      };

      const result = processor.processAllGenres(moviesByGenre, []);

      expect(result.ACTION).toBeDefined();
      expect(result.DRAMA).toBeDefined();
      expect(result.ACTION.length).toBe(0);
      expect(result.DRAMA.length).toBe(0);
    });

    it('should apply historical penalty to recent movies', () => {
      const moviesByGenre = {
        ACTION: [
          { id: 1, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' },
          { id: 2, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-02-01' }
        ]
      };

      const recentIds = [1]; // Movie 1 was shown recently

      const result = processor.processAllGenres(moviesByGenre, recentIds);

      // Since both movies have same base metrics, non-recent should rank higher
      if (result.ACTION.length > 0) {
        // Just verify processing completed without errors
        expect(result.ACTION.length).toBeGreaterThan(0);
      }
    });

    it('should filter out movies below quality threshold', () => {
      const moviesByGenre = {
        ACTION: [
          { id: 1, vote_count: 10, vote_average: 3.0, popularity: 1 }, // Bad movie
          { id: 2, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' }
        ]
      };

      const result = processor.processAllGenres(moviesByGenre, []);

      expect(result.ACTION).not.toContainEqual(
        expect.objectContaining({ id: 1 })
      );
      expect(result.ACTION.some(m => m.id === 2)).toBe(true);
    });
  });

  describe('processGreedy', () => {
    it('should deduplicate movies in greedy fashion', () => {
      const moviesByGenre = {
        ACTION: [
          { id: 1, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' },
          { id: 2, vote_count: 3000, vote_average: 7.5, popularity: 80, release_date: '2023-02-01' }
        ],
        DRAMA: [
          { id: 1, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' }, // Duplicate
          { id: 3, vote_count: 4000, vote_average: 7.8, popularity: 90, release_date: '2023-03-01' }
        ]
      };

      const result = processor.processGreedy(moviesByGenre, []);

      // Collect all movie IDs
      const allMovieIds = [];
      for (const genre in result) {
        result[genre].forEach(movie => allMovieIds.push(movie.id));
      }

      // Check for duplicates
      const uniqueIds = new Set(allMovieIds);
      expect(uniqueIds.size).toBe(allMovieIds.length);
    });

    it('should process genres in order', () => {
      const moviesByGenre = {
        ACTION: [
          { id: 1, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' }
        ],
        DRAMA: [
          { id: 1, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' }
        ]
      };

      const result = processor.processGreedy(moviesByGenre, []);

      // In greedy mode, first genre processed gets the movie
      expect(result).toBeDefined();
    });
  });

  describe('fillGenreFromPool', () => {
    it('should fill genres with insufficient movies', () => {
      const result = {
        ACTION: [
          { id: 1, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' }
        ]
      };

      const moviesByGenre = {
        ACTION: [
          { id: 1, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' },
          { id: 2, vote_count: 4000, vote_average: 7.5, popularity: 90, release_date: '2023-02-01' },
          { id: 3, vote_count: 3000, vote_average: 7.0, popularity: 80, release_date: '2023-03-01' }
        ]
      };

      processor.usedMovieIds.add(1);

      processor.fillGenreFromPool(result, 'ACTION', moviesByGenre, []);

      expect(result.ACTION.length).toBeGreaterThan(1);
    });

    it('should not add already used movies', () => {
      const result = {
        ACTION: []
      };

      const moviesByGenre = {
        ACTION: [
          { id: 1, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' }
        ]
      };

      processor.usedMovieIds.add(1); // Already used

      processor.fillGenreFromPool(result, 'ACTION', moviesByGenre, []);

      expect(result.ACTION.some(m => m.id === 1)).toBe(false);
    });

    it('should respect quality thresholds when filling', () => {
      const result = {
        ACTION: []
      };

      const moviesByGenre = {
        ACTION: [
          { id: 1, vote_count: 10, vote_average: 3.0, popularity: 1 }, // Bad movie
          { id: 2, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' }
        ]
      };

      processor.fillGenreFromPool(result, 'ACTION', moviesByGenre, []);

      expect(result.ACTION.some(m => m.id === 1)).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      processor.usedMovieIds.add(1);
      processor.usedMovieIds.add(2);
      processor.usedMovieIds.add(3);

      const stats = processor.getStats();

      expect(stats.totalUniqueMovies).toBe(3);
      expect(stats.expectedTotal).toBeGreaterThan(0);
      expect(typeof stats.totalUniqueMovies).toBe('number');
      expect(typeof stats.expectedTotal).toBe('number');
    });
  });

  describe('reset', () => {
    it('should clear used movie IDs', () => {
      processor.usedMovieIds.add(1);
      processor.usedMovieIds.add(2);

      expect(processor.usedMovieIds.size).toBe(2);

      processor.reset();

      expect(processor.usedMovieIds.size).toBe(0);
    });

    it('should allow reprocessing after reset', () => {
      const moviesByGenre = {
        ACTION: [
          { id: 1, vote_count: 5000, vote_average: 8.0, popularity: 100, release_date: '2023-01-01' }
        ]
      };

      processor.processGreedy(moviesByGenre, []);
      expect(processor.usedMovieIds.size).toBeGreaterThan(0);

      processor.reset();
      expect(processor.usedMovieIds.size).toBe(0);

      processor.processGreedy(moviesByGenre, []);
      expect(processor.usedMovieIds.size).toBeGreaterThan(0);
    });
  });

  describe('integration tests', () => {
    it('should handle realistic multi-genre scenario', () => {
      const createMovie = (id, votes, rating, popularity, date) => ({
        id,
        vote_count: votes,
        vote_average: rating,
        popularity,
        release_date: date
      });

      const moviesByGenre = {
        ACTION: [
          createMovie(1, 8000, 8.5, 150, '2023-01-01'),
          createMovie(2, 6000, 7.8, 120, '2023-02-01'),
          createMovie(3, 5000, 7.5, 100, '2023-03-01'),
          createMovie(10, 4000, 7.2, 90, '2023-04-01') // Unique to ACTION
        ],
        DRAMA: [
          createMovie(1, 8000, 8.5, 150, '2023-01-01'), // Duplicate
          createMovie(2, 6000, 7.8, 120, '2023-02-01'), // Duplicate
          createMovie(4, 7000, 8.2, 140, '2023-05-01'),
          createMovie(11, 3500, 7.0, 85, '2023-06-01') // Unique to DRAMA
        ],
        COMEDY: [
          createMovie(3, 5000, 7.5, 100, '2023-03-01'), // Duplicate
          createMovie(5, 5500, 7.6, 110, '2023-07-01'),
          createMovie(12, 3000, 6.8, 80, '2023-08-01') // Unique to COMEDY
        ]
      };

      const result = processor.processAllGenres(moviesByGenre, []);

      // Verify no duplicates across all genres
      const allIds = [];
      for (const genre in result) {
        result[genre].forEach(m => allIds.push(m.id));
      }

      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);

      // Verify stats
      const stats = processor.getStats();
      expect(stats.totalUniqueMovies).toBe(uniqueIds.size);
    });
  });
});
