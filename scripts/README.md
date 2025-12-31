# Scripts Directory

## Core Scripts (Production Use)

### Data Management
- **nightly-update.js** - Main update script that runs daily via GitHub Actions to fetch fresh TMDB data
- **rebuild-catalog.js** - Rebuilds the full catalog from TMDB data and classification state
- **rebuild-genre-assignments.js** - Rebuilds genre-assignments blob from classification-state
- **reset-cache.js** - Clears cached catalog data

### Classification
- **classify-movies.js** - Manual movie classification workflow
- **save-classifications.js** - Saves manual classification batches to Netlify Blobs
- **README_CLASSIFICATION.md** - Comprehensive guide for manual movie classification

## Archive Directory

Contains one-off scripts used during development and debugging. Organized into subdirectories:

### archive/corrections/
Scripts used to fix specific genre misclassifications:
- apply-action-superhero-corrections.js
- apply-corrections.js
- apply-superhero-corrections.js
- apply-tier1-corrections.js
- apply-user-corrections.js
- move-beetlejuice.js
- move-horror-to-halloween.js

### archive/debugging/
Diagnostic and verification scripts:
- check-action-for-superheroes.js
- check-catalog.js
- check-horror-catalog.js
- check-horror-for-halloween.js
- check-john-wick.js
- check-remaining.js
- check-superheroes.js
- compare-superheroes.js
- delete-classifications.js
- fix-tier1-priority.js
- identify-bad-classifications.js
- list-all-blobs.js
- list-all-horror-ids.js
- list-horror-movies.js
- manual-classify-batch.js
- show-all-movies.js
- test-seasonal-filtering.js
- verify-corrections.js

### archive/search/
Scripts for finding specific movies in the catalog:
- find-all-misclassifications.js
- find-frankenweenie.js
- find-gran-turismo.js
- find-specific-movies.js
- get-all-horror-from-classifications.js
- get-documentary-movies.js
- get-genre-movies.js
- get-seasonal-movies.js
- get-superhero-details.js
- search-frankenweenie.js

## Usage

### Daily Updates
```bash
npm run update  # Runs nightly-update.js
```

### Manual Classification
```bash
node scripts/classify-movies.js
node scripts/save-classifications.js
```

### Rebuild Data
```bash
node scripts/rebuild-catalog.js
node scripts/rebuild-genre-assignments.js
```

### Clear Cache
```bash
node scripts/reset-cache.js
```
