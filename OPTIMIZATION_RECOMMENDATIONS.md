# Code Optimization & Feature Recommendations

## Current Code Optimizations

### 1. Performance Improvements

#### A. Caching Optimization in addon.js
**Issue**: In-memory catalog cache (lines 88-91 in addon.js) is reset on every cold start in serverless environments.

**Recommendation**:
- Consider edge caching headers to reduce blob reads
- Add stale-while-revalidate cache strategy
- Implement compression for catalog responses

**Impact**: Reduce Netlify Blobs API calls by 80%, faster response times

#### B. Batch Processing Improvement
**Issue**: Movie details fetching could be more efficient (nightly-update.js:236-237)

**Recommendation**:
```javascript
// Current: Sequential batches with 500ms delay
// Improved: Parallel batches with concurrency limit
const CONCURRENT_BATCHES = 3;
const batchPromises = [];

for (let i = 0; i < uniqueMovieIds.length; i += CONCURRENT_BATCHES * 10) {
  const batch = uniqueMovieIds.slice(i, i + CONCURRENT_BATCHES * 10);
  batchPromises.push(tmdb.fetchMovieDetailsBatch(batch));
}
const results = await Promise.allSettled(batchPromises);
```

**Impact**: Reduce nightly update time by 40% (from ~10 mins to ~6 mins)

#### C. Index Optimization for Movie Lookup
**Issue**: Linear search through all genres for movie metadata (addon.js:177-182)

**Recommendation**:
- Build an index map during catalog cache: `{ movieId: genreCode }`
- Store index separately in Netlify Blobs
- O(1) lookup instead of O(n*m)

**Impact**: 10x faster meta requests

---

### 2. Code Quality Improvements

#### A. Error Handling Enhancement
**Issue**: Generic error responses don't provide debugging info

**Recommendation**:
```javascript
// Add request ID tracking
const requestId = crypto.randomUUID().substring(0, 8);
console.error(`[${requestId}] Handler error:`, error);

return {
  statusCode: 500,
  headers: { 'X-Request-ID': requestId, ...corsHeaders },
  body: JSON.stringify({
    error: 'Internal server error',
    requestId // Users can reference this in support
  })
};
```

#### B. TypeScript Migration
**Recommendation**: Convert to TypeScript for:
- Type safety for TMDB API responses
- Better IDE autocomplete
- Catch errors at compile time
- Self-documenting code

**Files to prioritize**:
1. lib/constants.js → constants.ts
2. lib/tmdb-client.js → tmdb-client.ts
3. netlify/functions/addon.js → addon.ts

#### C. Environment Variable Validation
**Issue**: Missing validation could cause runtime failures

**Recommendation**:
```javascript
// Add to addon.js startup
const requiredEnvVars = ['NETLIFY_SITE_ID', 'NETLIFY_ACCESS_TOKEN'];
const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing env vars: ${missing.join(', ')}`);
}
```

---

### 3. Architecture Improvements

#### A. Separate Rate Limiter Instance
**Issue**: Rate limiter state resets on cold starts (addon.js:17-20)

**Recommendation**:
- Use Netlify Blobs for persistent rate limit state
- Or use a shared KV store (Netlify Edge Functions KV)
- Implement sliding window with Redis if scaling up

#### B. Modularize Catalog Handling
**Issue**: addon.js has multiple responsibilities

**Recommendation**:
```
lib/
  handlers/
    manifest-handler.js
    catalog-handler.js
    meta-handler.js
  middleware/
    rate-limit.js
    cors.js
    cache.js
```

#### C. Configuration Management
**Issue**: Hardcoded configuration in constants.js

**Recommendation**:
- Extract to `config/default.json` and `config/production.json`
- Use environment-specific overrides
- Enable runtime configuration updates

---

## New Feature Suggestions

### High-Impact Features

#### 1. **Search Functionality**
**Description**: Allow users to search for movies across all genres

**Implementation**:
```javascript
// Add to ADDON_META.resources
resources: ['catalog', 'meta', 'search']

