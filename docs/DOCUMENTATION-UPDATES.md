# Documentation Updates Summary

This document summarizes the documentation fixes applied to bring the documentation in line with the current codebase.

## Changes Made

### 1. README.md - Major Updates

#### Features Section (Lines 5-16)
**Before:**
- 19 Movie Genres
- 30 movies per genre
- Basic deduplication mention

**After:**
- 22 Movie Genres (Action, Classic Action, Animation Kids/Adult, Superheroes, etc.)
- 100 movies per genre (2,200+ total)
- Unlimited scrolling with pagination
- 5-tier deduplication system explicitly mentioned
- Quality filtering captures both blockbusters and classics

#### Environment Variables (Line 135)
**Before:** `MOVIES_PER_GENRE` default = 30

**After:** `MOVIES_PER_GENRE` default = 100

#### Project Structure (Lines 103-107)
**Added:** `hybrid-cache.js` - Hybrid caching for API optimization

**Updated:** `deduplication.js` - Now described as "5-tier deduplication system"

#### Free Tier Limits (Lines 151-172)
**Before:**
- ~627 API calls per nightly update
- Generic usage estimates

**After:**
- ~2,640 API calls per nightly update (20 pages × 22 genres + 2,200 detail fetches)
- ~800 API calls with hybrid caching enabled
- More accurate bandwidth estimates (2-4 GB/month)

#### API Usage (Lines 200-210)
**Before:**
- 627 API calls (19 genres × 3 pages, 30 movies × 19 genres)

**After:**
- 2,640 API calls (22 genres × 20 pages, 100 movies × 22 genres)
- Optimized: ~800 calls with hybrid caching
- Clear explanation of both modes

#### How Updates Work (Lines 212-222)
**Before:**
- 6 simple steps

**After:**
- 9 detailed steps including:
  - Adaptive page fetching
  - 5-tier deduplication system
  - Hybrid cache merging
  - IMDB ID prioritization
  - 5-minute cache headers

#### Health Monitoring (Line 235)
**Before:** `totalMovies: 570`

**After:** `totalMovies: 2200`

#### New Section: Genre Categories (Lines 240-253)
**Added comprehensive section:**
- 22 specialized genres listed
- Standard genres (16)
- Special categories (6) with explanations
- Note about Japanese anime exclusion

#### Updated Section: Genre Personalities (Lines 255-276)
**Before:** 6 brief examples

**After:** 18 detailed personality descriptions including:
- Classic Action (1980s-1990s golden era)
- Superheroes (franchise bonus, modern era)
- Animation Kids/Adult (separate descriptions)
- All genres with specific modifiers

#### New Section: Deduplication System (Lines 302-333)
**Added comprehensive documentation:**
- 5-tier system explained in detail
- Tier 1: Absolute Isolation
- Tier 2: Sci-Fi vs Fantasy
- Tier 3: Specificity Rules
- Tier 4: Era-Based Splits
- Tier 5: Primary Genre Logic
- Additional rules (pre-1970s limit, quality filtering)

#### Recent Improvements (Lines 335-360)
**Before:**
- v1.1.0 listed as latest
- No v1.3.0 information

**After:**
- v1.3.0 added as current version with:
  - 100 movies per genre increase
  - Pagination support
  - 5-tier deduplication
  - Hybrid caching
  - Special categories
  - Pre-1970s limit
  - Adaptive fetching
- v1.1.0 properly marked as previous version
- v1.0.0 updated to reflect "19 genres with basic deduplication"

### 2. REVERT-GUIDE.md - Updates

#### Current Production State (Lines 9-14)
**Before:**
- 1,431+ total movies (growing to 1,900)
- 2-5 pages
- 30% fresh, 70% cached
- ~800 API calls

**After:**
- 2,200 total across 22 genres
- 2-20 pages
- Currently 100% fresh (building catalog)
- ~2,640 API calls (reduces to ~800 with hybrid cache)

#### Safe Commits Table (Lines 52-61)
**Before:** Incorrect API call counts for recent commits

**After:**
- Updated API calls for bc740e5, 9495275, f815f9a to ~2,640
- Added note explaining the difference (20 pages vs hybrid cache)

#### What Each System Does (Lines 130-140)
**Before:**
- Top 30 movies fresh
- 2 pages
- Up to 5 pages max

**After:**
- Currently 100% fresh (building catalog)
- Can be adjusted to 30% fresh + 70% cached
- 20 pages currently
- Reduces from 2,640 to ~800 when optimized

### 3. New File: ARCHITECTURE.md

**Created comprehensive architecture documentation** covering:

1. **System Architecture**
   - Visual diagram of components
   - Data flow (update and request flows)

2. **Core Components** (9 detailed sections)
   - Constants, TMDB Client, Scoring Engine
   - Deduplication System (detailed 5-tier explanation)
   - Hybrid Cache, Cache Manager, Rate Limiter
   - Addon Function, Nightly Update Script

3. **Performance Optimization**
   - API usage breakdown
   - Caching strategy
   - Request handling

4. **Configuration**
   - Environment variables
   - Configurable code values with line numbers

5. **Testing**
   - Unit test coverage
   - Local testing instructions

6. **Monitoring & Health**
   - Health endpoint format
   - Logging strategy
   - Manual monitoring checklist

7. **Deployment**
   - Initial setup steps
   - Update procedures
   - Rollback reference

8. **Limitations & Trade-offs**
   - 6 current design decisions with pros/cons
   - Future enhancement paths

9. **Future Enhancements**
   - Short-term improvements
   - Long-term roadmap

## Summary of Inaccuracies Fixed

### Critical Fixes
1. **Genre count**: 19 → 22 (missing SUPERHEROES, ANIMATION_KIDS/ADULT, ACTION_CLASSIC)
2. **Movies per genre**: 30 → 100 (4× increase)
3. **Total movies**: 570 → 2,200 (4× increase)
4. **API calls per day**: 627 → 2,640 (current) or ~800 (optimized)

### Documentation Gaps Filled
1. **5-tier deduplication system**: Now fully documented
2. **Hybrid caching**: Explained with current vs optimized configurations
3. **Special categories**: Superheroes, Classic Action, Animation split
4. **Genre personalities**: Expanded from 6 to 18 detailed descriptions
5. **Pagination support**: Added to features and explained
6. **Pre-1970s limit**: Documented (5% per genre)
7. **Japanese anime exclusion**: Explicitly documented

### New Documentation
1. **ARCHITECTURE.md**: Comprehensive technical documentation (355 lines)
2. **Deduplication System section** in README.md
3. **Genre Categories section** in README.md

## Files Modified

1. **README.md** - 10 major sections updated, 3 new sections added
2. **REVERT-GUIDE.md** - 3 sections updated with accurate numbers
3. **ARCHITECTURE.md** - New file created (355 lines)
4. **DOCUMENTATION-UPDATES.md** - This summary

## Verification Checklist

- [x] Genre count matches code (22)
- [x] Movies per genre matches code (100)
- [x] API call counts accurate (2,640 current, ~800 optimized)
- [x] All special categories documented
- [x] 5-tier deduplication explained
- [x] Hybrid cache state clarified (100% fresh currently)
- [x] Version numbers updated (v1.3.0 current)
- [x] Environment variable defaults correct
- [x] Project structure includes all files
- [x] Genre personalities complete (18 genres)

## Next Steps (Optional)

1. **Update UI** (public/index.html) to show all 22 genres
2. **Add architecture diagram** to README.md (visual)
3. **Create CONTRIBUTING.md** with development guidelines
4. **Add CHANGELOG.md** for version tracking
5. **Document hybrid cache optimization** procedure
