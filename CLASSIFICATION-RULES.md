# Genre Classification Rules - Quick Reference

**Use this file for quick lookups without reading full codebase.**

**Navigation:**
- Implementation plan: [NEXT-SESSION-PLAN.md](NEXT-SESSION-PLAN.md)
- Known issues: [KNOWN-ISSUES.md](KNOWN-ISSUES.md)
- Back to start: [START-NEXT-SESSION.md](START-NEXT-SESSION.md)

---

## 🏆 Genre Priority Tiers

### Tier 1: ABSOLUTE ISOLATION (Always Win - First Match Wins)
```
Priority Order:
1. SUPERHEROES
2. ANIMATION_KIDS
3. ANIMATION_ADULT
4. MARTIAL_ARTS
5. CARS
6. SPORTS
7. STAND_UP_COMEDY
8. WESTERN
9. TV_MOVIE
10. DOCUMENTARY
```

### Tier 2: ERA-BASED SPLITS
```
ACTION_CLASSIC: release_year < 2000
ACTION: release_year >= 2000
```

### Tier 3: SPECIFICITY
```
WAR (always wins if has war tag)
HISTORY (loses to WESTERN)
HORROR (always wins if has horror tag)
```

### Tier 4-5: AI-ENHANCED
```
SCIFI vs FANTASY → AI decides
Primary genre for multi-genre → AI decides
Everything else → AI or fallback
```

---

## 🎯 Genre Detection Rules

### SUPERHEROES
**Method:** Title-based regex matching
**Regex Pattern:**
```regex
/\b(Avengers|Spider-Man|Batman|Superman|Iron Man|Thor|Black Panther|Wonder Woman|Aquaman|Flash|Guardians|Ant-Man|Doctor Strange|X-Men|Wolverine|Deadpool|Joker|Venom|Shazam|Black Widow|Hulk|Justice League|Suicide Squad|Green Lantern|Fantastic Four|Daredevil|Punisher|Hellboy|Watchmen|Kick-Ass|Hancock|Incredibles|Big Hero 6|Dark Knight)\b/i
```

**Important:**
- DO NOT use "Captain" alone (catches Captain Phillips)
- Use "Captain America" as full phrase
- Include "Dark Knight" for Batman movies

**Example Matches:**
- ✅ The Dark Knight
- ✅ Captain America: Civil War
- ✅ Spider-Man: No Way Home
- ✅ Avengers: Endgame
- ❌ Captain Phillips (not a superhero)

---

### ANIMATION_KIDS
**Method:** TMDB genre_ids + content rating
**Detection:**
- Has genre_id 16 (Animation)
- AND (family-friendly OR rated G/PG)

**Examples:**
- Toy Story
- Finding Nemo
- How to Train Your Dragon
- The Lion King
- Incredibles 2

---

### ANIMATION_ADULT
**Method:** TMDB genre_ids + content rating
**Detection:**
- Has genre_id 16 (Animation)
- AND NOT family-friendly
- Rated PG-13/R or adult themes

**Examples:**
- Akira
- Ghost in the Shell
- South Park movie
- Sausage Party

---

### MARTIAL_ARTS ⭐ NEW
**Method:** Title + keyword matching
**Detection Regex:**
```regex
/kung fu|samurai|karate|judo|muay thai|shaolin|drunken|martial arts|wushu|tai chi|aikido/i
```

**Specific Title Matches:**
```
Seven Samurai, Yojimbo, Sanjuro, Rashomon
Enter the Dragon, Fist of Fury, Way of the Dragon
Ip Man (all), The Raid (all), Ong-Bak (all)
Crouching Tiger Hidden Dragon
Legend of Drunken Master, Fist of Legend
36th Chamber of Shaolin
Kill Bill (martial arts focus)
```

**Exclude:**
- Boxing → SPORTS
- Wrestling → SPORTS
- General MMA → SPORTS (unless kung fu/karate focused)

**Examples:**
- ✅ Seven Samurai (1954)
- ✅ Enter the Dragon (1973)
- ✅ Ip Man (2008)
- ✅ The Raid (2011)
- ✅ Kung Fu Hustle (2004)
- ❌ Rocky (boxing → SPORTS)
- ❌ Warrior (MMA → SPORTS)

