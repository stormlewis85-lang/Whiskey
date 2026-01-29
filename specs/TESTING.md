# WhiskeyPedia Test Plan

## Overview

This document defines all tests required before WhiskeyPedia can be considered distribution-ready. Tests are organized by feature area and priority.

**Test Philosophy:** Each test should be independently verifiable. Pass/fail should be unambiguous.

---

## Priority Levels

| Priority | Meaning | Criteria |
|----------|---------|----------|
| P0 | Critical | App is broken without this |
| P1 | High | Core feature, must work |
| P2 | Medium | Important but not blocking |
| P3 | Low | Nice to have |

---

## Test Execution

### Running Tests

```bash
# API tests
cd server && npm test

# Frontend tests
cd client && npm test

# E2E tests (if configured)
npm run test:e2e

# Manual verification
Follow the manual test checklist below
```

### Test Reporting

After each test run, update the status:
- ✅ PASS - Works as expected
- ❌ FAIL - Broken, needs fix
- ⚠️ PARTIAL - Works but has issues
- ⏭️ SKIP - Not applicable / not implemented

---

## Section 1: Authentication (P0)

### 1.1 Registration
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| AUTH-001 | Register new user | POST /auth/register with valid data | 201, user created, no password in response | |
| AUTH-002 | Duplicate email rejected | Register with existing email | 409 Conflict | |
| AUTH-003 | Invalid email rejected | Register with "notanemail" | 400 Validation error | |
| AUTH-004 | Weak password rejected | Register with "123" | 400 Validation error | |
| AUTH-005 | Missing fields rejected | Register without username | 400 Validation error | |

### 1.2 Login
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| AUTH-010 | Valid login | POST /auth/login with correct creds | 200, JWT cookie set | |
| AUTH-011 | Invalid password | Login with wrong password | 401 Unauthorized | |
| AUTH-012 | Unknown email | Login with non-existent email | 401 Unauthorized | |
| AUTH-013 | Cookie is httpOnly | Check Set-Cookie header | httpOnly flag present | |

### 1.3 Session
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| AUTH-020 | Get current user | GET /auth/me with valid cookie | 200, user data | |
| AUTH-021 | Reject without cookie | GET /auth/me without cookie | 401 Unauthorized | |
| AUTH-022 | Reject expired token | Use expired JWT | 401 Unauthorized | |
| AUTH-023 | Logout clears cookie | POST /auth/logout | Cookie cleared | |

---

## Section 2: Whiskey CRUD (P0)

### 2.1 Create
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| WHI-001 | Add whiskey | POST /whiskeys with valid data | 201, whiskey created | |
| WHI-002 | Add with distillery_id | Include existing distillery_id | Links to distillery | |
| WHI-003 | Add to wishlist | POST with is_wishlist: true | Creates wishlist item | |
| WHI-004 | Required fields | POST without name | 400 Validation error | |
| WHI-005 | Unauthenticated rejected | POST without cookie | 401 Unauthorized | |

### 2.2 Read
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| WHI-010 | Get collection | GET /whiskeys | Returns user's whiskeys only | |
| WHI-011 | Get single | GET /whiskeys/:id | Returns full whiskey + distillery | |
| WHI-012 | Can't read others' | GET /whiskeys/:otherId | 403 Forbidden | |
| WHI-013 | Pagination works | GET /whiskeys?page=2&limit=5 | Correct page returned | |
| WHI-014 | Filter by status | GET /whiskeys?status=open | Only open bottles | |
| WHI-015 | Filter wishlist | GET /whiskeys?wishlist=true | Only wishlist items | |
| WHI-016 | Search works | GET /whiskeys?search=eagle | Matches name/distillery | |

### 2.3 Update
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| WHI-020 | Update whiskey | PUT /whiskeys/:id | 200, updated data | |
| WHI-021 | Partial update | PUT with only status | Other fields unchanged | |
| WHI-022 | Change status | Update status to "open" | Status changes, opened_date optional | |
| WHI-023 | Can't update others' | PUT /whiskeys/:otherId | 403 Forbidden | |

