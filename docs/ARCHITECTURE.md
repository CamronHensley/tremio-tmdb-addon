# Architecture Documentation

## Overview

The TMDB Genre Explorer is a serverless Stremio addon that curates movies by genre using The Movie Database (TMDB) API. The system features intelligent content rotation, sophisticated deduplication, and runs entirely on free-tier services.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Actions                           │
│                    (Midnight UTC Daily Trigger)                  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           scripts/nightly-update.js                       │  │
│  │                                                            │  │
│  │  1. Fetch 20 pages from TMDB (22 genres × 20 pages)      │  │
│  │  2. Load previous catalog from Netlify Blobs             │  │
│  │  3. Adaptive fetching (check freshness, fetch more)      │  │
│  │  4. Score movies (ScoringEngine)                          │  │
│  │  5. Deduplicate (5-tier system)                           │  │
│  │  6. Merge with cache (HybridCache)                        │  │
│  │  7. Fetch details for selected movies                     │  │
│  │  8. Store to Netlify Blobs                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               ↓
                    ┌──────────────────────┐
                    │   Netlify Blobs      │
                    │   (Storage Layer)    │
                    │                      │
                    │  - catalog           │
                    │  - metadata          │
                    │  - catalog-previous  │
                    │  - recent-movies     │
                    └──────────────────────┘
                               ↑
                               │
┌──────────────────────────────┼───────────────────────────────────┐
│                    Netlify Functions                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              netlify/functions/addon.js                   │  │
│  │                                                            │  │
│  │  1. Rate limiting (120 req/min per IP)                   │  │
│  │  2. Parse request (manifest/catalog/meta)                │  │
│  │  3. Load catalog from Netlify Blobs                      │  │
│  │  4. Apply user genre filter                              │  │
│  │  5. Paginate results (skip parameter)                    │  │
│  │  6. Return JSON (5-minute cache headers)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               ↓
                    ┌──────────────────────┐
                    │   Stremio Client     │
                    │   (User Device)      │
                    └──────────────────────┘
