const batch1 = require('./500_classifications.json');
const batch2_1 = require('./next_250_classifications.json');
const batch2_2 = require('./batch_2_remaining_classifications.json');
const batch2_3 = require('./final_160_classifications.json');

const all = [...batch1, ...batch2_1, ...batch2_2, ...batch2_3];

const bobMarley = all.filter(m => m.movieName.toLowerCase().includes('bob marley'));
const yesterday = all.filter(m => m.movieName.toLowerCase().includes('yesterday') && !m.movieName.toLowerCase().includes('all our yesterdays'));

console.log('Bob Marley movies:');
bobMarley.forEach(m => console.log('  ', m.movieName, '→', m.genreCode, '(ID:', m.movieId + ')'));

console.log('\nYesterday movies:');
yesterday.forEach(m => console.log('  ', m.movieName, '→', m.genreCode, '(ID:', m.movieId + ')'));
