/**
 * Catalog rotation configuration
 * Edit MOVIES_PER_GENRE to control catalog size
 */

// Movies per genre
// Number of movies per genre (configurable via environment variable)
const MOVIES_PER_GENRE = parseInt(process.env.MOVIES_PER_GENRE || '100', 10);

module.exports = {
  MOVIES_PER_GENRE
};
