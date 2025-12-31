# TMDB Genre Explorer - Stremio Addon

A Stremio addon that organizes movies by genre with intelligent daily rotation. Discover new movies every day with smart caching, quality filtering, and 31 curated genres.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

## ✨ Key Features

- **31 Curated Genres** - From Action to Westerns, plus specialized categories like True Crime and Nature documentaries
- **Daily Content Rotation** - Fresh movie selections every day with 7 different discovery strategies
- **Intelligent Caching** - Hybrid system blends new and cached content for daily variety
- **Quality First** - Studio-based filtering ensures only quality productions make the cut
- **Zero Cost** - Runs entirely on free tiers (TMDB, Netlify, GitHub Actions)
- **Fast Updates** - Parallel processing delivers 5x faster catalog refreshes

## 🎬 How It Works

Every day at midnight UTC, the addon:
1. Fetches fresh movies from TMDB (20 pages per genre)
2. Applies studio-based quality filters
3. Blends fresh and cached content using daily strategies
4. Updates your catalog with new discoveries

**Daily Strategies:**
- Monday: **Rising Stars** - Recent films gaining momentum
- Tuesday: **Critical Darlings** - Highly-rated acclaimed films
- Wednesday: **Hidden Gems** - Underrated quality discoveries
- Thursday: **Blockbusters** - Crowd-pleasing hits
- Friday: **Fresh Releases** - Brand new movies
- Saturday: **Timeless Classics** - Beloved older films
- Sunday: **Audience Favorites** - Most-voted picks

## 🚀 Quick Start

### 1. Get a TMDB API Key (Free)

