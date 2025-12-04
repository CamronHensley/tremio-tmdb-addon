# Documentation Files Guide

**This project has many .md files. Here's what each one is for and which ones matter.**

---

## 🎯 START HERE (Next Session)

### [START-NEXT-SESSION.md](START-NEXT-SESSION.md) ⭐ **READ THIS FIRST**
- Entry point for next session
- Current status
- What to do next
- Links to all relevant docs

---

## 📋 Implementation Docs (For Next Session)

### [NEXT-SESSION-PLAN.md](NEXT-SESSION-PLAN.md) ⭐ **MAIN PLAN**
- Complete implementation plan
- Phase-by-phase instructions
- All fixes needed
- Step-by-step guide
- **Read this to know what to build**

### [CLASSIFICATION-RULES.md](CLASSIFICATION-RULES.md) ⭐ **REFERENCE**
- Quick reference while coding
- All regex patterns
- All priority tiers
- Genre detection rules
- **Use this while implementing**

### [KNOWN-ISSUES.md](KNOWN-ISSUES.md) ⭐ **TESTING**
- Specific problems list
- Exact movies in wrong places
- What needs fixing
- **Use this to verify fixes work**

### [AI-CACHE-DESIGN.md](AI-CACHE-DESIGN.md) ⭐ **CACHING**
- Smart cache design
- Implementation details
- Reduces 3h → 5min
- **Implement this to save time**

### [SESSION-SUMMARY.md](SESSION-SUMMARY.md) ⭐ **CONTEXT**
- What happened in last session
- What's been done
- Current state
- **Read for full context**

---

## 📚 AI Implementation Docs (Historical)

### [AI-IMPLEMENTATION-SUMMARY.md](AI-IMPLEMENTATION-SUMMARY.md)
- Summary of AI implementation
- What was built
- How it works
- **Context only - already implemented**

### [AI-SETUP-CHECKLIST.md](AI-SETUP-CHECKLIST.md)
- Setup guide for AI
- Installation steps
- **Already done - reference only**

### [AI-TEST-RESULTS.md](AI-TEST-RESULTS.md)
- Test results from AI run
- Sample classifications
- Performance metrics
- **Historical data**

### [docs/AI-TESTING-NOTES.md](docs/AI-TESTING-NOTES.md)
- Detailed testing notes
- Timeline of test
- **Historical data**

### [TEST-COMPLETE.md](TEST-COMPLETE.md)
- Complete test summary
- Final results
- **Historical data**

### [docs/AI-USAGE-GUIDE.md](docs/AI-USAGE-GUIDE.md)
- How to use AI classification
- Comprehensive guide
- **Reference if needed**

### [docs/AI-INTEGRATION-PLAN.md](docs/AI-INTEGRATION-PLAN.md)
- Original integration plan
- **Outdated - superseded by NEXT-SESSION-PLAN.md**

### [PROGRESS-LOG.md](PROGRESS-LOG.md)
- Progress during implementation
- **Historical log**

### [INSTALLATION-NOTES.md](INSTALLATION-NOTES.md)
- Dependency notes
- **Reference only**

---

## 📖 Project Documentation (General)

### [README.md](README.md)
- Main project README
- How to use the addon
- Setup instructions
- **User-facing documentation**

### [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- System architecture
- How everything works
- **Technical reference**

### [docs/CHANGES.md](docs/CHANGES.md)
- Changelog
- **Historical record**

### [docs/DOCUMENTATION-UPDATES.md](docs/DOCUMENTATION-UPDATES.md)
- Documentation update log
- **Meta documentation**

---

## 🗑️ Old/Outdated Files (Can Ignore)

### [START-HERE.md](START-HERE.md)
- **OUTDATED** - From initial AI implementation
- **Replaced by START-NEXT-SESSION.md**
- ⚠️ Don't use this

### [PROJECT-MAP.md](PROJECT-MAP.md)
- Old project map
- **May be outdated**

### [ANALYSIS-GUIDE.md](ANALYSIS-GUIDE.md)
- Old analysis guide
- **May be outdated**

### [REORGANIZATION-SUMMARY.md](REORGANIZATION-SUMMARY.md)
- Summary of past reorganization
- **Historical**

### [VERIFICATION-REPORT.md](VERIFICATION-REPORT.md)
- Old verification report
- **Historical**

### [docs/REVERT-GUIDE.md](docs/REVERT-GUIDE.md)
- How to revert changes
- **Shouldn't need this**

### [docs/UI-SIMPLIFICATION.md](docs/UI-SIMPLIFICATION.md)
- Old UI changes
- **Historical**

---

## 🎯 Decision Tree: Which File Do I Need?

### "I'm starting a new session"
→ Read [START-NEXT-SESSION.md](START-NEXT-SESSION.md)

