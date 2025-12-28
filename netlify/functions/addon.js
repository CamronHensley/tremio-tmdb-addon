/**
 * Main Stremio Addon Function
 */
const { getStore } = require('@netlify/blobs');
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

// Rate limiter: 120 requests per minute per IP
const rateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 120
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Cache settings optimized for daily catalog updates at midnight UTC
const catalogCacheHeaders = {
  'Cache-Control': 'public, max-age=300, must-revalidate'  // 5 minutes - allows quick refresh
};

const metaCacheHeaders = {
  'Cache-Control': 'public, max-age=300, must-revalidate'  // 5 minutes for metadata
};

function jsonResponse(data, status = 200, useMetaCache = false) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...(useMetaCache ? metaCacheHeaders : catalogCacheHeaders)
    },
    body: JSON.stringify(data)
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
    return catalogCache;
  } catch (error) {
    console.error('Failed to get catalog data:', error);
    return null;
  }
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

  // Search all genres for the movie
  for (const genreCode of Object.keys(catalogData.genres)) {
    const movie = catalogData.genres[genreCode].find(m => m.id === decodedId);
    if (movie) {
      return jsonResponse({ meta: movie }, 200, true);
    }
  }

  return errorResponse('Movie not found', 404);
}

exports.handler = async function(request, context) {
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
    console.warn('Rate limit exceeded for:', clientId);
    return createRateLimitResponse(rateLimit);
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
    console.error('Handler error:', error);
    return errorResponse('Internal server error', 500);
  }
};
