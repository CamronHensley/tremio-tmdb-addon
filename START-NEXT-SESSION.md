# 🚀 Stremio TMDB Addon - Quick Start Guide

**READ THIS FIRST when starting any session!**

---

## 📋 Project Overview

**Name**: Stremio TMDB Genre Explorer
**Purpose**: Stremio addon serving 28 genre-categorized movie catalogs from TMDB
**Audience**: Western viewers (US/UK/Canada/Australia) - Indian content blocked
**Daily Updates**: Nightly cron job refreshes catalog with rotating content strategies

### Key Stats
- **28 Genres** (6 added Dec 2025: MARTIAL_ARTS, CARS, SPORTS, STAND_UP_COMEDY, DISASTER, PARODY)
- **~100 movies per genre** (configurable via MOVIES_PER_GENRE env var)
- **~2,600 total movies** in active catalog
- **Classification**: Pure rule-based Tier 1-5 system (AI disabled due to misclassifications)
- **Indian Content**: Completely filtered (Western audience focus)

---

## 🏗️ Architecture Summary

### Core Components

**1. Data Flow**
```
TMDB API → Fetcher → Deduplication (Rule-Based) → Catalog → Netlify Blobs
```

**2. Key Files**
- **lib/constants.js** - 28 genre definitions, quality thresholds, personalities
- **lib/deduplication.js** - Tier-based genre routing (pure rule-based)
- **lib/ai-classifier.js** - AI integration (DISABLED, code preserved)
- **lib/ai-cache.js** - AI cache (DISABLED, code preserved)
- **scripts/nightly-update.js** - Main update orchestrator
- **netlify/functions/addon.js** - Stremio API endpoint

**3. Storage**
- Netlify Blobs: Catalog JSON
- Environment: TMDB_API_KEY, NETLIFY_SITE_ID, NETLIFY_ACCESS_TOKEN
- Optional (AI disabled): OLLAMA_ENDPOINT, AI_ENABLED=true

---

## 🎯 Genre System (28 Genres)

### Genre Routing: Tier-Based Priority System

**TIER 1: Absolute Isolation** (Always win, order matters)
1. SUPERHEROES - Marvel/DC (regex: Avengers|Spider-Man|Batman|etc + Dark Knight fix)
2. ANIMATION_KIDS - Family animation (Pixar, Disney, DreamWorks)
3. ANIMATION_ADULT - Mature animation (Waltz with Bashir, Persepolis)
4. PARODY - Spoof films (Scary Movie, Airplane!)
5. DISASTER - Natural disasters (Twister, Day After Tomorrow)
6. MARTIAL_ARTS - Kung fu/samurai (Enter the Dragon, Seven Samurai)
7. CARS - Racing films (Fast & Furious, Gran Turismo)
8. SPORTS - Sports films (Rocky, Creed, Moneyball)
9. STAND_UP_COMEDY - Comedy specials only (not movies)
10. WESTERN - Westerns (TMDB genre 37, now Tier 1)
11. TVMOVIE - Made-for-TV
12. DOCUMENTARY - Docs

**TIER 2: Era Split**
- ACTION (2000+) vs ACTION_CLASSIC (<2000)

**TIER 3: Specificity**
- WAR, HISTORY (loses to WESTERN), HORROR

**TIER 4-5: TMDB Tag-Based**
- SCIFI vs FANTASY (uses TMDB genre IDs)
- Remaining genres route by primary TMDB tag: ADVENTURE, COMEDY, CRIME, DRAMA, FAMILY, MYSTERY, ROMANCE, THRILLER, MUSIC
- Note: AI classification disabled - uses pure TMDB tag routing

### Content Filtering
- **Indian Language Block**: Hindi, Telugu, Tamil, Malayalam, Kannada, Bengali, Punjabi, Marathi
- **Result**: All Bollywood/Tollywood filtered for Western audience

---

## 🤖 AI Classification System (DISABLED)

**Status**: AI classification is **DISABLED** due to misclassifications

### Why Disabled
- AI was causing incorrect genre assignments:
  - Non-superhero movies in SUPERHEROES (Sympathy for Mr. Vengeance, Sanjuro)
  - Martial arts movies scattered across wrong genres
  - Animation leaking into ACTION/DRAMA
  - 19 superhero movies leaked into ACTION

### Current Classification Method
- **100% Rule-Based**: Uses Tier 1-5 regex and TMDB tag routing
- **Tier 1-3**: Regex patterns + TMDB genre IDs (~90% of movies)
- **Tier 4-5**: Primary TMDB genre tag (no AI inference)

### Re-enabling AI (Future)
- All AI code is **preserved** (lib/ai-classifier.js, lib/ai-cache.js)
- To re-enable: Set `AI_ENABLED=true` environment variable
- Requires fixing AI classification logic or better prompt engineering

