# AI Classifier Setup Checklist

Quick checklist to get AI classification running. ✅ = Done, ⏳ = Todo

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Project dependencies installed (`npm install`)
- [ ] At least 8GB RAM available
- [ ] ~5GB disk space for model

---

## Installation Steps

### 1. Install Ollama

- [ ] Download Ollama from https://ollama.ai/
- [ ] Install and verify: `ollama --version`

**Quick install:**
```bash
# macOS
brew install ollama

# Windows: Download from website

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Download AI Model

- [ ] Pull Qwen2.5-7B model: `ollama pull qwen2.5:7b-instruct`
- [ ] Wait for ~4.7GB download to complete

**Command:**
```bash
ollama pull qwen2.5:7b-instruct
```

**Expected output:**
```
pulling manifest
pulling 8f59eff50d6e... 100% ▕████████████████▏ 4.7 GB
pulling 8f59eff50d6e... done
verifying sha256 digest
writing manifest
success
```

### 3. Start Ollama Server

- [ ] Start server: `ollama serve`
- [ ] Leave running in terminal
- [ ] Verify running: `curl http://127.0.0.1:11434/api/tags`

**Command:**
```bash
# In separate terminal window
ollama serve
```

**Keep this terminal open!** The server needs to stay running.

### 4. Install Project Dependencies

- [ ] Run: `npm install`
- [ ] Verify axios is installed: `npm list axios`

**Command:**
```bash
cd stremio-tmdb-addon
npm install
```

### 5. Enable AI in Environment

- [ ] Copy `.env.example` to `.env` (if not already)
- [ ] Add or update: `AI_ENABLED=true`

**Command:**
```bash
# If .env doesn't exist
cp .env.example .env

# Edit .env and add:
AI_ENABLED=true
```

### 6. Test AI Classifier

- [ ] Run tests: `npm test -- ai-classifier.test.js`
- [ ] All tests should pass

**Command:**
```bash
npm test -- ai-classifier.test.js
```

**Expected:** ~50 tests pass (some may be skipped if Ollama not running)

### 7. Run Full Update with AI

- [ ] Run: `npm run update`
- [ ] Watch for AI classification logs
- [ ] Check statistics at end

**Command:**
```bash
npm run update
```

**Look for:**
```
🤖 AI classification enabled
📊 150 movies will use AI classification
✓ AI: "Interstellar" → SCIFI (95%)
✓ AI: "The Matrix" → SCIFI (98%)
📊 AI Stats: 140 classified, 10 fallbacks, 1850 rule-based
```

---

## Verification Checklist

After running update, verify:

- [ ] No errors in logs
- [ ] AI statistics shown (classified, fallbacks, rule-based)
- [ ] Success rate > 80%
- [ ] Fallback rate < 20%
- [ ] Update completed successfully

**Good statistics example:**
```
📊 AI Stats: 148 classified, 12 fallbacks, 2040 rule-based
Success rate: 92.5%
Fallback rate: 7.5%
```

---

## Troubleshooting

### ❌ "AI server not running"

**Problem:** Ollama server isn't started

**Solution:**
```bash
ollama serve
```

### ❌ "Model not found"

**Problem:** Model not downloaded

**Solution:**
```bash
ollama pull qwen2.5:7b-instruct
```

### ❌ "Cannot find module 'axios'"

**Problem:** Dependencies not installed

**Solution:**
```bash
npm install
```

### ❌ High fallback rate (>30%)

**Problem:** Confidence threshold might be too high

**Solution:**
Lower threshold in `.env`:
```bash
AI_CONFIDENCE_THRESHOLD=0.65
```

### ❌ Slow performance (>5 minutes for AI)

**Problem:** CPU-only processing

**Solutions:**
1. Check GPU usage: `nvidia-smi` (NVIDIA) or `rocm-smi` (AMD)
2. Reduce concurrency in `scripts/nightly-update.js`
3. Use smaller delay between requests

---

## Configuration Options

### Minimal (Recommended for first test)

```bash
AI_ENABLED=true
```

### Balanced (Recommended for production)

```bash
AI_ENABLED=true
AI_CONFIDENCE_THRESHOLD=0.7
```

### Strict (Higher accuracy, more fallbacks)

```bash
AI_ENABLED=true
AI_CONFIDENCE_THRESHOLD=0.85
```

### Loose (Fewer fallbacks, possibly lower accuracy)

```bash
AI_ENABLED=true
AI_CONFIDENCE_THRESHOLD=0.6
```

---

## Next Steps After Successful Test

### 1. Monitor Performance

Run several updates and check:
- Average success rate
- Average fallback rate
- Time taken for AI classification
- Overall accuracy

### 2. Fine-Tune Settings

Adjust based on results:
- If fallback rate > 20%: Lower `AI_CONFIDENCE_THRESHOLD`
- If success rate < 80%: Check model is correct, review logs
- If too slow: Optimize batch processing settings

### 3. Compare with Rule-Based

Run update with AI disabled to compare:
```bash
AI_ENABLED=false npm run update > without-ai.log
AI_ENABLED=true npm run update > with-ai.log
diff without-ai.log with-ai.log
```

### 4. Deploy to Production

Once satisfied with local testing:
- Keep AI disabled in production for now (optional)
- Or enable AI for GitHub Actions updates
- Monitor logs and statistics

---

## Documentation

- **Complete guide:** [docs/AI-USAGE-GUIDE.md](docs/AI-USAGE-GUIDE.md)
- **Progress log:** [PROGRESS-LOG.md](PROGRESS-LOG.md)
- **Implementation summary:** [AI-IMPLEMENTATION-SUMMARY.md](AI-IMPLEMENTATION-SUMMARY.md)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Quick Reference

| Action | Command |
|--------|---------|
| Install Ollama | Visit https://ollama.ai/ |
| Download model | `ollama pull qwen2.5:7b-instruct` |
| Start server | `ollama serve` |
| Check server | `curl http://127.0.0.1:11434/api/tags` |
| Install deps | `npm install` |
| Run tests | `npm test -- ai-classifier.test.js` |
| Run update | `npm run update` |
| Enable AI | Add `AI_ENABLED=true` to `.env` |

---

## Support

If you get stuck:

1. Check troubleshooting section above
2. Review [docs/AI-USAGE-GUIDE.md](docs/AI-USAGE-GUIDE.md)
3. Verify Ollama is running: `ollama list`
4. Check logs for specific errors
5. Try disabling AI temporarily: `AI_ENABLED=false`

---

**Status:** All steps completed? You're ready to use AI classification! 🎉

**Estimated setup time:** 15-30 minutes (mostly download time)
**Estimated test time:** 5-10 minutes (first update)
**Expected result:** Improved genre classification accuracy

Good luck! 🚀
