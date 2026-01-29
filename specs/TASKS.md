# WhiskeyPedia Tasks

## Task Format

Each task is atomic and independently completable. Claude Code should:
1. Read the task
2. Implement/verify
3. Run relevant tests
4. Commit with descriptive message
5. Update status below
6. Move to next task

---

## Phase 1: Verification & Bug Fixes (PRIORITY)

### 1.1 Environment Setup
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T001 | Verify dev server starts | `npm run dev` succeeds, app accessible at localhost | � |
| T002 | Verify database connection | Can query users table | � |
| T003 | Check env vars configured | All required vars present (see ARCHITECTURE.md) | � |
| T004 | Run existing tests | Note pass/fail count | � |

### 1.2 Known Bug: Delete Authentication
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T010 | Reproduce delete bug | Attempt DELETE /whiskeys/:id, document error | ✅ |
| T011 | Trace auth middleware | Log token extraction path | ✅ |
| T012 | Fix token validation | DELETE succeeds with valid session | ✅ |
| T013 | Add delete test | Automated test for WHI-030, WHI-033 | ✅ |
| T014 | Verify fix | Manual test: login → add → delete | ✅ |

### 1.3 Known Bug: Review Edit
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T020 | Test review edit flow | PUT /reviews/:id with changed score | � |
| T021 | Document any issues | Note specific failures | ⬜ |
| T022 | Fix if broken | Edit saves and recalculates | ⬜ |
| T023 | Add edit test | Automated test for REV-020, REV-021, REV-022 | ⬜ |

---

## Phase 2: API Test Coverage

### 2.1 Auth Tests
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T030 | Write AUTH-001 to AUTH-005 tests | Registration tests pass | ⬜ |
| T031 | Write AUTH-010 to AUTH-013 tests | Login tests pass | ⬜ |
| T032 | Write AUTH-020 to AUTH-023 tests | Session tests pass | ⬜ |

### 2.2 Whiskey Tests
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T040 | Write WHI-001 to WHI-005 tests | Create tests pass | ⬜ |
| T041 | Write WHI-010 to WHI-016 tests | Read tests pass | ⬜ |
| T042 | Write WHI-020 to WHI-023 tests | Update tests pass | ⬜ |
| T043 | Write WHI-030 to WHI-033 tests | Delete tests pass | ⬜ |

### 2.3 Review Tests
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T050 | Write REV-001 to REV-006 tests | Create tests pass | ⬜ |
| T051 | Write REV-010 to REV-012 tests | Read tests pass | ⬜ |
| T052 | Write REV-020 to REV-022 tests | Update tests pass | ⬜ |
| T053 | Write REV-030 to REV-031 tests | Delete tests pass | ⬜ |
| T054 | Test scoring algorithm | Unit tests for calculateAllScores | ⬜ |

### 2.4 Other Endpoint Tests
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T060 | Write DIS-001 to DIS-005 tests | Distillery tests pass | ⬜ |
| T061 | Write AI-001 to AI-006 tests | AI endpoint tests pass (mock API) | ⬜ |

---

## Phase 3: Frontend Verification

### 3.1 Core Flows
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T070 | Verify UI-001 to UI-004 | App loads, auth works | ⬜ |
| T071 | Verify UI-005 to UI-009 | CRUD operations work in UI | ⬜ |
| T072 | Verify UI-010 to UI-011 | Review system works | ⬜ |
| T073 | Verify UI-012 to UI-014 | Filters and search work | ⬜ |
| T074 | Verify UI-015 to UI-016 | Responsive + logout | ⬜ |

### 3.2 Error Handling
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T080 | Test network error | Disconnect DB, check UI message | ⬜ |
| T081 | Test validation errors | Submit invalid form, check feedback | ⬜ |
| T082 | Test 404 pages | Navigate to /nonexistent | ⬜ |
| T083 | Test unauthorized | Access protected route logged out | ⬜ |

---

## Phase 4: Polish & Hardening

### 4.1 Security
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T090 | Test SQL injection | SEC-001 passes | ⬜ |
| T091 | Test XSS | SEC-002 passes | ⬜ |
| T092 | Verify CORS | SEC-003 passes | ⬜ |
| T093 | Verify rate limiting | SEC-004 passes | ⬜ |

### 4.2 Performance
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T100 | Check N+1 queries | No N+1 in collection fetch | ⬜ |
| T101 | Add pagination | Collection endpoint paginated | ⬜ |
| T102 | Response times | PERF-001 passes | ⬜ |

### 4.3 Code Quality
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T110 | Remove console.logs | No debug logs in production code | ⬜ |
| T111 | Check TypeScript errors | `tsc --noEmit` passes | ⬜ |
| T112 | Run linter | ESLint passes or warnings only | ⬜ |
| T113 | Update dependencies | No critical vulnerabilities | ⬜ |

---

## Phase 5: Documentation & Deployment Prep

### 5.1 Documentation
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T120 | Update README | Installation + usage instructions | ⬜ |
| T121 | Document env vars | .env.example complete | ⬜ |
| T122 | API documentation | All endpoints documented | ⬜ |

### 5.2 Deployment
| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| T130 | Verify Replit config | .replit file correct | ⬜ |
| T131 | Test production build | `npm run build` succeeds | ⬜ |
| T132 | Verify production mode | NODE_ENV=production works | ⬜ |
| T133 | Check secrets | All secrets in Replit Secrets | ⬜ |

---

## Progress Summary

| Phase | Total | Complete | Remaining |
|-------|-------|----------|-----------|
| 1: Bug Fixes | 14 | 0 | 14 |
| 2: API Tests | 16 | 0 | 16 |
| 3: Frontend | 9 | 0 | 9 |
| 4: Polish | 10 | 0 | 10 |
| 5: Deploy | 7 | 0 | 7 |
| **TOTAL** | 56 | 0 | 56 |

---

## Execution Notes

### For Claude Code / Ralph

1. **Start with Phase 1** - these are blocking issues
2. **One task at a time** - complete fully before moving on
3. **Update status** - mark ✅ when done, ❌ if blocked
4. **Commit often** - each task = one commit minimum
5. **Document issues** - add notes to TESTING.md if you find problems

### Task Status Legend

- ⬜ Not started
- 🔄 In progress
- ✅ Complete
- ❌ Blocked
- ⏭️ Skipped

### When Stuck

If a task is blocked:
1. Document the blocker in this file
2. Mark as ❌
3. Move to next task
4. Return after getting guidance



















