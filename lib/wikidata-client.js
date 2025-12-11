/**
 * Wikidata Client - SPARQL queries for streaming originals detection
 *
 * Uses Wikidata P449 (original broadcaster/network) property to accurately
 * identify movies that are streaming service originals (~95% accuracy)
 */

const fetch = require('node-fetch');

class WikidataClient {
  constructor(persistentCache = null) {
    this.endpoint = 'https://query.wikidata.org/sparql';
    this.userAgent = 'StremioTMDBAddon/1.0 (https://github.com/yourrepo; contact@example.com)';
    this.requestCount = 0;
    this.persistentCache = persistentCache; // Map loaded from Netlify Blobs
    this.newStreamingOriginals = new Map(); // Track new data fetched in this run
  }

  /**
   * Execute a SPARQL query against Wikidata
   */
  async query(sparql) {
    const url = `${this.endpoint}?query=${encodeURIComponent(sparql)}`;

    this.requestCount++;

    // Add 30 second timeout for SPARQL queries (can be slow)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/sparql-results+json',
          'User-Agent': this.userAgent
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Wikidata query failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.results.bindings;
    } catch (error) {
      clearTimeout(timeoutId);
      // Handle timeout/abort errors
      if (error.name === 'AbortError') {
        console.error(`Wikidata query timeout (30s limit exceeded)`);
        throw new Error('WIKIDATA_TIMEOUT');
      }
      throw error;
    }
  }

  /**
   * Query streaming originals for a batch of TMDB IDs
   * Returns map of TMDB ID -> streaming service code
   *
   * @param {number[]} tmdbIds - Array of TMDB movie IDs
   * @returns {Promise<Map<number, string>>} Map of TMDB ID to streaming service code
   */
  async getStreamingOriginalsBatch(tmdbIds) {
    if (!tmdbIds || tmdbIds.length === 0) {
      return new Map();
    }

    // Check persistent cache first and separate cached vs uncached IDs
    const results = new Map();
    const uncachedIds = [];

    for (const tmdbId of tmdbIds) {
      if (this.persistentCache && this.persistentCache.has(tmdbId)) {
        const serviceCode = this.persistentCache.get(tmdbId);
        if (serviceCode) {
          results.set(tmdbId, serviceCode);
        }
      } else {
        uncachedIds.push(tmdbId);
      }
    }

    // If all IDs were cached, return early
    if (uncachedIds.length === 0) {
      return results;
    }

    // Build VALUES clause for uncached TMDB IDs only
    const values = uncachedIds.map(id => `"${id}"`).join(' ');

    const sparql = `
SELECT ?tmdbId ?broadcaster WHERE {
  VALUES ?tmdbId { ${values} }

  # Find movies with this TMDB ID
  ?movie wdt:P4947 ?tmdbId .

  # Get original broadcaster/network (P449)
  ?movie wdt:P449 ?broadcaster .

  # Filter to only streaming services we care about
  VALUES ?broadcaster {
    wd:Q907311       # Netflix
    wd:Q54958752     # Disney+
    wd:Q16335061     # Amazon Prime Video
    wd:Q567867       # Hulu
    wd:Q63985127     # Apple TV+
    wd:Q30971861     # HBO Max
    wd:Q104839407    # Paramount+
    wd:Q60653127     # Peacock
    wd:Q115052825    # Max
  }
}
    `.trim();

    try {
      const queryResults = await this.query(sparql);

      // Map Wikidata IDs to our service codes
      const wikidataToService = {
        'Q907311': 'NETFLIX',
        'Q54958752': 'DISNEY_PLUS',
        'Q16335061': 'AMAZON_PRIME',
        'Q567867': 'HULU',
        'Q63985127': 'APPLE_TV_PLUS',
        'Q30971861': 'HBO_MAX',
        'Q104839407': 'PARAMOUNT_PLUS',
        'Q60653127': 'PEACOCK',
        'Q115052825': 'MAX'
      };

      for (const result of queryResults) {
        const tmdbId = parseInt(result.tmdbId.value, 10);
        const broadcasterUri = result.broadcaster.value;
        const wikidataId = broadcasterUri.split('/').pop();
        const serviceCode = wikidataToService[wikidataId];

        if (serviceCode) {
          // If multiple services, keep first one (most reliable)
          if (!results.has(tmdbId)) {
            results.set(tmdbId, serviceCode);
            this.newStreamingOriginals.set(tmdbId, serviceCode); // Track as newly fetched
          }
        }
      }

      // Cache null results for uncached IDs that weren't found
      for (const tmdbId of uncachedIds) {
        if (!results.has(tmdbId)) {
          this.newStreamingOriginals.set(tmdbId, null);
        }
      }

      return results;

    } catch (error) {
      console.error('Wikidata query error:', error.message);
      return new Map();
    }
  }

  /**
   * Add delay between requests to respect rate limits
   * Wikidata allows ~60 queries per minute
   */
  static async rateLimit() {
    return new Promise(resolve => setTimeout(resolve, 1000)); // 1 second = 60/minute
  }

  /**
   * Get total request count
   */
  getRequestCount() {
    return this.requestCount;
  }

  /**
   * Get newly fetched streaming originals (to save to persistent storage)
   * @returns {Map<number, string|null>} Map of TMDB ID -> service code
   */
  getNewStreamingOriginals() {
    return this.newStreamingOriginals;
  }

  /**
   * Load persistent cache from Netlify Blobs data
   * @param {Object} blobData - Object with TMDB IDs as keys
   * @returns {Map<number, string|null>} Map of TMDB ID -> service code
   */
  static loadPersistentCache(blobData) {
    const cache = new Map();

    if (!blobData) {
      return cache;
    }

    // Convert object to Map (keys are strings in JSON, convert to numbers)
    for (const [tmdbId, serviceCode] of Object.entries(blobData)) {
      cache.set(parseInt(tmdbId, 10), serviceCode);
    }

    return cache;
  }

  /**
   * Merge new streaming originals into existing persistent cache
   * @param {Map<number, string|null>} existingCache - Existing cache from Blobs
   * @param {Map<number, string|null>} newOriginals - New originals to merge
   * @returns {Object} Merged cache as plain object for JSON storage
   */
  static mergeCaches(existingCache, newOriginals) {
    const merged = new Map(existingCache);

    // Add/update with new streaming originals
    for (const [tmdbId, serviceCode] of newOriginals.entries()) {
      merged.set(tmdbId, serviceCode);
    }

    // Convert Map to plain object for JSON storage
    const result = {};
    for (const [tmdbId, serviceCode] of merged.entries()) {
      result[tmdbId] = serviceCode;
    }

    return result;
  }
}

module.exports = WikidataClient;
