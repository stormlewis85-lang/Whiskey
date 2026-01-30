# Rick House — Ralph Task List

## Pre-Flight Checklist

Before running Ralph, confirm:

- [ ] `.env` has `ELEVENLABS_API_KEY=your_key`
- [ ] `.env` has `ELEVENLABS_VOICE_ID=ricks_voice_id`
- [ ] `.env` has `ANTHROPIC_API_KEY=your_key` (should already exist)
- [ ] Current WhiskeyPedia debug run is complete
- [ ] All changes committed: `git add . && git commit -m "pre-rick checkpoint"`

---

## How to Run Ralph (Autonomous Mode)

### Option 1: Use Your Existing ralph.ps1

If Ralph is already configured from the debug run:

```powershell
cd "C:\path\to\WhiskeyPedia"
.\ralph.ps1 -MaxIterations 40
```

### Option 2: Simple One-Liner Loop

If you want a fresh minimal loop:

```powershell
cd "C:\path\to\WhiskeyPedia"

while ($true) {
    claude --print "Read RICK-TASKS.md. Find the first task marked ⬜. Complete it fully. Update the task to ✅ when done or ❌ if blocked. Commit your changes. Output TASK_COMPLETE or TASK_BLOCKED when finished."
    Start-Sleep -Seconds 5
}
```

### Option 3: Run Until Done (Recommended)

```powershell
cd "C:\path\to\WhiskeyPedia"

for ($i = 1; $i -le 40; $i++) {
    Write-Host "=== Iteration $i ===" -ForegroundColor Cyan
    claude --print "You are building Rick House for WhiskeyPedia. Read specs/RICK-TASKS.md. Find the first ⬜ task. Execute it completely. Mark it ✅ or ❌. Git commit. Say TASK_COMPLETE or TASK_BLOCKED."
    git add -A
    git commit -m "Ralph iteration $i" --allow-empty
    Start-Sleep -Seconds 5
}
Write-Host "Ralph complete. Check RICK-TASKS.md for status." -ForegroundColor Green
```

### The Key: `--print` Flag

The `--print` flag makes Claude Code:
- Run non-interactively (no prompts, no waiting)
- Output everything to terminal
- Exit when done

This is what lets Ralph run unattended overnight.

---

## Task Status Legend

- ⬜ Not started
- 🔄 In progress  
- ✅ Complete
- ❌ Blocked
- ⏭️ Skipped

---

## Phase 1: Database & Config (Tasks R001-R006)

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| R001 | Add ELEVENLABS_API_KEY to server config | Config reads from .env, validated on startup | ✅ |
| R002 | Add ELEVENLABS_VOICE_ID to server config | Config reads from .env, validated on startup | ✅ |
| R003 | Create tasting_sessions table | Migration creates: id, user_id, whiskey_id, mode (guided/notes), script_json, audio_url, started_at, completed_at, created_at | ✅ |
| R004 | Create generated_scripts cache table | Migration creates: id, whiskey_id, script_json, review_count_at_generation, generated_at, expires_at | ✅ |
| R005 | Add relations to existing models | TastingSession belongs to User and Whiskey, scripts cached by Whiskey | ✅ |
| R006 | Create Rick system prompt file | Create /server/prompts/rick-house.md with full character bible and script generation instructions | ✅ |

---

## Phase 2: Backend API Routes (Tasks R007-R015)

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| R007 | GET /api/whiskeys/:id/community-notes | Returns aggregated flavor tags, common notes, avg scores from all reviews of this whiskey | ✅ |
| R008 | GET /api/users/:id/palate-profile | Returns user's most-used flavor tags, scoring tendencies, review count | ✅ |
| R009 | POST /api/rick/generate-script | Accepts whiskey_id, mode, user_id. Calls Claude API with Rick prompt + whiskey data + community notes. Returns structured script JSON | ✅ |
| R010 | Implement script caching logic | Check cache before generating. Cache valid if <7 days old AND review count unchanged. Return cached if valid | ✅ |
| R011 | POST /api/rick/text-to-speech | Accepts script text, calls ElevenLabs API with Rick voice, returns audio URL or base64 | ✅ |
| R012 | POST /api/rick/start-session | Creates tasting_session record, generates script if needed, returns session with script | ✅ |
| R013 | PATCH /api/rick/session/:id | Updates session (mark phases complete, store user responses) | ✅ |
| R014 | POST /api/rick/complete-session | Marks session complete, links to review if user submits one | ✅ |
| R015 | Add rate limiting for Rick endpoints | Max 10 generations per user per day (prevent API cost runaway) | ✅ |

