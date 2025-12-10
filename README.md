# TMDB Genre Explorer - Stremio Addon

Movie catalog addon for Stremio. 28 genres, 100 movies each, updated nightly.

---

## Quick Start

```bash
# Install
npm install

# Run catalog builder
node scripts/nightly-update.js

# Test locally
npm run dev
```

**Environment Variables** (`.env` file):
```env
TMDB_API_KEY=your_key
NETLIFY_SITE_ID=your_site_id
NETLIFY_ACCESS_TOKEN=your_token
OMDB_API_KEY=your_omdb_key      # Optional - for IMDb ratings (all-time popularity)
FANART_API_KEY=your_fanart_key  # Optional - for HD posters
```

---

## What Works ✅

- Stremio API endpoints (manifest, catalog, meta)
- TMDB API integration
- OMDb/IMDb ratings integration for all-time popularity sorting
- Wikidata streaming originals detection (Netflix, Disney+, Hulu, etc.)
- Netlify deployment (GitHub → Netlify automatic)
- Movie display in Stremio (100 per genre row)
- Nightly updates via GitHub Actions

---

## How It Works

**Dual-Fetch Strategy for All-Time Classics + Recent Hits:**
1. **Dual fetch from TMDB** (overcomes recency bias):
   - 15 pages of top-rated movies (vote_average.desc) - gets classics like Shawshank Redemption
   - 15 pages of popular movies (popularity.desc) - gets recent hits like Top Gun Maverick
   - Merge and deduplicate by TMDB ID (~600 unique movies per genre)
2. Filter: minVotes 100, popularity 5 (no rating filter for all-time classics)
3. Global deduplication (Set of IDs across all genres)
4. Fetch IMDb ratings from OMDb API for ALL movies (optional, with persistent caching)
5. Sort by weighted score (rating × log10(votes)) for true all-time popularity
6. Cache ALL movie metadata (OMDb, Fanart.tv, Wikidata)
7. Query Wikidata for streaming originals (Netflix, Disney+, etc.)
8. **Store in Netlify Blobs:**
   - `catalog-full-cache` - All fetched movies (~600 per genre) for rotation pool
   - `catalog` - Top 100 per genre displayed in Stremio
9. **Daily rotation** (25% refresh):
   - Rotates 25 movies out, 25 new ones in (per genre)
   - Classic protection (IMDb 8.5+ rotate slower)
   - 14-day cooldown before re-promotion
   - New releases get priority boost

---

## Next Steps

1. Run `node scripts/nightly-update.js` to populate catalog
2. First run will fetch ~7,000-8,000 movies (dual-fetch strategy)
3. Cache will build over ~8-9 days for OMDb (950 movies/day limit)
4. Subsequent runs only fetch new movies (<100/day)
5. **Rotation:** Run `node scripts/rotate-catalog.js` daily to refresh 25% of displayed movies
   - Use `--dry-run` flag to preview changes
   - Rotates from cache pool (~600 per genre) to display catalog (100 per genre)
6. Optional: Use `node scripts/prune-cache.js --dry-run` to preview cache management
7. Test in Stremio app

---

## Architecture

```
GitHub Actions (nightly) → TMDB API + OMDb API + Wikidata → Netlify Blobs → Netlify Functions → Stremio
```

**Files:**
```
lib/
├── tmdb-client.js         # TMDB API wrapper
├── omdb-client.js         # OMDb API wrapper (IMDb ratings)
├── wikidata-client.js     # Wikidata SPARQL queries (streaming originals)
├── fanart-client.js       # Fanart.tv API wrapper (HD posters)
├── constants.js           # Genre definitions + streaming services
├── cache-manager.js       # Netlify Blobs storage
├── logger.js              # Logging
└── rate-limiter.js        # Rate limiting

netlify/functions/
├── addon.js               # Stremio API (manifest/catalog/meta)
├── poster.js              # Poster overlay with streaming badges
└── health.js              # Health check

scripts/
├── nightly-update.js      # Catalog builder with dual-fetch strategy
├── rotate-catalog.js      # Daily catalog rotation (25% refresh)
└── prune-cache.js         # Cache pruning tool (tiered: active/archive/pruned)
```

---

## API Endpoints

- `GET /manifest.json` - Addon manifest
- `GET /catalog/movie/{genre}.json?skip=0` - Movies (100 per page)
- `GET /meta/movie/{id}.json` - Movie metadata
- `GET /.netlify/functions/poster?path=/w500/abc.jpg&badge=NETFLIX` - Poster with badge overlay
- `GET /.netlify/functions/health` - Catalog status

