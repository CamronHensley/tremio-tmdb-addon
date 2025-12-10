# Genre Classification Priority Rules

**Last Updated:** 2025-12-10

## Overview

This document defines the rules for classifying movies into genres when a movie matches multiple genre criteria. Each movie can only be assigned to **ONE** genre in the catalog.

**IMPORTANT NOTE:**
These rules are for **manual classification** that will be performed in batches. The current catalog uses TMDB's default genre assignments as a temporary foundation. Manual classification will ensure accurate genre placement according to these priority rules.

## Target Audience

**Western Audience Focus:**
- This addon is designed for Western (primarily US/European) audiences
- Content should primarily be in English or Western languages
- Excludes regional cinema from India, Mexico, Korea, Japan, and similar markets
- Excludes anime series/films (One Piece, Attack on Titan, etc.)

**Exclusion Criteria:**
- **Bollywood/Indian Cinema** - Excluded (Hindi, Tamil, Telugu, etc.)
- **Latin American Cinema** - Excluded (Mexican, Brazilian regional content)
- **Korean Cinema** - Excluded (K-dramas, Korean films unless significant Western crossover)
- **Anime** - Excluded (Japanese animated series and films like One Piece, Attack on Titan, Naruto, etc.)
- **Chinese/Hong Kong Regional** - Excluded (unless martial arts classics with Western distribution)
- **Regional Language Films** - Excluded unless they have significant Western theatrical distribution

**Included International Content:**
- Major international releases with wide Western distribution (e.g., Parasite, Squid Game if theatrical)
- Classic martial arts films (Bruce Lee, Jackie Chan) with established Western audience
- European arthouse/international films with US/UK distribution
- Anime films from major studios (Studio Ghibli, Makoto Shinkai) with Western theatrical releases are acceptable in Animation genres

---

## Priority Hierarchy (Highest to Lowest)

When a movie matches multiple genre criteria, assign it to the genre with the **highest priority** in this list:

1. **SEASONAL** - Takes absolute priority during its active date range
2. **SUPERHEROES** - Marvel, DC superhero films (including animated superhero films like Spider-Verse, Batman animated)
3. **MARTIAL_ARTS** - Kung fu, samurai, and adjacent combat styles (wuxia, etc.)
4. **STAND_UP_COMEDY** - Very specific format (single performer, stage performance)
5. **TRUE_CRIME** - Real-life crime documentaries (murder mysteries, serial killers, investigations)
6. **PARODY** - Intentional comedy spoofs of other genres/films
7. **DISASTER** - Natural/man-made catastrophes as primary plot driver
8. **CARS** - Racing/car culture as central theme
9. **ANIMATION_ADULT** - Animated films for mature audiences (R-rated, excluding superhero)
10. **ANIMATION_KIDS** - Animated films for children/family (excluding superhero)
11. **ACTION_CLASSIC** - Pre-2000 action films (historical preservation)
12. **HORROR** - Fear/supernatural as primary element
13. **SCIFI** - Futuristic/technological speculation
14. **FANTASY** - Magic/mythological elements
15. **WAR** - Military combat as central theme
16. **WESTERN** - American frontier/cowboy setting
17. **CRIME** - Heists/organized crime/detective stories
18. **THRILLER** - Suspense/psychological tension
19. **MYSTERY** - Whodunit/investigation plots
20. **SPORTS** - Athletic competition as primary focus
21. **MUSIC** - Musical performances/biopics of musicians
22. **ROMANCE** - Love stories AND romantic comedies (romcoms)
23. **ADVENTURE** - Exploration/quests (e.g., Indiana Jones, treasure hunting)
24. **FAMILY** - Wholesome content for all ages
25. **HISTORY** - Historical events/period pieces
26. **DOCUMENTARY** - Non-fiction/educational (excluding true crime)
27. **COMEDY** - Humor as primary element (catchall for comedy, excluding romcoms/parody/standup)
28. **ACTION** - Action sequences (catchall for action)
29. **DRAMA** - Serious character study (catchall/fallback)
30. **TVMOVIE** - Made-for-TV films (lowest priority)

---

## Detailed Classification Guidelines

### SUPERHEROES
**Priority:** #2