---

## Phase 3: Rick Script Generation (Tasks R016-R022)

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| R016 | Create script structure interface | TypeScript interface: { visual: string, nose: string, palate: string, finish: string, ricksTake: string, metadata: {...} } | ⬜ |
| R017 | Build Claude prompt template | Prompt includes: Rick character, whiskey details, community notes, user palate (if available), requested mode | ⬜ |
| R018 | Implement "Guide Me" script generation | Full walkthrough with Rick's personality, pauses for user, educational content | ⬜ |
| R019 | Implement "Just Notes" script generation | Brief flavor profile, Rick's take, no walkthrough | ⬜ |
| R020 | Add personalization layer | If user has 5+ reviews, inject their palate preferences into prompt | ⬜ |
| R021 | Handle zero-reviews edge case | If whiskey has no community reviews, Rick uses distillery profile + whiskey metadata to generate educated expectations | ⬜ |
| R022 | Add Rick's quips rotation | Store 20+ quips, randomly select 1-2 per script, ensure no repeats in recent sessions | ⬜ |

---

## Phase 4: ElevenLabs Integration (Tasks R023-R028)

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| R023 | Create ElevenLabs service module | Wrapper for API calls: generateSpeech(text, voiceId) returns audio | ⬜ |
| R024 | Implement text-to-speech for full script | Generate audio for entire script, return as single file | ⬜ |
| R025 | Implement chunked audio generation | Generate separate audio per phase (visual, nose, palate, finish, take) for better UX control | ⬜ |
| R026 | Add audio file storage | Store generated audio (local filesystem or cloud). Return accessible URL | ⬜ |
| R027 | Implement audio caching | Cache audio by script hash. Don't regenerate if script unchanged | ⬜ |
| R028 | Add ElevenLabs error handling | Graceful fallback if API fails (return text-only mode) | ⬜ |

---

## Phase 5: Frontend Components (Tasks R029-R040)

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| R029 | Add "Taste with Rick" button to bottle detail page | Button visible on whiskeys in user's collection | ⬜ |
| R030 | Create mode selection modal | User picks "Guide Me" or "Just the Notes" before session starts | ⬜ |
| R031 | Create TastingSession component shell | Container for the guided tasting experience | ⬜ |
| R032 | Build phase progress indicator | Shows: Visual → Nose → Palate → Finish → Rick's Take. Highlights current phase | ⬜ |
| R033 | Create script display component | Shows Rick's text for current phase with proper styling | ⬜ |
| R034 | Build audio player component | Play/pause, progress bar, phase skip buttons | ⬜ |
| R035 | Implement phase-by-phase playback | Audio plays for current phase, waits for user to advance | ⬜ |
| R036 | Add "I'm ready" / "Next" button | User controls pacing between phases | ⬜ |
| R037 | Create "Just Notes" view | Simpler view: all notes at once, single audio play, Rick's take | ⬜ |
| R038 | Build session complete screen | Summary, option to write review, Rick's closing thought | ⬜ |
| R039 | Connect to review flow | "Write your review" button pre-populates whiskey, links session | ⬜ |
| R040 | Add loading states | Skeleton UI while script generates, audio buffers | ⬜ |

---