---

### CARS ⭐ NEW
**Method:** Title + keyword matching
**Detection Regex:**
```regex
/fast.*furious|need for speed|gran turismo|rush|ford.*ferrari|gone in 60|driven|cars|racing|street rac/i
```

**Specific Franchises:**
```
Fast & Furious (all movies)
```

**Examples:**
- ✅ Fast & Furious franchise (all)
- ✅ Rush (2013)
- ✅ Ford v Ferrari (2019)
- ✅ Gran Turismo (2023)
- ✅ Gone in 60 Seconds
- ✅ Need for Speed
- ⚠️ Cars (Pixar) → ANIMATION_KIDS (animation wins)

---

### SPORTS ⭐ NEW
**Method:** Title + keyword matching
**Detection Keywords:**
```
Boxing: Rocky, Creed, Raging Bull, The Fighter, Cinderella Man
Football: Remember the Titans, Rudy, The Blind Side, Friday Night Lights
Baseball: Moneyball, Field of Dreams, The Sandlot, A League of Their Own
Basketball: Space Jam, Hoosiers, Coach Carter
Hockey: Miracle, The Mighty Ducks
Wrestling: The Wrestler
MMA/Fighting: Warrior (if not martial arts)
```

**Detection Regex:**
```regex
/rocky|creed|boxing|football|baseball|basketball|hockey|wrestling|sport|olympics|nascar|formula/i
```

**Examples:**
- ✅ Rocky series
- ✅ Creed series
- ✅ Remember the Titans
- ✅ Moneyball
- ✅ Space Jam
- ✅ Field of Dreams
- ✅ The Wrestler
- ❌ Kung Fu movies → MARTIAL_ARTS

---

### STAND_UP_COMEDY ⭐ NEW
**Method:** Title keyword matching
**Detection Regex:**
```regex
/stand.up|live at|comedy special|recorded live|live from|comedy concert/i
```

**Examples:**
- ✅ Dave Chappelle: Sticks & Stones
- ✅ Kevin Hart: Irresponsible
- ✅ Ali Wong: Baby Cobra
- ✅ John Mulaney: Kid Gorgeous
- ❌ Superbad (regular comedy → COMEDY)

**Important:** Only stand-up specials, not comedy movies

---

### WESTERN
**Method:** TMDB genre_id 37
**Priority:** Tier 1 (always wins over ACTION, HISTORY, DRAMA)

**Examples:**
- ✅ Tombstone
- ✅ Butch Cassidy and the Sundance Kid
- ✅ The Good, the Bad and the Ugly
- ✅ Unforgiven
- ✅ True Grit

**Rule:** If has Western tag, ALWAYS goes to WESTERN (even if has action/drama/history tags)

---

### ACTION vs ACTION_CLASSIC
**Method:** Release year split
**Rule:**
```javascript
releaseYear < 2000 → ACTION_CLASSIC
releaseYear >= 2000 → ACTION
```

**Examples:**
- ✅ Die Hard (1988) → ACTION_CLASSIC
- ✅ First Blood (1982) → ACTION_CLASSIC
- ✅ Terminator 2 (1991) → ACTION_CLASSIC
- ✅ The Matrix (1999) → ACTION_CLASSIC
- ✅ John Wick (2014) → ACTION
- ✅ Mad Max: Fury Road (2015) → ACTION

**Important:** Year 2000 is the cutoff, not era/decade

---

### SCIFI vs FANTASY
**Method:** AI classification (Tier 4-5)
**Confidence Threshold:** 0.7 (70%)

**Sci-Fi Indicators:**
- Technology, space, time travel, aliens, robots, AI, dystopia
- Examples: The Matrix, Interstellar, Blade Runner

**Fantasy Indicators:**
- Magic, mythical creatures, medieval, swords & sorcery
- Examples: Lord of the Rings, Harry Potter, The Witcher

**Ambiguous Cases:**
- Star Wars → SCIFI (has technology despite "space wizards")
- Dune → SCIFI (despite mystical elements)

