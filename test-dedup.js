/**
 * Test script to verify deduplication changes:
 * 1. Animation blocking
 * 2. Tier reordering (LOTR should go to Fantasy, not Action)
 * 3. Pre-1970s limiting
 */

const DeduplicationProcessor = require('./lib/deduplication');
const { GENRES } = require('./lib/constants');

// Mock TMDB movies for testing
const mockMovies = {
  // Test 1: Animation blocking
  ANIMATION_KIDS: [
    {
      id: 1,
      title: 'Toy Story',
      genre_ids: [16, 10751, 35],  // Animation, Family, Comedy
      release_date: '1995-11-22',
      vote_average: 8.3,
      vote_count: 15000,
      popularity: 85
    }
  ],

  // Test 2: LOTR should go to Fantasy (not Action)
  FANTASY: [
    {
      id: 2,
      title: 'The Lord of the Rings: The Return of the King',
      genre_ids: [12, 14, 28],  // Adventure, Fantasy, Action
      release_date: '2003-12-17',
      vote_average: 8.9,
      vote_count: 21000,
      popularity: 95
    }
  ],
  ACTION: [
    {
      id: 2,  // Same movie
      title: 'The Lord of the Rings: The Return of the King',
      genre_ids: [12, 14, 28],
      release_date: '2003-12-17',
      vote_average: 8.9,
      vote_count: 21000,
      popularity: 95
    }
  ],

  // Test 3: Pre-1970s limiting
  DRAMA: [
    {
      id: 3,
      title: 'The Godfather',
      genre_ids: [18, 80],  // Drama, Crime
      release_date: '1972-03-24',
      vote_average: 8.7,
      vote_count: 17000,
      popularity: 92
    },
    {
      id: 4,
      title: '12 Angry Men',
      genre_ids: [18],  // Drama
      release_date: '1957-04-10',
      vote_average: 8.9,
      vote_count: 7000,
      popularity: 45
    },
    {
      id: 5,
      title: 'Casablanca',
      genre_ids: [18, 10749],  // Drama, Romance
      release_date: '1942-11-26',
      vote_average: 8.5,
      vote_count: 5000,
      popularity: 50
    },
    {
      id: 6,
      title: 'Citizen Kane',
      genre_ids: [18],  // Drama
      release_date: '1941-05-01',
      vote_average: 8.3,
      vote_count: 4000,
      popularity: 40
    },
    {
      id: 7,
      title: 'Sunset Boulevard',
      genre_ids: [18],  // Drama
      release_date: '1950-08-25',
      vote_average: 8.4,
      vote_count: 3500,
      popularity: 38
    },
    {
      id: 8,
      title: 'The Apartment',
      genre_ids: [18, 35],  // Drama, Comedy
      release_date: '1960-06-21',
      vote_average: 8.3,
      vote_count: 3000,
      popularity: 36
    },
    {
      id: 9,
      title: 'The Great Escape',
      genre_ids: [18, 12],  // Drama, Adventure
      release_date: '1963-07-04',
      vote_average: 8.2,
      vote_count: 3200,
      popularity: 42
    },
    // This one should be REJECTED (exceeds 5% limit)
    {
      id: 10,
      title: 'Lawrence of Arabia',
      genre_ids: [18, 12],  // Drama, Adventure
      release_date: '1962-12-16',
      vote_average: 8.3,
      vote_count: 2800,
      popularity: 45
    }
  ]
};

console.log('🧪 Testing Deduplication Processor\n');
console.log('=' .repeat(60));

const processor = new DeduplicationProcessor();
const result = processor.processAllGenres(mockMovies);

console.log('\n📊 RESULTS:\n');

console.log('Debug: Checking which Drama movies made it through...');
const dramaResult = result.DRAMA || [];
dramaResult.forEach((m, i) => {
  const year = parseInt(m.release_date.split('-')[0]);
  console.log(`  ${i + 1}. ${m.title} (${year}) ${year < 1970 ? '🔴 PRE-1970' : '🟢 POST-1970'}`);
});
console.log('');

// Test 1: Animation blocking
console.log('Test 1: Animation Blocking');
console.log('-'.repeat(60));
const animationKidsCount = (result.ANIMATION_KIDS || []).length;
const animationAdultCount = (result.ANIMATION_ADULT || []).length;
console.log(`Animation (Kids) movies: ${animationKidsCount}`);
console.log(`Animation (Adult) movies: ${animationAdultCount}`);
console.log(`✅ PASS: All animation blocked` + (animationKidsCount === 0 && animationAdultCount === 0 ? '' : ' ❌ FAIL'));

// Test 2: LOTR in Fantasy (not Action)
console.log('\nTest 2: LOTR Genre Assignment (Fantasy vs Action)');
console.log('-'.repeat(60));
const fantasyMovies = result.FANTASY || [];
const actionMovies = result.ACTION || [];
const lotrInFantasy = fantasyMovies.find(m => m.id === 2);
const lotrInAction = actionMovies.find(m => m.id === 2);
console.log(`LOTR in Fantasy: ${lotrInFantasy ? '✅ YES' : '❌ NO'}`);
console.log(`LOTR in Action: ${lotrInAction ? '❌ YES (BUG!)' : '✅ NO (CORRECT)'}`);
if (lotrInFantasy) {
  console.log('✅ PASS: LOTR correctly assigned to Fantasy');
} else if (lotrInAction) {
  console.log('❌ FAIL: LOTR incorrectly assigned to Action');
} else {
  console.log('⚠️  LOTR not found in either genre');
}

// Test 3: Pre-1970s limiting
console.log('\nTest 3: Pre-1970s Limiting (5% = 5 movies max)');
console.log('-'.repeat(60));
const dramaMovies = result.DRAMA || [];
const pre1970Drama = dramaMovies.filter(m => {
  const year = parseInt(m.release_date.split('-')[0]);
  return year < 1970;
});
console.log(`Total Drama movies: ${dramaMovies.length}`);
console.log(`Pre-1970s Drama movies: ${pre1970Drama.length}`);
pre1970Drama.forEach(m => {
  const year = m.release_date.split('-')[0];
  console.log(`  - ${m.title} (${year})`);
});
const limit = Math.floor(100 * 0.05);  // 5% of 100
console.log(`Limit: ${limit} movies`);
if (pre1970Drama.length <= limit) {
  console.log(`✅ PASS: Pre-1970s count (${pre1970Drama.length}) within limit (${limit})`);
} else {
  console.log(`❌ FAIL: Pre-1970s count (${pre1970Drama.length}) exceeds limit (${limit})`);
}

console.log('\n' + '='.repeat(60));
console.log('Test complete!\n');