---

## 🔧 Common Operations

### Run Catalog Update
```bash
cd stremio-tmdb-addon
npm run update  # Fetches TMDB, classifies, saves to Netlify Blobs
```

### Check Catalog Status
```bash
node check-catalog.js  # Shows genre distribution, sample movies, issues
```

### Environment Setup
```bash
# Required
TMDB_API_KEY=your_key
NETLIFY_SITE_ID=your_site
NETLIFY_ACCESS_TOKEN=your_token

# Optional
MOVIES_PER_GENRE=100  # Default 100

# AI Classification (DISABLED by default)
AI_ENABLED=true  # Set to enable AI (not recommended)
OLLAMA_ENDPOINT=http://localhost:11434  # Only if AI enabled
OLLAMA_MODEL=llama3.2:3b  # Only if AI enabled
```

### Deploy to Netlify
```bash
netlify deploy --prod  # Only after testing locally!
```

---

## 📂 Project Structure

```
stremio-tmdb-addon/
├── lib/
│   ├── constants.js          # 28 genre definitions
│   ├── deduplication.js      # Genre routing logic (1,180 lines)
│   ├── ai-classifier.js      # Ollama integration
│   ├── ai-cache.js           # Classification cache
│   ├── tmdb-client.js        # TMDB API wrapper
│   └── netlify-blobs.js      # Blob storage wrapper
├── netlify/functions/
│   └── addon.js              # Stremio API endpoint
├── scripts/
│   └── nightly-update.js     # Update orchestrator
├── check-catalog.js          # Debugging tool
├── CHANGELOG-2025-12-04.md   # Latest changes (comprehensive)
└── [docs/]                   # Historical docs (mostly outdated)
```

---

## 🐛 Recent Fixes (Dec 2025)

### Issues Resolved
1. ✅ **Superhero Misclassification** - Dark Knight trilogy, Captain America now in SUPERHEROES
2. ✅ **Western Priority** - Tombstone, Butch Cassidy now in WESTERN (Tier 1)
3. ✅ **Martial Arts Split** - Samurai/kung fu movies separated from ACTION/SUPERHEROES
4. ✅ **Animation Leaks** - Incredibles 2, Scooby-Doo properly isolated (except superhero animation)
5. ✅ **Indian Content** - All Bollywood/Tollywood blocked

### New Genres Added (6)
- MARTIAL_ARTS (kung fu, samurai)
- CARS (racing films)
- SPORTS (boxing, football, etc.)
- STAND_UP_COMEDY (comedy specials)
- DISASTER (natural disasters)
- PARODY (spoof films)

**See**: [CHANGELOG-2025-12-04.md](CHANGELOG-2025-12-04.md) for full details

---

## 🚨 Known Issues / Limitations

### Current Issues
- **Some animation leaks remain** (~11 animated movies in COMEDY, 1 in ACTION)
  - Root cause: Tier 1 animation check may miss edge cases
  - Impact: Low (most animation properly isolated)

- **Superhero regex edge cases**
  - Some non-superhero movies with "hero" in title might leak
  - Solution: AI classification catches most, manual review needed

### Design Limitations
- **Stand-up Comedy Detection**: Title-based only (may miss some specials)
- **Disaster Detection**: Title-based (may miss disaster sub-plots)
- **Parody Detection**: Title-based (may miss subtle parodies)

---

## 🔍 Debugging Guide

### Check Genre Distribution
```bash
node check-catalog.js
```
Shows:
- Movies per genre
- Sample titles from each genre
- Misclassification examples
- Indian movie count (should be 0)

### Check AI Cache Stats
Look for in update logs:
```
📊 AI Stats: 3447 classified, 0 fallbacks, 0 rule-based
💾 Cache Stats: 3200 cached, 247 new
```

### Verify Netlify Blobs
```bash
netlify blobs:list tmdb-catalog
# Should show: catalog.json, ai-classification-cache
```

---

## 📊 Daily Update Strategy

### 7-Day Content Rotation
- **Sunday**: Audience Favorites (high vote count)
- **Monday**: Rising Stars (recent + popular)
- **Tuesday**: Critical Darlings (high rating)
- **Wednesday**: Hidden Gems (low popularity, high quality)
- **Thursday**: Blockbusters (very high popularity)
- **Friday**: Fresh Releases (newest)
- **Saturday**: Timeless Classics (older + acclaimed)

### Page Rotation (28-day cycle)
- Fetches 2-3 pages per genre from TMDB
- Rotates which pages to avoid staleness
- Hybrid merge: Keeps previous catalog, adds fresh movies

---

## 🎓 AI System Details

### Ollama Model Used
- **Default**: `llama3.2:3b` (fast, good quality)
- **Alternative**: `llama3.2:1b` (faster, lower quality)