### 2.4 Delete ⚠️ KNOWN ISSUE
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| WHI-030 | Delete whiskey | DELETE /whiskeys/:id | 200, whiskey removed | |
| WHI-031 | Can't delete others' | DELETE /whiskeys/:otherId | 403 Forbidden | |
| WHI-032 | Cascade deletes review | Delete whiskey with review | Review also deleted | |
| WHI-033 | Session token valid | DELETE with fresh login | Should work (VERIFY THIS) | |

---

## Section 3: Reviews (P0)

### 3.1 Create
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| REV-001 | Create review | POST /reviews with all scores | 201, calculated scores | |
| REV-002 | Scores calculated | Check weighted_score | Matches algorithm | |
| REV-003 | Star rating | Check star_rating | Correct half-star | |
| REV-004 | Point rating | Check point_rating | Correct 50-100 | |
| REV-005 | Duplicate rejected | POST second review same whiskey | 409 Conflict | |
| REV-006 | Invalid scores | POST with score > 10 | 400 Validation error | |

### 3.2 Read
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| REV-010 | Get review | GET /reviews/:whiskey_id | Returns review | |
| REV-011 | 404 if none | GET review for unreviewed | 404 Not Found | |
| REV-012 | Included in whiskey | GET /whiskeys/:id | Review nested in response | |

### 3.3 Update ⚠️ POTENTIAL ISSUE
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| REV-020 | Update review | PUT /reviews/:id | 200, scores recalculated | |
| REV-021 | Partial update | PUT with only taste_score | Only that score changes | |
| REV-022 | Recalculation | Update one score | All derived scores update | |

### 3.4 Delete
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| REV-030 | Delete review | DELETE /reviews/:id | 200, review removed | |
| REV-031 | Can't delete others' | DELETE /reviews/:otherId | 403 Forbidden | |

---

## Section 4: Distilleries (P1)

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| DIS-001 | List distilleries | GET /distilleries | Returns seeded list | |
| DIS-002 | Search filter | GET /distilleries?search=buffalo | Filtered results | |
| DIS-003 | Country filter | GET /distilleries?country=USA | US distilleries only | |
| DIS-004 | Create new | POST /distilleries | 201, distillery added | |
| DIS-005 | Autocomplete UI | Type in distillery field | Shows suggestions | |

---

## Section 5: AI Tasting Notes (P1)

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| AI-001 | API key configured | Check ANTHROPIC_API_KEY exists | Env var present | |
| AI-002 | Suggest mode | POST /ai/tasting-notes mode=suggest | Returns suggestions | |
| AI-003 | Expand mode | POST mode=expand with user notes | Expanded notes | |
| AI-004 | Flavor tags | Check response | flavor_tags array present | |
| AI-005 | No API key error | Remove key, make request | 500 with helpful message | |
| AI-006 | Rate limiting | Make 15 rapid requests | 429 after limit | |

---

## Section 6: Tasting Flights (P2)

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| FLT-001 | Create flight | POST /flights | 201, flight created | |
| FLT-002 | Add whiskeys | POST /flights/:id/whiskeys | Whiskey added with position | |
| FLT-003 | Reorder | Update positions | Order changes | |
| FLT-004 | Remove whiskey | DELETE /flights/:id/whiskeys/:wid | Whiskey removed | |
| FLT-005 | Comparison view | GET /flights/:id | Side-by-side data | |
| FLT-006 | Delete flight | DELETE /flights/:id | Flight and links removed | |

---

