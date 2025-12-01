# TMDB Genre Explorer - Stremio Addon

A Stremio addon that displays movies organized by genre, pulling data from The Movie Database (TMDB). Features intelligent daily content rotation to ensure fresh discoveries every day.

## Features

- **19 Movie Genres** - Action, Comedy, Drama, Horror, Sci-Fi, and more
- **Daily Content Rotation** - Different movies every day with 7 unique themes
- **Smart Deduplication** - Each movie appears in only one genre
- **Quality Filtering** - Only shows well-rated, popular movies
- **Customizable** - Choose which genres to display
- **IMDB ID Priority** - Uses IMDB IDs for maximum compatibility with streaming addons
- **Rate Limiting** - Built-in protection against abuse (120 req/min per IP)
- **Zero Cost** - Runs entirely on free tiers

## Daily Themes

| Day | Theme | What You'll See |
|-----|-------|-----------------|
| Monday | Rising Stars | Recent films gaining momentum |
| Tuesday | Critical Darlings | Highly-rated acclaimed films |
| Wednesday | Hidden Gems | Underrated quality discoveries |
| Thursday | Blockbusters | Big-budget crowd-pleasers |
| Friday | Fresh Releases | Movies from the last 90 days |
| Saturday | Timeless Classics | Beloved older films |
| Sunday | Audience Favorites | Most-voted crowd picks |

## Quick Start

### Prerequisites

- Node.js 18+
- GitHub account
- Netlify account
- TMDB API key (free)

### 1. Get a TMDB API Key

