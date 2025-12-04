# AI Classification Cache Design

**Purpose:** Avoid re-classifying the same movies every day
**Benefit:** Reduce 3-hour AI processing to ~5 minutes for incremental updates

**Navigation:**
- Implementation plan: [NEXT-SESSION-PLAN.md](NEXT-SESSION-PLAN.md)
- Back to start: [START-NEXT-SESSION.md](START-NEXT-SESSION.md)

---

## 🎯 Problem Statement

### Current Behavior (No Cache)
- Every `npm run update` re-classifies ALL movies with AI
- ~3,447 movies × ~3 seconds each = **~3 hours**
- Same movies get re-classified daily (wasteful)
- 99% of movies don't change between runs

### Desired Behavior (With Cache)
- Cache AI classifications by movie ID
- Only classify NEW movies or movies without cached classification
- Re-classify ALL movies when we bump version (improve prompts)
- **Result:** 3 hours → 5 minutes (only new movies)

---

## 💾 Cache Design

### Cache Structure
```json
{
  "version": 2,
  "updated": "2025-12-03T21:00:00Z",
  "classifications": {
    "550": {
      "tmdbId": 550,
      "title": "Fight Club",
      "genre": "DRAMA",
      "confidence": 0.95,
      "classificationVersion": 2,
      "timestamp": "2025-12-03T18:00:00Z",
      "promptHash": "abc123..."
    },
    "603": {
      "tmdbId": 603,
      "title": "The Matrix",
      "genre": "SCIFI",
      "confidence": 0.98,
      "classificationVersion": 2,
      "timestamp": "2025-12-03T18:05:00Z",
      "promptHash": "abc123..."
    }
  }
}
```

### Fields Explained

| Field | Type | Purpose |
|-------|------|---------|
| `version` | number | Overall cache format version |
| `updated` | ISO date | Last time cache was updated |
| `classifications` | object | Map of tmdbId → classification |
| `tmdbId` | number | TMDB movie ID (key) |
| `title` | string | Movie title (for debugging) |
| `genre` | string | Classified genre code |
| `confidence` | number | AI confidence (0-1) |
| `classificationVersion` | number | Version when classified |
| `timestamp` | ISO date | When this movie was classified |
| `promptHash` | string | Hash of prompt used (optional) |

---

## 📁 Storage Location

### Option 1: Netlify Blobs (Recommended)
**File:** `ai-classification-cache.json`
**Location:** Same store as main catalog (`tmdb-catalog`)
**Pros:**
- ✅ Persistent across runs
- ✅ Same infrastructure as catalog
- ✅ No extra setup needed
- ✅ Free (within Netlify limits)

**Cons:**
- ⚠️ Requires network call to load/save
- ⚠️ Slightly slower than local file

### Option 2: Local JSON File
**File:** `ai-classification-cache.json`
**Location:** Project root (gitignored)
**Pros:**
- ✅ Faster read/write
- ✅ No network dependency

**Cons:**
- ❌ Lost if directory deleted
- ❌ Not available in GitHub Actions
- ❌ Each machine has separate cache

**Decision:** Use Option 1 (Netlify Blobs) for consistency

---

## 🔧 Implementation

### 1. Cache Manager Class

**File:** `lib/ai-cache.js` (NEW)

