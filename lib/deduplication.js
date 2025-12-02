/**
 * Deduplication processor to ensure each movie appears in only one genre
 */

const { GENRES, GENRE_BY_ID, MOVIES_PER_GENRE } = require('./constants');
const ScoringEngine = require('./scoring-engine');

class DeduplicationProcessor {
  constructor() {
    this.usedMovieIds = new Set();
    this.scoringEngine = new ScoringEngine();
  }

  /**
   * Process all genres and assign movies with deduplication
   * Uses PRIMARY genre (first in genre_ids) to avoid bad assignments
   * @param {Object} moviesByGenre - Object with genre codes as keys and movie arrays as values
   * @param {Array} recentMovieIds - Movie IDs shown in last 7 days
   * @returns {Object} Deduplicated movies by genre
   */
  processAllGenres(moviesByGenre, recentMovieIds = []) {
    const result = {};
    const allGenreCodes = Object.keys(GENRES);

    // Debug tracking
    const assignmentLog = {};  // genreCode -> { tier, count, samples }
    const filteredOutCount = {};  // genreCode -> count
    const rejectionLog = {};  // genreCode -> { wrongGenre, qualityFail, alreadyUsed, samples }
    const primaryGenreMismatches = [];  // Track suspicious primary genre assignments

    for (const genreCode of allGenreCodes) {
      assignmentLog[genreCode] = { tier1: 0, tier2: 0, tier3: 0, tier4: 0, tier5: 0, samples: [] };
      filteredOutCount[genreCode] = 0;
      rejectionLog[genreCode] = { wrongGenre: 0, qualityFail: 0, samples: [] };
    }

    // First pass: Assign movies to PRIMARY genre only (first in genre_ids array)
    // This prevents Napoleon from appearing in Romance instead of History
    const movieGenreScores = new Map();  // movieId -> { genreCode, score, movie, tier }

    for (const genreCode of allGenreCodes) {
      const movies = moviesByGenre[genreCode] || [];
      const genreId = GENRES[genreCode].id;

      for (const movie of movies) {
        if (!movie.genre_ids || movie.genre_ids.length === 0) continue;

        // Extract all genre tags for smart assignment
        const hasAnimation = movie.genre_ids.includes(16);
        const hasTVMovie = movie.genre_ids.includes(10770);
        const hasFamily = movie.genre_ids.includes(10751);
        const hasDocumentary = movie.genre_ids.includes(99);
        const hasWar = movie.genre_ids.includes(10752);
        const hasHistory = movie.genre_ids.includes(36);
        const hasHorror = movie.genre_ids.includes(27);
        const hasSciFi = movie.genre_ids.includes(878);
        const hasFantasy = movie.genre_ids.includes(14);
        const hasAction = movie.genre_ids.includes(28);
        const hasDrama = movie.genre_ids.includes(18);
        const primaryGenreId = movie.genre_ids[0];

        // Get release year for era-based splits
        const releaseYear = movie.release_date ? parseInt(movie.release_date.split('-')[0], 10) : 9999;
        const isClassicEra = releaseYear < 2000;

        // Track which tier assigned this movie
        let assignedTier = 0;

        // TIER 1: ABSOLUTE ISOLATION - These genres ALWAYS win
        // Priority: Superheroes > Animation > TV Movie > Documentary

        // Check if superhero movie (title-based detection)
        const isSuperhero = movie.title && /\b(Avengers|Spider-Man|Batman|Superman|Iron Man|Thor|Captain America|Black Panther|Wonder Woman|Aquaman|Flash|Guardians|Ant-Man|Doctor Strange|X-Men|Wolverine|Deadpool|Joker|Venom|Shazam|Black Widow|Hulk|Justice League|Suicide Squad|Green Lantern|Fantastic Four|Daredevil|Punisher|Hellboy|Watchmen|Kick-Ass|Hancock|Incredibles|Big Hero 6)\b/i.test(movie.title);

        if (isSuperhero) {
          // ALL superhero movies → Superheroes category (even animated ones like Spider-Verse)
          if (genreCode !== 'SUPERHEROES') {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }
          assignedTier = 1;
        } else if (hasAnimation) {
          // ALL non-superhero animated movies → Animation (Kids or Adult)
          if (genreCode !== 'ANIMATION_KIDS' && genreCode !== 'ANIMATION_ADULT') {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }

          // Smart Kids vs Adult decision
          const isKidsAnimation = hasFamily ||
                                   movie.vote_average < 7.5 ||
                                   (movie.title && /\b(Toy Story|Finding Nemo|Frozen|Moana|Shrek|Lion King|Cars|Up|WALL-E|Ratatouille|Inside Out|Coco|Zootopia)\b/i.test(movie.title));

          if (genreCode === 'ANIMATION_KIDS' && !isKidsAnimation) {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }
          if (genreCode === 'ANIMATION_ADULT' && isKidsAnimation) {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }
          assignedTier = 1;
        } else if (hasTVMovie) {
          // ALL TV movies → TV Movie
          if (genreCode !== 'TVMOVIE') {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }
          assignedTier = 1;
        } else if (hasDocumentary) {
          // ALL documentaries → Documentary (factual content is distinct)
          if (genreCode !== 'DOCUMENTARY') {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }
          assignedTier = 1;
        }
        // TIER 2: ERA-BASED SPLITS (Action split by year)
        else if (hasAction && (genreCode === 'ACTION' || genreCode === 'ACTION_CLASSIC')) {
          // Split Action by era: <2000 = Classic, >=2000 = Modern
          if (genreCode === 'ACTION_CLASSIC' && !isClassicEra) {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }
          if (genreCode === 'ACTION' && isClassicEra) {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }
          assignedTier = 2;
          // Continue processing for correct era
        } else if (hasAction) {
          // Action movies ONLY go to Action or Classic Action
          if (genreCode !== 'ACTION' && genreCode !== 'ACTION_CLASSIC') {
            rejectionLog[genreCode].wrongGenre++;
            continue;  // Block from other genres
          }
          assignedTier = 2;
        }
        // TIER 3: SPECIFICITY RULES - Specific genres beat generic Drama/Action
        else if (hasWar && genreCode === 'WAR') {
          // War films are distinct, prioritize over Drama/Action/History
          assignedTier = 3;
          // Continue processing (will get assigned if passes quality check)
        } else if (hasHistory && genreCode === 'HISTORY') {
          // Historical films prioritized over Drama
          assignedTier = 3;
          // Continue processing
        } else if (hasHorror && genreCode === 'HORROR') {
          // Horror is distinct, beats Thriller/Drama
          assignedTier = 3;
          // Continue processing
        } else if (hasWar || hasHistory || hasHorror) {
          // If movie has War/History/Horror tag, ONLY assign to those specific genres
          if (genreCode !== 'WAR' && genreCode !== 'HISTORY' && genreCode !== 'HORROR') {
            rejectionLog[genreCode].wrongGenre++;
            continue;  // Skip generic genres
          }
          assignedTier = 3;
        }
        // TIER 4: SCI-FI vs FANTASY disambiguation
        else if ((hasSciFi || hasFantasy) && (genreCode === 'SCIFI' || genreCode === 'FANTASY')) {
          // If both tagged, use primary genre
          // If only one tagged, use that one
          if (hasSciFi && hasFantasy) {
            // Both tagged - use primary
            if (primaryGenreId !== genreId) {
              rejectionLog[genreCode].wrongGenre++;
              continue;
            }
          } else if (hasSciFi && genreCode !== 'SCIFI') {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          } else if (hasFantasy && genreCode !== 'FANTASY') {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }
          assignedTier = 4;
        }
        // TIER 5: PRIMARY GENRE LOGIC for everything else
        else {
          // Regular movies: use primary genre (first in genre_ids)
          if (primaryGenreId !== genreId) {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }

          // Block animation/TV/doc/action/superhero genres for non-matching content
          if (genreCode === 'ANIMATION_KIDS' || genreCode === 'ANIMATION_ADULT' ||
              genreCode === 'TVMOVIE' || genreCode === 'DOCUMENTARY' ||
              genreCode === 'ACTION_CLASSIC' || genreCode === 'SUPERHEROES') {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }

          // Prevent Action/Drama from stealing War/History movies
          if ((genreCode === 'ACTION' || genreCode === 'DRAMA') &&
              (hasWar || hasHistory || hasHorror)) {
            rejectionLog[genreCode].wrongGenre++;
            continue;
          }
          assignedTier = 5;
        }

        const score = this.scoringEngine.calculateScore(movie, genreCode, recentMovieIds);
        if (score < 0) {
          // Excluded by quality threshold
          filteredOutCount[genreCode]++;
          rejectionLog[genreCode].qualityFail++;

          // Track sample rejections for debugging
          if (rejectionLog[genreCode].samples.length < 3) {
            rejectionLog[genreCode].samples.push({
              title: movie.title,
              year: releaseYear,
              reason: 'quality',
              rating: movie.vote_average,
              votes: movie.vote_count,
              popularity: movie.popularity
            });
          }
          continue;
        }

        // Track assignment for debug log
        assignmentLog[genreCode][`tier${assignedTier}`]++;
        if (assignmentLog[genreCode].samples.length < 5) {
          assignmentLog[genreCode].samples.push({
            title: movie.title,
            year: releaseYear,
            tier: assignedTier,
            rating: movie.vote_average,
            votes: movie.vote_count,
            popularity: movie.popularity
          });
        }

        // Detect potential primary genre mismatches (Tier 5 only)
        if (assignedTier === 5 && primaryGenreMismatches.length < 20) {
          // Get genre names for logging
          const primaryGenreName = GENRE_BY_ID[primaryGenreId]?.name || 'Unknown';
          const assignedGenreName = GENRES[genreCode].name;

          // Flag if primary genre seems very different from assigned
          const suspiciousGenrePairs = [
            { primary: 10749, assigned: 36, example: 'Romance → History' },  // Romance -> History
            { primary: 10749, assigned: 10752, example: 'Romance → War' },   // Romance -> War
            { primary: 35, assigned: 27, example: 'Comedy → Horror' },       // Comedy -> Horror
            { primary: 35, assigned: 10752, example: 'Comedy → War' },       // Comedy -> War
            { primary: 10751, assigned: 27, example: 'Family → Horror' },    // Family -> Horror
          ];

          const isSuspicious = suspiciousGenrePairs.some(pair =>
            pair.primary === primaryGenreId && pair.assigned === GENRES[genreCode].id
          );

          if (isSuspicious) {
            primaryGenreMismatches.push({
              title: movie.title,
              year: releaseYear,
              primaryGenre: primaryGenreName,
              assignedGenre: assignedGenreName,
              allGenres: movie.genre_ids.map(id => GENRE_BY_ID[id]?.name || id).join(', ')
            });
          }
        }

        movieGenreScores.set(movie.id, {
          genreCode,
          score,
          movie,
          tier: assignedTier
        });
      }
    }

    // Second pass: Assign movies to their best genre
    const moviesByBestGenre = {};
    for (const genreCode of allGenreCodes) {
      moviesByBestGenre[genreCode] = [];
    }

    for (const [movieId, data] of movieGenreScores) {
      moviesByBestGenre[data.genreCode].push({
        movie: data.movie,
        score: data.score
      });
    }

    // Third pass: Sort each genre and take top N, handling genres that need more movies
    for (const genreCode of allGenreCodes) {
      // Sort by score
      moviesByBestGenre[genreCode].sort((a, b) => b.score - a.score);
      
      // Take top movies
      const topMovies = moviesByBestGenre[genreCode]
        .slice(0, MOVIES_PER_GENRE)
        .map(item => item.movie);
      
      result[genreCode] = topMovies;
      
      // Track used IDs
      topMovies.forEach(movie => this.usedMovieIds.add(movie.id));
    }

    // Fourth pass: Fill any genres that are short on movies
    for (const genreCode of allGenreCodes) {
      if (result[genreCode].length < MOVIES_PER_GENRE) {
        this.fillGenreFromPool(result, genreCode, moviesByGenre, recentMovieIds);
      }
    }

    // Fifth pass: Ensure all genres have exactly MOVIES_PER_GENRE
    // If some genres are still short, fetch more pages or lower standards
    const shortGenres = allGenreCodes.filter(code => result[code].length < MOVIES_PER_GENRE);
    if (shortGenres.length > 0) {
      console.log(`Genres still short: ${shortGenres.join(', ')}`);
      // Try one more time with even lower standards for short genres
      for (const genreCode of shortGenres) {
        const needed = MOVIES_PER_GENRE - result[genreCode].length;
        if (needed > 0) {
          console.log(`Final attempt to fill ${genreCode}, need ${needed} more movies`);
          this.fillGenreAggressive(result, genreCode, moviesByGenre);
        }
      }
    }

    // DEBUG OUTPUT: Show detailed genre assignments
    console.log('\n' + '='.repeat(80));
    console.log('📊 GENRE ASSIGNMENT REPORT');
    console.log('='.repeat(80));

    for (const genreCode of allGenreCodes) {
      const finalCount = result[genreCode].length;
      const genreName = GENRES[genreCode].name;
      const tierCounts = assignmentLog[genreCode];
      const filtered = filteredOutCount[genreCode];

      console.log(`\n🎬 ${genreName} (${genreCode}): ${finalCount} movies`);
      console.log(`   Assignment breakdown:`);
      console.log(`     Tier 1 (Absolute Isolation): ${tierCounts.tier1}`);
      console.log(`     Tier 2 (Era-based splits):   ${tierCounts.tier2}`);
      console.log(`     Tier 3 (Specificity rules):  ${tierCounts.tier3}`);
      console.log(`     Tier 4 (Sci-Fi vs Fantasy):  ${tierCounts.tier4}`);
      console.log(`     Tier 5 (Primary genre):      ${tierCounts.tier5}`);
      console.log(`     Filtered out (quality):      ${filtered}`);

      if (assignmentLog[genreCode].samples.length > 0) {
        console.log(`   Sample movies:`);
        for (const sample of assignmentLog[genreCode].samples) {
          console.log(`     • ${sample.title} (${sample.year}) - Tier ${sample.tier} - ⭐${sample.rating} 👥${sample.votes} 🔥${sample.popularity.toFixed(0)}`);
        }
      }

      // Show top 10 final movies
      if (finalCount > 0) {
        console.log(`   Top 10 movies in final catalog:`);
        const top10 = result[genreCode].slice(0, 10);
        for (const movie of top10) {
          const year = movie.release_date ? movie.release_date.split('-')[0] : '????';
          console.log(`     • ${movie.title} (${year}) - ⭐${movie.vote_average} 👥${movie.vote_count} 🔥${movie.popularity.toFixed(0)}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📈 OVERALL STATISTICS');
    console.log('='.repeat(80));
    const totalMovies = allGenreCodes.reduce((sum, code) => sum + result[code].length, 0);
    const totalFiltered = allGenreCodes.reduce((sum, code) => sum + filteredOutCount[code], 0);
    const totalWrongGenre = allGenreCodes.reduce((sum, code) => sum + rejectionLog[code].wrongGenre, 0);
    console.log(`Total movies assigned: ${totalMovies} / ${allGenreCodes.length * MOVIES_PER_GENRE}`);
    console.log(`Total movies filtered out by quality: ${totalFiltered}`);
    console.log(`Total movies rejected (wrong genre): ${totalWrongGenre}`);
    console.log(`Unique movie IDs used: ${this.usedMovieIds.size}`);
    console.log('='.repeat(80) + '\n');

    // REJECTION REPORT
    console.log('\n' + '='.repeat(80));
    console.log('⛔ REJECTION REPORT - Why movies were NOT assigned');
    console.log('='.repeat(80));

    for (const genreCode of allGenreCodes) {
      const rejections = rejectionLog[genreCode];
      if (rejections.wrongGenre > 0 || rejections.qualityFail > 0) {
        const genreName = GENRES[genreCode].name;
        console.log(`\n🚫 ${genreName} (${genreCode}):`);
        console.log(`   Rejected for wrong genre: ${rejections.wrongGenre}`);
        console.log(`   Rejected for quality: ${rejections.qualityFail}`);

        if (rejections.samples.length > 0) {
          console.log(`   Sample rejections:`);
          for (const sample of rejections.samples) {
            console.log(`     • ${sample.title} (${sample.year}) - ${sample.reason} - ⭐${sample.rating} 👥${sample.votes} 🔥${sample.popularity.toFixed(0)}`);
          }
        }
      }
    }

    // PRIMARY GENRE MISMATCHES
    if (primaryGenreMismatches.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  PRIMARY GENRE MISMATCHES - Suspicious TMDB genre assignments');
      console.log('='.repeat(80));
      console.log('These movies have unusual primary genres that may indicate TMDB tagging issues:\n');

      for (const mismatch of primaryGenreMismatches) {
        console.log(`❓ ${mismatch.title} (${mismatch.year})`);
        console.log(`   Primary Genre: ${mismatch.primaryGenre} → Assigned to: ${mismatch.assignedGenre}`);
        console.log(`   All Genres: ${mismatch.allGenres}\n`);
      }
    }

    console.log('='.repeat(80) + '\n');

    return result;
  }

  /**
   * Fill a genre that has fewer than required movies
   */
  fillGenreFromPool(result, genreCode, moviesByGenre, recentMovieIds) {
    const needed = MOVIES_PER_GENRE - result[genreCode].length;
    if (needed <= 0) return;

    const currentIds = new Set(result[genreCode].map(m => m.id));

    // First try: Get movies that pass quality threshold and aren't used
    let candidates = (moviesByGenre[genreCode] || [])
      .filter(movie =>
        !currentIds.has(movie.id) &&
        !this.usedMovieIds.has(movie.id)
      )
      .map(movie => ({
        movie,
        score: this.scoringEngine.calculateScore(movie, genreCode, recentMovieIds)
      }))
      .filter(item => item.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, needed);

    // If still not enough, lower quality threshold and try again
    // This time we also ignore historical penalty - equal counts are more important
    if (candidates.length < needed) {
      console.log(`Genre ${genreCode} only has ${result[genreCode].length + candidates.length} movies, need ${MOVIES_PER_GENRE}. Lowering quality threshold (ignoring recent history)...`);

      const stillNeeded = needed - candidates.length;
      const additionalCandidates = (moviesByGenre[genreCode] || [])
        .filter(movie =>
          !currentIds.has(movie.id) &&
          !this.usedMovieIds.has(movie.id) &&
          !candidates.some(c => c.movie.id === movie.id) &&
          // Lower threshold: accept any movie with some votes
          movie.vote_count >= 50 &&
          movie.vote_average >= 5.0
        )
        .map(movie => ({
          movie,
          score: this.scoringEngine.calculateBaseScore(movie) // Use base score, no historical penalty
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, stillNeeded);

      candidates = [...candidates, ...additionalCandidates];
    }

    for (const { movie } of candidates) {
      result[genreCode].push(movie);
      this.usedMovieIds.add(movie.id);
    }

    // Log warning if still short
    if (result[genreCode].length < MOVIES_PER_GENRE) {
      console.warn(`Warning: Genre ${genreCode} only has ${result[genreCode].length} movies (target: ${MOVIES_PER_GENRE})`);
    }
  }

  /**
   * Aggressively fill genre with minimal quality requirements
   * Used as last resort to ensure all genres have equal movie counts
   * NOTE: Does NOT use historical penalty - we want equal counts more than variety
   */
  fillGenreAggressive(result, genreCode, moviesByGenre) {
    const needed = MOVIES_PER_GENRE - result[genreCode].length;
    if (needed <= 0) return;

    const currentIds = new Set(result[genreCode].map(m => m.id));

    // Accept almost any movie: just needs to have some basic data
    // Intentionally ignores historical penalty to ensure equal genre counts
    const candidates = (moviesByGenre[genreCode] || [])
      .filter(movie =>
        !currentIds.has(movie.id) &&
        !this.usedMovieIds.has(movie.id) &&
        movie.vote_count >= 10 &&  // Very minimal threshold
        movie.vote_average >= 4.0   // Very low bar
      )
      .map(movie => ({
        movie,
        score: movie.popularity + movie.vote_average // Simple score
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, needed);

    for (const { movie } of candidates) {
      result[genreCode].push(movie);
      this.usedMovieIds.add(movie.id);
    }

    console.log(`Aggressively filled ${genreCode} with ${candidates.length} movies (still need ${MOVIES_PER_GENRE - result[genreCode].length})`);
  }

  /**
   * Alternative: Simple greedy deduplication (process genres in order)
   * Faster but may not give optimal genre assignments
   */
  processGreedy(moviesByGenre, recentMovieIds = []) {
    const result = {};
    this.usedMovieIds.clear();
    
    const allGenreCodes = Object.keys(GENRES);

    for (const genreCode of allGenreCodes) {
      const movies = moviesByGenre[genreCode] || [];
      
      const ranked = this.scoringEngine.rankMovies(movies, genreCode, recentMovieIds);
      
      const selectedMovies = [];
      for (const movie of ranked) {
        if (selectedMovies.length >= MOVIES_PER_GENRE) break;
        
        if (!this.usedMovieIds.has(movie.id)) {
          selectedMovies.push(movie);
          this.usedMovieIds.add(movie.id);
        }
      }
      
      result[genreCode] = selectedMovies;
    }

    return result;
  }

  /**
   * Get statistics about deduplication
   */
  getStats() {
    return {
      totalUniqueMovies: this.usedMovieIds.size,
      expectedTotal: Object.keys(GENRES).length * MOVIES_PER_GENRE
    };
  }

  /**
   * Reset state for new processing run
   */
  reset() {
    this.usedMovieIds.clear();
  }
}

module.exports = DeduplicationProcessor;
