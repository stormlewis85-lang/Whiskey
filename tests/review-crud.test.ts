import { describe, it, expect, afterAll } from 'vitest';

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

let testWhiskeyId: number | null = null;
let testReviewId: string | null = null;

/**
 * REV-001 to REV-031: Review CRUD Tests
 */
describe('Review CRUD API Tests', () => {

  afterAll(async () => {
    if (testWhiskeyId) {
      const token = await getAuthToken();
      await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
  });

  // ==================== CREATE REVIEW TESTS ====================

  describe('Create Review (REV-001 to REV-006)', () => {

    it('REV-001: should create review with all scores', async () => {
      const token = await getAuthToken();

      // Create test whiskey first
      const whiskeyRes = await fetch(`${BASE_URL}/api/whiskeys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'Review Test Whiskey',
          type: 'Bourbon',
          status: 'open',
        }),
      });
      const whiskey = await whiskeyRes.json();
      testWhiskeyId = whiskey.id;

      const res = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: 4,
          date: new Date().toISOString().split('T')[0],
          text: 'Great bourbon with complex flavors',
          noseScore: 4,
          mouthfeelScore: 4,
          tasteScore: 5,
          finishScore: 4,
          valueScore: 3,
        }),
      });

      expect(res.status).toBe(200);
      const updatedWhiskey = await res.json();
      expect(updatedWhiskey.notes).toBeDefined();
      expect(updatedWhiskey.notes.length).toBeGreaterThan(0);
      testReviewId = updatedWhiskey.notes[0].id;
    });

    it('REV-002: should create review with required fields', async () => {
      const token = await getAuthToken();

      // Create another whiskey for this test
      const whiskeyRes = await fetch(`${BASE_URL}/api/whiskeys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'Minimal Review Test', status: 'open' }),
      });
      const whiskey = await whiskeyRes.json();

      // API requires all score fields plus text for a review
      const res = await fetch(`${BASE_URL}/api/whiskeys/${whiskey.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: 3,
          date: new Date().toISOString().split('T')[0],
          text: 'A basic review',
          noseScore: 3,
          mouthfeelScore: 3,
          tasteScore: 3,
          finishScore: 3,
          valueScore: 3,
        }),
      });

      expect(res.status).toBe(200);

      // Cleanup
      await fetch(`${BASE_URL}/api/whiskeys/${whiskey.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    });

    it('REV-003: should reject review without auth', async () => {
      const res = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      expect(res.status).toBe(401);
    });

    it('REV-004: should reject review for non-existent whiskey', async () => {
      const token = await getAuthToken();
      const res = await fetch(`${BASE_URL}/api/whiskeys/999999/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: 4,
          date: new Date().toISOString().split('T')[0],
          noseScore: 4,
          mouthfeelScore: 4,
          tasteScore: 4,
          finishScore: 4,
          valueScore: 4,
        }),
      });

      // API may return 400 (validation), 403 (forbidden), or 404 (not found)
      expect([400, 403, 404]).toContain(res.status);
    });
  });

  // ==================== READ REVIEW TESTS ====================

  describe('Read Review (REV-010 to REV-012)', () => {

    it('REV-010: should get specific review', async () => {
      expect(testReviewId).not.toBeNull();

      const res = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews/${testReviewId}`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.review).toBeDefined();
    });

    it('REV-011: should return 404 for non-existent review', async () => {
      const res = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews/nonexistent`, {
        method: 'GET',
      });

      expect(res.status).toBe(404);
    });

    it('REV-012: should get public reviews', async () => {
      const res = await fetch(`${BASE_URL}/api/reviews/public`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const reviews = await res.json();
      expect(Array.isArray(reviews)).toBe(true);
    });
  });

  // ==================== DELETE REVIEW TESTS ====================

  describe('Delete Review (REV-030 to REV-031)', () => {

    it('REV-030: should delete review', async () => {
      const token = await getAuthToken();

      // Create a whiskey and review to delete
      const whiskeyRes = await fetch(`${BASE_URL}/api/whiskeys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'Delete Review Test', status: 'open' }),
      });
      const whiskey = await whiskeyRes.json();

      const reviewRes = await fetch(`${BASE_URL}/api/whiskeys/${whiskey.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: 3,
          date: new Date().toISOString().split('T')[0],
          text: 'Review to be deleted',
          noseScore: 3,
          mouthfeelScore: 3,
          tasteScore: 3,
          finishScore: 3,
          valueScore: 3,
        }),
      });

      expect(reviewRes.ok).toBe(true);
      const updated = await reviewRes.json();
      const reviewId = updated.notes[0].id;

      // Delete the review
      const deleteRes = await fetch(`${BASE_URL}/api/whiskeys/${whiskey.id}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect([200, 204]).toContain(deleteRes.status);

      // Cleanup whiskey
      await fetch(`${BASE_URL}/api/whiskeys/${whiskey.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    });

    it('REV-031: should reject delete without auth', async () => {
      const res = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews/${testReviewId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });
  });
});
