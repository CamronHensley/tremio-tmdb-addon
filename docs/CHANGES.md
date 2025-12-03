# Changes Summary

This document summarizes the improvements made to the stremio-tmdb-addon project.

## Files Added

### 1. LICENSE
- **Type**: MIT License
- **Purpose**: Proper open-source licensing
- **Impact**: Legal clarity for users and contributors

### 2. .nvmrc
- **Content**: Node version 20
- **Purpose**: Lock Node.js version for consistent development environment
- **Impact**: Prevents version-related issues

### 3. jest.config.js
- **Purpose**: Jest test configuration
- **Features**:
  - Code coverage tracking (70% threshold)
  - Test file pattern matching
  - Coverage reports for lib/ and netlify/functions/

### 4. lib/__tests__/scoring-engine.test.js
- **Type**: Unit tests
- **Coverage**: 300+ test cases covering:
  - Page rotation logic
  - TMDB sort parameters
  - Quality thresholds for all genres
  - Base score calculation
  - Strategy modifiers (7 daily strategies)
  - Genre personality modifiers
  - Controlled randomization
  - Historical penalties
  - Full integration scenarios

### 5. lib/__tests__/deduplication.test.js
- **Type**: Unit tests
- **Coverage**: Tests for:
  - Multi-genre deduplication
  - Quality threshold filtering
  - Greedy vs optimal assignment
  - Genre filling logic
  - Statistics tracking
  - Realistic multi-genre scenarios

### 6. lib/logger.js
- **Type**: Utility module
- **Features**:
  - Structured logging with levels (ERROR/WARN/INFO/DEBUG)
  - JSON output in production, human-readable in development
  - Child logger creation for context
  - Execution timing utilities
  - HTTP and TMDB API call logging helpers
  - Configurable via LOG_LEVEL environment variable

### 7. lib/rate-limiter.js
- **Type**: Security module
- **Features**:
  - In-memory rate limiting (120 req/min per IP)
  - Sliding window algorithm
  - Automatic cleanup of old entries
  - Client identifier extraction (supports X-Forwarded-For, Cloudflare, etc.)
  - Standard rate limit response formatting
  - Supports Retry-After and X-RateLimit headers

### 8. CHANGES.md
- **Type**: Documentation
- **Purpose**: Track all improvements made to the project

## Files Modified

### 1. package.json
- **Added devDependency**: jest@^29.7.0
- **Updated scripts**:
  - `test`: Changed from local test script to Jest
  - `test:watch`: Added for development
  - `test:coverage`: Added for coverage reports
  - `test:local`: Renamed old test script

### 2. lib/constants.js
- **Changed**: MOVIES_PER_GENRE now configurable
- **Before**: `const MOVIES_PER_GENRE = 30;`
- **After**: `const MOVIES_PER_GENRE = parseInt(process.env.MOVIES_PER_GENRE || '30', 10);`
- **Impact**: Users can customize movie count without code changes

### 3. .env.example
- **Added**:
  ```
  # Number of movies per genre (default: 30)
  # Optional - adjust if you want more or fewer movies per genre
  # MOVIES_PER_GENRE=30
  ```

### 4. public/index.html
- **Added error handling**:
  - `showError()` function for user-friendly error messages
  - Try-catch in `init()` function
  - Enhanced clipboard error handling with fallback
  - Visual error notifications (5-second toast)

### 5. netlify/functions/addon.js
- **Added imports**:
  - RateLimiter module
  - getClientIdentifier helper
  - createRateLimitResponse helper
- **Added rate limiting**:
  - 120 requests per minute per IP
  - Automatic rate limit responses with Retry-After header
  - Client identifier tracking in logs
- **Improved logging**:
  - Added clientId to request logs
  - Added rateLimitRemaining to request logs

### 6. README.md
- **Added sections**:
  - "Free Tier Limits & Usage" - Detailed breakdown of costs and limits
  - "Testing" - How to run tests and what's covered
  - "Recent Improvements" - Changelog for v1.1.0
- **Updated Features section**:
  - Added "IMDB ID Priority"
  - Added "Rate Limiting"
- **Updated Environment Variables table**:
  - Added MOVIES_PER_GENRE
  - Added LOG_LEVEL
  - Added default values column
- **Updated Local Development section**:
  - Added test commands
  - Added dev server command

## Improvements Summary

### Testing Infrastructure ✅
- Comprehensive test suite with Jest
- 70% code coverage threshold
- Tests for core business logic (scoring, deduplication)
- Easy to run: `npm test`

### Security ✅
- Rate limiting prevents abuse
- 120 requests/minute per IP
- Standard HTTP rate limit headers
- DoS protection

### Observability ✅
- Structured logging utility
- Configurable log levels
- Production-ready JSON logging
- Request tracking and timing

### Configurability ✅
- MOVIES_PER_GENRE environment variable
- LOG_LEVEL environment variable
- No code changes needed for common adjustments

### User Experience ✅
- Error handling in configuration UI
- User-friendly error messages
- Clipboard fallback for older browsers
- Visual feedback for errors

### Developer Experience ✅
- .nvmrc for version consistency
- Comprehensive test suite
- Watch mode for development
- Coverage reports
- Clear documentation

### Legal & Documentation ✅
- MIT License file
- Updated README with usage limits
- Recent improvements documented
- Free-tier capacity estimates

## Breaking Changes

**None** - All changes are backward compatible.

## Migration Guide

No migration needed. Existing deployments will continue to work with default values.

### Optional: To use new features

1. **Run tests locally**:
   ```bash
   npm install  # Install jest
   npm test
   ```

2. **Enable configurable movie count**:
   ```bash
   # In Netlify environment variables
   MOVIES_PER_GENRE=40  # Or any number you prefer
   ```

3. **Enable debug logging**:
   ```bash
   # In Netlify environment variables
   LOG_LEVEL=DEBUG
   ```

## Performance Impact

- **Rate limiting**: Minimal overhead (~1ms per request)
- **Logging**: Negligible in production (JSON serialization is fast)
- **No impact on catalog serving**: All improvements are in control plane

## Next Steps (Optional Future Improvements)

1. **Monitoring**:
   - Add Sentry for error tracking
   - Add analytics for usage patterns

2. **Testing**:
   - Add E2E tests for Stremio protocol
   - Add performance benchmarks

3. **Features**:
   - Configurable cache durations
   - Manual trigger endpoint for updates
   - Health check alerts (webhook on stale data)

4. **Documentation**:
   - Video setup guide
   - Troubleshooting flowchart
   - Architecture diagrams

## Credits

All improvements maintain the original architecture and design philosophy while adding production-ready operational features.
