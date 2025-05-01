import { nanoid } from "nanoid";
import { Whiskey, InsertWhiskey, UpdateWhiskey, ReviewNote, whiskeys } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getWhiskeys(): Promise<Whiskey[]>;
  getWhiskey(id: number): Promise<Whiskey | undefined>;
  createWhiskey(whiskey: InsertWhiskey): Promise<Whiskey>;
  updateWhiskey(id: number, whiskey: UpdateWhiskey): Promise<Whiskey | undefined>;
  deleteWhiskey(id: number): Promise<boolean>;
  addReview(id: number, review: ReviewNote): Promise<Whiskey | undefined>;
  updateReview(whiskeyId: number, reviewId: string, review: ReviewNote): Promise<Whiskey | undefined>;
  deleteReview(whiskeyId: number, reviewId: string): Promise<Whiskey | undefined>;
}

// This is kept for reference but not used anymore
export class MemStorage implements IStorage {
  private whiskeys: Map<number, Whiskey>;
  private currentId: number;

  constructor() {
    this.whiskeys = new Map();
    this.currentId = 1;
  }

  async getWhiskeys(): Promise<Whiskey[]> {
    return Array.from(this.whiskeys.values());
  }

  async getWhiskey(id: number): Promise<Whiskey | undefined> {
    return this.whiskeys.get(id);
  }

  async createWhiskey(insertWhiskey: InsertWhiskey): Promise<Whiskey> {
    const id = this.currentId++;
    const now = new Date();
    
    const whiskey: Whiskey = {
      ...insertWhiskey,
      id,
      dateAdded: now,
      lastReviewed: insertWhiskey.lastReviewed || null,
      rating: insertWhiskey.rating || 0,
      notes: insertWhiskey.notes || []
    };
    
    this.whiskeys.set(id, whiskey);
    return whiskey;
  }

  async updateWhiskey(id: number, updateData: UpdateWhiskey): Promise<Whiskey | undefined> {
    const whiskey = this.whiskeys.get(id);
    if (!whiskey) return undefined;

    const updatedWhiskey: Whiskey = {
      ...whiskey,
      ...updateData,
    };

    this.whiskeys.set(id, updatedWhiskey);
    return updatedWhiskey;
  }

  async deleteWhiskey(id: number): Promise<boolean> {
    return this.whiskeys.delete(id);
  }

  async addReview(id: number, review: ReviewNote): Promise<Whiskey | undefined> {
    const whiskey = this.whiskeys.get(id);
    if (!whiskey) return undefined;

    // Ensure the review has an ID
    const reviewWithId: ReviewNote = {
      ...review,
      id: review.id || nanoid()
    };

    // Add the review to the notes array
    const notes = Array.isArray(whiskey.notes) ? [...whiskey.notes, reviewWithId] : [reviewWithId];
    
    // Calculate the new average rating
    const totalRating = notes.reduce((sum, note) => sum + note.rating, 0);
    const avgRating = notes.length > 0 ? totalRating / notes.length : 0;
    
    // Update the whiskey
    const updatedWhiskey: Whiskey = {
      ...whiskey,
      notes,
      rating: parseFloat(avgRating.toFixed(1)),
      lastReviewed: new Date()
    };

    this.whiskeys.set(id, updatedWhiskey);
    return updatedWhiskey;
  }

  async updateReview(whiskeyId: number, reviewId: string, updatedReview: ReviewNote): Promise<Whiskey | undefined> {
    const whiskey = this.whiskeys.get(whiskeyId);
    if (!whiskey || !Array.isArray(whiskey.notes)) return undefined;

    // Find the review index
    const reviewIndex = whiskey.notes.findIndex(note => note.id === reviewId);
    if (reviewIndex === -1) return undefined;

    // Create a new notes array with the updated review
    const notes = [...whiskey.notes];
    notes[reviewIndex] = {
      ...updatedReview,
      id: reviewId // Ensure we keep the same ID
    };

    // Calculate the new average rating
    const totalRating = notes.reduce((sum, note) => sum + note.rating, 0);
    const avgRating = notes.length > 0 ? totalRating / notes.length : 0;
    
    // Update the whiskey
    const updatedWhiskey: Whiskey = {
      ...whiskey,
      notes,
      rating: parseFloat(avgRating.toFixed(1)),
      lastReviewed: new Date()
    };

    this.whiskeys.set(whiskeyId, updatedWhiskey);
    return updatedWhiskey;
  }

  async deleteReview(whiskeyId: number, reviewId: string): Promise<Whiskey | undefined> {
    const whiskey = this.whiskeys.get(whiskeyId);
    if (!whiskey || !Array.isArray(whiskey.notes)) return undefined;

    // Filter out the review to delete
    const notes = whiskey.notes.filter(note => note.id !== reviewId);
    
    // If no reviews were deleted, return undefined
    if (notes.length === whiskey.notes.length) return undefined;
    
    // Calculate the new average rating
    const totalRating = notes.reduce((sum, note) => sum + note.rating, 0);
    const avgRating = notes.length > 0 ? totalRating / notes.length : 0;
    
    // Update the whiskey
    const updatedWhiskey: Whiskey = {
      ...whiskey,
      notes,
      rating: parseFloat(avgRating.toFixed(1)),
      // Only update lastReviewed if there are still reviews
      lastReviewed: notes.length > 0 ? whiskey.lastReviewed : null
    };

    this.whiskeys.set(whiskeyId, updatedWhiskey);
    return updatedWhiskey;
  }
}