1. Visit [themoviedb.org](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings -> API
4. Request an API key (choose Developer)
5. Copy your API key

### 2. Deploy to Netlify

1. Fork this repository
2. Connect to Netlify:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" -> "Import from Git"
   - Select your forked repository
   - Deploy (no build settings needed)

3. **Add ALL THREE environment variables in Netlify:**
   - Go to: Site Settings → Environment Variables
   - Add `TMDB_API_KEY` = your TMDB API key
   - Add `NETLIFY_ACCESS_TOKEN` = (get from Netlify User Settings → Applications → Personal access tokens)
   - Add `NETLIFY_SITE_ID` = (found in Site Settings → General → Site ID)

### 3. Setup GitHub Actions

**Add THE SAME THREE secrets in GitHub** (yes, both places need them):

1. In your GitHub repository, go to Settings → Secrets and variables → Actions
2. Add these repository secrets:
   - `TMDB_API_KEY` - Your TMDB API key (same as Netlify)
   - `NETLIFY_ACCESS_TOKEN` - Your Netlify personal access token (same as Netlify)
   - `NETLIFY_SITE_ID` - Your Netlify site ID (same as Netlify)

**Why both?**
- **Netlify**: Addon functions need these to read cached data from Blobs
- **GitHub Actions**: Nightly update script needs these to fetch from TMDB and write to Blobs

### 4. Run Initial Update

1. Go to Actions tab in GitHub
2. Select "Nightly TMDB Update"
3. Click "Run workflow"
4. Wait for completion (~5-10 minutes)

### 5. Install in Stremio

1. Visit your Netlify site URL
2. Configure your preferred genres
3. Click "Install in Stremio"

## Project Structure

```
stremio-tmdb-addon/
├── .github/
│   └── workflows/
│       └── nightly-update.yml    # Scheduled update job
├── lib/
│   ├── __tests__/                # Test suites
│   │   ├── scoring-engine.test.js
│   │   └── deduplication.test.js
│   ├── constants.js              # Genre definitions, settings
│   ├── tmdb-client.js            # TMDB API wrapper
│   ├── scoring-engine.js         # Movie ranking algorithms
│   ├── deduplication.js          # Cross-genre deduplication
│   ├── cache-manager.js          # Netlify Blobs wrapper
│   ├── logger.js                 # Structured logging utility
│   └── rate-limiter.js           # Rate limiting protection
├── netlify/
│   └── functions/
│       ├── addon.js              # Main Stremio endpoint (with rate limiting)
│       └── health.js             # Health check endpoint
├── public/
│   └── index.html                # Configuration page (with error handling)
├── scripts/
│   ├── nightly-update.js         # Update script for GitHub Actions
│   └── test-local.js             # Local testing
├── .nvmrc                        # Node version lock (v20)
├── jest.config.js                # Jest test configuration
├── netlify.toml                  # Netlify configuration
├── package.json                  # Dependencies and scripts
├── LICENSE                       # MIT License
├── CHANGES.md                    # Changelog of improvements
└── README.md                     # This file
```

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `TMDB_API_KEY` | Yes | Your TMDB API key | - |
| `NETLIFY_ACCESS_TOKEN` | Yes* | For GitHub Actions to update Blobs | - |
| `NETLIFY_SITE_ID` | Yes* | Your Netlify site ID | - |
| `MOVIES_PER_GENRE` | No | Number of movies per genre | 30 |
| `LOG_LEVEL` | No | Logging verbosity (ERROR/WARN/INFO/DEBUG) | INFO |

*Required for automated updates

### User Configuration

Users can customize their addon by selecting genres on the configuration page. The URL encodes their preferences:

- All genres: `/manifest.json`
- Selected genres: `/ACTION.COMEDY.HORROR/manifest.json`

## Free Tier Limits & Usage

This addon is designed to run entirely on free tiers:

### TMDB API (Free)
- **Limit**: No daily limit, ~40 requests/second
- **Usage**: ~627 API calls per nightly update
- **Cost**: $0/month
- **Notes**: Very generous free tier, no credit card required

### Netlify (Free Tier)
- **Limit**: 100 GB bandwidth/month, 300 build minutes/month
- **Usage**: ~1-2 GB bandwidth/month (estimate), ~30 build minutes/month
- **Cost**: $0/month
- **Notes**: Plenty of headroom for typical usage

### GitHub Actions (Free Tier)
- **Limit**: 2000 minutes/month for private repos (unlimited for public)
- **Usage**: ~300 minutes/month (10 min/day × 30 days)
- **Cost**: $0/month
- **Notes**: Use public repo for unlimited minutes

**Total Monthly Cost**: $0

**Estimated capacity**: Can serve thousands of users on free tier

## Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your TMDB API key

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run local update (requires all env vars)
npm run update

# Start local dev server
npm run dev
```

## API Usage

The addon makes approximately 627 API calls per nightly update:
- 57 discovery calls (19 genres x 3 pages)
- 570 detail calls (30 movies x 19 genres)

This is well within TMDB's free tier limits (no daily limit, ~40 req/sec max).

## How Updates Work

1. **Midnight UTC**: GitHub Actions triggers
2. **Fetch**: Script pulls fresh data from TMDB
3. **Process**: Scoring engine ranks movies by daily theme
4. **Deduplicate**: Each movie assigned to best-fit genre
5. **Store**: Results saved to Netlify Blobs
6. **Serve**: CDN caches and serves to all users

## Health Monitoring

Check addon health at `/health`:

```json
{
  "status": "healthy",
  "cache": {
    "updatedAt": "2024-01-15T00:05:23.000Z",
    "ageHours": 2.5,
    "strategy": "RISING_STARS",
    "totalMovies": 570
  }
}
```

## Genre Personalities

Each genre has unique scoring characteristics:

- **Action**: Prefers recent high-budget films
- **Horror**: Accepts cult films, October boost
- **Comedy**: Weights audience validation heavily
- **Drama**: Award season awareness
- **Sci-Fi**: Franchise and effects bonus
- **Romance**: Valentine's and Christmas boost

## Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run integration tests
npm run test:local
```

Test suites cover:
- **Scoring Engine**: All scoring strategies, modifiers, and edge cases
- **Deduplication Logic**: Multi-genre handling, quality thresholds
- **Rate Limiting**: Request throttling and IP tracking
- **Error Handling**: Graceful degradation and user feedback

## Recent Improvements

### v1.1.0 (Latest)
- ✅ Added comprehensive test suite with Jest
- ✅ Implemented rate limiting (120 req/min per IP)
- ✅ Added structured logging utility
- ✅ Made `MOVIES_PER_GENRE` configurable via environment variable
- ✅ Improved error handling in configuration UI
- ✅ Prioritize IMDB IDs for better streaming addon compatibility
- ✅ Added `.nvmrc` for Node version locking
- ✅ Added MIT LICENSE file

### v1.0.0
- Initial release with daily rotation system
- 19 genres with smart deduplication
- Genre-specific personalities and scoring

## License

MIT License - See [LICENSE](LICENSE) file for details

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

Data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

### Addon not showing movies
- Check `/health` endpoint
- Verify GitHub Action ran successfully
- Ensure environment variables are set

### Movies not updating
- Check GitHub Actions logs
- Verify TMDB API key is valid
- Check Netlify function logs

### Can't install addon
- Ensure URL ends with `/manifest.json`
- Try Stremio Web if desktop fails
- Check browser console for errors
