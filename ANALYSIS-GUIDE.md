# Quick Analysis Guide for Claude

This file helps Claude Code analyze the project efficiently by providing a structured overview and prioritized reading order.

## 🎯 Analysis Priority (Read in This Order)

### Phase 1: Core Understanding (5 files, ~500 lines)
1. **[README.md](README.md)** (315 lines)
   - Project overview, features, setup
   - Skip: Detailed installation steps (unless deploying)

2. **[PROJECT-MAP.md](PROJECT-MAP.md)** (200 lines)
   - Quick navigation, file locations
   - Workflow guides

3. **[lib/constants.js](lib/constants.js)** (300 lines)
   - 22 genre definitions (lines 15-46)
   - Quality thresholds (lines 48-56)
   - Daily strategies (lines 70-130)
   - Genre personalities (lines 180-280)

4. **[package.json](package.json)** (30 lines)
   - Dependencies, scripts

5. **[netlify.toml](netlify.toml)** (80 lines)
   - URL routing, redirects

### Phase 2: Core Logic (4 files, ~2,200 lines)
6. **[lib/scoring-engine.js](lib/scoring-engine.js)** (550 lines)
   - Base score calculation (lines 150-180)
   - 7 daily strategies (lines 200-400)
   - Genre personalities (lines 420-550)

7. **[lib/deduplication.js](lib/deduplication.js)** (1,004 lines)
   - **Most complex file in the project**
   - Tier 1: Absolute Isolation (lines 85-170)
   - Tier 2: Sci-Fi vs Fantasy (lines 172-200)
   - Tier 3: Specificity (lines 202-230)
   - Tier 4: Era-Based (lines 232-260)
   - Tier 5: Primary Genre (lines 262-300)
   - Quality filtering (lines 400-500)
   - Backfilling logic (lines 600-800)

8. **[scripts/nightly-update.js](scripts/nightly-update.js)** (306 lines)
   - Daily update orchestration
   - API call flow (lines 80-160)
   - Hybrid cache usage (lines 170-180)
   - Detail fetching (lines 200-230)

9. **[netlify/functions/addon.js](netlify/functions/addon.js)** (286 lines)
   - Manifest handler (lines 101-105)
   - Catalog handler (lines 107-149)
   - Meta handler (lines 151-194)
   - Rate limiting (lines 206-212)

### Phase 3: Supporting Systems (5 files, ~800 lines)
10. **[lib/tmdb-client.js](lib/tmdb-client.js)** (200 lines)
    - API wrapper, batch fetching
    - IMDB ID prioritization

11. **[lib/hybrid-cache.js](lib/hybrid-cache.js)** (125 lines)
    - Merge logic (lines 18-74)
    - Deduplication (lines 40-65)

12. **[lib/cache-manager.js](lib/cache-manager.js)** (278 lines)
    - Netlify Blobs wrapper
    - Cache freshness checks

13. **[lib/rate-limiter.js](lib/rate-limiter.js)** (142 lines)
    - In-memory rate limiting
    - Sliding window algorithm

14. **[lib/logger.js](lib/logger.js)** (147 lines)
    - Structured logging
    - Skip if not debugging

### Phase 4: Frontend & Documentation (Optional)
15. **[public/index.html](public/index.html)** (682 lines)
    - Genre chooser disabled (lines 440-455)
    - Always uses all 22 genres (lines 503-544)

16. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** (355 lines)
    - System architecture diagrams
    - Data flow explanations

17. **[docs/AI-INTEGRATION-PLAN.md](docs/AI-INTEGRATION-PLAN.md)** (480 lines)
    - AI integration guide (if implementing AI)

## 🚫 Skip These Files (Unless Specific Need)

### Archived/Deprecated
- `scripts/tests-archive/*` - Old test scripts
- `docs/archive/*` - Deprecated documentation
- `docs/DOCUMENTATION-UPDATES.md` - Historical doc changes
- `docs/UI-SIMPLIFICATION.md` - UI change summary (info only)