---

## Scripts

### Nightly Update
Fetches and caches movies from TMDB, OMDb, and Wikidata:
```bash
node scripts/nightly-update.js
```
- Fetches ~600 movies per genre using dual-fetch strategy
- Enriches with IMDb ratings, Fanart.tv posters, streaming badges
- Saves two blobs: `catalog-full-cache` (all movies) and `catalog` (top 100 per genre)

### Catalog Rotation
Rotates 25% of displayed movies daily to keep catalog fresh:
```bash
node scripts/rotate-catalog.js           # Apply changes
node scripts/rotate-catalog.js --dry-run # Preview changes
```
- Rotates 25 movies out, 25 new ones in (per genre)
- Protects classics (IMDb 8.5+) from frequent rotation
- 14-day cooldown before movies can return
- Prioritizes new releases (< 1 year old)

### Cache Pruning
Manages cache tiers and removes low-value movies:
```bash
node scripts/prune-cache.js --dry-run    # Preview changes
node scripts/prune-cache.js              # Apply changes
```
- **Active Tier** (0-99): Currently in Stremio catalog
- **Archive Tier** (100-499): Available for rotation
- **Prune Tier** (500+): Lowest performers, eligible for removal

---

## Configuration

**Quality Filters** (`scripts/nightly-update.js`):
```javascript
movie.vote_count >= 100 &&
movie.popularity >= 5
```

**Movies Per Genre** (environment variable or default):
```env
MOVIES_PER_GENRE=100  # Optional, defaults to 100
```

**GitHub Actions Workflows** (manual trigger only for now):
```yaml
# .github/workflows/nightly-update.yml
# cron: '0 0 * * *'  # Nightly catalog update (disabled)

# .github/workflows/catalog-rotation.yml
# cron: '0 6 * * *'  # Daily rotation at 6 AM UTC (disabled)
```

---

## Genres (30 Total)

**Seasonal** (dynamic based on date), Action, Classic Action, Adventure, Animation (Kids), Animation (Adult), Cars & Racing, Comedy, Crime, Disaster, Documentary, Drama, Family, Fantasy, History, Horror, Martial Arts, Music, Mystery, Parody, Romance, Sci-Fi, Sports, Stand-Up Comedy, Superheroes, Thriller, True Crime, TV Movie, War, Western

---

## Troubleshooting

**Clear catalog:**
```bash
node -e "
const { getStore } = require('@netlify/blobs');
require('dotenv').config();
const store = getStore({
  name: 'tmdb-catalog',
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_ACCESS_TOKEN
});
(async () => {
  await store.delete('catalog');
  await store.delete('metadata');
  console.log('Cleared');
})();
"
```

**Check GitHub Actions:** GitHub → Actions → Nightly Update Workflow

**Check health:** `https://your-addon.netlify.app/.netlify/functions/health`

---

## Philosophy

- **Simple > Complex** - Straightforward approach, no over-engineering
- **Trust TMDB** - Use their popularity rankings
- **Working > Perfect** - Get 100 movies per genre, iterate later
- **Maintainable** - Clean, readable code

---

## Recent Changes

**2025-12-09 - Cache Expansion & Tiered Pruning System:**
- Implemented dual-fetch strategy to overcome TMDB's recency bias
- Now fetches **15 pages of top-rated** (classics) + **15 pages of popular** (recent hits) per genre
- Expands cache from ~2,800 to ~7,000-8,000 total movies (after deduplication)
- ALL fetched movies get cached (OMDb, Fanart.tv, Wikidata) - not just the displayed 100
- Created `scripts/prune-cache.js` for managing large caches
- **Tiered system**: Active (500/genre) → Archive (1000/genre) → Pruned
- **Protection rules**: Auto-protects high-rated (≥8.5), popular (≥100k votes), and recent (last 2 years) movies
- Conservative pruning: keeps OMDb/Fanart/Wikidata caches to avoid re-fetching
- Dry-run mode for previewing changes before applying
- Enables catalog rotation without API calls (just promote from archive tier)

