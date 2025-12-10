/**
 * Catalog Rotation Script
 *
 * Rotates 25% of movies daily to keep the Stremio catalog fresh
 * Ensures all cached movies get exposure over time
 *
 * Usage:
 *   node scripts/rotate-catalog.js --dry-run
 *   node scripts/rotate-catalog.js
 */

require('dotenv').config();
const { getStore } = require('@netlify/blobs');
const { GENRES } = require('../lib/constants');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Rotation configuration
const ROTATION_CONFIG = {
  displayPerGenre: 100,      // Movies shown in Stremio
  rotationPercent: 0.25,     // 25% daily rotation
  minDaysBetweenActive: 14,  // Cooldown before re-promotion (2 weeks)
  classicProtectionRating: 8.5, // High-rated movies rotate slower
  newReleaseYears: 1         // Recent movies rotate faster
};

/**
 * Calculate days since a date
 */
function daysSince(dateString) {
  if (!dateString) return Infinity;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Rotate movies for a single genre
 */
function rotateGenre(genreCode, currentCatalog, fullCache) {
  const rotationCount = Math.floor(ROTATION_CONFIG.displayPerGenre * ROTATION_CONFIG.rotationPercent);

  console.log(`\n  Processing ${genreCode}:`);
  console.log(`    Current catalog: ${currentCatalog.length} movies`);
  console.log(`    Full cache: ${fullCache.length} movies`);
  console.log(`    Rotating: ${rotationCount} movies`);

  // Add rotation metadata if missing
  const now = new Date().toISOString();
  currentCatalog.forEach(movie => {
    if (!movie.rotationMetadata) {
      movie.rotationMetadata = {
        addedToCatalogDate: now,
        lastActiveDate: now,
        totalDaysActive: 0
      };
    }
  });

  // Sort current catalog by rotation priority (oldest first, but protect classics)
  const sortedCurrent = currentCatalog.sort((a, b) => {
    const aIsClassic = a.imdbRating && parseFloat(a.imdbRating) >= ROTATION_CONFIG.classicProtectionRating;
    const bIsClassic = b.imdbRating && parseFloat(b.imdbRating) >= ROTATION_CONFIG.classicProtectionRating;

    // Classics rotate slower (lower priority for removal)
    if (aIsClassic && !bIsClassic) return 1;  // Keep 'a', remove 'b' first
    if (!aIsClassic && bIsClassic) return -1; // Remove 'a', keep 'b'

    // Otherwise, remove oldest first
    const aDays = daysSince(a.rotationMetadata?.addedToCatalogDate);
    const bDays = daysSince(b.rotationMetadata?.addedToCatalogDate);
    return bDays - aDays; // Oldest first
  });

  // Select movies to remove (bottom N after sorting)
  const toRemove = sortedCurrent.slice(0, rotationCount);
  const toKeep = sortedCurrent.slice(rotationCount);

  console.log(`    Removing: ${toRemove.length} movies (oldest/non-classics)`);

  // Find eligible replacements from cache
  const eligible = fullCache.filter(movie => {
    // Skip if already in current catalog
    const inCatalog = toKeep.some(m => m.tmdbId === movie.tmdbId);
    if (inCatalog) return false;

    // Check cooldown period
    const lastActive = movie.rotationMetadata?.lastActiveDate;
    if (lastActive && daysSince(lastActive) < ROTATION_CONFIG.minDaysBetweenActive) {
      return false;
    }

    return true;
  });

  // Sort eligible by priority (weighted score + recency boost)
  const currentYear = new Date().getFullYear();
  eligible.sort((a, b) => {
    // Calculate priority score
    const aYear = a.year || 0;
    const bYear = b.year || 0;
    const aIsNew = (currentYear - aYear) <= ROTATION_CONFIG.newReleaseYears;
    const bIsNew = (currentYear - bYear) <= ROTATION_CONFIG.newReleaseYears;

    // New releases get boost
    let aScore = a.weightedScore || 0;
    let bScore = b.weightedScore || 0;
    if (aIsNew) aScore *= 1.5;
    if (bIsNew) bScore *= 1.5;

    return bScore - aScore;
  });

  // Select top N eligible movies
  const toPromote = eligible.slice(0, rotationCount);

  console.log(`    Eligible for promotion: ${eligible.length} movies`);
  console.log(`    Promoting: ${toPromote.length} movies`);

  // Update rotation metadata for promoted movies
  toPromote.forEach(movie => {
    if (!movie.rotationMetadata) {
      movie.rotationMetadata = {
        addedToCatalogDate: now,
        lastActiveDate: now,
        totalDaysActive: 0
      };
    } else {
      movie.rotationMetadata.addedToCatalogDate = now;
      movie.rotationMetadata.lastActiveDate = now;
    }
  });

  // Update rotation metadata for removed movies
  toRemove.forEach(movie => {
    if (movie.rotationMetadata) {
      const daysActive = daysSince(movie.rotationMetadata.addedToCatalogDate);
      movie.rotationMetadata.totalDaysActive = (movie.rotationMetadata.totalDaysActive || 0) + daysActive;
      movie.rotationMetadata.lastActiveDate = now;
    }
  });

  // Build new catalog
  const newCatalog = [...toKeep, ...toPromote].slice(0, ROTATION_CONFIG.displayPerGenre);

  console.log(`    New catalog size: ${newCatalog.length} movies`);

  return {
    newCatalog,
    stats: {
      removed: toRemove.length,
      promoted: toPromote.length,
      kept: toKeep.length,
      eligible: eligible.length
    }
  };
}

/**
 * Main rotation function
 */
async function rotateCatalog() {
  console.log('🔄 Catalog Rotation Script');
  console.log('━'.repeat(50));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update catalog)'}`);
  console.log(`Rotation: ${ROTATION_CONFIG.rotationPercent * 100}% daily (${Math.floor(ROTATION_CONFIG.displayPerGenre * ROTATION_CONFIG.rotationPercent)} movies per genre)`);
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

  // Load full cache (for rotation pool)
  console.log('📥 Loading full cache...');
  const cacheData = await store.get('catalog-full-cache', { type: 'json' });

  if (!cacheData || !cacheData.genres) {
    console.error('❌ No cache data found. Using current catalog as cache.');
    // Fallback: use current catalog as cache
    var fullCache = catalogData.genres;
  } else {
    var fullCache = cacheData.genres;
  }

  // Process each genre
  const allGenreCodes = Object.keys(GENRES);
  const rotationResults = {
    totalRemoved: 0,
    totalPromoted: 0,
    totalEligible: 0
  };

  const newCatalog = { ...catalogData };

  for (const genreCode of allGenreCodes) {
    const currentMovies = catalogData.genres[genreCode] || [];
    const cachedMovies = fullCache[genreCode] || currentMovies;

    if (currentMovies.length === 0) {
      console.log(`\n  ⊘ Skipping ${genreCode} (no movies)`);
      continue;
    }

    const result = rotateGenre(genreCode, currentMovies, cachedMovies);

    newCatalog.genres[genreCode] = result.newCatalog;
    rotationResults.totalRemoved += result.stats.removed;
    rotationResults.totalPromoted += result.stats.promoted;
    rotationResults.totalEligible += result.stats.eligible;
  }

  // Summary
  console.log('\n━'.repeat(50));
  console.log('📊 Rotation Summary:');
  console.log(`  Total movies removed: ${rotationResults.totalRemoved}`);
  console.log(`  Total movies promoted: ${rotationResults.totalPromoted}`);
  console.log(`  Total eligible in cache: ${rotationResults.totalEligible}`);
  console.log(`  Rotation rate: ${(rotationResults.totalPromoted / (Object.keys(GENRES).length * ROTATION_CONFIG.displayPerGenre) * 100).toFixed(1)}%`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No changes made');
    console.log('Run without --dry-run to apply changes');
    return;
  }

  // Apply changes
  console.log('\n💾 Applying changes...');
  await store.setJSON('catalog', {
    ...newCatalog,
    rotatedAt: new Date().toISOString()
  });
  console.log('  ✓ Updated catalog');

  console.log('\n✅ Catalog rotation complete!');
  console.log('━'.repeat(50));
}

// Run rotation
rotateCatalog()
  .then(() => {
    console.log('\n🎉 Rotation finished successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Rotation failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
