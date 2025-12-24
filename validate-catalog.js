const https = require('https');

https.get('https://ephemeral-cucurucho-5b2d4f.netlify.app/catalog/movie/tmdb-romance.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const catalog = JSON.parse(data);

    console.log('VALIDATION CHECK:');
    console.log('Has metas array:', Array.isArray(catalog.metas));
    console.log('Metas count:', catalog.metas?.length || 0);

    if (catalog.metas && catalog.metas.length > 0) {
      const first = catalog.metas[0];
      console.log('\nFirst movie validation:');
      console.log('  id:', first.id);
      console.log('  type:', first.type);
      console.log('  name:', first.name);
      console.log('  poster:', first.poster);

      console.log('\nAll first movie fields:');
      Object.keys(first).forEach(k => console.log('  -', k));

      console.log('\nChecking ALL movies:');
      let issues = 0;
      catalog.metas.forEach((m, i) => {
        if (!m.id) { console.log('  Movie', i, 'missing id'); issues++; }
        if (!m.type) { console.log('  Movie', i, 'missing type'); issues++; }
        if (!m.name) { console.log('  Movie', i, 'missing name'); issues++; }
        if (!m.poster) { console.log('  Movie', i, 'missing poster'); issues++; }
      });

      if (issues === 0) {
        console.log('  All', catalog.metas.length, 'movies have required fields');
      } else {
        console.log('  Found', issues, 'issues');
      }
    }
  });
});
