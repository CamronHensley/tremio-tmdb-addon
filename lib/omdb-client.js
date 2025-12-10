/**
 * OMDb API Client
 *
 * Fetches IMDb ratings and vote counts for better all-time popularity sorting.
 * Uses IMDb IDs from TMDB's external_ids to query OMDb API.
 *
 * API: http://www.omdbapi.com/
 * Requires API key (subscription via AWS Marketplace)
 */

const fetch = require('node-fetch');

class OMDbClient {
  constructor(apiKey, persistentCache = null) {
    this.apiKey = apiKey;
    this.baseUrl = 'http://www.omdbapi.com';
    this.requestCount = 0;
    this.cache = new Map();
    this.persistentCache = persistentCache; // Map loaded from Netlify Blobs
    this.newRatings = new Map(); // Track new ratings fetched in this run
  }

  /**
   * Fetch IMDb rating data for a single movie
   * @param {string} imdbId - IMDb ID (e.g., "tt0111161")
   * @returns {Promise<Object|null>} Rating data or null if not found
   */
  async getMovieRating(imdbId) {
    if (!imdbId || !imdbId.startsWith('tt')) {
      return null;
    }

    // Check in-memory cache first
    if (this.cache.has(imdbId)) {
      return this.cache.get(imdbId);
    }

    // Check persistent cache (from Netlify Blobs)
    if (this.persistentCache && this.persistentCache.has(imdbId)) {
      const cachedData = this.persistentCache.get(imdbId);
      this.cache.set(imdbId, cachedData);
      return cachedData;
    }

    try {
      const url = `${this.baseUrl}/?apikey=${this.apiKey}&i=${imdbId}`;
      this.requestCount++;

      const response = await fetch(url);
      const data = await response.json();

      // Check for rate limit error
      if (data.Error && data.Error.includes('Request limit reached')) {
        console.warn(`⚠️  OMDb daily limit reached (1000 requests/day). Stopping further requests.`);
        console.warn(`   Progress: ${this.newRatings.size} ratings fetched. Remaining will be cached on next run.`);
        throw new Error('OMDB_RATE_LIMIT');
      }

      if (data.Response === 'False' || !data.imdbRating || data.imdbRating === 'N/A') {
        this.cache.set(imdbId, null);
        return null;
      }

      const ratingData = {
        imdbId: data.imdbID,
        rating: parseFloat(data.imdbRating),
        votes: parseInt(data.imdbVotes.replace(/,/g, ''), 10),
        metascore: data.Metascore !== 'N/A' ? parseInt(data.Metascore, 10) : null,
        fetchedAt: new Date().toISOString()
      };

      this.cache.set(imdbId, ratingData);
      this.newRatings.set(imdbId, ratingData); // Track as newly fetched
      return ratingData;

    } catch (error) {
      // Re-throw rate limit errors to stop batch processing
      if (error.message === 'OMDB_RATE_LIMIT') {
        throw error;
      }
      console.error(`OMDb API error for ${imdbId}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch IMDb ratings for multiple movies (batched with rate limiting)
   * @param {Array<string>} imdbIds - Array of IMDb IDs
   * @returns {Promise<Map<string, Object>>} Map of IMDb ID -> rating data
   */
  async getMovieRatingsBatch(imdbIds) {
    const results = new Map();

    console.log(`  → Fetching IMDb ratings for ${imdbIds.length} movies...`);

    for (let i = 0; i < imdbIds.length; i++) {
      const imdbId = imdbIds[i];

      if (!imdbId) continue;

      try {
        const ratingData = await this.getMovieRating(imdbId);

        if (ratingData) {
          results.set(imdbId, ratingData);
        }
      } catch (error) {
        // Stop on rate limit but save what we have
        if (error.message === 'OMDB_RATE_LIMIT') {
          console.log(`    → Stopped at ${i + 1}/${imdbIds.length} due to rate limit`);
          console.log(`    → Successfully fetched ${results.size} ratings. Remaining will be fetched on next run.`);
          break;
        }
        // Continue on other errors
      }

      // Rate limiting: 100ms delay between requests (600 req/min max)
      if (i < imdbIds.length - 1) {
        await OMDbClient.rateLimit();
      }

      // Progress indicator every 100 movies
      if ((i + 1) % 100 === 0) {
        console.log(`    → Progress: ${i + 1}/${imdbIds.length} movies (${results.size} with ratings)`);
      }
    }

    return results;
  }

  /**
   * Calculate weighted popularity score for sorting
   * Uses IMDb rating and vote count with logarithmic scaling
   *
   * Formula: rating * log10(votes)
   *
   * Examples:
   * - High rating + many votes (8.5 * log10(2,000,000)) = 54.1 (The Shawshank Redemption)
   * - Medium rating + many votes (7.0 * log10(1,000,000)) = 42.0 (Popular blockbuster)
   * - High rating + few votes (9.0 * log10(10,000)) = 36.0 (Cult classic)
   *
   * @param {number} rating - IMDb rating (0-10)
   * @param {number} votes - IMDb vote count
   * @returns {number} Weighted score
   */
  static calculateWeightedScore(rating, votes) {
    if (!rating || !votes || votes < 100) {
      return 0;
    }

    return rating * Math.log10(votes);
  }

  /**
   * Rate limiting helper (100ms delay)
   */
  static rateLimit() {
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Get total request count
   */
  getRequestCount() {
    return this.requestCount;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get newly fetched ratings (to save to persistent storage)
   * @returns {Map<string, Object>} Map of IMDb ID -> rating data
   */
  getNewRatings() {
    return this.newRatings;
  }

  /**
   * Load persistent cache from Netlify Blobs data
   * @param {Object} blobData - Object with IMDb IDs as keys
   * @returns {Map<string, Object>} Map of IMDb ID -> rating data
   */
  static loadPersistentCache(blobData) {
    const cache = new Map();

    if (!blobData) {
      return cache;
    }

    // Convert object to Map
    for (const [imdbId, ratingData] of Object.entries(blobData)) {
      cache.set(imdbId, ratingData);
    }

    return cache;
  }

  /**
   * Merge new ratings into existing persistent cache
   * @param {Map<string, Object>} existingCache - Existing cache from Blobs
   * @param {Map<string, Object>} newRatings - New ratings to merge
   * @returns {Object} Merged cache as plain object for JSON storage
   */
  static mergeCaches(existingCache, newRatings) {
    const merged = new Map(existingCache);

    // Add/update with new ratings
    for (const [imdbId, ratingData] of newRatings.entries()) {
      merged.set(imdbId, ratingData);
    }

    // Convert Map to plain object for JSON storage
    const result = {};
    for (const [imdbId, ratingData] of merged.entries()) {
      result[imdbId] = ratingData;
    }

    return result;
  }
}

module.exports = OMDbClient;
