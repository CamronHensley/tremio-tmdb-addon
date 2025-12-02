# Emergency Revert Guide

If something breaks your addon, follow these steps to quickly revert to a working state.

## Current Production State (Latest)

**Commit:** `bc740e5` - Pagination support with skip parameter
**Features:**
- ✅ 100 movies per genre (1,431+ total, growing to 1,900)
- ✅ Full pagination in Discover tab (unlimited scrolling)
- ✅ Adaptive page fetching (2-5 pages based on freshness)
- ✅ Hybrid caching (30% fresh, 70% from cache)
- ✅ 5-minute cache headers
- ✅ ~800 API calls per day

**Status:** ✅ TESTED & WORKING (Discover tab: ∞ items, Board tab: ~48 items)

## Quick Revert Options

### Option 1: Revert to Current Production (Recommended)
```bash
cd "c:\Users\olnys\Downloads\stremio-tmdb-addon\stremio-tmdb-addon"

# Stay on current version (if already there)
git reset --hard bc740e5
git push --force
```

**This keeps:** Pagination, hybrid caching, adaptive fetching, 5-min cache

### Option 2: Revert to Hybrid Cache with 6-hour Cache
```bash
git reset --hard d44c6ce
git push --force
```

**This keeps:** Hybrid caching, adaptive fetching
**Changes:** 6-hour cache (slower to see updates in Stremio)

### Option 3: Revert to Simple 5-Page Fetching (No Hybrid Cache)
```bash
git reset --hard 1027c9c
git push --force
```

**This removes:** Hybrid caching, adaptive fetching
**Features:** 100 movies per genre, 5 pages, ~1,945 API calls per day
**Status:** ✅ KNOWN STABLE

## Safe Commits (Known Working States)

| Commit | Description | API Calls/Day | Status |
|--------|-------------|---------------|--------|
| `bc740e5` | Pagination + skip in manifest | ~800 | ✅ CURRENT PRODUCTION |
| `9495275` | Skip parameter implementation | ~800 | ✅ TESTED |
| `f815f9a` | Version 1.1.0 + 5-min cache | ~800 | ✅ TESTED |
| `2290d6d` | 5-min cache + hybrid + adaptive | ~800 | ✅ TESTED |
| `d44c6ce` | Adaptive fetching + hybrid cache | ~800 | ✅ TESTED |
| `1027c9c` | 100 movies, 5 pages, no cache | ~1,945 | ✅ STABLE |

## Partial Revert (Fix Without Going Back)

If you want to keep most changes but undo one specific thing:

```bash
# See what changed
git log --oneline -5

# Revert specific commit (creates a new commit that undoes it)
git revert <commit-hash>
git push
```

**Example:** To undo just the pagination changes but keep everything else:
```bash
git revert bc740e5 9495275
git push
```

## If Addon Stops Working Completely

1. **Quick Fix**: Revert to `bc740e5` (current working state)
   ```bash
   git reset --hard bc740e5
   git push --force
   ```

2. **Check Netlify Deploy**:
   - Go to Netlify dashboard
   - Verify last deploy succeeded
   - Check deploy logs for errors

3. **Check GitHub Actions**:
   - Go to GitHub repo → Actions tab
   - Verify workflow ran successfully
   - Check for API rate limit errors

4. **Check Netlify Function Logs**:
   - Netlify dashboard → Functions → View logs
   - Look for 404, 500, or blob storage errors

5. **Manually Run Workflow**:
   - GitHub → Actions → "Update TMDB Catalog" → Run workflow

## Testing Before Deploy

```bash
# Test locally (requires env vars in .env file)
npm run update

# Check output for errors
# Look for "✅ Update complete!" message

# If successful, deploy
git push
```

## Emergency Contacts

If you lose context with Claude and need help:
1. Check commit messages: `git log --oneline -10`
2. See what changed: `git show <commit-hash>`
3. Revert to `bc740e5` for current production state
4. Revert to `1027c9c` for simplest stable state

## What Each System Does

**Hybrid Caching:**
- Merges fresh TMDB data with yesterday's catalog
- Keeps top 30 movies fresh, fills rest from cache
- Reduces API calls from 1,945 to ~800

**Adaptive Fetching:**
- Starts with 2 pages
- Checks if enough NEW movies vs cached
- Fetches more pages (up to 5) if needed
- Self-adjusts to TMDB's content freshness

**Pagination (Skip Parameter):**
- Declares `skip` support in manifest
- Enables unlimited scrolling in Discover tab
- Returns movies in chunks of 100
- Discover tab: Full access to all movies
- Board tab: Limited to ~48 items (Stremio limitation)

**5-Minute Cache:**
- Stremio refreshes catalog every 5 minutes
- Good for testing and quick updates
- Can increase to 6 hours for production stability
