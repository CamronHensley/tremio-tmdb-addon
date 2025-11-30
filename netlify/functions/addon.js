/**
 * Main Stremio Addon Function
 * 
 * Handles:
 * - GET /manifest.json - Addon manifest
 * - GET /:config/manifest.json - Configured manifest
 * - GET /:config/catalog/movie/:genreId.json - Genre catalog
 * - GET /:config/meta/movie/:id.json - Movie metadata
 */

const { getStore } = require('@netlify/blobs');
const { 
  GENRES, 
  GENRE_BY_CODE, 
  ALL_GENRE_CODES, 
  ADDON_META,
  CACHE_CONFIG 
} = require('../../lib/constants');

// CORS headers for Stremio
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Cache headers
const cacheHeaders = {
  'Cache-Control': `public, max-age=${CACHE_CONFIG.cdnMaxAge}, stale-while-revalidate=${CACHE_CONFIG.staleWhileRevalidate}`
};

// JSON response helper
function jsonResponse(data, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...cacheHeaders
    },
    body: JSON.stringify(data)
  };
}

// Error response helper  
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

// Parse configuration string (e.g., "ACTION.COMEDY.HORROR")
function parseConfig(configString) {
  if (!configString || configString === 'default') {
    return ALL_GENRE_CODES;
  }

  const codes = configString.split('.').filter(code => GENRE_BY_CODE[code]);
  return codes.length > 0 ? codes : ALL_GENRE_CODES;
}

// Build manifest with configured genres
function buildManifest(genreCodes) {
  const catalogs = genreCodes.map(code => {
    const genre = GENRE_BY_CODE[code];
    return {
      type: 'movie',
      id: `tmdb-${code.toLowerCase()}`,
      name: `${genre.name} Movies`,
      extra: [{ name: 'skip' }]
    };
  });

  return {
    ...ADDON_META,
    catalogs
  };
}

// Get catalog data from blob storage
async function getCatalogData() {
  try {
    const store = getStore('tmdb-catalog');
    const data = await store.get('catalog', { type: 'json' });
    return data;
  } catch (error) {
    console.error('Failed to get catalog data:', error);
    return null;
  }
}

// Handle manifest request
async function handleManifest(config) {
  const genreCodes = parseConfig(config);
  const manifest = buildManifest(genreCodes);
  return jsonResponse(manifest);
}

// Handle catalog request
async function handleCatalog(config, catalogId) {
  // Extract genre code from catalog ID (e.g., "tmdb-action" -> "ACTION")
  const match = catalogId.match(/^tmdb-(.+)$/);
  if (!match) {
    return errorResponse('Invalid catalog ID', 400);
  }

  const genreCode = match[1].toUpperCase();
  
  // Verify genre is in user's config
  const configuredGenres = parseConfig(config);
  if (!configuredGenres.includes(genreCode)) {
    return errorResponse('Genre not in configuration', 400);
  }

  // Get catalog data
  const catalogData = await getCatalogData();
  if (!catalogData || !catalogData.genres) {
    return errorResponse('Catalog data not available', 503);
  }

  const movies = catalogData.genres[genreCode];
  if (!movies) {
    return jsonResponse({ metas: [] });
  }

  return jsonResponse({ metas: movies });
}

// Handle meta request (movie details)
async function handleMeta(movieId) {
  // movieId format: "tmdb:12345"
  if (!movieId.startsWith('tmdb:')) {
    return errorResponse('Invalid movie ID format', 400);
  }

  const tmdbId = movieId.replace('tmdb:', '');

  // Search for movie in catalog
  const catalogData = await getCatalogData();
  if (!catalogData || !catalogData.genres) {
    return errorResponse('Catalog data not available', 503);
  }

  // Find movie in any genre
  for (const genreCode of Object.keys(catalogData.genres)) {
    const movie = catalogData.genres[genreCode].find(m => m.id === movieId);
    if (movie) {
      return jsonResponse({ meta: movie });
    }
  }

  return errorResponse('Movie not found', 404);
}

// Main handler
exports.handler = async function(request, context) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Parse URL parameters
  const url = new URL(request.url);
  const params = url.searchParams;
  
  const resource = params.get('resource');
  const config = params.get('config') || 'default';
  const type = params.get('type');
  const id = params.get('id');

  try {
    switch (resource) {
      case 'manifest':
        return await handleManifest(config);
        
      case 'catalog':
        if (type !== 'movie') {
          return errorResponse('Only movie catalogs supported', 400);
        }
        return await handleCatalog(config, id);
        
      case 'meta':
        if (type !== 'movie') {
          return errorResponse('Only movie metadata supported', 400);
        }
        return await handleMeta(id);
        
      default:
        return errorResponse('Unknown resource type', 400);
    }
  } catch (error) {
    console.error('Handler error:', error);
    return errorResponse('Internal server error', 500);
  }
}
