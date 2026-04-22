# Ship It

Pre-deploy checklist for MyWhiskeyPedia.

## Workflow

1. Read `CLAUDE.md` and `CONTEXT_PROJECT.md`.
2. Verify clean working tree: `git status` shows nothing unexpected.
3. Run the type-check. TypeScript strict mode must pass.
4. Run the lint. Fail if broken.
5. Run the test suite. All API endpoint tests must pass per the testing requirement.
6. **Scoring gate:** if any file related to review scoring was touched, run `/scoring-check` before proceeding. A behavior change is a hard stop.
7. **Auth gate:** if any file related to auth, session, JWT, or OAuth was touched, re-read `specs/API.md` auth section and confirm:
   - JWT still stored in httpOnly cookie
   - Session persistence works for the known delete-op session bug pattern
   - Google OAuth flow unchanged unless explicitly scoped
8. **Database gate:** if the diff touches `schema.ts` or `migrations/`, verify:
   - Migration file created (not direct schema edit)
   - Migration runs cleanly against a fresh DB
   - Down-migration or rollback path exists
9. Inspect the last 10 commits since previous deploy for anything risky.
10. Produce Done / Open / Watch.

## Rollback criteria

Roll back immediately if post-deploy:
- Login / OAuth broken
- Review submission or scoring output differs from expected
- Delete operations fail with session errors (known historical failure mode)
- Error rate >2x baseline sustained for 5 minutes

## Golden rules referenced

- Rule 1: plan before building — deploys are building, too
- Rule 3: check existing docs first — specs, not guesses

## Tier

Standard. Deep for deploys including migrations, auth, or scoring changes.
