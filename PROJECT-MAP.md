# Project Map - Quick Navigation

This file provides a quick reference for navigating the codebase efficiently.

## 📁 Directory Structure

```
stremio-tmdb-addon/
├── 📄 Core Files (READ THESE FIRST)
│   ├── README.md                    # Project overview, setup, features
│   ├── package.json                 # Dependencies, scripts
│   ├── .env.example                 # Environment variables template
│   └── netlify.toml                 # Netlify deployment config
│
├── 📚 docs/                         # All documentation (organized)
│   ├── ARCHITECTURE.md              # System architecture (355 lines)
│   ├── AI-INTEGRATION-PLAN.md       # AI classification guide (480 lines)
│   ├── REVERT-GUIDE.md              # Emergency rollback procedures
│   ├── UI-SIMPLIFICATION.md         # Genre chooser disabled (current state)
│   ├── CHANGES.md                   # Changelog
│   ├── DOCUMENTATION-UPDATES.md     # Documentation fix summary
│   └── archive/                     # Deprecated docs
│
├── 🔧 lib/                          # Core business logic
│   ├── constants.js                 # 22 genres, thresholds, strategies
│   ├── tmdb-client.js               # TMDB API wrapper
│   ├── scoring-engine.js            # Movie ranking (7 daily strategies)
│   ├── deduplication.js             # 5-tier genre assignment (1004 lines)
│   ├── hybrid-cache.js              # Cache optimization
│   ├── cache-manager.js             # Netlify Blobs wrapper
│   ├── rate-limiter.js              # Request throttling
│   ├── logger.js                    # Structured logging
│   └── __tests__/                   # Unit tests (Jest)
│       ├── scoring-engine.test.js   # 300+ tests
│       └── deduplication.test.js    # Deduplication tests
│
├── ⚡ netlify/functions/            # Serverless endpoints
│   ├── addon.js                     # Main Stremio endpoint (manifest/catalog/meta)
│   └── health.js                    # Health check endpoint
│
├── 🎨 public/                       # Static frontend
│   └── index.html                   # Configuration page (genre chooser disabled)
│
├── 🤖 scripts/                      # Automation scripts
│   ├── nightly-update.js            # Daily catalog update (GitHub Actions)
│   ├── test-local.js                # Local testing script
│   └── tests-archive/               # Old test scripts
│       ├── test-dedup.js            # Deduplication validation
│       ├── test-real-movies.js      # Real movie testing
│       └── update-log.txt           # Update logs
│
└── ⚙️ .github/workflows/            # CI/CD automation
    └── nightly-update.yml           # Scheduled update job (midnight UTC)
```

## 🎯 Quick Access by Task

