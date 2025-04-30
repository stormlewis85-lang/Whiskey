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
}

export const storage = new DatabaseStorage();