## Section 7: Blind Tastings (P2)

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| BLD-001 | Create session | POST /blind-tastings | 201, session created | |
| BLD-002 | Random labels | Add 3 whiskeys | A, B, C assigned randomly | |
| BLD-003 | Hidden mode | GET before reveal | No whiskey details shown | |
| BLD-004 | Rate sample | POST rating | Rating saved | |
| BLD-005 | Reveal | POST /reveal | is_revealed = true | |
| BLD-006 | Post-reveal data | GET after reveal | Full whiskey info shown | |

---

## Section 8: Profiles (P2)

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| PRO-001 | Get profile | GET /profile | Returns user profile | |
| PRO-002 | Update bio | PUT /profile bio | Bio updated | |
| PRO-003 | Set slug | PUT /profile slug | Slug set, unique | |
| PRO-004 | Duplicate slug | Use existing slug | 409 Conflict | |
| PRO-005 | Make public | Set is_public: true | Profile accessible | |
| PRO-006 | Public page | GET /u/:slug | Shows public whiskeys | |
| PRO-007 | Private whiskeys | Mark whiskey private | Not shown on public page | |

---

## Section 9: Frontend Smoke Tests (P0)

Manual UI verification:

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| UI-001 | Load app | Navigate to / | App loads, no console errors | |
| UI-002 | Register flow | Complete registration | Redirects to dashboard | |
| UI-003 | Login flow | Log in | Redirects to dashboard | |
| UI-004 | Dashboard loads | View dashboard | Stats display correctly | |
| UI-005 | Collection view | Navigate to collection | Whiskeys listed | |
| UI-006 | Add whiskey form | Fill and submit | Whiskey appears in list | |
| UI-007 | Whiskey detail | Click a whiskey | Modal/page shows details | |
| UI-008 | Edit whiskey | Edit and save | Changes persist | |
| UI-009 | Delete whiskey | Delete a whiskey | Removed from list | |
| UI-010 | Review form | Create review | All 6 scores selectable | |
| UI-011 | Review display | View review | Scores display correctly | |
| UI-012 | Distillery autocomplete | Type distillery name | Suggestions appear | |
| UI-013 | Filter by status | Select "Open" filter | Only open bottles shown | |
| UI-014 | Search | Enter search term | Results filter | |
| UI-015 | Responsive | Resize to mobile | Layout adapts | |
| UI-016 | Logout | Click logout | Redirects to login | |

---

## Section 10: Performance & Security (P1)

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| SEC-001 | SQL injection | Try ' OR 1=1 in search | No injection | |
| SEC-002 | XSS prevention | Submit <script> in notes | Escaped in output | |
| SEC-003 | CORS configured | Check response headers | Correct origins only | |
| SEC-004 | Rate limiting | Exceed limits | 429 returned | |
| PERF-001 | Collection < 500ms | Load 50 whiskeys | Response under 500ms | |
| PERF-002 | No N+1 queries | Check DB logs | Single query for list | |

---

## Test Summary Template

After running all tests, complete this summary:

```markdown
## Test Run Summary

**Date:** YYYY-MM-DD
**Tester:** Claude Code / Manual

### Results

| Section | Total | Pass | Fail | Skip |
|---------|-------|------|------|------|
| Auth | 12 | | | |
| Whiskey CRUD | 18 | | | |
| Reviews | 14 | | | |
| Distilleries | 5 | | | |
| AI Notes | 6 | | | |
| Flights | 6 | | | |
| Blind Tastings | 6 | | | |
| Profiles | 7 | | | |
| UI Smoke | 16 | | | |
| Security/Perf | 6 | | | |
| **TOTAL** | 96 | | | |

### Blocking Issues (P0/P1 Failures)

1. [ID] - Description - Severity

### Non-Blocking Issues (P2/P3)

1. [ID] - Description

### Recommendations

- 
```

---

## Known Issues to Verify

These were flagged in previous development:

1. **WHI-030/033**: Delete authentication - session token may fail
2. **REV-020**: Review edit flow - may have issues
3. **AI-001**: API key configuration - needs ANTHROPIC_API_KEY

Focus testing efforts on these first.
