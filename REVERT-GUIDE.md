# Emergency Revert Guide

If the hybrid caching breaks your addon, follow these steps:

## Quick Revert (Back to 100 movies, 5 pages, no hybrid cache)

```bash
cd "c:\Users\olnys\Downloads\stremio-tmdb-addon\stremio-tmdb-addon"

# Revert to last known good
git reset --hard 1027c9c

# Force push to deploy
git push --force
```

**This takes you back to**: 100 movies per genre, 5 pages fetched, no hybrid caching

## Partial Revert (Keep hybrid cache, just fix bugs)

```bash
# See what changed
git log --oneline -5

# Revert specific commit
git revert <commit-hash>
git push
```

## Safe Commits (Known Working States)

| Commit | Description | Safe? |
|--------|-------------|-------|
| `1027c9c` | 100 movies per genre, 5 pages | ✅ YES |
| `4b4f5c9` | 5 pages fetching | ✅ YES |
| `396def8` | Remove historical penalty | ✅ YES |
| `8017eae` | Genre balancing | ✅ YES |
| `1571b09` | Hybrid cache infrastructure (INACTIVE) | ✅ YES |
| `NEXT` | Hybrid cache ACTIVATED | ⚠️  TEST FIRST |

## If Addon Stops Working Completely

1. **Quick Fix**: Revert to `1027c9c`
2. **Check Netlify**: Make sure deploy succeeded
3. **Check GitHub Actions**: Make sure workflow ran
4. **Check Logs**: Netlify function logs for errors

## Contact Info

If you lose context with Claude and need help:
- Check commit messages for what changed
- Revert to `1027c9c` for safety
- Re-run the workflow manually

## Testing Before Deploy

```bash
# Test locally first
npm run update

# Check output for errors
# If successful, then deploy
git push
```
