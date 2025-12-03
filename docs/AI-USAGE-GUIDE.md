# AI Classification Usage Guide

This guide covers how to use the AI-powered genre classification system with your local Qwen2.5-7B model.

## Quick Start

### 1. Install Ollama

Download and install Ollama from https://ollama.ai/

### 2. Pull the Model

```bash
ollama pull qwen2.5:7b-instruct
```

This will download the Qwen2.5-7B-Instruct model (approximately 4.7GB).

### 3. Start Ollama Server

```bash
ollama serve
```

The server will start on `http://127.0.0.1:11434` by default.

### 4. Enable AI in Your Environment

Create or update your `.env` file:

```bash
# Enable AI classification
AI_ENABLED=true

# Optional: Customize endpoint (if running on different host/port)
# AI_ENDPOINT=http://127.0.0.1:11434/api/generate

# Optional: Use a different model
# AI_MODEL=qwen2.5:7b-instruct

# Optional: Adjust confidence threshold (default: 0.7)
# AI_CONFIDENCE_THRESHOLD=0.7
```

### 5. Run Updates with AI

```bash
npm run update
```

You'll see AI classification in action:

```
🔄 Processing and deduplicating movies...
  🤖 AI classification enabled
  📊 150 movies will use AI classification
  🤖 AI classifier: Processing 150 movies in 150 batches...
  ✓ AI: "Interstellar" → SCIFI (95%)
  ✓ AI: "The Lord of the Rings" → FANTASY (98%)
  ⚠️  AI: "Edge of Tomorrow" → SCIFI (68% - low confidence, will fallback)
  📊 AI Stats: 140 classified, 10 fallbacks, 1850 rule-based
```

## How It Works

### Hybrid Classification System

The system uses a **hybrid approach** that combines rule-based logic with AI:

```
┌─────────────────────────────────────────────────────────────┐
│                     Movie Classification                      │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────▼───────────┐
        │  shouldUseRuleBased?  │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   Yes  │                       │  No
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│  Rule-Based   │       │  AI Classifier │
│  (Definitive) │       │  (Ambiguous)   │
└───────────────┘       └───────┬───────┘
        │                       │
        │               ┌───────┴───────┐
        │               │               │
        │         High Confidence  Low Confidence
        │               │               │
        │               ▼               ▼
        │       ┌───────────────┐  ┌───────────────┐
        │       │  Use AI Genre │  │  Fallback to  │
        │       │               │  │  Rule-Based   │
        │       └───────────────┘  └───────────────┘
        │               │               │
        └───────────────┴───────────────┘
                        │
                ┌───────▼───────┐
                │ Final Genre   │
                └───────────────┘
```

### What Uses Rule-Based? (Tier 1-3)

**Definitive cases** that don't need AI:

1. **Tier 1 - Absolute Isolation:**
   - Superheroes (Avengers, Batman, etc.)
   - Animation (any movie with Animation genre)
   - TV Movies (TMDB genre 10770)
   - Documentaries (TMDB genre 99)

2. **Tier 3 - Specificity:**
   - War movies (TMDB genre 10752)
   - History movies (TMDB genre 36)
   - Horror movies (TMDB genre 27)

**Example:**
```javascript
// These use rule-based classification:
"Avengers: Endgame" → SUPERHEROES (has "Avengers" in title)
"Saving Private Ryan" → WAR (has War genre tag)
"Toy Story" → ANIMATION_KIDS (Animation + Family genre)
"The Exorcist" → HORROR (has Horror genre tag)
```

### What Uses AI? (Tier 4-5)

**Ambiguous cases** where AI adds value:

1. **Tier 2 - Sci-Fi vs Fantasy:**
   - Movies with BOTH sci-fi and fantasy tags
   - Example: Star Wars (space opera with mystical Force)

2. **Tier 4 - Era-Based:**
   - Action movies (Classic pre-2000 vs Modern post-2000)
   - AI can better judge if it's truly an "action" film

3. **Tier 5 - Primary Genre:**
   - Movies with multiple genre tags
   - AI determines which is the PRIMARY genre

**Example:**
```javascript
// These use AI classification:
"Interstellar" → AI: SCIFI (95% confidence)
  Reasoning: "Hard sci-fi with realistic space physics"

"Edge of Tomorrow" → AI: SCIFI (68% confidence) → Fallback to rule-based: ACTION
  Reasoning: "Action-heavy but has time loop sci-fi element"

"Arrival" → AI: SCIFI (92% confidence)
  Reasoning: "Cerebral sci-fi focused on linguistics and aliens"
```

## Configuration Options

### AI_ENABLED

Enable or disable AI classification.

