import { nanoid } from "nanoid";
import { Whiskey, InsertWhiskey, UpdateWhiskey, ReviewNote } from "@shared/schema";

export interface IStorage {
  getWhiskeys(): Promise<Whiskey[]>;
  getWhiskey(id: number): Promise<Whiskey | undefined>;
  createWhiskey(whiskey: InsertWhiskey): Promise<Whiskey>;
  updateWhiskey(id: number, whiskey: UpdateWhiskey): Promise<Whiskey | undefined>;
  deleteWhiskey(id: number): Promise<boolean>;
  addReview(id: number, review: ReviewNote): Promise<Whiskey | undefined>;
}

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
    const notes = [...whiskey.notes, reviewWithId];
    
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

export const storage = new MemStorage();