```

## Core Components

### 1. Constants ([lib/constants.js](lib/constants.js))

Central configuration file defining:

- **22 Genres**: Including special categories (SUPERHEROES, ANIMATION_KIDS/ADULT, ACTION_CLASSIC)
- **Quality Thresholds**: Per-genre minimum requirements
- **Daily Strategies**: 7 rotation themes (one per day)
- **Page Rotation**: 28-day cycle (currently 20 pages)
- **Genre Personalities**: Seasonal bonuses and scoring modifiers
- **Configurable Settings**: MOVIES_PER_GENRE (default: 100)

### 2. TMDB Client ([lib/tmdb-client.js](lib/tmdb-client.js))

Handles all TMDB API interactions:

- **Rate limiting**: Respects 429 responses, retries with backoff
- **Batch fetching**: Groups requests with delays
- **Data transformation**: Converts TMDB to Stremio format
- **IMDB ID priority**: Uses IMDB IDs when available for streaming addon compatibility
- **Request counting**: Tracks API usage for monitoring

### 3. Scoring Engine ([lib/scoring-engine.js](lib/scoring-engine.js))

Ranks movies using a sophisticated scoring system:

#### Base Score (0-100 points)
- **Popularity**: 40% weight (normalized to 0-100)
- **Rating**: 35% weight (vote_average × 3.5)
- **Vote Count**: 25% weight (log scale)

#### Strategy Modifiers (7 Daily Themes)
- **RISING_STARS**: Recent films (+20% if age ≤1 year)
- **CRITICAL_DARLINGS**: High ratings emphasized (×rating/8)
- **HIDDEN_GEMS**: Low popularity + high rating (+30%)
- **BLOCKBUSTERS**: High vote counts (+20%)
- **FRESH_RELEASES**: Very recent films (+50% if current year)
- **TIMELESS_CLASSICS**: Old films with high votes (+30%)
- **AUDIENCE_FAVORITES**: Vote count heavily weighted

#### Genre Personalities
Each genre has unique modifiers:
- **Seasonal boosts**: Horror +25% in October, Romance +15% in Feb/Dec
- **Era bonuses**: Classic Action +20% for 1980s-1990s
- **Franchise bonuses**: Superheroes, Sci-Fi, Animation
- **Quality emphasis**: Adult Animation weights critical acclaim 1.3×

#### Additional Factors
- **Controlled randomization**: Deterministic 0-15% boost (same seed daily)
- **Historical penalty**: 30% reduction for recently shown movies (currently disabled)

### 4. Deduplication System ([lib/deduplication.js](lib/deduplication.js))

**1,004 lines** of sophisticated logic ensuring each movie appears in exactly one genre.

#### 5-Tier Assignment System

##### Tier 1: Absolute Isolation (Highest Priority)
Movies in these categories NEVER appear elsewhere:

1. **Superheroes**
   - Title-based detection (regex matching Marvel, DC characters)
   - Includes animated superhero movies (e.g., Spider-Verse)

2. **Animation**
   - **Japanese anime**: Completely blocked (language detection)
   - **Kids**: Has Family tag OR rating <7.5
   - **Adult**: No Family tag AND rating ≥7.5

3. **TV Movies**: All tagged as TV Movie
4. **Documentaries**: All tagged as Documentary

##### Tier 2: Sci-Fi vs Fantasy
Strict separation between these overlapping genres:
- Movies with ONLY Sci-Fi tag → Sci-Fi
- Movies with ONLY Fantasy tag → Fantasy
- Movies with BOTH → Use primary genre (first in TMDB genre_ids)

##### Tier 3: Specificity Rules
These genres always win over generic Drama/Action:
- **War**: All war-tagged movies
- **History**: All history-tagged movies
- **Horror**: All horror-tagged movies

##### Tier 4: Era-Based Splits
- **Action pre-2000** → Classic Action
- **Action post-2000** → Action

##### Tier 5: Primary Genre Logic
All other movies use TMDB's first genre tag:
- Prevents Drama from stealing War/History movies
- Blocks special categories from accepting non-matching content

#### Additional Rules

**Pre-1970s Limit**: Maximum 5% old movies per genre (5 out of 100)
- Prevents genres from being dominated by classics
- Ensures fresh, modern content

**Quality Filtering**:
- **High-quality exception**: Rating ≥7.5 + votes ≥500 needs only popularity ≥5
  - Captures iconic classics like Schindler's List, The Dark Knight
- **Standard threshold**: votes ≥300, rating ≥5.5, popularity ≥15

**Backfilling**: If a genre is short on movies:
1. Try remaining movies with normal quality threshold
2. Lower quality (votes ≥50, rating ≥5.0)
3. Aggressive fill (votes ≥10, rating ≥4.0)

#### Detailed Logging
The system outputs comprehensive reports:
- **Assignment breakdown**: Count per tier
- **Sample movies**: Examples from each tier
- **Rejection reasons**: Why movies were filtered out
- **Category debugger**: Detailed tracking per genre
- **Primary genre mismatches**: Suspicious TMDB tagging

### 5. Hybrid Cache ([lib/hybrid-cache.js](lib/hybrid-cache.js))

Optimizes API usage by merging fresh and cached data:

**Current Configuration**: 100% fresh (building catalog)
- Fetches 20 pages per genre (~400 movies)
- All 100 slots filled with fresh, quality-filtered movies

**Optimized Configuration**: 30% fresh + 70% cached
- Fetch 2-5 pages (30 fresh movies)
- Fill remaining 70 slots from yesterday's catalog
- Reduces API calls from 2,640 to ~800 (70% reduction)

**Deduplication**: Uses TMDB IDs to avoid duplicates across fresh and cached content

### 6. Cache Manager ([lib/cache-manager.js](lib/cache-manager.js))

Wrapper for Netlify Blobs storage:

**Stored Data**:
- `catalog`: Full movie catalog with metadata
- `metadata`: Health check info (update time, movie count, strategy)
- `catalog-previous`: Yesterday's catalog (for hybrid caching)
- `recent-movies`: Last 4,000 movie IDs (for variety tracking)

**Features**:
- 24-hour TTL checks
- Cache age monitoring
- Movie details caching (meta requests)

### 7. Rate Limiter ([lib/rate-limiter.js](lib/rate-limiter.js))

In-memory request throttling:

- **Limit**: 120 requests per minute per IP
- **Algorithm**: Sliding window
- **Headers**: Retry-After, X-RateLimit-*
- **Cleanup**: Automatic removal of old entries

**Limitations**:
- Serverless functions are stateless
- Counter resets on cold starts
- Acceptable for free-tier protection

### 8. Addon Function ([netlify/functions/addon.js](netlify/functions/addon.js))

Main Stremio endpoint handling three resource types:

#### Manifest
Returns addon metadata and available catalogs:
```json
{
  "id": "community.tmdb.genres",
  "version": "1.3.0",
  "name": "TMDB Genre Explorer",
  "catalogs": [
    {
      "type": "movie",
      "id": "tmdb-action",
      "name": "Action Movies",
      "extra": [{"name": "skip", "isRequired": false}]
    }
    // ... 21 more genres
  ]
}
```

#### Catalog
Returns paginated movie lists:
- Default: 100 movies per request
- Pagination: `skip` parameter for infinite scrolling
- Cache: 5-minute headers, ETag for versioning

#### Meta
Returns individual movie metadata:
- Accepts both IMDB IDs (`tt1234567`) and TMDB IDs (`tmdb:123`)
- Searches across all genres
- 5-minute cache for metadata

**Routing**: Netlify.toml redirects clean URLs to function with query params

### 9. Nightly Update Script ([scripts/nightly-update.js](scripts/nightly-update.js))

Orchestrates the daily catalog update:

1. **Initialize**: Create TMDB client, scoring engine, deduplicator
2. **Load Previous**: Get yesterday's catalog from Blobs (for hybrid caching)
3. **Fetch**: Pull 20 pages from TMDB for each of 22 genres
4. **Adaptive**: Check freshness, fetch more pages if needed
5. **Process**: Score movies using daily strategy + genre personalities
6. **Deduplicate**: 5-tier system assigns movies to genres
7. **Merge**: Hybrid cache combines fresh with previous catalog
8. **Details**: Batch fetch full metadata for selected movies
9. **Convert**: Transform to Stremio format (prioritize IMDB IDs)
10. **Store**: Save catalog, metadata, and previous catalog to Blobs
11. **Track**: Update recent movies list for variety

**Error Handling**: Continues on individual failures, reports statistics

## Data Flow

### Update Flow (Daily at Midnight UTC)

```
GitHub Actions Trigger
  ↓