**2025-12-09 - Persistent Caching for All External APIs:**
- Implemented comprehensive persistent caching using Netlify Blobs for all external API calls
- **OMDb/IMDb ratings cache**: First run ~2,800 calls, subsequent runs <100 (stays within 1,000/day free tier)
- **Fanart.tv posters cache**: First run ~2,800 calls, subsequent runs <100 (stays within 7,500/day free tier)
- **Wikidata streaming originals cache**: Significantly reduces SPARQL queries on subsequent runs
- All caches stored in Netlify Blobs: `imdb-ratings`, `fanart-posters`, `wikidata-streaming`
- Cache includes both positive results (found data) and negative results (404s, not found) to avoid redundant API calls
- Nightly updates now only fetch data for new movies not in cache
- Performance improvement: Subsequent runs complete in <1 minute instead of 5-10 minutes

**2025-12-09 - OMDb/IMDb Integration for All-Time Popularity:**
- Added OMDb API integration to fetch IMDb ratings and vote counts
- Implemented weighted score sorting: `rating × log10(votes)`
- Movies now sorted by all-time popularity (IMDb data) instead of TMDB's recency-biased popularity
- Example: The Shawshank Redemption (8.5 × log10(2M votes)) = 54.1 weighted score
- Free OMDb API tier: 1,000 requests/day (sufficient with caching)
- Optional feature (falls back to TMDB popularity if API key not provided)
- New `lib/omdb-client.js` module with batch fetching, rate limiting, and persistent caching
- Catalog now shows true "all-time most popular" movies based on IMDb community ratings

**2025-12-08 - Removed Rating Filter for All-Time Popular Movies:**
- Removed `vote_average >= 5.0` filter to include cult classics and controversial films
- Now prioritizes popularity over ratings for true "all-time popular" catalog
- Allows polarizing but popular films to appear (previously excluded by rating threshold)
- Better represents what people actually watch vs. just highly-rated content
- Filters remain: `vote_count >= 100` and `popularity >= 5`

**2025-12-08 - Fanart.tv High-Quality Posters:**
- Integrated Fanart.tv API for superior poster quality
- **Smart poster selection**: Prioritizes textless posters (universal/no text), then English, then most-liked
- Automatically replaces TMDB posters with Fanart.tv versions when available
- Falls back to TMDB posters if Fanart.tv doesn't have the movie
- Optional feature (requires free Fanart.tv API key)
- Streaming original badges work with both TMDB and Fanart.tv posters
- Poster function updated to handle full URLs (not just TMDB paths)
- **Persistent caching**: Poster URLs stored in Netlify Blobs, reused across runs
- First run: ~2,800 API calls; subsequent runs: <100 API calls (500ms rate limit)

**2025-12-08 - Seasonal/Holiday Movies Genre:**
- Added dynamic "Seasonal" genre that changes based on current date
- 8 seasonal periods: Christmas, Halloween, Thanksgiving, Valentine's Day, Easter, Independence Day, New Year's, Summer
- Uses TMDB keyword search to find holiday-themed movies
- Halloween movies separated from Horror genre (family-friendly Halloween content)
- Automatically rotates content based on date ranges
- Genre appears first in catalog list

**2025-12-08 - Wikidata Streaming Originals with Visual Badges:**
- Added Wikidata SPARQL integration for accurate streaming originals detection (~95% accuracy)
- Visual badge overlays on poster images (top-right corner like Netflix)
- New serverless poster function (`netlify/functions/poster.js`) with Sharp image processing
- Detects Netflix, Disney+, Amazon Prime, Hulu, Apple TV+, HBO Max, Paramount+, Peacock, Max originals
- Uses Wikidata P449 property (original broadcaster/network)
- Batched queries (50 movies per request, 1-second rate limiting)
- **Persistent caching**: Streaming originals data stored in Netlify Blobs, reused across runs
- Custom SVG badges for each streaming service (color-coded)
- Poster URLs automatically rewritten to use badge overlay function
- New `lib/wikidata-client.js` module with SPARQL query support and persistent caching
- Streaming service constants in `lib/constants.js`
- First run: ~56 Wikidata API calls; subsequent runs: significantly reduced
- Badge images cached for 24 hours with CDN

**2025-12-08 - Improved ID Translation:**
- Added external_ids to TMDB API fetch (IMDB, Facebook, Instagram, Twitter)
- Better IMDB ID coverage using external_ids endpoint
- Added cross-platform links in metadata (IMDB, social media)
- No additional API calls - piggybacks on existing details fetch