**Includes:**
- Marvel Cinematic Universe (MCU) and related films
- DC Extended Universe (DCEU) and related films
- Standalone superhero films (Spider-Man, Batman, X-Men, Superman, etc.)
- **Animated superhero films** (Spider-Verse, Batman: Mask of the Phantasm, The Incredibles)
- Focus on characters with superpowers/extraordinary abilities fighting villains

**Key Rule:** Animated superhero films go here, NOT in Animation genres

---

### MARTIAL_ARTS
**Priority:** #3

**Includes:**
- Kung fu films (Bruce Lee, Jackie Chan, Jet Li)
- Samurai films (Akira Kurosawa, chambara genre)
- Wuxia (Crouching Tiger Hidden Dragon, Hero, House of Flying Daggers)
- Muay Thai, Taekwondo, Karate-focused films
- Adjacent styles: The Raid, Ong-Bak, Ip Man

**Key Rule:** Hand-to-hand combat with martial arts as the central focus

---

### STAND_UP_COMEDY
**Priority:** #4

**Includes:**
- Stand-up comedy specials filmed for theatrical/streaming release
- Single performer on stage format
- Comedy concert films

**Key Rule:** Very specific format - must be actual stand-up performance, not a comedy narrative film

---

### TRUE_CRIME
**Priority:** #5

**Includes:**
- Real-life crime documentaries
- Murder mysteries and serial killer investigations
- Cold case documentaries
- Crime investigation series films
- Examples: Making a Murderer, The Jinx, The Staircase (theatrical releases)

**Key Rule:** Must be non-fiction/documentary about real crimes, not fictional crime dramas

---

### PARODY
**Priority:** #6

**Includes:**
- Intentional spoofs of other films/genres
- Satirical takes on established franchises
- Examples: Airplane!, Scary Movie, Austin Powers, The Naked Gun

**Key Rule:** Must be intentionally spoofing/parodying other works, not just comedy

---

### DISASTER
**Priority:** #7

**Includes:**
- Natural disasters as primary plot (earthquakes, tornadoes, floods, volcanic eruptions)
- Man-made catastrophes (building fires, ship sinking, plane crashes)
- Examples: Twister, The Towering Inferno, Titanic (disaster aspects), San Andreas

**Key Rule:** Disaster/catastrophe survival must be the central plot driver

---

### CARS & RACING
**Priority:** #8

**Includes:**
- Racing films (Formula 1, NASCAR, street racing)
- Car culture and automotive-focused narratives
- Examples: Fast & Furious franchise, Rush, Ford v Ferrari, Days of Thunder

**Key Rule:** Cars/racing must be central to the plot, not just present

---

### ANIMATION_ADULT
**Priority:** #9

**Includes:**
- Animated films rated R or TV-MA
- Adult-oriented animation (mature themes, violence, language)
- Western animation (American, European studios)
- **Acceptable anime:** Studio Ghibli, Makoto Shinkai films with Western theatrical releases
- Excludes animated superhero films (those go to SUPERHEROES)

**Excludes:**
- Anime series films (One Piece, Attack on Titan, Naruto, etc.)
- Direct-to-video anime
- Regional anime without significant Western distribution

**Key Rule:** Must be animated AND intended for adult audiences (rating-based determination)

---

### ANIMATION_KIDS
**Priority:** #10

**Includes:**
- Animated films rated G, PG, or PG-13
- Family-friendly animation
- Pixar, Disney Animation, DreamWorks family films
- **Acceptable anime:** Studio Ghibli films (Spirited Away, My Neighbor Totoro)
- Excludes animated superhero films (those go to SUPERHEROES)

**Excludes:**
- Anime series films (Pokémon, Digimon unless major theatrical Western release)
- Regional anime without significant Western distribution

**Key Rule:** Must be animated AND family-friendly (rating-based determination)

---

### ACTION_CLASSIC
**Priority:** #11

**Includes:**
- Action films released before the year 2000
- Classic action stars (Schwarzenegger, Stallone, Willis from pre-2000)
- Examples: Die Hard (1988), Terminator 2 (1991), The Matrix (1999)

**Key Rule:** Released before 2000 AND primarily an action film

