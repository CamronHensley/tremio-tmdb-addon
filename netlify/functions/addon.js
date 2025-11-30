/**
 * Main Stremio Addon Function
 */
const { getStore } = require('@netlify/blobs');
const { 
  GENRE_BY_CODE, 
  ALL_GENRE_CODES, 
  ADDON_META
} = require('../../lib/constants');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const cacheHeaders = {
  'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600'
};

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
      name: `${genre.name} Movies`
    };
  });
  return { ...ADDON_META, catalogs };
}

async function getCatalogData() {
  try {
    const store = getStore('tmdb-catalog');
    return await store.get('catalog', { type: 'json' });
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

async function handleCatalog(config, catalogId) {
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

  const movies = catalogData.genres[genreCode] || [];
  return jsonResponse({ metas: movies });
}

async function handleMeta(movieId) {
  if (!movieId.startsWith('tmdb:')) {
    return errorResponse('Invalid movie ID format', 400);
  }

  const catalogData = await getCatalogData();
  if (!catalogData || !catalogData.genres) {
    return errorResponse('Catalog data not available', 503);
  }

  for (const genreCode of Object.keys(catalogData.genres)) {
    const movie = catalogData.genres[genreCode].find(m => m.id === movieId);
    if (movie) return jsonResponse({ meta: movie });
  }

  return errorResponse('Movie not found', 404);
}

exports.handler = async function(request, context) {
  if (request.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  const path = request.path.replace('/.netlify/functions/addon', '');
  let resource, config = 'default', type, id;

  let match = path.match(/^\/([A-Z\.]*)\/?manifest.json$/);
  if (match) {
    resource = 'manifest';
    config = match[1] || 'default';
  }

  match = path.match(/^\/([A-Z\.]*)\/?catalog\/movie\/([^\/]+)\.json$/);
  if (match && !resource) {
    resource = 'catalog';
    config = match[1] || 'default';
    type = 'movie';
    id = match[2];
  }

  match = path.match(/^\/([A-Z\.]*)\/?meta\/movie\/([^\/]+)\.json$/);
  if (match && !resource) {
    resource = 'meta';
    config = match[1] || 'default';
    type = 'movie';
    id = match[2];
  }
  
  try {
    switch (resource) {
      case 'manifest':
        return await handleManifest(config);
      case 'catalog':
        return await handleCatalog(config, id);
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
