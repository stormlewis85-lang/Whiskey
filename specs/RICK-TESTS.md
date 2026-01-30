# Rick House — Morning Test Suite

Run this after Ralph finishes building Rick.

---

## Quick Start

```powershell
cd "C:\path\to\WhiskeyPedia"

for ($i = 1; $i -le 15; $i++) {
    Write-Host "=== Rick Test: $i ===" -ForegroundColor Yellow
    claude --print "Read specs/RICK-TESTS.md. Find the first test marked ⬜. Execute it. Mark ✅ if pass, ❌ if fail with reason. Say TEST_COMPLETE."
    Start-Sleep -Seconds 3
}
Write-Host "Tests complete. Check specs/RICK-TESTS.md for results." -ForegroundColor Green
```

---

## Test Status Legend

- ⬜ Not run
- ✅ Pass
- ❌ Fail

---

## Phase 1: Environment & Config (T01-T03)

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| T01 | Verify ELEVENLABS_API_KEY in .env | Key exists and is non-empty | ⬜ |
| T02 | Verify ELEVENLABS_VOICE_ID in .env | Voice ID exists and is non-empty | ⬜ |
| T03 | Verify ANTHROPIC_API_KEY in .env | Key exists and is non-empty | ⬜ |

---

## Phase 2: Database (T04-T06)

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| T04 | Check tasting_sessions table exists | Table exists with correct columns | ⬜ |
| T05 | Check generated_scripts table exists | Table exists with correct columns | ⬜ |
| T06 | Test creating a tasting session record | Can insert and retrieve a session | ⬜ |

---

## Phase 3: API Endpoints (T07-T12)

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| T07 | GET /api/whiskeys/:id/community-notes | Returns 200 with aggregated notes object | ⬜ |
| T08 | GET /api/users/:id/palate-profile | Returns 200 with user palate data | ⬜ |
| T09 | POST /api/rick/generate-script | Returns 200 with script JSON containing visual, nose, palate, finish, ricksTake | ⬜ |
| T10 | POST /api/rick/text-to-speech | Returns 200 with audio URL or base64 | ⬜ |
| T11 | POST /api/rick/start-session | Returns 200 with session ID and script | ⬜ |
| T12 | Test rate limiting | 11th request in same day returns 429 | ⬜ |

---

## Phase 4: Frontend Components (T13-T15)

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| T13 | "Taste with Rick" button renders | Button visible on bottle detail page for owned bottles | ⬜ |
| T14 | Mode selection modal opens | Clicking button shows Guide Me / Just Notes options | ⬜ |
| T15 | Tasting session UI loads | After selecting mode, session component renders with phases | ⬜ |

---

## Manual Smoke Test (Do This Yourself)

After Ralph runs the automated tests, do this yourself in the browser:

### Happy Path Test

1. [ ] Start the app (`npm run dev` or however you run it)
2. [ ] Log in
3. [ ] Go to a bottle in your collection
4. [ ] Click "Taste with Rick"
5. [ ] Select "Guide Me"
6. [ ] Wait for script to generate (watch console for Claude API call)
7. [ ] See Rick's visual guidance appear
8. [ ] Click play on audio (watch console for ElevenLabs call)
9. [ ] Hear Rick's voice
10. [ ] Click "Next" to advance to Nose phase
11. [ ] Continue through all phases
12. [ ] See completion screen
13. [ ] Click "Write Review" and verify it links correctly

### Edge Cases

14. [ ] Test "Just Notes" mode — should be shorter, all at once
15. [ ] Test on a bottle with zero community reviews — Rick should still work
16. [ ] Test audio fallback — disable audio, verify text-only works
17. [ ] Test on mobile — full flow should work

---

## If Tests Fail

Check these logs:

```powershell
# Server logs
cat logs/server.log | Select-String "rick"

# Ralph logs
cat ralph-logs/*.log | Select-String "BLOCKED"

# Git history for what got built
git log --oneline -30
```

Common issues:

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Script generation fails | ANTHROPIC_API_KEY wrong or missing | Check .env |
| Audio fails | ELEVENLABS_API_KEY wrong or Voice ID wrong | Check .env, verify Voice ID in ElevenLabs dashboard |
| 404 on endpoints | Routes not registered | Check server/routes/index or equivalent |
| UI missing | Components not imported | Check frontend routes/pages |
| Database errors | Migrations didn't run | Run `npm run migrate` or equivalent |

---

## Success Criteria

Rick is ready when:

- [ ] All T01-T15 pass
- [ ] Manual smoke test completes
- [ ] You hear Rick's voice say something about bourbon
- [ ] You smile

🥃