---

### ROMANCE
**Priority:** #22

**Includes:**
- Traditional romance films
- **Romantic comedies (romcoms)** - When Harry Met Sally, Notting Hill, 10 Things I Hate About You, The Proposal
- Love story as primary or co-primary plot driver

**Key Rule:** Romcoms go here, NOT in Comedy genre

---

### ADVENTURE
**Priority:** #23

**Includes:**
- Exploration and treasure hunting (Indiana Jones series, The Mummy, National Treasure)
- Quest narratives without magic (non-fantasy quests)
- Survival adventures without disaster focus

**Key Rule:** Indiana Jones is Adventure, NOT Action

---

### COMEDY
**Priority:** #27

**Includes:**
- General comedy films
- Humor as primary element
- **Excludes:** Romcoms (→ ROMANCE), Parody (→ PARODY), Stand-up (→ STAND_UP_COMEDY)

**Key Rule:** Catchall for comedies that don't fit specialized comedy categories

---

### ACTION
**Priority:** #28

**Includes:**
- Modern action films (2000+)
- General action sequences as primary element
- **Excludes:** Martial Arts (→ MARTIAL_ARTS), Superheroes (→ SUPERHEROES), Classics (→ ACTION_CLASSIC)

**Key Rule:** Catchall for action films that don't fit specialized action categories

---

### DRAMA
**Priority:** #29

**Includes:**
- Serious character studies
- Dramatic narratives without stronger genre elements
- Fallback category for films without clear genre

**Key Rule:** Lowest priority genre (except TV Movie) - only use when no other genre fits

---

## Special Notes

### Graphic Novel Adaptations
**NOT a separate genre** - Classify based on actual content:
- Watchmen → Likely **SCIFI** or **THRILLER**
- V for Vendetta → **SCIFI** or **THRILLER**
- Sin City → **CRIME** or **THRILLER**
- 300 → **WAR** or **ACTION**
- The Crow → **THRILLER** or **HORROR**

### Multi-Genre Films
When a film legitimately fits multiple genres, always choose the **higher priority** genre from the list above.

Example:
- A romantic comedy set in space → **SCIFI** (priority #12) beats **ROMANCE** (priority #21)
- A superhero film with horror elements → **SUPERHEROES** (priority #2) beats **HORROR** (priority #11)

---

## Classification Process

1. **Check SEASONAL first** - If it's the seasonal period AND the movie matches, assign to SEASONAL
2. **Work down the priority list** - Start at #2 and work down
3. **First match wins** - Assign to the first genre that matches
4. **No duplicates** - Each movie appears in exactly ONE genre
5. **When in doubt** - Choose the higher priority genre

---

## Manual Classification Workflow

### Current Implementation Status

**Automated (Temporary):**
- Catalog currently uses TMDB's default genre assignments
- Movies are fetched based on TMDB genre IDs mapped to our custom codes
- Custom genres (True Crime, Cars & Racing, etc.) start with TMDB base genre IDs
- This provides a functional catalog but doesn't perfectly match our priority rules

**Manual Classification (Planned):**
- Will be performed in batches when tokens are available
- Each movie will be reviewed and assigned to the correct genre based on priority rules
- Ensures accurate placement for custom genres and edge cases
- Guarantees no misclassification (e.g., romcoms in Comedy instead of Romance)

### When Manual Classification Happens

Manual classification will be performed for:
- **Custom genres** without TMDB equivalents (True Crime, Cars & Racing, Martial Arts, Parody, etc.)
- **Multi-genre films** where TMDB assigns multiple genres (use priority hierarchy to choose ONE)
- **Edge cases** like animated superhero films, disaster movies, etc.
- **Quality control** to ensure all movies are in their best-fit genre

### Classification Batch Process

When performing manual classification in batches:
1. Review a set of movies (e.g., 50-100 at a time)
2. Check each movie's TMDB genres, plot, and keywords
3. Apply priority hierarchy to determine correct genre
4. Update movie metadata with correct genre assignment
5. Move to next batch

This ensures the highest quality categorization while remaining manageable.

---

**Remember:** These rules ensure consistent classification across the entire catalog and prevent movies from appearing in multiple genres.
