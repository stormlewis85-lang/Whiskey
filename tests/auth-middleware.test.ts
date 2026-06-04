/**
 * Regression tests for FW-V34-002: session-destroy/Bearer-fallback race fix
 * in isAuthenticated middleware.
 *
 * These are hermetic unit tests — no dev server, no database, fully mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock side-effect modules BEFORE importing auth.ts so they never touch the
// real DB or session store.
// ---------------------------------------------------------------------------

vi.mock('../server/db', () => ({
  db: {},
  pool: { query: vi.fn(), end: vi.fn() },
}));

vi.mock('../server/storage', () => ({
  storage: {
    getUser: vi.fn(),
    getUserByToken: vi.fn(),
  },
}));

// Prevent express-session / connect-pg-simple from needing a real store.
vi.mock('connect-pg-simple', () => ({
  default: () => class MockStore {},
}));

// @shared/schema is a path alias — stub all named exports used by auth.ts
vi.mock('@shared/schema', () => {
  const { z } = require('zod');
  return {
    loginUserSchema: z.object({ username: z.string(), password: z.string() }),
    insertUserSchema: z.object({ username: z.string(), password: z.string(), email: z.string() }),
    updateUserSchema: z.object({}).passthrough(),
    registerUserSchema: z.object({ username: z.string(), password: z.string(), email: z.string() }),
    changePasswordSchema: z.object({ currentPassword: z.string(), newPassword: z.string() }),
    users: {},
  };
});

// ---------------------------------------------------------------------------
// Import the module under test AFTER mocks are registered.
// ---------------------------------------------------------------------------
import { isAuthenticated } from '../server/auth';
import { storage } from '../server/storage';

// ---------------------------------------------------------------------------
// Helper: build a minimal fake res with chainable status().json()
// ---------------------------------------------------------------------------
function makeRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res); // .status(x).json(y) chaining
  return res;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('isAuthenticated — FW-V34-002 regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // TC-1: Stale session + valid Bearer token
  //   Proves regenerate is awaited BEFORE req.session.userId is written.
  // -------------------------------------------------------------------------
  it('TC-1: stale session + valid Bearer token — regenerate awaited before userId write', async () => {
    const events: string[] = [];

    // Stale session: userId set but getUser returns undefined
    vi.mocked(storage.getUser).mockResolvedValue(undefined as any);

    const tokenUser = { id: 42, tokenExpiry: null } as any;
    vi.mocked(storage.getUserByToken).mockResolvedValue(tokenUser);

    // Async regenerate (~20 ms) — records start/done events.
    // Replaces req.session with a new Proxy after completion so we can detect
    // the userId write moment.
    let sessionRef: Record<string, any>;

    const fakeSession: Record<string, any> = {
      userId: 99, // stale
      regenerate: (cb: (err?: Error) => void) => {
        events.push('regenerate:start');
        setTimeout(() => {
          events.push('regenerate:done');
          // Replace session contents with a fresh object (simulating real regenerate)
          // We keep the same reference but clear userId, and wrap via Proxy to
          // capture the subsequent write.
          delete fakeSession.userId;
          fakeSession.save = (cb2: (err?: Error) => void) => cb2(undefined);
          cb(undefined);
        }, 20);
      },
      save: (cb: (err?: Error) => void) => cb(undefined),
    };

    // Proxy to intercept req.session.userId = ... writes
    const sessionProxy = new Proxy(fakeSession, {
      set(target, prop, value) {
        if (prop === 'userId') {
          events.push('userId:set');
        }
        target[prop as string] = value;
        return true;
      },
    });

    const req: any = {
      session: sessionProxy,
      headers: { authorization: 'Bearer valid-token-abc' },
    };

    const res = makeRes();
    const next = vi.fn();

    await isAuthenticated(req as any, res as any, next);

    expect(events).toEqual(['regenerate:start', 'regenerate:done', 'userId:set']);
    expect(req.session.userId).toBe(42);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // TC-2: Stale session + no auth header → 401 "No token provided"
  // -------------------------------------------------------------------------
  it('TC-2: stale session + no auth header → 401 No token provided', async () => {
    vi.mocked(storage.getUser).mockResolvedValue(undefined as any);

    const fakeSession: Record<string, any> = {
      userId: 99,
      regenerate: (cb: (err?: Error) => void) => {
        delete fakeSession.userId;
        fakeSession.save = (cb2: (err?: Error) => void) => cb2(undefined);
        cb(undefined);
      },
      save: (cb: (err?: Error) => void) => cb(undefined),
    };

    const req: any = {
      session: fakeSession,
      headers: {}, // no Authorization header
    };

    const res = makeRes();
    const next = vi.fn();

    await isAuthenticated(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('No token provided') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // TC-3: Valid session (user found) → next() called immediately; regenerate never called
  // -------------------------------------------------------------------------
  it('TC-3: valid session — next() called immediately; regenerate never called', async () => {
    const liveUser = { id: 7 } as any;
    vi.mocked(storage.getUser).mockResolvedValue(liveUser);

    const regenerate = vi.fn();
    const req: any = {
      session: { userId: 7, regenerate, save: vi.fn((cb: any) => cb(undefined)) },
      headers: {},
    };

    const res = makeRes();
    const next = vi.fn();

    await isAuthenticated(req as any, res as any, next);

    expect(next).toHaveBeenCalledOnce();
    expect(regenerate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // TC-4: Guard path — regenerate fails, req.session becomes undefined
  //   → 500 "Authentication verification failed", NOT a TypeError crash
  // -------------------------------------------------------------------------
  it('TC-4: regenerate failure nukes req.session → 500 Authentication verification failed', async () => {
    vi.mocked(storage.getUser).mockResolvedValue(undefined as any);

    const tokenUser = { id: 55, tokenExpiry: null } as any;
    vi.mocked(storage.getUserByToken).mockResolvedValue(tokenUser);

    const req: any = {
      session: {
        userId: 99,
        regenerate: (cb: (err?: Error) => void) => {
          // Simulate a catastrophic store failure: delete req.session entirely
          // and invoke callback with an error.
          delete req.session;
          cb(new Error('store down'));
        },
        save: vi.fn(),
      },
      headers: { authorization: 'Bearer some-token' },
    };

    const res = makeRes();
    const next = vi.fn();

    await isAuthenticated(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Authentication verification failed' })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
