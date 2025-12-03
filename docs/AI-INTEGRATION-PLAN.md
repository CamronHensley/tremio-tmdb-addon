# AI-Based Genre Classification Integration Plan

## Overview

This document outlines the plan to integrate **Qwen2.5-7B-Instruct** (running locally) to replace or augment the current rule-based 5-tier deduplication system with AI-powered genre classification.

## Current State

### What We Have
- **5-tier rule-based system** in [lib/deduplication.js](lib/deduplication.js)
- **1,004 lines** of hardcoded logic with:
  - Title-based superhero detection (regex)
  - Era-based splits (pre/post-2000)
  - Language detection (Japanese anime blocking)
  - Rating-based animation split (Kids vs Adult)
  - Primary genre fallback logic

### Limitations
1. **Hardcoded patterns**: Regex for superheroes misses non-English titles
2. **Rating assumptions**: Kids animation assumed to have rating <7.5 (not always true)
3. **No context awareness**: Can't understand plot, themes, or nuances
4. **Binary decisions**: Movies fit or don't fit; no confidence scores
5. **Maintenance burden**: Adding new categories requires code changes

## AI Integration Goals

### Primary Objectives
1. **Improve accuracy**: Use plot summaries, keywords, and metadata for classification
2. **Confidence scoring**: Return probability distribution across genres
3. **Multi-label support**: Movies can belong to multiple genres with scores
4. **Contextual understanding**: Detect superhero movies by content, not just title
5. **Reduce maintenance**: Add new genres without code changes

### Non-Goals (For Now)
- ❌ Real-time classification during API requests (too slow)
- ❌ Cloud-based AI (keep it local, privacy-first)
- ❌ Training custom models (use existing LLM)

## Architecture Design

### Hybrid Approach (Recommended)

Keep the rule-based system as a **fallback** and use AI for **refinement**:

```
Movie from TMDB
  ↓
1. Fast Rule-Based Pre-Filter (Tier 1-3)
   - Documentaries → Documentary (definitive)
   - TV Movies → TV Movie (definitive)
   - Japanese anime → REJECT (definitive)
   ↓
2. AI Classification (Tier 4-5)
   - Fetch movie plot, keywords, cast
   - Send to local Qwen2.5-7B
   - Get genre probabilities
   - Assign to highest confidence genre
   ↓
3. Quality Filter & Backfill
   - Apply quality thresholds
   - Fill genres to target count
```

**Benefits**:
- Fast decisions for obvious cases (30% of movies)
- High accuracy for ambiguous cases (70% of movies)
- Fallback if AI is unavailable

### Full AI Approach (Alternative)

Replace entire deduplication system with AI:

```
Movie from TMDB
  ↓
1. Fetch Extended Metadata
   - Plot summary (overview)
   - Keywords from TMDB
   - Cast, director, crew
   - User reviews (optional)
   ↓
2. AI Prompt Engineering
   - Structured prompt with genres
   - Few-shot examples per genre
   - Request JSON response
   ↓
3. Parse AI Response
   - Extract genre probabilities
   - Assign to best fit
   - Handle errors/fallbacks
```

**Benefits**:
- Simpler codebase (less hardcoded rules)
- More flexible (easy to add genres)

**Drawbacks**:
- Slower (~500ms per movie vs ~1ms)
- Requires local AI server always running
- No fallback if AI fails

## Technical Implementation

### 1. Local AI Server Setup

**Option A: llama.cpp Server**
```bash
# Download llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Start server with Qwen model
./server -m /path/to/Qwen2.5-7B-Instruct-Q8_0.gguf \
  --host 127.0.0.1 \
  --port 8080 \
  --ctx-size 4096 \
  --threads 8
```

**Option B: Ollama** (Easier)
```bash
# Install Ollama
# Download from https://ollama.ai

# Pull Qwen model
ollama pull qwen2.5:7b-instruct

# Run server (auto-starts on port 11434)
ollama serve
```

**Option C: LM Studio** (GUI)
- Download LM Studio: https://lmstudio.ai/
- Load Qwen2.5-7B model
- Start local server from UI

### 2. Node.js Integration

Create a new module: `lib/ai-classifier.js`

