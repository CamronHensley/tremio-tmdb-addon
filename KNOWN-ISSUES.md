# Known Issues - Specific Problems List

**Use this file to see exact problems without analyzing catalog.**

**Navigation:**
- Implementation plan: [NEXT-SESSION-PLAN.md](NEXT-SESSION-PLAN.md)
- Classification rules: [CLASSIFICATION-RULES.md](CLASSIFICATION-RULES.md)
- Back to start: [START-NEXT-SESSION.md](START-NEXT-SESSION.md)

---

## ❌ Superheroes Genre Issues

### Movies in Wrong Genre (Should be SUPERHEROES)

| Movie Title | Year | Current Genre | Should Be |
|------------|------|---------------|-----------|
| The Dark Knight | 2008 | ACTION | SUPERHEROES |
| The Dark Knight Rises | 2012 | ACTION | SUPERHEROES |
| Captain America: Civil War | 2016 | ACTION | SUPERHEROES |
| Captain America: The Winter Soldier | 2014 | ACTION | SUPERHEROES |
| Deadpool 2 | 2018 | ACTION | SUPERHEROES |
| Batman: The Dark Knight Returns, Part 1 | 2012 | ACTION_CLASSIC | SUPERHEROES |
| Batman: The Dark Knight Returns, Part 2 | 2013 | ACTION_CLASSIC | SUPERHEROES |
| Justice League: The Flashpoint Paradox | 2013 | ACTION_CLASSIC | SUPERHEROES |

**Root Cause:** Superhero regex doesn't catch "Dark Knight" and "Captain" is too broad

---

### Non-Superhero Movies in SUPERHEROES

| Movie Title | Year | Current Genre | Should Be |
|------------|------|---------------|-----------|
| Sympathy for Mr. Vengeance | 2002 | SUPERHEROES | CRIME or DRAMA |
| Sanjuro | 1962 | SUPERHEROES | MARTIAL_ARTS |
| Duel | 1971 | SUPERHEROES | THRILLER |
| Kill Shot | 2023 | SUPERHEROES | ACTION |
| The Longest Day | 1962 | SUPERHEROES | WAR |
| Where Eagles Dare | 1968 | SUPERHEROES | ACTION_CLASSIC |
| Watch Out, We're Mad | 1974 | SUPERHEROES | ACTION_CLASSIC |
| The Promised Land | 2023 | SUPERHEROES | DRAMA |
| The Legend of Drunken Master | 1994 | SUPERHEROES | MARTIAL_ARTS |
| Fist of Legend | 1994 | SUPERHEROES | MARTIAL_ARTS |
| Samurai Rebellion | 1967 | SUPERHEROES | MARTIAL_ARTS |

**Root Cause:** Unknown - needs investigation of why these matched superhero regex

---

## ❌ Western Genre Issues

### Movies Should Be in WESTERN

| Movie Title | Year | Current Genre | Should Be |
|------------|------|---------------|-----------|
| Tombstone | 1993 | ACTION_CLASSIC | WESTERN |
| Butch Cassidy and the Sundance Kid | 1969 | HISTORY | WESTERN |

**Root Cause:** WESTERN not Tier 1 priority, loses to ACTION and HISTORY

---

## ❌ Era-Based Action Issues

### Pre-2000 Movies in ACTION (Should be ACTION_CLASSIC)

| Movie Title | Year | Current Genre | Should Be |
|------------|------|---------------|-----------|
| First Blood | 1982 | ACTION | ACTION_CLASSIC |

**Root Cause:** Year detection may be failing for some movies

**Note:** Check if other 1980s/1990s action movies are also misclassified

---

## ❌ Animation Issues

### Animated Movies NOT in Animation Genres

| Movie Title | Current Genre | Should Be |
|------------|---------------|-----------|
| Incredibles 2 | ACTION | ANIMATION_KIDS |
| Scooby-Doo! and KISS: Rock and Roll Mystery | COMEDY | ANIMATION_KIDS |
| Scooby-Doo! and the Samurai Sword | COMEDY | ANIMATION_KIDS |
| Happy Halloween, Scooby-Doo! | COMEDY | ANIMATION_KIDS |
| A Movie of Eggs | COMEDY | ANIMATION_KIDS |
| 10 Lives | COMEDY | ANIMATION_KIDS |

**Root Cause:** Animation detection not winning over COMEDY/ACTION

**Total Animated in Wrong Genres:**
- ACTION: 1 movie
- COMEDY: 9 movies

---

## ❌ Martial Arts Issues

### Martial Arts Movies in Wrong Genres

**In SUPERHEROES:**
- The Legend of Drunken Master (1994)
- Fist of Legend (1994)
- Samurai Rebellion (1967)

**In ACTION_CLASSIC:**
- Seven Samurai (1954) ✅ (Could stay here or move to MARTIAL_ARTS)
- Ip Man (2008) ✅ (Could stay here or move to MARTIAL_ARTS)
- Enter the Dragon (1973) ✅ (Could stay here or move to MARTIAL_ARTS)

**In ACTION:**
- The Raid 2 (2014) ✅ (Could stay here or move to MARTIAL_ARTS)
- Kung Fu Hustle (2004) ✅ (Could stay here or move to MARTIAL_ARTS)

