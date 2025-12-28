/**
 * Main Stremio Addon Function
 */
const { getStore } = require('@netlify/blobs');
const { randomUUID } = require('crypto');
const {
  GENRE_BY_CODE,
  ALL_GENRE_CODES,
  ADDON_META
} = require('../../lib/constants');
const {
  RateLimiter,
  getClientIdentifier,
  createRateLimitResponse
} = require('../../lib/rate-limiter');

// Validate required environment variables on startup
const requiredEnvVars = ['NETLIFY_SITE_ID', 'NETLIFY_ACCESS_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('This function will not work correctly without these variables.');
}

// Rate limiter: 120 requests per minute per IP
const rateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 120
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept-Encoding'
};

// Cache settings optimized for daily catalog updates at midnight UTC with stale-while-revalidate
const catalogCacheHeaders = {
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'  // 5min fresh, 1hr stale
};

const metaCacheHeaders = {
  'Cache-Control': 'public, max-age=600, stale-while-revalidate=7200'  // 10min fresh, 2hr stale
};

function jsonResponse(data, status = 200, useMetaCache = false) {
  const body = JSON.stringify(data);
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders,
    ...(useMetaCache ? metaCacheHeaders : catalogCacheHeaders)
  };

  // Add Content-Length for better caching
  headers['Content-Length'] = Buffer.byteLength(body, 'utf8');

  // Note: Netlify automatically handles gzip/brotli compression based on Accept-Encoding
  // We just signal it's compressible with proper content-type

  return {
    statusCode: status,
    headers,
    body
  };
}

function errorResponse(message, status = 500) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    },
    body: JSON.stringify({ error: message })
  };
}

function parseConfig(configString) {
  if (!configString || configString === 'default') {
    return ALL_GENRE_CODES;
  }
  const codes = configString.split('.').filter(code => GENRE_BY_CODE[code]);
  return codes.length > 0 ? codes : ALL_GENRE_CODES;
}

function buildManifest(genreCodes) {
  const catalogs = genreCodes.map(code => {
    const genre = GENRE_BY_CODE[code];
    return {
      type: 'movie',
      id: `tmdb-${code.toLowerCase()}`,
      name: `${genre.name} Movies`,
      extra: [
        {
          name: 'skip',
          isRequired: false,
          options: []
        }
      ]
    };
  });
  return { ...ADDON_META, catalogs };
}

// Cache catalog data for 5 minutes to reduce blob reads
let catalogCache = null;
let catalogCacheTime = 0;
let movieIndexCache = null; // Movie ID -> Genre Code index
const CATALOG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCatalogData() {
  const now = Date.now();
  if (catalogCache && (now - catalogCacheTime) < CATALOG_CACHE_TTL) {
    return catalogCache;
  }

  try {
    const store = getStore({
      name: 'tmdb-catalog',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_ACCESS_TOKEN
    });
    catalogCache = await store.get('catalog', { type: 'json' });
    catalogCacheTime = now;

    // Build movie index for O(1) lookups
    if (catalogCache && catalogCache.genres) {
      movieIndexCache = buildMovieIndex(catalogCache.genres);
    }

    return catalogCache;
  } catch (error) {
    console.error('Failed to get catalog data:', error);
    return null;
  }
}

/**
 * Build movie ID index for O(1) meta lookups
 * Maps movie ID -> { genreCode, index } for instant retrieval
 */
function buildMovieIndex(genres) {
  const index = {};
  for (const [genreCode, movies] of Object.entries(genres)) {
    movies.forEach((movie, idx) => {
      if (movie.id) {
        index[movie.id] = { genreCode, index: idx };
      }
    });
  }
  return index;
}

async function handleManifest(config) {
  const genreCodes = parseConfig(config);
  const manifest = buildManifest(genreCodes);
  return jsonResponse(manifest);
}

