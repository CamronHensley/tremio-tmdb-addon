/**
 * Simple in-memory rate limiter for addon functions
 * Prevents abuse and excessive requests
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute default
    this.maxRequests = options.maxRequests || 60; // 60 requests per minute default
    this.requests = new Map(); // ip -> [timestamps]

    // Clean up old entries periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.windowMs);
  }

  /**
   * Check if request is allowed for given identifier (IP address)
   */
  isAllowed(identifier) {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];

    // Remove timestamps outside current window
    const validTimestamps = timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Check if under limit
    if (validTimestamps.length < this.maxRequests) {
      validTimestamps.push(now);
      this.requests.set(identifier, validTimestamps);
      return {
        allowed: true,
        remaining: this.maxRequests - validTimestamps.length,
        resetAt: now + this.windowMs
      };
    }

    // Rate limit exceeded
    const oldestTimestamp = validTimestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestTimestamp + this.windowMs,
      retryAfter: Math.ceil((oldestTimestamp + this.windowMs - now) / 1000)
    };
  }

  /**
   * Clean up old entries from memory
   */
  cleanup() {
    const now = Date.now();
    for (const [identifier, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(
        timestamp => now - timestamp < this.windowMs
      );

      if (validTimestamps.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validTimestamps);
      }
    }
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier) {
    this.requests.delete(identifier);
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      totalIdentifiers: this.requests.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests
    };
  }

  /**
   * Cleanup and stop intervals
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

/**
 * Extract client identifier from request
 */
function getClientIdentifier(event) {
  // Try to get real IP from headers (Netlify provides this)
  const forwardedFor = event.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to other headers
  return (
    event.headers['x-real-ip'] ||
    event.headers['cf-connecting-ip'] || // Cloudflare
    event.headers['x-client-ip'] ||
    'unknown'
  );
}

/**
 * Create rate limit response
 */
function createRateLimitResponse(result) {
  return {
    statusCode: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': result.retryAfter?.toString() || '60',
      'X-RateLimit-Limit': result.maxRequests?.toString() || '',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': result.resetAt?.toString() || ''
    },
    body: JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter
    })
  };
}

module.exports = {
  RateLimiter,
  getClientIdentifier,
  createRateLimitResponse
};
