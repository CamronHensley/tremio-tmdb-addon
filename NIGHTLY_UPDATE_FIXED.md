# Nightly Update - Fixed

## What Changed

The nightly update script has been **completely rewritten** to eliminate ALL auto-classification behavior.

### Before (BROKEN)
- Loaded `custom-genre-assignments` blob (doesn't exist)
- Auto-filled regular genres with ALL TMDB movies
- Put movies in MULTIPLE genres based on TMDB tags
- Created 822 auto-classified movies appearing in multiple genres

### After (FIXED)
- Loads `genre-assignments` blob (contains manual classifications)
- Uses ONLY manually classified movie IDs
- Fetches metadata from TMDB for those specific movies
- Uses hybrid cache ONLY for rotation (not classification)
- **NEVER decides which genre a movie belongs to**

## How It Works Now

1. **Load Manual Classifications**
   - Reads `genre-assignments` blob
   - This blob is populated by `scripts/save-classifications.js`
   - Contains: `{ genres: { GENRE_CODE: [movieId1, movieId2, ...] } }`
   - If blob is empty, script FAILS (correct behavior)

2. **Fetch Metadata**
   - For each genre, gets the list of manually classified movie IDs
   - Calls TMDB API to fetch movie details (title, poster, description, etc.)
   - Converts to Stremio format

3. **Apply Hybrid Cache Rotation**
   - Uses `HybridCache.selectBestMovies()` to choose which subset to show today
   - Rotation is based on scoring (popularity, rating, votes, daily strategy)
   - **NOT based on genre classification** (that's already done manually)

4. **Save to Catalog**
   - Stores final catalog in `catalog` blob
   - Each movie appears in EXACTLY ONE genre (as manually classified)

## Next Steps

1. **Clear auto-classified movies from catalog**
   - Run a script to remove the 822 auto-classified movies
   - These are movies in catalog but NOT in `classification-state`

2. **Verify the workflow**
   - Manual classification → `save-classifications.js` → `genre-assignments` blob
   - Nightly update → reads `genre-assignments` → fetches metadata → builds catalog

## Key Files Modified

- [scripts/nightly-update.js](scripts/nightly-update.js) - Complete rewrite (lines 82-173)
  - Removed all TMDB discovery code (lines 82-296 in old version)
  - Now only loads from `genre-assignments` and fetches metadata
  - Uses hybrid cache for rotation only

## What Hybrid Cache Does

The hybrid cache is **NOT** for classification. It's for:
- **Daily rotation**: Show different movies each day from the manually classified pool
- **Quality scoring**: Prioritize popular/highly-rated movies
- **Variety**: Apply daily strategies (Rising Stars, Blockbusters, etc.)
- **Freshness**: Avoid showing same movies repeatedly

It NEVER decides which genre a movie belongs to - that's entirely manual.
