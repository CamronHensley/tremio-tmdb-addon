const { getStore } = require('@netlify/blobs');
const fs = require('fs');
require('dotenv').config();

async function main() {
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  const classificationState = await store.get('classification-state', { type: 'json' });

  // Get all ACTION IDs
  const actionIds = [];
  for (const [movieId, genre] of Object.entries(classificationState.classified)) {
    if (genre === 'ACTION') {
      actionIds.push(parseInt(movieId));
    }
  }

  console.log(`\nMovies classified as ACTION: ${actionIds.length}\n`);

  // Parse full_output.txt to get movie details
  const fullOutput = fs.readFileSync('full_output.txt', 'utf-8');
  const moviePattern = /(\d+)\.\s+(.+?)\s+\((\d{4})\)\s+ID:\s+(\d+)\s+Rating:\s+([\d.]+)\s+Genres:\s+(.+?)\s+Found in:\s+(.+?)\s+Plot:\s+(.+?)(?=\n\n\d+\.|\n\n$|$)/gs;

  const actionMovies = [];
  let match;

  while ((match = moviePattern.exec(fullOutput)) !== null) {
    const movieId = parseInt(match[4]);

    if (actionIds.includes(movieId)) {
      actionMovies.push({
        movieId: movieId,
        name: match[2],
        year: parseInt(match[3]),
        rating: parseFloat(match[5]),
        genres: match[6].split(',').map(g => g.trim()),
        foundIn: match[7].split(',').map(c => c.trim()),
        plot: match[8].replace(/\.\.\.$/, '').trim()
      });
    }
  }

  // Find superhero movies in ACTION
  const superheroKeywords = [
    'Iron Man', 'Captain America', 'Thor', 'Avengers', 'Guardians',
    'Spider-Man', 'Spiderman', 'Batman', 'Superman', 'Wonder Woman',
    'Aquaman', 'Flash', 'Justice League', 'X-Men', 'Wolverine',
    'Black Panther', 'Doctor Strange', 'Ant-Man', 'Shazam', 'Venom',
    'Morbius', 'Black Widow', 'Scarlet Witch', 'Hawkeye', 'Falcon',
    'Winter Soldier', 'Vision', 'Loki', 'Thanos', 'Hulk', 'Green Lantern',
    'Fantastic Four', 'Daredevil', 'Punisher', 'Jessica Jones', 'Luke Cage',
    'Blade', 'Ghost Rider', 'Elektra', 'Catwoman', 'Joker', 'Harley Quinn',
    'Suicide Squad', 'Watchmen', 'Hellboy', 'Spawn', 'Kick-Ass'
  ];

  console.log('SUPERHERO MOVIES FOUND IN ACTION:\n');

  const superheroesInAction = [];

  actionMovies.forEach(movie => {
    const nameMatch = superheroKeywords.some(keyword =>
      movie.name.toLowerCase().includes(keyword.toLowerCase())
    );

    const plotMatch = superheroKeywords.some(keyword =>
      movie.plot.toLowerCase().includes(keyword.toLowerCase())
    );

    if (nameMatch || plotMatch) {
      console.log(`${movie.name} (${movie.year}) [ID: ${movie.movieId}]`);
      console.log(`   Genres: ${movie.genres.join(', ')}`);
      console.log(`   Plot: ${movie.plot.substring(0, 100)}...`);
      console.log();

      superheroesInAction.push({
        movieId: movie.movieId,
        name: movie.name,
        year: movie.year,
        currentGenre: 'ACTION',
        correctGenre: 'SUPERHEROES',
        reason: 'Superhero movie - SUPERHEROES (Tier 1 #4) priority over ACTION (Tier 4)'
      });
    }
  });

  console.log(`\nTotal superhero movies in ACTION: ${superheroesInAction.length}`);

  // Save corrections
  if (superheroesInAction.length > 0) {
    fs.writeFileSync('action_superhero_corrections.json', JSON.stringify(superheroesInAction, null, 2));
    console.log(`✅ Saved ${superheroesInAction.length} corrections to action_superhero_corrections.json`);
  }
}

main().catch(console.error);