## Phase 6: Mobile & Polish (Tasks R041-R048)

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| R041 | Mobile responsive tasting session | Full experience works on phone screens | ⬜ |
| R042 | Background audio handling | Audio continues if user switches apps briefly (mobile) | ⬜ |
| R043 | Add haptic feedback on phase transitions | Subtle vibration when moving to next phase (mobile) | ⬜ |
| R044 | Implement text fallback mode | If audio fails or user prefers, show text-only with manual advance | ⬜ |
| R045 | Add session history to profile | Users can see past tasting sessions | ⬜ |
| R046 | Error boundary for Rick components | Graceful error handling, retry options | ⬜ |
| R047 | Add analytics events | Track: session starts, completions, mode preference, drop-off phase | ⬜ |
| R048 | Performance optimization | Lazy load Rick components, preload audio for next phase | ⬜ |

---

## Phase 7: Testing & Documentation (Tasks R049-R055)

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| R049 | Unit tests for script generation | Test prompt building, caching logic, personalization | ⬜ |
| R050 | Unit tests for ElevenLabs service | Mock API, test error handling, test caching | ⬜ |
| R051 | Integration test: full tasting flow | Start session → generate script → play audio → complete | ⬜ |
| R052 | Test zero-reviews scenario | Verify Rick handles whiskeys with no community data | ⬜ |
| R053 | Test rate limiting | Verify user can't exceed daily generation limit | ⬜ |
| R054 | Update API documentation | Document all new Rick endpoints | ⬜ |
| R055 | Update README with Rick feature | Explain feature, required env vars, usage | ⬜ |

---

## Rick's System Prompt (For R006)

Create this file at `/server/prompts/rick-house.md`:

```markdown
# Rick House — AI Tasting Guide

## Character

You are Rick House, a retired master distiller from Kentucky. 42 years in the bourbon industry. You speak with a soft Kentucky accent—warm, unhurried, deliberate. Like molasses. Every word earns its place.

You're generous with knowledge but never pretentious. Zero gatekeeping. You respect good bourbon at any price point and call out overpriced hype without being ugly about it.

## Voice Guidelines

- Speak conversationally, like you're on a porch at dusk
- Unhurried but not slow—respect the listener's time
- Use "you" and "your" to address the taster directly
- Include 1-2 quips naturally (never forced)
- No jargon without explanation
- No performing—just talking

## Script Structure

Generate a JSON object with these fields:

{
  "visual": "What to observe when looking at the pour",
  "nose": "How to approach the aroma, what to expect",
  "palate": "The tasting experience, what flavors emerge",
  "finish": "How it ends, what lingers",
  "ricksTake": "Your honest assessment of this bourbon",
  "quip": "One of Rick's wisdom lines"
}

## Personalization

If user data is provided:
- Reference their past preferences naturally
- "Now, you tend to pick up oak early..."
- "Given what you liked about [similar bourbon]..."

## Mode: Guide Me

Full walkthrough. Tell them what to do, what to look for, pause between phases. Educational and warm.

## Mode: Just Notes

Brief. Here's what to expect, here's my take. Respect that they know what they're doing.

## Quips (Use One Per Script)

- "Don't rush it. Bourbon waited years in that barrel."
- "The glass don't know what you paid for it."
- "Your nose knows more than you think. Trust it."
- "The finish is where you find out if it meant what it said."
- "Best bottle's the one you're happy to open on a Tuesday."
- "High proof just means it's got more to say."
- "Paid thirty dollars and smiled all night? That's a win."
- "Bourbon's patient. Made to be enjoyed, not solved."
- "If you got cherry and I got leather, we're both right."
- "Good bourbon stays with you. Great bourbon makes you sit quiet a minute."
```

---

## Completion Checklist

After Ralph finishes, manually verify:

- [ ] Can start guided tasting from bottle page
- [ ] Mode selection works
- [ ] Script generates (check console for Claude API call)
- [ ] Audio plays (check console for ElevenLabs call)
- [ ] Can advance through phases
- [ ] Session completes
- [ ] Can link to review flow
- [ ] Rate limiting works (try 11 times)
- [ ] Text fallback works if audio disabled

---

## Notes for Claude Code

When executing these tasks:

1. Read existing codebase patterns first
2. Follow established naming conventions
3. Use existing UI components where possible
4. Add proper TypeScript types
5. Include error handling
6. Write tests for new logic
7. Commit after each task with message: "R0XX: [task description]"

If blocked, mark ❌ and document why in this file.
