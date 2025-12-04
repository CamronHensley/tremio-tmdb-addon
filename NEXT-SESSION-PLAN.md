# Next Session Implementation Plan

**Goal:** Fix genre classification issues and add new genres
**Target Audience:** Western audience (US/UK focus)
**Status:** Ready to implement

**Navigation:**
- Back to start: [START-NEXT-SESSION.md](START-NEXT-SESSION.md)
- Quick reference: [CLASSIFICATION-RULES.md](CLASSIFICATION-RULES.md)
- Testing: [KNOWN-ISSUES.md](KNOWN-ISSUES.md)
- Files guide: [README-FILES-GUIDE.md](README-FILES-GUIDE.md)

---

## 🎯 Issues to Fix

### 1. Superhero Movies Misclassified
**Problem:** Batman, Captain America, Deadpool in ACTION instead of SUPERHEROES

**Examples:**
- The Dark Knight (2008) - Currently in ACTION
- The Dark Knight Rises (2012) - Currently in ACTION
- Captain America: Civil War - Currently in ACTION
- Captain America: The Winter Soldier - Currently in ACTION
- Deadpool 2 - Currently in ACTION

**Fix:** Update superhero regex in [lib/deduplication.js:99](lib/deduplication.js#L99)
- Remove "Captain" (catches Captain Phillips)
- Ensure all Batman/Dark Knight movies match
- Test with catalog after changes

### 2. Westerns Misclassified
**Problem:** Western movies scattered in ACTION, HISTORY, DRAMA

**Examples:**
- Tombstone - Currently in ACTION
- Butch Cassidy and the Sundance Kid - Currently in HISTORY

**Fix:** Make WESTERN Tier 1 priority (always wins)
- Western must override ACTION, HISTORY, DRAMA
- Update tier priority in deduplication.js

### 3. Era-Based Action Wrong
**Problem:** 1980s action movies in ACTION instead of ACTION_CLASSIC

**Examples:**
- First Blood (1982) - Currently in ACTION, should be ACTION_CLASSIC

**Fix:** Verify year-based split logic (<2000 = classic)

### 4. Animation Leaking
**Problem:** Animated movies in COMEDY, ACTION, etc.

**Examples:**
- Incredibles 2 - Currently in ACTION
- Scooby-Doo movies - Currently in COMEDY

**Fix:** Animation detection must be Tier 1 priority

### 5. Martial Arts Polluting Superheroes
**Problem:** Samurai/kung fu in SUPERHEROES

**Examples:**
- Legend of Drunken Master (1994) - In SUPERHEROES
- Fist of Legend (1994) - In SUPERHEROES
- Samurai Rebellion (1967) - In SUPERHEROES

**Fix:** Create MARTIAL_ARTS genre, move these there

### 6. Random Movies in Wrong Genres
**Problem:** Non-superhero movies in SUPERHEROES

**Examples:**
- Sympathy for Mr. Vengeance - In SUPERHEROES
- Sanjuro - In SUPERHEROES
- Duel - In SUPERHEROES
- The Longest Day - In SUPERHEROES

**Fix:** Improve superhero detection to be more specific

### 7. Indian Movies Present
**Problem:** Indian movies throughout catalog (user doesn't want them)

**Fix:** Block all Indian content by language and production country

---

## ➕ New Genres to Add

### New Genre List (26 total, was 22)

1. ACTION (Modern, post-2000)
2. ACTION_CLASSIC (Pre-2000)
3. ADVENTURE
4. ANIMATION_KIDS
5. ANIMATION_ADULT
6. **CARS** ⭐ NEW
7. COMEDY
8. CRIME
9. DOCUMENTARY
10. DRAMA
11. FAMILY
12. FANTASY
13. HISTORY
14. HORROR
15. **MARTIAL_ARTS** ⭐ NEW
16. MUSIC
17. MYSTERY
18. ROMANCE
19. SCIFI
20. **SPORTS** ⭐ NEW
21. **STAND_UP_COMEDY** ⭐ NEW
22. SUPERHEROES
23. THRILLER
24. TV_MOVIE
25. WAR
26. WESTERN

### New Genre Details

#### CARS
**TMDB Genre ID:** Create custom detection (no dedicated TMDB genre)
**Priority:** Tier 1 (always wins over ACTION)
**Detection:**
- Title keywords: "Fast & Furious", "Cars", "Need for Speed", "Gran Turismo", "Rush", "Ford v Ferrari", "Gone in 60 Seconds", "Driven", "Talladega Nights"
- Plot keywords: racing, street racing, NASCAR, Formula 1, drag racing

**Example Movies:**
- Fast & Furious franchise (all)
- Rush (2013)
- Ford v Ferrari (2019)
- Gran Turismo (2023)
- Gone in 60 Seconds
- Need for Speed
- Cars (Pixar - goes to ANIMATION_KIDS)

#### SPORTS
**TMDB Genre ID:** Create custom detection
**Priority:** Tier 1 (always wins over DRAMA)
**Detection:**
- Title keywords: Boxing, Football, Baseball, Basketball, Hockey, Wrestling
- Specific titles: "Rocky", "Creed", "Remember the Titans", "Moneyball", "Space Jam", "Rudy", "The Blind Side"

**Example Movies:**
- Rocky series (boxing)
- Creed series (boxing)
- Remember the Titans (football)
- Moneyball (baseball)
- Space Jam (basketball)
- Field of Dreams (baseball)
- The Wrestler (wrestling)
- Warrior (MMA - could go MARTIAL_ARTS or SPORTS, decide later)

#### MARTIAL_ARTS
**TMDB Genre ID:** Custom detection (subset of action)
**Priority:** Tier 1 (always wins over ACTION/ACTION_CLASSIC)
**Detection:**
- Title keywords: "Kung Fu", "Samurai", "Karate", "Judo", "Muay Thai", "Shaolin", "Drunken", "Fist", "Dragon", "Tiger"
- Specific titles: "Enter the Dragon", "Ip Man", "The Raid", "Ong-Bak", "Seven Samurai", "Yojimbo", "Crouching Tiger"

**NOT INCLUDED:**
- Boxing movies → SPORTS
- Wrestling movies → SPORTS
- MMA movies → SPORTS (or case-by-case)

**Example Movies:**
- Seven Samurai (1954)
- Enter the Dragon (1973)
- Ip Man series
- The Raid series
- Ong-Bak series
- Kung Fu Hustle
- Crouching Tiger, Hidden Dragon
- Fist of Legend
- Legend of Drunken Master

#### STAND_UP_COMEDY
**TMDB Genre ID:** Filter from Comedy (35)
**Priority:** Tier 1 (separate from COMEDY)
**Detection:**
- Title keywords: "Stand Up", "Live at", "Comedy Special", "Recorded Live", "Live from"
- TMDB type: Often tagged as TV specials or documentaries
- Runtime: Usually 60-120 minutes

**Example Specials:**
- Dave Chappelle specials
- Kevin Hart specials
- Ali Wong specials
- John Mulaney specials

**Important:** Regular comedy movies stay in COMEDY genre

---

## 🚫 Content Filtering (Western Audience)

### Block Indian Content
**Remove ALL movies with:**
- Original language: Hindi, Telugu, Tamil, Malayalam, Kannada, Bengali, Punjabi, Marathi
- Production country: India
- Both conditions checked

**Examples to Remove:**
- RRR
- Baahubali series
- Dangal
- Bajrangi Bhaijaan
- All Bollywood films

### Japanese Content Strategy
**Keep Japanese movies but:**
- Samurai films → MARTIAL_ARTS genre ONLY
- Anime → ANIMATION_ADULT or ANIMATION_KIDS
- Other Japanese films → Regular genres if high quality/Western appeal

**Goal:** Reduce Japanese overflow but keep classics (Seven Samurai, Akira, etc.)

### Focus on Western Markets
**Prioritize:**
- US productions
- UK productions
- Canadian productions
- Australian productions
- European productions (English-language or highly popular)

---

## 🏆 Updated Genre Priority (Tiers)

### Tier 1: ABSOLUTE ISOLATION (Always Win)
**Order of Priority:**
1. **SUPERHEROES** - Marvel, DC, etc.
2. **ANIMATION_KIDS** - Family-friendly animation
3. **ANIMATION_ADULT** - Adult animation
4. **MARTIAL_ARTS** - Kung fu, samurai, etc.
5. **CARS** - Racing/car-focused movies
6. **SPORTS** - Sports-focused movies
7. **STAND_UP_COMEDY** - Comedy specials
8. **TV_MOVIE** - Made-for-TV
9. **DOCUMENTARY** - Documentaries
10. **WESTERN** - Westerns always win

### Tier 2: ERA-BASED SPLITS
- **ACTION** vs **ACTION_CLASSIC** (2000 cutoff)

### Tier 3: SPECIFICITY
- **WAR** - War movies
- **HISTORY** - Historical (but loses to WESTERN)
- **HORROR** - Horror movies

### Tier 4-5: AI-ENHANCED
- **SCIFI** vs **FANTASY** - AI decides
- **Primary genre** for multi-genre - AI decides
- Everything else

---

## 💾 AI Caching System Design

### Implementation: Smart Cache with Versioning

#### Cache Structure
```json
{
  "version": 2,
  "classifications": {
    "550": {
      "tmdbId": 550,
      "title": "Fight Club",
      "genre": "DRAMA",
      "confidence": 0.95,
      "classificationVersion": 2,
      "timestamp": "2025-12-03T18:00:00Z"
    },
    "603": {
      "tmdbId": 603,
      "title": "The Matrix",
      "genre": "SCIFI",
      "confidence": 0.98,
      "classificationVersion": 2,
      "timestamp": "2025-12-03T18:05:00Z"
    }
  }
}
```

#### Cache File Location
- `ai-classification-cache.json` (stored in Netlify Blobs)
- Separate from main catalog
- Persistent across updates

#### Cache Logic
1. **On startup:** Load cache from Netlify Blobs
2. **Before AI classification:** Check if movie in cache AND version matches
3. **If cached & version matches:** Use cached result (skip AI)
4. **If not cached OR old version:** Run AI classification
5. **After classification:** Save to cache with current version
6. **After all classifications:** Upload cache to Netlify Blobs

#### Version Bumping Strategy
- Bump version when:
  - AI prompt changes
  - Genre list changes (new genres added)
  - Classification rules change
  - User requests re-classification

- Current version: `1`
- After fixes: Bump to `2` (forces re-classification)

#### Benefits
- ✅ Dramatically reduces AI processing time (3 hours → ~5 minutes for new movies only)
- ✅ Consistent classifications across runs
- ✅ Can force re-classification when needed
- ✅ Tracks confidence and timestamps

#### File Size Estimate
- ~100KB for 3,447 movies
- Negligible storage cost

---

## 📝 Implementation Steps

### Phase 1: Add New Genres to Constants
**File:** [lib/constants.js](lib/constants.js)

1. Add CARS, SPORTS, MARTIAL_ARTS, STAND_UP_COMEDY
2. Assign icon/color for each
3. Add to genre list

### Phase 2: Update Deduplication Logic
**File:** [lib/deduplication.js](lib/deduplication.js)

1. **Update Tier 1 detection (lines 95-120):**
   - Add CARS detection (title + keywords)
   - Add SPORTS detection
   - Add MARTIAL_ARTS detection
   - Add STAND_UP_COMEDY detection
   - Make WESTERN Tier 1
   - Fix superhero regex (remove "Captain", improve Batman detection)
   - Improve animation detection

2. **Add Indian content filter (new function):**
   ```javascript
   function isIndianContent(movie) {
     const indianLanguages = ['hi', 'te', 'ta', 'ml', 'kn', 'bn', 'pa', 'mr'];
     return movie.original_language && indianLanguages.includes(movie.original_language);
   }
   ```

3. **Filter out Indian movies in processAllGenres:**
   - Skip movies where `isIndianContent(movie) === true`

### Phase 3: Implement AI Cache System
**File:** [lib/ai-classifier.js](lib/ai-classifier.js)

1. **Add cache management:**
   - `loadCache()` - Load from Netlify Blobs
   - `saveCache()` - Save to Netlify Blobs
   - `getCachedClassification(movieId, version)` - Get from cache
   - `setCachedClassification(movieId, genre, confidence, version)` - Save to cache

2. **Update classifyMovie():**
   - Check cache before AI call
   - Skip AI if cached version matches
   - Save to cache after AI call

3. **Add version constant:**
   ```javascript
   const CLASSIFICATION_VERSION = 2; // Bump when rules change
   ```

### Phase 4: Update AI Prompts
**File:** [lib/ai-classifier.js](lib/ai-classifier.js)

1. Add new genres to prompt
2. Update genre descriptions
3. Improve examples for each genre

### Phase 5: Update TMDB Fetching
**File:** [lib/tmdb-client.js](lib/tmdb-client.js) or [scripts/nightly-update.js](scripts/nightly-update.js)

1. Add fetching for new genres (if needed)
2. Ensure CARS, SPORTS, MARTIAL_ARTS, STAND_UP_COMEDY get movies

### Phase 6: Test & Validate
1. Run update with AI enabled
2. Check catalog with `node check-catalog.js`
3. Verify:
   - Superheroes correctly classified
   - Westerns in right place
   - No Indian movies
   - New genres populated
   - Cache working (check logs)

---

## 🧪 Testing Checklist

### Before Running Update:
- [ ] All code changes made
- [ ] Constants updated with new genres
- [ ] Deduplication logic updated
- [ ] AI cache system implemented
- [ ] Indian content filter added
- [ ] Version bumped to 2

### After Running Update:
- [ ] No Indian movies in any genre
- [ ] Dark Knight trilogy in SUPERHEROES
- [ ] Tombstone in WESTERN
- [ ] First Blood in ACTION_CLASSIC
- [ ] Samurai movies in MARTIAL_ARTS
- [ ] No martial arts in SUPERHEROES
- [ ] Animated movies only in ANIMATION genres
- [ ] CARS genre has Fast & Furious, etc.
- [ ] SPORTS genre has Rocky, etc.
- [ ] MARTIAL_ARTS has Seven Samurai, Enter the Dragon, etc.
- [ ] Cache file created and populated
- [ ] Second run is much faster (uses cache)

---

## 📄 Files to Modify

### Required Changes:
1. **[lib/constants.js](lib/constants.js)** - Add 4 new genres
2. **[lib/deduplication.js](lib/deduplication.js)** - Update classification logic
3. **[lib/ai-classifier.js](lib/ai-classifier.js)** - Add caching system
4. **[scripts/nightly-update.js](scripts/nightly-update.js)** - Ensure new genres fetched

### Optional Changes:
5. **[README.md](README.md)** - Update genre list
6. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Document caching system

---

## ⏱️ Estimated Time

- **Phase 1:** 10 minutes (add constants)
- **Phase 2:** 45 minutes (deduplication logic)
- **Phase 3:** 60 minutes (AI caching)
- **Phase 4:** 15 minutes (AI prompts)
- **Phase 5:** 10 minutes (TMDB fetching)
- **Phase 6:** 20 minutes (testing)

**Total:** ~2.5 hours implementation + testing

---

## 🚀 Ready to Start

**Next time you're back:**
1. Read this file
2. Read [CLASSIFICATION-RULES.md](CLASSIFICATION-RULES.md) for quick reference
3. Read [KNOWN-ISSUES.md](KNOWN-ISSUES.md) for specific problems
4. Start implementing Phase 1

**Everything is documented. No need to re-analyze the codebase.**

---

**Created:** 2025-12-03
**For:** Next development session
**Status:** Ready for implementation
