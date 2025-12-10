/**
 * Genre definitions and addon constants
 */

// TMDB Genre IDs mapped to our internal codes
const GENRES = {
  SEASONAL: { id: null, name: 'Seasonal', code: 'SEASONAL', isSeasonal: true }, // Dynamic genre based on current date
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

// Addon metadata
const ADDON_META = {
  id: 'community.tmdb.genres',
  version: '1.5.0',
  name: 'TMDB Genre Explorer',
  description: 'Discover all-time popular movies (IMDb ratings) organized by 30 genres with seasonal content, streaming badges, and HD posters. Powered by TMDB + OMDb.',
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

// Cache settings
const CACHE_CONFIG = {
  catalogTTL: 86400,        // 24 hours in seconds
  metaTTL: 86400,           // 24 hours
  cdnMaxAge: 86400,         // CDN cache
  staleWhileRevalidate: 3600  // Serve stale for 1 hour while updating
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

// Streaming service codes (matched to Wikidata Q-IDs)
const STREAMING_SERVICES = {
  NETFLIX: { code: 'NETFLIX', name: 'Netflix', wikidataId: 'Q907311' },
  DISNEY_PLUS: { code: 'DISNEY_PLUS', name: 'Disney+', wikidataId: 'Q54958752' },
  AMAZON_PRIME: { code: 'AMAZON_PRIME', name: 'Amazon Prime Video', wikidataId: 'Q16335061' },
  HULU: { code: 'HULU', name: 'Hulu', wikidataId: 'Q567867' },
  APPLE_TV_PLUS: { code: 'APPLE_TV_PLUS', name: 'Apple TV+', wikidataId: 'Q63985127' },
  HBO_MAX: { code: 'HBO_MAX', name: 'HBO Max', wikidataId: 'Q30971861' },
  PARAMOUNT_PLUS: { code: 'PARAMOUNT_PLUS', name: 'Paramount+', wikidataId: 'Q104839407' },
  PEACOCK: { code: 'PEACOCK', name: 'Peacock', wikidataId: 'Q60653127' },
  MAX: { code: 'MAX', name: 'Max', wikidataId: 'Q115052825' }
};

// Seasonal holidays with date ranges and TMDB keywords
const SEASONAL_HOLIDAYS = {
  CHRISTMAS: {
    name: 'Christmas',
    dateRanges: [
      { start: '11-15', end: '12-31' } // Mid-November through end of December
    ],
    keywords: ['christmas', 'santa claus', 'santa', 'xmas', 'holiday'],
    tmdbKeywordIds: [207317, 6962, 9377] // Christmas, Santa, Holiday film
  },
  VALENTINES: {
    name: "Valentine's Day",
    dateRanges: [
      { start: '01-25', end: '02-20' } // Late January through late February
    ],
    keywords: ['valentine', 'romance', 'love story'],
    tmdbKeywordIds: [10683] // Valentine's Day
  },
  EASTER: {
    name: 'Easter',
    dateRanges: [
      { start: '03-15', end: '04-30' } // Mid-March through April (Easter varies)
    ],
    keywords: ['easter', 'spring', 'bunny', 'resurrection'],
    tmdbKeywordIds: [170801] // Easter
  },
  HALLOWEEN: {
    name: 'Halloween',
    dateRanges: [
      { start: '10-01', end: '11-05' } // October through early November
    ],
    keywords: ['halloween', 'trick or treat', 'costume party', 'pumpkin', 'jack-o-lantern'],
    tmdbKeywordIds: [9882], // Halloween (NOT general horror)
    excludeGenres: [27] // Exclude Horror genre to keep it separate
  },
  THANKSGIVING: {
    name: 'Thanksgiving',
    dateRanges: [
      { start: '11-01', end: '11-30' } // November
    ],
    keywords: ['thanksgiving', 'turkey', 'pilgrim', 'family gathering'],
    tmdbKeywordIds: [186565] // Thanksgiving
  },
  NEW_YEAR: {
    name: "New Year's",
    dateRanges: [
      { start: '12-26', end: '12-31' }, // Late December
      { start: '01-01', end: '01-10' }  // Early January
    ],
    keywords: ['new year', 'new years eve', 'countdown', 'resolution'],
    tmdbKeywordIds: [191897] // New Year's Eve
  },
  INDEPENDENCE_DAY: {
    name: 'Independence Day',
    dateRanges: [
      { start: '06-20', end: '07-10' } // Late June through early July
    ],
    keywords: ['independence day', '4th of july', 'july 4th', 'patriotic', 'america'],
    tmdbKeywordIds: [186332] // Independence Day
  },
  SUMMER: {
    name: 'Summer',
    dateRanges: [
      { start: '05-20', end: '09-05' } // Late May through early September (when no other holiday)
    ],
    keywords: ['summer', 'beach', 'vacation', 'summer vacation'],
    tmdbKeywordIds: [10683, 6270] // Summer, Beach
  }
};

// Get current active seasonal holiday
function getCurrentSeason() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDate = `${month}-${day}`;

  // Check each holiday in priority order
  const holidays = [
    'CHRISTMAS',
    'HALLOWEEN',
    'THANKSGIVING',
    'NEW_YEAR',
    'VALENTINES',
    'EASTER',
    'INDEPENDENCE_DAY',
    'SUMMER' // Summer as fallback
  ];

  for (const holidayKey of holidays) {
    const holiday = SEASONAL_HOLIDAYS[holidayKey];
    for (const range of holiday.dateRanges) {
      if (isDateInRange(currentDate, range.start, range.end)) {
        return { key: holidayKey, ...holiday };
      }
    }
  }

  // Default to Summer if no match
  return { key: 'SUMMER', ...SEASONAL_HOLIDAYS.SUMMER };
}

// Helper to check if date is in range
function isDateInRange(date, start, end) {
  // Handle year wrap-around (e.g., 12-26 to 01-10)
  if (start > end) {
    return date >= start || date <= end;
  }
  return date >= start && date <= end;
}

module.exports = {
  GENRES,
  GENRE_BY_ID,
  GENRE_BY_CODE,
  ALL_GENRE_CODES,
  ADDON_META,
  CACHE_CONFIG,
  TMDB_CONFIG,
  MOVIES_PER_GENRE,
  STREAMING_SERVICES,
  SEASONAL_HOLIDAYS,
  getCurrentSeason
};