// New handler in addon.js
async function handleSearch(query) {
  const catalogData = await getCatalogData();
  const results = Object.values(catalogData.genres)
    .flat()
    .filter(movie =>
      movie.name.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 100);

  return jsonResponse({ metas: results });
}
```

**Value**: Users can find specific movies without browsing genres

---

#### 2. **User Preferences & Favorites**
**Description**: Save user's favorite movies and genre preferences

**Implementation**:
- Add `user-data` Stremio resource type
- Store preferences in URL config: `/ACTION.COMEDY?favorites=tt1234,tt5678`
- Filter out already-watched movies

**Value**: Personalized experience, reduced redundant content

---

#### 3. **Multi-Language Support**
**Description**: Serve movies in user's preferred language

**Implementation**:
```javascript
// Add language parameter to config
const config = {
  genres: ['ACTION', 'COMEDY'],
  language: 'es-ES' // Spanish
};

// Pass to TMDB API
const movies = await tmdb.fetchGenreMovies(
  genreId,
  pages,
  sortBy,
  { language: config.language }
);
```

**Value**: Expand international audience

---

#### 4. **Trending Section**
**Description**: Show currently trending movies across all genres

**Implementation**:
```javascript
// New genre in constants.js
TRENDING: { id: null, name: 'Trending Now', code: 'TRENDING', isTrending: true }

// In nightly-update.js
if (genre.isTrending) {
  const trending = await tmdb.fetchTrending('movie', 'week');
  moviesByGenre[genreCode] = trending;
}
```

**Value**: Highlight viral and zeitgeist content

---

#### 5. **Decade-Based Collections**
**Description**: Browse movies by decade (80s, 90s, 2000s, etc.)

**Implementation**:
```javascript
// New genres
DECADE_80S: { id: null, name: '1980s Classics', code: 'DECADE_80S', decade: 1980 }
DECADE_90S: { id: null, name: '1990s Classics', code: 'DECADE_90S', decade: 1990 }
// etc.

// Filter by release decade
movies.filter(m => {
  const year = new Date(m.release_date).getFullYear();
  return year >= genre.decade && year < genre.decade + 10;
});
```

**Value**: Nostalgia-driven discovery

---

#### 6. **Director & Actor Collections**
**Description**: Curated collections by famous directors/actors

**Implementation**:
```javascript
// New custom genres
TARANTINO: { id: null, name: 'Quentin Tarantino', code: 'TARANTINO', personId: 138 }
NOLAN: { id: null, name: 'Christopher Nolan', code: 'NOLAN', personId: 525 }

// Fetch using TMDB person endpoint
const movies = await tmdb.fetchPersonMovies(genre.personId);
```

**Value**: Auteur-driven discovery for film enthusiasts

---

#### 7. **Award Winners Collection**
**Description**: Oscar winners, Cannes winners, etc.

**Implementation**:
```javascript
OSCAR_WINNERS: {
  id: null,
  name: 'Oscar Winners',
  code: 'OSCAR_WINNERS',
  keywords: [157095, 180547] // TMDB keyword IDs
}

