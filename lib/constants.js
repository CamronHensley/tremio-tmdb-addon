/**
 * Genre definitions and addon constants
 */

// TMDB Genre IDs mapped to our internal codes
const GENRES = {
  SEASONAL: { id: null, name: 'Seasonal', code: 'SEASONAL', isSeasonal: true },
  ACTION: { id: 28, name: 'Action', code: 'ACTION' },
  ACTION_CLASSIC: { id: 28, name: 'Classic Action', code: 'ACTION_CLASSIC', isClassic: true },
  ADVENTURE: { id: 12, name: 'Adventure', code: 'ADVENTURE' },
  ANIMATION_KIDS: { id: 16, name: 'Animation (Kids)', code: 'ANIMATION_KIDS', isKids: true },
  ANIMATION_ADULT: { id: 16, name: 'Animation (Adult)', code: 'ANIMATION_ADULT', isAdult: true },
  CARS: { id: 28, name: 'Cars & Racing', code: 'CARS', isCustom: true },
  COMEDY: { id: 35, name: 'Comedy', code: 'COMEDY' },
  CRIME: { id: 80, name: 'Crime', code: 'CRIME' },
  DISASTER: { id: 28, name: 'Disaster', code: 'DISASTER', isCustom: true },
  DOCUMENTARY: { id: 99, name: 'Documentary', code: 'DOCUMENTARY', useKeywords: true, keywords: '9715' },
  NATURE: { id: 99, name: 'Nature & Wildlife', code: 'NATURE', isCustom: true, useKeywords: true, keywords: '10683|186565|207928' },
  DRAMA: { id: 18, name: 'Drama', code: 'DRAMA' },
  TRUE_CRIME: { id: 99, name: 'True Crime', code: 'TRUE_CRIME', isCustom: true, useKeywords: true, keywords: '4276|1965|3133|207090' },
  FAMILY: { id: 10751, name: 'Family', code: 'FAMILY' },
  FANTASY: { id: 14, name: 'Fantasy', code: 'FANTASY' },
  HISTORY: { id: 36, name: 'History', code: 'HISTORY' },
  HORROR: { id: 27, name: 'Horror', code: 'HORROR' },
  MARTIAL_ARTS: { id: 28, name: 'Martial Arts', code: 'MARTIAL_ARTS', isCustom: true },
  MUSIC: { id: 10402, name: 'Music', code: 'MUSIC' },
  MYSTERY: { id: 9648, name: 'Mystery', code: 'MYSTERY' },
  PARODY: { id: 35, name: 'Parody', code: 'PARODY', isCustom: true },
  ROMANCE: { id: 10749, name: 'Romance', code: 'ROMANCE' },
  SCIFI: { id: 878, name: 'Science Fiction', code: 'SCIFI' },
  SPORTS: { id: 18, name: 'Sports', code: 'SPORTS', isCustom: true },
  STAND_UP_COMEDY: { id: 35, name: 'Stand-Up Comedy', code: 'STAND_UP_COMEDY', isCustom: true },
  SUPERHEROES: { id: 28, name: 'Superheroes', code: 'SUPERHEROES', isSuperhero: true },
  TVMOVIE: { id: 10770, name: 'TV Movie', code: 'TVMOVIE' },
  THRILLER: { id: 53, name: 'Thriller', code: 'THRILLER' },
  WAR: { id: 10752, name: 'War', code: 'WAR' },
  WESTERN: { id: 37, name: 'Western', code: 'WESTERN' }
};

const GENRE_BY_ID = Object.values(GENRES).reduce((acc, genre) => {
  acc[genre.id] = genre;
  return acc;
}, {});

const GENRE_BY_CODE = Object.values(GENRES).reduce((acc, genre) => {
  acc[genre.code] = genre;
  return acc;
}, {});

const ALL_GENRE_CODES = Object.keys(GENRES);

// Number of movies per genre (configurable via environment variable)
const MOVIES_PER_GENRE = parseInt(process.env.MOVIES_PER_GENRE || '100', 10);

// Freshness thresholds for adaptive page fetching
const TARGET_NEW_MOVIES = 15; // Average new movies per genre to aim for
const MAX_PAGES = 10; // Maximum TMDB pages to fetch per genre

