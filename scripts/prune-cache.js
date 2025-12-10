/**
 * Cache Pruning Script
 *
 * Prunes the movie cache to keep only the highest-ranked movies per genre
 * Uses tiered approach (Active/Archive/Pruned) to avoid losing valuable data
 *
 * Usage:
 *   node scripts/prune-cache.js --keep-per-genre=500 --dry-run
 *   node scripts/prune-cache.js --keep-per-genre=300
 */

require('dotenv').config();
const { getStore } = require('@netlify/blobs');
const OMDbClient = require('../lib/omdb-client');
const { GENRES } = require('../lib/constants');

// Parse command line arguments
const args = process.argv.slice(2);
const keepPerGenre = parseInt(args.find(arg => arg.startsWith('--keep-per-genre='))?.split('=')[1] || '500', 10);
const dryRun = args.includes('--dry-run');

// Protection thresholds
const PROTECTION_RULES = {
  minRating: 8.5,           // Never prune movies with rating >= 8.5
  minVotes: 100000,         // Never prune movies with >= 100k votes
  minRecencyYears: 2,       // Never prune movies from last 2 years
  tierArchiveMultiplier: 2  // Archive tier keeps 2x active tier
};

async function pruneCache() {
  console.log('🗑️  Cache Pruning Script');
  console.log('━'.repeat(50));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will modify cache)'}`);
  console.log(`Keep per genre: ${keepPerGenre} active movies`);
  console.log(`Archive tier: ${keepPerGenre * PROTECTION_RULES.tierArchiveMultiplier} movies per genre`);
  console.log('');

  // Get Netlify Blobs store
  const store = getStore({
    name: 'tmdb-catalog',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN
  });

  // Load current catalog
  console.log('📥 Loading current catalog...');
  const catalogData = await store.get('catalog', { type: 'json' });

  if (!catalogData || !catalogData.genres) {
    console.error('❌ No catalog data found');
    process.exit(1);
  }

  // Load IMDb ratings cache
  console.log('📥 Loading IMDb ratings cache...');
  const imdbRatingsData = await store.get('imdb-ratings', { type: 'json' });
  const imdbRatingsCache = OMDbClient.loadPersistentCache(imdbRatingsData);

  const currentYear = new Date().getFullYear();
  const minProtectedYear = currentYear - PROTECTION_RULES.minRecencyYears;

  // Process each genre
  const allGenreCodes = Object.keys(GENRES);
  const pruningResults = {
    totalBefore: 0,
    totalActive: 0,
    totalArchived: 0,
    totalPruned: 0,
    protected: {
      highRating: 0,
      highVotes: 0,
      recent: 0
    }
  };

  const newCatalog = { ...catalogData };
  const archivedMovies = {}; // Store archived movies separately
  const prunedMovieIds = new Set(); // Track pruned movie IDs

  for (const genreCode of allGenreCodes) {
    const genre = GENRES[genreCode];
    const movies = catalogData.genres[genreCode] || [];

    console.log(`\n📊 Processing ${genre.name}...`);
    console.log(`  Current movies: ${movies.length}`);

    pruningResults.totalBefore += movies.length;

    // Calculate weighted scores for all movies
    const moviesWithScores = movies.map(movie => {
      let weightedScore = 0;
      let imdbRating = null;
      let imdbVotes = null;

      // Extract IMDb ID from links
      const imdbLink = movie.links?.find(link => link.category === 'imdb');
      if (imdbLink && imdbLink.url) {
        const match = imdbLink.url.match(/tt\d+/);
        if (match) {
          const imdbId = match[0];
          const ratingData = imdbRatingsCache.get(imdbId);

          if (ratingData) {
            imdbRating = ratingData.rating;
            imdbVotes = ratingData.votes;
            weightedScore = OMDbClient.calculateWeightedScore(ratingData.rating, ratingData.votes);
          }
        }
      }

      return {
        ...movie,
        weightedScore,
        imdbRating,
        imdbVotes
      };
    });

    // Sort by weighted score (descending)
    moviesWithScores.sort((a, b) => b.weightedScore - a.weightedScore);

    // Apply protection rules and tier assignment
    const active = [];
    const archived = [];
    const pruned = [];

    for (const movie of moviesWithScores) {
      const movieYear = movie.year || 0;
      const isProtectedByRating = movie.imdbRating && movie.imdbRating >= PROTECTION_RULES.minRating;
      const isProtectedByVotes = movie.imdbVotes && movie.imdbVotes >= PROTECTION_RULES.minVotes;
      const isProtectedByRecency = movieYear >= minProtectedYear;

      // Track protection reasons
      if (isProtectedByRating) pruningResults.protected.highRating++;
      if (isProtectedByVotes) pruningResults.protected.highVotes++;
      if (isProtectedByRecency) pruningResults.protected.recent++;

      // Tier assignment
      if (active.length < keepPerGenre) {
        // Tier 1: Active
        active.push(movie);
      } else if (
        archived.length < (keepPerGenre * PROTECTION_RULES.tierArchiveMultiplier) ||
        isProtectedByRating ||
        isProtectedByVotes ||
        isProtectedByRecency
      ) {
        // Tier 2: Archive (protected or within archive limit)
        archived.push(movie);
      } else {
        // Tier 3: Pruned
        pruned.push(movie);
        // Track TMDB ID for pruning from other caches
        if (movie.id.startsWith('tmdb:')) {
          prunedMovieIds.add(parseInt(movie.id.replace('tmdb:', ''), 10));
        }
      }
    }

    console.log(`  ✓ Active tier: ${active.length} movies`);
    console.log(`  ✓ Archive tier: ${archived.length} movies`);
    console.log(`  ✓ Pruned: ${pruned.length} movies`);

    pruningResults.totalActive += active.length;
    pruningResults.totalArchived += archived.length;
    pruningResults.totalPruned += pruned.length;

    // Update catalog with only active tier
    newCatalog.genres[genreCode] = active;

    // Store archived tier separately
    if (archived.length > 0) {
      archivedMovies[genreCode] = archived;
    }
  }

  // Summary
  console.log('\n━'.repeat(50));
  console.log('📊 Pruning Summary:');
  console.log(`  Total movies before: ${pruningResults.totalBefore}`);
  console.log(`  Active tier (in catalog): ${pruningResults.totalActive}`);
  console.log(`  Archive tier (cached): ${pruningResults.totalArchived}`);
  console.log(`  Pruned (to be removed): ${pruningResults.totalPruned}`);
  console.log('');
  console.log('🛡️  Protected movies:');
  console.log(`  By rating (>= ${PROTECTION_RULES.minRating}): ${pruningResults.protected.highRating}`);
  console.log(`  By votes (>= ${PROTECTION_RULES.minVotes.toLocaleString()}): ${pruningResults.protected.highVotes}`);
  console.log(`  By recency (>= ${minProtectedYear}): ${pruningResults.protected.recent}`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No changes made');
    console.log('Run without --dry-run to apply changes');
    return;
  }

  // Apply changes
  console.log('\n💾 Applying changes...');

  // Save updated catalog (active tier only)
  await store.setJSON('catalog', {
    ...newCatalog,
    updatedAt: new Date().toISOString()
  });
  console.log('  ✓ Updated catalog (active tier)');

  // Save archived movies
  await store.setJSON('catalog-archive', {
    genres: archivedMovies,
    archivedAt: new Date().toISOString(),
    totalMovies: pruningResults.totalArchived
  });
  console.log('  ✓ Saved archive tier');

  // Prune from IMDb ratings cache
  if (prunedMovieIds.size > 0 && imdbRatingsData) {
    console.log(`\n🗑️  Pruning ${prunedMovieIds.size} movies from IMDb ratings cache...`);
    const newImdbCache = {};
    let prunedCount = 0;

    for (const [imdbId, ratingData] of Object.entries(imdbRatingsData)) {
      // Keep if not in pruned set (we don't have direct TMDB ID mapping here, so keep all)
      // This is safe - we're conservative with IMDb cache pruning
      newImdbCache[imdbId] = ratingData;
    }

    // Actually, let's be more aggressive - we can identify pruned movies by their absence
    // But this is complex, so for now just keep the IMDb cache as-is
    // It doesn't cost much storage and re-fetching is expensive
    console.log('  ⊘ Skipping IMDb cache pruning (conservative approach)');
  }

  // Prune from Fanart.tv cache (same logic - keep for now)
  console.log('  ⊘ Skipping Fanart.tv cache pruning (conservative approach)');

  // Prune from Wikidata cache (same logic - keep for now)
  console.log('  ⊘ Skipping Wikidata cache pruning (conservative approach)');

  console.log('\n✅ Cache pruning complete!');
  console.log('━'.repeat(50));
}

// Run pruning
pruneCache()
  .then(() => {
    console.log('\n🎉 Pruning finished successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Pruning failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
