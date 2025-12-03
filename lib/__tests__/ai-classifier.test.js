/**
 * Tests for AI-powered genre classification
 */

const AIClassifier = require('../ai-classifier');
const { GENRES } = require('../constants');

// Mock axios for testing
jest.mock('axios');
const axios = require('axios');

describe('AIClassifier', () => {
  let classifier;

  beforeEach(() => {
    jest.clearAllMocks();
    classifier = new AIClassifier({
      enabled: true,
      endpoint: 'http://localhost:11434/api/generate',
      model: 'qwen2.5:7b-instruct',
      timeout: 5000
    });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const defaultClassifier = new AIClassifier();
      expect(defaultClassifier.endpoint).toBe('http://127.0.0.1:11434/api/generate');
      expect(defaultClassifier.model).toBe('qwen2.5:7b-instruct');
      expect(defaultClassifier.timeout).toBe(30000);
      expect(defaultClassifier.confidenceThreshold).toBe(0.7);
    });

    it('should respect environment variables', () => {
      process.env.AI_ENABLED = 'true';
      process.env.AI_ENDPOINT = 'http://custom:8080/api';
      process.env.AI_MODEL = 'custom-model';
      process.env.AI_CONFIDENCE_THRESHOLD = '0.85';

      const envClassifier = new AIClassifier();
      expect(envClassifier.enabled).toBe(true);
      expect(envClassifier.endpoint).toBe('http://custom:8080/api');
      expect(envClassifier.model).toBe('custom-model');
      expect(envClassifier.confidenceThreshold).toBe(0.85);

      // Cleanup
      delete process.env.AI_ENABLED;
      delete process.env.AI_ENDPOINT;
      delete process.env.AI_MODEL;
      delete process.env.AI_CONFIDENCE_THRESHOLD;
    });

    it('should initialize statistics', () => {
      expect(classifier.stats).toEqual({
        total: 0,
        successful: 0,
        failed: 0,
        fallbacks: 0,
        avgConfidence: 0,
        totalConfidence: 0
      });
    });
  });

  describe('isAvailable', () => {
    it('should return false if disabled', async () => {
      classifier.enabled = false;
      const available = await classifier.isAvailable();
      expect(available).toBe(false);
    });

    it('should return true if server responds', async () => {
      axios.get.mockResolvedValue({ status: 200 });
      const available = await classifier.isAvailable();
      expect(available).toBe(true);
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        { timeout: 5000 }
      );
    });

    it('should return false if server is down', async () => {
      axios.get.mockRejectedValue(new Error('ECONNREFUSED'));
      const available = await classifier.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('buildPrompt', () => {
    it('should build prompt with movie information', () => {
      const movie = {
        title: 'The Matrix',
        release_date: '1999-03-31',
        overview: 'A hacker discovers reality is a simulation.',
        genres: [{ name: 'Science Fiction' }, { name: 'Action' }],
        keywords: [
          { name: 'artificial intelligence' },
          { name: 'virtual reality' },
          { name: 'dystopia' }
        ],
        vote_average: 8.7,
        popularity: 95.5
      };

      const prompt = classifier.buildPrompt(movie);

      expect(prompt).toContain('The Matrix');
      expect(prompt).toContain('1999');
      expect(prompt).toContain('A hacker discovers reality is a simulation');
      expect(prompt).toContain('Science Fiction, Action');
      expect(prompt).toContain('artificial intelligence, virtual reality, dystopia');
      expect(prompt).toContain('8.7/10');
      expect(prompt).toContain('95.5');
      expect(prompt).toContain('Available Genres:');
      expect(prompt).toContain('SCIFI');
      expect(prompt).toContain('Classification Rules:');
    });

    it('should handle missing overview', () => {
      const movie = {
        title: 'Test Movie',
        release_date: '2020-01-01'
      };

      const prompt = classifier.buildPrompt(movie);
      expect(prompt).toContain('No overview available');
    });

    it('should handle missing release date', () => {
      const movie = {
        title: 'Test Movie',
        overview: 'A test movie.'
      };

      const prompt = classifier.buildPrompt(movie);
      expect(prompt).toContain('Unknown');
    });

    it('should include all 22 genres in prompt', () => {
      const movie = { title: 'Test', overview: 'Test' };
      const prompt = classifier.buildPrompt(movie);

      const genreCodes = Object.keys(GENRES);
      expect(genreCodes).toHaveLength(22);

      genreCodes.forEach(code => {
        expect(prompt).toContain(code);
      });
    });
  });

  describe('parseResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        genre: 'SCIFI',
        confidence: 0.95,
        reasoning: 'Features virtual reality and AI themes'
      });

      const result = classifier.parseResponse(response);

      expect(result).toEqual({
        genre: 'SCIFI',
        confidence: 0.95,
        reasoning: 'Features virtual reality and AI themes',
        rawResponse: response
      });
    });

    it('should handle response with extra text', () => {
      const response = `Here is the classification:
{
  "genre": "ACTION",
  "confidence": 0.88,
  "reasoning": "High-octane stunts and explosions"
}
That's my analysis.`;

      const result = classifier.parseResponse(response);

      expect(result).toBeTruthy();
      expect(result.genre).toBe('ACTION');
      expect(result.confidence).toBe(0.88);
    });

    it('should return null for invalid genre code', () => {
      const response = JSON.stringify({
        genre: 'INVALID_GENRE',
        confidence: 0.9,
        reasoning: 'Test'
      });

      const result = classifier.parseResponse(response);
      expect(result).toBeNull();
    });

    it('should return null for invalid confidence', () => {
      const response = JSON.stringify({
        genre: 'ACTION',
        confidence: 1.5, // > 1.0
        reasoning: 'Test'
      });

      const result = classifier.parseResponse(response);
      expect(result).toBeNull();
    });

    it('should return null for negative confidence', () => {
      const response = JSON.stringify({
        genre: 'ACTION',
        confidence: -0.5,
        reasoning: 'Test'
      });

      const result = classifier.parseResponse(response);
      expect(result).toBeNull();
    });

    it('should return null for malformed JSON', () => {
      const response = 'Not valid JSON at all';
      const result = classifier.parseResponse(response);
      expect(result).toBeNull();
    });

    it('should handle missing reasoning field', () => {
      const response = JSON.stringify({
        genre: 'HORROR',
        confidence: 0.85
      });

      const result = classifier.parseResponse(response);

      expect(result).toBeTruthy();
      expect(result.genre).toBe('HORROR');
      expect(result.reasoning).toBe('');
    });
  });

  describe('classifyMovie', () => {
    const mockMovie = {
      title: 'Inception',
      release_date: '2010-07-16',
      overview: 'A thief who enters dreams to steal secrets.',
      genres: [{ name: 'Science Fiction' }, { name: 'Thriller' }],
      vote_average: 8.8
    };

    it('should return null if disabled', async () => {
      classifier.enabled = false;
      const result = await classifier.classifyMovie(mockMovie);
      expect(result).toBeNull();
    });

    it('should classify movie successfully', async () => {
      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'SCIFI',
            confidence: 0.92,
            reasoning: 'Dream manipulation and complex sci-fi concepts'
          })
        }
      });

      const result = await classifier.classifyMovie(mockMovie);

      expect(result).toBeTruthy();
      expect(result.genre).toBe('SCIFI');
      expect(result.confidence).toBe(0.92);
      expect(classifier.stats.successful).toBe(1);
      expect(classifier.stats.total).toBe(1);
    });

    it('should return null for low confidence', async () => {
      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'THRILLER',
            confidence: 0.65, // Below default 0.7 threshold
            reasoning: 'Could be thriller or sci-fi'
          })
        }
      });

      const result = await classifier.classifyMovie(mockMovie);

      expect(result).toBeNull();
      expect(classifier.stats.fallbacks).toBe(1);
      expect(classifier.stats.total).toBe(1);
    });

    it('should handle connection refused error', async () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      axios.post.mockRejectedValue(error);

      const result = await classifier.classifyMovie(mockMovie);

      expect(result).toBeNull();
      expect(classifier.stats.failed).toBe(1);
    });

    it('should handle timeout error', async () => {
      const error = new Error('Timeout');
      error.code = 'ETIMEDOUT';
      axios.post.mockRejectedValue(error);

      const result = await classifier.classifyMovie(mockMovie);

      expect(result).toBeNull();
      expect(classifier.stats.failed).toBe(1);
    });

    it('should send correct request to Ollama', async () => {
      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'SCIFI',
            confidence: 0.9,
            reasoning: 'Test'
          })
        }
      });

      await classifier.classifyMovie(mockMovie);

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          model: 'qwen2.5:7b-instruct',
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
            num_predict: 200
          }
        }),
        expect.objectContaining({
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should update average confidence correctly', async () => {
      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'ACTION',
            confidence: 0.8,
            reasoning: 'Test'
          })
        }
      });

      await classifier.classifyMovie(mockMovie);

      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'HORROR',
            confidence: 0.9,
            reasoning: 'Test'
          })
        }
      });

      await classifier.classifyMovie(mockMovie);

      expect(classifier.stats.avgConfidence).toBe(0.85); // (0.8 + 0.9) / 2
    });
  });

  describe('classifyBatch', () => {
    const mockMovies = [
      { id: 1, title: 'Movie 1', overview: 'Test 1' },
      { id: 2, title: 'Movie 2', overview: 'Test 2' },
      { id: 3, title: 'Movie 3', overview: 'Test 3' }
    ];

    it('should classify multiple movies', async () => {
      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'ACTION',
            confidence: 0.85,
            reasoning: 'Test'
          })
        }
      });

      const results = await classifier.classifyBatch(mockMovies, 10, 1);

      expect(results).toHaveLength(3);
      expect(axios.post).toHaveBeenCalledTimes(3);
      expect(classifier.stats.total).toBe(3);
    });

    it('should respect rate limiting delay', async () => {
      jest.useFakeTimers();

      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'DRAMA',
            confidence: 0.8,
            reasoning: 'Test'
          })
        }
      });

      const batchPromise = classifier.classifyBatch(mockMovies, 100, 1);

      // Fast-forward through delays
      await jest.runAllTimersAsync();

      const results = await batchPromise;
      expect(results).toHaveLength(3);

      jest.useRealTimers();
    });

    it('should handle concurrent batches', async () => {
      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'COMEDY',
            confidence: 0.75,
            reasoning: 'Test'
          })
        }
      });

      const results = await classifier.classifyBatch(mockMovies, 0, 3); // Process all at once

      expect(results).toHaveLength(3);
      expect(axios.post).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure', async () => {
      axios.post
        .mockResolvedValueOnce({
          data: {
            response: JSON.stringify({
              genre: 'ACTION',
              confidence: 0.9,
              reasoning: 'Success'
            })
          }
        })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          data: {
            response: JSON.stringify({
              genre: 'HORROR',
              confidence: 0.85,
              reasoning: 'Success'
            })
          }
        });

      const results = await classifier.classifyBatch(mockMovies, 0, 1);

      expect(results[0]).toBeTruthy();
      expect(results[0].genre).toBe('ACTION');
      expect(results[1]).toBeNull();
      expect(results[2]).toBeTruthy();
      expect(results[2].genre).toBe('HORROR');
    });
  });

  describe('getStats', () => {
    it('should return formatted statistics', () => {
      classifier.stats = {
        total: 100,
        successful: 80,
        failed: 10,
        fallbacks: 10,
        avgConfidence: 0.85,
        totalConfidence: 68
      };

      const stats = classifier.getStats();

      expect(stats.total).toBe(100);
      expect(stats.successful).toBe(80);
      expect(stats.failed).toBe(10);
      expect(stats.fallbacks).toBe(10);
      expect(stats.successRate).toBe('80.0%');
      expect(stats.fallbackRate).toBe('10.0%');
    });

    it('should handle zero total', () => {
      const stats = classifier.getStats();

      expect(stats.successRate).toBe('0%');
      expect(stats.fallbackRate).toBe('0%');
    });
  });

  describe('resetStats', () => {
    it('should reset all statistics', () => {
      classifier.stats = {
        total: 100,
        successful: 80,
        failed: 10,
        fallbacks: 10,
        avgConfidence: 0.85,
        totalConfidence: 68
      };

      classifier.resetStats();

      expect(classifier.stats).toEqual({
        total: 0,
        successful: 0,
        failed: 0,
        fallbacks: 0,
        avgConfidence: 0,
        totalConfidence: 0
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle superhero movie classification', async () => {
      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'SUPERHEROES',
            confidence: 0.98,
            reasoning: 'Features Marvel Avengers characters'
          })
        }
      });

      const movie = {
        title: 'Avengers: Endgame',
        overview: 'The Avengers assemble one final time.',
        release_date: '2019-04-26'
      };

      const result = await classifier.classifyMovie(movie);

      expect(result.genre).toBe('SUPERHEROES');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should distinguish between animation types', async () => {
      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'ANIMATION_KIDS',
            confidence: 0.92,
            reasoning: 'Family-friendly Pixar film'
          })
        }
      });

      const movie = {
        title: 'Toy Story',
        overview: 'A boy\'s toys come to life.',
        release_date: '1995-11-22',
        genres: [{ name: 'Animation' }, { name: 'Family' }]
      };

      const result = await classifier.classifyMovie(movie);

      expect(result.genre).toBe('ANIMATION_KIDS');
    });

    it('should handle sci-fi vs fantasy ambiguity', async () => {
      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'FANTASY',
            confidence: 0.87,
            reasoning: 'Magic and mythical creatures dominate over technology'
          })
        }
      });

      const movie = {
        title: 'Star Wars',
        overview: 'A space fantasy epic with the Force.',
        release_date: '1977-05-25'
      };

      const result = await classifier.classifyMovie(movie);

      expect(['SCIFI', 'FANTASY']).toContain(result.genre);
    });

    it('should classify action movies by era', async () => {
      axios.post.mockResolvedValue({
        data: {
          response: JSON.stringify({
            genre: 'ACTION_CLASSIC',
            confidence: 0.89,
            reasoning: 'Released in 1988, classic 80s action film'
          })
        }
      });

      const movie = {
        title: 'Die Hard',
        overview: 'A cop fights terrorists in a building.',
        release_date: '1988-07-15'
      };

      const result = await classifier.classifyMovie(movie);

      expect(result.genre).toBe('ACTION_CLASSIC');
    });
  });
});