// Major studio + streaming platform production company IDs (ensures quality productions with real budgets)
const MAJOR_STUDIOS = [
  // Traditional Studios (also cover their streaming platforms: Disney+, Paramount+, etc.)
  174,    // Warner Bros / Max
  33,     // Universal Pictures / Peacock
  4,      // Paramount Pictures / Paramount+
  2,      // Walt Disney Pictures / Disney+
  5,      // Columbia Pictures (Sony)
  25,     // 20th Century Fox
  21,     // Metro-Goldwyn-Mayer (MGM) / MGM+
  3,      // Pixar
  7,      // DreamWorks
  420,    // Marvel Studios
  521,    // DreamWorks Animation
  429,    // Scott Free Productions
  1632,   // Lionsgate Films
  923,    // Legendary Pictures
  12,     // New Line Cinema
  34,     // Sony Pictures Entertainment
  306,    // 20th Century Animation
  711,    // Fox 2000 Pictures
  10163,  // Working Title Films
  6194,   // Miramax
  43,     // Fox Searchlight Pictures
  1,      // Lucasfilm
  19177,  // Regency Enterprises
  234,    // Village Roadshow Pictures

  // Streaming-Only Platforms
  213,    // Netflix
  2301,   // Amazon Studios / Prime Video
  210099, // Amazon MGM Studios
  14439,  // Apple TV+ / Apple Original Films
  2785,   // HBO Films
  3268,   // HBO Max (additional to Warner Bros)
  127928, // Hulu
  11073,  // Peacock (additional to Universal)
  1284,   // Showtime Networks
  10342,  // Discovery+ / Discovery Inc
  11092,  // IFC Films
  60,     // BBC Films
  19551,  // Canal+

  // Prestige Indie / Modern Studios
  491,    // A24
  41077,  // Annapurna Pictures
  2550,   // Blumhouse Productions
  1885,   // Neon
  13240,  // Film4 Productions
  10146,  // New Regency Pictures
  11614,  // Lakeshore Entertainment
  2087,   // Relativity Media
  10295,  // Participant
  9168,   // STXfilms
  11,     // Amblin Entertainment
  10432,  // The Criterion Collection
  694,    // Focus Features
  7295,   // Cross Creek Pictures

  // Documentary & Factual Content Producers
  1436,   // National Geographic
  7429,   // Vice Media
  2698,   // CNN Films
  521,    // Magnolia Pictures
  23243,  // Tremolo Productions
  10338,  // Participant Media
  11395,  // RadicalMedia
  2076,   // Oscilloscope
  41,     // Sundance Institute
  10007,  // Jigsaw Productions
  2550,   // PBS / American Experience
  3045,   // Music Box Films
  10094,  // Impact Partners
  8561,   // Diamond Docs
  12,     // Frontline (PBS)
  152360, // XTR
  39,     // Moxie Pictures
  10846,  // Dogwoof
  3,      // Submarine Entertainment
  10752,  // Cinetic Media
  11073,  // ITVS (Independent Television Service)
  521,    // FilmRise
  60,     // POV (PBS)
  10091,  // The Documentary Group
  10342,  // Left/Right Productions
  7429,   // Ro*co Films
  10295,  // Red Box Films
  41077,  // Pentimento Productions
  10146,  // Article 19 Films
  11092,  // Motto Pictures
  10338,  // Tangled Bank Studios
  11395,  // Passion Pictures
  60,     // Story Syndicate
  10094,  // Artemis Rising
  152360, // Third Eye Motion Picture Company

  // Comedy & Stand-up Producers
  10769,  // Roast Beef Productions
  84041,  // Comedy Dynamics (Stand-up specials)
  152412, // 800 Pound Gorilla
  4,      // Gary Sanchez Productions (Will Ferrell/Adam McKay)
  923,    // Apatow Productions
  1632,   // 3 Arts Entertainment
  521,    // Generate (Comedy)
  10163,  // Funny or Die
  923,    // Broadway Video (SNL, Lorne Michaels)
  11,     // New Wave Entertainment
  491,    // Comedy Central Productions
  2301,   // Comedy Central Films
  60,     // Above Average Productions
  10094,  // Big Talk Productions
  234,    // Bad Robot Productions (comedy division)
  3268,   // STX Entertainment
  11092   // LD Entertainment
].join('|');

const QUALITY_THRESHOLDS = {
  DEFAULT: { minVotes: 50 },
  DOCUMENTARY: { minVotes: 30 },
  TVMOVIE: { minVotes: 40 },
  HORROR: { minVotes: 50 }
};

const DAY_STRATEGIES = {
  0: 'AUDIENCE_FAVORITES',
  1: 'RISING_STARS',
  2: 'CRITICAL_DARLINGS',
  3: 'HIDDEN_GEMS',
  4: 'BLOCKBUSTERS',
  5: 'FRESH_RELEASES',
  6: 'TIMELESS_CLASSICS'
};

const PAGE_ROTATION = {
  0: [1, 2],
  1: [2, 3],
  2: [3, 4],
  3: [1, 5]
};