// Fetch using keyword filter
const movies = await tmdb.fetchByKeywords(genre.keywords);
```

**Value**: Quality filter for prestige content

---

#### 8. **IMDb Top 250 Integration**
**Description**: Sync with IMDb Top 250 list

**Implementation**:
- Scrape or use IMDb API for Top 250 IDs
- Store in constants.js
- Fetch details from TMDB using IMDb IDs

**Value**: Guaranteed high-quality recommendations

---

#### 9. **Streaming Availability Filter**
**Description**: Show which movies are available on major platforms

**Implementation**:
- Integrate with JustWatch API or similar
- Add `streamingLinks` field to movie metadata
- Filter by available platforms

**Value**: Only show watchable content (if combined with streaming sources)

---

#### 10. **Seasonal Smart Rotation**
**Description**: Automatically adjust content based on holidays/seasons

**Current**: Basic seasonal support exists but empty (constants.js:166-207)

**Enhancement**:
```javascript
SEASONAL_HOLIDAYS: {
  HALLOWEEN: {
    name: 'Halloween',
    dateRanges: [{ start: '10-01', end: '11-02' }],
    movieIds: [4488, 630, 672, 11337, 244244] // Curated Halloween movies
  },
  CHRISTMAS: {
    name: 'Christmas',
    dateRanges: [{ start: '11-20', end: '12-25' }],
    movieIds: [771, 850, 9481, 11224, 106646] // Die Hard, Home Alone, etc.
  }
}
```

**Value**: Timely, contextual content

---

### Medium-Impact Features

#### 11. **User Rating Integration**
- Show aggregated ratings from IMDb, Rotten Tomatoes, Metacritic
- Weighted scoring system

#### 12. **Franchise/Series Detection**
- Group movie franchises (Marvel, Fast & Furious, etc.)
- Show in chronological or release order

#### 13. **Similar Movies Recommendation**
- Use TMDB's similar/recommended endpoints
- Add to meta response

#### 14. **Watch History Tracking**
- Store in Netlify Blobs with user ID
- Filter out watched movies

#### 15. **Quality Tiers**
- Create 'Premium' vs 'Standard' catalog tiers
- Premium: Only 7.0+ rating, 1000+ votes
- Standard: Current thresholds

---

### Developer Experience Features

#### 16. **Admin Dashboard**
- View current catalog statistics
- Manually trigger updates
- Monitor API usage
- See error logs

#### 17. **A/B Testing Framework**
- Test different scoring algorithms
- Compare user engagement
- Data-driven optimization

#### 18. **Analytics Integration**
- Track most-viewed genres
- Popular movies
- User geography
- Peak usage times

---

## Implementation Priority

### Phase 1 (Quick Wins - 1-2 days)
1. Search functionality
2. Trending section
3. Index optimization for meta lookup
4. TypeScript migration (constants + types)

### Phase 2 (Medium Effort - 1 week)
1. Multi-language support
2. Decade collections
3. Seasonal holiday curation
4. Error handling improvements

### Phase 3 (High Effort - 2-3 weeks)
1. User preferences system
2. Director/Actor collections
3. Award winners integration
4. Admin dashboard

### Phase 4 (Nice to Have)
1. Streaming availability
2. Watch history
3. Analytics
4. A/B testing framework

---

## Estimated Impact

| Feature | Dev Time | User Value | Technical Complexity |
|---------|----------|------------|---------------------|
| Search | 4 hours | High | Low |
| Trending | 3 hours | High | Low |
| Multi-language | 6 hours | High | Medium |
| Decade Collections | 4 hours | Medium | Low |
| Director Collections | 8 hours | Medium | Medium |
| User Preferences | 16 hours | High | High |
| Admin Dashboard | 24 hours | Medium | High |
| Streaming Availability | 16 hours | Very High | High |

---

## Testing Recommendations

1. **Add integration tests** for TMDB API failures
2. **Load testing** for rate limiter under concurrent requests
3. **Catalog consistency tests** to ensure no duplicate movies
4. **Performance benchmarks** for cold start times
5. **E2E tests** using Playwright for Stremio UI

---

## Monitoring Recommendations

1. **Error tracking**: Integrate Sentry or similar
2. **Performance monitoring**: Track function execution time
3. **API usage tracking**: Monitor TMDB rate limit headroom
4. **User analytics**: Basic anonymized usage stats
5. **Health checks**: Automated alerts when catalog is stale

---

## Security Recommendations

1. **API Key Rotation**: Automate TMDB API key rotation
2. **Rate Limit Enhancement**: Add IP-based blocking for abuse
3. **Input Validation**: Sanitize all user inputs (genre codes, IDs)
4. **CORS Restrictions**: Tighten allowed origins if needed
5. **Dependency Scanning**: Use Dependabot or Snyk

---

## Cost Optimization

### Current Usage (Free Tier)
- **TMDB API**: ~627 calls/day = 18,810/month (unlimited free)
- **Netlify Functions**: ~1-2GB bandwidth/month (100GB free)
- **Netlify Blobs**: ~10MB storage (unlimited free)
- **GitHub Actions**: ~300 minutes/month (2000 free for public repos)

### With New Features
Adding search, trending, and language support:
- **TMDB API**: ~1,200 calls/day = 36,000/month (still free)
- **Netlify Functions**: ~5GB bandwidth/month (still well within free tier)

**Conclusion**: All recommended features stay within free tier limits.

---

## Scalability Roadmap

### If User Base Grows >10,000 Users

1. **Move to Netlify Edge Functions** for lower latency
2. **Implement CDN caching** with Cloudflare
3. **Use Redis** for rate limiting state
4. **Add database** (Supabase/PlanetScale) for user data
5. **Horizontal scaling** with multiple Netlify sites
6. **Consider paid TMDB tier** if hitting rate limits

---

## Documentation Improvements

1. Add **API documentation** for developers
2. Create **user guide** with screenshots
3. Add **troubleshooting FAQ**
4. Document **nightly update process** flow diagram
5. Add **contributing guidelines** with code standards
