import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = 'http://localhost:5000';

// Test credentials - use existing admin user
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

let authToken: string | null = null;
let testWhiskeyId: number | null = null;

/**
 * WHI-030: Delete whiskey - DELETE /whiskeys/:id returns 204, whiskey removed
 * WHI-033: Session token valid - DELETE with fresh login should work
 */
describe('Whiskey Delete API Tests', () => {

  beforeAll(async () => {
    // Login to get auth token
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER),
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }

    const loginData = await loginRes.json();
    authToken = loginData.token;

    if (!authToken) {
      throw new Error('No auth token received from login');
    }

    console.log('Login successful, token received');

    // Create a test whiskey to delete
    const createRes = await fetch(`${BASE_URL}/api/whiskeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Test Whiskey For Delete',
        distillery: 'Test Distillery',
        type: 'Bourbon',
        abv: 45,
        status: 'open',
      }),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create test whiskey: ${createRes.status} ${await createRes.text()}`);
    }

    const whiskey = await createRes.json();
    testWhiskeyId = whiskey.id;
    console.log(`Created test whiskey with ID: ${testWhiskeyId}`);
  });

  afterAll(async () => {
    // Cleanup - try to delete any remaining test whiskey
    if (testWhiskeyId && authToken) {
      try {
        await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  /**
   * WHI-030: Delete whiskey
   * DELETE /api/whiskeys/:id should return 204 and remove the whiskey
   */
  it('WHI-030: should delete whiskey successfully', async () => {
    expect(testWhiskeyId).not.toBeNull();
    expect(authToken).not.toBeNull();

    // Delete the whiskey
    const deleteRes = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Should return 204 No Content
    expect(deleteRes.status).toBe(204);

    // Verify whiskey is actually deleted
    const getRes = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Should return 404 Not Found
    expect(getRes.status).toBe(404);

    // Mark as deleted so afterAll doesn't try again
    testWhiskeyId = null;
  });

  /**
   * WHI-033: Session token valid
   * DELETE with fresh login should work
   */
  it('WHI-033: should work with fresh login token', async () => {
    // Fresh login
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER),
    });

    expect(loginRes.ok).toBe(true);
    const loginData = await loginRes.json();
    const freshToken = loginData.token;

    expect(freshToken).toBeTruthy();

    // Create a whiskey with fresh token
    const createRes = await fetch(`${BASE_URL}/api/whiskeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`,
      },
      body: JSON.stringify({
        name: 'Fresh Token Test Whiskey',
        distillery: 'Test Distillery',
        type: 'Rye',
        abv: 50,
        status: 'sealed',
      }),
    });

    expect(createRes.ok).toBe(true);
    const whiskey = await createRes.json();

    // Delete with fresh token - this is the key test for WHI-033
    const deleteRes = await fetch(`${BASE_URL}/api/whiskeys/${whiskey.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${freshToken}`,
      },
    });

    expect(deleteRes.status).toBe(204);
  });

  /**
   * WHI-031: Can't delete others' whiskeys / non-existent
   * Should return 401, 403, or 404 when trying to delete non-existent whiskey
   * (401 if token expired during test, 403 if forbidden, 404 if not found)
   */
  it('WHI-031: should not allow deleting non-existent whiskey', async () => {
    // Get fresh token to ensure auth works
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER),
    });
    const { token: freshToken } = await loginRes.json();

    const deleteRes = await fetch(`${BASE_URL}/api/whiskeys/999999`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${freshToken}`,
      },
    });

    // Should return 404 Not Found (whiskey doesn't exist)
    // or 403 Forbidden (not authorized for this whiskey)
    expect([403, 404]).toContain(deleteRes.status);
  });

  /**
   * Unauthenticated delete should fail
   */
  it('should reject delete without authentication', async () => {
    const deleteRes = await fetch(`${BASE_URL}/api/whiskeys/1`, {
      method: 'DELETE',
      // No Authorization header
    });

    expect(deleteRes.status).toBe(401);
  });
});