**Decision Needed:**
- Move ALL martial arts to new MARTIAL_ARTS genre?
- Or only move the ones currently in wrong genres (SUPERHEROES)?

---

## ❌ Indian Movies Present

**Problem:** Indian movies throughout catalog, user wants them removed

**Examples Found:**
- Movies with Hindi/Telugu/Tamil/Malayalam language codes
- Production country: India
- Popular titles like RRR, Baahubali (not in current 100-per-genre sample, but in full TMDB results)

**Solution:** Filter ALL Indian content by language AND production country

---

## ❌ Stand-Up Comedy vs Comedy

**Problem:** Stand-up specials mixed with comedy movies

**Current State:** All in COMEDY genre together

**Solution:** Create STAND_UP_COMEDY genre, separate from COMEDY

**Detection Needed:** Title keywords like "Stand Up", "Live at", "Comedy Special"

---

## ❌ Missing Genres

**Currently Missing (User Requested):**
1. **MARTIAL_ARTS** - Kung fu, samurai, martial arts focus
2. **CARS** - Racing, car-focused movies
3. **SPORTS** - Boxing, football, baseball, etc.
4. **STAND_UP_COMEDY** - Comedy specials only

**Movies Waiting for These Genres:**
- Fast & Furious franchise → CARS
- Rocky, Creed → SPORTS
- Seven Samurai, Ip Man → MARTIAL_ARTS
- Dave Chappelle specials → STAND_UP_COMEDY

---

## ❌ False Positive: Captain Phillips

**Movie:** Captain Phillips (2013)
**Current Genre:** In superhero detection results
**Should Be:** THRILLER or DRAMA
**Root Cause:** Regex matches "Captain" which catches both "Captain America" and "Captain Phillips"
**Fix:** Use "Captain America" as full phrase, not just "Captain"

---

## ✅ What's Working Well

**These Are Correct:**
- Most superhero movies (Avengers, Spider-Man, Iron Man) → SUPERHEROES ✅
- Animation genres (Toy Story, Finding Nemo) → ANIMATION_KIDS ✅
- War movies → WAR ✅
- Horror movies → HORROR ✅
- Documentaries → DOCUMENTARY ✅
- Most action classics (Die Hard, Terminator 2) → ACTION_CLASSIC ✅

**AI Classification Working:**
- Sci-fi vs Fantasy distinction excellent
- High confidence scores (95% typical)
- Only 1 timeout in 3,447 classifications

---

## 📊 Issue Priority

### High Priority (Breaks User Experience)
1. ❌ Remove ALL Indian movies
2. ❌ Fix Dark Knight trilogy placement
3. ❌ Remove martial arts from SUPERHEROES
4. ❌ Fix animation leaking to other genres

### Medium Priority (User Requested)
5. ❌ Add MARTIAL_ARTS genre
6. ❌ Add CARS genre
7. ❌ Add SPORTS genre
8. ❌ Add STAND_UP_COMEDY genre
9. ❌ Fix Western priority (Tombstone, Butch Cassidy)

### Low Priority (Minor Issues)
10. ❌ Fix First Blood era classification
11. ❌ Clean up random movies in SUPERHEROES
12. ❌ Improve superhero regex precision

---

## 🔧 Root Causes Summary

| Issue | Root Cause | Fix Needed |
|-------|-----------|------------|
| Dark Knight in ACTION | "Dark Knight" not in superhero regex | Add to regex |
| Captain America in ACTION | Regex doesn't catch full "Captain America" | Fix regex |
| Captain Phillips false positive | "Captain" alone is too broad | Remove "Captain", use "Captain America" |
| Martial arts in SUPERHEROES | Unknown - investigate | Check why these match |
| Tombstone not in WESTERN | WESTERN not Tier 1 | Make WESTERN Tier 1 |
| Animations leaking | Animation not Tier 1 priority | Ensure animation is Tier 1 |
| Indian movies present | No filter implemented | Add language/country filter |
| Missing genres | Not created yet | Add 4 new genres |
| First Blood in modern ACTION | Year detection issue? | Verify year logic |

---

## 📝 Testing Commands

### Check current catalog issues:
```bash
node check-catalog.js
```

### Check superhero classifications:
```bash
node check-dark-knight.js
```

### After fixes, verify:
```bash
# Run update
npm run update

# Check catalog
node check-catalog.js

# Verify no Indian movies
node -e "
const { getStore } = require('@netlify/blobs');
require('dotenv').config();
(async () => {
  const store = getStore({ name: 'tmdb-catalog', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_ACCESS_TOKEN });
  const catalog = await store.get('catalog', { type: 'json' });
  const indianLanguages = ['hi', 'te', 'ta', 'ml', 'kn', 'bn'];
  Object.keys(catalog.genres).forEach(genre => {
    const indian = catalog.genres[genre].filter(m => indianLanguages.includes(m.original_language));
    if (indian.length > 0) console.log(\`\${genre}: \${indian.length} Indian movies - FAIL\`);
  });
  console.log('If nothing printed above, no Indian movies found - PASS');
})();
"
```

---

**Last Updated:** 2025-12-03
**Status:** Ready for fixes
**Next Step:** Implement changes per [NEXT-SESSION-PLAN.md](NEXT-SESSION-PLAN.md)
