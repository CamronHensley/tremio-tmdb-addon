/**
 * Cache manager for storing and retrieving catalog data
 * Uses Netlify Blobs for persistent storage
 */

const { getStore } = require('@netlify/blobs');
const { CACHE_CONFIG } = require('./constants');

class CacheManager {
  constructor(options = {}) {
    this.storeName = options.storeName || 'tmdb-catalog';
    this.store = null;
  }

  /**
   * Initialize the blob store
   * Must be called before other operations
   */
  async initialize() {
    try {
      this.store = getStore(this.storeName);
      return true;
    } catch (error) {
      console.error('Failed to initialize blob store:', error.message);
      return false;
    }
  }

  /**
   * Get the blob store instance (for direct access if needed)
   */
  getStore() {
    if (!this.store) {
      this.store = getStore(this.storeName);
    }
    return this.store;
  }

  /**
   * Store catalog data for all genres
   */
  async setCatalogData(catalogData) {
    const store = this.getStore();
    
    const metadata = {
      updatedAt: new Date().toISOString(),
      strategy: catalogData.strategy,
      genreCount: Object.keys(catalogData.genres).length,
      totalMovies: Object.values(catalogData.genres)
        .reduce((sum, movies) => sum + movies.length, 0)
    };

    // Store main catalog data
    await store.setJSON('catalog', {
      ...catalogData,
      metadata
    });

    // Store metadata separately for quick health checks
    await store.setJSON('metadata', metadata);

    return metadata;
  }

  /**
   * Get all catalog data
   */
  async getCatalogData() {
    const store = this.getStore();
    
    try {
      const data = await store.get('catalog', { type: 'json' });
      return data;
    } catch (error) {
      console.error('Failed to get catalog data:', error.message);
      return null;
    }
  }

  /**
   * Get movies for a specific genre
   */
  async getGenreCatalog(genreCode) {
    const catalogData = await this.getCatalogData();
    
    if (!catalogData || !catalogData.genres) {
      return null;
    }

    return catalogData.genres[genreCode] || null;
  }

  /**
   * Get cache metadata (for health checks)
   */
  async getMetadata() {
    const store = this.getStore();
    
    try {
      return await store.get('metadata', { type: 'json' });
    } catch (error) {
      console.error('Failed to get metadata:', error.message);
      return null;
    }
  }

  /**
   * Check if cache is fresh (less than 24 hours old)
   */
  async isCacheFresh() {
    const metadata = await this.getMetadata();
    
    if (!metadata || !metadata.updatedAt) {
      return false;
    }

    const updatedAt = new Date(metadata.updatedAt);
    const now = new Date();
    const ageMs = now - updatedAt;
    const ageHours = ageMs / (1000 * 60 * 60);

    return ageHours < 24;
  }

  /**
   * Get cache age in hours
   */
  async getCacheAge() {
    const metadata = await this.getMetadata();
    
    if (!metadata || !metadata.updatedAt) {
      return null;
    }

    const updatedAt = new Date(metadata.updatedAt);
    const now = new Date();
    const ageMs = now - updatedAt;
    
    return ageMs / (1000 * 60 * 60);
  }

  /**
   * Store movie details for meta requests
   */
  async setMovieDetails(movieId, details) {
    const store = this.getStore();
    await store.setJSON(`movie:${movieId}`, {
      data: details,
      cachedAt: new Date().toISOString()
    });
  }

  /**
   * Get movie details
   */
  async getMovieDetails(movieId) {
    const store = this.getStore();
    
    try {
      const cached = await store.get(`movie:${movieId}`, { type: 'json' });
      
      if (!cached) return null;

      // Check if cache is still valid (24 hours)
      const cachedAt = new Date(cached.cachedAt);
      const ageHours = (new Date() - cachedAt) / (1000 * 60 * 60);
      
      if (ageHours > 24) {
        return null;  // Expired
      }

      return cached.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Store recent movie IDs for historical tracking
   */
  async setRecentMovieIds(movieIds) {
    const store = this.getStore();
    await store.setJSON('recent-movies', {
      ids: movieIds,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get recent movie IDs (last 7 days)
   */
  async getRecentMovieIds() {
    const store = this.getStore();
    
    try {
      const data = await store.get('recent-movies', { type: 'json' });
      return data?.ids || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Update recent movies with today's selection
   */
  async updateRecentMovies(todaysMovieIds) {
    const existing = await this.getRecentMovieIds();
    
    // Keep last 7 days worth (roughly)
    // Assuming ~570 movies per day, keep ~4000 IDs max
    const combined = [...new Set([...todaysMovieIds, ...existing])];
    const trimmed = combined.slice(0, 4000);
    
    await this.setRecentMovieIds(trimmed);
  }

  /**
   * Clear all cached data
   */
  async clearAll() {
    const store = this.getStore();
    
    // Note: Netlify Blobs doesn't have a native "clear all" 
    // We'd need to track keys or use delete on known keys
    await store.delete('catalog');
    await store.delete('metadata');
    await store.delete('recent-movies');
  }

  /**
   * Get HTTP cache headers for responses
   */
  static getCacheHeaders() {
    return {
      'Cache-Control': `public, max-age=${CACHE_CONFIG.cdnMaxAge}, stale-while-revalidate=${CACHE_CONFIG.staleWhileRevalidate}`,
      'CDN-Cache-Control': `public, max-age=${CACHE_CONFIG.cdnMaxAge}`
    };
  }
}

/**
 * Create a cache manager for use in Netlify functions
 * Handles the case where Blobs might not be available
 */
function createCacheManager(options = {}) {
  return new CacheManager(options);
}

module.exports = {
  CacheManager,
  createCacheManager
};
