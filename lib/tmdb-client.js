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
          const retryAfter = parseInt(response.headers.get('Retry-After') || '10', 10);
          console.log(`Rate limited. Waiting ${retryAfter}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
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
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  async discoverMovies(genreId, options = {}) {
    const {
      page = 1,
      sortBy = 'popularity.desc',
      minVotes = 0,
      minRating = 0,
      releaseDateGte,
      releaseDateLte,
      region = 'US'
    } = options;

    const params = {
      with_genres: genreId,
      sort_by: sortBy,
      page,
      'vote_count.gte': minVotes,
      'vote_average.gte': minRating,
      include_adult: false,
      include_video: false,
      language: 'en-US',
      region
    };

    if (releaseDateGte) params['primary_release_date.gte'] = releaseDateGte;
    if (releaseDateLte) params['primary_release_date.lte'] = releaseDateLte;

    return this.request('/discover/movie', params);
  }

  async discoverSeasonalMovies(keywordIds, options = {}) {
    const {
      page = 1,
      sortBy = 'popularity.desc',
      minVotes = 0,
      excludeGenres = []
    } = options;

    const params = {
      with_keywords: Array.isArray(keywordIds) ? keywordIds.join('|') : keywordIds,
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

  async getMovieDetails(movieId) {
    return this.request(`/movie/${movieId}`, {
      append_to_response: 'credits',
      language: 'en-US'
    });
  }

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

  async fetchMovieDetailsBatch(movieIds) {
    const results = [];
    const batches = [];

    // Split into batches
    for (let i = 0; i < movieIds.length; i += TMDB_CONFIG.requestsPerBatch) {
      batches.push(movieIds.slice(i, i + TMDB_CONFIG.requestsPerBatch));
    }

    // Process 3 batches in parallel for 3x speedup
    const CONCURRENT_BATCHES = 3;

    for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
      const currentBatches = batches.slice(i, i + CONCURRENT_BATCHES);

      const batchPromises = currentBatches.map(batch =>
        Promise.all(
          batch.map(id =>
            this.getMovieDetails(id).catch(err => {
              console.error(`Failed to fetch details for movie ${id}:`, err.message);
              return null;
            })
          )
        )
      );

      const batchResults = await Promise.all(batchPromises);

      // Flatten and filter nulls
      batchResults.forEach(batchResult => {
        results.push(...batchResult.filter(r => r !== null));
      });

      // Add delay between parallel batch groups (not between individual batches)
      if (i + CONCURRENT_BATCHES < batches.length) {
        await new Promise(resolve => setTimeout(resolve, TMDB_CONFIG.batchDelayMs));
      }
    }

    return results;
  }

  static toStremioMeta(movie) {
    if (!movie) return null;

    const movieId = movie.imdb_id || `tmdb:${movie.id}`;

    const meta = {
      id: movieId,
      type: 'movie',
      name: movie.title,
      tmdbId: movie.id,
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

    if (movie.credits) {
      const cast = movie.credits.cast?.slice(0, 3).map(c => c.name) || [];
      const director = movie.credits.crew?.find(c => c.job === 'Director')?.name;

      if (cast.length > 0) meta.cast = cast;
      if (director) meta.director = [director];
    }

    if (movie.tagline) {
      meta.tagline = movie.tagline;
    }

    return meta;
  }

  getRequestCount() {
    return this.requestCount;
  }
}

module.exports = TMDBClient;
