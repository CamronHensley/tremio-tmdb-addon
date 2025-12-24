const https = require('https');

const genres = ['action', 'adventure', 'animation_kids', 'comedy', 'crime', 'documentary',
                'drama', 'family', 'fantasy', 'history', 'horror', 'music', 'mystery',
                'romance', 'scifi', 'tvmovie', 'thriller', 'war', 'western'];

async function checkCatalog(genre) {
  return new Promise((resolve) => {
    https.get(`https://ephemeral-cucurucho-5b2d4f.netlify.app/catalog/movie/tmdb-${genre}.json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ genre, count: json.metas?.length || 0 });
        } catch (e) {
          resolve({ genre, count: 'error' });
        }
      });
    }).on('error', () => resolve({ genre, count: 'error' }));
  });
}

(async () => {
  console.log('Checking all catalogs...\n');

  for (const genre of genres) {
    const result = await checkCatalog(genre);
    console.log(`${result.genre.padEnd(20)} ${result.count}`);
  }

  console.log('\nDone!');
})();
