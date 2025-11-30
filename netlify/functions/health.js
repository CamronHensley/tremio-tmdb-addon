/**
 * Health Check Endpoint
 */
const { getStore } = require('@netlify/blobs');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async function(request, context) {
  if (request.method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    const store = getStore({
      name: 'tmdb-catalog',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_ACCESS_TOKEN
    });
    const metadata = await store.get('metadata', { type: 'json' });

    if (!metadata) {
      return {
        statusCode: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        body: JSON.stringify({ status: 'degraded', message: 'No catalog data available' })
      };
    }

    const updatedAt = new Date(metadata.updatedAt);
    const now = new Date();
    const ageHours = Math.round((now - updatedAt) / 3600000 * 10) / 10;
    const isHealthy = ageHours < 26;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        status: isHealthy ? 'healthy' : 'stale',
        cache: {
          updatedAt: metadata.updatedAt,
          ageHours,
          ...metadata
        }
      })
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify({ status: 'error', message: error.message })
    };
  }
};
