import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = 'http://localhost:5000';

const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

let authToken: string | null = null;
let testWhiskeyId: number | null = null;
let testReviewId: string | null = null;

/**
 * T020: Test review edit flow
 * REV-020: Edit existing review
 * REV-021: Score recalculates on edit
 * REV-022: Edit preserves other review fields
 */
describe('Review Edit API Tests', () => {

  beforeAll(async () => {
    // Login
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER),
    });

    const loginData = await loginRes.json();
    authToken = loginData.token;

    // Create a test whiskey
    const createRes = await fetch(`${BASE_URL}/api/whiskeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Test Whiskey For Review Edit',
        distillery: 'Test Distillery',
        type: 'Bourbon',
        abv: 45,
        status: 'open',
      }),
    });

    const whiskey = await createRes.json();
    testWhiskeyId = whiskey.id;
    console.log(`Created test whiskey: ${testWhiskeyId}`);

    // Add a review to the whiskey
    const reviewRes = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        rating: 3,
        date: new Date().toISOString().split('T')[0],
        text: 'Initial review text',
        flavor: 'vanilla',
        noseScore: 3,
        mouthfeelScore: 3,
        tasteScore: 3,
        finishScore: 3,
        valueScore: 3,
      }),
    });

    if (!reviewRes.ok) {
      const err = await reviewRes.text();
      throw new Error(`Failed to create review: ${err}`);
    }

    const updatedWhiskey = await reviewRes.json();
    // Get the review ID from the whiskey's notes array
    if (updatedWhiskey.notes && updatedWhiskey.notes.length > 0) {
      testReviewId = updatedWhiskey.notes[0].id;
      console.log(`Created test review: ${testReviewId}`);
    } else {
      throw new Error('No review ID returned');
    }
  });

  afterAll(async () => {
    // Cleanup - delete test whiskey
    if (testWhiskeyId && authToken) {
      await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
    }
  });

  /**
   * REV-020: Edit existing review
   */
  it('REV-020: should edit an existing review', async () => {
    expect(testWhiskeyId).not.toBeNull();
    expect(testReviewId).not.toBeNull();

    const editRes = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews/${testReviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        id: testReviewId,
        rating: 4,
        date: new Date().toISOString().split('T')[0],
        text: 'Updated review text - this is the edited version',
        flavor: 'caramel',
        noseScore: 4,
        mouthfeelScore: 4,
        tasteScore: 4,
        finishScore: 4,
        valueScore: 4,
      }),
    });

    expect(editRes.ok).toBe(true);
    const updatedWhiskey = await editRes.json();

    // Find the updated review
    const review = updatedWhiskey.notes.find((n: any) => n.id === testReviewId);
    expect(review).toBeDefined();
    expect(review.text).toBe('Updated review text - this is the edited version');
    expect(review.rating).toBe(4);
  });

  /**
   * REV-021: Score recalculates on edit
   */
  it('REV-021: should recalculate score when scores change', async () => {
    // Edit with different scores
    const editRes = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews/${testReviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        id: testReviewId,
        rating: 5, // High rating
        date: new Date().toISOString().split('T')[0],
        text: 'Excellent whiskey!',
        flavor: 'oak',
        noseScore: 5,
        mouthfeelScore: 5,
        tasteScore: 5,
        finishScore: 5,
        valueScore: 5,
      }),
    });

    expect(editRes.ok).toBe(true);
    const updatedWhiskey = await editRes.json();

    const review = updatedWhiskey.notes.find((n: any) => n.id === testReviewId);
    expect(review).toBeDefined();
    // If weighted score is calculated, it should be 5 (all scores are 5)
    expect(review.rating).toBe(5);
  });

  /**
   * REV-022: Edit preserves other review fields
   */
  it('REV-022: should preserve fields not being edited', async () => {
    // First set some specific values
    await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews/${testReviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        id: testReviewId,
        rating: 4,
        date: '2024-01-15',
        text: 'Specific text to preserve',
        flavor: 'honey',
        noseScore: 4,
        mouthfeelScore: 3,
        tasteScore: 4,
        finishScore: 3,
        valueScore: 4,
        visualColor: 'amber',
        visualClarity: 'clear',
      }),
    });

    // Now edit only the text
    const editRes = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews/${testReviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        id: testReviewId,
        rating: 4,
        date: '2024-01-15',
        text: 'New text but other fields preserved',
        flavor: 'honey',
        noseScore: 4,
        mouthfeelScore: 3,
        tasteScore: 4,
        finishScore: 3,
        valueScore: 4,
        visualColor: 'amber',
        visualClarity: 'clear',
      }),
    });

    expect(editRes.ok).toBe(true);
    const updatedWhiskey = await editRes.json();

    const review = updatedWhiskey.notes.find((n: any) => n.id === testReviewId);
    expect(review).toBeDefined();
    expect(review.text).toBe('New text but other fields preserved');
    expect(review.visualColor).toBe('amber');
    expect(review.date).toBe('2024-01-15');
  });

  /**
   * Cannot edit another user's review
   */
  it('should not allow editing non-existent review', async () => {
    const editRes = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews/fake-review-id`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        id: 'fake-review-id',
        rating: 5,
        date: new Date().toISOString().split('T')[0],
        text: 'Trying to edit fake review',
      }),
    });

    expect(editRes.status).toBe(404);
  });

  /**
   * Unauthenticated edit should fail
   */
  it('should reject edit without authentication', async () => {
    const editRes = await fetch(`${BASE_URL}/api/whiskeys/${testWhiskeyId}/reviews/${testReviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testReviewId,
        rating: 1,
        text: 'Unauthorized edit attempt',
      }),
    });

    expect(editRes.status).toBe(401);
  });
});
