# Quick Reference Guide - Stremio TMDB Addon

## Project Overview

**Purpose**: A serverless Stremio addon that provides genre-based movie discovery with daily rotating content from TMDB.

**Architecture**: Netlify Functions (serverless) + GitHub Actions (scheduled updates) + Netlify Blobs (storage)

**Cost**: $0/month (runs entirely on free tiers)

---

## Package.json Purpose Summary

```json
{
  "name": "stremio-tmdb-genre-addon",
  "description": "Stremio addon displaying movies by genre from TMDB with intelligent daily rotation"
}
```

### What This Project Does

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Data Source** | Fetches movie metadata | TMDB API (free) |
| **Storage** | Stores processed catalog | Netlify Blobs |
| **API** | Serves Stremio addon manifest/catalogs | Netlify Functions |
| **Updates** | Nightly refresh at midnight UTC | GitHub Actions |
| **UI** | Genre configuration page | Static HTML/JS |

---

## Key Scripts Explained

| Script | Command | Purpose |
|--------|---------|---------|
| `update` | `node scripts/nightly-update.js` | Manually run catalog update |
| `dev` | `netlify dev` | Local development server |
| `test` | `jest` | Run test suite |
| `test:watch` | `jest --watch` | Live testing during development |
| `test:coverage` | `jest --coverage` | Generate coverage report |

---

## File Structure Breakdown

```
stremio-tmdb-addon/
│
├── netlify/functions/          # Serverless API endpoints
│   ├── addon.js               # Main Stremio protocol handler
│   └── health.js              # Health check endpoint
│
├── lib/                       # Shared utilities
│   ├── constants.js          # Genre definitions, config
│   ├── tmdb-client.js        # TMDB API wrapper
│   ├── hybrid-cache.js       # Cache merging logic
│   └── rate-limiter.js       # Request throttling
│
├── scripts/
│   └── nightly-update.js     # GitHub Actions job
│
├── public/
│   └── index.html            # User configuration UI
│
└── package.json              # Dependencies & scripts
```

---

## Core Features

### 1. Daily Rotation Strategies

| Day | Strategy | What Users See |
|-----|----------|---------------|
| Sunday | Audience Favorites | Most-voted crowd picks |
| Monday | Rising Stars | Recent films gaining momentum |
| Tuesday | Critical Darlings | Highly-rated acclaimed films |
| Wednesday | Hidden Gems | Underrated quality discoveries |
| Thursday | Blockbusters | Big-budget crowd-pleasers |
| Friday | Fresh Releases | Movies from last 90 days |
| Saturday | Timeless Classics | Beloved older films |

### 2. Genre Support

**Current**: 19+ genres including Action, Comedy, Horror, Sci-Fi, Drama, etc.

**Special Genres**:
- SEASONAL: Changes based on holidays (Halloween, Christmas, etc.)
- ACTION_CLASSIC: Classic action films
- ANIMATION_KIDS / ANIMATION_ADULT: Age-targeted animation
- SUPERHEROES: Marvel/DC films
- Custom genres: Cars, Martial Arts, Parody, Stand-Up Comedy

### 3. Quality Filtering

| Genre | Min Votes | Min Rating | Min Popularity |
|-------|-----------|------------|----------------|
| Default | 100 | 5.5 | 2 |
| Documentary | 50 | 5.5 | 1 |
| Horror | 100 | 5.0 | 2 |
| TV Movie | 50 | 5.5 | 2 |

---

## API Usage Stats

### Nightly Update
- **Discovery calls**: ~57 (19 genres × 3 pages)
- **Detail calls**: ~570 (30 movies × 19 genres)
- **Total**: ~627 API calls
- **Frequency**: Once per day at midnight UTC
- **Duration**: ~5-10 minutes

### Runtime
- **Rate limit**: 120 requests/minute per IP
- **Cache TTL**: 5 minutes (catalog), 5 minutes (meta)
- **Response time**: <100ms (cached), <500ms (cold start)

---

## Environment Variables

| Variable | Required | Purpose | Where Used |
|----------|----------|---------|------------|
| `TMDB_API_KEY` | Yes | Authenticate with TMDB | Everywhere |
| `NETLIFY_ACCESS_TOKEN` | Yes | Write to Blobs | GitHub Actions |
| `NETLIFY_SITE_ID` | Yes | Identify site | GitHub Actions + Functions |
| `MOVIES_PER_GENRE` | No | Catalog size (default: 100) | Update script |
| `LOG_LEVEL` | No | Logging verbosity | All scripts |

---

## Top 10 Code Optimizations (Priority Order)

| # | Optimization | Impact | Effort |
|---|-------------|--------|--------|
| 1 | Add movie ID index for meta lookups | 10x faster | 2 hours |
| 2 | Parallel batch processing for updates | 40% faster updates | 3 hours |
| 3 | Implement stale-while-revalidate caching | 80% fewer blob reads | 2 hours |
| 4 | Add request ID tracking | Better debugging | 1 hour |
| 5 | TypeScript migration (constants first) | Type safety | 8 hours |
| 6 | Compress catalog responses | 60% bandwidth savings | 2 hours |
| 7 | Persistent rate limiter state | True rate limiting | 4 hours |
| 8 | Environment variable validation | Prevent runtime errors | 1 hour |
| 9 | Modularize handlers | Better maintainability | 6 hours |
| 10 | Add retry logic with exponential backoff | Better reliability | 3 hours |

**Total estimated time**: ~32 hours (~1 week for one developer)

---

## Top 10 New Features (By User Value)

