# Movie Classification Guide

## Manual Classification Process

### Step 1: Prepare Next Batch
```bash
node classify_next_500.js
```
This script identifies the next 500 unclassified movies and saves them to `next_500_to_classify.json`.

### Step 2: Manual Classification

**CRITICAL: Take your time with EACH movie. Do NOT rush through classifications.**

For EACH movie, you MUST:
1. Read the full plot summary carefully
2. Check what the movie is fundamentally ABOUT (not just secondary themes)
3. Look at TMDB genres - if "Music" appears, strongly consider MUSIC genre
4. Think about what genre shelf this movie belongs on in a video store
5. Ask: "What is the PRIMARY focus of this movie's story?"

### Step 3: Classification Rules - PRIORITY ORDER

Follow these rules in ORDER. The FIRST matching rule wins:

**TIER 1 - Highest Priority (Check First):**

**Check these in order - first match wins:**

1. **Holiday movies (Christmas, Halloween, etc.)** → `SEASONAL`
   - Movies specifically about holidays (Christmas, Halloween, Thanksgiving, Valentine's Day, New Year's, Easter, Independence Day)
   - Examples: Home Alone, Hocus Pocus, Frankenweenie, A Christmas Carol, The Nightmare Before Christmas
   - **CRITICAL:** SEASONAL overrides ANIMATION - animated Christmas/Halloween movies go here
   - **CRITICAL:** Halloween movies = SEASONAL (NOT FAMILY, NOT COMEDY, NOT HORROR, NOT ANIMATION)
   - **CRITICAL:** Christmas movies = SEASONAL (NOT FAMILY, NOT COMEDY, NOT DRAMA, NOT ANIMATION)
   - **NOTE:** SEASONAL has automatic date-based subgenres (Halloween: Oct 1-Nov 2, Christmas: Nov 20-Dec 25, etc.)
   - Halloween examples: Frankenweenie, Trick or Treat Scooby-Doo!, Mutant Pumpkins from Outer Space
   - Christmas examples: Home Alone, The Grinch, Elf, A Christmas Story, The Polar Express

2. **ALL animated films** → `ANIMATION_KIDS` or `ANIMATION_ADULT`
   - If it's animated AND not a holiday movie, it goes here
   - Exception: Holiday-themed animated movies go to SEASONAL instead

3. **Music/Musical/Concert films** → `MUSIC`
   - **CHECK TMDB GENRES FIRST:** If "Music" appears in TMDB genres, it goes to MUSIC. No exceptions.
   - ANY movie where music is central to the plot (musicals, music biopics, concert films)
   - Examples: Bohemian Rhapsody, La La Land, Yesterday, Bob Marley: One Love, A Star is Born, Notorious, Get on Up, All Eyez on Me, Respect
   - If the protagonist is a musician OR the plot revolves around music/performance → MUSIC
   - **CRITICAL:** Music biopics = MUSIC (NOT HISTORY, NOT DRAMA, NOT DOCUMENTARY)
   - **CRITICAL:** Musicals = MUSIC (NOT COMEDY, NOT DRAMA, NOT ROMANCE, NOT FAMILY)

4. **Superhero films** → `SUPERHEROES`
   - Marvel, DC, or any superhero characters
   - Examples: Spider-Man, Batman, Avengers, Madame Web, Morbius, Venom
   - **CRITICAL:** All Marvel/DC movies = SUPERHEROES (NOT ACTION, NOT SCIFI, NOT FANTASY)

**TIER 2 - Specific Genres:**
5. **Nature & Wildlife documentaries** → `NATURE`
6. **True Crime documentaries** → `TRUE_CRIME`
7. **Stand-up comedy specials** → `STAND_UP_COMEDY`
8. **Cars/Racing movies** → `CARS`
   - Formula 1, NASCAR, rally racing, street racing
   - Examples: Rush, Ford v Ferrari, Fast & Furious series
   - **CRITICAL:** Car racing = CARS (NOT SPORTS, NOT ACTION)
9. **Sports movies** → `SPORTS`
   - Traditional sports: basketball, football, baseball, boxing, etc.
   - Movies where sports are the central focus, not just background
   - **NOT** for car racing (use CARS instead)
10. **Martial Arts focus** → `MARTIAL_ARTS`
11. **TV Movies** → `TVMOVIE`