const GENRE_PERSONALITIES = {
  ACTION: {
    recentYearBonus: 0.15,
    highBudgetBonus: 0.1,
    seasonalBoost: { months: [6, 7, 8], bonus: 0.1 }
  },
  HORROR: {
    cultFilmBonus: 0.1,
    seasonalBoost: { months: [10], bonus: 0.25 }
  },
  COMEDY: {
    audienceValidationWeight: 1.3,
    olderFilmPenalty: 0.1
  },
  DRAMA: {
    awardSeasonBonus: { months: [1, 2, 3], bonus: 0.15 },
    criticalAcclaimWeight: 1.2
  },
  SCIFI: {
    franchiseBonus: 0.1,
    visualEffectsWeight: 1.1
  },
  ROMANCE: {
    seasonalBoost: { months: [2, 12], bonus: 0.15 }  // Valentine's & Christmas
  },
  ANIMATION: {
    familyFriendlyBonus: 0.1,
    studioReputationWeight: 1.1
  },
  DOCUMENTARY: {
    recencyWeight: 1.2,
    topicalBonus: 0.1
  },
  CRIME: {
    goldenEraBonus: { yearRange: [1990, 2010], bonus: 0.1 }
  },
  FAMILY: {
    holidayBoost: { months: [11, 12], bonus: 0.15 }
  },
  FANTASY: {
    epicScaleBonus: 0.1
  },
  HISTORY: {
    awardSeasonBonus: { months: [1, 2, 3], bonus: 0.1 }
  },
  THRILLER: {
    sweetSpotRating: { min: 7.0, max: 8.5, bonus: 0.1 }
  },
  WAR: {
    historicalAccuracyBonus: 0.05
  },
  WESTERN: {
    classicEraBonus: { yearRange: [1950, 1980], bonus: 0.15 }
  }
};

const ADDON_META = {
  id: 'community.tmdb.genres',
  version: '1.3.0',
  name: 'TMDB Genre Explorer',
  description: 'Discover movies organized by genre with daily rotating content. Powered by The Movie Database (TMDB).',
  logo: 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3edd904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg',
  background: 'https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
  catalogs: [],  // Populated dynamically
  resources: ['catalog', 'meta'],
  types: ['movie'],
  idPrefixes: ['tmdb:'],
  behaviorHints: {
    configurable: true,
    configurationRequired: false
  }
};

const TMDB_CONFIG = {
  baseUrl: 'https://api.themoviedb.org/3',
  imageBaseUrl: 'https://image.tmdb.org/t/p',
  posterSize: 'w500',
  backdropSize: 'original',
  requestsPerBatch: 10,
  batchDelayMs: 500,
  maxRetries: 3,
  retryDelayMs: 1000
};

const SEASONAL_HOLIDAYS = {
  NEW_YEARS: {
    name: "New Year's",
    dateRanges: [{ start: '12-26', end: '01-05' }],
    movieIds: []
  },
  VALENTINES: {
    name: "Valentine's Day",
    dateRanges: [{ start: '02-01', end: '02-20' }],
    movieIds: []
  },
  EASTER: {
    name: 'Easter',
    dateRanges: [{ start: '03-15', end: '04-30' }],
    movieIds: []
  },
  SUMMER: {
    name: 'Summer',
    dateRanges: [{ start: '06-01', end: '08-31' }],
    movieIds: []
  },
  INDEPENDENCE_DAY: {
    name: 'Independence Day',
    dateRanges: [{ start: '06-25', end: '07-10' }],
    movieIds: []
  },
  HALLOWEEN: {
    name: 'Halloween',
    dateRanges: [{ start: '10-01', end: '11-02' }],
    movieIds: []
  },
  THANKSGIVING: {
    name: 'Thanksgiving',
    dateRanges: [{ start: '11-03', end: '11-19' }],
    movieIds: []
  },
  CHRISTMAS: {
    name: 'Christmas',
    dateRanges: [{ start: '11-20', end: '12-25' }],
    movieIds: []
  }
};

function isDateInRange(current, start, end) {
  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

function getCurrentSeason() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDate = `${month}-${day}`;

  const holidays = ['NEW_YEARS', 'VALENTINES', 'EASTER', 'INDEPENDENCE_DAY', 'SUMMER', 'HALLOWEEN', 'THANKSGIVING', 'CHRISTMAS'];
  for (const key of holidays) {
    const holiday = SEASONAL_HOLIDAYS[key];
    for (const range of holiday.dateRanges) {
      if (isDateInRange(currentDate, range.start, range.end)) {
        return { key, ...holiday };
      }
    }
  }
  return { key: 'SUMMER', ...SEASONAL_HOLIDAYS.SUMMER };
}

module.exports = {
  GENRES,
  GENRE_BY_ID,
  GENRE_BY_CODE,
  ALL_GENRE_CODES,
  QUALITY_THRESHOLDS,
  DAY_STRATEGIES,
  PAGE_ROTATION,
  GENRE_PERSONALITIES,
  ADDON_META,
  TMDB_CONFIG,
  MOVIES_PER_GENRE,
  TARGET_NEW_MOVIES,
  MAX_PAGES,
  SEASONAL_HOLIDAYS,
  getCurrentSeason,
  MAJOR_STUDIOS
};