export class DatabaseStorage implements IStorage {
  async getWhiskeys(): Promise<Whiskey[]> {
    return await db.select().from(whiskeys);
  }

  async getWhiskey(id: number): Promise<Whiskey | undefined> {
    const [whiskey] = await db.select().from(whiskeys).where(eq(whiskeys.id, id));
    return whiskey || undefined;
  }

  async createWhiskey(insertWhiskey: InsertWhiskey): Promise<Whiskey> {
    const [whiskey] = await db
      .insert(whiskeys)
      .values({
        ...insertWhiskey,
        notes: insertWhiskey.notes || [],
        rating: insertWhiskey.rating || 0
      })
      .returning();
    return whiskey;
  }

  async updateWhiskey(id: number, updateData: UpdateWhiskey): Promise<Whiskey | undefined> {
    const existingWhiskey = await this.getWhiskey(id);
    if (!existingWhiskey) return undefined;

    const [updatedWhiskey] = await db
      .update(whiskeys)
      .set(updateData)
      .where(eq(whiskeys.id, id))
      .returning();
    
    return updatedWhiskey;
  }

  async deleteWhiskey(id: number): Promise<boolean> {
    const result = await db
      .delete(whiskeys)
      .where(eq(whiskeys.id, id))
      .returning({ deleted: whiskeys.id });
    
    return result.length > 0;
  }

  async addReview(id: number, review: ReviewNote): Promise<Whiskey | undefined> {
    const whiskey = await this.getWhiskey(id);
    if (!whiskey) return undefined;

    // Ensure the review has an ID
    const reviewWithId: ReviewNote = {
      ...review,
      id: review.id || nanoid()
    };

    // Add the review to the notes array - handle the case where notes might be null
    const notes = Array.isArray(whiskey.notes) ? [...whiskey.notes, reviewWithId] : [reviewWithId];
    
    // Calculate the new average rating
    const totalRating = notes.reduce((sum, note) => sum + note.rating, 0);
    const avgRating = notes.length > 0 ? totalRating / notes.length : 0;
    
    // Update the whiskey with the new notes and rating
    const [updatedWhiskey] = await db
      .update(whiskeys)
      .set({
        notes,
        rating: parseFloat(avgRating.toFixed(1)),
        lastReviewed: new Date()
      })
      .where(eq(whiskeys.id, id))
      .returning();
    
    return updatedWhiskey;
  }

  async updateReview(whiskeyId: number, reviewId: string, updatedReview: ReviewNote): Promise<Whiskey | undefined> {
    const whiskey = await this.getWhiskey(whiskeyId);
    if (!whiskey || !Array.isArray(whiskey.notes)) return undefined;

    // Find the review index
    const reviewIndex = whiskey.notes.findIndex(note => note.id === reviewId);
    if (reviewIndex === -1) return undefined;

    // Create a new notes array with the updated review
    const notes = [...whiskey.notes];
    notes[reviewIndex] = {
      ...updatedReview,
      id: reviewId // Ensure we keep the same ID
    };

    // Calculate the new average rating
    const totalRating = notes.reduce((sum, note) => sum + note.rating, 0);
    const avgRating = notes.length > 0 ? totalRating / notes.length : 0;
    
    // Update the whiskey with the updated notes and new rating
    const [updatedWhiskey] = await db
      .update(whiskeys)
      .set({
        notes,
        rating: parseFloat(avgRating.toFixed(1)),
        lastReviewed: new Date()
      })
      .where(eq(whiskeys.id, whiskeyId))
      .returning();
    
    return updatedWhiskey;
  }

  async deleteReview(whiskeyId: number, reviewId: string): Promise<Whiskey | undefined> {
    const whiskey = await this.getWhiskey(whiskeyId);
    if (!whiskey || !Array.isArray(whiskey.notes)) return undefined;

    // Filter out the review to delete
    const notes = whiskey.notes.filter(note => note.id !== reviewId);
    
    // If no reviews were deleted, return undefined
    if (notes.length === whiskey.notes.length) return undefined;
    
    // Calculate the new average rating
    const totalRating = notes.reduce((sum, note) => sum + note.rating, 0);
    const avgRating = notes.length > 0 ? totalRating / notes.length : 0;
    
    // Update the whiskey with the new notes array and updated rating
    const [updatedWhiskey] = await db
      .update(whiskeys)
      .set({
        notes,
        rating: parseFloat(avgRating.toFixed(1)),
        // Only update lastReviewed if there are still reviews
        lastReviewed: notes.length > 0 ? whiskey.lastReviewed : null
      })
      .where(eq(whiskeys.id, whiskeyId))
      .returning();
    
    return updatedWhiskey;
  }
}

export const storage = new DatabaseStorage();