### Understanding the System
1. **Architecture Overview**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
2. **Current Features**: [README.md](README.md#features)
3. **How Updates Work**: [README.md](README.md#how-updates-work)

### Working with Code

#### Making Changes
- **Add/modify genres**: [lib/constants.js](lib/constants.js) (lines 15-46)
- **Adjust scoring**: [lib/scoring-engine.js](lib/scoring-engine.js) (strategies: lines 150-300)
- **Change deduplication**: [lib/deduplication.js](lib/deduplication.js) (5-tier system)
- **Modify catalog endpoint**: [netlify/functions/addon.js](netlify/functions/addon.js)
- **Update nightly process**: [scripts/nightly-update.js](scripts/nightly-update.js)

#### Testing
- **Run all tests**: `npm test`
- **Test scoring engine**: [lib/__tests__/scoring-engine.test.js](lib/__tests__/scoring-engine.test.js)
- **Test deduplication**: [lib/__tests__/deduplication.test.js](lib/__tests__/deduplication.test.js)
- **Test locally**: `npm run update`

### Documentation by Purpose

#### For Developers
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design, data flow
- **AI Integration**: [docs/AI-INTEGRATION-PLAN.md](docs/AI-INTEGRATION-PLAN.md) - Add Qwen2.5-7B classifier

#### For Deployment
- **Setup Guide**: [README.md](README.md#quick-start) - Initial deployment
- **Environment Vars**: [README.md](README.md#environment-variables) - Required config
- **Revert Guide**: [docs/REVERT-GUIDE.md](docs/REVERT-GUIDE.md) - Rollback procedures

#### For Understanding Changes
- **Recent Changes**: [docs/CHANGES.md](docs/CHANGES.md) - Changelog
- **Doc Updates**: [docs/DOCUMENTATION-UPDATES.md](docs/DOCUMENTATION-UPDATES.md) - Doc fixes
- **UI Changes**: [docs/UI-SIMPLIFICATION.md](docs/UI-SIMPLIFICATION.md) - Genre chooser disabled

## 📊 File Sizes & Complexity

| File | Lines | Complexity | Purpose |
|------|-------|------------|---------|
| [lib/deduplication.js](lib/deduplication.js) | 1,004 | 🔴 High | 5-tier genre assignment |
| [lib/scoring-engine.js](lib/scoring-engine.js) | 550 | 🟡 Medium | Movie ranking algorithms |
| [lib/constants.js](lib/constants.js) | 300 | 🟢 Low | Genre definitions, config |
| [scripts/nightly-update.js](scripts/nightly-update.js) | 306 | 🟡 Medium | Daily update orchestration |
| [netlify/functions/addon.js](netlify/functions/addon.js) | 286 | 🟡 Medium | Stremio endpoint handler |
| [public/index.html](public/index.html) | 682 | 🟢 Low | Configuration UI |

**Legend**: 🔴 High = 500+ lines, 🟡 Medium = 200-500 lines, 🟢 Low = <200 lines

## 🚀 Common Workflows

### 1. Analyzing the Project
```bash
# Start here (in order):
1. README.md                          # Overview, features, setup
2. docs/ARCHITECTURE.md               # System architecture
3. lib/constants.js                   # Genres, config
4. lib/scoring-engine.js              # Ranking logic
5. lib/deduplication.js               # Genre assignment
6. scripts/nightly-update.js          # Update process
7. netlify/functions/addon.js         # API endpoints
```

### 2. Adding a New Genre
```bash
# Files to modify:
1. lib/constants.js                   # Add genre definition (line 15-46)
2. lib/deduplication.js               # Add assignment rules (if special)
3. public/index.html                  # Add to UI (currently disabled)
4. lib/__tests__/*.test.js            # Add tests
```

### 3. Changing Scoring Logic
```bash
# Files to modify:
1. lib/scoring-engine.js              # Modify strategy or personality
2. lib/constants.js                   # Adjust thresholds if needed
3. lib/__tests__/scoring-engine.test.js  # Update tests
```

### 4. Integrating AI Classification
```bash
# Follow this guide:
docs/AI-INTEGRATION-PLAN.md

# Files to create:
1. lib/ai-classifier.js               # AI classification module
2. lib/__tests__/ai-classifier.test.js  # Tests
3. .env                               # Add AI_ENABLED, AI_ENDPOINT

# Files to modify:
1. lib/deduplication.js               # Integrate AI classification
2. scripts/nightly-update.js          # Enable AI in update
3. package.json                       # Add axios dependency
```

### 5. Deploying Changes
```bash
# For code changes:
git add .
git commit -m "Description"
git push origin main                  # Netlify auto-deploys

# For catalog updates:
# GitHub Actions runs automatically at midnight UTC
# Or manually trigger: GitHub → Actions → Run workflow
```

## 🔍 Finding Specific Logic

### Genre Assignment Logic
- **Tier 1 (Absolute Isolation)**: [lib/deduplication.js:85-170](lib/deduplication.js)
  - Superheroes, Animation, TV Movies, Documentaries
- **Tier 2 (Sci-Fi vs Fantasy)**: [lib/deduplication.js:172-200](lib/deduplication.js)
- **Tier 3 (Specificity)**: [lib/deduplication.js:202-230](lib/deduplication.js)
  - War, History, Horror
- **Tier 4 (Era-Based)**: [lib/deduplication.js:232-260](lib/deduplication.js)
  - Action Classic vs Modern Action
- **Tier 5 (Primary Genre)**: [lib/deduplication.js:262-300](lib/deduplication.js)

### Scoring Components
- **Base Score**: [lib/scoring-engine.js:150-180](lib/scoring-engine.js)
  - Popularity (40%), Rating (35%), Vote Count (25%)
- **7 Daily Strategies**: [lib/scoring-engine.js:200-400](lib/scoring-engine.js)
  - RISING_STARS, CRITICAL_DARLINGS, HIDDEN_GEMS, etc.
- **Genre Personalities**: [lib/scoring-engine.js:420-550](lib/scoring-engine.js)
  - Per-genre modifiers, seasonal bonuses

### API Endpoints
- **Manifest**: [netlify/functions/addon.js:101-105](netlify/functions/addon.js)
- **Catalog**: [netlify/functions/addon.js:107-149](netlify/functions/addon.js)
- **Meta**: [netlify/functions/addon.js:151-194](netlify/functions/addon.js)

### Caching System
- **Hybrid Cache**: [lib/hybrid-cache.js:18-74](lib/hybrid-cache.js)
- **Cache Manager**: [lib/cache-manager.js:42-105](lib/cache-manager.js)
- **Netlify Blobs**: [lib/cache-manager.js:32-37](lib/cache-manager.js)

## 🎓 Learning Path

### Beginner (Understanding the basics)
1. Read [README.md](README.md) - Overview
2. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture
3. Explore [lib/constants.js](lib/constants.js) - Configuration
4. Browse [public/index.html](public/index.html) - Frontend

### Intermediate (Understanding logic)
1. Study [lib/scoring-engine.js](lib/scoring-engine.js) - Ranking
2. Study [lib/deduplication.js](lib/deduplication.js) - Genre assignment
3. Study [scripts/nightly-update.js](scripts/nightly-update.js) - Update flow
4. Study [netlify/functions/addon.js](netlify/functions/addon.js) - API

### Advanced (Making changes)
1. Review [lib/__tests__/](lib/__tests__/) - Test patterns
2. Read [docs/AI-INTEGRATION-PLAN.md](docs/AI-INTEGRATION-PLAN.md) - AI integration
3. Experiment with [scripts/test-local.js](scripts/test-local.js) - Local testing
4. Modify scoring/deduplication logic

## 📝 Important Notes

### Current State (as of v1.3.0)
- **Genre chooser**: Disabled in UI (always uses all 22 genres)
- **API calls**: 2,640/day (20 pages, building catalog)
- **Hybrid cache**: 100% fresh (can optimize to ~800 calls/day)
- **Movies per genre**: 100 (2,200 total)
- **Pagination**: Enabled (unlimited scrolling in Discover tab)

### Planned Changes
- **AI classification**: Integrate Qwen2.5-7B for better accuracy
- **Hybrid cache optimization**: Enable 30% fresh + 70% cached
- **Pre-1970s limit**: Make configurable per genre
- **UI update**: Show all 22 genres with icons

### Disabled/Archived
- **Genre selection UI**: Hidden ([public/index.html:440-455](public/index.html))
- **Old test scripts**: Moved to [scripts/tests-archive/](scripts/tests-archive/)
- **Update logs**: Archived ([scripts/tests-archive/update-log.txt](scripts/tests-archive/update-log.txt))

## 🔗 External Resources

- **TMDB API**: https://developers.themoviedb.org/
- **Stremio Addon SDK**: https://github.com/Stremio/stremio-addon-sdk
- **Netlify Functions**: https://docs.netlify.com/functions/overview/
- **Netlify Blobs**: https://docs.netlify.com/blobs/overview/
- **GitHub Actions**: https://docs.github.com/en/actions
- **Ollama (AI)**: https://ollama.ai/
- **Qwen Models**: https://huggingface.co/Qwen/Qwen2.5-7B-Instruct

---

**Last Updated**: 2025-12-03
**Version**: 1.3.0
**Status**: Production-ready, AI integration planned