1. Sign up at [themoviedb.org](https://www.themoviedb.org/)
2. Go to Settings → API
3. Request an API key (Developer option)
4. Copy your key

### 2. Deploy to Netlify

1. **Fork this repository**
2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import from Git"
   - Select your forked repository
   - Deploy (no build settings needed)

3. **Add environment variables in Netlify:**
   - Site Settings → Environment Variables
   - Add `TMDB_API_KEY` = your TMDB API key
   - Add `NETLIFY_ACCESS_TOKEN` = (Netlify User Settings → Applications → Personal access tokens)
   - Add `NETLIFY_SITE_ID` = (Site Settings → General → Site ID)

### 3. Setup GitHub Actions

1. **Add secrets in GitHub:**
   - Repository Settings → Secrets and variables → Actions
   - Add `TMDB_API_KEY` (same as Netlify)
   - Add `NETLIFY_ACCESS_TOKEN` (same as Netlify)
   - Add `NETLIFY_SITE_ID` (same as Netlify)

2. **Run initial update:**
   - Go to Actions tab
   - Select "Nightly TMDB Update"
   - Click "Run workflow"
   - Wait ~6-10 minutes

### 4. Install in Stremio

1. Visit your Netlify site URL
2. Select your preferred genres
3. Click "Install in Stremio"

Done! Your addon will auto-update nightly with fresh content.

## 📁 Genre Categories

### Standard Genres (Auto-Populated)
Action, Adventure, Animation (Kids), Animation (Adult), Comedy, Crime, Documentary, Drama, Family, Fantasy, History, Horror, Mystery, Romance, Sci-Fi, Thriller, War, Western

### Special Genres

**Seasonal** - Holiday movies that automatically rotate based on the calendar:
- 🎃 Halloween (Oct 1 - Nov 2): Frankenweenie, Trick or Treat Scooby-Doo!, horror-comedies
- 🎄 Christmas (Nov 20 - Dec 25): Home Alone, Elf, The Grinch, A Christmas Story
- 🎆 New Year's (Dec 26 - Jan 5): Family celebration movies
- ❤️ Valentine's Day (Feb 1 - 20): Romance-themed holiday films
- 🐰 Easter (Mar 15 - Apr 30): Spring holiday movies
- 🎆 Independence Day (Jun 25 - Jul 10): Patriotic films
- 🦃 Thanksgiving (Nov 3 - 19): Thanksgiving-themed movies

The addon automatically shows only movies for the current season!

### Custom Genres (Manual Classification)
Cars & Racing, Disaster, Martial Arts, Nature & Wildlife, Parody, Sports, Stand-Up Comedy, True Crime

Custom genres require manual classification using the included classification tool. See [Custom Genre Classification](#-custom-genre-classification) below.

## 🎯 Quality Filtering

### What Gets In
- ✅ Major studios/platforms (Disney, Warner Bros, Netflix, HBO, etc.)
- ✅ English-language originals
- ✅ Released movies (no future releases)
- ✅ 50+ votes for movies, 10+ for documentaries
- ✅ Recent films prioritized unless classics (8.0+/10k votes)

### What Gets Filtered Out
- ❌ Direct-to-video releases
- ❌ TV movies
- ❌ Non-English originals (Bollywood, Korean, etc.)
- ❌ Very old movies unless exceptional
- ❌ Future/unreleased movies

## 🔧 Advanced Features

### Hybrid Caching System

Intelligent cache blending ensures daily variety:
- **66% minimum fresh content** in top positions
- **Daily strategy scoring** applied to all content
- **Historical penalty** (30%) for recently shown movies
- **Controlled randomization** (deterministic per day)
- **Age-based filtering** with exceptions for classics

### Performance Optimizations

- **5x faster genre discovery** (5 concurrent genres)
- **3x faster detail fetching** (3 concurrent batches)
- **Keyword-based discovery** for documentaries and specials
- **Early deduplication** reduces unnecessary API calls
- **Overall: 10-15x faster** than sequential processing

### Specialized Discovery

- **Documentaries:** Keyword filtering with 75+ producer studios
- **True Crime:** Curated keywords for precision
- **Nature & Wildlife:** Specialized nature keywords
- **Stand-Up Comedy:** Comedy special keywords only

## 🏷️ Custom Genre Classification

Custom genres require manual classification to ensure quality. The classification tool integrates with Claude Code in VS Code.

### Setup

```bash
# Clone repository
git clone <your-repo-url>
cd stremio-tmdb-addon

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with TMDB_API_KEY, NETLIFY_ACCESS_TOKEN, NETLIFY_SITE_ID
```

### Classify Movies

```bash
# List unclassified movies
npm run classify
```

Copy the output to Claude Code in VS Code and say: **"Classify these movies into custom genres"**

Claude will:
1. Analyze all movies
2. Create classifications.json
3. Save to Netlify Blobs automatically

Then apply:
```bash
npm run update
```

Unclassified movies stay **out of rotation** until manually classified.

## 💰 Free Tier Usage

Runs entirely on free tiers with plenty of headroom:

| Service | Free Limit | Usage | Cost |
|---------|------------|-------|------|
| **TMDB API** | ~40 req/sec | ~1000-1500 req/day | $0 |
| **Netlify** | 100 GB/month | ~2-3 GB/month | $0 |
| **GitHub Actions** | 2000 min/month* | ~180-300 min/month | $0 |

*Unlimited for public repos

**Estimated capacity:** Thousands of users on free tier

## 📊 Commands Reference

| Command | Description |
|---------|-------------|
| `npm run update` | Run nightly update (fetch from TMDB) |
| `npm run classify` | List unclassified movies for classification |
| `npm run reset-cache` | Clear all cached data from Netlify Blobs |
| `npm run dev` | Start local development server |

## 🏗️ Project Structure

```
stremio-tmdb-addon/
├── .github/workflows/
│   └── nightly-update.yml     # Scheduled update job (midnight UTC)
├── lib/
│   ├── constants.js           # Genre definitions, keywords, studios
│   ├── tmdb-client.js         # TMDB API wrapper with keyword discovery
│   ├── hybrid-cache.js        # Intelligent cache merging with scoring
│   └── rate-limiter.js        # Rate limiting protection
├── netlify/functions/
│   ├── addon.js               # Main Stremio endpoint
│   └── health.js              # Health check endpoint
├── scripts/
│   ├── nightly-update.js      # Update script (parallel fetching)
│   ├── classify-movies.js     # List unclassified movies
│   ├── save-classifications.js # Save genre assignments
│   └── reset-cache.js         # Clear cached data
├── public/
│   └── index.html             # Configuration page
└── package.json               # Dependencies and scripts
```

## 🔍 Health Monitoring

Check addon health at `https://your-site.netlify.app/.netlify/functions/health`:

```json
{
  "status": "healthy",
  "requestId": "a1b2c3d4",
  "cache": {
    "updatedAt": "2025-01-15T00:05:23.000Z",
    "ageHours": 2.5,
    "strategy": "RISING_STARS",
    "totalMovies": 3100,
    "genreCount": 31,
    "apiRequests": 1250
  }
}
```

## 🐛 Troubleshooting

### Addon not showing movies
- Check `/health` endpoint
- Verify GitHub Action ran successfully
- Ensure environment variables are set in both Netlify and GitHub

### Movies not updating
- Check GitHub Actions logs for errors
- Verify TMDB API key is valid
- Check Netlify function logs

### Custom genres empty
- Run `npm run classify` to see unclassified movies
- Classify movies using Claude Code
- Run `npm run update` to apply classifications

### Can't install addon
- Ensure URL ends with `/manifest.json`
- Try Stremio Web if desktop fails
- Check browser console for errors

## 🚀 Recent Improvements

### v2.0.0 (Latest)
- ✅ Hybrid caching system with intelligent fresh/cached blending
- ✅ Parallel API fetching (5x faster updates)
- ✅ Keyword-based discovery for documentaries and specials
- ✅ Recency preference with age-based scoring
- ✅ Manual classification system for custom genres
- ✅ Studio-based quality filtering
- ✅ English-language enforcement
- ✅ Expanded to 31 genres (17 standard + 14 custom)
- ✅ 20 pages fetched daily for maximum variety

### v1.1.0
- ✅ Rate limiting (120 req/min per IP)
- ✅ Structured logging utility
- ✅ Comprehensive test suite with Jest
- ✅ IMDB ID priority for compatibility

### v1.0.0
- Initial release with daily rotation system
- 19 genres with smart deduplication
- Genre-specific personalities and scoring

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

Data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/stremio-tmdb-addon/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/stremio-tmdb-addon/discussions)