---

## 🚫 Content Filters

### Indian Content (BLOCKED)
**Filter Rule:**
```javascript
block if original_language in ['hi', 'te', 'ta', 'ml', 'kn', 'bn', 'pa', 'mr']
OR production_country includes 'India'
```

**Languages Blocked:**
- hi: Hindi
- te: Telugu
- ta: Tamil
- ml: Malayalam
- kn: Kannada
- bn: Bengali
- pa: Punjabi
- mr: Marathi

**Examples Blocked:**
- ❌ RRR
- ❌ Baahubali series
- ❌ Dangal
- ❌ Bajrangi Bhaijaan

---

### Japanese Content (SELECTIVE)
**Rule:** Keep Japanese movies but route correctly

**Japanese Samurai/Martial Arts:**
- Seven Samurai → MARTIAL_ARTS
- Yojimbo → MARTIAL_ARTS
- Sanjuro → MARTIAL_ARTS

**Japanese Animation:**
- Akira → ANIMATION_ADULT
- Your Name → ANIMATION_ADULT or ANIMATION_KIDS

**Other Japanese:**
- Keep if high quality/Western appeal
- Block if unknown/low popularity

---

### Western Audience Focus
**Prioritize:**
- US productions
- UK productions
- Canadian productions
- Australian productions
- European (English-language or highly popular)

**De-prioritize:**
- Non-English language films (unless classics/highly rated)
- Regional films without international appeal

---

## 🔧 Code Locations

### Main Files:
- **Genre constants:** [lib/constants.js](lib/constants.js)
- **Deduplication logic:** [lib/deduplication.js](lib/deduplication.js)
- **AI classifier:** [lib/ai-classifier.js](lib/ai-classifier.js)
- **Update script:** [scripts/nightly-update.js](scripts/nightly-update.js)

### Key Functions:
- **Superhero detection:** `lib/deduplication.js:99`
- **Tier 1 isolation:** `lib/deduplication.js:95-120`
- **Era split:** `lib/deduplication.js:88-90`
- **AI classification:** `lib/ai-classifier.js:classifyMovie()`

---

## 📊 Genre Count & Limits

**Total Genres:** 26
**Movies Per Genre:** 100
**Total Catalog:** 2,600 movies

**New Genres (4):**
- MARTIAL_ARTS
- CARS
- SPORTS
- STAND_UP_COMEDY

**Original Genres (22):**
- ACTION, ACTION_CLASSIC, ADVENTURE
- ANIMATION_KIDS, ANIMATION_ADULT
- COMEDY, CRIME, DOCUMENTARY, DRAMA
- FAMILY, FANTASY, HISTORY, HORROR
- MUSIC, MYSTERY, ROMANCE
- SCIFI, SUPERHEROES, THRILLER
- TV_MOVIE, WAR, WESTERN

---

## 🎯 Quick Reference: If Movie Has...

| Movie Has... | Goes To... | Priority |
|-------------|-----------|----------|
| Superhero in title | SUPERHEROES | Tier 1 |
| Animation tag | ANIMATION_KIDS or ANIMATION_ADULT | Tier 1 |
| Martial arts keywords | MARTIAL_ARTS | Tier 1 |
| Car/racing keywords | CARS | Tier 1 |
| Sports keywords | SPORTS | Tier 1 |
| Stand-up keywords | STAND_UP_COMEDY | Tier 1 |
| Western tag | WESTERN | Tier 1 |
| TV Movie tag | TV_MOVIE | Tier 1 |
| Documentary tag | DOCUMENTARY | Tier 1 |
| Release < 2000 + Action | ACTION_CLASSIC | Tier 2 |
| Release >= 2000 + Action | ACTION | Tier 2 |
| War tag | WAR | Tier 3 |
| History tag (no Western) | HISTORY | Tier 3 |
| Horror tag | HORROR | Tier 3 |
| Sci-Fi + Fantasy tags | AI decides | Tier 4 |
| Multiple genre tags | AI decides primary | Tier 5 |

---

**Last Updated:** 2025-12-03
**Version:** 2 (after classification fixes)
