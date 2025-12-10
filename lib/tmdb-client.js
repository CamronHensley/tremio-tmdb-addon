/**
 * TMDB API wrapper with rate limiting, retries, and error handling
 */

const fetch = require('node-fetch');
const { TMDB_CONFIG, GENRE_BY_ID } = require('./constants');

class TMDBClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('TMDB API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = TMDB_CONFIG.baseUrl;
    this.requestCount = 0;
  }

  /**
   * Make a request to TMDB API with retry logic
   */
  async request(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }

    let lastError;
    for (let attempt = 0; attempt < TMDB_CONFIG.maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString());
        this.requestCount++;

        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = parseInt(response.headers.get('Retry-After') || '10', 10);
          console.log(`Rate limited. Waiting ${retryAfter}s before retry...`);
          await this.sleep(retryAfter * 1000);
          continue;
        }

        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        console.error(`Request failed (attempt ${attempt + 1}/${TMDB_CONFIG.maxRetries}):`, error.message);
        
        if (attempt < TMDB_CONFIG.maxRetries - 1) {
          const delay = TMDB_CONFIG.retryDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Discover movies by genre with sorting options
   */
  async discoverMovies(genreId, options = {}) {
    const {
      page = 1,
      sortBy = 'popularity.desc',
      minVotes = 0,
      minRating = 0,
      releaseDateGte,
      releaseDateLte,
      region = 'US',
      withKeywords,
      withoutGenres
    } = options;

    const params = {
      sort_by: sortBy,
      page,
      'vote_count.gte': minVotes,
      'vote_average.gte': minRating,
      include_adult: false,
      include_video: false,
      language: 'en-US',
      region
    };

    if (genreId) params.with_genres = genreId;
    if (withKeywords) params.with_keywords = withKeywords;
    if (withoutGenres) params.without_genres = withoutGenres;
    if (releaseDateGte) params['primary_release_date.gte'] = releaseDateGte;
    if (releaseDateLte) params['primary_release_date.lte'] = releaseDateLte;

    return this.request('/discover/movie', params);
  }

  /**
   * Discover seasonal/holiday movies using keywords
   */
  async discoverSeasonalMovies(keywordIds, options = {}) {
    const {
      page = 1,
      sortBy = 'popularity.desc',
      minVotes = 100,
      excludeGenres = []
    } = options;

    const params = {
      with_keywords: keywordIds.join('|'), // OR logic for keywords
      sort_by: sortBy,
      page,
      'vote_count.gte': minVotes,
      include_adult: false,
      include_video: false,
      language: 'en-US'
    };

    if (excludeGenres.length > 0) {
      params.without_genres = excludeGenres.join(',');
    }

    return this.request('/discover/movie', params);
  }

  /**
   * Get detailed movie information
   * Includes credits and external IDs (IMDB, Facebook, Instagram, Twitter)
   */
  async getMovieDetails(movieId) {
    return this.request(`/movie/${movieId}`, {
      append_to_response: 'credits,external_ids',
      language: 'en-US'
    });
  }

  /**
   * Fetch movies for a genre using specified discovery parameters
   * Returns raw movie data for processing
   */
  async fetchGenreMovies(genreId, pages = [1, 2, 3], sortBy = 'popularity.desc', additionalParams = {}) {
    const allMovies = [];
    
    for (const page of pages) {
      try {
        const response = await this.discoverMovies(genreId, {
          page,
          sortBy,
          ...additionalParams
        });
        
        if (response.results && response.results.length > 0) {
          allMovies.push(...response.results);
        }
      } catch (error) {
        console.error(`Failed to fetch page ${page} for genre ${genreId}:`, error.message);
      }
    }

    return allMovies;
  }

  /**
   * Fetch detailed info for multiple movies in batches
   */
  async fetchMovieDetailsBatch(movieIds) {
    const results = [];
    const batches = this.chunkArray(movieIds, TMDB_CONFIG.requestsPerBatch);

    for (const batch of batches) {
      const batchPromises = batch.map(id => 
        this.getMovieDetails(id).catch(err => {
          console.error(`Failed to fetch details for movie ${id}:`, err.message);
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null));

      // Delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.sleep(TMDB_CONFIG.batchDelayMs);
      }
    }

    return results;
  }

  /**
   * Split array into chunks
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Transform TMDB movie to Stremio meta format
   */
  static toStremioMeta(movie) {
    if (!movie) return null;

    // Use IMDB ID as primary ID (required for streaming addons)
    // Priority: external_ids.imdb_id > imdb_id > tmdb:{id}
    const imdbId = movie.external_ids?.imdb_id || movie.imdb_id;
    const movieId = imdbId || `tmdb:${movie.id}`;

    const meta = {
      id: movieId,
      type: 'movie',
      name: movie.title,
      tmdbId: movie.id,  // Store TMDB ID for deduplication
      poster: movie.poster_path
        ? `${TMDB_CONFIG.imageBaseUrl}/${TMDB_CONFIG.posterSize}${movie.poster_path}`
        : null,
      background: movie.backdrop_path
        ? `${TMDB_CONFIG.imageBaseUrl}/${TMDB_CONFIG.backdropSize}${movie.backdrop_path}`
        : null,
      description: movie.overview || '',
      releaseInfo: movie.release_date ? movie.release_date.split('-')[0] : undefined,
      year: movie.release_date ? parseInt(movie.release_date.split('-')[0], 10) : undefined,
      imdbRating: movie.vote_average ? movie.vote_average.toFixed(1) : undefined,
      genres: movie.genre_ids
        ? movie.genre_ids.map(id => GENRE_BY_ID[id]?.name).filter(Boolean)
        : movie.genres?.map(g => g.name) || [],
      runtime: movie.runtime ? `${movie.runtime} min` : undefined
    };

    // Add credits if available
    if (movie.credits) {
      const cast = movie.credits.cast?.slice(0, 3).map(c => c.name) || [];
      const director = movie.credits.crew?.find(c => c.job === 'Director')?.name;

      if (cast.length > 0) meta.cast = cast;
      if (director) meta.director = [director];
    }

    // Add tagline if available
    if (movie.tagline) {
      meta.tagline = movie.tagline;
    }

    // Add external IDs for cross-platform linking
    if (movie.external_ids) {
      const links = {};
      if (movie.external_ids.imdb_id) links.imdb = `https://www.imdb.com/title/${movie.external_ids.imdb_id}`;
      if (movie.external_ids.facebook_id) links.facebook = `https://www.facebook.com/${movie.external_ids.facebook_id}`;
      if (movie.external_ids.instagram_id) links.instagram = `https://www.instagram.com/${movie.external_ids.instagram_id}`;
      if (movie.external_ids.twitter_id) links.twitter = `https://twitter.com/${movie.external_ids.twitter_id}`;

      if (Object.keys(links).length > 0) {
        meta.links = links;
      }
    }

    return meta;
  }

  /**
   * Get total request count (for logging/monitoring)
   */
  getRequestCount() {
    return this.requestCount;
  }

  /**
   * Reset request counter
   */
  resetRequestCount() {
    this.requestCount = 0;
  }
}

module.exports = TMDBClient;
