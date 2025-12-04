# Installation Notes - AI Classifier

## Quick Setup

After pulling the latest code with AI classifier integration, run:

```bash
npm install
```

This will install the new `axios` dependency required for AI classification.

## New Dependency

- **axios** (^1.6.0) - HTTP client for communicating with Ollama API

## Verify Installation

```bash
# Check axios is installed
npm list axios

# Should output:
# stremio-tmdb-genre-addon@1.0.0
# └── axios@1.6.x
```

## Testing Without Installing Dependencies

If you want to test the AI classifier without running `npm install`:

```bash
# Install only axios
npm install axios
```

## Next Steps

After installing dependencies:

1. Follow [docs/AI-USAGE-GUIDE.md](docs/AI-USAGE-GUIDE.md) to set up Ollama
2. Enable AI in `.env` with `AI_ENABLED=true`
3. Run `npm run update` to test

---

**Note:** The AI classifier is optional. If you don't want to use it, simply leave `AI_ENABLED=false` (or omit it) in your `.env` file, and the system will use rule-based classification only.