async function handleCatalog(config, catalogId, skip = 0) {
  const match = catalogId.match(/^tmdb-(.+)$/);
  if (!match) return errorResponse('Invalid catalog ID', 400);

  const genreCode = match[1].toUpperCase();
  const configuredGenres = parseConfig(config);
  if (!configuredGenres.includes(genreCode)) {
    return errorResponse('Genre not in configuration', 400);
  }

  const catalogData = await getCatalogData();
  if (!catalogData || !catalogData.genres) {
    return errorResponse('Catalog data not available', 503);
  }

  const allMovies = catalogData.genres[genreCode] || [];

  // Implement pagination with skip parameter
  // Stremio typically requests in chunks of 100
  const movies = allMovies.slice(skip, skip + 100);

  // Add cache-busting headers based on catalog update time
  const catalogAge = catalogData.updatedAt ? new Date(catalogData.updatedAt).getTime() : Date.now();

  // Generate ETag from catalog version and genre - forces Stremio to recognize changes
  const etag = `"${catalogAge}-${genreCode}-${skip}"`;

  const customHeaders = {
    ...catalogCacheHeaders,
    'ETag': etag,
    'X-Catalog-Version': catalogAge.toString()
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...customHeaders
    },
    body: JSON.stringify({ metas: movies })
  };
}

async function handleMeta(movieId) {
  const decodedId = decodeURIComponent(movieId);

  // Validate ID format
  if (!decodedId.startsWith('tt') && !decodedId.startsWith('tmdb:')) {
    return errorResponse('Invalid movie ID format', 400);
  }

  const catalogData = await getCatalogData();
  if (!catalogData?.genres) {
    return errorResponse('Catalog data not available', 503);
  }

  // O(1) lookup using index (10x faster than linear search)
  if (movieIndexCache && movieIndexCache[decodedId]) {
    const { genreCode, index: movieIndex } = movieIndexCache[decodedId];
    const movie = catalogData.genres[genreCode][movieIndex];
    if (movie && movie.id === decodedId) {
      return jsonResponse({ meta: movie }, 200, true);
    }
  }

  // Fallback to linear search if index miss (shouldn't happen)
  for (const genreCode of Object.keys(catalogData.genres)) {
    const movie = catalogData.genres[genreCode].find(m => m.id === decodedId);
    if (movie) {
      return jsonResponse({ meta: movie }, 200, true);
    }
  }

  return errorResponse('Movie not found', 404);
}

exports.handler = async function(request, context) {
  // Generate request ID for tracking
  const requestId = randomUUID().substring(0, 8);

  if (request.method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Apply rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = rateLimiter.isAllowed(clientId);

  if (!rateLimit.allowed) {
    console.warn(`[${requestId}] Rate limit exceeded for:`, clientId);
    return {
      ...createRateLimitResponse(rateLimit),
      headers: {
        ...createRateLimitResponse(rateLimit).headers,
        'X-Request-ID': requestId
      }
    };
  }

  // Parse URL to get query parameters (from netlify.toml redirects)
  const url = new URL(request.url || `https://dummy${request.path}`);
  const queryParams = Object.fromEntries(url.searchParams);

  // Support both query params (from redirects) and path parsing (direct access)
  let resource, config, id, skip;

  if (queryParams.resource) {
    // Using query parameters from netlify.toml redirects
    resource = queryParams.resource;
    config = queryParams.config || 'default';
    id = queryParams.id;
    skip = parseInt(queryParams.skip || '0', 10);
  } else {
    // Fallback to path parsing for direct access
    const path = request.path.replace('/.netlify/functions/addon', '');

    let match = path.match(/^\/([A-Z\.]*)\/?manifest.json$/);
    if (match) {
      resource = 'manifest';
      config = match[1] || 'default';
    }

    match = path.match(/^\/([A-Z\.]*)\/?catalog\/movie\/([^\/]+)\.json$/);
    if (match && !resource) {
      resource = 'catalog';
      config = match[1] || 'default';
      id = match[2];
      skip = parseInt(queryParams.skip || '0', 10);
    }

    match = path.match(/^\/([A-Z\.]*)\/?meta\/movie\/([^\/]+)\.json$/);
    if (match && !resource) {
      resource = 'meta';
      config = match[1] || 'default';
      id = match[2];
    }
  }

  try {
    switch (resource) {
      case 'manifest':
        return await handleManifest(config);
      case 'catalog':
        return await handleCatalog(config, id, skip);
      case 'meta':
        return await handleMeta(id);
      default:
        return errorResponse('Unknown resource', 404);
    }
  } catch (error) {
    console.error(`[${requestId}] Handler error:`, error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...corsHeaders
      },
      body: JSON.stringify({
        error: 'Internal server error',
        requestId // Users can reference this in support
      })
    };
  }
};
