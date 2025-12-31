# Misclassification Summary

This document tracks all misclassifications found that need to be fixed.

## Summary Statistics

- **Total misclassifications found:** 116+ movies
- **From automated scan (find-all-misclassified.js):** 106 movies
- **From manual review:** 3 additional movies
- **PARODY genre removal:** 7 movies (genre being eliminated)

## Manual Corrections (Not Caught by Automated Scan)

### Science Fiction in HISTORY
- **Star Trek Beyond** (ID: 188927) → Should be SCIFI
  - Currently: HISTORY
  - Reason: Science fiction movie, not historical

### Car Racing in SPORTS (Should be CARS)
- **Rush** (ID: 96721) → Should be CARS
  - Currently: SPORTS
  - Reason: Formula 1 racing movie

- **Ford v Ferrari** (ID: 359724) → Should be CARS
  - Currently: SPORTS
  - Reason: Le Mans racing movie

### PARODY Genre Removal (7 movies)
PARODY is being eliminated as a genre. Movies are being moved to COMEDY or ACTION:

**Moving to COMEDY (5 movies):**
- Airplane! (ID: 813)
- Austin Powers: International Man of Mystery (ID: 816)
- Tropic Thunder (ID: 7446)
- The Naked Gun (ID: 37136)
- Spy (ID: 238713)

**Moving to ACTION (2 movies):**
- Kingsman: The Secret Service (ID: 207703)
- Kingsman: The Golden Circle (ID: 343668)

## Automated Scan Results (misclassified_movies.json)

The automated scan found **106 movies** with likely misclassifications:

### Music Movies in Wrong Genres

**In HISTORY (5 movies):**
- Notorious (ID: 14410) - Biggie Smalls biopic
- Get on Up (ID: 239566) - James Brown biopic
- All Eyez on Me (ID: 402529) - Tupac biopic
- Respect (ID: 592863) - Aretha Franklin biopic
- Bob Marley: One Love (ID: 802219) - Bob Marley biopic

**In DRAMA (~36 movies):**
- Various music biopics and musicals

**In DOCUMENTARY (~17 movies):**
- Music documentaries

**In COMEDY (~10 movies):**
- Musical comedies (e.g., Yesterday)

**In FAMILY (~7 movies):**
- Family-friendly musicals

**In ROMANCE (~6 movies):**
- Romantic musicals

**In ANIMATION (~13 movies):**
- Animated musicals (these might be correct if animated)

### Superhero Movies in Wrong Genres (~15 movies)
- Madame Web (in ACTION)
- Various Marvel/DC movies misclassified

### Seasonal Movies in Wrong Genres
- Hocus Pocus 2 (in FAMILY) → Should be SEASONAL

## Fix Script

Run `node fix-misclassifications.js` to automatically fix all identified misclassifications.

This will:
1. Move all music movies to MUSIC genre
2. Move all superhero movies to SUPERHEROES genre
3. Move Star Trek Beyond to SCIFI
4. Move Rush and Ford v Ferrari to CARS
5. Update classification-state blob
6. Rebuild genre-assignments blob

After running the fix script, run `npm run update:catalog` to rebuild the catalog.

## Prevention

All these patterns have been added to `scripts/README_CLASSIFICATION.md` with:
- Explicit priority rules (MUSIC, SEASONAL, SUPERHEROES in Tier 1)
- Real examples from these misclassifications
- Comprehensive quality checks
- Clear warnings about what NOT to do