```javascript
const axios = require('axios');

class AIClassifier {
  constructor(options = {}) {
    this.endpoint = options.endpoint || 'http://127.0.0.1:11434/api/generate'; // Ollama
    this.model = options.model || 'qwen2.5:7b-instruct';
    this.timeout = options.timeout || 30000; // 30 seconds
    this.enabled = options.enabled !== false;
  }

  /**
   * Classify a movie using AI
   * @param {Object} movie - Movie object with title, overview, genres, keywords
   * @returns {Object} - { primaryGenre, confidence, probabilities }
   */
  async classifyMovie(movie) {
    if (!this.enabled) {
      return null; // Fall back to rule-based
    }

    try {
      const prompt = this.buildPrompt(movie);
      const response = await axios.post(this.endpoint, {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistent results
          top_p: 0.9,
          max_tokens: 500
        }
      }, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' }
      });

      const result = this.parseResponse(response.data.response);
      return result;
    } catch (error) {
      console.error('AI classification failed:', error.message);
      return null; // Fall back to rule-based
    }
  }

  /**
   * Build classification prompt
   */
  buildPrompt(movie) {
    return `You are a movie genre classifier. Analyze the following movie and determine the SINGLE most appropriate genre.

Available Genres:
- ACTION: Modern action films (post-2000) with high-energy sequences
- ACTION_CLASSIC: Classic action films (pre-2000) from the golden era
- ADVENTURE: Journey-focused stories, exploration, quests
- ANIMATION_KIDS: Family-friendly animated films (Pixar, Disney style)
- ANIMATION_ADULT: Mature animated films for adult audiences
- COMEDY: Humor-focused films, lighthearted content
- CRIME: Criminal activities, heists, detective stories
- DOCUMENTARY: Non-fiction, real events, educational
- DRAMA: Character-driven, emotional, serious themes
- FAMILY: Suitable for all ages, wholesome content
- FANTASY: Magic, mythical creatures, imaginary worlds
- HISTORY: Historical events, period pieces, biographical
- HORROR: Scary, suspenseful, supernatural threats
- MUSIC: Music-focused stories, musicals, biopics of musicians
- MYSTERY: Puzzles, investigations, whodunits
- ROMANCE: Love stories, relationships, emotional connections
- SCIFI: Science fiction, futuristic, space, technology
- SUPERHEROES: Marvel, DC, superhero characters (any medium)
- THRILLER: Suspense, tension, psychological drama
- TVMOVIE: Made-for-TV movies, TV specials
- WAR: War-focused, military conflict, soldiers
- WESTERN: Cowboys, frontier, American Old West

Movie Information:
- Title: ${movie.title}
- Release Year: ${new Date(movie.release_date).getFullYear()}
- Overview: ${movie.overview}
- TMDB Genres: ${movie.genres.map(g => g.name).join(', ')}
${movie.keywords ? `- Keywords: ${movie.keywords.map(k => k.name).join(', ')}` : ''}

Important Rules:
1. Choose ONLY ONE genre from the list above
2. SUPERHEROES takes priority if the movie features superhero characters
3. ANIMATION_KIDS if animated + family-friendly; ANIMATION_ADULT if animated + mature themes
4. ACTION_CLASSIC for action films made before 2000; ACTION for modern action films
5. WAR, HISTORY, HORROR take priority over generic DRAMA or ACTION

Respond ONLY with a JSON object in this format:
{
  "genre": "GENRE_CODE",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}`;
  }

  /**
   * Parse AI response and extract genre
   */
  parseResponse(responseText) {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        primaryGenre: parsed.genre,
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || '',
        rawResponse: responseText
      };
    } catch (error) {
      console.error('Failed to parse AI response:', responseText);
      return null;
    }
  }

  /**
   * Batch classify movies (with rate limiting)
   */
  async classifyBatch(movies, delayMs = 100) {
    const results = [];

    for (const movie of movies) {
      const result = await this.classifyMovie(movie);
      results.push({ movie, result });

      // Delay between requests to avoid overwhelming the server
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  /**
   * Check if AI server is available
   */
  async healthCheck() {
    try {
      const response = await axios.get(
        this.endpoint.replace('/api/generate', '/api/tags'),
        { timeout: 5000 }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = AIClassifier;
```

### 3. Integration with Deduplication System

Modify [lib/deduplication.js](lib/deduplication.js):

