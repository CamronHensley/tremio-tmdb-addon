/**
 * Health Check Endpoint
 * 
 * Returns cache status and metadata for monitoring
 */

const { getStore } = require('@netlify/blobs');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(request, context) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const store = getStore('tmdb-catalog');
    const metadata = await store.get('metadata', { type: 'json' });

    if (!metadata) {
      return new Response(JSON.stringify({
        status: 'degraded',
        message: 'No catalog data available',
        timestamp: new Date().toISOString()
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Calculate cache age
    const updatedAt = new Date(metadata.updatedAt);
    const now = new Date();
    const ageMs = now - updatedAt;
    const ageHours = Math.round(ageMs / (1000 * 60 * 60) * 10) / 10;

    const isHealthy = ageHours < 26; // Allow 2 hour buffer past 24h

    return new Response(JSON.stringify({
      status: isHealthy ? 'healthy' : 'stale',
      cache: {
        updatedAt: metadata.updatedAt,
        ageHours,
        strategy: metadata.strategy,
        genreCount: metadata.genreCount,
        totalMovies: metadata.totalMovies,
        apiRequests: metadata.apiRequests
      },
      timestamp: new Date().toISOString()
    }), {
      status: isHealthy ? 200 : 200, // Still 200 for stale, just flagged
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Cache-Control': 'no-cache' // Don't cache health checks
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

export const config = {
  path: '/health'
};
