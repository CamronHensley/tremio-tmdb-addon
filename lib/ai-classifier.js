/**
 * AI-Powered Movie Genre Classification
 *
 * Uses local LLM via Ollama to classify movies into genres
 * with higher accuracy than rule-based systems.
 *
 * Supports any Ollama-compatible model (Qwen, Llama, Mistral, etc.)
 *
 * Features:
 * - Contextual understanding of plot and themes
 * - Confidence scoring for classifications
 * - Fallback to rule-based on failure
 * - Batch processing with rate limiting
 * - Model-agnostic design (configurable via environment variables)
 */

const axios = require('axios');
const { GENRES } = require('./constants');
const AICache = require('./ai-cache');

class AIClassifier {
  constructor(options = {}) {
    // Ollama endpoint (default: localhost)
    this.endpoint = options.endpoint || process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434/api/generate';

    // Ollama model (any compatible model: llama3.2, qwen, mistral, etc.)
    // No default model - will fail gracefully if not specified
    this.model = options.model || process.env.OLLAMA_MODEL || null;

    this.timeout = options.timeout || 30000; // 30 seconds
    this.enabled = options.enabled !== false && (process.env.AI_ENABLED === 'true');
    this.confidenceThreshold = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.7');

    // AI Cache with version 2 (bumped for new genres)
    this.cache = new AICache({ version: 2 });
    this.cacheEnabled = options.cacheEnabled !== false;

    // Statistics
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      fallbacks: 0,
      cached: 0,
      avgConfidence: 0,
      totalConfidence: 0
    };
  }

  /**
   * Initialize classifier (load cache)
   */
  async initialize() {
    if (this.cacheEnabled) {
      await this.cache.load();
    }
  }

  /**
   * Save cache after processing
   */
  async finalize() {
    if (this.cacheEnabled) {
      await this.cache.save();
    }
  }

  /**
   * Check if AI classification is available
   */
  async isAvailable() {
    if (!this.enabled) {
      return false;
    }

    if (!this.model) {
      console.warn('AI classifier: OLLAMA_MODEL environment variable not set');
      return false;
    }

    try {
      const response = await axios.get(
        this.endpoint.replace('/api/generate', '/api/tags'),
        { timeout: 5000 }
      );
      return response.status === 200;
    } catch (error) {
      console.warn('AI classifier not available:', error.message);
      return false;
    }
  }

  /**
   * Build classification prompt with movie context
   */
  buildPrompt(movie) {
    const genresList = Object.keys(GENRES).map(code => {
      const genre = GENRES[code];
      return `- ${code}: ${genre.name}`;
    }).join('\n');

    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown';
    const keywords = movie.keywords ? movie.keywords.map(k => k.name).slice(0, 10).join(', ') : 'None';
    const tmdbGenres = movie.genres ? movie.genres.map(g => g.name).join(', ') : 'None';

    return `You are a movie genre classifier with expertise in cinema. Analyze this movie and determine the SINGLE most appropriate genre from the list below.

**Available Genres:**
${genresList}

**Movie Information:**
- Title: ${movie.title}
- Release Year: ${releaseYear}
- Overview: ${movie.overview || 'No overview available'}
- TMDB Genres: ${tmdbGenres}
- Keywords: ${keywords}
${movie.vote_average ? `- Rating: ${movie.vote_average}/10` : ''}
${movie.popularity ? `- Popularity: ${movie.popularity}` : ''}

**Classification Rules:**

1. **SUPERHEROES** - Use ONLY if the movie features superhero characters (Marvel, DC, etc.)
   - Examples: Avengers, Batman, Spider-Man, Iron Man
   - Takes priority over ANIMATION or ACTION

2. **ANIMATION_KIDS** - Animated films suitable for children
   - Family-friendly content
   - Examples: Pixar films, Disney princess movies, DreamWorks family films

3. **ANIMATION_ADULT** - Animated films for mature audiences
   - Serious themes, violence, or adult content
   - High critical acclaim
   - Examples: Waltz with Bashir, Persepolis, Heavy Metal

4. **MARTIAL_ARTS** - Martial arts focused films (kung fu, samurai, karate)
   - Prioritize martial arts theme over action
   - Examples: Enter the Dragon, Ip Man, Seven Samurai, The Raid

5. **CARS** - Car/racing focused films
   - Street racing, NASCAR, Formula 1
   - Examples: Fast & Furious series, Rush, Ford v Ferrari

6. **SPORTS** - Sports-focused films
   - Boxing, football, baseball, basketball, etc.
   - Examples: Rocky, Creed, Remember the Titans, Moneyball

7. **PARODY** - Parody/spoof movies
   - Satirical comedy that mocks other films/genres
   - Examples: Scary Movie, Airplane!, Naked Gun, Hot Shots

8. **DISASTER** - Natural disaster movies
   - Earthquakes, tornados, tsunamis, asteroids, etc.
   - Examples: Twister, The Day After Tomorrow, San Andreas, Deep Impact

9. **STAND_UP_COMEDY** - Stand-up comedy specials ONLY
   - NOT regular comedy movies
   - Examples: Dave Chappelle specials, Kevin Hart specials

10. **ACTION_CLASSIC** - Action films released BEFORE 2000
   - Golden era action films (1980s-1990s)
   - Examples: Die Hard, Terminator, Lethal Weapon

9. **ACTION** - Modern action films (2000 or later)
   - High-energy sequences, stunts, explosions
   - Examples: John Wick, Mad Max: Fury Road, Mission Impossible

10. **WAR** - Movies focused on military conflict
    - Takes priority over ACTION, DRAMA, or HISTORY
    - Examples: Saving Private Ryan, 1917, Apocalypse Now

11. **WESTERN** - Western films (cowboys, frontier, Old West)
    - Takes priority over ACTION, HISTORY, DRAMA
    - Examples: Tombstone, Unforgiven, True Grit

12. **HISTORY** - Historical events or period pieces
    - Takes priority over DRAMA
    - Examples: Schindler's List, The King's Speech, Lincoln

13. **HORROR** - Scary, suspenseful, supernatural
    - Takes priority over THRILLER for supernatural content
    - Examples: The Exorcist, Hereditary, Get Out

14. **SCIFI** - Science fiction, futuristic, space, technology
    - Strict separation from FANTASY
    - Examples: Blade Runner, Interstellar, The Matrix

15. **FANTASY** - Magic, mythical creatures, imaginary worlds
    - Strict separation from SCIFI
    - Examples: Lord of the Rings, Harry Potter, Pan's Labyrinth

16. **DOCUMENTARY** - Non-fiction, real events
    - Always use for documentaries regardless of subject
    - Examples: Planet Earth, Free Solo, March of the Penguins

17. **TVMOVIE** - Made-for-TV movies or TV specials
    - Always use for TV productions

18. **Other genres** (ADVENTURE, COMEDY, CRIME, DRAMA, FAMILY, MUSIC, MYSTERY, ROMANCE, THRILLER):
    - Use when the above specific rules don't apply
    - Choose based on primary theme and tone

**Important:**
- Choose ONLY ONE genre
- Consider the PRIMARY theme, not secondary elements
- When in doubt between two genres, pick the one that represents the core identity of the film
- Use high confidence (>0.9) for obvious cases
- Use medium confidence (0.7-0.9) for clear but not obvious cases
- Use low confidence (<0.7) for ambiguous cases

**Output Format:**
Respond ONLY with a JSON object:
{
  "genre": "GENRE_CODE",
  "confidence": 0.95,
  "reasoning": "Brief 1-sentence explanation"
}

Do not include any other text outside the JSON object.`;
  }

  /**
   * Parse AI response and extract classification
   */
  parseResponse(responseText) {
    try {
      // Find JSON in response (handle extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate genre code
      if (!GENRES[parsed.genre]) {
        throw new Error(`Invalid genre code: ${parsed.genre}`);
      }

      // Validate confidence
      const confidence = parseFloat(parsed.confidence);
      if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        throw new Error(`Invalid confidence: ${parsed.confidence}`);
      }

      return {
        genre: parsed.genre,
        confidence: confidence,
        reasoning: parsed.reasoning || '',
        rawResponse: responseText
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error.message);
      console.error('Response:', responseText);
      return null;
    }
  }

  /**
   * Classify a single movie using AI (with caching)
   */
  async classifyMovie(movie) {
    if (!this.enabled) {
      return null;
    }

    if (!this.model) {
      console.error('  ✗ AI classification failed: OLLAMA_MODEL environment variable not set');
      return null;
    }

    const tmdbId = movie.id;
    const title = movie.title;

    // Check cache first
    if (this.cacheEnabled) {
      const cached = this.cache.get(tmdbId);
      if (cached) {
        console.log(`  ✓ Cached: "${title}" → ${cached.genre} (${(cached.confidence * 100).toFixed(0)}%)`);
        this.stats.total++;
        this.stats.successful++;
        this.stats.cached++;
        this.stats.totalConfidence += cached.confidence;
        this.stats.avgConfidence = this.stats.totalConfidence / this.stats.successful;
        return { genre: cached.genre, confidence: cached.confidence };
      }
    }

    this.stats.total++;

    try {
      const prompt = this.buildPrompt(movie);

      const response = await axios.post(this.endpoint, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistent results
          top_p: 0.9,
          num_predict: 200 // Limit tokens for faster response
        }
      }, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' }
      });

      const result = this.parseResponse(response.data.response);

      if (result && result.confidence >= this.confidenceThreshold) {
        this.stats.successful++;
        this.stats.totalConfidence += result.confidence;
        this.stats.avgConfidence = this.stats.totalConfidence / this.stats.successful;

        // Cache the result
        if (this.cacheEnabled) {
          this.cache.set(tmdbId, title, result.genre, result.confidence);
        }

        console.log(`  ✓ AI: "${title}" → ${result.genre} (${(result.confidence * 100).toFixed(0)}%)`);
        return result;
      } else if (result) {
        // Low confidence - mark for fallback
        console.log(`  ⚠️  AI: "${title}" → ${result.genre} (${(result.confidence * 100).toFixed(0)}% - low confidence, will fallback)`);
        this.stats.fallbacks++;
        return null;
      } else {
        this.stats.failed++;
        return null;
      }
    } catch (error) {
      this.stats.failed++;

      if (error.code === 'ECONNREFUSED') {
        console.error('  ✗ AI server not running. Start with: ollama serve');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('  ✗ AI request timed out for:', movie.title);
      } else {
        console.error('  ✗ AI classification failed:', error.message);
      }

      return null;
    }
  }

  /**
   * Classify movies in batch with rate limiting
   */
  async classifyBatch(movies, delayMs = 100, maxConcurrent = 1) {
    const results = [];
    const batches = [];

    // Split into batches
    for (let i = 0; i < movies.length; i += maxConcurrent) {
      batches.push(movies.slice(i, i + maxConcurrent));
    }

    console.log(`  🤖 AI classifier: Processing ${movies.length} movies in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(movie => this.classifyMovie(movie))
      );

      results.push(...batchResults);

      // Progress update every 10 batches
      if ((i + 1) % 10 === 0) {
        console.log(`    Progress: ${i + 1}/${batches.length} batches (${(((i + 1) / batches.length) * 100).toFixed(1)}%)`);
      }

      // Delay between batches to avoid overwhelming the AI server
      if (delayMs > 0 && i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log(`  ✓ AI classification complete: ${this.stats.successful} successful, ${this.stats.failed} failed, ${this.stats.fallbacks} fallbacks`);

    return results;
  }

  /**
   * Get classification statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.total > 0 ? (this.stats.successful / this.stats.total * 100).toFixed(1) + '%' : '0%',
      fallbackRate: this.stats.total > 0 ? (this.stats.fallbacks / this.stats.total * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      fallbacks: 0,
      avgConfidence: 0,
      totalConfidence: 0
    };
  }
}

module.exports = AIClassifier;
