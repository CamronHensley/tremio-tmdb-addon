/**
 * AI Classification Cache Manager
 * Caches AI genre classifications to avoid re-classifying the same movies every day
 * Reduces 3-hour AI processing to ~5 minutes for incremental updates
 */

const { getStore } = require('@netlify/blobs');

class AICache {
  constructor(options = {}) {
    this.version = options.version || 3;
    this.cache = { version: this.version, updated: null, classifications: {} };
    this.store = options.store || (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_ACCESS_TOKEN ?
      getStore({ name: 'tmdb-catalog', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_ACCESS_TOKEN }) :
      null);
    this.cacheKey = options.cacheKey || 'ai-classification-cache';
    this.dirty = false; // Track if cache needs saving
  }

  /**
   * Load cache from Netlify Blobs
   */
  async load() {
    if (!this.store) {
      console.log('  ⚠️  No Netlify credentials, cache disabled');
      return;
    }

    try {
      const cached = await this.store.get(this.cacheKey, { type: 'json' });
      if (cached && cached.version === this.version) {
        this.cache = cached;
        console.log(`  ✓ Loaded AI cache: ${Object.keys(cached.classifications || {}).length} movies (v${this.version})`);
      } else if (cached) {
        console.log(`  ⚠️  Cache version mismatch (v${cached.version} → v${this.version}), starting fresh`);
      } else {
        console.log('  ✓ No cache found, starting fresh');
      }
    } catch (error) {
      console.log('  ✓ No cache found, starting fresh');
    }
  }

  /**
   * Get cached classification for a movie
   * @param {number} tmdbId - TMDB movie ID
   * @returns {Object|null} - Cached classification or null
   */
  get(tmdbId) {
    const cached = this.cache.classifications[tmdbId];
    if (!cached) return null;

    // Check if classification version matches current version
    if (cached.classificationVersion !== this.version) {
      return null; // Force re-classification
    }

    return cached;
  }

  /**
   * Set classification for a movie
   * @param {number} tmdbId - TMDB movie ID
   * @param {string} title - Movie title
   * @param {string} genre - Genre code
   * @param {number} confidence - Confidence score (0-1)
   */
  set(tmdbId, title, genre, confidence) {
    this.cache.classifications[tmdbId] = {
      tmdbId,
      title,
      genre,
      confidence,
      classificationVersion: this.version,
      timestamp: new Date().toISOString()
    };
    this.dirty = true;
  }

  /**
   * Save cache to Netlify Blobs
   */
  async save() {
    if (!this.store) {
      return;
    }

    if (!this.dirty) {
      console.log('  ✓ Cache unchanged, skipping save');
      return;
    }

    this.cache.updated = new Date().toISOString();
    await this.store.setJSON(this.cacheKey, this.cache);
    console.log(`  ✓ Saved AI cache: ${Object.keys(this.cache.classifications).length} movies (v${this.version})`);
    this.dirty = false;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      version: this.version,
      totalMovies: Object.keys(this.cache.classifications).length,
      lastUpdated: this.cache.updated
    };
  }

  /**
   * Clear all cached classifications (force re-classification)
   */
  clear() {
    this.cache.classifications = {};
    this.dirty = true;
    console.log('  ✓ Cache cleared');
  }
}

module.exports = AICache;
