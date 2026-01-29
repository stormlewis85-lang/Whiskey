import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:5000';

const TEST_USER = { username: 'admin', password: 'admin123' };

// Helper to get fresh auth token
async function getAuthToken(): Promise<string> {
  const loginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  });
  const data = await loginRes.json();
  return data.token;
}

/**
 * DIS-001 to DIS-005: Distillery API Tests
 */
describe('Distillery API Tests', () => {

  it('DIS-001: should get all distilleries', async () => {
    const res = await fetch(`${BASE_URL}/api/distilleries`, {
      method: 'GET',
    });

    expect(res.status).toBe(200);
    const distilleries = await res.json();
    expect(Array.isArray(distilleries)).toBe(true);
    expect(distilleries.length).toBeGreaterThan(0);
  });

  it('DIS-002: should search distilleries', async () => {
    const res = await fetch(`${BASE_URL}/api/distilleries?search=Buffalo`, {
      method: 'GET',
    });

    expect(res.status).toBe(200);
    const distilleries = await res.json();
    expect(Array.isArray(distilleries)).toBe(true);
  });

  it('DIS-003: should get single distillery', async () => {
    // First get list to find a valid ID
    const listRes = await fetch(`${BASE_URL}/api/distilleries`);
    const distilleries = await listRes.json();
    const firstId = distilleries[0]?.id;

    if (firstId) {
      const res = await fetch(`${BASE_URL}/api/distilleries/${firstId}`);
      expect(res.status).toBe(200);
      const distillery = await res.json();
      expect(distillery.id).toBe(firstId);
    }
  });

  it('DIS-004: should return 404 for non-existent distillery', async () => {
    const res = await fetch(`${BASE_URL}/api/distilleries/999999`);
    expect(res.status).toBe(404);
  });

  it('DIS-005: should create distillery with auth', async () => {
    const token = await getAuthToken();
    const res = await fetch(`${BASE_URL}/api/distilleries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `Test Distillery ${Date.now()}`,
        location: 'Test Location',
        country: 'USA',
        type: 'Bourbon',
      }),
    });

    expect(res.status).toBe(201);
    const distillery = await res.json();
    expect(distillery.name).toContain('Test Distillery');
  });
});

/**
 * AI-001 to AI-006: AI Endpoint Tests
 */
describe('AI Endpoint Tests', () => {

  it('AI-001: should get AI status', async () => {
    const token = await getAuthToken();
    const res = await fetch(`${BASE_URL}/api/ai/status`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const status = await res.json();
    expect(status.dailyLimit).toBeDefined();
    expect(status.remaining).toBeDefined();
    expect(status.allowed).toBeDefined();
  });

  it('AI-002: should reject AI status without auth', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/status`);
    expect(res.status).toBe(401);
  });

  it('AI-003: suggest-notes requires auth', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/suggest-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Whiskey' }),
    });

    expect(res.status).toBe(401);
  });

  it('AI-004: enhance-notes requires auth', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/enhance-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userNotes: 'Sweet and oaky' }),
    });

    expect(res.status).toBe(401);
  });

  it('AI-005: suggest-notes returns expected status codes', async () => {
    const token = await getAuthToken();
    const res = await fetch(`${BASE_URL}/api/ai/suggest-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Test Whiskey' }),
    });

    // 200 = working, 503 = not configured, 429 = rate limited
    expect([200, 429, 503]).toContain(res.status);
  });

  it('AI-006: enhance-notes validates input', async () => {
    const token = await getAuthToken();
    const res = await fetch(`${BASE_URL}/api/ai/enhance-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Missing userNotes
    });

    // 400 = validation error, 503 = not configured, 429 = rate limited
    expect([400, 429, 503]).toContain(res.status);
  });
});