**2025-12-08 - Dead Code Cleanup:**
- Removed 280+ lines of unused code
- Deleted `DAY_STRATEGIES`, `PAGE_ROTATION`, `GENRE_PERSONALITIES` from constants
- Removed broken `test-local.js` script (referenced deleted modules)
- Removed unused `axios` dependency
- Removed AI configuration (not implemented)
- Simplified to basic quality filtering

---

## Seasonal/Holiday Movies

The addon features a dynamic "Seasonal" genre that automatically changes based on the current date, showing holiday and seasonal-themed movies.

**How It Works:**
1. Checks current date against predefined holiday date ranges
2. Selects appropriate seasonal theme (e.g., Christmas mid-November through December)
3. Uses TMDB keyword search to find themed movies
4. Excludes inappropriate genres (e.g., Halloween excludes Horror genre)
5. Updates automatically during nightly catalog refresh

**Seasonal Periods:**
- **Christmas** (Nov 15 - Dec 31): Christmas, Santa, holiday movies
- **Halloween** (Oct 1 - Nov 5): Halloween, trick-or-treat, costume movies (NOT horror)
- **Thanksgiving** (Nov 1 - Nov 30): Thanksgiving, family gathering movies
- **Valentine's Day** (Jan 25 - Feb 20): Romance, love story movies
- **Easter** (Mar 15 - Apr 30): Easter, spring movies
- **Independence Day** (Jun 20 - Jul 10): Patriotic, 4th of July movies
- **New Year's** (Dec 26 - Jan 10): New Year's Eve, resolution movies
- **Summer** (May 20 - Sep 5): Beach, vacation movies (fallback period)