Load Environment Variables (TMDB_API_KEY, NETLIFY_ACCESS_TOKEN, etc.)
  ↓
Load Previous Catalog from Netlify Blobs
  ↓
Fetch 20 pages × 22 genres from TMDB (~8,800 movies raw)
  ↓
Score Movies (Base + Strategy + Genre Personality + Random)
  ↓
5-Tier Deduplication (Assigns each to best genre)
  ↓
Hybrid Cache Merge (Fresh + Previous)
  ↓
Batch Fetch Details for 2,200 selected movies
  ↓
Convert to Stremio Format (IMDB IDs prioritized)
  ↓
Store to Netlify Blobs (catalog + metadata + previous)
  ↓
Log Statistics (API calls, movie counts, timing)
```

### Request Flow (User Access)

```
Stremio Client Request
  ↓
Netlify Function (addon.js)
  ↓
Rate Limiter Check (120 req/min per IP)
  ↓
Parse URL (manifest/catalog/meta + config)
  ↓
Load Catalog from Netlify Blobs
  ↓
Apply User Genre Filter (if configured)
  ↓
Paginate Results (skip parameter)
  ↓
Return JSON (5-minute cache, ETag versioning)
  ↓
Stremio Client Displays Movies
```

## Performance Optimization

### API Usage
- **Current**: 2,640 calls/day (20 pages × 22 genres + 2,200 details)
- **Optimized**: ~800 calls/day (2-5 pages + 660 details with hybrid cache)
- **Free Tier**: No daily limit, ~40 req/sec max

### Caching Strategy
- **5-minute headers**: Quick refresh for testing
- **ETag versioning**: Efficient cache invalidation
- **Netlify Blobs**: Persistent storage across deployments
- **CDN caching**: Netlify's edge network

### Request Handling
- **Pagination**: 100 movies per request (prevents large responses)
- **Rate limiting**: Protects against abuse
- **Parallel fetching**: Batch API calls with delays

## Configuration

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TMDB_API_KEY` | Yes | - | TMDB API key |
| `NETLIFY_ACCESS_TOKEN` | Yes* | - | For GitHub Actions |
| `NETLIFY_SITE_ID` | Yes* | - | Netlify site ID |
| `MOVIES_PER_GENRE` | No | 100 | Movies per genre |
| `LOG_LEVEL` | No | INFO | Logging verbosity |

*Required for automated updates only

### Configurable Values in Code

**[lib/constants.js](lib/constants.js)**:
- `MOVIES_PER_GENRE`: 100 (via environment variable)
- `PAGE_ROTATION`: Currently 20 pages (line 84)
- `QUALITY_THRESHOLDS`: Per-genre minimums (lines 48-56)
- `CACHE_CONFIG.catalogTTL`: 24 hours (line 171)