```javascript
const AIClassifier = require('./ai-classifier');

class DeduplicationProcessor {
  constructor(options = {}) {
    this.aiEnabled = options.aiEnabled || false;
    this.aiClassifier = new AIClassifier({
      enabled: this.aiEnabled,
      endpoint: process.env.AI_ENDPOINT || 'http://127.0.0.1:11434/api/generate',
      model: process.env.AI_MODEL || 'qwen2.5:7b-instruct'
    });
    // ... existing code
  }

  async processAllGenres(moviesByGenre, recentMovieIds = []) {
    // ... existing code

    // NEW: AI-enhanced classification
    if (this.aiEnabled && await this.aiClassifier.healthCheck()) {
      console.log('🤖 AI classification enabled');
      await this.aiEnhancedDeduplication(allMovies);
    } else {
      console.log('📊 Using rule-based classification');
      // Existing 5-tier system
    }

    // ... rest of existing code
  }

  async aiEnhancedDeduplication(movies) {
    // Keep Tier 1 rules (fast, definitive)
    const tier1Movies = movies.filter(m =>
      this.isDocumentary(m) ||
      this.isTVMovie(m) ||
      this.isJapaneseAnime(m)
    );

    // Use AI for everything else
    const tier2PlusMovies = movies.filter(m => !tier1Movies.includes(m));

    console.log(`  🤖 Classifying ${tier2PlusMovies.length} movies with AI...`);

    const results = await this.aiClassifier.classifyBatch(tier2PlusMovies, 200);

    // Process results
    for (const { movie, result } of results) {
      if (result && result.confidence > 0.7) {
        // High confidence: Use AI classification
        this.assignToGenre(movie, result.primaryGenre, 'ai-classification');
      } else {
        // Low confidence: Fall back to rule-based
        this.assignToGenreRuleBased(movie);
      }
    }
  }
}
```

### 4. Environment Variables

Add to `.env`:

```bash
# AI Classification (optional)
AI_ENABLED=true
AI_ENDPOINT=http://127.0.0.1:11434/api/generate
AI_MODEL=qwen2.5:7b-instruct
AI_CONFIDENCE_THRESHOLD=0.7
```

### 5. Performance Optimization

**Problem**: Classifying 2,200 movies takes too long
- Rule-based: ~2 seconds (1ms per movie)
- AI-based: ~20 minutes (500ms per movie)

**Solutions**:

1. **Parallel Processing** (if GPU/CPU permits)
   ```javascript
   async classifyBatch(movies, concurrency = 4) {
     const chunks = [];
     for (let i = 0; i < movies.length; i += concurrency) {
       chunks.push(movies.slice(i, i + concurrency));
     }

     const results = [];
     for (const chunk of chunks) {
       const chunkResults = await Promise.all(
         chunk.map(m => this.classifyMovie(m))
       );
       results.push(...chunkResults);
     }
     return results;
   }
   ```

2. **Cache AI Results** (reuse for movies already classified)
   ```javascript
   // Store in Netlify Blobs
   await store.setJSON(`ai-classification:${movieId}`, {
     genre: result.primaryGenre,
     confidence: result.confidence,
     timestamp: Date.now()
   });
   ```

3. **Incremental Classification** (only new movies)
   ```javascript
   const newMovies = allMovies.filter(m => !aiCache.has(m.id));
   console.log(`  🤖 Classifying ${newMovies.length} new movies with AI...`);
   ```

4. **Batch API Calls** (if supported by AI server)
   - Send multiple movies in one request
   - Parse multiple responses

## Testing Strategy

### Phase 1: Accuracy Validation
1. **Manually label 100 movies** across all genres
2. **Run AI classifier** on the same 100 movies
3. **Compare results**:
   - Accuracy: % correct classifications
   - Precision/Recall per genre
   - Confusion matrix (which genres are confused)

### Phase 2: Integration Testing
1. **Run nightly update** with AI enabled
2. **Spot check** 10 movies per genre
3. **Compare to rule-based** results
4. **Check for regressions** (obvious mistakes)

### Phase 3: A/B Testing
1. **Deploy both systems** side-by-side
2. **Track user engagement** per genre
3. **Monitor streaming success rate** (do users find what they want?)

## Prompt Engineering Tips

