# WhiskeyPedia - Distribution Ready Push

## Tonight's Mission

Get WhiskeyPedia tested, bugs fixed, and ready for distribution using Claude Code + Ralph loop.

## Quick Start

### 1. Copy These Files

Copy this entire folder structure into your WhiskeyPedia project root:

```
whiskeypedia/
├── CLAUDE.md              ← Copy to root
├── ralph.ps1              ← Copy to root
├── specs/                 ← Copy entire folder
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── REVIEW-SYSTEM.md
│   ├── TESTING.md
│   ├── TASKS.md
│   └── PROGRESS.md
```

### 2. Initialize Git (if not already)

```powershell
cd whiskeypedia
git init
git add .
git commit -m "chore: add specs and Ralph configuration"
```

### 3. Verify Claude Code Works

```powershell
# Test that Claude Code is installed and working
claude --version

# Quick test
claude --print "Say hello"
```

### 4. Run Ralph

```powershell
# Start the loop
.\ralph.ps1

# Or with options
.\ralph.ps1 -MaxIterations 30 -PauseBetween 10

# Dry run (see what would happen)
.\ralph.ps1 -DryRun
```

### 5. Monitor Progress

- Watch the terminal for real-time output
- Check `specs/PROGRESS.md` for summary
- Check `ralph-logs/` for detailed iteration logs
- Check `specs/TASKS.md` for task status updates

## What Ralph Does

Each iteration:
1. Finds the next uncompleted task (⬜)
2. Marks it in progress (🔄)
3. Spawns fresh Claude Code context
4. Claude reads specs and executes task
5. Makes git commit
6. Updates task status (✅ or ❌)
7. Moves to next task

## Files Explained

| File | Purpose |
|------|---------|
| CLAUDE.md | Instructions Claude Code reads first |
| specs/ARCHITECTURE.md | System design reference |
| specs/DATABASE.md | Schema documentation |
| specs/API.md | All endpoints |
| specs/REVIEW-SYSTEM.md | Weighted scoring algorithm |
| specs/TESTING.md | Full test plan (96 tests) |
| specs/TASKS.md | 56 atomic tasks to complete |
| specs/PROGRESS.md | Auto-updated progress tracker |
| ralph.ps1 | The loop script |

## Priority Order

Ralph executes tasks in order. Priority:

1. **Phase 1**: Bug fixes (delete auth, review edit)
2. **Phase 2**: API test coverage
3. **Phase 3**: Frontend verification
4. **Phase 4**: Polish & security
5. **Phase 5**: Documentation & deploy prep

## If Something Goes Wrong

### Claude Code not found
```powershell
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code
```

### Task keeps failing
1. Check the iteration log in `ralph-logs/`
2. Manually investigate the issue
3. Fix it yourself or update the task description
4. Re-run Ralph

### Need to skip a task
Edit `specs/TASKS.md` and change ⬜ to ⏭️

### Want to re-run a task
Edit `specs/TASKS.md` and change ✅ or ❌ back to ⬜

## After Ralph Finishes

1. Review the git log:
   ```powershell
   git log --oneline -20
   ```

2. Run full test suite:
   ```powershell
   cd server && npm test
   ```

3. Manual smoke test:
   - Register new account
   - Add whiskey
   - Create review
   - Delete whiskey (verify fix)
   - Edit review (verify fix)

4. If all good: deploy!

## Estimated Time

- Phase 1 (bugs): ~10-15 iterations
- Phase 2 (tests): ~15-20 iterations
- Phase 3 (frontend): ~10 iterations
- Phase 4 (polish): ~10 iterations
- Phase 5 (deploy): ~5 iterations

Total: ~50 iterations, roughly 2-4 hours depending on complexity.

Good luck! 🥃

---

## Rick House - AI Tasting Guide

Rick House is an AI-powered tasting guide feature that provides personalized whiskey tasting experiences using Claude API for script generation and ElevenLabs for voice narration.

### Features

- **Guided Mode**: Full walkthrough with educational content, phase-by-phase navigation, and voice playback
- **Quick Notes Mode**: Brief flavor profiles for experienced tasters
- **Personalization**: Scripts adapt based on user's palate profile (after 5+ reviews)
- **Community Integration**: Incorporates community tasting notes
- **Caching**: Scripts and audio are cached to reduce API costs

### Environment Variables

Add to your `.env` file:

```
# Required for Rick House
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional (enables voice playback)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=voice_id_for_rick
```

### Usage

1. Open a whiskey from your collection
2. Click "Taste with Rick" button
3. Choose mode: "Guide Me" or "Just the Notes"
4. Follow along with Rick's tasting guide
5. Optionally write a review when complete

### Rate Limiting

- 10 script generations per user per day
- Audio requests share the same daily limit

### Technical Details

| Component | Technology |
|-----------|------------|
| Script Generation | Claude API (claude-sonnet-4) |
| Voice Synthesis | ElevenLabs API |
| Script Caching | 7 days or until review count changes |
| Audio Caching | Hash-based file caching |

### API Endpoints

See `specs/API.md` for full documentation of Rick House endpoints:
- POST /api/rick/generate-script
- POST /api/rick/text-to-speech
- POST /api/rick/start-session
- PATCH /api/rick/session/:id
- POST /api/rick/complete-session
- GET /api/rick/sessions
