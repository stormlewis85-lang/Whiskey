import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:5000';

const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

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
 * WHI-030: Delete whiskey - DELETE /whiskeys/:id returns 204, whiskey removed
 * WHI-033: Session token valid - DELETE with fresh login should work
 */
describe('Whiskey Delete API Tests', () => {

  /**
   * WHI-030: Delete whiskey
   * DELETE /api/whiskeys/:id should return 204 and remove the whiskey
   */
  it('WHI-030: should delete whiskey successfully', async () => {
    const token = await getAuthToken();

    // Create a test whiskey to delete
    const createRes = await fetch(`${BASE_URL}/api/whiskeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Test Whiskey For Delete',
        distillery: 'Test Distillery',
        type: 'Bourbon',
        abv: 45,
        status: 'open',
      }),
    });

    expect(createRes.status).toBe(201);
    const whiskey = await createRes.json();

    // Delete the whiskey
    const deleteRes = await fetch(`${BASE_URL}/api/whiskeys/${whiskey.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Should return 204 No Content
    expect(deleteRes.status).toBe(204);

    // Verify whiskey is actually deleted
    const getRes = await fetch(`${BASE_URL}/api/whiskeys/${whiskey.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Should return 404 Not Found
    expect(getRes.status).toBe(404);
  });

  /**
   * WHI-033: Session token valid
   * DELETE with fresh login should work
   */
  it('WHI-033: should work with fresh login token', async () => {
    const token = await getAuthToken();

    // Create a whiskey with fresh token
    const createRes = await fetch(`${BASE_URL}/api/whiskeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Fresh Token Test Whiskey',
        distillery: 'Test Distillery',
        type: 'Rye',
        abv: 50,
        status: 'sealed',
      }),
    });

    expect(createRes.status).toBe(201);
    const whiskey = await createRes.json();

    // Delete with fresh token - this is the key test for WHI-033
    const deleteRes = await fetch(`${BASE_URL}/api/whiskeys/${whiskey.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(deleteRes.status).toBe(204);
  });

  /**
   * WHI-031: Can't delete others' whiskeys / non-existent
   */
  it('WHI-031: should not allow deleting non-existent whiskey', async () => {
    const token = await getAuthToken();

    const deleteRes = await fetch(`${BASE_URL}/api/whiskeys/999999`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
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