### "I want to implement the fixes"
→ Read [NEXT-SESSION-PLAN.md](NEXT-SESSION-PLAN.md)

### "I need genre classification rules while coding"
→ Use [CLASSIFICATION-RULES.md](CLASSIFICATION-RULES.md)

### "I want to verify my fixes worked"
→ Use [KNOWN-ISSUES.md](KNOWN-ISSUES.md)

### "I want to implement caching"
→ Read [AI-CACHE-DESIGN.md](AI-CACHE-DESIGN.md)

### "I want full context on what happened"
→ Read [SESSION-SUMMARY.md](SESSION-SUMMARY.md)

### "I want to understand the AI system"
→ Read [AI-IMPLEMENTATION-SUMMARY.md](AI-IMPLEMENTATION-SUMMARY.md)

### "I want to understand the project structure"
→ Read [README.md](README.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

### "I want to see test results"
→ Read [TEST-COMPLETE.md](TEST-COMPLETE.md)

---

## 📊 File Priority (For Next Session)

### Must Read (Priority 1):
1. [START-NEXT-SESSION.md](START-NEXT-SESSION.md) - Start here
2. [NEXT-SESSION-PLAN.md](NEXT-SESSION-PLAN.md) - Implementation plan
3. [CLASSIFICATION-RULES.md](CLASSIFICATION-RULES.md) - Quick reference

### Should Read (Priority 2):
4. [KNOWN-ISSUES.md](KNOWN-ISSUES.md) - Testing checklist
5. [SESSION-SUMMARY.md](SESSION-SUMMARY.md) - Full context
6. [AI-CACHE-DESIGN.md](AI-CACHE-DESIGN.md) - Caching system

### Optional (Priority 3):
7. [AI-IMPLEMENTATION-SUMMARY.md](AI-IMPLEMENTATION-SUMMARY.md) - AI details
8. [TEST-COMPLETE.md](TEST-COMPLETE.md) - Test results
9. [README.md](README.md) - Project overview

### Can Skip:
- Everything else (historical/outdated)

---

## 🗂️ File Organization

```
Root Files (26 total):
├── START-NEXT-SESSION.md ⭐ (Read this first!)
├── NEXT-SESSION-PLAN.md ⭐ (Implementation plan)
├── CLASSIFICATION-RULES.md ⭐ (Quick reference)
├── KNOWN-ISSUES.md ⭐ (Testing)
├── AI-CACHE-DESIGN.md ⭐ (Caching)
├── SESSION-SUMMARY.md ⭐ (Context)
│
├── AI-IMPLEMENTATION-SUMMARY.md (Historical)
├── AI-SETUP-CHECKLIST.md (Historical)
├── AI-TEST-RESULTS.md (Historical)
├── TEST-COMPLETE.md (Historical)
├── PROGRESS-LOG.md (Historical)
├── INSTALLATION-NOTES.md (Reference)
│
├── README.md (User docs)
├── README-FILES-GUIDE.md (This file)
│
└── [Outdated files...]

Docs Folder (docs/):
├── AI-TESTING-NOTES.md (Historical)
├── AI-USAGE-GUIDE.md (Reference)
├── AI-INTEGRATION-PLAN.md (Outdated)
├── ARCHITECTURE.md (Technical reference)
├── CHANGES.md (Changelog)
├── DOCUMENTATION-UPDATES.md (Meta)
├── REVERT-GUIDE.md (Shouldn't need)
└── UI-SIMPLIFICATION.md (Historical)
```

---

## 📝 Summary

**Total .md files:** 26
**Important for next session:** 6
**Historical/reference:** 12
**Outdated/ignore:** 8

**Next session workflow:**
1. Read START-NEXT-SESSION.md (2 min)
2. Read NEXT-SESSION-PLAN.md (10 min)
3. Start coding with CLASSIFICATION-RULES.md open
4. Verify with KNOWN-ISSUES.md when done

**That's it! Only 4 files needed.**

---

## 🧹 Cleanup Recommendations

### Files That Could Be Deleted:
- START-HERE.md (replaced by START-NEXT-SESSION.md)
- ANALYSIS-GUIDE.md (outdated)
- PROJECT-MAP.md (outdated)
- REORGANIZATION-SUMMARY.md (historical)
- VERIFICATION-REPORT.md (historical)
- docs/AI-INTEGRATION-PLAN.md (superseded)

### Files to Keep:
- All 6 "next session" files (current work)
- All historical AI files (for reference)
- README.md, docs/ARCHITECTURE.md (essential)

**But:** Don't delete anything yet - keep for reference during implementation.

---

**Created:** 2025-12-03
**Purpose:** Help navigate documentation maze
**TL;DR:** Read START-NEXT-SESSION.md first, then NEXT-SESSION-PLAN.md
