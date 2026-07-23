/**
 * Hermetic tests for the "Ask Rick" mid-session Q&A endpoint helper
 * (server/rick-service.ts: askRick / buildAskPrompt / parseAskResponse).
 *
 * buildAskPrompt() and parseAskResponse() are module-private (not exported).
 * They are exercised indirectly through the exported askRick(), with the
 * Anthropic SDK mocked so the constructed prompt can be captured (asserting
 * buildAskPrompt's output) and the "model response" text can be controlled
 * per test (asserting parseAskResponse's behavior).
 *
 * No dev server, no database, no network — @anthropic-ai/sdk, server/db,
 * and server/storage are all mocked before rick-service.ts is imported.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock side-effect modules BEFORE importing rick-service.ts.
// ---------------------------------------------------------------------------

vi.mock('../server/db', () => ({
  db: {},
  pool: { query: vi.fn(), end: vi.fn() },
}));

vi.mock('../server/storage', () => ({
  storage: {
    getWhiskey: vi.fn(),
    getCachedScript: vi.fn(),
    getCommunityNotes: vi.fn(),
    getPalateProfile: vi.fn(),
    getRecentQuips: vi.fn(),
    saveScriptCache: vi.fn(),
  },
}));

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function MockAnthropic() {
    return { messages: { create: mockCreate } };
  }),
}));

// ---------------------------------------------------------------------------
// Import the module under test AFTER mocks are registered.
// ---------------------------------------------------------------------------
import { askRick } from '../server/rick-service';
import type { AskExchange } from '../server/rick-service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const WHISKEY = { name: 'Eagle Rare', distillery: 'Buffalo Trace', type: 'Bourbon', age: 10, abv: 45, price: 40 };

function mockClaudeText(text: string) {
  mockCreate.mockResolvedValue({ content: [{ type: 'text', text }] });
}

/** Captures the raw prompt string sent as `messages[0].content` on the last call. */
function sentPrompt(): string {
  return mockCreate.mock.calls[0][0].messages[0].content as string;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('askRick — parseAskResponse behavior (exercised via askRick)', () => {
  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('parses a valid JSON response', async () => {
    mockClaudeText('{"answer": "It is oaky.", "handBack": "Take another sip."}');

    const result = await askRick({ whiskey: WHISKEY, phase: 'nose', phaseProse: 'Nose prose', question: 'Why oak?' });

    expect(result).toEqual({ answer: 'It is oaky.', handBack: 'Take another sip.' });
  });

  it('parses JSON wrapped in stray prose and a code fence', async () => {
    mockClaudeText(
      'Sure thing!\n```json\n{"answer": "Vanilla and caramel.", "handBack": "Go smell it again."}\n```\nHope that helps.'
    );

    const result = await askRick({ whiskey: WHISKEY, phase: 'nose', phaseProse: 'Nose prose', question: 'What do I smell?' });

    expect(result).toEqual({ answer: 'Vanilla and caramel.', handBack: 'Go smell it again.' });
  });

  it('rejects a response that is not JSON at all', async () => {
    mockClaudeText('not json at all, sorry Rick had a stroke');

    await expect(
      askRick({ whiskey: WHISKEY, phase: 'nose', phaseProse: 'Nose prose', question: 'huh?' })
    ).rejects.toThrow('Failed to parse AI response as valid answer');
  });

  it('rejects JSON missing a required string field (handBack)', async () => {
    mockClaudeText('{"answer": "ok"}');

    await expect(
      askRick({ whiskey: WHISKEY, phase: 'nose', phaseProse: 'Nose prose', question: 'huh?' })
    ).rejects.toThrow('Failed to parse AI response as valid answer');
  });

  it('rejects JSON where a required field is the wrong type', async () => {
    mockClaudeText('{"answer": 42, "handBack": "Take a sip."}');

    await expect(
      askRick({ whiskey: WHISKEY, phase: 'nose', phaseProse: 'Nose prose', question: 'huh?' })
    ).rejects.toThrow('Failed to parse AI response as valid answer');
  });
});

describe('askRick — buildAskPrompt content (exercised via askRick)', () => {
  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  beforeEach(() => {
    mockCreate.mockReset();
    mockClaudeText('{"answer": "a", "handBack": "b"}');
  });

  it('includes the whiskey name, the mapped phase label, and the question; calls the expected model/token budget', async () => {
    await askRick({ whiskey: WHISKEY, phase: 'palate', phaseProse: 'Palate prose', question: 'Why so sweet?' });

    const prompt = sentPrompt();
    expect(prompt).toContain('Eagle Rare');
    expect(prompt).toContain('**Palate**'); // ASK_PHASE_LABELS['palate'] === 'Palate'
    expect(prompt).toContain('Why so sweet?');

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-sonnet-5');
    expect(callArgs.max_tokens).toBe(512);
  });

  it('falls back to the raw phase string when the phase has no label mapping', async () => {
    await askRick({ whiskey: WHISKEY, phase: 'unknown-phase', phaseProse: 'p', question: 'q' });

    expect(sentPrompt()).toContain('**unknown-phase**');
  });

  it('includes numbered prior exchanges and the don\'t-repeat instruction when history exists', async () => {
    const priorExchanges: AskExchange[] = [
      { question: 'Q1', answer: 'A1', handBack: 'HB1', at: '2026-07-22T00:00:00.000Z' },
      { question: 'Q2', answer: 'A2', handBack: 'HB2', at: '2026-07-22T00:01:00.000Z' },
    ];

    await askRick({ whiskey: WHISKEY, phase: 'finish', phaseProse: 'Finish prose', question: 'Q3', priorExchanges });

    const prompt = sentPrompt();
    expect(prompt).toContain('1. Q: "Q1"');
    expect(prompt).toContain('   A: "A1"');
    expect(prompt).toContain('2. Q: "Q2"');
    expect(prompt).toContain("Don't repeat yourself — build on what you already told them.");
  });

  it('omits the history section and the don\'t-repeat instruction when there are no prior exchanges', async () => {
    await askRick({ whiskey: WHISKEY, phase: 'visual', phaseProse: 'Visual prose', question: 'What color?' });

    const prompt = sentPrompt();
    expect(prompt).not.toContain("Don't repeat yourself");
    expect(prompt).not.toContain('Q: "');
  });
});

describe('askRick — configuration guard', () => {
  it('throws if the Anthropic API key is not configured', async () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    await expect(
      askRick({ whiskey: WHISKEY, phase: 'nose', phaseProse: 'p', question: 'q' })
    ).rejects.toThrow('Anthropic API key not configured');

    process.env.ANTHROPIC_API_KEY = original;
  });
});