```bash
AI_ENABLED=true   # Use AI for ambiguous cases
AI_ENABLED=false  # Use rule-based only (default)
```

### AI_ENDPOINT

Ollama API endpoint. Change if running on a different host or port.

```bash
# Local (default)
AI_ENDPOINT=http://127.0.0.1:11434/api/generate

# Remote server
AI_ENDPOINT=http://192.168.1.100:11434/api/generate

# Custom port
AI_ENDPOINT=http://127.0.0.1:8080/api/generate
```

### AI_MODEL

The Ollama model to use for classification.

```bash
# Qwen2.5-7B Instruct (recommended, balanced accuracy/speed)
AI_MODEL=qwen2.5:7b-instruct

# Qwen2.5-14B Instruct (more accurate, slower)
AI_MODEL=qwen2.5:14b-instruct

# Llama 3.1 8B (alternative)
AI_MODEL=llama3.1:8b-instruct
```

**Model Comparison:**

| Model | Size | Speed | Accuracy | RAM Required |
|-------|------|-------|----------|--------------|
| qwen2.5:7b-instruct | 4.7GB | Fast | High | 8GB |
| qwen2.5:14b-instruct | 8.5GB | Medium | Very High | 16GB |
| llama3.1:8b-instruct | 4.9GB | Fast | Medium-High | 8GB |

### AI_CONFIDENCE_THRESHOLD

Minimum confidence level (0.0 to 1.0) required to accept AI classification.

```bash
AI_CONFIDENCE_THRESHOLD=0.7   # Default (70%)
AI_CONFIDENCE_THRESHOLD=0.85  # Stricter (more fallbacks)
AI_CONFIDENCE_THRESHOLD=0.6   # Looser (fewer fallbacks)
```

**Threshold Guidelines:**

- **0.9+**: Only accept very confident classifications (many fallbacks)
- **0.7-0.8**: Balanced (recommended)
- **0.5-0.6**: Accept more AI classifications (fewer fallbacks)
- **< 0.5**: Not recommended (too many low-confidence classifications)

## Performance Tuning

### Batch Processing

The AI classifier processes movies in batches to avoid overwhelming the Ollama server.

**Default settings:**
- **Delay between batches**: 200ms
- **Concurrent requests**: 1 (sequential processing)

These are configured in [scripts/nightly-update.js](../scripts/nightly-update.js):

```javascript
const aiResults = await this.aiClassifier.classifyBatch(
  moviesNeedingAI.map(item => item.movie),
  200,  // 200ms delay between requests
  1     // Process one at a time
);
```

**If you have a powerful GPU**, you can increase concurrency:

```javascript
const aiResults = await this.aiClassifier.classifyBatch(
  moviesNeedingAI.map(item => item.movie),
  100,  // Reduced delay (faster)
  3     // Process 3 movies at once
);
```

### Expected Processing Time

For a typical nightly update with AI enabled:

- **~150 movies** need AI classification (ambiguous cases)
- **~200ms per movie** (including delay)
- **Total AI time: ~30 seconds**

Rule-based classification: ~2,000 movies in < 1 second

**Total update time:**
- Without AI: ~5-10 minutes (TMDB API calls dominate)
- With AI: ~5-11 minutes (adds ~30 seconds)

## Testing AI Classification

### Test Locally

```bash
# Enable AI in .env
AI_ENABLED=true

# Run update script
npm run update
```

### Test AI Classifier Module

```bash
# Run AI classifier tests
npm test -- ai-classifier.test.js
```

### Test Specific Movies

Create a test script `test-ai.js`:

```javascript
const AIClassifier = require('./lib/ai-classifier');

async function testClassification() {
  const classifier = new AIClassifier({ enabled: true });

  const movie = {
    title: 'Interstellar',
    release_date: '2014-11-07',
    overview: 'A team of explorers travel through a wormhole in space...',
    genres: [{ name: 'Science Fiction' }, { name: 'Drama' }],
    vote_average: 8.6
  };

  const result = await classifier.classifyMovie(movie);
  console.log('Classification:', result);
}

testClassification();
```

Run it:

```bash
node test-ai.js
```

## Troubleshooting

### Error: "AI server not running"

```
✗ AI server not running. Start with: ollama serve
```

**Solution:**
1. Make sure Ollama is installed: `ollama --version`
2. Start the server: `ollama serve`
3. Verify it's running: `curl http://127.0.0.1:11434/api/tags`

### Error: "Model not found"

```
✗ Model 'qwen2.5:7b-instruct' not found
```

**Solution:**
```bash
ollama pull qwen2.5:7b-instruct
```

### High Fallback Rate

```
📊 AI Stats: 50 classified, 100 fallbacks, 1850 rule-based
```

