/**
 * Simplified addon.js for debugging.
 * Returns a hardcoded, minimal, valid Stremio manifest.
 */

// All other requires and functions have been removed for this test.

exports.handler = async function(request, context) {
  // A minimal, valid Stremio manifest.
  const minimalManifest = {
    id: 'community.tmdb.genres.debug',
    version: '1.0.1', // Incremented version to avoid cache issues
    name: 'TMDB Addon (Debugging)',
    description: 'A hardcoded manifest to test Netlify serving.',
    logo: 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3edd904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg',
    catalogs: [{
      type: 'movie',
      id: 'tmdb-debug-catalog',
      name: 'Debug Catalog'
    }],
    resources: ['catalog'],
    types: ['movie'],
    idPrefixes: ['tmdb:']
  };

  // Standard Netlify function return format.
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache' // Ensure no caching during debug
    },
    body: JSON.stringify(minimalManifest)
  };
}