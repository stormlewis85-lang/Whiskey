import { nanoid } from "nanoid";
import { 
  Whiskey, InsertWhiskey, UpdateWhiskey, ReviewNote, 
  whiskeys, users, User, InsertUser, UpdateUser,
  reviewComments, reviewLikes, InsertReviewComment, 
  UpdateReviewComment, ReviewComment, ReviewLike, InsertReviewLike
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, asc, desc } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Password hashing utilities
const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export interface IStorage {
  // Whiskey management
  getWhiskeys(userId?: number): Promise<Whiskey[]>;
  getWhiskey(id: number, userId?: number): Promise<Whiskey | undefined>;
  createWhiskey(whiskey: InsertWhiskey): Promise<Whiskey>;
  updateWhiskey(id: number, whiskey: UpdateWhiskey, userId?: number): Promise<Whiskey | undefined>;
  deleteWhiskey(id: number, userId?: number): Promise<boolean>;
  addReview(id: number, review: ReviewNote, userId?: number): Promise<Whiskey | undefined>;
  updateReview(whiskeyId: number, reviewId: string, review: ReviewNote, userId?: number): Promise<Whiskey | undefined>;
  deleteReview(whiskeyId: number, reviewId: string, userId?: number): Promise<Whiskey | undefined>;
  
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUser(id: number, userData: UpdateUser): Promise<User | undefined>;
  validateUserCredentials(username: string, password: string): Promise<User | undefined>;
  
  // Social features
  getSharedReview(shareId: string): Promise<{ whiskey: Whiskey; review: ReviewNote } | undefined>;
  toggleReviewPublic(whiskeyId: number, reviewId: string, isPublic: boolean, userId: number): Promise<Whiskey | undefined>;
  getPublicReviews(limit?: number, offset?: number): Promise<Array<{ whiskey: Whiskey; review: ReviewNote; user: User }>>;
  addReviewComment(whiskeyId: number, reviewId: string, comment: InsertReviewComment): Promise<ReviewComment>;
  updateReviewComment(commentId: number, comment: UpdateReviewComment, userId: number): Promise<ReviewComment | undefined>;
  deleteReviewComment(commentId: number, userId: number): Promise<boolean>;
  getReviewComments(whiskeyId: number, reviewId: string): Promise<ReviewComment[]>;
  toggleReviewLike(whiskeyId: number, reviewId: string, userId: number): Promise<{ liked: boolean; count: number }>;
  getReviewLikes(whiskeyId: number, reviewId: string): Promise<ReviewLike[]>;
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
  // User management methods
  async createUser(userData: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await hashPassword(userData.password);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword
      })
      .returning();
    
    return user;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    
    return user || undefined;
  }
  
  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) return undefined;
    
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async validateUserCredentials(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    const isValid = await comparePasswords(password, user.password);
    return isValid ? user : undefined;
  }
  
  // Social features implementation
  async getSharedReview(shareId: string): Promise<{ whiskey: Whiskey; review: ReviewNote } | undefined> {
    // Find all whiskeys and check for a review with this shareId
    const allWhiskeys = await db.select().from(whiskeys);
    
    for (const whiskey of allWhiskeys) {
      if (!Array.isArray(whiskey.notes)) continue;
      
      const review = whiskey.notes.find(note => 
        note.shareId === shareId && note.isPublic === true
      );
      
      if (review) {
        return { whiskey, review };
      }
    }
    
    return undefined;
  }
  
  async toggleReviewPublic(whiskeyId: number, reviewId: string, isPublic: boolean, userId: number): Promise<Whiskey | undefined> {
    // Get the whiskey and ensure it belongs to the user
    const whiskey = await this.getWhiskey(whiskeyId, userId);
    if (!whiskey || !Array.isArray(whiskey.notes)) return undefined;
    
    // Find the review index
    const reviewIndex = whiskey.notes.findIndex(note => note.id === reviewId);
    if (reviewIndex === -1) return undefined;
    
    // Create a new notes array with the updated review
    const notes = [...whiskey.notes];
    notes[reviewIndex] = {
      ...notes[reviewIndex],
      isPublic,
      // Only generate shareId if making review public and it doesn't already have one
      shareId: isPublic && !notes[reviewIndex].shareId ? nanoid() : notes[reviewIndex].shareId
    };
    
    // Update the whiskey with the updated notes
    const [updatedWhiskey] = await db
      .update(whiskeys)
      .set({ notes })
      .where(and(
        eq(whiskeys.id, whiskeyId),
        eq(whiskeys.userId, userId)
      ))
      .returning();
    
    return updatedWhiskey;
  }
  
  async getPublicReviews(limit: number = 20, offset: number = 0): Promise<Array<{ whiskey: Whiskey; review: ReviewNote; user: User }>> {
    // Get all whiskeys with their users
    const whiskeysWithUsers = await db
      .select()
      .from(whiskeys)
      .innerJoin(users, eq(whiskeys.userId, users.id));
    
    // Collect all public reviews
    const publicReviews: Array<{ whiskey: Whiskey; review: ReviewNote; user: User }> = [];
    
    for (const { whiskeys: whiskey, users: user } of whiskeysWithUsers) {
      if (!Array.isArray(whiskey.notes)) continue;
      
      const publicNotesInThisWhiskey = whiskey.notes
        .filter(note => note.isPublic === true)
        .map(review => ({
          whiskey,
          review,
          user
        }));
      
      publicReviews.push(...publicNotesInThisWhiskey);
    }
    
    // Sort by newest first and apply pagination
    return publicReviews
      .sort((a, b) => new Date(b.review.date).getTime() - new Date(a.review.date).getTime())
      .slice(offset, offset + limit);
  }
  
  async addReviewComment(whiskeyId: number, reviewId: string, comment: InsertReviewComment): Promise<ReviewComment> {
    const [newComment] = await db
      .insert(reviewComments)
      .values({
        ...comment,
        whiskeyId,
        reviewId
      })
      .returning();
    
    return newComment;
  }
  
  async updateReviewComment(commentId: number, comment: UpdateReviewComment, userId: number): Promise<ReviewComment | undefined> {
    // Get the comment and ensure it belongs to the user
    const [existingComment] = await db
      .select()
      .from(reviewComments)
      .where(and(
        eq(reviewComments.id, commentId),
        eq(reviewComments.userId, userId)
      ));
    
    if (!existingComment) return undefined;
    
    const [updatedComment] = await db
      .update(reviewComments)
      .set({
        ...comment,
        updatedAt: new Date()
      })
      .where(eq(reviewComments.id, commentId))
      .returning();
    
    return updatedComment;
  }
  
  async deleteReviewComment(commentId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(reviewComments)
      .where(and(
        eq(reviewComments.id, commentId),
        eq(reviewComments.userId, userId)
      ))
      .returning({ deleted: reviewComments.id });
    
    return result.length > 0;
  }
  
  async getReviewComments(whiskeyId: number, reviewId: string): Promise<ReviewComment[]> {
    const comments = await db
      .select()
      .from(reviewComments)
      .where(and(
        eq(reviewComments.whiskeyId, whiskeyId),
        eq(reviewComments.reviewId, reviewId)
      ))
      .orderBy(asc(reviewComments.createdAt));
    
    return comments;
  }
  
  async toggleReviewLike(whiskeyId: number, reviewId: string, userId: number): Promise<{ liked: boolean; count: number }> {
    // Check if the like already exists
    const [existingLike] = await db
      .select()
      .from(reviewLikes)
      .where(and(
        eq(reviewLikes.whiskeyId, whiskeyId),
        eq(reviewLikes.reviewId, reviewId),
        eq(reviewLikes.userId, userId)
      ));
    
    if (existingLike) {
      // Unlike: Delete the like
      await db
        .delete(reviewLikes)
        .where(eq(reviewLikes.id, existingLike.id));
      
      // Count total likes
      const count = await this.getReviewLikeCount(whiskeyId, reviewId);
      
      return { liked: false, count };
    } else {
      // Like: Add a new like
      await db
        .insert(reviewLikes)
        .values({
          whiskeyId,
          reviewId,
          userId
        });
      
      // Count total likes
      const count = await this.getReviewLikeCount(whiskeyId, reviewId);
      
      return { liked: true, count };
    }
  }
  
  async getReviewLikes(whiskeyId: number, reviewId: string): Promise<ReviewLike[]> {
    const likes = await db
      .select()
      .from(reviewLikes)
      .where(and(
        eq(reviewLikes.whiskeyId, whiskeyId),
        eq(reviewLikes.reviewId, reviewId)
      ));
    
    return likes;
  }
  
  // Helper method to count likes for a review
  private async getReviewLikeCount(whiskeyId: number, reviewId: string): Promise<number> {
    const likes = await this.getReviewLikes(whiskeyId, reviewId);
    return likes.length;
  }
  
  // Whiskey management methods - updated to filter by userId
  async getWhiskeys(userId?: number): Promise<Whiskey[]> {
    if (userId) {
      return await db
        .select()
        .from(whiskeys)
        .where(eq(whiskeys.userId, userId));
    }
    return await db.select().from(whiskeys);
  }

  async getWhiskey(id: number, userId?: number): Promise<Whiskey | undefined> {
    if (userId) {
      const [whiskey] = await db
        .select()
        .from(whiskeys)
        .where(and(
          eq(whiskeys.id, id),
          eq(whiskeys.userId, userId)
        ));
      return whiskey || undefined;
    }
    
    const [whiskey] = await db
      .select()
      .from(whiskeys)
      .where(eq(whiskeys.id, id));
    
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

  async updateWhiskey(id: number, updateData: UpdateWhiskey, userId?: number): Promise<Whiskey | undefined> {
    // Check if whiskey exists and belongs to the user
    let existingWhiskey;
    if (userId) {
      existingWhiskey = await this.getWhiskey(id, userId);
    } else {
      existingWhiskey = await this.getWhiskey(id);
    }
    
    if (!existingWhiskey) return undefined;

    const [updatedWhiskey] = await db
      .update(whiskeys)
      .set(updateData)
      .where(userId ? 
        and(eq(whiskeys.id, id), eq(whiskeys.userId, userId)) : 
        eq(whiskeys.id, id)
      )
      .returning();
    
    return updatedWhiskey;
  }

  async deleteWhiskey(id: number, userId?: number): Promise<boolean> {
    const result = await db
      .delete(whiskeys)
      .where(userId ? 
        and(eq(whiskeys.id, id), eq(whiskeys.userId, userId)) : 
        eq(whiskeys.id, id)
      )
      .returning({ deleted: whiskeys.id });
    
    return result.length > 0;
  }

  async addReview(id: number, review: ReviewNote, userId?: number): Promise<Whiskey | undefined> {
    // If userId is provided, make sure the whiskey belongs to the user
    const whiskey = userId ? 
      await this.getWhiskey(id, userId) : 
      await this.getWhiskey(id);
      
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
      .where(userId ? 
        and(eq(whiskeys.id, id), eq(whiskeys.userId, userId)) : 
        eq(whiskeys.id, id)
      )
      .returning();
    
    return updatedWhiskey;
  }

  async updateReview(whiskeyId: number, reviewId: string, updatedReview: ReviewNote, userId?: number): Promise<Whiskey | undefined> {
    // If userId is provided, make sure the whiskey belongs to the user
    const whiskey = userId ? 
      await this.getWhiskey(whiskeyId, userId) : 
      await this.getWhiskey(whiskeyId);
      
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
      .where(userId ? 
        and(eq(whiskeys.id, whiskeyId), eq(whiskeys.userId, userId)) : 
        eq(whiskeys.id, whiskeyId)
      )
      .returning();
    
    return updatedWhiskey;
  }

  async deleteReview(whiskeyId: number, reviewId: string, userId?: number): Promise<Whiskey | undefined> {
    // If userId is provided, make sure the whiskey belongs to the user
    const whiskey = userId ? 
      await this.getWhiskey(whiskeyId, userId) : 
      await this.getWhiskey(whiskeyId);
      
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
      .where(userId ? 
        and(eq(whiskeys.id, whiskeyId), eq(whiskeys.userId, userId)) : 
        eq(whiskeys.id, whiskeyId)
      )
      .returning();
    
    return updatedWhiskey;
  }
}

export const storage = new DatabaseStorage();
