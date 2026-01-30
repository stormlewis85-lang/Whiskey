import { nanoid } from "nanoid";
import {
  Whiskey, InsertWhiskey, UpdateWhiskey, ReviewNote,
  whiskeys, users, User, InsertUser, UpdateUser,
  reviewComments, reviewLikes, priceTracks, marketValues,
  InsertReviewComment, UpdateReviewComment, ReviewComment,
  ReviewLike, InsertReviewLike, PriceTrack, InsertPriceTrack,
  UpdatePriceTrack, MarketValue, InsertMarketValue, UpdateMarketValue,
  // Flight and Blind Tasting imports
  flights, flightWhiskeys, blindTastings, blindTastingWhiskeys,
  Flight, InsertFlight, UpdateFlight,
  FlightWhiskey, InsertFlightWhiskey, UpdateFlightWhiskey,
  BlindTasting, InsertBlindTasting, UpdateBlindTasting,
  BlindTastingWhiskey, InsertBlindTastingWhiskey, UpdateBlindTastingWhiskey,
  BlindTastingStatus,
  // Social features imports
  follows, Follow, UpdateProfile, PublicUser,
  // Distillery imports
  distilleries, Distillery, InsertDistillery, UpdateDistillery,
  // AI usage imports
  aiUsageLogs, AiUsageLog, InsertAiUsageLog,
  // Rick House imports
  generatedScripts, GeneratedScript, InsertGeneratedScript,
  tastingSessions, TastingSession, InsertTastingSession, UpdateTastingSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, asc, desc, sql, ne, count, ilike } from "drizzle-orm";
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
  getUserByToken(token: string): Promise<User | undefined>;
  updateUser(id: number, userData: UpdateUser): Promise<User | undefined>;
  validateUserCredentials(username: string, password: string): Promise<User | undefined>;
  generateAuthToken(userId: number): Promise<string>;
  
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
  
  async getUserByToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.authToken, token));
      
    return user || undefined;
  }
  
  async generateAuthToken(userId: number): Promise<string> {
    // Generate a random token
    const token = Array(30)
      .fill(0)
      .map(() => Math.random().toString(36).charAt(2))
      .join('');
      
    // Set token expiry to 30 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    // Save token to user record
    await db
      .update(users)
      .set({ 
        authToken: token,
        tokenExpiry: expiryDate 
      })
      .where(eq(users.id, userId));
      
    return token;
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
      if (userId === 1) {
        // For Admin (userId 1), show both their own whiskeys and legacy whiskeys with no userId
        query.where(
          or(
            eq(whiskeys.userId, userId),
            // Include whiskeys with null userId (legacy data) only for Admin
            // Using SQL for null check
            sql`${whiskeys.userId} IS NULL`
          )
        );
      } else {
        // For other users, show only their own whiskeys
        query.where(eq(whiskeys.userId, userId));
      }
    }
    
    // Execute the query with ordering
    return query.orderBy(asc(whiskeys.name));
  }
  
  async getWhiskey(id: number, userId?: number): Promise<Whiskey | undefined> {
    // Special handling for Admin user (ID 1)
    if (userId === 1) {
      // For Admin, use a custom WHERE clause to handle NULL values properly
      const [whiskey] = await db
        .select()
        .from(whiskeys)
        .where(
          and(
            eq(whiskeys.id, id),
            or(
              eq(whiskeys.userId, userId),
              sql`${whiskeys.userId} IS NULL`
            )
          )
        );
      return whiskey || undefined;
    }
    
    // Build standard query conditions
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

  // ==================== FLIGHT METHODS ====================

  async getFlights(userId: number): Promise<Flight[]> {
    return db
      .select()
      .from(flights)
      .where(eq(flights.userId, userId))
      .orderBy(desc(flights.createdAt));
  }

  async getFlight(flightId: number, userId: number): Promise<Flight | undefined> {
    const [flight] = await db
      .select()
      .from(flights)
      .where(and(eq(flights.id, flightId), eq(flights.userId, userId)));
    return flight || undefined;
  }

  async getFlightWithWhiskeys(flightId: number, userId: number): Promise<{
    flight: Flight;
    whiskeys: (FlightWhiskey & { whiskey: Whiskey })[];
  } | undefined> {
    const flight = await this.getFlight(flightId, userId);
    if (!flight) return undefined;

    const flightWhiskeyRecords = await db
      .select()
      .from(flightWhiskeys)
      .where(eq(flightWhiskeys.flightId, flightId))
      .orderBy(asc(flightWhiskeys.order));

    const whiskeysWithDetails = await Promise.all(
      flightWhiskeyRecords.map(async (fw) => {
        const [whiskey] = await db
          .select()
          .from(whiskeys)
          .where(eq(whiskeys.id, fw.whiskeyId));
        return { ...fw, whiskey };
      })
    );

    return { flight, whiskeys: whiskeysWithDetails };
  }

  async createFlight(flightData: InsertFlight): Promise<Flight> {
    const [newFlight] = await db
      .insert(flights)
      .values(flightData)
      .returning();
    return newFlight;
  }

  async updateFlight(flightId: number, flightData: UpdateFlight, userId: number): Promise<Flight | undefined> {
    const [updated] = await db
      .update(flights)
      .set({ ...flightData, updatedAt: new Date() })
      .where(and(eq(flights.id, flightId), eq(flights.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteFlight(flightId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(flights)
      .where(and(eq(flights.id, flightId), eq(flights.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async addWhiskeyToFlight(flightId: number, whiskeyId: number, userId: number): Promise<FlightWhiskey | undefined> {
    // Verify flight belongs to user
    const flight = await this.getFlight(flightId, userId);
    if (!flight) return undefined;

    // Get current max order
    const existing = await db
      .select()
      .from(flightWhiskeys)
      .where(eq(flightWhiskeys.flightId, flightId))
      .orderBy(desc(flightWhiskeys.order));

    const nextOrder = existing.length > 0 ? (existing[0].order + 1) : 0;

    const [newFlightWhiskey] = await db
      .insert(flightWhiskeys)
      .values({ flightId, whiskeyId, order: nextOrder })
      .returning();

    return newFlightWhiskey;
  }

  async removeWhiskeyFromFlight(flightWhiskeyId: number, userId: number): Promise<boolean> {
    // Get the flight whiskey to find its flight
    const [fw] = await db
      .select()
      .from(flightWhiskeys)
      .where(eq(flightWhiskeys.id, flightWhiskeyId));

    if (!fw) return false;

    // Verify flight belongs to user
    const flight = await this.getFlight(fw.flightId, userId);
    if (!flight) return false;

    const result = await db
      .delete(flightWhiskeys)
      .where(eq(flightWhiskeys.id, flightWhiskeyId))
      .returning();

    return result.length > 0;
  }

  async updateFlightWhiskey(flightWhiskeyId: number, data: UpdateFlightWhiskey, userId: number): Promise<FlightWhiskey | undefined> {
    // Get the flight whiskey to find its flight
    const [fw] = await db
      .select()
      .from(flightWhiskeys)
      .where(eq(flightWhiskeys.id, flightWhiskeyId));

    if (!fw) return undefined;

    // Verify flight belongs to user
    const flight = await this.getFlight(fw.flightId, userId);
    if (!flight) return undefined;

    const [updated] = await db
      .update(flightWhiskeys)
      .set(data)
      .where(eq(flightWhiskeys.id, flightWhiskeyId))
      .returning();

    return updated || undefined;
  }

  async reorderFlightWhiskeys(flightId: number, whiskeyIds: number[], userId: number): Promise<boolean> {
    // Verify flight belongs to user
    const flight = await this.getFlight(flightId, userId);
    if (!flight) return false;

    // Update order for each whiskey
    await Promise.all(
      whiskeyIds.map((whiskeyId, index) =>
        db
          .update(flightWhiskeys)
          .set({ order: index })
          .where(and(
            eq(flightWhiskeys.flightId, flightId),
            eq(flightWhiskeys.whiskeyId, whiskeyId)
          ))
      )
    );

    return true;
  }

  // ==================== BLIND TASTING METHODS ====================

  async getBlindTastings(userId: number): Promise<BlindTasting[]> {
    return db
      .select()
      .from(blindTastings)
      .where(eq(blindTastings.userId, userId))
      .orderBy(desc(blindTastings.createdAt));
  }

  async getBlindTasting(blindTastingId: number, userId: number): Promise<BlindTasting | undefined> {
    const [bt] = await db
      .select()
      .from(blindTastings)
      .where(and(eq(blindTastings.id, blindTastingId), eq(blindTastings.userId, userId)));
    return bt || undefined;
  }

  async getBlindTastingWithWhiskeys(blindTastingId: number, userId: number): Promise<{
    blindTasting: BlindTasting;
    whiskeys: (BlindTastingWhiskey & { whiskey?: Whiskey })[];
  } | undefined> {
    const bt = await this.getBlindTasting(blindTastingId, userId);
    if (!bt) return undefined;

    const btWhiskeys = await db
      .select()
      .from(blindTastingWhiskeys)
      .where(eq(blindTastingWhiskeys.blindTastingId, blindTastingId))
      .orderBy(asc(blindTastingWhiskeys.order));

    // Only include whiskey details if revealed
    const whiskeysWithDetails = await Promise.all(
      btWhiskeys.map(async (btw) => {
        if (bt.status === 'active') {
          // Don't reveal whiskey identity in active tastings
          return { ...btw, whiskey: undefined };
        }
        const [whiskey] = await db
          .select()
          .from(whiskeys)
          .where(eq(whiskeys.id, btw.whiskeyId));
        return { ...btw, whiskey };
      })
    );

    return { blindTasting: bt, whiskeys: whiskeysWithDetails };
  }

  async createBlindTasting(data: InsertBlindTasting, whiskeyIds: number[]): Promise<BlindTasting> {
    const [newBt] = await db
      .insert(blindTastings)
      .values(data)
      .returning();

    // Shuffle the whiskey IDs and assign labels
    const shuffled = [...whiskeyIds].sort(() => Math.random() - 0.5);
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    await Promise.all(
      shuffled.map((whiskeyId, index) =>
        db.insert(blindTastingWhiskeys).values({
          blindTastingId: newBt.id,
          whiskeyId,
          label: labels[index] || `#${index + 1}`,
          order: index
        })
      )
    );

    return newBt;
  }

  async updateBlindTasting(blindTastingId: number, data: UpdateBlindTasting, userId: number): Promise<BlindTasting | undefined> {
    const [updated] = await db
      .update(blindTastings)
      .set(data)
      .where(and(eq(blindTastings.id, blindTastingId), eq(blindTastings.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteBlindTasting(blindTastingId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(blindTastings)
      .where(and(eq(blindTastings.id, blindTastingId), eq(blindTastings.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async rateBlindTastingWhiskey(
    blindTastingWhiskeyId: number,
    rating: number,
    notes: string | undefined,
    userId: number
  ): Promise<BlindTastingWhiskey | undefined> {
    // Get the blind tasting whiskey to find its blind tasting
    const [btw] = await db
      .select()
      .from(blindTastingWhiskeys)
      .where(eq(blindTastingWhiskeys.id, blindTastingWhiskeyId));

    if (!btw) return undefined;

    // Verify blind tasting belongs to user and is active
    const bt = await this.getBlindTasting(btw.blindTastingId, userId);
    if (!bt || bt.status !== 'active') return undefined;

    const [updated] = await db
      .update(blindTastingWhiskeys)
      .set({ blindRating: rating, blindNotes: notes })
      .where(eq(blindTastingWhiskeys.id, blindTastingWhiskeyId))
      .returning();

    return updated || undefined;
  }

  async revealBlindTasting(blindTastingId: number, userId: number): Promise<BlindTasting | undefined> {
    const bt = await this.getBlindTasting(blindTastingId, userId);
    if (!bt || bt.status !== 'active') return undefined;

    const now = new Date();

    // Update blind tasting status
    const [updated] = await db
      .update(blindTastings)
      .set({ status: 'revealed' as BlindTastingStatus, revealedAt: now })
      .where(eq(blindTastings.id, blindTastingId))
      .returning();

    // Mark all whiskeys as revealed
    await db
      .update(blindTastingWhiskeys)
      .set({ revealedAt: now })
      .where(eq(blindTastingWhiskeys.blindTastingId, blindTastingId));

    return updated || undefined;
  }

  async completeBlindTasting(blindTastingId: number, userId: number): Promise<BlindTasting | undefined> {
    const bt = await this.getBlindTasting(blindTastingId, userId);
    if (!bt || bt.status !== 'revealed') return undefined;

    const [updated] = await db
      .update(blindTastings)
      .set({ status: 'completed' as BlindTastingStatus, completedAt: new Date() })
      .where(eq(blindTastings.id, blindTastingId))
      .returning();

    return updated || undefined;
  }

  // ==================== FLAVOR EXTRACTION ====================

  extractFlavorTags(whiskey: Whiskey): string[] {
    const flavors = new Set<string>();

    if (!Array.isArray(whiskey.notes)) return [];

    for (const review of whiskey.notes) {
      // Extract from nose aromas
      if (Array.isArray(review.noseAromas)) {
        review.noseAromas.forEach((f: string) => flavors.add(f));
      }
      // Extract from taste flavors
      if (Array.isArray(review.tasteFlavors)) {
        review.tasteFlavors.forEach((f: string) => flavors.add(f));
      }
      // Extract from finish flavors
      if (Array.isArray(review.finishFlavors)) {
        review.finishFlavors.forEach((f: string) => flavors.add(f));
      }
    }

    return Array.from(flavors);
  }

  getTopFlavors(whiskey: Whiskey, limit: number = 5): string[] {
    const flavorCounts = new Map<string, number>();

    if (!Array.isArray(whiskey.notes)) return [];

    for (const review of whiskey.notes) {
      const allFlavors = [
        ...(review.noseAromas || []),
        ...(review.tasteFlavors || []),
        ...(review.finishFlavors || [])
      ];

      for (const flavor of allFlavors) {
        flavorCounts.set(flavor, (flavorCounts.get(flavor) || 0) + 1);
      }
    }

    return Array.from(flavorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([flavor]) => flavor);
  }

  async getWhiskeysWithFlavor(flavor: string, userId: number): Promise<Whiskey[]> {
    const allWhiskeys = await this.getWhiskeys(userId);

    return allWhiskeys.filter(whiskey => {
      const flavors = this.extractFlavorTags(whiskey);
      return flavors.some(f => f.toLowerCase().includes(flavor.toLowerCase()));
    });
  }

  async getAllUserFlavors(userId: number): Promise<{ flavor: string; count: number }[]> {
    const allWhiskeys = await this.getWhiskeys(userId);
    const flavorCounts = new Map<string, number>();

    for (const whiskey of allWhiskeys) {
      const flavors = this.extractFlavorTags(whiskey);
      for (const flavor of flavors) {
        flavorCounts.set(flavor, (flavorCounts.get(flavor) || 0) + 1);
      }
    }

    return Array.from(flavorCounts.entries())
      .map(([flavor, count]) => ({ flavor, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ==================== PALATE PROFILE (Rick House) ====================

  /**
   * Get a user's palate profile for Rick House personalization
   * Returns their most-used flavor tags, scoring tendencies, and review count
   */
  async getPalateProfile(userId: number): Promise<{
    userId: number;
    reviewCount: number;
    topFlavors: {
      nose: { flavor: string; count: number }[];
      taste: { flavor: string; count: number }[];
      finish: { flavor: string; count: number }[];
      all: { flavor: string; count: number }[];
    };
    scoringTendencies: {
      averageOverall: number | null;
      averageNose: number | null;
      averageMouthfeel: number | null;
      averageTaste: number | null;
      averageFinish: number | null;
      averageValue: number | null;
      tendency: 'generous' | 'critical' | 'balanced';
    };
    preferredTypes: { type: string; count: number }[];
    preferredDistilleries: { distillery: string; count: number }[];
  }> {
    const userWhiskeys = await this.getWhiskeys(userId);

    // Collect all reviews from user's whiskeys
    const allReviews: ReviewNote[] = [];
    for (const whiskey of userWhiskeys) {
      if (Array.isArray(whiskey.notes)) {
        allReviews.push(...(whiskey.notes as ReviewNote[]));
      }
    }

    // Count flavors by category
    const noseFlavors = new Map<string, number>();
    const tasteFlavors = new Map<string, number>();
    const finishFlavors = new Map<string, number>();
    const allFlavors = new Map<string, number>();

    // Score accumulators
    const scores = {
      overall: [] as number[],
      nose: [] as number[],
      mouthfeel: [] as number[],
      taste: [] as number[],
      finish: [] as number[],
      value: [] as number[],
    };

    for (const review of allReviews) {
      // Collect flavors
      if (Array.isArray(review.noseAromas)) {
        review.noseAromas.forEach((f: string) => {
          noseFlavors.set(f, (noseFlavors.get(f) || 0) + 1);
          allFlavors.set(f, (allFlavors.get(f) || 0) + 1);
        });
      }
      if (Array.isArray(review.tasteFlavors)) {
        review.tasteFlavors.forEach((f: string) => {
          tasteFlavors.set(f, (tasteFlavors.get(f) || 0) + 1);
          allFlavors.set(f, (allFlavors.get(f) || 0) + 1);
        });
      }
      if (Array.isArray(review.finishFlavors)) {
        review.finishFlavors.forEach((f: string) => {
          finishFlavors.set(f, (finishFlavors.get(f) || 0) + 1);
          allFlavors.set(f, (allFlavors.get(f) || 0) + 1);
        });
      }

      // Collect scores
      if (typeof review.rating === 'number') scores.overall.push(review.rating);
      if (typeof review.noseScore === 'number') scores.nose.push(review.noseScore);
      if (typeof review.mouthfeelScore === 'number') scores.mouthfeel.push(review.mouthfeelScore);
      if (typeof review.tasteScore === 'number') scores.taste.push(review.tasteScore);
      if (typeof review.finishScore === 'number') scores.finish.push(review.finishScore);
      if (typeof review.valueScore === 'number') scores.value.push(review.valueScore);
    }

    // Helper to calculate average
    const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

    // Helper to get top N flavors
    const getTopFlavors = (map: Map<string, number>, n: number = 10) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([flavor, count]) => ({ flavor, count }));

    // Determine scoring tendency
    const avgOverall = avg(scores.overall);
    let tendency: 'generous' | 'critical' | 'balanced' = 'balanced';
    if (avgOverall !== null) {
      if (avgOverall >= 85) tendency = 'generous';
      else if (avgOverall <= 70) tendency = 'critical';
    }

    // Get type preferences
    const typeCounts = new Map<string, number>();
    for (const w of userWhiskeys) {
      if (w.type && (w.rating || 0) >= 70) {
        typeCounts.set(w.type, (typeCounts.get(w.type) || 0) + 1);
      }
    }
    const preferredTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Get distillery preferences
    const distilleryCounts = new Map<string, number>();
    for (const w of userWhiskeys) {
      if (w.distillery && (w.rating || 0) >= 70) {
        distilleryCounts.set(w.distillery, (distilleryCounts.get(w.distillery) || 0) + 1);
      }
    }
    const preferredDistilleries = Array.from(distilleryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([distillery, count]) => ({ distillery, count }));

    return {
      userId,
      reviewCount: allReviews.length,
      topFlavors: {
        nose: getTopFlavors(noseFlavors),
        taste: getTopFlavors(tasteFlavors),
        finish: getTopFlavors(finishFlavors),
        all: getTopFlavors(allFlavors),
      },
      scoringTendencies: {
        averageOverall: avgOverall,
        averageNose: avg(scores.nose),
        averageMouthfeel: avg(scores.mouthfeel),
        averageTaste: avg(scores.taste),
        averageFinish: avg(scores.finish),
        averageValue: avg(scores.value),
        tendency,
      },
      preferredTypes,
      preferredDistilleries,
    };
  }

  // ==================== COMMUNITY NOTES (Rick House) ====================

  /**
   * Get aggregated community notes for a whiskey
   * Finds all whiskeys with same name across all users and aggregates reviews
   */
  async getCommunityNotes(whiskeyId: number): Promise<{
    whiskeyName: string;
    distillery: string | null;
    totalReviews: number;
    averageScores: {
      overall: number | null;
      nose: number | null;
      mouthfeel: number | null;
      taste: number | null;
      finish: number | null;
      value: number | null;
    };
    topFlavors: {
      nose: { flavor: string; count: number }[];
      taste: { flavor: string; count: number }[];
      finish: { flavor: string; count: number }[];
    };
    commonNotes: string[];
  } | null> {
    // Get the target whiskey to find its name
    const [targetWhiskey] = await db
      .select()
      .from(whiskeys)
      .where(eq(whiskeys.id, whiskeyId));

    if (!targetWhiskey) return null;

    // Find all whiskeys with the same name (case-insensitive) across all users
    const communityWhiskeys = await db
      .select()
      .from(whiskeys)
      .where(ilike(whiskeys.name, targetWhiskey.name));

    // Aggregate all reviews
    const allReviews: ReviewNote[] = [];
    for (const w of communityWhiskeys) {
      if (Array.isArray(w.notes)) {
        allReviews.push(...(w.notes as ReviewNote[]));
      }
    }

    if (allReviews.length === 0) {
      return {
        whiskeyName: targetWhiskey.name,
        distillery: targetWhiskey.distillery,
        totalReviews: 0,
        averageScores: {
          overall: null,
          nose: null,
          mouthfeel: null,
          taste: null,
          finish: null,
          value: null,
        },
        topFlavors: { nose: [], taste: [], finish: [] },
        commonNotes: [],
      };
    }

    // Calculate average scores
    const scores = {
      overall: [] as number[],
      nose: [] as number[],
      mouthfeel: [] as number[],
      taste: [] as number[],
      finish: [] as number[],
      value: [] as number[],
    };

    const noseFlavors = new Map<string, number>();
    const tasteFlavors = new Map<string, number>();
    const finishFlavors = new Map<string, number>();
    const noteTexts: string[] = [];

    for (const review of allReviews) {
      // Collect scores
      if (typeof review.rating === 'number') scores.overall.push(review.rating);
      if (typeof review.noseScore === 'number') scores.nose.push(review.noseScore);
      if (typeof review.mouthfeelScore === 'number') scores.mouthfeel.push(review.mouthfeelScore);
      if (typeof review.tasteScore === 'number') scores.taste.push(review.tasteScore);
      if (typeof review.finishScore === 'number') scores.finish.push(review.finishScore);
      if (typeof review.valueScore === 'number') scores.value.push(review.valueScore);

      // Collect flavors
      if (Array.isArray(review.noseAromas)) {
        review.noseAromas.forEach((f: string) => noseFlavors.set(f, (noseFlavors.get(f) || 0) + 1));
      }
      if (Array.isArray(review.tasteFlavors)) {
        review.tasteFlavors.forEach((f: string) => tasteFlavors.set(f, (tasteFlavors.get(f) || 0) + 1));
      }
      if (Array.isArray(review.finishFlavors)) {
        review.finishFlavors.forEach((f: string) => finishFlavors.set(f, (finishFlavors.get(f) || 0) + 1));
      }

      // Collect note texts
      if (review.text) noteTexts.push(review.text);
      if (review.noseNotes) noteTexts.push(review.noseNotes);
      if (review.tasteNotes) noteTexts.push(review.tasteNotes);
      if (review.finishNotes) noteTexts.push(review.finishNotes);
    }

    // Helper to calculate average
    const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

    // Helper to get top N flavors
    const getTopFlavors = (map: Map<string, number>, n: number = 5) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([flavor, count]) => ({ flavor, count }));

    return {
      whiskeyName: targetWhiskey.name,
      distillery: targetWhiskey.distillery,
      totalReviews: allReviews.length,
      averageScores: {
        overall: avg(scores.overall),
        nose: avg(scores.nose),
        mouthfeel: avg(scores.mouthfeel),
        taste: avg(scores.taste),
        finish: avg(scores.finish),
        value: avg(scores.value),
      },
      topFlavors: {
        nose: getTopFlavors(noseFlavors),
        taste: getTopFlavors(tasteFlavors),
        finish: getTopFlavors(finishFlavors),
      },
      commonNotes: noteTexts.slice(0, 10), // Return up to 10 sample notes
    };
  }

  // ==================== RECOMMENDATIONS ====================

  async getRecommendations(userId: number, limit: number = 5): Promise<{
    whiskey: Whiskey;
    reason: string;
    score: number;
  }[]> {
    const userWhiskeys = await this.getWhiskeys(userId);
    if (userWhiskeys.length === 0) return [];

    // Get highly rated whiskeys (4+ rating)
    const topRated = userWhiskeys.filter(w => (w.rating || 0) >= 4);

    // Get favorite distilleries
    const distilleryCounts = new Map<string, number>();
    for (const w of topRated) {
      if (w.distillery) {
        distilleryCounts.set(w.distillery, (distilleryCounts.get(w.distillery) || 0) + 1);
      }
    }
    const topDistilleries = Array.from(distilleryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([d]) => d);

    // Get favorite types
    const typeCounts = new Map<string, number>();
    for (const w of topRated) {
      if (w.type) {
        typeCounts.set(w.type, (typeCounts.get(w.type) || 0) + 1);
      }
    }
    const topTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([t]) => t);

    // Get user's flavor preferences
    const userFlavors = await this.getAllUserFlavors(userId);
    const topFlavors = userFlavors.slice(0, 10).map(f => f.flavor);

    // Find whiskeys user doesn't have that match their preferences
    const userWhiskeyIds = new Set(userWhiskeys.map(w => w.id));
    const recommendations: { whiskey: Whiskey; reason: string; score: number }[] = [];

    // For now, recommend based on same distillery or type from user's collection
    // In a real app, you'd query a broader database of whiskeys
    for (const whiskey of userWhiskeys) {
      // Skip if already reviewed (has notes)
      if (Array.isArray(whiskey.notes) && whiskey.notes.length > 0) continue;

      // Skip wishlisted items - they're already on the radar
      if (whiskey.isWishlist) continue;

      let score = 0;
      let reason = '';

      // Check distillery match
      if (whiskey.distillery && topDistilleries.includes(whiskey.distillery)) {
        score += 3;
        reason = `From ${whiskey.distillery}, one of your favorites`;
      }

      // Check type match
      if (whiskey.type && topTypes.includes(whiskey.type)) {
        score += 2;
        if (!reason) reason = `You enjoy ${whiskey.type} whiskeys`;
      }

      // Check flavor match
      const whiskeyFlavors = this.extractFlavorTags(whiskey);
      const matchingFlavors = whiskeyFlavors.filter(f => topFlavors.includes(f));
      if (matchingFlavors.length > 0) {
        score += matchingFlavors.length;
        if (!reason) reason = `Similar flavor profile: ${matchingFlavors.slice(0, 3).join(', ')}`;
      }

      if (score > 0 && reason) {
        recommendations.push({ whiskey, reason, score });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getSimilarWhiskeys(whiskeyId: number, userId: number, limit: number = 5): Promise<{
    whiskey: Whiskey;
    reason: string;
    matchScore: number;
  }[]> {
    const targetWhiskey = await this.getWhiskey(whiskeyId, userId);
    if (!targetWhiskey) return [];

    const userWhiskeys = await this.getWhiskeys(userId);
    const targetFlavors = this.extractFlavorTags(targetWhiskey);

    const similar: { whiskey: Whiskey; reason: string; matchScore: number }[] = [];

    for (const whiskey of userWhiskeys) {
      if (whiskey.id === whiskeyId) continue;

      let matchScore = 0;
      const reasons: string[] = [];

      // Same distillery
      if (targetWhiskey.distillery && whiskey.distillery === targetWhiskey.distillery) {
        matchScore += 5;
        reasons.push('Same distillery');
      }

      // Same type
      if (targetWhiskey.type && whiskey.type === targetWhiskey.type) {
        matchScore += 3;
        reasons.push(`Also a ${whiskey.type}`);
      }

      // Similar age (within 3 years)
      if (targetWhiskey.age && whiskey.age && Math.abs(targetWhiskey.age - whiskey.age) <= 3) {
        matchScore += 2;
        reasons.push('Similar age');
      }

      // Similar ABV (within 5%)
      if (targetWhiskey.abv && whiskey.abv && Math.abs(targetWhiskey.abv - whiskey.abv) <= 5) {
        matchScore += 1;
        reasons.push('Similar strength');
      }

      // Similar price (within 30%)
      if (targetWhiskey.price && whiskey.price) {
        const priceDiff = Math.abs(targetWhiskey.price - whiskey.price) / targetWhiskey.price;
        if (priceDiff <= 0.3) {
          matchScore += 1;
          reasons.push('Similar price range');
        }
      }

      // Flavor overlap
      const whiskeyFlavors = this.extractFlavorTags(whiskey);
      const overlap = targetFlavors.filter(f => whiskeyFlavors.includes(f));
      if (overlap.length > 0) {
        matchScore += overlap.length;
        reasons.push(`Shared flavors: ${overlap.slice(0, 3).join(', ')}`);
      }

      if (matchScore > 0) {
        similar.push({
          whiskey,
          reason: reasons[0] || 'Similar characteristics',
          matchScore
        });
      }
    }

    return similar
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  // ==================== PROFILE METHODS ====================

  async getUserByProfileSlug(slug: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.profileSlug, slug), eq(users.isPublic, true)));
    return user || undefined;
  }

  async getPublicProfile(userId: number): Promise<{
    user: PublicUser;
    stats: {
      totalBottles: number;
      uniqueBottles: number;
      averageRating: number;
      topTypes: { type: string; count: number }[];
      topDistilleries: { distillery: string; count: number }[];
    };
    followersCount: number;
    followingCount: number;
  } | undefined> {
    const user = await this.getUser(userId);
    if (!user || !user.isPublic) return undefined;

    // Get public whiskeys
    const userWhiskeys = await db
      .select()
      .from(whiskeys)
      .where(and(
        eq(whiskeys.userId, userId),
        eq(whiskeys.isPublic, true),
        eq(whiskeys.isWishlist, false)
      ));

    // Calculate stats
    const totalBottles = userWhiskeys.reduce((sum, w) => sum + (w.quantity || 1), 0);
    const uniqueBottles = userWhiskeys.length;
    const ratingsSum = userWhiskeys.reduce((sum, w) => sum + (w.rating || 0), 0);
    const ratedCount = userWhiskeys.filter(w => w.rating && w.rating > 0).length;
    const averageRating = ratedCount > 0 ? ratingsSum / ratedCount : 0;

    // Get top types
    const typeCounts = new Map<string, number>();
    userWhiskeys.forEach(w => {
      if (w.type) {
        typeCounts.set(w.type, (typeCounts.get(w.type) || 0) + 1);
      }
    });
    const topTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Get top distilleries
    const distilleryCounts = new Map<string, number>();
    userWhiskeys.forEach(w => {
      if (w.distillery) {
        distilleryCounts.set(w.distillery, (distilleryCounts.get(w.distillery) || 0) + 1);
      }
    });
    const topDistilleries = Array.from(distilleryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([distillery, count]) => ({ distillery, count }));

    // Get follow counts
    const followersCount = await this.getFollowersCount(userId);
    const followingCount = await this.getFollowingCount(userId);

    const publicUser: PublicUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      profileImage: user.profileImage,
      bio: user.bio,
      profileSlug: user.profileSlug,
      createdAt: user.createdAt,
    };

    return {
      user: publicUser,
      stats: {
        totalBottles,
        uniqueBottles,
        averageRating,
        topTypes,
        topDistilleries,
      },
      followersCount,
      followingCount,
    };
  }

  async getPublicWhiskeys(userId: number, includeWishlist: boolean = false): Promise<Whiskey[]> {
    const conditions = [
      eq(whiskeys.userId, userId),
      eq(whiskeys.isPublic, true),
    ];

    if (!includeWishlist) {
      conditions.push(eq(whiskeys.isWishlist, false));
    }

    return db
      .select()
      .from(whiskeys)
      .where(and(...conditions))
      .orderBy(desc(whiskeys.rating));
  }

  async updateProfile(userId: number, profileData: UpdateProfile): Promise<User | undefined> {
    // If updating profileSlug, check it's not taken
    if (profileData.profileSlug) {
      const existing = await db
        .select()
        .from(users)
        .where(and(
          eq(users.profileSlug, profileData.profileSlug),
          ne(users.id, userId)
        ));
      if (existing.length > 0) {
        throw new Error("Profile URL is already taken");
      }
    }

    const [updated] = await db
      .update(users)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return updated || undefined;
  }

  async setWhiskeyPublic(whiskeyId: number, isPublic: boolean, userId: number): Promise<Whiskey | undefined> {
    const [updated] = await db
      .update(whiskeys)
      .set({ isPublic })
      .where(and(eq(whiskeys.id, whiskeyId), eq(whiskeys.userId, userId)))
      .returning();

    return updated || undefined;
  }

  // ==================== FOLLOW METHODS ====================

  async followUser(followerId: number, followingId: number): Promise<Follow | undefined> {
    // Can't follow yourself
    if (followerId === followingId) return undefined;

    // Check if target user exists and is public
    const targetUser = await this.getUser(followingId);
    if (!targetUser || !targetUser.isPublic) return undefined;

    // Check if already following
    const existing = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));

    if (existing.length > 0) return existing[0];

    const [newFollow] = await db
      .insert(follows)
      .values({ followerId, followingId })
      .returning();

    return newFollow;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const result = await db
      .delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ))
      .returning();

    return result.length > 0;
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));

    return result.length > 0;
  }

  async getFollowers(userId: number): Promise<PublicUser[]> {
    const followerRecords = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId))
      .orderBy(desc(follows.createdAt));

    const followerUsers = await Promise.all(
      followerRecords.map(async (f) => {
        const user = await this.getUser(f.followerId);
        if (!user) return null;
        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          profileImage: user.profileImage,
          bio: user.bio,
          profileSlug: user.profileSlug,
          createdAt: user.createdAt,
        } as PublicUser;
      })
    );

    return followerUsers.filter((u): u is PublicUser => u !== null);
  }

  async getFollowing(userId: number): Promise<PublicUser[]> {
    const followingRecords = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt));

    const followingUsers = await Promise.all(
      followingRecords.map(async (f) => {
        const user = await this.getUser(f.followingId);
        if (!user) return null;
        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          profileImage: user.profileImage,
          bio: user.bio,
          profileSlug: user.profileSlug,
          createdAt: user.createdAt,
        } as PublicUser;
      })
    );

    return followingUsers.filter((u): u is PublicUser => u !== null);
  }

  async getFollowersCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));

    return result[0]?.count || 0;
  }

  async getFollowingCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return result[0]?.count || 0;
  }

  async getFollowingFeed(userId: number, limit: number = 20): Promise<Array<{
    whiskey: Whiskey;
    review: ReviewNote;
    user: PublicUser;
  }>> {
    // Get who the user is following
    const followingRecords = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followingIds = followingRecords.map(f => f.followingId);

    if (followingIds.length === 0) return [];

    // Get public reviews from followed users
    const results: Array<{ whiskey: Whiskey; review: ReviewNote; user: PublicUser }> = [];

    for (const followedId of followingIds) {
      const followedUser = await this.getUser(followedId);
      if (!followedUser) continue;

      const publicWhiskeys = await this.getPublicWhiskeys(followedId);

      for (const whiskey of publicWhiskeys) {
        if (!Array.isArray(whiskey.notes)) continue;

        for (const review of whiskey.notes) {
          if (review.isPublic) {
            results.push({
              whiskey,
              review,
              user: {
                id: followedUser.id,
                username: followedUser.username,
                displayName: followedUser.displayName,
                profileImage: followedUser.profileImage,
                bio: followedUser.bio,
                profileSlug: followedUser.profileSlug,
                createdAt: followedUser.createdAt,
              },
            });
          }
        }
      }
    }

    // Sort by review date and limit
    return results
      .sort((a, b) => new Date(b.review.date).getTime() - new Date(a.review.date).getTime())
      .slice(0, limit);
  }

  async getSuggestedUsers(userId: number, limit: number = 5): Promise<PublicUser[]> {
    // Get all public users except current user and already following
    const followingRecords = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followingIds = new Set(followingRecords.map(f => f.followingId));
    followingIds.add(userId); // Exclude self

    const publicUsers = await db
      .select()
      .from(users)
      .where(eq(users.isPublic, true));

    const suggestions = publicUsers
      .filter(u => !followingIds.has(u.id))
      .slice(0, limit)
      .map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        profileImage: u.profileImage,
        bio: u.bio,
        profileSlug: u.profileSlug,
        createdAt: u.createdAt,
      }));

    return suggestions;
  }

  // ==================== DISTILLERY METHODS ====================

  async getDistilleries(search?: string): Promise<Distillery[]> {
    if (search) {
      return db
        .select()
        .from(distilleries)
        .where(
          or(
            ilike(distilleries.name, `%${search}%`),
            ilike(distilleries.location, `%${search}%`),
            ilike(distilleries.parentCompany, `%${search}%`),
            ilike(distilleries.country, `%${search}%`),
            ilike(distilleries.region, `%${search}%`)
          )
        )
        .orderBy(asc(distilleries.name));
    }

    return db
      .select()
      .from(distilleries)
      .orderBy(asc(distilleries.name));
  }

  async getDistillery(id: number): Promise<Distillery | undefined> {
    const [distillery] = await db
      .select()
      .from(distilleries)
      .where(eq(distilleries.id, id));

    return distillery || undefined;
  }

  async getDistilleryWhiskeys(distilleryId: number, userId: number): Promise<Whiskey[]> {
    return db
      .select()
      .from(whiskeys)
      .where(
        and(
          eq(whiskeys.distilleryId, distilleryId),
          eq(whiskeys.userId, userId)
        )
      )
      .orderBy(asc(whiskeys.name));
  }

  async createDistillery(data: InsertDistillery): Promise<Distillery> {
    const [newDistillery] = await db
      .insert(distilleries)
      .values(data)
      .returning();

    return newDistillery;
  }

  async updateDistillery(id: number, data: UpdateDistillery): Promise<Distillery | undefined> {
    const [updated] = await db
      .update(distilleries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(distilleries.id, id))
      .returning();

    return updated || undefined;
  }

  // ==================== AI USAGE TRACKING ====================

  async logAiUsage(userId: number, endpoint: string, whiskeyId?: number): Promise<AiUsageLog> {
    const [log] = await db
      .insert(aiUsageLogs)
      .values({
        userId,
        endpoint,
        whiskeyId: whiskeyId || null,
      })
      .returning();

    return log;
  }

  async getAiUsageCountToday(userId: number): Promise<number> {
    // Get count of AI calls made by user today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db
      .select({ count: count() })
      .from(aiUsageLogs)
      .where(
        and(
          eq(aiUsageLogs.userId, userId),
          sql`${aiUsageLogs.createdAt} >= ${today}`
        )
      );

    return result[0]?.count || 0;
  }

  async canUseAi(userId: number, dailyLimit: number = 10): Promise<{ allowed: boolean; remaining: number }> {
    const usedToday = await this.getAiUsageCountToday(userId);
    const remaining = Math.max(0, dailyLimit - usedToday);
    return {
      allowed: remaining > 0,
      remaining
    };
  }

  // ==================== RICK HOUSE SCRIPT CACHING ====================

  /**
   * Get cached script for a whiskey if valid
   * Cache is valid if: <7 days old AND review count unchanged
   */
  async getCachedScript(whiskeyId: number, mode: 'guided' | 'notes'): Promise<GeneratedScript | null> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get the cached script
    const [cached] = await db
      .select()
      .from(generatedScripts)
      .where(eq(generatedScripts.whiskeyId, whiskeyId))
      .orderBy(desc(generatedScripts.generatedAt))
      .limit(1);

    if (!cached) return null;

    // Check if cache is expired (>7 days old)
    if (cached.generatedAt && cached.generatedAt < sevenDaysAgo) {
      return null;
    }

    // Check if review count has changed
    const communityNotes = await this.getCommunityNotes(whiskeyId);
    const currentReviewCount = communityNotes?.totalReviews || 0;

    if (cached.reviewCountAtGeneration !== currentReviewCount) {
      return null;
    }

    // Check if the cached script is for the requested mode
    const scriptJson = cached.scriptJson as { mode?: string } | null;
    if (scriptJson?.mode && scriptJson.mode !== mode) {
      return null;
    }

    return cached;
  }

  /**
   * Save a generated script to cache
   */
  async saveScriptCache(
    whiskeyId: number,
    scriptJson: Record<string, unknown>,
    mode: 'guided' | 'notes'
  ): Promise<GeneratedScript> {
    // Get current review count
    const communityNotes = await this.getCommunityNotes(whiskeyId);
    const reviewCount = communityNotes?.totalReviews || 0;

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Delete any existing cache for this whiskey
    await db
      .delete(generatedScripts)
      .where(eq(generatedScripts.whiskeyId, whiskeyId));

    // Insert new cache entry
    const [newCache] = await db
      .insert(generatedScripts)
      .values({
        whiskeyId,
        scriptJson: { ...scriptJson, mode },
        reviewCountAtGeneration: reviewCount,
        expiresAt,
      })
      .returning();

    return newCache;
  }

  /**
   * Invalidate cache for a whiskey (call when reviews change)
   */
  async invalidateScriptCache(whiskeyId: number): Promise<void> {
    await db
      .delete(generatedScripts)
      .where(eq(generatedScripts.whiskeyId, whiskeyId));
  }

  // ==================== RICK HOUSE TASTING SESSIONS ====================

  /**
   * Create a new tasting session
   */
  async createTastingSession(data: InsertTastingSession): Promise<TastingSession> {
    const [session] = await db
      .insert(tastingSessions)
      .values(data)
      .returning();

    return session;
  }

  /**
   * Get a tasting session by ID
   */
  async getTastingSession(sessionId: number, userId: number): Promise<TastingSession | null> {
    const [session] = await db
      .select()
      .from(tastingSessions)
      .where(
        and(
          eq(tastingSessions.id, sessionId),
          eq(tastingSessions.userId, userId)
        )
      );

    return session || null;
  }

  /**
   * Get all tasting sessions for a user
   */
  async getUserTastingSessions(userId: number): Promise<TastingSession[]> {
    return db
      .select()
      .from(tastingSessions)
      .where(eq(tastingSessions.userId, userId))
      .orderBy(desc(tastingSessions.createdAt));
  }

  /**
   * Update a tasting session
   */
  async updateTastingSession(
    sessionId: number,
    userId: number,
    data: UpdateTastingSession
  ): Promise<TastingSession | null> {
    const [updated] = await db
      .update(tastingSessions)
      .set(data)
      .where(
        and(
          eq(tastingSessions.id, sessionId),
          eq(tastingSessions.userId, userId)
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Complete a tasting session
   */
  async completeTastingSession(sessionId: number, userId: number): Promise<TastingSession | null> {
    return this.updateTastingSession(sessionId, userId, {
      completedAt: new Date()
    });
  }
}

export const storage = new DatabaseStorage();