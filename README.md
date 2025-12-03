# TMDB Genre Explorer - Stremio Addon

A Stremio addon that displays movies organized by genre, pulling data from The Movie Database (TMDB). Features intelligent daily content rotation to ensure fresh discoveries every day.

## Features

- **22 Movie Genres** - Action, Classic Action, Animation (Kids & Adult), Superheroes, and more
- **100 Movies Per Genre** - Extensive catalog with 2,200+ total movies
- **AI-Powered Classification** ⭐ NEW - Optional local AI (Qwen2.5-7B) for improved accuracy on ambiguous genres
- **Unlimited Scrolling** - Pagination support in Discover tab for seamless browsing
- **Daily Content Rotation** - Different movies every day with 7 unique themes
- **Smart Deduplication** - 5-tier hybrid system (rule-based + AI) ensures each movie appears in only one genre
- **Quality Filtering** - Captures both popular blockbusters and classic films
- **Customizable** - Choose which genres to display via configuration page
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
├── 📄 Core Files
│   ├── README.md                 # This file (project overview)
│   ├── package.json              # Dependencies and scripts
│   ├── .env.example              # Environment variables template
│   ├── netlify.toml              # Netlify deployment config
│   ├── jest.config.js            # Jest test configuration
│   ├── .nvmrc                    # Node version lock (v20)
│   ├── LICENSE                   # MIT License
│   └── PROJECT-MAP.md            # Quick navigation guide
│
├── 📚 docs/                      # Documentation (organized)
│   ├── ARCHITECTURE.md           # System architecture & design
│   ├── AI-INTEGRATION-PLAN.md    # AI classification guide
│   ├── REVERT-GUIDE.md           # Emergency rollback procedures
│   ├── UI-SIMPLIFICATION.md      # Genre chooser disabled
│   ├── CHANGES.md                # Changelog
│   └── DOCUMENTATION-UPDATES.md  # Doc fix summary
│
├── 🔧 lib/                       # Core business logic
│   ├── constants.js              # 22 genres, strategies, config
│   ├── tmdb-client.js            # TMDB API wrapper
│   ├── scoring-engine.js         # Movie ranking (7 strategies)
│   ├── deduplication.js          # 5-tier genre assignment
│   ├── hybrid-cache.js           # Cache optimization
│   ├── cache-manager.js          # Netlify Blobs wrapper
│   ├── rate-limiter.js           # Request throttling
│   ├── logger.js                 # Structured logging
│   └── __tests__/                # Unit tests (Jest)
│
├── ⚡ netlify/functions/         # Serverless endpoints
│   ├── addon.js                  # Main Stremio endpoint
│   └── health.js                 # Health check
│
├── 🎨 public/                    # Static frontend
│   └── index.html                # Config page (genre chooser disabled)
│
├── 🤖 scripts/                   # Automation
│   ├── nightly-update.js         # Daily catalog update
│   ├── test-local.js             # Local testing
│   └── tests-archive/            # Archived test scripts
│
└── ⚙️ .github/workflows/         # CI/CD
    └── nightly-update.yml        # Scheduled job (midnight UTC)