### Improve Accuracy
1. **Few-shot examples**:
   ```
   Examples:
   - "The Avengers" (2012) → SUPERHEROES (Marvel characters)
   - "Die Hard" (1988) → ACTION_CLASSIC (pre-2000 action)
   - "Spirited Away" (2001) → ANIMATION_ADULT (mature themes, high rating)
   ```

2. **Explicit edge cases**:
   ```
   Edge Cases:
   - Animated superhero movies → SUPERHEROES (not ANIMATION)
   - Action films with war setting → WAR (not ACTION)
   - Dark comedies → COMEDY if humor is primary focus
   ```

3. **Confidence calibration**:
   ```
   Return confidence:
   - 0.9-1.0: Obvious, clear-cut case
   - 0.7-0.9: Strong indicators, minor ambiguity
   - 0.5-0.7: Ambiguous, multiple valid genres
   - <0.5: Uncertain, request fallback
   ```

## Cost Analysis

### Hardware Requirements
- **CPU**: 8-core recommended (4-core minimum)
- **RAM**: 16 GB (8 GB for model + 8 GB for OS/other)
- **Storage**: 5 GB for Qwen2.5-7B-Q8_0 model
- **GPU**: Optional (speeds up inference 10-100×)

### Time Cost
- **Setup**: 1-2 hours (download model, test server)
- **Integration**: 4-8 hours (write classifier, integrate, test)
- **Tuning**: 2-4 hours (prompt engineering, validation)
- **Total**: ~1-2 days of work

### Ongoing Cost
- **Electricity**: ~50-100W continuous (local server)
- **Maintenance**: Minimal (automatic updates)

## Migration Path

### Step 1: Setup Local AI (Week 1)
- [ ] Choose AI server (Ollama recommended)
- [ ] Download Qwen2.5-7B model
- [ ] Test classification with 10 sample movies
- [ ] Validate JSON parsing

### Step 2: Build Classifier Module (Week 1-2)
- [ ] Create `lib/ai-classifier.js`
- [ ] Implement prompt engineering
- [ ] Add error handling and fallbacks
- [ ] Write unit tests

### Step 3: Integrate with Deduplication (Week 2)
- [ ] Add AI classification to `lib/deduplication.js`
- [ ] Keep rule-based as fallback
- [ ] Add environment variable toggles
- [ ] Test with 100 movies

### Step 4: Validation & Tuning (Week 3)
- [ ] Run full nightly update with AI
- [ ] Manually review 220 movies (10 per genre)
- [ ] Adjust prompts for problem genres
- [ ] Measure accuracy vs rule-based

### Step 5: Production Deployment (Week 4)
- [ ] Update documentation
- [ ] Add AI classification to CI/CD
- [ ] Monitor for regressions
- [ ] Gather user feedback

## Expected Improvements

### Accuracy Gains
- **Superheroes**: 95% → 99% (no title regex needed)
- **Animation Kids/Adult**: 80% → 95% (context-aware)
- **Action vs Action Classic**: 90% → 98% (era understanding)
- **War vs History**: 85% → 95% (theme detection)
- **Overall**: 88% → 96% (estimated)

### Flexibility Gains
- Add new genres without code changes (update prompt only)
- Multi-label support (movies in multiple genres)
- Confidence scoring for better UX
- Easier maintenance (no hardcoded rules)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI server crashes | Medium | High | Keep rule-based fallback |
| Slow inference time | High | Medium | Parallel processing, caching |
| Inconsistent results | Low | Medium | Low temperature, validation |
| Model unavailable | Low | High | Fallback to rule-based |
| Prompt injection | Very Low | Low | No user input in prompts |

## Next Steps

1. **Set up Ollama** and test Qwen2.5-7B with 10 movies
2. **Create proof-of-concept** with `ai-classifier.js`
3. **Review this plan** and adjust based on your preferences
4. **Start implementation** once POC is validated

## Resources

- **Ollama**: https://ollama.ai/
- **llama.cpp**: https://github.com/ggerganov/llama.cpp
- **LM Studio**: https://lmstudio.ai/
- **Qwen2.5 Models**: https://huggingface.co/Qwen/Qwen2.5-7B-Instruct
- **Prompt Engineering Guide**: https://www.promptingguide.ai/

---

**Questions? Let's discuss the approach before starting implementation!**