| # | Feature | User Value | Dev Time | Complexity |
|---|---------|-----------|----------|------------|
| 1 | **Search functionality** | Very High | 4 hours | Low |
| 2 | **Trending section** | Very High | 3 hours | Low |
| 3 | **Multi-language support** | High | 6 hours | Medium |
| 4 | **Streaming availability** | Very High | 16 hours | High |
| 5 | **User preferences/favorites** | High | 16 hours | High |
| 6 | **Decade collections (80s, 90s)** | High | 4 hours | Low |
| 7 | **Director/Actor collections** | High | 8 hours | Medium |
| 8 | **Award winners (Oscars, etc.)** | High | 8 hours | Medium |
| 9 | **Similar movies recommendation** | Medium | 6 hours | Medium |
| 10 | **Watch history tracking** | Medium | 12 hours | High |

**Quick wins (< 1 day)**: Features #1, #2, #3, #6

---

## Feature Implementation Examples

### Example 1: Add Search (Easiest)

```javascript
// In addon.js, add new handler:
async function handleSearch(query) {
  const catalogData = await getCatalogData();
  const allMovies = Object.values(catalogData.genres).flat();

  const results = allMovies.filter(movie =>
    movie.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 100);

  return jsonResponse({ metas: results });
}

// Update ADDON_META in constants.js:
resources: ['catalog', 'meta', 'search']
```

**Result**: Users can search for movies by title

---

### Example 2: Add Trending Section

```javascript
// In constants.js, add:
GENRES: {
  TRENDING: { id: null, name: 'Trending Now', code: 'TRENDING', isTrending: true },
  // ... existing genres
}

// In nightly-update.js, add special handling:
if (genre.isTrending) {
  const trending = await tmdb.fetchTrending('movie', 'week');
  moviesByGenre[genreCode] = trending.results;
  continue;
}
```

**Result**: Shows currently viral movies

---

### Example 3: Add 90s Movies Collection

```javascript
// In constants.js:
DECADE_90S: {
  id: 18, // Drama genre as base
  name: '1990s Classics',
  code: 'DECADE_90S',
  decade: 1990
}

// In nightly-update.js:
const strategyParams = genre.decade ? {
  'primary_release_date.gte': `${genre.decade}-01-01`,
  'primary_release_date.lte': `${genre.decade + 9}-12-31`
} : {};
```

**Result**: Nostalgic 90s movie catalog

---

## Performance Benchmarks

### Current Performance
- **Cold start**: ~800ms
- **Warm response**: ~50ms
- **Catalog size**: ~1.5MB (compressed: ~300KB)
- **Monthly bandwidth**: ~2GB

### After Optimizations
- **Cold start**: ~500ms (with compression)
- **Warm response**: ~30ms (with index)
- **Catalog size**: ~600KB (60% reduction)
- **Monthly bandwidth**: ~800MB (60% reduction)

---

## Testing Coverage

### Current Tests
- Scoring engine unit tests
- Deduplication logic tests
- Rate limiting tests
- Error handling tests

### Recommended Additional Tests
1. TMDB API integration tests (with mocks)
2. Netlify Blobs integration tests
3. End-to-end Stremio protocol tests
4. Performance regression tests
5. Load tests for rate limiter

---

## Deployment Checklist

### Initial Setup
- [ ] Fork repository
- [ ] Get TMDB API key
- [ ] Deploy to Netlify
- [ ] Set environment variables in Netlify
- [ ] Set GitHub secrets
- [ ] Run initial workflow
- [ ] Test addon installation

### Adding Features
- [ ] Write unit tests
- [ ] Update constants.js if needed
- [ ] Modify nightly-update.js for data fetching
- [ ] Update addon.js for serving
- [ ] Test locally with `npm run dev`
- [ ] Deploy to Netlify
- [ ] Verify in Stremio

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Addon shows no movies | Check `/health` endpoint, verify GitHub Action ran |
| Movies not updating | Check GitHub Actions logs, verify TMDB API key |
| Rate limit errors | Check IP, verify rate limiter config |
| Slow responses | Check Netlify function logs, verify blob cache |
| Missing environment variables | Verify both Netlify and GitHub have all 3 required vars |

---

## Useful Commands

```bash
# Local development
npm install
npm run dev

# Testing
npm test                    # Run all tests
npm run test:watch         # Live testing
npm run test:coverage      # Coverage report

# Manual update (requires env vars)
npm run update

# Check health
curl https://your-site.netlify.app/health

# View catalog
curl https://your-site.netlify.app/manifest.json
```

---

## Resource Links

- **TMDB API Docs**: https://developers.themoviedb.org/3
- **Stremio Addon SDK**: https://github.com/Stremio/stremio-addon-sdk
- **Netlify Functions**: https://docs.netlify.com/functions/overview/
- **Netlify Blobs**: https://docs.netlify.com/blobs/overview/
- **GitHub Actions**: https://docs.github.com/actions

---

## Next Steps

### Immediate (This Week)
1. Implement search functionality
2. Add trending section
3. Optimize meta lookup with index
4. Add request ID tracking

### Short Term (This Month)
1. TypeScript migration
2. Multi-language support
3. Decade collections
4. Improve error handling

### Long Term (This Quarter)
1. User preferences system
2. Director/actor collections
3. Streaming availability
4. Admin dashboard

---

## Contributing

Want to add features? Follow this workflow:

1. **Fork** the repository
2. **Create** a feature branch
3. **Write** tests for new functionality
4. **Implement** the feature
5. **Test** locally with `npm run dev`
6. **Submit** a pull request

Key files to modify:
- **New genres**: `lib/constants.js`
- **Data fetching**: `scripts/nightly-update.js`
- **API serving**: `netlify/functions/addon.js`
- **UI**: `public/index.html`

---

## License

MIT License - Free to use, modify, and distribute
