import { nanoid } from "nanoid";
import { 
  Whiskey, InsertWhiskey, UpdateWhiskey, ReviewNote, 
  whiskeys, users, User, InsertUser, UpdateUser,
  reviewComments, reviewLikes, priceTracks, marketValues,
  InsertReviewComment, UpdateReviewComment, ReviewComment, 
  ReviewLike, InsertReviewLike, PriceTrack, InsertPriceTrack,
  UpdatePriceTrack, MarketValue, InsertMarketValue, UpdateMarketValue
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
  
  // Price tracking 
  getWhiskeyPriceHistory(whiskeyId: number, userId?: number): Promise<PriceTrack[]>;
  addPriceTrack(priceTrack: InsertPriceTrack): Promise<PriceTrack>;
  updatePriceTrack(priceId: number, updateData: UpdatePriceTrack, userId: number): Promise<PriceTrack | undefined>;
  deletePriceTrack(priceId: number, userId: number): Promise<boolean>;
  
  // Market value
  getWhiskeyMarketValues(whiskeyId: number, userId?: number): Promise<MarketValue[]>;
  addMarketValue(marketValue: InsertMarketValue): Promise<MarketValue>;
  updateMarketValue(valueId: number, updateData: UpdateMarketValue, userId: number): Promise<MarketValue | undefined>;
  deleteMarketValue(valueId: number, userId: number): Promise<boolean>;
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
  
  // CRUD operations for review comments
  async addReviewComment(whiskeyId: number, reviewId: string, comment: InsertReviewComment): Promise<ReviewComment> {
    const [newComment] = await db
      .insert(reviewComments)
      .values({
        ...comment,
        whiskeyId,
        reviewId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newComment;
  }
  
  async updateReviewComment(commentId: number, comment: UpdateReviewComment, userId: number): Promise<ReviewComment | undefined> {
    const [updatedComment] = await db
      .update(reviewComments)
      .set({
        ...comment,
        updatedAt: new Date()
      })
      .where(and(
        eq(reviewComments.id, commentId),
        eq(reviewComments.userId, userId)
      ))
      .returning();
    
    return updatedComment || undefined;
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
  
  // Like functionality
  async toggleReviewLike(whiskeyId: number, reviewId: string, userId: number): Promise<{ liked: boolean; count: number }> {
    // Check if user already liked this review
    const [existingLike] = await db
      .select()
      .from(reviewLikes)
      .where(and(
        eq(reviewLikes.whiskeyId, whiskeyId),
        eq(reviewLikes.reviewId, reviewId),
        eq(reviewLikes.userId, userId)
      ));
    
    // If like exists, remove it
    if (existingLike) {
      await db
        .delete(reviewLikes)
        .where(eq(reviewLikes.id, existingLike.id));
      
      // Return updated count
      const count = await this.getReviewLikeCount(whiskeyId, reviewId);
      return { liked: false, count };
    }
    
    // Otherwise, add a new like
    await db
      .insert(reviewLikes)
      .values({
        whiskeyId,
        reviewId,
        userId
      });
    
    // Return updated count
    const count = await this.getReviewLikeCount(whiskeyId, reviewId);
    return { liked: true, count };
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
  
  private async getReviewLikeCount(whiskeyId: number, reviewId: string): Promise<number> {
    const likes = await this.getReviewLikes(whiskeyId, reviewId);
    return likes.length;
  }
  
  // Whiskey CRUD operations
  async getWhiskeys(userId?: number): Promise<Whiskey[]> {
    // Build the base query
    const query = db.select().from(whiskeys);
    
    // If userId is provided, filter by user
    if (userId !== undefined) {
      query.where(eq(whiskeys.userId, userId));
    }
    
    // Execute the query with ordering
    return query.orderBy(asc(whiskeys.name));
  }
  
  async getWhiskey(id: number, userId?: number): Promise<Whiskey | undefined> {
    // Build the query conditions
    const conditions = [eq(whiskeys.id, id)];
    
    // If userId is provided, only return the whiskey if it belongs to that user
    if (userId !== undefined) {
      conditions.push(eq(whiskeys.userId, userId));
    }
    
    // Execute the query with the combined conditions
    const [whiskey] = await db
      .select()
      .from(whiskeys)
      .where(and(...conditions));
    
    return whiskey || undefined;
  }
  
  async createWhiskey(whiskey: InsertWhiskey): Promise<Whiskey> {
    const [newWhiskey] = await db
      .insert(whiskeys)
      .values({
        ...whiskey,
        dateAdded: new Date(),
      })
      .returning();
    
    return newWhiskey;
  }
  
  async updateWhiskey(id: number, whiskey: UpdateWhiskey, userId?: number): Promise<Whiskey | undefined> {
    // Build the WHERE clause based on whether userId is provided
    const whereClause = userId !== undefined
      ? and(eq(whiskeys.id, id), eq(whiskeys.userId, userId))
      : eq(whiskeys.id, id);
    
    // Execute the update
    const [updatedWhiskey] = await db
      .update(whiskeys)
      .set(whiskey)
      .where(whereClause)
      .returning();
    
    return updatedWhiskey || undefined;
  }
  
  async deleteWhiskey(id: number, userId?: number): Promise<boolean> {
    try {
      // Build the WHERE clause based on whether userId is provided
      const whereClause = userId !== undefined
        ? and(eq(whiskeys.id, id), eq(whiskeys.userId, userId))
        : eq(whiskeys.id, id);
      
      // Execute the delete
      const result = await db
        .delete(whiskeys)
        .where(whereClause)
        .returning({ deleted: whiskeys.id });
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting whiskey:", error);
      return false;
    }
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
    
    // Add the review to the notes array
    const notes = Array.isArray(whiskey.notes) ? [...whiskey.notes, reviewWithId] : [reviewWithId];
    
    // Calculate the new average rating
    const totalRating = notes.reduce((sum, note) => sum + note.rating, 0);
    const avgRating = notes.length > 0 ? totalRating / notes.length : 0;
    
    // Update the whiskey with the new rating and last reviewed date
    const whereClause = userId ? 
      and(eq(whiskeys.id, id), eq(whiskeys.userId, userId)) : 
      eq(whiskeys.id, id);
    
    const [updatedWhiskey] = await db
      .update(whiskeys)
      .set({
        notes,
        rating: parseFloat(avgRating.toFixed(1)),
        lastReviewed: new Date()
      })
      .where(whereClause)
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
    
    // Update the whiskey
    const whereClause = userId ? 
      and(eq(whiskeys.id, whiskeyId), eq(whiskeys.userId, userId)) : 
      eq(whiskeys.id, whiskeyId);
    
    const [updatedWhiskey] = await db
      .update(whiskeys)
      .set({
        notes,
        rating: parseFloat(avgRating.toFixed(1)),
        lastReviewed: new Date()
      })
      .where(whereClause)
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
    
    // Update the whiskey
    const whereClause = userId ? 
      and(eq(whiskeys.id, whiskeyId), eq(whiskeys.userId, userId)) : 
      eq(whiskeys.id, whiskeyId);
    
    const [updatedWhiskey] = await db
      .update(whiskeys)
      .set({
        notes,
        rating: parseFloat(avgRating.toFixed(1)),
        // Only update lastReviewed if there are still reviews
        lastReviewed: notes.length > 0 ? whiskey.lastReviewed : null
      })
      .where(whereClause)
      .returning();
    
    return updatedWhiskey;
  }

  // Price tracking methods
  async getWhiskeyPriceHistory(whiskeyId: number, userId?: number): Promise<PriceTrack[]> {
    // Build the query conditions
    const conditions = [eq(priceTracks.whiskeyId, whiskeyId)];
    
    // Filter by user if userId is provided
    if (userId !== undefined) {
      conditions.push(eq(priceTracks.userId, userId));
    }
    
    // Execute the query with the combined conditions
    const priceHistory = await db
      .select()
      .from(priceTracks)
      .where(and(...conditions))
      .orderBy(desc(priceTracks.date));
    
    return priceHistory;
  }
  
  async addPriceTrack(priceTrack: InsertPriceTrack): Promise<PriceTrack> {
    // Check if whiskey exists and belongs to the user
    const whiskey = await this.getWhiskey(priceTrack.whiskeyId, priceTrack.userId);
    if (!whiskey) {
      throw new Error("Whiskey not found or not owned by you");
    }
    
    // Insert the price track
    const [newPriceTrack] = await db
      .insert(priceTracks)
      .values(priceTrack)
      .returning();
    
    return newPriceTrack;
  }
  
  async updatePriceTrack(priceId: number, updateData: UpdatePriceTrack, userId: number): Promise<PriceTrack | undefined> {
    // Check if price track exists and belongs to the user
    const [existingPriceTrack] = await db
      .select()
      .from(priceTracks)
      .where(and(
        eq(priceTracks.id, priceId),
        eq(priceTracks.userId, userId)
      ));
    
    if (!existingPriceTrack) {
      return undefined;
    }
    
    // Update the price track
    const [updatedPriceTrack] = await db
      .update(priceTracks)
      .set(updateData)
      .where(eq(priceTracks.id, priceId))
      .returning();
    
    return updatedPriceTrack;
  }
  
  async deletePriceTrack(priceId: number, userId: number): Promise<boolean> {
    // Delete the price track that belongs to the user
    const result = await db
      .delete(priceTracks)
      .where(and(
        eq(priceTracks.id, priceId),
        eq(priceTracks.userId, userId)
      ))
      .returning();
    
    return result.length > 0;
  }
  
  // Market value methods
  async getWhiskeyMarketValues(whiskeyId: number, userId?: number): Promise<MarketValue[]> {
    // Build the query conditions
    const conditions = [eq(marketValues.whiskeyId, whiskeyId)];
    
    // Filter by user if userId is provided
    if (userId !== undefined) {
      conditions.push(eq(marketValues.userId, userId));
    }
    
    // Execute the query with the combined conditions
    const marketValueHistory = await db
      .select()
      .from(marketValues)
      .where(and(...conditions))
      .orderBy(desc(marketValues.date));
    
    return marketValueHistory;
  }
  
  async addMarketValue(marketValue: InsertMarketValue): Promise<MarketValue> {
    // Check if whiskey exists and belongs to the user
    const whiskey = await this.getWhiskey(marketValue.whiskeyId, marketValue.userId);
    if (!whiskey) {
      throw new Error("Whiskey not found or not owned by you");
    }
    
    // Insert the market value
    const [newMarketValue] = await db
      .insert(marketValues)
      .values(marketValue)
      .returning();
    
    return newMarketValue;
  }
  
  async updateMarketValue(valueId: number, updateData: UpdateMarketValue, userId: number): Promise<MarketValue | undefined> {
    // Check if market value exists and belongs to the user
    const [existingMarketValue] = await db
      .select()
      .from(marketValues)
      .where(and(
        eq(marketValues.id, valueId),
        eq(marketValues.userId, userId)
      ));
    
    if (!existingMarketValue) {
      return undefined;
    }
    
    // Update the market value
    const [updatedMarketValue] = await db
      .update(marketValues)
      .set(updateData)
      .where(eq(marketValues.id, valueId))
      .returning();
    
    return updatedMarketValue;
  }
  
  async deleteMarketValue(valueId: number, userId: number): Promise<boolean> {
    // Delete the market value that belongs to the user
    const result = await db
      .delete(marketValues)
      .where(and(
        eq(marketValues.id, valueId),
        eq(marketValues.userId, userId)
      ))
      .returning();
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();