```

**📖 For detailed navigation, see [PROJECT-MAP.md](PROJECT-MAP.md)**

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `TMDB_API_KEY` | Yes | Your TMDB API key | - |
| `NETLIFY_ACCESS_TOKEN` | Yes* | For GitHub Actions to update Blobs | - |
| `NETLIFY_SITE_ID` | Yes* | Your Netlify site ID | - |
| `MOVIES_PER_GENRE` | No | Number of movies per genre | 100 |
| `LOG_LEVEL` | No | Logging verbosity (ERROR/WARN/INFO/DEBUG) | INFO |
| `AI_ENABLED` | No | Enable AI classification (requires Ollama) | false |
| `AI_ENDPOINT` | No | Ollama API endpoint | http://127.0.0.1:11434/api/generate |
| `AI_MODEL` | No | AI model to use | qwen2.5:7b-instruct |
| `AI_CONFIDENCE_THRESHOLD` | No | Minimum confidence for AI classification | 0.7 |

*Required for automated updates

### AI Classification (Optional)

**NEW:** The addon now supports optional AI-powered genre classification using a local LLM (Qwen2.5-7B) via Ollama.

**Benefits:**
- Improved accuracy for ambiguous movies (Sci-Fi vs Fantasy, era-based Action, etc.)
- Smart hybrid system: Rule-based for definitive cases (90%), AI for ambiguous cases (10%)
- Fast: Only adds ~30 seconds to update time
- Private: Runs entirely on your local machine

**Setup:**
```bash
# 1. Install Ollama (https://ollama.ai/)
# 2. Pull the model
ollama pull qwen2.5:7b-instruct

# 3. Start Ollama server
ollama serve

# 4. Enable in .env
AI_ENABLED=true

