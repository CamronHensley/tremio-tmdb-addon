/**
 * Health Check Endpoint
 */
const { getStore } = require('@netlify/blobs');
const { randomUUID } = require('crypto');

// Validate required environment variables on startup
const requiredEnvVars = ['NETLIFY_SITE_ID', 'NETLIFY_ACCESS_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Health endpoint missing env vars: ${missingEnvVars.join(', ')}`);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async function(request, context) {
  const requestId = randomUUID().substring(0, 8);

  if (request.method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Validate environment before attempting to connect
    if (missingEnvVars.length > 0) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          ...corsHeaders
        },
        body: JSON.stringify({
          status: 'error',
          message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
          requestId
        })
      };
    }

    const store = getStore({
      name: 'tmdb-catalog',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_ACCESS_TOKEN
    });
    const metadata = await store.get('metadata', { type: 'json' });

    if (!metadata) {
      return {
        statusCode: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          ...corsHeaders
        },
        body: JSON.stringify({
          status: 'degraded',
          message: 'No catalog data available',
          requestId
        })
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
        'X-Request-ID': requestId,
        ...corsHeaders,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify({
        status: isHealthy ? 'healthy' : 'stale',
        requestId,
        cache: {
          updatedAt: metadata.updatedAt,
          ageHours,
          ...metadata
        }
      })
    };
  } catch (error) {
    console.error(`[${requestId}] Health check error:`, error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...corsHeaders
      },
      body: JSON.stringify({
        status: 'error',
        message: error.message,
        requestId
      })
    };
  }
};