```javascript
const { getStore } = require('@netlify/blobs');

class AICache {
  constructor(options = {}) {
    this.version = options.version || 2;
    this.cache = { version: this.version, updated: null, classifications: {} };
    this.store = options.store || getStore('tmdb-catalog');
    this.cacheKey = options.cacheKey || 'ai-classification-cache';
    this.dirty = false; // Track if cache needs saving
  }

  /**
   * Load cache from Netlify Blobs
   */
  async load() {
    try {
      const cached = await this.store.get(this.cacheKey, { type: 'json' });
      if (cached && cached.version === this.version) {
        this.cache = cached;
        console.log(`✓ Loaded AI cache: ${Object.keys(cached.classifications).length} movies`);
      } else {
        console.log('✓ No valid cache found, starting fresh');
      }
    } catch (error) {
      console.log('✓ No cache found, starting fresh');
    }
  }

  /**
   * Get cached classification for a movie
   * @param {number} tmdbId - TMDB movie ID
   * @returns {Object|null} - Cached classification or null
   */
  get(tmdbId) {
    const cached = this.cache.classifications[tmdbId];
    if (!cached) return null;

    // Check if classification version matches current version
    if (cached.classificationVersion !== this.version) {
      console.log(`⚠️  Cached classification for ${cached.title} is outdated (v${cached.classificationVersion} < v${this.version})`);
      return null; // Force re-classification
    }

    return cached;
  }

  /**
   * Set classification for a movie
   * @param {number} tmdbId - TMDB movie ID
   * @param {string} title - Movie title
   * @param {string} genre - Genre code
   * @param {number} confidence - Confidence score (0-1)
   */
  set(tmdbId, title, genre, confidence) {
    this.cache.classifications[tmdbId] = {
      tmdbId,
      title,
      genre,
      confidence,
      classificationVersion: this.version,
      timestamp: new Date().toISOString()
    };
    this.dirty = true;
  }

  /**
   * Save cache to Netlify Blobs
   */
  async save() {
    if (!this.dirty) {
      console.log('✓ Cache unchanged, skipping save');
      return;
    }

    this.cache.updated = new Date().toISOString();
    await this.store.setJSON(this.cacheKey, this.cache);
    console.log(`✓ Saved AI cache: ${Object.keys(this.cache.classifications).length} movies`);
    this.dirty = false;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      version: this.version,
      totalMovies: Object.keys(this.cache.classifications).length,
      lastUpdated: this.cache.updated
    };
  }

  /**
   * Clear all cached classifications (force re-classification)
   */
  clear() {
    this.cache.classifications = {};
    this.dirty = true;
    console.log('✓ Cache cleared');
  }
}

module.exports = AICache;
```

---

### 2. Integration with AI Classifier

**File:** `lib/ai-classifier.js` (MODIFIED)

```javascript
const AICache = require('./ai-cache');

class AIClassifier {
  constructor(options = {}) {
    // ... existing code ...

    // Add cache
    this.cache = new AICache({ version: 2 });
    this.cacheEnabled = options.cacheEnabled !== false;
  }

  /**
   * Initialize classifier (load cache)
   */
  async initialize() {
    if (this.cacheEnabled) {
      await this.cache.load();
    }
  }

  /**
   * Classify a movie (with caching)
   */
  async classifyMovie(movie) {
    if (!this.enabled) return null;

    const tmdbId = movie.id;
    const title = movie.title;

    // Check cache first
    if (this.cacheEnabled) {
      const cached = this.cache.get(tmdbId);
      if (cached) {
        console.log(`  ✓ Cached: "${title}" → ${cached.genre} (${Math.round(cached.confidence * 100)}%)`);
        this.stats.total++;
        this.stats.successful++;
        this.stats.totalConfidence += cached.confidence;
        return { genre: cached.genre, confidence: cached.confidence };
      }
    }

    // Not in cache, run AI classification
    this.stats.total++;

    try {
      const prompt = this.buildPrompt(movie);
      const response = await axios.post(this.endpoint, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          num_predict: 200
        }
      }, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' }
      });

      const result = this.parseResponse(response.data.response);

      if (result && result.confidence >= this.confidenceThreshold) {
        this.stats.successful++;
        this.stats.totalConfidence += result.confidence;

        // Cache the result
        if (this.cacheEnabled) {
          this.cache.set(tmdbId, title, result.genre, result.confidence);
        }

        console.log(`  ✓ AI: "${title}" → ${result.genre} (${Math.round(result.confidence * 100)}%)`);
        return result;
      } else {
        this.stats.fallbacks++;
        console.log(`  ⚠️  AI: "${title}" low confidence (${Math.round((result?.confidence || 0) * 100)}%), falling back`);
        return null;
      }
    } catch (error) {
      this.stats.failed++;
      console.log(`  ✗ AI classification failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Save cache after processing
   */
  async finalize() {
    if (this.cacheEnabled) {
      await this.cache.save();
    }
  }

  /**
   * Get statistics including cache info
   */
  getStats() {
    const stats = { ...this.stats };
    if (this.cacheEnabled) {
      stats.cache = this.cache.getStats();
    }
    return stats;
  }
}