**Technical Details:**
- Uses TMDB keyword IDs for precise movie matching
- Halloween specifically excludes Horror genre (ID: 27) to keep family-friendly
- Date ranges handle year wrap-around (e.g., New Year's spans Dec-Jan)
- Priority system ensures most relevant holiday takes precedence
- Summer serves as fallback when no specific holiday is active

---

## Streaming Originals Detection

The addon uses Wikidata to accurately identify streaming service originals and displays visual badges on poster images.

**How It Works:**
1. After fetching movie data from TMDB, queries Wikidata with TMDB IDs
2. Uses SPARQL to check P449 property (original broadcaster/network)
3. Batches 50 movies per query to stay under URL limits
4. Rate-limited to 60 queries/minute (1-second delay between batches)
5. Maps Wikidata IDs to service codes (e.g., Q907311 → NETFLIX)
6. Modifies poster URLs to use badge overlay function
7. Badge overlay function fetches original poster, adds service badge in top-right corner

**Supported Services:**
- Netflix (Q907311) - Red "N" badge
- Disney+ (Q54958752) - Blue "D+" badge
- Amazon Prime Video (Q16335061) - Light blue "PV" badge
- Hulu (Q567867) - Green "H" badge
- Apple TV+ (Q63985127) - Black "tv+" badge
- HBO Max (Q30971861) - Purple "HBO" badge
- Paramount+ (Q104839407) - Blue "P+" badge
- Peacock (Q60653127) - Black "P" badge
- Max (Q115052825) - Blue "M" badge

**Visual Badges:**
- Posters for streaming originals automatically get a badge overlay
- Badge positioned in top-right corner (like Netflix does)
- Badge size scales to 16% of poster width
- Original poster URL: `https://image.tmdb.org/t/p/w500/abc.jpg`
- Badged poster URL: `https://your-addon.netlify.app/.netlify/functions/poster?path=/w500/abc.jpg&badge=NETFLIX`
- Images cached for 24 hours for performance

**Technical Details:**
- Uses `sharp` library for serverless image processing
- SVG badges embedded in poster function
- Automatic badge scaling based on poster dimensions
- 90% JPEG quality for output
- No external dependencies or API calls for badges

**Performance:**
- ~56 Wikidata API calls for 2,800 movies (50 per batch)
- ~1 minute total duration (with rate limiting)
- ~95% accuracy using Wikidata's curated data
- Badge overlay processed on-demand with CDN caching

---

## OMDb/IMDb Integration (All-Time Popularity)

The addon uses OMDb API to fetch IMDb ratings and vote counts, enabling true "all-time popularity" sorting instead of TMDB's recency-biased popularity metric.

**How It Works:**
1. After fetching movie details from TMDB, extracts IMDb IDs from external_ids
2. Queries OMDb API in batch (with 100ms rate limiting between requests)
3. Fetches IMDb rating (0-10) and vote count for each movie
4. Calculates weighted score: `rating × log10(votes)`
5. Re-sorts each genre by weighted score (descending)
6. Top 100 movies per genre based on all-time popularity

**Weighted Score Formula:**
```
weighted_score = rating × log10(votes)
```

**Examples:**
- The Shawshank Redemption: 8.5 × log10(2,000,000 votes) = **54.1**
- Popular Blockbuster: 7.0 × log10(1,000,000 votes) = **42.0**
- Cult Classic: 9.0 × log10(10,000 votes) = **36.0**

This formula balances rating quality with vote count, ensuring both highly-rated classics and widely-watched blockbusters appear in the catalog.

**API Usage:**
- Free OMDb API tier: 1,000 requests/day
- Typical catalog: ~2,800 movies
- **Persistent caching**: IMDb ratings stored in Netlify Blobs across nightly runs
- Only new movies trigger API calls (typically <100/day after initial run)
- Rate limited to 600 requests/minute (100ms delay between requests)

**Performance:**
- **First run**: ~2,800 OMDb API requests (~5-7 minutes with rate limiting)
- **Subsequent runs**: <100 OMDb API requests (only for new movies, <10 seconds)
- Cached ratings stored permanently in Netlify Blobs
- Optional feature: falls back to TMDB popularity if API key not provided
- Strategy changes from "SIMPLE_POPULAR" to "IMDB_WEIGHTED" when enabled

**Setup:**
1. Sign up for free OMDb API key at [http://www.omdbapi.com/apikey.aspx](http://www.omdbapi.com/apikey.aspx)
2. Add `OMDB_API_KEY` to `.env` file
3. Add `OMDB_API_KEY` to GitHub secrets (for Actions)
4. Add `OMDB_API_KEY` to Netlify environment variables
5. Run nightly update to fetch IMDb ratings

---

## Cache Management & Pruning

The addon includes a tiered cache pruning system to manage large movie collections while preserving valuable data.

### Cache Expansion Strategy

**Dual-Fetch for Maximum Coverage:**
- Fetches **15 pages of top-rated** + **15 pages of popular** movies per genre
- Results in ~600 unique movies per genre before filtering
- After global deduplication: ~7,000-8,000 total movies cached
- ALL movies get OMDb/Fanart/Wikidata data cached (not just the displayed 100)

**API Usage with Expanded Cache:**
- **First run**: ~7,000 movies × 3 APIs = substantial API usage
  - OMDb: Limited to 950/run (1,000/day limit), takes ~8-9 days to fully cache
  - Fanart.tv: Can cache all ~7,000 in first run (within 7,500/day limit)
  - Wikidata: Can query all in first run (unlimited)
- **Subsequent runs**: Only new movies (<100/day typically)
- **Persistent caching ensures**: No redundant API calls, fast rotation capability

### Pruning Tool

When the cache grows too large, use the pruning script to keep only top-ranked movies:

```bash
# Preview what would be pruned (dry run)
node scripts/prune-cache.js --dry-run

# Keep top 500 active + 1000 archived per genre (default)
node scripts/prune-cache.js

# Keep top 300 active + 600 archived per genre
node scripts/prune-cache.js --keep-per-genre=300
```

### Tiered Cache System

**Tier 1 - Active (Default: 500/genre)**
- Movies displayed in Stremio catalog rotation
- Highest weighted scores per genre
- Stored in main `catalog` blob

**Tier 2 - Archive (Default: 1000/genre)**
- Cached but not currently displayed
- Can be promoted to active tier without API calls
- Stored in `catalog-archive` blob

**Tier 3 - Pruned**
- Removed from catalog
- OMDb/Fanart/Wikidata caches kept (conservative approach)
- Can be re-fetched from TMDB if needed later

### Protection Rules

The pruner automatically protects movies from being removed if they meet any of these criteria:

- **High Rating**: IMDb rating ≥ 8.5 (cult classics)
- **High Votes**: IMDb votes ≥ 100,000 (widely popular)
- **Recent Release**: Released within last 2 years (needs time to accumulate votes)

These movies are always kept in Archive tier even if they'd otherwise be pruned.

### Cache Statistics

Run pruning in dry-run mode to see cache statistics:
- Total movies before/after pruning
- Active vs archived vs pruned counts
- How many movies were protected and why
- Per-genre breakdown

---

Last Updated: 2025-12-09
