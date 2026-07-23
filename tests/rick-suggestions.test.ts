/**
 * Regression tests for RICK-UX-06: 30-day "recently tasted" exclusion in
 * generateSuggestions (client/src/lib/rick-suggestions.ts).
 *
 * These are hermetic unit tests — no dev server, no database, pinned clock.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Whiskey } from '@shared/schema';
import { generateSuggestions } from '../client/src/lib/rick-suggestions';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Local mirror of the (unexported) SessionInfo shape from rick-suggestions.ts.
type Session = {
  whiskeyId: number;
  completedAt: string | null;
  startedAt: string;
};

const NOW = new Date('2026-07-22T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO string N ms before NOW. */
function msAgo(ms: number): string {
  return new Date(NOW.getTime() - ms).toISOString();
}

/**
 * Full Whiskey fixture factory. Only id/name plus fields relevant to a given
 * test are meaningfully varied; every other column gets a neutral default so
 * the object satisfies the real Whiskey (`typeof whiskeys.$inferSelect`) type
 * with no cast needed.
 */
function makeWhiskey(overrides: Partial<Whiskey> & { id: number }): Whiskey {
  return {
    id: overrides.id,
    name: `Whiskey ${overrides.id}`,
    distillery: null,
    type: null,
    age: null,
    price: null,
    abv: null,
    proof: null,
    region: null,
    rating: 0,
    dateAdded: null,
    lastReviewed: null,
    releaseDate: null,
    msrp: null,
    pricePaid: null,
    image: null,
    notes: [],
    bottleType: null,
    mashBill: null,
    caskStrength: null,
    finished: null,
    finishType: null,
    isWishlist: false,
    status: 'open',
    quantity: 1,
    purchaseDate: null,
    purchaseLocation: null,
    isPublic: false,
    barcode: null,
    upc: null,
    distilleryId: null,
    userId: null,
    ...overrides,
  };
}

/** A whiskey shaped to be eligible ONLY for the priority-4 re-taste branch:
 * reviewed (non-empty notes, so it doesn't fall into "unreviewed"), high
 * rating, and last reviewed well past the re-taste branch's own 60-day gate.
 * With only one bottle in `owned`, head-to-head (needs a pair) and
 * blind-spot (needs 3+ reviewed bottles) never fire. */
function makeRetasteCandidate(id: number): Whiskey {
  return makeWhiskey({
    id,
    notes: [{ id: 'n1', text: 'Great pour', rating: 4.5 }],
    rating: 4.5,
    lastReviewed: new Date(NOW.getTime() - 70 * DAY_MS),
  });
}

function whiskeyIds(result: ReturnType<typeof generateSuggestions>): number[] {
  return result.flatMap((s) => [s.whiskey.id, s.secondWhiskey?.id].filter((id): id is number => id !== undefined));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateSuggestions — RICK-UX-06 30-day recently-tasted exclusion', () => {
  beforeEach(() => {
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. session completedAt = now excludes that whiskey from every branch of the output', () => {
    const whiskey = makeRetasteCandidate(1);
    const sessions: Session[] = [{ whiskeyId: 1, completedAt: NOW.toISOString(), startedAt: NOW.toISOString() }];

    const result = generateSuggestions([whiskey], sessions);

    expect(result).toEqual([]);
    expect(whiskeyIds(result)).not.toContain(1);
  });

  it('2. session completedAt = 31 days ago → re-taste suggestion for that whiskey is present (pre-fix behavior)', () => {
    const whiskey = makeRetasteCandidate(2);
    const sessions: Session[] = [{ whiskeyId: 2, completedAt: msAgo(31 * DAY_MS), startedAt: msAgo(31 * DAY_MS) }];

    const result = generateSuggestions([whiskey], sessions);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: 're-taste', whiskey: { id: 2 } });
  });

  it('3. sessions = [] → re-taste suggestion present for an eligible whiskey (regression guard)', () => {
    const whiskey = makeRetasteCandidate(3);

    const result = generateSuggestions([whiskey], []);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: 're-taste', whiskey: { id: 3 } });
  });

  it('4a. Boundary: completedAt = 29 days ago → excluded (within the 30-day window)', () => {
    const whiskey = makeRetasteCandidate(4);
    const sessions: Session[] = [{ whiskeyId: 4, completedAt: msAgo(29 * DAY_MS), startedAt: msAgo(29 * DAY_MS) }];

    const result = generateSuggestions([whiskey], sessions);

    expect(result).toEqual([]);
  });

  it('4b. Boundary: completedAt = exactly 30 days ago → eligible (implementation uses strict "<", so now-completedAt === window is NOT recently-tasted)', () => {
    const whiskey = makeRetasteCandidate(5);
    const sessions: Session[] = [{ whiskeyId: 5, completedAt: msAgo(30 * DAY_MS), startedAt: msAgo(30 * DAY_MS) }];

    const result = generateSuggestions([whiskey], sessions);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: 're-taste', whiskey: { id: 5 } });
  });

  it('5. Fallback ordering: recently-tasted whiskey is head-to-head\'s only pairing candidate → other eligible whiskeys still surface in a later branch', () => {
    // A and B share a distillery, so absent the exclusion they would pair up
    // as a head-to-head suggestion. A is recently tasted and must be dropped
    // from `owned` entirely, leaving B alone (no pair possible) to fall
    // through to the unreviewed branch instead.
    const whiskeyA = makeWhiskey({ id: 10, distillery: 'Buffalo Trace', age: 8 });
    const whiskeyB = makeWhiskey({ id: 11, distillery: 'Buffalo Trace', age: 12, notes: [] });
    const sessions: Session[] = [{ whiskeyId: 10, completedAt: NOW.toISOString(), startedAt: NOW.toISOString() }];

    const result = generateSuggestions([whiskeyA, whiskeyB], sessions);

    expect(result.length).toBeGreaterThan(0);
    expect(whiskeyIds(result)).not.toContain(10);
    expect(whiskeyIds(result)).toContain(11);
    expect(result.some((s) => s.type === 'head-to-head')).toBe(false);
  });

  it('6. Session without completedAt (in-progress) does NOT exclude its whiskey', () => {
    const whiskey = makeWhiskey({ id: 20, notes: [] });
    const sessions: Session[] = [{ whiskeyId: 20, completedAt: null, startedAt: NOW.toISOString() }];

    const result = generateSuggestions([whiskey], sessions);

    expect(result).toHaveLength(1);
    expect(whiskeyIds(result)).toContain(20);
  });
});
