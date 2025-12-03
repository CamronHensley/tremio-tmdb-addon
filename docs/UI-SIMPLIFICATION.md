# UI Simplification - Genre Chooser Disabled

## What Changed

The genre selection UI has been temporarily **disabled** to prepare for AI-based genre classification. The addon now always uses all 22 genres without user selection.

## Changes Made

### 1. [public/index.html](public/index.html)

#### Hidden UI Elements (Lines 440-455)
- **Quick Presets section**: Hidden with `display: none`
- **Genre Selection grid**: Hidden with `display: none`

#### Added AI Notice (Lines 457-467)
- New section announcing AI-powered classification
- Gold-styled box explaining current state
- Mentions Qwen2.5-7B integration coming soon

#### Updated Stats (Lines 485-490)
- Genre count: 19 → **22**
- Movie count: 570 → **2,200**

#### JavaScript Changes (Lines 514-564)
- **Added `ALL_BACKEND_GENRES`**: Complete list of 22 backend genres including special categories:
  - `ACTION_CLASSIC`
  - `ANIMATION_KIDS`
  - `ANIMATION_ADULT`
  - `SUPERHEROES`

- **Locked selection**: `selectedGenres` always initialized with all 22 genres
  ```javascript
  let selectedGenres = new Set(ALL_BACKEND_GENRES);
  ```

- **Simplified `updateUrl()`**: Always generates `/manifest.json` (no config parameter)
  ```javascript
  const manifestPath = '/manifest.json';  // Always all genres
  ```

## User Experience

### Before
1. User visits configuration page
2. Sees 19 genres with selection checkboxes
3. Can customize which genres to include
4. Install URL changes based on selection

### After
1. User visits configuration page
2. Sees **AI notice** about upcoming improvements
3. **No genre selection** available
4. Install URL is always `/manifest.json` (all 22 genres)

## Backend Behavior

### Unchanged
- Backend still supports genre filtering via URL config
- `/manifest.json` → All genres (default)
- `/ACTION.COMEDY.HORROR/manifest.json` → Selected genres

### Current State
- UI always generates `/manifest.json`
- Users get all 22 genres automatically
- No way to customize via UI (can still do it manually in URL)

## Why This Change?

### Short-term Benefits
1. **Simplifies UX**: No confusion about which genres to pick
2. **Showcases full catalog**: Users see all 2,200 movies
3. **Prepares for AI**: UI no longer tied to manual selection

### Long-term Vision
Once AI classification is integrated:
1. **No manual genre selection needed**: AI handles categorization
2. **Better accuracy**: Context-aware classification
3. **More flexible**: Easy to add new genres
4. **User customization**: Could add filters like "Show only movies rated 7+"

## Reverting This Change

If you want to re-enable genre selection:

### Quick Revert
Remove `display: none` from both sections in [public/index.html](public/index.html):

```html
<!-- Line 440: Change this -->
<section style="display: none;">
<!-- To this -->
<section>

<!-- Line 452: Change this -->
<section style="display: none;">
<!-- To this -->
<section>
```

### Full Revert
```bash
# Check what changed
git diff public/index.html

# Revert the file
git checkout HEAD -- public/index.html

# Or revert to specific commit
git checkout <commit-before-changes> -- public/index.html
```

## Next Steps

### For AI Integration
See [AI-INTEGRATION-PLAN.md](AI-INTEGRATION-PLAN.md) for detailed implementation guide.

**Quick summary**:
1. Set up local AI server (Ollama recommended)
2. Create `lib/ai-classifier.js` module
3. Integrate with deduplication system
4. Test with sample movies
5. Deploy to production

### For UI Improvements
Once AI is working, consider:
1. Show genre confidence scores
2. Add "Movies you might like" based on viewing history
3. Allow users to flag misclassified movies
4. Display AI reasoning for classifications (transparency)

## Technical Notes

### URL Generation
```javascript
// Before (customizable)
const config = codes.join('.');  // e.g., "ACTION.COMEDY.HORROR"
const manifestPath = '/' + config + '/manifest.json';

// After (locked)
const manifestPath = '/manifest.json';  // Always all genres
```

### Genre Count Mismatch
- **UI GENRES array**: 19 items (for display only, now hidden)
- **Backend ALL_BACKEND_GENRES**: 22 items (actual data)
- **Fixed stats**: Display shows 22 genres, 2,200 movies

### Backward Compatibility
- Old install URLs still work: `/ACTION.COMEDY/manifest.json`
- New installs use: `/manifest.json` (all genres)
- Backend handles both formats

## Files Modified

| File | Lines Changed | Description |
|------|---------------|-------------|
| [public/index.html](public/index.html) | 440-467, 485-490, 514-622 | Hide genre UI, add AI notice, lock to all genres |

## Files to Create (Next Phase)

| File | Purpose |
|------|---------|
| `lib/ai-classifier.js` | AI classification module |
| `lib/__tests__/ai-classifier.test.js` | Unit tests for AI classifier |
| `.env.example` | Add AI_ENABLED, AI_ENDPOINT variables |

## Related Documents

- [AI-INTEGRATION-PLAN.md](AI-INTEGRATION-PLAN.md) - Detailed AI integration guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture documentation
- [README.md](README.md) - Updated with current state

---

**Status**: ✅ Complete - Genre chooser disabled, UI shows all 22 genres

**Next**: Set up local AI server and begin classification POC