# 5. Run update
npm run update
```

**See [docs/AI-USAGE-GUIDE.md](docs/AI-USAGE-GUIDE.md) for complete setup and usage instructions.**

### User Configuration

Users can customize their addon by selecting genres on the configuration page. The URL encodes their preferences:

- All genres: `/manifest.json`
- Selected genres: `/ACTION.COMEDY.HORROR/manifest.json`

## Free Tier Limits & Usage

This addon is designed to run entirely on free tiers:

### TMDB API (Free)
- **Limit**: No daily limit, ~40 requests/second
- **Usage**: ~2,640 API calls per nightly update (20 pages × 22 genres + 2,200 detail fetches)
- **Optimized Usage**: ~800 API calls with hybrid caching enabled
- **Cost**: $0/month
- **Notes**: Very generous free tier, no credit card required

### Netlify (Free Tier)
- **Limit**: 100 GB bandwidth/month, 300 build minutes/month
- **Usage**: ~2-4 GB bandwidth/month (estimate), ~30 build minutes/month
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

The addon currently makes approximately 2,640 API calls per nightly update:
- 440 discovery calls (22 genres × 20 pages)
- 2,200 detail calls (100 movies × 22 genres)

With hybrid caching enabled, this reduces to ~800 API calls:
- 44-110 discovery calls (22 genres × 2-5 pages)
- 660 detail calls (30 fresh movies × 22 genres)

This is well within TMDB's free tier limits (no daily limit, ~40 req/sec max).

## How Updates Work

1. **Midnight UTC**: GitHub Actions triggers
2. **Fetch**: Script pulls 20 pages from TMDB per genre (~400 movies each)
3. **Adaptive**: Checks freshness vs cached catalog, fetches more pages if needed
4. **Score**: Scoring engine ranks movies by daily theme + genre personalities
5. **Deduplicate**: 5-tier system assigns each movie to best-fit genre
6. **Merge**: Hybrid cache combines fresh movies with previous catalog
7. **Details**: Fetches full metadata for selected movies (IMDB IDs prioritized)
8. **Store**: Results saved to Netlify Blobs (catalog + metadata + previous catalog)
9. **Serve**: Netlify Functions serve with 5-minute cache headers for quick refresh

## Health Monitoring

Check addon health at `/health`:

```json
{
  "status": "healthy",
  "cache": {
    "updatedAt": "2024-01-15T00:05:23.000Z",
    "ageHours": 2.5,
    "strategy": "RISING_STARS",
    "totalMovies": 2200
  }
}
```

## Genre Categories

The addon includes **22 specialized genres**:

### Standard Genres (16)
Action, Adventure, Animation (Kids), Animation (Adult), Comedy, Crime, Documentary, Drama, Family, Fantasy, History, Horror, Music, Mystery, Romance, Sci-Fi, Thriller, TV Movie, War, Western

### Special Categories (6)
- **Classic Action**: Pre-2000 action films (Die Hard, Terminator era)
- **Superheroes**: Marvel, DC, and superhero movies (detected by title)
- **Animation (Kids)**: Family-friendly Western animation (Pixar, Disney)
- **Animation (Adult)**: Mature Western animation (rating ≥7.5, no Family tag)

**Note**: Japanese anime is excluded from the catalog to focus on Western content.

## Genre Personalities

Each genre has unique scoring characteristics:

- **Action**: Prefers recent high-budget films with summer boost
- **Classic Action**: Bonus for 1980s-1990s golden era films
- **Superheroes**: Franchise bonus, high-budget emphasis, modern era preference
- **Animation (Kids)**: Franchise bonus, holiday season boost (Nov-Dec)
- **Animation (Adult)**: Critical acclaim weighted heavily
- **Horror**: Accepts cult films, massive October boost (+25%)
- **Comedy**: Weights audience validation heavily, older film penalty
- **Drama**: Award season awareness (Jan-Mar boost)
- **Sci-Fi**: Franchise and visual effects bonus
- **Fantasy**: Epic scale bonus
- **Romance**: Valentine's (Feb) and Christmas (Dec) boost
- **Documentary**: Recency weighted, topical bonus
- **Crime**: Golden era bonus (1990-2010)
- **History**: Award season bonus
- **War**: Historical accuracy bonus
- **Western**: Classic era bonus (1950-1980)
- **Thriller**: Sweet spot rating bonus (7.0-8.5)
- **Mystery**: Standard scoring with quality emphasis

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
- **Scoring Engine**: All 7 scoring strategies, modifiers, and edge cases (300+ tests)
- **Deduplication Logic**: 5-tier assignment system, quality thresholds
- **Rate Limiting**: Request throttling and IP tracking
- **Error Handling**: Graceful degradation and user feedback

## Deduplication System

The addon uses a **5-tier assignment system** to ensure movies appear in the most appropriate genre:

### Tier 1: Absolute Isolation
- Superheroes (title-based detection)
- Animation (Kids vs Adult split by rating and Family tag)
- TV Movies
- Documentaries
- **Japanese anime excluded entirely**

### Tier 2: Sci-Fi vs Fantasy
- Strict separation between Sci-Fi and Fantasy
- Primary genre used when both tags present

### Tier 3: Specificity Rules
- War movies → War genre only
- History movies → History genre only
- Horror movies → Horror genre only

### Tier 4: Era-Based Splits
- Action pre-2000 → Classic Action
- Action post-2000 → Action

### Tier 5: Primary Genre Logic
- All other movies use first genre tag from TMDB
- Prevents Drama/Action from stealing War/History movies

**Additional Rules**:
- Pre-1970s movies limited to 5% per genre (5 out of 100)
- High-quality exception: Rating ≥7.5 + votes ≥500 needs only popularity ≥5
- Aggressive backfilling if genres are short on movies

## Recent Improvements

### v1.3.0 (Current)
- ✅ Increased to 100 movies per genre (2,200+ total)
- ✅ Added pagination support with `skip` parameter
- ✅ Implemented 5-tier deduplication system
- ✅ Added hybrid caching for API optimization
- ✅ Special categories: Superheroes, Classic Action, Animation split
- ✅ Pre-1970s limit (5% per genre)
- ✅ Adaptive page fetching based on freshness
- ✅ 5-minute cache headers for quick refresh

### v1.1.0
- ✅ Added comprehensive test suite with Jest (300+ tests)
- ✅ Implemented rate limiting (120 req/min per IP)
- ✅ Added structured logging utility
- ✅ Made `MOVIES_PER_GENRE` configurable via environment variable
- ✅ Improved error handling in configuration UI
- ✅ Prioritize IMDB IDs for better streaming addon compatibility
- ✅ Added `.nvmrc` for Node version locking
- ✅ Added MIT LICENSE file

### v1.0.0
- Initial release with daily rotation system
- 19 genres with basic deduplication
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
