/**
 * Fanart.tv API Client
 *
 * Fetches high-quality movie posters from Fanart.tv
 * Uses TMDB ID for lookups
 */

const fetch = require('node-fetch');

class FanartClient {
  constructor(apiKey, persistentCache = null) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://webservice.fanart.tv/v3/movies';
    this.requestCount = 0;
    this.persistentCache = persistentCache; // Map loaded from Netlify Blobs
    this.newPosters = new Map(); // Track new posters fetched in this run
  }

  /**
   * Get movie artwork by TMDB ID
   * Returns highest quality poster URL
   */
  async getMovieArtwork(tmdbId) {
    if (!this.apiKey) {
      return null;
    }

    // Check persistent cache (from Netlify Blobs)
    if (this.persistentCache && this.persistentCache.has(tmdbId)) {
      return this.persistentCache.get(tmdbId);
    }

    try {
      this.requestCount++;

      const url = `${this.baseUrl}/${tmdbId}?api_key=${this.apiKey}`;

      // Add 10 second timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          // Movie not found in Fanart.tv, not an error - cache the null result
          this.newPosters.set(tmdbId, null);
          return null;
        }
        throw new Error(`Fanart.tv API error: ${response.status}`);
      }

      const data = await response.json();

      // Get movie posters (prefer textless, then English)
      const posters = data.movieposter || [];

      if (posters.length === 0) {
        return null;
      }

      // Sort by likes (most popular first)
      const sortedPosters = posters.sort((a, b) => {
        const likesA = parseInt(a.likes || '0', 10);
        const likesB = parseInt(b.likes || '0', 10);
        return likesB - likesA;
      });

      // Priority: textless (universal) > English > fallback to most liked
      const textlessPoster = sortedPosters.find(p => p.lang === '00'); // '00' = no text
      const englishPoster = sortedPosters.find(p => p.lang === 'en');
      const bestPoster = textlessPoster || englishPoster || sortedPosters[0];

      const posterUrl = bestPoster.url;
      this.newPosters.set(tmdbId, posterUrl); // Track as newly fetched
      return posterUrl;

    } catch (error) {
      // Handle timeout/abort errors
      if (error.name === 'AbortError') {
        console.error(`Fanart.tv timeout for TMDB ID ${tmdbId} (10s limit exceeded)`);
        this.newPosters.set(tmdbId, null); // Cache timeout as null
        return null;
      }
      console.error(`Fanart.tv error for TMDB ID ${tmdbId}:`, error.message);
      this.newPosters.set(tmdbId, null); // Cache error as null
      return null;
    }
  }

  /**
   * Batch fetch movie artwork
   * Returns map of TMDB ID -> poster URL
   */
  async getMovieArtworkBatch(tmdbIds) {
    const results = new Map();

    for (const tmdbId of tmdbIds) {
      const posterUrl = await this.getMovieArtwork(tmdbId);
      if (posterUrl) {
        results.set(tmdbId, posterUrl);
      }

      // Rate limit: 10 requests per second (100ms delay) - faster for workflow completion
      await this.sleep(100);
    }

    return results;
  }

  /**
   * Sleep helper for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get total request count
   */
  getRequestCount() {
    return this.requestCount;
  }

  /**
   * Get newly fetched posters (to save to persistent storage)
   * @returns {Map<number, string|null>} Map of TMDB ID -> poster URL
   */
  getNewPosters() {
    return this.newPosters;
  }

  /**
   * Load persistent cache from Netlify Blobs data
   * @param {Object} blobData - Object with TMDB IDs as keys
   * @returns {Map<number, string|null>} Map of TMDB ID -> poster URL
   */
  static loadPersistentCache(blobData) {
    const cache = new Map();

    if (!blobData) {
      return cache;
    }

    // Convert object to Map (keys are strings in JSON, convert to numbers)
    for (const [tmdbId, posterUrl] of Object.entries(blobData)) {
      cache.set(parseInt(tmdbId, 10), posterUrl);
    }

    return cache;
  }

  /**
   * Merge new posters into existing persistent cache
   * @param {Map<number, string|null>} existingCache - Existing cache from Blobs
   * @param {Map<number, string|null>} newPosters - New posters to merge
   * @returns {Object} Merged cache as plain object for JSON storage
   */
  static mergeCaches(existingCache, newPosters) {
    const merged = new Map(existingCache);

    // Add/update with new posters
    for (const [tmdbId, posterUrl] of newPosters.entries()) {
      merged.set(tmdbId, posterUrl);
    }

    // Convert Map to plain object for JSON storage
    const result = {};
    for (const [tmdbId, posterUrl] of merged.entries()) {
      result[tmdbId] = posterUrl;
    }

    return result;
  }
}

module.exports = FanartClient;
