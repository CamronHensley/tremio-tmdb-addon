class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;
    this.maxRequests = options.maxRequests || 60;
    this.requests = new Map();

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.windowMs);
  }

  isAllowed(identifier) {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];

    const validTimestamps = timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (validTimestamps.length < this.maxRequests) {
      validTimestamps.push(now);
      this.requests.set(identifier, validTimestamps);
      return {
        allowed: true,
        remaining: this.maxRequests - validTimestamps.length,
        resetAt: now + this.windowMs
      };
    }

    const oldestTimestamp = validTimestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestTimestamp + this.windowMs,
      retryAfter: Math.ceil((oldestTimestamp + this.windowMs - now) / 1000)
    };
  }

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

  reset(identifier) {
    this.requests.delete(identifier);
  }

  getStats() {
    return {
      totalIdentifiers: this.requests.size
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

function getClientIdentifier(event) {
  const forwardedFor = event.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return (
    event.headers['x-real-ip'] ||
    event.headers['cf-connecting-ip'] ||
    event.headers['x-client-ip'] ||
    'unknown'
  );
}

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