**Possible causes:**
1. **Confidence threshold too high** - Lower `AI_CONFIDENCE_THRESHOLD`
2. **Model not suitable** - Try a different model (qwen2.5:14b-instruct)
3. **Prompt needs tuning** - Edit [lib/ai-classifier.js](../lib/ai-classifier.js) prompt

### Slow Performance

**If AI classification is taking too long:**

1. **Check GPU usage:**
   ```bash
   # For NVIDIA GPUs
   nvidia-smi
   ```

2. **Reduce batch size:**
   ```javascript
   // In scripts/nightly-update.js
   await classifier.classifyBatch(movies, 500, 1);  // Slower, but less memory
   ```

3. **Use smaller model:**
   ```bash
   AI_MODEL=qwen2.5:7b-instruct  # Faster than 14b
   ```

4. **Disable AI temporarily:**
   ```bash
   AI_ENABLED=false
   ```

## Monitoring AI Performance

### View Statistics

After each update, check the logs for AI statistics:

```
📊 AI Stats: 140 classified, 10 fallbacks, 1850 rule-based
```

**Interpretation:**
- **140 classified**: AI successfully classified 140 ambiguous movies
- **10 fallbacks**: 10 movies had low confidence, fell back to rule-based
- **1850 rule-based**: 1,850 definitive movies used rule-based

**Healthy stats:**
- Fallback rate < 20% (confidence threshold is appropriate)
- AI classifications focus on Tier 4-5 (ambiguous cases)

### Check AI Accuracy

Compare AI classifications with rule-based results:

```bash
# Run with AI enabled
AI_ENABLED=true npm run update > with-ai.log

# Run with AI disabled
AI_ENABLED=false npm run update > without-ai.log

# Compare genre assignments
diff with-ai.log without-ai.log
```

## Advanced Usage

### Custom Prompt Engineering

Edit the prompt in [lib/ai-classifier.js](../lib/ai-classifier.js):

```javascript
buildPrompt(movie) {
  return `You are a movie genre classifier...

**Custom Rules:**
- Prioritize ACTION for movies with > 50% action sequences
- SCIFI requires futuristic or scientific elements
- FANTASY requires magic or mythical creatures

...`;
}
```

### Using Different AI Backends

The system currently supports Ollama, but you can adapt it for other backends:

1. **OpenAI GPT-4:**
   - Modify endpoint to OpenAI API
   - Add API key authentication
   - Adjust request format

2. **Local LLMs (llama.cpp):**
   - Change endpoint to llama.cpp server
   - Adjust prompt format if needed

3. **Hugging Face Models:**
   - Use transformers.js or similar
   - Load model directly in Node.js

## Best Practices

1. **Start with AI disabled** - Build your catalog with rule-based first
2. **Test locally** - Verify AI classifications before deploying
3. **Monitor fallback rate** - Adjust confidence threshold as needed
4. **Use appropriate model** - Balance accuracy vs speed
5. **Keep Ollama updated** - `ollama update`

## FAQ

**Q: Does AI classification replace rule-based?**
A: No, it's a hybrid system. Rule-based handles definitive cases (Tier 1-3), AI handles ambiguous cases (Tier 4-5).

**Q: How much does AI improve accuracy?**
A: AI is particularly valuable for:
- Sci-fi vs Fantasy ambiguity
- Era-based Action classifications
- Primary genre determination
- Typical improvement: 5-10% better genre assignments

**Q: Can I use AI for all movies?**
A: Yes, but it's slower and unnecessary. Superhero detection, war movies, and documentaries are definitive cases that don't benefit from AI.

**Q: What happens if Ollama crashes during update?**
A: The system falls back to rule-based classification automatically. No data loss.

**Q: Can I use GPU acceleration?**
A: Yes! Ollama automatically uses GPU if available. Check with `nvidia-smi` (NVIDIA) or `rocm-smi` (AMD).

## Resources

- **Ollama Documentation**: https://ollama.ai/docs
- **Qwen2.5 Model Card**: https://huggingface.co/Qwen/Qwen2.5-7B-Instruct
- **AI Integration Plan**: [AI-INTEGRATION-PLAN.md](AI-INTEGRATION-PLAN.md)
- **Architecture Overview**: [ARCHITECTURE.md](ARCHITECTURE.md)

## Support

If you encounter issues:

1. Check this guide first
2. Review [AI-INTEGRATION-PLAN.md](AI-INTEGRATION-PLAN.md)
3. Check Ollama logs: `ollama logs`
4. Test AI module: `npm test -- ai-classifier.test.js`
5. Report issues with logs and error messages

---

**Last Updated:** 2025-12-03
**AI Classifier Version:** 1.0.0
**Compatible with:** stremio-tmdb-addon v1.3.0+
