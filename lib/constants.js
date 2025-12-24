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
  DOCUMENTARY: { id: 99, name: 'Documentary', code: 'DOCUMENTARY' },
  DRAMA: { id: 18, name: 'Drama', code: 'DRAMA' },
  TRUE_CRIME: { id: 99, name: 'True Crime', code: 'TRUE_CRIME', isCustom: true },
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

// Get genre by TMDB ID
const GENRE_BY_ID = Object.values(GENRES).reduce((acc, genre) => {
  acc[genre.id] = genre;
  return acc;
}, {});

// Get genre by code
const GENRE_BY_CODE = Object.values(GENRES).reduce((acc, genre) => {
  acc[genre.code] = genre;
  return acc;
}, {});

// All genre codes in default order
const ALL_GENRE_CODES = Object.keys(GENRES);

// ============================================================================
// ROTATION SYSTEM (for future implementation)
// ============================================================================

// Quality thresholds per genre
// TEMPORARILY LOWERED: Building catalog to 100 per genre, will raise later
const QUALITY_THRESHOLDS = {
  DEFAULT: { minVotes: 100, minRating: 5.5, minPopularity: 2 },
  DOCUMENTARY: { minVotes: 50, minRating: 5.5, minPopularity: 1 },
  TVMOVIE: { minVotes: 50, minRating: 5.5, minPopularity: 2 },
  HORROR: { minVotes: 100, minRating: 5.0, minPopularity: 2 }
};

// Day of week rotation strategies
const DAY_STRATEGIES = {
  0: 'AUDIENCE_FAVORITES',  // Sunday
  1: 'RISING_STARS',        // Monday
  2: 'CRITICAL_DARLINGS',   // Tuesday
  3: 'HIDDEN_GEMS',         // Wednesday
  4: 'BLOCKBUSTERS',        // Thursday
  5: 'FRESH_RELEASES',      // Friday
  6: 'TIMELESS_CLASSICS'    // Saturday
};

// 28-day page rotation cycle
// Reduced to 2 pages for hybrid caching (rest filled from yesterday's catalog)
const PAGE_ROTATION = {
  0: [1, 2],  // Week 1 - Fetch fresh movies, rest from cache
  1: [2, 3],  // Week 2
  2: [3, 4],  // Week 3
  3: [1, 5]   // Week 4 (mixed sampling)
};

// Genre-specific personality modifiers
const GENRE_PERSONALITIES = {
  ACTION: {
    recentYearBonus: 0.15,      // Prefer recent releases
    highBudgetBonus: 0.1,       // Bonus for blockbusters
    seasonalBoost: { months: [6, 7, 8], bonus: 0.1 }  // Summer boost
  },
  HORROR: {
    cultFilmBonus: 0.1,         // Lower budget acceptance
    seasonalBoost: { months: [10], bonus: 0.25 }  // October boost
  },
  COMEDY: {
    audienceValidationWeight: 1.3,  // Vote count matters more
    olderFilmPenalty: 0.1           // Humor ages differently
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

// ============================================================================
// END ROTATION SYSTEM
// ============================================================================

// Addon metadata
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

// TMDB API settings
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

// Movies per genre
// Number of movies per genre (configurable via environment variable)
const MOVIES_PER_GENRE = parseInt(process.env.MOVIES_PER_GENRE || '100', 10);

// Seasonal holidays configuration
// Add movie IDs manually to the 'movieIds' array for each holiday
const SEASONAL_HOLIDAYS = {
  NEW_YEARS: {
    name: "New Year's",
    dateRanges: [{ start: '12-26', end: '01-05' }],
    movieIds: []  // Add TMDB movie IDs here manually
  },
  VALENTINES: {
    name: "Valentine's Day",
    dateRanges: [{ start: '02-01', end: '02-20' }],
    movieIds: []  // Add TMDB movie IDs here manually
  },
  EASTER: {
    name: 'Easter',
    dateRanges: [{ start: '03-15', end: '04-30' }],
    movieIds: []  // Add TMDB movie IDs here manually
  },
  SUMMER: {
    name: 'Summer',
    dateRanges: [{ start: '06-01', end: '08-31' }],
    movieIds: []  // Add TMDB movie IDs here manually
  },
  INDEPENDENCE_DAY: {
    name: 'Independence Day',
    dateRanges: [{ start: '06-25', end: '07-10' }],
    movieIds: []  // Add TMDB movie IDs here manually
  },
  HALLOWEEN: {
    name: 'Halloween',
    dateRanges: [{ start: '10-01', end: '11-02' }],
    movieIds: []  // Add TMDB movie IDs here manually
  },
  THANKSGIVING: {
    name: 'Thanksgiving',
    dateRanges: [{ start: '11-03', end: '11-19' }],
    movieIds: []  // Add TMDB movie IDs here manually
  },
  CHRISTMAS: {
    name: 'Christmas',
    dateRanges: [{ start: '11-20', end: '12-25' }],
    movieIds: []  // Add TMDB movie IDs here manually
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
  SEASONAL_HOLIDAYS,
  getCurrentSeason
};