module.exports = AIClassifier;
```

---

### 3. Update Deduplication to Use Cache

**File:** `lib/deduplication.js` (MODIFIED)

```javascript
async processAllGenresWithAI(moviesByGenre, recentMovieIds = []) {
  const aiAvailable = await this.aiClassifier.isAvailable();
  if (!aiAvailable) {
    console.log('  ⚠️  AI not available, using rule-based only');
    return this.processAllGenres(moviesByGenre, recentMovieIds);
  }

  // Initialize AI classifier (loads cache)
  await this.aiClassifier.initialize();

  // ... existing classification logic ...

  // After all classifications, save cache
  await this.aiClassifier.finalize();

  return result;
}
```

---

### 4. Update Nightly Script

**File:** `scripts/nightly-update.js` (MODIFIED)

No changes needed! The cache is automatically loaded and saved by the AI classifier.

---

## 📊 Performance Impact

### Before Cache:
```
Total movies: 3,447
AI time: ~3 hours
Cache hits: 0
New classifications: 3,447
```

### After Cache (First Run):
```
Total movies: 3,447
AI time: ~3 hours
Cache hits: 0
New classifications: 3,447
Cache saved: 3,447 entries
```

### After Cache (Second Run, No New Movies):
```
Total movies: 3,447
AI time: ~1 second
Cache hits: 3,447
New classifications: 0
```

### After Cache (Second Run, 50 New Movies):
```
Total movies: 3,497
AI time: ~2.5 minutes
Cache hits: 3,447
New classifications: 50
```

### After Cache (Version Bump):
```
Total movies: 3,497
AI time: ~3 hours
Cache hits: 0 (version mismatch)
New classifications: 3,497
Cache updated with new version
```

---

## 🔄 Version Bumping Strategy

### When to Bump Version

Bump `classificationVersion` when:
1. ✅ AI prompt text changes
2. ✅ Genre list changes (new genres added/removed)
3. ✅ Classification logic changes
4. ✅ User requests full re-classification
5. ❌ Minor bug fixes (don't bump)

### How to Bump Version

1. **Update version in cache class:**
   ```javascript
   // lib/ai-cache.js
   constructor(options = {}) {
     this.version = options.version || 3; // Bump from 2 to 3
   }
   ```

2. **Update version in classifier:**
   ```javascript
   // lib/ai-classifier.js
   this.cache = new AICache({ version: 3 }); // Match cache version
   ```

3. **Run update:**
   ```bash
   npm run update
   ```
   - All cached classifications ignored (version mismatch)
   - All movies re-classified with new prompts
   - Cache saved with new version

---

## 🧪 Testing Cache

### Test 1: First Run (No Cache)
```bash
# Delete cache
node -e "
const { getStore } = require('@netlify/blobs');
require('dotenv').config();
(async () => {
  const store = getStore({ name: 'tmdb-catalog', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_ACCESS_TOKEN });
  await store.delete('ai-classification-cache');
  console.log('Cache deleted');
})();
"

# Run update (should take ~3 hours)
npm run update
```

**Expected:**
- ✓ No cache found, starting fresh
- ~3 hours processing
- ✓ Saved AI cache: 3,447 movies

---

### Test 2: Second Run (Full Cache)
```bash
# Run update again immediately
npm run update
```

**Expected:**
- ✓ Loaded AI cache: 3,447 movies
- ~1 second processing (all cached)
- ✓ Cache unchanged, skipping save

---

### Test 3: Version Bump
```bash
# Bump version in code (2 → 3)
# Then run update
npm run update
```

**Expected:**
- ✓ Loaded AI cache: 3,447 movies
- ⚠️  All cached classifications outdated (v2 < v3)
- ~3 hours processing (re-classify all)
- ✓ Saved AI cache: 3,447 movies (version 3)

---

## 🚀 Deployment Checklist

### Before Going Live:
- [ ] Implement `AICache` class in `lib/ai-cache.js`
- [ ] Update `AIClassifier` to use cache
- [ ] Update `DeduplicationProcessor` to initialize/finalize cache
- [ ] Test locally (all 3 test scenarios)
- [ ] Verify cache saves to Netlify Blobs
- [ ] Verify cache loads on next run
- [ ] Verify version bump works
- [ ] Add cache stats to update logs

### After Deploy:
- [ ] Monitor first run (should create cache)
- [ ] Monitor second run (should use cache, ~instant)
- [ ] Check Netlify Blobs for cache file
- [ ] Verify cache size (<1MB expected)

---

## 🎯 Benefits Summary

| Metric | Before Cache | After Cache |
|--------|-------------|-------------|
| **First run** | 3 hours | 3 hours (same) |
| **Daily runs** | 3 hours | 5 minutes |
| **New movies only** | 3 hours | Proportional to new count |
| **Version bump** | 3 hours | 3 hours (re-classify all) |
| **Storage used** | 0 | ~100KB |
| **Consistency** | Perfect | Perfect (version-based) |

**Conclusion:** Cache saves ~2h 55min per daily update after initial run

---

**Created:** 2025-12-03
**Version:** 1.0
**Status:** Ready to implement