### Auto-Generated/External
- `node_modules/*` - Dependencies (don't read)
- `package-lock.json` - Dependency lock (don't read)
- `.git/*` - Git history (don't read)

### Tests (Read Only If Testing)
- `lib/__tests__/scoring-engine.test.js` (300+ tests)
- `lib/__tests__/deduplication.test.js` (tests)

## 📊 File Complexity & Context Cost

| File | Lines | Tokens (Est.) | Complexity | Priority |
|------|-------|---------------|------------|----------|
| [lib/deduplication.js](lib/deduplication.js) | 1,004 | ~6,000 | 🔴 High | 🔥 Critical |
| [lib/scoring-engine.js](lib/scoring-engine.js) | 550 | ~3,000 | 🟡 Medium | 🔥 Critical |
| [public/index.html](public/index.html) | 682 | ~4,000 | 🟢 Low | ⚪ Optional |
| [scripts/nightly-update.js](scripts/nightly-update.js) | 306 | ~2,000 | 🟡 Medium | 🔥 Critical |
| [netlify/functions/addon.js](netlify/functions/addon.js) | 286 | ~1,800 | 🟡 Medium | 🔥 Critical |
| [lib/constants.js](lib/constants.js) | 300 | ~1,500 | 🟢 Low | 🔥 Critical |
| [lib/cache-manager.js](lib/cache-manager.js) | 278 | ~1,500 | 🟢 Low | 🟡 Important |
| [lib/tmdb-client.js](lib/tmdb-client.js) | 200 | ~1,200 | 🟢 Low | 🟡 Important |
| [lib/rate-limiter.js](lib/rate-limiter.js) | 142 | ~800 | 🟢 Low | ⚪ Optional |
| [lib/logger.js](lib/logger.js) | 147 | ~800 | 🟢 Low | ⚪ Optional |
| [lib/hybrid-cache.js](lib/hybrid-cache.js) | 125 | ~700 | 🟢 Low | 🟡 Important |

**Total Critical Files**: ~3,500 lines (~18,000 tokens)

## 🔍 Key Concepts to Understand

### 1. Genre Assignment (5-Tier System)
**Location**: [lib/deduplication.js](lib/deduplication.js)

**Quick Summary**:
- **Tier 1**: Absolute (Superheroes, Animation, TV Movies, Docs)
- **Tier 2**: Sci-Fi vs Fantasy (strict separation)
- **Tier 3**: Specificity (War, History, Horror)
- **Tier 4**: Era-based (Action pre/post 2000)
- **Tier 5**: Primary genre (TMDB first tag)

**Why Complex**: 1,004 lines of hardcoded rules to handle edge cases

### 2. Daily Rotation (7 Strategies)
**Location**: [lib/scoring-engine.js](lib/scoring-engine.js:200-400)

**Quick Summary**:
- Each day of week has different theme
- RISING_STARS, CRITICAL_DARLINGS, HIDDEN_GEMS, etc.
- Changes TMDB sort parameter + score modifiers
- Ensures fresh content daily

### 3. Hybrid Caching
**Location**: [lib/hybrid-cache.js](lib/hybrid-cache.js:18-74)

**Quick Summary**:
- Merges fresh TMDB data with yesterday's catalog
- Currently: 100% fresh (building catalog)
- Can optimize to: 30% fresh + 70% cached
- Reduces API calls from 2,640 to ~800

### 4. Quality Filtering
**Location**: [lib/deduplication.js](lib/deduplication.js:400-500)

**Quick Summary**:
- High-quality exception: rating ≥7.5 + votes ≥500 needs only popularity ≥5
- Standard threshold: votes ≥300, rating ≥5.5, popularity ≥15
- Pre-1970s limit: Maximum 5% per genre (5 out of 100)

## 🎯 Common Analysis Tasks

### Task 1: "Analyze the entire codebase"
**Read these 9 files** (in order):
1. README.md
2. PROJECT-MAP.md
3. lib/constants.js
4. lib/scoring-engine.js
5. lib/deduplication.js
6. scripts/nightly-update.js
7. netlify/functions/addon.js
8. lib/hybrid-cache.js
9. lib/cache-manager.js

**Skip**: Tests, docs (unless specific question), frontend, archived files

**Estimated tokens**: ~18,000 (9% of 200K context)

### Task 2: "How does genre assignment work?"
**Read these 2 files**:
1. lib/deduplication.js (focus on lines 85-300)
2. lib/constants.js (genre definitions)

**Estimated tokens**: ~7,000

### Task 3: "How does scoring work?"
**Read these 2 files**:
1. lib/scoring-engine.js (all strategies)
2. lib/constants.js (thresholds, personalities)

**Estimated tokens**: ~4,500

### Task 4: "How does the update process work?"
**Read these 3 files**:
1. scripts/nightly-update.js (orchestration)
2. lib/hybrid-cache.js (caching)
3. lib/tmdb-client.js (API calls)

**Estimated tokens**: ~4,000

### Task 5: "How does the API work?"
**Read these 2 files**:
1. netlify/functions/addon.js (endpoints)
2. netlify.toml (routing)

**Estimated tokens**: ~2,000

## 💡 Efficient Analysis Strategy

### For Quick Understanding (< 10K tokens)
```
1. Read README.md (overview)
2. Read PROJECT-MAP.md (navigation)
3. Skim lib/constants.js (config)
4. Ask specific questions
```

### For Deep Understanding (< 25K tokens)
```
1. Phase 1: Core Understanding (5 files)
2. Phase 2: Core Logic (4 files)
3. Focus on specific modules based on question
```

### For Complete Analysis (< 50K tokens)
```
1. Phase 1 → Phase 2 → Phase 3
2. Skip tests, archived files, detailed docs
3. Read docs/ARCHITECTURE.md for visual diagrams
```

## 🔄 Current State Summary

**Version**: 1.3.0
**Genre Chooser**: Disabled (always uses all 22 genres)
**API Calls**: 2,640/day (building catalog, can optimize to ~800)
**Movies**: 100 per genre (2,200 total)
**Pagination**: Enabled (unlimited scrolling)
**Hybrid Cache**: 100% fresh (not optimized yet)
**AI Integration**: Planned (Qwen2.5-7B)

## 📝 Important Notes

### What's Disabled
- Genre selection UI (public/index.html:440-455)
- Historical penalty in scoring (scripts/nightly-update.js:63-71)
- Japanese anime (completely blocked)

### What's Special
- **Superhero detection**: Title-based regex (can be improved with AI)
- **Animation split**: Kids vs Adult by rating + Family tag
- **Pre-1970s cap**: Hard 5% limit per genre
- **IMDB ID priority**: Prioritizes IMDB IDs over TMDB for streaming

### Future Plans
1. AI classification (Qwen2.5-7B local)
2. Hybrid cache optimization (30/70 split)
3. UI update (show all 22 genres)
4. Pre-1970s configurable limit

---

**For AI Integration**: See [docs/AI-INTEGRATION-PLAN.md](docs/AI-INTEGRATION-PLAN.md)
**For Architecture**: See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
**For Emergencies**: See [docs/REVERT-GUIDE.md](docs/REVERT-GUIDE.md)
