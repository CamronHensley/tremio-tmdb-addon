const { getCurrentSeason, SEASONAL_HOLIDAYS } = require('../lib/constants');

console.log('\n' + '='.repeat(70));
console.log('SEASONAL FILTERING TEST');
console.log('='.repeat(70));

// Test current season
const currentSeason = getCurrentSeason();
console.log('\nCurrent Season:', currentSeason.name);
console.log('Season Key:', currentSeason.key);
console.log('Date Ranges:', currentSeason.dateRanges);
console.log('Movie IDs:', currentSeason.movieIds);
console.log('Total Movies:', currentSeason.movieIds ? currentSeason.movieIds.length : 0);

console.log('\n' + '='.repeat(70));
console.log('ALL SEASONAL HOLIDAYS');
console.log('='.repeat(70));

for (const [key, holiday] of Object.entries(SEASONAL_HOLIDAYS)) {
  console.log(`\n${key}:`);
  console.log(`  Name: ${holiday.name}`);
  console.log(`  Date Ranges: ${JSON.stringify(holiday.dateRanges)}`);
  console.log(`  Movie Count: ${holiday.movieIds.length}`);
  if (holiday.movieIds.length > 0) {
    console.log(`  Movie IDs: ${holiday.movieIds.join(', ')}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('FRANKENWEENIE CHECK');
console.log('='.repeat(70));

const frankenweenieId = 62214;
console.log(`\nFrankenweenie TMDB ID: ${frankenweenieId}`);

// Check which holiday it's in
for (const [key, holiday] of Object.entries(SEASONAL_HOLIDAYS)) {
  if (holiday.movieIds.includes(frankenweenieId)) {
    console.log(`✓ Found in ${holiday.name} (${key})`);
    console.log(`  Date Range: ${holiday.dateRanges[0].start} to ${holiday.dateRanges[0].end}`);
  }
}

// Test date-specific behavior
console.log('\n' + '='.repeat(70));
console.log('SIMULATED DATE TESTS');
console.log('='.repeat(70));

function testDate(month, day) {
  const testDate = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Manually find which season this date falls into
  for (const [key, holiday] of Object.entries(SEASONAL_HOLIDAYS)) {
    for (const range of holiday.dateRanges) {
      const isInRange = (range.start <= range.end)
        ? (testDate >= range.start && testDate <= range.end)
        : (testDate >= range.start || testDate <= range.end);

      if (isInRange) {
        const hasFrankenweenie = holiday.movieIds.includes(frankenweenieId);
        console.log(`\n${testDate}: ${holiday.name} (${key})`);
        console.log(`  Movies: ${holiday.movieIds.length}`);
        console.log(`  Frankenweenie visible: ${hasFrankenweenie ? '✓ YES' : '✗ NO'}`);
        return;
      }
    }
  }
}

// Test Halloween season (should show Frankenweenie)
testDate(10, 15);  // Oct 15 - middle of Halloween season

// Test Christmas season (should NOT show Frankenweenie)
testDate(12, 1);   // Dec 1 - middle of Christmas season

console.log('\n' + '='.repeat(70) + '\n');
