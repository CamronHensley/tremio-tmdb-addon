# Catalog Rotation System

**Last Updated:** 2025-12-10

## Overview

The catalog rotation system keeps the Stremio addon fresh by rotating 25% of displayed movies daily. This ensures users see a dynamic catalog while maintaining high-quality content.

## Architecture

### Two-Blob System

1. **`catalog-full-cache`** (Netlify Blob)
   - Contains ALL fetched movies (~600 per genre)
   - Serves as the rotation pool
   - Updated by `nightly-update.js`
   - Never directly displayed in Stremio

2. **`catalog`** (Netlify Blob)
   - Contains top 100 movies per genre
   - Displayed in Stremio addon
   - Updated by both `nightly-update.js` (initial) and `rotate-catalog.js` (daily)

## Rotation Strategy

### Configuration
```javascript
const ROTATION_CONFIG = {
  displayPerGenre: 100,      // Movies shown in Stremio
  rotationPercent: 0.25,     // 25% daily rotation
  minDaysBetweenActive: 14,  // Cooldown before re-promotion (2 weeks)
  classicProtectionRating: 8.5, // High-rated movies rotate slower
  newReleaseYears: 1         // Recent movies rotate faster
};
```

### Daily Rotation Process

**Each day:**
- 25 movies rotate out (per genre)
- 25 new movies rotate in (per genre)
- Complete catalog refresh every 4 days (100 ÷ 25)

**Example for Action genre:**
```
Day 0: Movies 1-100 displayed
Day 1: Movies 1-75, 101-125 displayed (25 rotated)
Day 2: Movies 1-50, 101-150 displayed (50 rotated total)
Day 3: Movies 1-25, 101-175 displayed (75 rotated total)
Day 4: Movies 101-200 displayed (complete refresh)
```

## Rotation Rules

### Movies to Remove (Priority Order)

1. **Non-classics first** (IMDb rating < 8.5)
2. **Oldest in catalog** (by `addedToCatalogDate`)
3. **Classics protected** (IMDb rating ≥ 8.5 stay longer)

### Movies to Promote (Priority Order)

1. **Not currently in catalog**
2. **Cooled down** (14+ days since last active)
3. **Highest weighted score** (rating × log10(votes))
4. **New release boost** (< 1 year old get 1.5x multiplier)

### Rotation Metadata

Each movie tracks:
```javascript
rotationMetadata: {
  addedToCatalogDate: "2025-12-10T00:00:00.000Z",  // When added to active catalog
  lastActiveDate: "2025-12-10T00:00:00.000Z",      // Last time in active catalog
  totalDaysActive: 0                                // Cumulative days displayed
}
```

## Usage

### Dry Run (Preview Changes)
```bash
node scripts/rotate-catalog.js --dry-run
```
Output shows:
- Movies being removed (oldest/non-classics)
- Movies being promoted (from cache)
- Eligible movies in cache
- Rotation statistics per genre

### Apply Rotation
```bash
node scripts/rotate-catalog.js
```
Updates the `catalog` blob with rotated movies.

### Output Example
```
🔄 Catalog Rotation Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode: LIVE (will update catalog)
Rotation: 25% daily (25 movies per genre)

  Processing ACTION:
    Current catalog: 100 movies
    Full cache: 450 movies
    Rotating: 25 movies
    Removing: 25 movies (oldest/non-classics)
    Eligible for promotion: 350 movies
    Promoting: 25 movies
    New catalog size: 100 movies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Rotation Summary:
  Total movies removed: 725
  Total movies promoted: 725
  Total eligible in cache: 10,150
  Rotation rate: 25.0%
```

## Integration with Other Scripts

### nightly-update.js
1. Fetches ~600 movies per genre from TMDB
2. Enriches with IMDb ratings, posters, badges
3. **Saves `catalog-full-cache`** (all movies)
4. **Saves `catalog`** (top 100 per genre)

### rotate-catalog.js
1. Loads `catalog` (current display)
2. Loads `catalog-full-cache` (rotation pool)
3. Rotates 25% per genre
4. **Updates `catalog`** (new display)
5. Preserves `catalog-full-cache` (unchanged)

### prune-cache.js (Future)
1. Loads `catalog-full-cache`
2. Removes low-performers beyond position 500
3. **Updates `catalog-full-cache`** (pruned)

## Scheduling (Future - GitHub Actions)

Recommended workflow:
```yaml
- name: Nightly Update
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  run: node scripts/nightly-update.js

- name: Catalog Rotation
  schedule:
    - cron: '0 6 * * *'  # 6 AM daily (after nightly update)
  run: node scripts/rotate-catalog.js
```

## Benefits

1. **Fresh Content**: Users see different movies every day
2. **Classic Protection**: High-rated films (8.5+) stay visible longer
3. **New Release Priority**: Recent movies get promoted faster
4. **Cooldown Period**: Movies rest 14 days before returning
5. **Fair Exposure**: All ~600 cached movies rotate through over time
6. **Performance**: Rotation is fast (no API calls, just blob updates)

## Monitoring

Track rotation effectiveness:
- Total eligible movies in cache per genre
- Rotation rate (should be 25%)
- Classic vs non-classic removal ratio
- New release promotion success

## Future Enhancements

1. **User engagement tracking** - Rotate based on what users watch
2. **Seasonal awareness** - Promote holiday-themed content automatically
3. **Genre balancing** - Ensure diverse content across all genres
4. **Performance metrics** - Track which movies perform best when promoted
