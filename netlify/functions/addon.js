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

// Cache settings optimized for daily catalog updates at midnight UTC
const catalogCacheHeaders = {
  'Cache-Control': 'public, max-age=21600, must-revalidate'  // 6 hours - fresh within 6h of nightly update
};

const metaCacheHeaders = {
  'Cache-Control': 'public, max-age=3600, must-revalidate'  // 1 hour for metadata
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
      name: `${genre.name} Movies`
    };
  });
  return { ...ADDON_META, catalogs };
}

async function getCatalogData() {
  try {
    const store = getStore({
      name: 'tmdb-catalog',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_ACCESS_TOKEN
    });
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

  // Add cache-busting headers based on catalog update time
  const catalogAge = catalogData.updatedAt ? new Date(catalogData.updatedAt).getTime() : Date.now();

  // Generate ETag from catalog version and genre - forces Stremio to recognize changes
  const etag = `"${catalogAge}-${genreCode}"`;

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
  console.log('handleMeta called with:', movieId);

  // Decode URL-encoded movie ID (Stremio encodes the colon as %3A)
  const decodedId = decodeURIComponent(movieId);
  console.log('Decoded ID:', decodedId);

  if (!decodedId.startsWith('tmdb:')) {
    console.log('ERROR: Invalid movie ID format:', decodedId);
    return errorResponse('Invalid movie ID format', 400);
  }

  const catalogData = await getCatalogData();
  console.log('Catalog data loaded:', {
    hasData: !!catalogData,
    hasGenres: !!catalogData?.genres,
    genreCount: catalogData?.genres ? Object.keys(catalogData.genres).length : 0
  });

  if (!catalogData || !catalogData.genres) {
    console.log('ERROR: Catalog data not available');
    return errorResponse('Catalog data not available', 503);
  }

  for (const genreCode of Object.keys(catalogData.genres)) {
    const movie = catalogData.genres[genreCode].find(m => m.id === decodedId);
    if (movie) {
      console.log('Movie found in genre:', genreCode, 'Movie:', movie.name);
      const response = jsonResponse({ meta: movie }, 200, true);  // Use meta cache headers
      console.log('Returning response:', JSON.stringify(response).substring(0, 200));
      return response;
    }
  }

  console.log('ERROR: Movie not found:', decodedId);
  console.log('Available movies:', Object.keys(catalogData.genres).map(code =>
    catalogData.genres[code].slice(0, 2).map(m => m.id)
  ));
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

  // Parse URL to get query parameters (from netlify.toml redirects)
  const url = new URL(request.url || `https://dummy${request.path}`);
  const queryParams = Object.fromEntries(url.searchParams);

  // Log incoming request for debugging
  console.log('Request:', {
    path: request.path,
    url: request.url,
    queryParams
  });

  // Support both query params (from redirects) and path parsing (direct access)
  let resource, config, type, id;

  if (queryParams.resource) {
    // Using query parameters from netlify.toml redirects
    resource = queryParams.resource;
    config = queryParams.config || 'default';
    type = queryParams.type;
    id = queryParams.id;
    console.log('Using query params:', { resource, config, type, id });
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
    console.log('Using path parsing:', { resource, config, type, id });
  }

  console.log('Final params:', { resource, config, type, id });

  try {
    switch (resource) {
      case 'manifest':
        return await handleManifest(config);
      case 'catalog':
        return await handleCatalog(config, id);
      case 'meta':
        console.log('Handling meta request for:', id);
        return await handleMeta(id);
      default:
        return errorResponse('Unknown resource', 404);
    }
  } catch (error) {
    console.error('Handler error:', error);
    return errorResponse('Internal server error', 500);
  }
};