**TIER 3 - Era/Setting:**
12. **Ancient/Medieval history ONLY** (Troy, 300, Gladiator, Ben-Hur, Kingdom of Heaven) → `HISTORY`
    - **ONLY** for films set in ancient/medieval/pre-1900 times
    - Examples: Ancient Rome, Ancient Greece, Medieval Europe, Biblical times
    - **CRITICAL:** Modern historical events (1900+) go to their PRIMARY genre (DRAMA, WAR, etc.)
    - **CRITICAL:** Music biopics = MUSIC (even if historical)
    - **CRITICAL:** Science fiction = SCIFI (even if set in past, like Star Trek)
    - **NOT** for: modern biopics, modern wars, recent historical events
13. **Pre-2000 action movies** → `ACTION_CLASSIC`

**TIER 4 - General Genres (only if nothing above matches):**
14. **Disaster/monster movies** → `DISASTER`
15. Then consider: ADVENTURE, COMEDY, CRIME, DOCUMENTARY, DRAMA, FAMILY, FANTASY, HORROR, MYSTERY, ROMANCE, SCIFI, THRILLER, WAR, WESTERN

### Step 3b: Common Mistakes to AVOID

**Music Genre Mistakes:**
❌ **WRONG:** Bob Marley: One Love → HISTORY (it's about a musician!)
✅ **CORRECT:** Bob Marley: One Love → MUSIC

❌ **WRONG:** Notorious (Biggie Smalls) → HISTORY (TMDB has "Music" genre!)
✅ **CORRECT:** Notorious → MUSIC

❌ **WRONG:** Get on Up (James Brown) → HISTORY (it's a music biopic!)
✅ **CORRECT:** Get on Up → MUSIC

❌ **WRONG:** All Eyez on Me (Tupac) → HISTORY (it's a music biopic!)
✅ **CORRECT:** All Eyez on Me → MUSIC

❌ **WRONG:** Respect (Aretha Franklin) → HISTORY (it's a music biopic!)
✅ **CORRECT:** Respect → MUSIC

❌ **WRONG:** Yesterday → COMEDY (entire plot is about Beatles music!)
✅ **CORRECT:** Yesterday → MUSIC

❌ **WRONG:** Bohemian Rhapsody → DRAMA (it's about Queen!)
✅ **CORRECT:** Bohemian Rhapsody → MUSIC

**Seasonal Genre Mistakes:**
❌ **WRONG:** Hocus Pocus 2 → FAMILY (it's a Halloween movie!)
✅ **CORRECT:** Hocus Pocus 2 → SEASONAL

❌ **WRONG:** The Nightmare Before Christmas → ANIMATION (it's animated BUT it's a Christmas/Halloween movie!)
✅ **CORRECT:** The Nightmare Before Christmas → SEASONAL

❌ **WRONG:** A Christmas Carol (animated) → ANIMATION (it's animated BUT it's a Christmas movie!)
✅ **CORRECT:** A Christmas Carol → SEASONAL

**Superhero Genre Mistakes:**
❌ **WRONG:** Madame Web → ACTION (it's a Marvel character!)
✅ **CORRECT:** Madame Web → SUPERHEROES

**Cars vs Sports Mistakes:**
❌ **WRONG:** Rush (Formula 1) → SPORTS (it's about car racing!)
✅ **CORRECT:** Rush → CARS

❌ **WRONG:** Ford v Ferrari → SPORTS (it's about car racing!)
✅ **CORRECT:** Ford v Ferrari → CARS

**History Genre Mistakes:**
❌ **WRONG:** Star Trek Beyond → HISTORY (it's science fiction!)
✅ **CORRECT:** Star Trek Beyond → SCIFI

❌ **WRONG:** Modern war movies → HISTORY (use WAR genre)
✅ **CORRECT:** Modern wars → WAR

**General Principle:**
❌ **WRONG:** Combining tone + subject (romantic comedy about musicians)
✅ **CORRECT:** Pick the PRIMARY focus (if it's about musicians → MUSIC)

### Step 4: Save in Batches of 500
Save your manual classifications to a JSON file in this format:
```json
[
  {"movieId": 12345, "movieName": "Movie Title", "genreCode": "GENRE"},
  {"movieId": 67890, "movieName": "Another Movie", "genreCode": "GENRE"}
]
```

### Step 5: Repeat
Run `node classify_next_500.js` again to get the next batch.

## Available Genres

- ANIMATION_KIDS
- ANIMATION_ADULT
- SEASONAL
- ACTION
- ACTION_CLASSIC
- ADVENTURE
- CARS
- COMEDY
- CRIME
- DISASTER
- DOCUMENTARY
- DRAMA
- FAMILY
- FANTASY
- HISTORY
- HORROR
- MARTIAL_ARTS
- MUSIC
- MYSTERY
- NATURE
- ROMANCE
- SCIFI
- SPORTS
- STAND_UP_COMEDY
- SUPERHEROES
- THRILLER
- TRUE_CRIME
- TVMOVIE
- WAR
- WESTERN

## Classification Guidelines - READ CAREFULLY

### Before Classifying EACH Movie:
1. ✅ **Read the FULL plot summary** - don't skim
2. ✅ **Check TMDB genres FIRST** - if "Music" appears → MUSIC genre
3. ✅ **Follow PRIORITY ORDER** - check Tier 1 first (ANIMATION, MUSIC, SEASONAL, SUPERHEROES)
4. ✅ **Ask: "What is the PRIMARY subject?"** - not the tone, the core focus
5. ✅ **MUSIC genre checklist:**
   - Does TMDB list "Music" as a genre? → MUSIC
   - Is the protagonist a musician/singer/band? → MUSIC
   - Does the plot revolve around music/performance/concerts? → MUSIC
   - Is it a biopic of a musician? → MUSIC (NOT HISTORY, NOT DRAMA)
   - Is it a musical (characters sing)? → MUSIC (NOT COMEDY, NOT ROMANCE)
6. ✅ **SEASONAL genre checklist:**
   - Is the entire plot about a holiday? → SEASONAL
   - Halloween/Christmas/Thanksgiving/Valentine's Day theme? → SEASONAL
7. ✅ **SUPERHEROES genre checklist:**
   - Marvel or DC character? → SUPERHEROES
   - Comic book superhero? → SUPERHEROES
8. ✅ **HISTORY genre checklist:**
   - Is it set in ancient/medieval times (pre-1900)? → Maybe HISTORY
   - Is it a modern event (1900+)? → NOT HISTORY, use primary genre
   - Is it about a musician? → MUSIC (even if historical)

### DO NOT:
- ❌ Rush through classifications
- ❌ Classify based on tone instead of subject (funny ≠ COMEDY, sad ≠ DRAMA)
- ❌ Put music biopics in HISTORY, DRAMA, DOCUMENTARY, or FAMILY
- ❌ Put musicals in COMEDY, ROMANCE, DRAMA, or FAMILY
- ❌ Put Halloween movies in FAMILY, HORROR, or COMEDY
- ❌ Put Marvel/DC movies in ACTION, SCIFI, or FANTASY
- ❌ Put modern historical events (1900+) in HISTORY
- ❌ Ignore TMDB genres - they're usually correct
- ❌ Skip reading the plot summary

### Quality Check:
After classifying a batch, review EVERY SINGLE MOVIE and ask:
1. **Music check:**
   - Did I check TMDB genres for "Music"? (If no, RE-CHECK)
   - Did I put ANY musician biopics in HISTORY? (If yes, FIX → MUSIC)
   - Did I put ANY musicals in COMEDY/DRAMA/ROMANCE/FAMILY? (If yes, FIX → MUSIC)
   - Did I put ANY movies about bands/singers in DRAMA/DOCUMENTARY? (If yes, FIX → MUSIC)

2. **Seasonal check:**
   - Did I put ANY Halloween movies in FAMILY/HORROR? (If yes, FIX → SEASONAL)
   - Did I put ANY Christmas movies in FAMILY/COMEDY/DRAMA? (If yes, FIX → SEASONAL)

3. **Superhero check:**
   - Did I put ANY Marvel/DC movies in ACTION? (If yes, FIX → SUPERHEROES)

4. **History check:**
   - Did I put ANY modern movies (1900+) in HISTORY? (If yes, FIX to primary genre)
   - Did I put ANY sci-fi movies in HISTORY? (If yes, FIX → SCIFI)

5. **General:**
   - Did I actually read each plot summary? (If no, START OVER)
   - Did I follow the priority order? (If no, RE-CLASSIFY)