### Classification Prompt Structure
1. **Available Genres List** - All 28 with descriptions
2. **Movie Context** - Title, year, overview, TMDB genres, keywords, rating
3. **Classification Rules** - Tier priorities, special cases, examples
4. **Output Format** - JSON with genre code + confidence (0-1)

### When AI is Used
- Multi-genre movies (e.g., Action + Comedy + Drama)
- SCIFI vs FANTASY disambiguation
- Historical vs Drama vs War
- Crime vs Thriller
- Any Tier 4-5 classification

**AI NOT Used For**:
- Tier 1 genres (regex-based, 100% reliable)
- Tier 2 (era-based, date-driven)
- Tier 3 (TMDB tag-based)

---

## 📝 Quick Reference: Key Regexes

### Superhero Detection (Line 120, deduplication.js)
```regex
/\b(Avengers|Spider-Man|Batman|Superman|Iron Man|Thor|Captain America|Black Panther|Wonder Woman|Aquaman|Flash|Guardians|Ant-Man|Doctor Strange|X-Men|Wolverine|Deadpool|Joker|Venom|Shazam|Black Widow|Hulk|Justice League|Suicide Squad|Green Lantern|Fantastic Four|Daredevil|Punisher|Hellboy|Watchmen|Kick-Ass|Hancock|Incredibles|Big Hero 6|Dark Knight)\b/i
```

### Martial Arts Detection (Line 183)
```regex
/\b(kung fu|samurai|karate|judo|muay thai|shaolin|drunken|martial arts|wushu|tai chi|aikido|fist of fury|enter the dragon|ip man|the raid|ong-bak|seven samurai|yojimbo|sanjuro|crouching tiger|kill bill|fist of legend)\b/i
```

### Cars Detection (Line 199)
```regex
/\b(fast.*furious|need for speed|gran turismo|rush|ford.*ferrari|gone in 60|driven|racing|street rac|nascar|formula.*1|talladega)\b/i
```

### Sports Detection (Line 226)
```regex
/\b(rocky|creed|boxing|football|baseball|basketball|hockey|wrestling|sport|olympics|remember the titans|moneyball|rudy|field of dreams|space jam|blind side|fighter|raging bull|cinderella man|hoosiers|coach carter|miracle|mighty ducks|warrior|wrestler)\b/i
```

---

## 🔄 Next Steps After Reading This

### For New Sessions
1. Read latest [CHANGELOG-2025-12-04.md](CHANGELOG-2025-12-04.md) for recent changes
2. Check `npm run update` logs for any errors
3. Review `check-catalog.js` output for issues

### For Development
1. **Adding Genres**: Update constants.js → deduplication.js → ai-classifier.js → bump cache version
2. **Fixing Classifications**: Update regex in deduplication.js → test with check-catalog.js
3. **Changing AI Logic**: Update ai-classifier.js → bump cache version → re-run update

### For Deployment
1. Test locally with `npm run update`
2. Verify catalog with `check-catalog.js`
3. Commit changes (descriptive message)
4. Deploy with `netlify deploy --prod`
5. Monitor Netlify logs for errors

---

## 📚 Additional Documentation

**Detailed Docs** (read if needed):
- [CHANGELOG-2025-12-04.md](CHANGELOG-2025-12-04.md) - Full change history
- [README.md](README.md) - User-facing addon description
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical deep-dive (may be outdated)

**Historical** (outdated, ignore unless curious):
- NEXT-SESSION-PLAN.md, KNOWN-ISSUES.md, CLASSIFICATION-RULES.md (completed)
- AI-IMPLEMENTATION-SUMMARY.md, AI-TEST-RESULTS.md (historical)

---

## 💡 Pro Tips

### Optimizing Context Usage
- This file contains 90% of what you need to know
- Reference other files only when needed
- CHANGELOG has full implementation details
- check-catalog.js is your debugging friend

### Common Pitfalls
- ❌ Don't skip cache version bump when adding genres
- ❌ Don't deploy without testing locally first
- ❌ Don't edit Tier 1 regexes without testing edge cases
- ❌ Don't forget Indian content filter when adding genres

### Performance Tips
- Keep Ollama running locally for faster updates
- Use `llama3.2:3b` for good balance of speed/quality
- Cache version should only bump when absolutely necessary
- Monitor Netlify function logs for timeout issues

---

**Last Updated**: 2025-12-04
**Status**: Production-ready, all fixes implemented
**Next Session**: Test final catalog, then deploy

---

**TL;DR**: 28-genre Stremio addon, AI-powered classification with caching, Western audience focus (no Indian content), Tier-based routing, recently added 6 new genres + major fixes. Read CHANGELOG for full details.