**[scripts/nightly-update.js](scripts/nightly-update.js)**:
- `MAX_PAGES`: 20 (line 80)
- `TARGET_NEW_MOVIES`: 30 (line 79)
- Fresh count in merge: 100 (line 176)

**[netlify/functions/addon.js](netlify/functions/addon.js)**:
- Cache max-age: 300 seconds (5 minutes, line 30)
- Pagination size: 100 movies (line 126)
- Rate limit: 120 req/min (line 19)

## Testing

### Unit Tests (Jest)
- **[lib/__tests__/scoring-engine.test.js](lib/__tests__/scoring-engine.test.js)**: 300+ tests
  - All 7 strategies
  - Genre personalities
  - Quality thresholds
  - Controlled randomization

- **[lib/__tests__/deduplication.test.js](lib/__tests__/deduplication.test.js)**
  - 5-tier assignment
  - Quality filtering
  - Genre filling

### Coverage
- Target: 70% (jest.config.js)
- Focus: Core business logic (scoring, deduplication)

### Local Testing
```bash
# Run update locally
npm run update

# Test functions
npm run dev
```

## Monitoring & Health

### Health Endpoint
`GET /health` returns:
```json
{
  "status": "healthy",
  "cache": {
    "updatedAt": "2025-01-15T00:05:23.000Z",
    "ageHours": 2.5,
    "strategy": "RISING_STARS",
    "totalMovies": 2200,
    "apiRequests": 2640
  }
}
```

### Logging
- GitHub Actions logs: Update process, API calls, statistics
- Netlify Function logs: Request handling, rate limiting, errors
- Structured format: JSON in production, human-readable in dev

### Alerts
**Manual monitoring** (no automated alerts):
- Check GitHub Actions tab for failed workflows
- Monitor Netlify function logs for errors
- Verify /health endpoint shows recent update

## Deployment

### Initial Setup
1. Fork repository
2. Deploy to Netlify (no build needed)
3. Set environment variables in Netlify
4. Add GitHub secrets (same 3 variables)
5. Run initial workflow in GitHub Actions

### Updates
- **Automatic**: GitHub Actions at midnight UTC daily
- **Manual**: Trigger workflow from Actions tab
- **Code changes**: Push to main → Netlify auto-deploys

### Rollback
See [REVERT-GUIDE.md](REVERT-GUIDE.md) for emergency revert procedures.

## Limitations & Trade-offs

### Current Design Decisions

1. **20 Pages (Building Catalog)**
   - **Pro**: Comprehensive coverage, captures all famous movies
   - **Con**: Higher API usage (2,640 calls/day)
   - **Future**: Reduce to 2-5 pages when catalog is stable

2. **Japanese Anime Excluded**
   - **Pro**: Focuses on Western content, avoids translation issues
   - **Con**: Users who want anime can't get it
   - **Future**: Make configurable via environment variable

3. **5% Pre-1970s Cap**
   - **Pro**: Ensures modern, fresh content
   - **Con**: Western and History genres might benefit from more classics
   - **Future**: Make configurable per genre

4. **In-Memory Rate Limiter**
   - **Pro**: Simple, no external dependencies
   - **Con**: Resets on cold starts, not shared across functions
   - **Future**: Use Redis or DynamoDB for persistence

5. **Title-Based Superhero Detection**
   - **Pro**: Catches most superhero movies
   - **Con**: Misses non-English titles, alternate spellings
   - **Future**: Combine with genre tags and franchise detection

6. **5-Minute Cache**
   - **Pro**: Quick refresh for testing and development
   - **Con**: More requests to Netlify
   - **Future**: Increase to 6 hours for production stability

## Future Enhancements

### Short Term
1. Update UI to show all 22 genres
2. Add monitoring/alerting for failed updates
3. Document optimal hybrid cache configuration
4. Add architecture diagram to README

### Long Term
1. User-configurable pre-1970s limit
2. Optional Japanese anime inclusion
3. Persistent rate limiter (Redis)
4. Franchise detection for better deduplication
5. Multi-language support
6. Configurable cache durations
7. Manual trigger endpoint
8. Health check webhooks

## References

- [TMDB API Documentation](https://developers.themoviedb.org/)
- [Stremio Addon SDK](https://github.com/Stremio/stremio-addon-sdk)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Netlify Blobs](https://docs.netlify.com/blobs/overview/)
- [GitHub Actions](https://docs.github.com/en/actions)
