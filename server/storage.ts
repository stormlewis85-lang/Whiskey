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
  tastingSessions, TastingSession, InsertTastingSession, UpdateTastingSession,
  // Hunt imports
  stores, Store, InsertStore, UpdateStore,
  storeFollows, StoreFollow,
  drops, Drop, InsertDrop, UpdateDrop,
  notifications, Notification,
  // Phase 2: Store Profiles imports
  storeClaims, StoreClaim, InsertStoreClaim,
  storeViews, StoreView,
  UpdateStoreProfile,
  // Phase 3: Tasting Clubs imports
  clubs, Club, InsertClub, UpdateClub,
  clubMembers, ClubMember, ClubRole, ClubMemberStatus,
  clubSessions, ClubSession, InsertClubSession, ClubSessionStatus,
  clubSessionWhiskeys, ClubSessionWhiskey,
  clubSessionRatings, ClubSessionRating, InsertClubSessionRating,
  // Phase 4: Social Layer imports
  activities, Activity, InsertActivity, ActivityType,
  tradeListings, TradeListing, InsertTradeListing, UpdateTradeListing, TradeStatus,
  // Phase 5: Palate Development imports
  challenges, Challenge, InsertChallenge,
  userChallenges, UserChallenge,
  userProgress, UserProgress,
  palateExercises, PalateExercise,
  getLevelForXP, XP_LEVELS
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, asc, desc, sql, ne, count, ilike } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Admin user ID — configurable via environment variable, defaults to 1
const ADMIN_USER_ID = parseInt(process.env.ADMIN_USER_ID || '1', 10);

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
  getUserByEmail(email: string): Promise<User | undefined>;
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

  // Account management
  deleteUser(userId: number): Promise<boolean>;

  // Hunt: Stores
  getStores(search?: string, limit?: number, offset?: number): Promise<Store[]>;
  getStore(id: number): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: UpdateStore): Promise<Store | undefined>;

  // Hunt: Store follows
  followStore(userId: number, storeId: number): Promise<StoreFollow | undefined>;
  unfollowStore(userId: number, storeId: number): Promise<boolean>;
  isFollowingStore(userId: number, storeId: number): Promise<boolean>;
  getFollowedStores(userId: number): Promise<(Store & { followerCount: number })[]>;
  getStoreFollowerCount(storeId: number): Promise<number>;

  // Hunt: Drops
  getDrops(options: { storeId?: number; status?: string; limit?: number; offset?: number }): Promise<(Drop & { store: Store })[]>;
  getDrop(id: number): Promise<(Drop & { store: Store }) | undefined>;
  createDrop(drop: InsertDrop): Promise<Drop>;
  updateDrop(id: number, update: UpdateDrop, userId: number): Promise<Drop | undefined>;
  getDropsForFollowedStores(userId: number, limit?: number, offset?: number): Promise<(Drop & { store: Store })[]>;
  getWishlistMatchingDrops(userId: number, limit?: number, offset?: number): Promise<(Drop & { store: Store })[]>;

  // Hunt: Notifications
  getNotifications(userId: number, limit?: number, offset?: number): Promise<Notification[]>;
  createNotification(notification: { userId: number; type: string; title: string; message: string; data?: any }): Promise<Notification>;
  markNotificationRead(id: number, userId: number): Promise<boolean>;
  markAllNotificationsRead(userId: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;

  // Phase 2: Store Profiles
  getStoreProfile(storeId: number): Promise<any>;
  updateStoreProfile(storeId: number, data: UpdateStoreProfile, userId: number): Promise<Store | undefined>;

  // Phase 2: Store Claims
  createStoreClaim(claim: InsertStoreClaim): Promise<StoreClaim>;
  getStoreClaims(storeId?: number, status?: string): Promise<StoreClaim[]>;
  approveStoreClaim(claimId: number, reviewerId: number, reviewNote?: string): Promise<StoreClaim | undefined>;
  rejectStoreClaim(claimId: number, reviewerId: number, reviewNote?: string): Promise<StoreClaim | undefined>;

  // Phase 2: Store Analytics
  recordStoreView(storeId: number, viewedBy?: number): Promise<void>;
  getStoreAnalytics(storeId: number, days?: number): Promise<{
    totalViews: number;
    viewsByDay: { date: string; count: number }[];
    followerCount: number;
    dropCount: number;
    recentDrops: Drop[];
  }>;

  // Phase 3: Tasting Clubs
  createClub(data: InsertClub): Promise<Club>;
  getClub(id: number): Promise<Club | undefined>;
  getUserClubs(userId: number): Promise<Club[]>;
  updateClub(id: number, data: UpdateClub, userId: number): Promise<Club | undefined>;
  deleteClub(id: number, userId: number): Promise<boolean>;
  getClubMembers(clubId: number): Promise<(ClubMember & { user: Pick<User, 'id' | 'username' | 'displayName' | 'profileImage'> })[]>;
  inviteMember(clubId: number, targetUserId: number, inviterId: number): Promise<ClubMember | undefined>;
  acceptInvite(clubId: number, userId: number): Promise<ClubMember | undefined>;
  declineInvite(clubId: number, userId: number): Promise<boolean>;
  removeMember(clubId: number, targetUserId: number, adminId: number): Promise<boolean>;
  updateMemberRole(clubId: number, targetUserId: number, role: ClubRole, adminId: number): Promise<ClubMember | undefined>;
  getPendingInvites(userId: number): Promise<(ClubMember & { club: Club })[]>;
  createClubSession(data: InsertClubSession): Promise<ClubSession>;
  getClubSessions(clubId: number): Promise<ClubSession[]>;
  getClubSessionWithWhiskeys(sessionId: number, userId: number): Promise<any>;
  addWhiskeyToSession(sessionId: number, whiskeyId: number, userId: number): Promise<ClubSessionWhiskey | undefined>;
  removeWhiskeyFromSession(sessionWhiskeyId: number, userId: number): Promise<boolean>;
  startClubSession(sessionId: number, userId: number): Promise<ClubSession | undefined>;
  revealClubSession(sessionId: number, userId: number): Promise<ClubSession | undefined>;
  completeClubSession(sessionId: number, userId: number): Promise<ClubSession | undefined>;
  submitClubRating(sessionWhiskeyId: number, userId: number, data: InsertClubSessionRating): Promise<ClubSessionRating>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

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

    // OAuth-only users have no password
    if (!user.password) return undefined;

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
    // Generate a cryptographically secure random token
    const token = randomBytes(24).toString('hex');
      
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
    // If userId is provided, filter by user
    if (userId !== undefined) {
      if (userId === ADMIN_USER_ID) {
        // For Admin (userId 1), show both their own whiskeys and legacy whiskeys with no userId
        return db.select().from(whiskeys)
          .where(
            or(
              eq(whiskeys.userId, userId),
              sql`${whiskeys.userId} IS NULL`
            )
          )
          .orderBy(asc(whiskeys.name))
          .limit(500);
      } else {
        // For other users, show only their own whiskeys
        return db.select().from(whiskeys)
          .where(eq(whiskeys.userId, userId))
          .orderBy(asc(whiskeys.name))
          .limit(500);
      }
    }

    // No userId - return all whiskeys (should not happen in normal use)
    return db.select().from(whiskeys).orderBy(asc(whiskeys.name)).limit(500);
  }
  
  async getWhiskey(id: number, userId?: number): Promise<Whiskey | undefined> {
    // Special handling for Admin user (ID 1)
    if (userId === ADMIN_USER_ID) {
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

    // Verify whiskey belongs to user (prevent adding other users' whiskeys)
    const whiskey = await this.getWhiskey(whiskeyId, userId);
    if (!whiskey) return undefined;

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
    // Verify all whiskeys belong to the user
    for (const whiskeyId of whiskeyIds) {
      const whiskey = await this.getWhiskey(whiskeyId, data.userId);
      if (!whiskey) {
        throw new Error(`Whiskey ${whiskeyId} not found or not owned by user`);
      }
    }

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

  async getUserByProfileSlug(slug: string, skipPublicCheck: boolean = false): Promise<User | undefined> {
    // Try profileSlug first
    const conditions = skipPublicCheck
      ? [eq(users.profileSlug, slug)]
      : [eq(users.profileSlug, slug), eq(users.isPublic, true)];
    const [user] = await db
      .select()
      .from(users)
      .where(and(...conditions));
    if (user) return user;

    // Fallback: try username
    const usernameConditions = skipPublicCheck
      ? [eq(users.username, slug)]
      : [eq(users.username, slug), eq(users.isPublic, true)];
    const [userByName] = await db
      .select()
      .from(users)
      .where(and(...usernameConditions));
    return userByName || undefined;
  }

  async getPublicProfile(userId: number, skipPublicCheck: boolean = false): Promise<{
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
    if (!user || (!skipPublicCheck && !user.isPublic)) return undefined;

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
    const ratedWhiskeys = userWhiskeys.filter(w => w.rating != null && w.rating > 0);
    const ratingsSum = ratedWhiskeys.reduce((sum, w) => sum + w.rating!, 0);
    const averageRating = ratedWhiskeys.length > 0 ? parseFloat((ratingsSum / ratedWhiskeys.length).toFixed(1)) : 0;

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

  async getReviewCountForUser(userId: number): Promise<number> {
    const userWhiskeys = await db
      .select({ notes: whiskeys.notes })
      .from(whiskeys)
      .where(eq(whiskeys.userId, userId));
    return userWhiskeys.reduce((count, w) => {
      const notes = Array.isArray(w.notes) ? w.notes : [];
      return count + notes.length;
    }, 0);
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
        .orderBy(asc(distilleries.name))
        .limit(50);
    }

    return db
      .select()
      .from(distilleries)
      .orderBy(asc(distilleries.name))
      .limit(50);
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

  /**
   * Get recently used quips for a user (from last 5 sessions)
   */
  async getRecentQuips(userId: number, limit: number = 5): Promise<string[]> {
    const recentSessions = await db
      .select()
      .from(tastingSessions)
      .where(eq(tastingSessions.userId, userId))
      .orderBy(desc(tastingSessions.createdAt))
      .limit(limit);

    const quips: string[] = [];
    for (const session of recentSessions) {
      const script = session.scriptJson as { quip?: string } | null;
      if (script?.quip) {
        quips.push(script.quip);
      }
    }

    return quips;
  }

  // Account deletion - removes user and all associated data (CASCADE handles related tables)
  async deleteUser(userId: number): Promise<boolean> {
    // Get all user's whiskeys to find images that need cleanup
    const userWhiskeys = await db.select({ image: whiskeys.image })
      .from(whiskeys)
      .where(eq(whiskeys.userId, userId));

    // Collect image URLs for cleanup (handled by caller since it needs Spaces access)
    // Delete the user row — CASCADE deletes handle all related data:
    // oauthProviders, passwordResetTokens, whiskeys, follows, reviewComments,
    // reviewLikes, priceTracks, marketValues, flights, blindTastings, aiUsageLogs, generatedScripts
    const result = await db.delete(users).where(eq(users.id, userId));

    return (result.rowCount ?? 0) > 0;
  }

  // Get all image URLs for a user's whiskeys (for cleanup before account deletion)
  async getUserWhiskeyImages(userId: number): Promise<string[]> {
    const results = await db.select({ image: whiskeys.image })
      .from(whiskeys)
      .where(and(eq(whiskeys.userId, userId), sql`${whiskeys.image} IS NOT NULL`));

    return results.map(r => r.image).filter((img): img is string => img !== null);
  }

  // ==================== THE HUNT: STORES ====================

  async getStores(search?: string, limit: number = 50, offset: number = 0): Promise<Store[]> {
    const query = db.select().from(stores);

    if (search) {
      return query
        .where(ilike(stores.name, `%${search}%`))
        .orderBy(asc(stores.name))
        .limit(limit)
        .offset(offset);
    }

    return query.orderBy(asc(stores.name)).limit(limit).offset(offset);
  }

  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store || undefined;
  }

  async createStore(storeData: InsertStore): Promise<Store> {
    const [store] = await db.insert(stores).values(storeData).returning();
    return store;
  }

  async updateStore(id: number, storeData: UpdateStore): Promise<Store | undefined> {
    const [updated] = await db
      .update(stores)
      .set({ ...storeData, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning();
    return updated || undefined;
  }

  // ==================== THE HUNT: STORE FOLLOWS ====================

  async followStore(userId: number, storeId: number): Promise<StoreFollow | undefined> {
    // Verify store exists
    const store = await this.getStore(storeId);
    if (!store) return undefined;

    // Check if already following
    const existing = await db
      .select()
      .from(storeFollows)
      .where(and(eq(storeFollows.userId, userId), eq(storeFollows.storeId, storeId)));

    if (existing.length > 0) return existing[0];

    const [follow] = await db
      .insert(storeFollows)
      .values({ userId, storeId })
      .returning();
    return follow;
  }

  async unfollowStore(userId: number, storeId: number): Promise<boolean> {
    const result = await db
      .delete(storeFollows)
      .where(and(eq(storeFollows.userId, userId), eq(storeFollows.storeId, storeId)))
      .returning();
    return result.length > 0;
  }

  async isFollowingStore(userId: number, storeId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(storeFollows)
      .where(and(eq(storeFollows.userId, userId), eq(storeFollows.storeId, storeId)));
    return result.length > 0;
  }

  async getFollowedStores(userId: number): Promise<(Store & { followerCount: number })[]> {
    const followRecords = await db
      .select()
      .from(storeFollows)
      .where(eq(storeFollows.userId, userId))
      .orderBy(desc(storeFollows.createdAt));

    const results: (Store & { followerCount: number })[] = [];
    for (const f of followRecords) {
      const store = await this.getStore(f.storeId);
      if (!store) continue;
      const followerCount = await this.getStoreFollowerCount(f.storeId);
      results.push({ ...store, followerCount });
    }
    return results;
  }

  async getStoreFollowerCount(storeId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(storeFollows)
      .where(eq(storeFollows.storeId, storeId));
    return result[0]?.count || 0;
  }

  // ==================== THE HUNT: DROPS ====================

  async getDrops(options: { storeId?: number; status?: string; limit?: number; offset?: number } = {}): Promise<(Drop & { store: Store })[]> {
    const { storeId, status, limit: lim = 50, offset: off = 0 } = options;

    const conditions = [];
    if (storeId) conditions.push(eq(drops.storeId, storeId));
    if (status) conditions.push(sql`${drops.status} = ${status}`);

    const dropRows = conditions.length > 0
      ? await db.select().from(drops).where(and(...conditions)).orderBy(desc(drops.droppedAt)).limit(lim).offset(off)
      : await db.select().from(drops).orderBy(desc(drops.droppedAt)).limit(lim).offset(off);

    const results: (Drop & { store: Store })[] = [];
    for (const drop of dropRows) {
      const store = await this.getStore(drop.storeId);
      if (store) results.push({ ...drop, store });
    }
    return results;
  }

  async getDrop(id: number): Promise<(Drop & { store: Store }) | undefined> {
    const [drop] = await db.select().from(drops).where(eq(drops.id, id));
    if (!drop) return undefined;

    const store = await this.getStore(drop.storeId);
    if (!store) return undefined;

    return { ...drop, store };
  }

  async createDrop(dropData: InsertDrop): Promise<Drop> {
    const [drop] = await db.insert(drops).values(dropData).returning();

    // Get the store for this drop
    const store = await this.getStore(drop.storeId);

    // Notify store followers + wishlist matching
    try {
      const followers = await db
        .select()
        .from(storeFollows)
        .where(eq(storeFollows.storeId, drop.storeId));

      for (const follower of followers) {
        // Skip notifying the person who reported the drop
        if (follower.userId === drop.createdBy) continue;

        // Check if this drop matches anything on their wishlist
        const wishlistItems = await db
          .select()
          .from(whiskeys)
          .where(and(
            eq(whiskeys.userId, follower.userId),
            eq(whiskeys.isWishlist, true)
          ));

        let isWishlistMatch = false;
        for (const item of wishlistItems) {
          if (item.name && drop.whiskeyName &&
            item.name.toLowerCase().includes(drop.whiskeyName.toLowerCase()) ||
            drop.whiskeyName.toLowerCase().includes(item.name?.toLowerCase() || '')) {
            isWishlistMatch = true;
            break;
          }
        }

        const storeName = store?.name || 'A store';

        if (isWishlistMatch) {
          await this.createNotification({
            userId: follower.userId,
            type: 'wishlist_match',
            title: 'Wishlist Match!',
            message: `${drop.whiskeyName} was spotted at ${storeName}`,
            data: { dropId: drop.id, storeId: drop.storeId },
          });
        } else {
          await this.createNotification({
            userId: follower.userId,
            type: 'store_new_drop',
            title: 'New Drop',
            message: `${storeName} just got ${drop.whiskeyName}`,
            data: { dropId: drop.id, storeId: drop.storeId },
          });
        }
      }
    } catch (err) {
      // Don't fail the drop creation if notification fails
      console.error("Notification error during createDrop:", err);
    }

    return drop;
  }

  async updateDrop(id: number, update: UpdateDrop, userId: number): Promise<Drop | undefined> {
    const [existing] = await db.select().from(drops).where(eq(drops.id, id));
    if (!existing || existing.createdBy !== userId) return undefined;

    const [updated] = await db
      .update(drops)
      .set(update)
      .where(eq(drops.id, id))
      .returning();
    return updated || undefined;
  }

  async getDropsForFollowedStores(userId: number, limit: number = 50, offset: number = 0): Promise<(Drop & { store: Store })[]> {
    const followedStoreIds = await db
      .select({ storeId: storeFollows.storeId })
      .from(storeFollows)
      .where(eq(storeFollows.userId, userId));

    if (followedStoreIds.length === 0) return [];

    const ids = followedStoreIds.map(f => f.storeId);
    const dropRows = await db
      .select()
      .from(drops)
      .where(sql`${drops.storeId} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(drops.droppedAt))
      .limit(limit)
      .offset(offset);

    const results: (Drop & { store: Store })[] = [];
    for (const drop of dropRows) {
      const store = await this.getStore(drop.storeId);
      if (store) results.push({ ...drop, store });
    }
    return results;
  }

  async getWishlistMatchingDrops(userId: number, limit: number = 50, offset: number = 0): Promise<(Drop & { store: Store })[]> {
    // Get user's wishlist items
    const wishlistItems = await db
      .select()
      .from(whiskeys)
      .where(and(eq(whiskeys.userId, userId), eq(whiskeys.isWishlist, true)));

    if (wishlistItems.length === 0) return [];

    // Get followed store IDs
    const followedStoreIds = await db
      .select({ storeId: storeFollows.storeId })
      .from(storeFollows)
      .where(eq(storeFollows.userId, userId));

    if (followedStoreIds.length === 0) return [];

    const storeIds = followedStoreIds.map(f => f.storeId);

    // Build ILIKE conditions for wishlist matching
    const wishlistConditions = wishlistItems
      .filter(w => w.name)
      .map(w => ilike(drops.whiskeyName, `%${w.name}%`));

    if (wishlistConditions.length === 0) return [];

    const dropRows = await db
      .select()
      .from(drops)
      .where(and(
        sql`${drops.storeId} IN (${sql.join(storeIds.map(id => sql`${id}`), sql`, `)})`,
        or(...wishlistConditions)
      ))
      .orderBy(desc(drops.droppedAt))
      .limit(limit)
      .offset(offset);

    const results: (Drop & { store: Store })[] = [];
    for (const drop of dropRows) {
      const store = await this.getStore(drop.storeId);
      if (store) results.push({ ...drop, store });
    }
    return results;
  }

  // ==================== THE HUNT: NOTIFICATIONS ====================

  async getNotifications(userId: number, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createNotification(notification: { userId: number; type: string; title: string; message: string; data?: any }): Promise<Notification> {
    const [n] = await db.insert(notifications).values(notification).returning();
    return n;
  }

  async markNotificationRead(id: number, userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count || 0;
  }

  // ==================== PHASE 2: STORE PROFILES ====================

  async getStoreProfile(storeId: number): Promise<any> {
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
    if (!store) return undefined;

    // Get follower count
    const [followerResult] = await db
      .select({ count: count() })
      .from(storeFollows)
      .where(eq(storeFollows.storeId, storeId));

    // Get drop count
    const [dropResult] = await db
      .select({ count: count() })
      .from(drops)
      .where(eq(drops.storeId, storeId));

    // Get recent drops (last 10)
    const recentDrops = await db
      .select()
      .from(drops)
      .where(eq(drops.storeId, storeId))
      .orderBy(desc(drops.droppedAt))
      .limit(10);

    // Get claimer info if claimed
    let claimedByUser = null;
    if (store.claimedBy) {
      const [user] = await db.select({ id: users.id, username: users.username }).from(users).where(eq(users.id, store.claimedBy));
      claimedByUser = user || null;
    }

    return {
      ...store,
      followerCount: followerResult?.count || 0,
      dropCount: dropResult?.count || 0,
      recentDrops,
      claimedByUser,
    };
  }

  async updateStoreProfile(storeId: number, data: UpdateStoreProfile, userId: number): Promise<Store | undefined> {
    // Only the claimer or admin can update the profile
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
    if (!store) return undefined;
    if (store.claimedBy !== userId && userId !== ADMIN_USER_ID) return undefined;

    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.hours !== undefined) updateData.hours = data.hours;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.instagramHandle !== undefined) updateData.instagramHandle = data.instagramHandle;

    if (Object.keys(updateData).length === 0) return store;

    const [updated] = await db
      .update(stores)
      .set(updateData)
      .where(eq(stores.id, storeId))
      .returning();
    return updated || undefined;
  }

  // ==================== PHASE 2: STORE CLAIMS ====================

  async createStoreClaim(claim: InsertStoreClaim): Promise<StoreClaim> {
    const [created] = await db.insert(storeClaims).values(claim).returning();
    return created;
  }

  async getStoreClaims(storeId?: number, status?: string): Promise<StoreClaim[]> {
    const conditions = [];
    if (storeId !== undefined) conditions.push(eq(storeClaims.storeId, storeId));
    if (status !== undefined) conditions.push(sql`${storeClaims.status} = ${status}`);

    return db
      .select()
      .from(storeClaims)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(storeClaims.createdAt));
  }

  async approveStoreClaim(claimId: number, reviewerId: number, reviewNote?: string): Promise<StoreClaim | undefined> {
    const [claim] = await db.select().from(storeClaims).where(eq(storeClaims.id, claimId));
    if (!claim || claim.status !== 'pending') return undefined;

    // Update claim status
    const [updated] = await db
      .update(storeClaims)
      .set({
        status: 'approved',
        reviewedBy: reviewerId,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      })
      .where(eq(storeClaims.id, claimId))
      .returning();

    // Update store to mark as claimed
    await db
      .update(stores)
      .set({
        claimedBy: claim.userId,
        claimedAt: new Date(),
      })
      .where(eq(stores.id, claim.storeId));

    // Reject any other pending claims for the same store
    await db
      .update(storeClaims)
      .set({
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewNote: 'Another claim was approved for this store',
        reviewedAt: new Date(),
      })
      .where(and(
        eq(storeClaims.storeId, claim.storeId),
        eq(storeClaims.status, 'pending'),
        ne(storeClaims.id, claimId)
      ));

    // Notify the claimant
    await this.createNotification({
      userId: claim.userId,
      type: 'claim_approved',
      title: 'Claim Approved!',
      message: 'Your store claim has been approved. You can now manage the store profile.',
      data: { storeId: claim.storeId, claimId },
    });

    return updated || undefined;
  }

  async rejectStoreClaim(claimId: number, reviewerId: number, reviewNote?: string): Promise<StoreClaim | undefined> {
    const [claim] = await db.select().from(storeClaims).where(eq(storeClaims.id, claimId));
    if (!claim || claim.status !== 'pending') return undefined;

    const [updated] = await db
      .update(storeClaims)
      .set({
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      })
      .where(eq(storeClaims.id, claimId))
      .returning();

    // Notify the claimant
    await this.createNotification({
      userId: claim.userId,
      type: 'claim_rejected',
      title: 'Claim Not Approved',
      message: reviewNote ? `Your store claim was not approved: ${reviewNote}` : 'Your store claim was not approved.',
      data: { storeId: claim.storeId, claimId },
    });

    return updated || undefined;
  }

  // ==================== PHASE 2: STORE ANALYTICS ====================

  async recordStoreView(storeId: number, viewedBy?: number): Promise<void> {
    await db.insert(storeViews).values({
      storeId,
      viewedBy: viewedBy || null,
    });
  }

  async getStoreAnalytics(storeId: number, days: number = 30): Promise<{
    totalViews: number;
    viewsByDay: { date: string; count: number }[];
    followerCount: number;
    dropCount: number;
    recentDrops: Drop[];
  }> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Total views in period
    const [viewResult] = await db
      .select({ count: count() })
      .from(storeViews)
      .where(and(
        eq(storeViews.storeId, storeId),
        sql`${storeViews.createdAt} >= ${sinceDate}`
      ));

    // Views by day
    const viewsByDayRows = await db
      .select({
        date: sql<string>`DATE(${storeViews.createdAt})`,
        count: count(),
      })
      .from(storeViews)
      .where(and(
        eq(storeViews.storeId, storeId),
        sql`${storeViews.createdAt} >= ${sinceDate}`
      ))
      .groupBy(sql`DATE(${storeViews.createdAt})`)
      .orderBy(sql`DATE(${storeViews.createdAt})`);

    // Follower count
    const [followerResult] = await db
      .select({ count: count() })
      .from(storeFollows)
      .where(eq(storeFollows.storeId, storeId));

    // Drop count in period
    const [dropResult] = await db
      .select({ count: count() })
      .from(drops)
      .where(and(
        eq(drops.storeId, storeId),
        sql`${drops.droppedAt} >= ${sinceDate}`
      ));

    // Recent drops
    const recentDrops = await db
      .select()
      .from(drops)
      .where(eq(drops.storeId, storeId))
      .orderBy(desc(drops.droppedAt))
      .limit(10);

    return {
      totalViews: viewResult?.count || 0,
      viewsByDay: viewsByDayRows.map(r => ({ date: String(r.date), count: r.count })),
      followerCount: followerResult?.count || 0,
      dropCount: dropResult?.count || 0,
      recentDrops,
    };
  }

  // ==================== TASTING CLUBS METHODS ====================

  async createClub(data: InsertClub): Promise<Club> {
    const [club] = await db
      .insert(clubs)
      .values(data)
      .returning();

    // Add the creator as admin member
    await db.insert(clubMembers).values({
      clubId: club.id,
      userId: data.createdBy,
      role: 'admin' as ClubRole,
      status: 'active' as ClubMemberStatus,
      joinedAt: new Date(),
    });

    return club;
  }

  async getClub(id: number): Promise<Club | undefined> {
    const [club] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, id));
    return club || undefined;
  }

  async getUserClubs(userId: number): Promise<Club[]> {
    const memberships = await db
      .select({ clubId: clubMembers.clubId })
      .from(clubMembers)
      .where(and(
        eq(clubMembers.userId, userId),
        ne(clubMembers.status, 'removed' as ClubMemberStatus)
      ));

    if (memberships.length === 0) return [];

    const clubIds = memberships.map(m => m.clubId);
    return db
      .select()
      .from(clubs)
      .where(sql`${clubs.id} IN (${sql.join(clubIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(clubs.updatedAt));
  }

  async updateClub(id: number, data: UpdateClub, userId: number): Promise<Club | undefined> {
    // Verify user is admin
    const isAdmin = await this.isClubAdmin(id, userId);
    if (!isAdmin) return undefined;

    const [updated] = await db
      .update(clubs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clubs.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteClub(id: number, userId: number): Promise<boolean> {
    const isAdmin = await this.isClubAdmin(id, userId);
    if (!isAdmin) return false;

    const result = await db
      .delete(clubs)
      .where(eq(clubs.id, id))
      .returning();
    return result.length > 0;
  }

  private async isClubAdmin(clubId: number, userId: number): Promise<boolean> {
    const [member] = await db
      .select()
      .from(clubMembers)
      .where(and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, userId),
        eq(clubMembers.role, 'admin' as ClubRole),
        eq(clubMembers.status, 'active' as ClubMemberStatus)
      ));
    return !!member;
  }

  private async isClubMember(clubId: number, userId: number): Promise<boolean> {
    const [member] = await db
      .select()
      .from(clubMembers)
      .where(and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, userId),
        eq(clubMembers.status, 'active' as ClubMemberStatus)
      ));
    return !!member;
  }

  async getClubMembers(clubId: number): Promise<(ClubMember & { user: Pick<User, 'id' | 'username' | 'displayName' | 'profileImage'> })[]> {
    const members = await db
      .select({
        id: clubMembers.id,
        clubId: clubMembers.clubId,
        userId: clubMembers.userId,
        role: clubMembers.role,
        status: clubMembers.status,
        joinedAt: clubMembers.joinedAt,
        createdAt: clubMembers.createdAt,
        userName: users.username,
        userDisplayName: users.displayName,
        userProfileImage: users.profileImage,
      })
      .from(clubMembers)
      .innerJoin(users, eq(clubMembers.userId, users.id))
      .where(and(
        eq(clubMembers.clubId, clubId),
        ne(clubMembers.status, 'removed' as ClubMemberStatus)
      ))
      .orderBy(asc(clubMembers.createdAt));

    return members.map(m => ({
      id: m.id,
      clubId: m.clubId,
      userId: m.userId,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      createdAt: m.createdAt,
      user: {
        id: m.userId,
        username: m.userName,
        displayName: m.userDisplayName,
        profileImage: m.userProfileImage,
      },
    }));
  }

  async inviteMember(clubId: number, targetUserId: number, inviterId: number): Promise<ClubMember | undefined> {
    const isAdmin = await this.isClubAdmin(clubId, inviterId);
    if (!isAdmin) return undefined;

    // Check target user exists
    const targetUser = await this.getUser(targetUserId);
    if (!targetUser) return undefined;

    // Check for existing membership
    const [existing] = await db
      .select()
      .from(clubMembers)
      .where(and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, targetUserId)
      ));

    if (existing) {
      if (existing.status === 'removed') {
        // Re-invite removed member
        const [updated] = await db
          .update(clubMembers)
          .set({ status: 'invited' as ClubMemberStatus, role: 'member' as ClubRole })
          .where(eq(clubMembers.id, existing.id))
          .returning();
        return updated;
      }
      return undefined; // Already invited or active
    }

    const [member] = await db
      .insert(clubMembers)
      .values({
        clubId,
        userId: targetUserId,
        role: 'member' as ClubRole,
        status: 'invited' as ClubMemberStatus,
      })
      .returning();

    // Send notification
    const club = await this.getClub(clubId);
    if (club) {
      await this.createNotification({
        userId: targetUserId,
        type: 'club_invite',
        title: 'Club Invitation',
        message: `You've been invited to join "${club.name}"`,
        data: { clubId, clubName: club.name },
      });
    }

    return member;
  }

  async acceptInvite(clubId: number, userId: number): Promise<ClubMember | undefined> {
    const [member] = await db
      .select()
      .from(clubMembers)
      .where(and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, userId),
        eq(clubMembers.status, 'invited' as ClubMemberStatus)
      ));

    if (!member) return undefined;

    const [updated] = await db
      .update(clubMembers)
      .set({ status: 'active' as ClubMemberStatus, joinedAt: new Date() })
      .where(eq(clubMembers.id, member.id))
      .returning();

    // Notify club members
    const club = await this.getClub(clubId);
    const joiner = await this.getUser(userId);
    if (club && joiner) {
      const members = await this.getClubMembers(clubId);
      for (const m of members) {
        if (m.userId !== userId && m.status === 'active') {
          await this.createNotification({
            userId: m.userId,
            type: 'club_member_joined',
            title: 'New Club Member',
            message: `${joiner.displayName || joiner.username} joined "${club.name}"`,
            data: { clubId, clubName: club.name, username: joiner.username },
          });
        }
      }
    }

    return updated;
  }

  async declineInvite(clubId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(clubMembers)
      .where(and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, userId),
        eq(clubMembers.status, 'invited' as ClubMemberStatus)
      ))
      .returning();
    return result.length > 0;
  }

  async removeMember(clubId: number, targetUserId: number, adminId: number): Promise<boolean> {
    const isAdmin = await this.isClubAdmin(clubId, adminId);
    if (!isAdmin || targetUserId === adminId) return false;

    const [updated] = await db
      .update(clubMembers)
      .set({ status: 'removed' as ClubMemberStatus })
      .where(and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, targetUserId)
      ))
      .returning();
    return !!updated;
  }

  async updateMemberRole(clubId: number, targetUserId: number, role: ClubRole, adminId: number): Promise<ClubMember | undefined> {
    const isAdmin = await this.isClubAdmin(clubId, adminId);
    if (!isAdmin) return undefined;

    const [updated] = await db
      .update(clubMembers)
      .set({ role })
      .where(and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, targetUserId),
        eq(clubMembers.status, 'active' as ClubMemberStatus)
      ))
      .returning();
    return updated || undefined;
  }

  async getPendingInvites(userId: number): Promise<(ClubMember & { club: Club })[]> {
    const invites = await db
      .select()
      .from(clubMembers)
      .innerJoin(clubs, eq(clubMembers.clubId, clubs.id))
      .where(and(
        eq(clubMembers.userId, userId),
        eq(clubMembers.status, 'invited' as ClubMemberStatus)
      ))
      .orderBy(desc(clubMembers.createdAt));

    return invites.map(row => ({
      ...row.club_members,
      club: row.clubs,
    }));
  }

  async createClubSession(data: InsertClubSession): Promise<ClubSession> {
    // Verify user is admin of the club
    const isAdmin = await this.isClubAdmin(data.clubId, data.createdBy);
    if (!isAdmin) throw new Error("Only club admins can create sessions");

    const [session] = await db
      .insert(clubSessions)
      .values(data)
      .returning();
    return session;
  }

  async getClubSessions(clubId: number): Promise<ClubSession[]> {
    return db
      .select()
      .from(clubSessions)
      .where(eq(clubSessions.clubId, clubId))
      .orderBy(desc(clubSessions.createdAt));
  }

  async getClubSessionWithWhiskeys(sessionId: number, userId: number): Promise<any> {
    const [session] = await db
      .select()
      .from(clubSessions)
      .where(eq(clubSessions.id, sessionId));

    if (!session) return undefined;

    // Verify user is a member
    const isMember = await this.isClubMember(session.clubId, userId);
    if (!isMember) return undefined;

    const sessionWhiskeys = await db
      .select()
      .from(clubSessionWhiskeys)
      .where(eq(clubSessionWhiskeys.sessionId, sessionId))
      .orderBy(asc(clubSessionWhiskeys.order));

    // Get ratings
    const ratings = await db
      .select()
      .from(clubSessionRatings)
      .innerJoin(users, eq(clubSessionRatings.userId, users.id))
      .where(
        sql`${clubSessionRatings.sessionWhiskeyId} IN (${
          sessionWhiskeys.length > 0
            ? sql.join(sessionWhiskeys.map(sw => sql`${sw.id}`), sql`, `)
            : sql`-1`
        })`
      );

    // Build whiskey data based on session status
    const whiskeysWithData = await Promise.all(
      sessionWhiskeys.map(async (sw) => {
        let whiskey = undefined;
        // Only reveal whiskey identity after revealed status
        if (session.status === 'revealed' || session.status === 'completed' || session.status === 'draft') {
          const [w] = await db
            .select()
            .from(whiskeys)
            .where(eq(whiskeys.id, sw.whiskeyId));
          whiskey = w;
        }

        // Filter ratings based on status
        const swRatings = ratings
          .filter(r => r.club_session_ratings.sessionWhiskeyId === sw.id)
          .map(r => ({
            ...r.club_session_ratings,
            user: {
              id: r.users.id,
              username: r.users.username,
              displayName: r.users.displayName,
              profileImage: r.users.profileImage,
            },
          }));

        // During active phase, only show the caller's own rating
        const visibleRatings = session.status === 'active'
          ? swRatings.filter(r => r.userId === userId)
          : swRatings;

        return {
          ...sw,
          whiskey,
          ratings: visibleRatings,
        };
      })
    );

    return {
      session,
      whiskeys: whiskeysWithData,
    };
  }

  async addWhiskeyToSession(sessionId: number, whiskeyId: number, userId: number): Promise<ClubSessionWhiskey | undefined> {
    const [session] = await db
      .select()
      .from(clubSessions)
      .where(eq(clubSessions.id, sessionId));

    if (!session || session.status !== 'draft') return undefined;

    const isAdmin = await this.isClubAdmin(session.clubId, userId);
    if (!isAdmin) return undefined;

    // Get current count for label assignment
    const existing = await db
      .select()
      .from(clubSessionWhiskeys)
      .where(eq(clubSessionWhiskeys.sessionId, sessionId));

    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const label = labels[existing.length] || `#${existing.length + 1}`;

    const [sw] = await db
      .insert(clubSessionWhiskeys)
      .values({
        sessionId,
        whiskeyId,
        label,
        order: existing.length,
      })
      .returning();
    return sw;
  }

  async removeWhiskeyFromSession(sessionWhiskeyId: number, userId: number): Promise<boolean> {
    const [sw] = await db
      .select()
      .from(clubSessionWhiskeys)
      .where(eq(clubSessionWhiskeys.id, sessionWhiskeyId));

    if (!sw) return false;

    const [session] = await db
      .select()
      .from(clubSessions)
      .where(eq(clubSessions.id, sw.sessionId));

    if (!session || session.status !== 'draft') return false;

    const isAdmin = await this.isClubAdmin(session.clubId, userId);
    if (!isAdmin) return false;

    const result = await db
      .delete(clubSessionWhiskeys)
      .where(eq(clubSessionWhiskeys.id, sessionWhiskeyId))
      .returning();
    return result.length > 0;
  }

  async startClubSession(sessionId: number, userId: number): Promise<ClubSession | undefined> {
    const [session] = await db
      .select()
      .from(clubSessions)
      .where(eq(clubSessions.id, sessionId));

    if (!session || session.status !== 'draft') return undefined;

    const isAdmin = await this.isClubAdmin(session.clubId, userId);
    if (!isAdmin) return undefined;

    // Verify there are whiskeys in the session
    const swCount = await db
      .select({ count: count() })
      .from(clubSessionWhiskeys)
      .where(eq(clubSessionWhiskeys.sessionId, sessionId));

    if (!swCount[0]?.count || swCount[0].count < 1) return undefined;

    // Shuffle labels
    const sessionWhiskeysList = await db
      .select()
      .from(clubSessionWhiskeys)
      .where(eq(clubSessionWhiskeys.sessionId, sessionId));

    const shuffledIndices = sessionWhiskeysList.map((_, i) => i).sort(() => Math.random() - 0.5);
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    await Promise.all(
      sessionWhiskeysList.map((sw, i) =>
        db.update(clubSessionWhiskeys)
          .set({ label: labels[shuffledIndices[i]] || `#${shuffledIndices[i] + 1}`, order: shuffledIndices[i] })
          .where(eq(clubSessionWhiskeys.id, sw.id))
      )
    );

    const [updated] = await db
      .update(clubSessions)
      .set({ status: 'active' as ClubSessionStatus, startedAt: new Date() })
      .where(eq(clubSessions.id, sessionId))
      .returning();

    // Notify all club members
    const club = await this.getClub(session.clubId);
    if (club) {
      const members = await this.getClubMembers(session.clubId);
      for (const m of members) {
        if (m.userId !== userId && m.status === 'active') {
          await this.createNotification({
            userId: m.userId,
            type: 'club_session_started',
            title: 'Tasting Session Started',
            message: `"${session.name}" in "${club.name}" is now active. Time to rate!`,
            data: { clubId: session.clubId, sessionId, clubName: club.name, sessionName: session.name },
          });
        }
      }
    }

    return updated;
  }

  async revealClubSession(sessionId: number, userId: number): Promise<ClubSession | undefined> {
    const [session] = await db
      .select()
      .from(clubSessions)
      .where(eq(clubSessions.id, sessionId));

    if (!session || session.status !== 'active') return undefined;

    const isAdmin = await this.isClubAdmin(session.clubId, userId);
    if (!isAdmin) return undefined;

    const [updated] = await db
      .update(clubSessions)
      .set({ status: 'revealed' as ClubSessionStatus, revealedAt: new Date() })
      .where(eq(clubSessions.id, sessionId))
      .returning();

    // Notify members
    const club = await this.getClub(session.clubId);
    if (club) {
      const members = await this.getClubMembers(session.clubId);
      for (const m of members) {
        if (m.userId !== userId && m.status === 'active') {
          await this.createNotification({
            userId: m.userId,
            type: 'club_session_revealed',
            title: 'Results Revealed!',
            message: `"${session.name}" in "${club.name}" — see how everyone rated!`,
            data: { clubId: session.clubId, sessionId, clubName: club.name, sessionName: session.name },
          });
        }
      }
    }

    return updated;
  }

  async completeClubSession(sessionId: number, userId: number): Promise<ClubSession | undefined> {
    const [session] = await db
      .select()
      .from(clubSessions)
      .where(eq(clubSessions.id, sessionId));

    if (!session || session.status !== 'revealed') return undefined;

    const isAdmin = await this.isClubAdmin(session.clubId, userId);
    if (!isAdmin) return undefined;

    const [updated] = await db
      .update(clubSessions)
      .set({ status: 'completed' as ClubSessionStatus, completedAt: new Date() })
      .where(eq(clubSessions.id, sessionId))
      .returning();
    return updated;
  }

  async submitClubRating(sessionWhiskeyId: number, userId: number, data: InsertClubSessionRating): Promise<ClubSessionRating> {
    // Get the session whiskey and verify session is active
    const [sw] = await db
      .select()
      .from(clubSessionWhiskeys)
      .where(eq(clubSessionWhiskeys.id, sessionWhiskeyId));

    if (!sw) throw new Error("Session whiskey not found");

    const [session] = await db
      .select()
      .from(clubSessions)
      .where(eq(clubSessions.id, sw.sessionId));

    if (!session || session.status !== 'active') throw new Error("Session is not active");

    // Verify user is club member
    const isMember = await this.isClubMember(session.clubId, userId);
    if (!isMember) throw new Error("Not a club member");

    // Upsert rating
    const [existing] = await db
      .select()
      .from(clubSessionRatings)
      .where(and(
        eq(clubSessionRatings.sessionWhiskeyId, sessionWhiskeyId),
        eq(clubSessionRatings.userId, userId)
      ));

    if (existing) {
      const [updated] = await db
        .update(clubSessionRatings)
        .set({ rating: data.rating, notes: data.notes, updatedAt: new Date() })
        .where(eq(clubSessionRatings.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(clubSessionRatings)
      .values({
        sessionWhiskeyId,
        userId,
        rating: data.rating,
        notes: data.notes,
      })
      .returning();
    return created;
  }

  // ==================== PHASE 4: SOCIAL LAYER METHODS ====================

  // --- Activity Feed ---

  async logActivity(data: {
    userId: number;
    type: ActivityType;
    targetUserId?: number;
    whiskeyId?: number;
    metadata?: Record<string, unknown>;
  }): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values({
        userId: data.userId,
        type: data.type,
        targetUserId: data.targetUserId,
        whiskeyId: data.whiskeyId,
        metadata: data.metadata,
      })
      .returning();
    return activity;
  }

  async getPersonalizedFeed(userId: number, limit: number = 30): Promise<Array<{
    activity: Activity;
    user: PublicUser;
    targetUser?: PublicUser;
    whiskey?: Whiskey;
  }>> {
    // Get who the user is following
    const followingRecords = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followingIds = followingRecords.map(f => f.followingId);
    followingIds.push(userId); // Include own activities

    if (followingIds.length === 0) return [];

    // Fetch activities from followed users + self
    const feedActivities = await db
      .select()
      .from(activities)
      .where(sql`${activities.userId} = ANY(${sql.raw(`ARRAY[${followingIds.join(',')}]`)})`)
      .orderBy(desc(activities.createdAt))
      .limit(limit);

    // Hydrate with user/whiskey data
    const results = [];
    for (const act of feedActivities) {
      const actUser = await this.getUser(act.userId);
      if (!actUser) continue;

      const publicUser: PublicUser = {
        id: actUser.id,
        username: actUser.username,
        displayName: actUser.displayName,
        profileImage: actUser.profileImage,
        bio: actUser.bio,
        profileSlug: actUser.profileSlug,
        createdAt: actUser.createdAt,
      };

      let targetUser: PublicUser | undefined;
      if (act.targetUserId) {
        const tu = await this.getUser(act.targetUserId);
        if (tu) {
          targetUser = {
            id: tu.id,
            username: tu.username,
            displayName: tu.displayName,
            profileImage: tu.profileImage,
            bio: tu.bio,
            profileSlug: tu.profileSlug,
            createdAt: tu.createdAt,
          };
        }
      }

      let whiskey: Whiskey | undefined;
      if (act.whiskeyId) {
        const w = await this.getWhiskey(act.whiskeyId);
        if (w) whiskey = w;
      }

      results.push({ activity: act, user: publicUser, targetUser, whiskey });
    }

    return results;
  }

  async getGlobalFeed(limit: number = 30): Promise<Array<{
    activity: Activity;
    user: PublicUser;
    targetUser?: PublicUser;
    whiskey?: Whiskey;
  }>> {
    // Get recent activities from public users only
    const recentActivities = await db
      .select()
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .where(eq(users.isPublic, true))
      .orderBy(desc(activities.createdAt))
      .limit(limit);

    const results = [];
    for (const row of recentActivities) {
      const act = row.activities;
      const actUser = row.users;

      const publicUser: PublicUser = {
        id: actUser.id,
        username: actUser.username,
        displayName: actUser.displayName,
        profileImage: actUser.profileImage,
        bio: actUser.bio,
        profileSlug: actUser.profileSlug,
        createdAt: actUser.createdAt,
      };

      let targetUser: PublicUser | undefined;
      if (act.targetUserId) {
        const tu = await this.getUser(act.targetUserId);
        if (tu) {
          targetUser = {
            id: tu.id,
            username: tu.username,
            displayName: tu.displayName,
            profileImage: tu.profileImage,
            bio: tu.bio,
            profileSlug: tu.profileSlug,
            createdAt: tu.createdAt,
          };
        }
      }

      let whiskey: Whiskey | undefined;
      if (act.whiskeyId) {
        const w = await this.getWhiskey(act.whiskeyId);
        if (w) whiskey = w;
      }

      results.push({ activity: act, user: publicUser, targetUser, whiskey });
    }

    return results;
  }

  // --- Palate Matching ---

  async getPalateMatches(userId: number, limit: number = 10): Promise<Array<{
    user: PublicUser;
    similarity: number;
    sharedFlavors: string[];
  }>> {
    const myProfile = await this.getPalateProfile(userId);
    if (myProfile.reviewCount === 0) return [];

    // Get all public users except self
    const publicUsers = await db
      .select()
      .from(users)
      .where(and(eq(users.isPublic, true), ne(users.id, userId)));

    const matches: Array<{
      user: PublicUser;
      similarity: number;
      sharedFlavors: string[];
    }> = [];

    for (const u of publicUsers) {
      const theirProfile = await this.getPalateProfile(u.id);
      if (theirProfile.reviewCount === 0) continue;

      // Build scoring vector from scoringTendencies (existing palate profile structure)
      const myScoreVec = [
        myProfile.scoringTendencies.averageNose || 0,
        myProfile.scoringTendencies.averageMouthfeel || 0,
        myProfile.scoringTendencies.averageTaste || 0,
        myProfile.scoringTendencies.averageFinish || 0,
        myProfile.scoringTendencies.averageValue || 0,
        myProfile.scoringTendencies.averageOverall || 0,
      ];
      const theirScoreVec = [
        theirProfile.scoringTendencies.averageNose || 0,
        theirProfile.scoringTendencies.averageMouthfeel || 0,
        theirProfile.scoringTendencies.averageTaste || 0,
        theirProfile.scoringTendencies.averageFinish || 0,
        theirProfile.scoringTendencies.averageValue || 0,
        theirProfile.scoringTendencies.averageOverall || 0,
      ];

      // Check if vectors have any non-zero values
      const myMag = Math.sqrt(myScoreVec.reduce((a, b) => a + b * b, 0));
      const theirMag = Math.sqrt(theirScoreVec.reduce((a, b) => a + b * b, 0));

      if (myMag === 0 || theirMag === 0) continue;

      const dotProduct = myScoreVec.reduce((a, b, i) => a + b * theirScoreVec[i], 0);
      const similarity = parseFloat(((dotProduct / (myMag * theirMag)) * 100).toFixed(1));

      // Shared flavors from the all-flavors list
      const myFlavorNames = myProfile.topFlavors.all.map(f => f.flavor);
      const myFlavorSet = new Set(myFlavorNames);
      const sharedFlavors = theirProfile.topFlavors.all
        .map(f => f.flavor)
        .filter(f => myFlavorSet.has(f));

      matches.push({
        user: {
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          profileImage: u.profileImage,
          bio: u.bio,
          profileSlug: u.profileSlug,
          createdAt: u.createdAt,
        },
        similarity,
        sharedFlavors,
      });
    }

    return matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // --- Collection Comparison ---

  async compareCollections(userId1: number, userId2: number): Promise<{
    user1Stats: { totalBottles: number; avgRating: number; topTypes: string[] };
    user2Stats: { totalBottles: number; avgRating: number; topTypes: string[] };
    shared: Array<{ name: string; type: string | null; distillery: string | null }>;
    uniqueToUser1: Array<{ name: string; type: string | null; distillery: string | null }>;
    uniqueToUser2: Array<{ name: string; type: string | null; distillery: string | null }>;
    overlapPercentage: number;
  }> {
    const col1 = await db
      .select()
      .from(whiskeys)
      .where(and(eq(whiskeys.userId, userId1), eq(whiskeys.isWishlist, false)));

    const col2 = await db
      .select()
      .from(whiskeys)
      .where(and(eq(whiskeys.userId, userId2), eq(whiskeys.isWishlist, false)));

    // Normalize bottle identity by lowercase name
    const normalize = (name: string) => name.toLowerCase().trim();

    const col1Names = new Set(col1.map(w => normalize(w.name)));
    const col2Names = new Set(col2.map(w => normalize(w.name)));

    const sharedNames = new Set<string>();
    col1Names.forEach(name => {
      if (col2Names.has(name)) sharedNames.add(name);
    });

    const pick = (w: Whiskey) => ({ name: w.name, type: w.type, distillery: w.distillery });

    const shared = col1
      .filter(w => sharedNames.has(normalize(w.name)))
      .map(pick);

    const uniqueToUser1 = col1
      .filter(w => !sharedNames.has(normalize(w.name)))
      .map(pick);

    const uniqueToUser2 = col2
      .filter(w => !sharedNames.has(normalize(w.name)))
      .map(pick);

    const getTopTypes = (col: Whiskey[]) => {
      const counts = new Map<string, number>();
      col.forEach(w => { if (w.type) counts.set(w.type, (counts.get(w.type) || 0) + 1); });
      return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
    };

    const getAvgRating = (col: Whiskey[]) => {
      const rated = col.filter(w => w.rating != null && w.rating > 0);
      if (rated.length === 0) return 0;
      return parseFloat((rated.reduce((a, w) => a + w.rating!, 0) / rated.length).toFixed(1));
    };

    const totalUnique = col1Names.size + col2Names.size - sharedNames.size;
    const overlapPercentage = totalUnique > 0
      ? parseFloat(((sharedNames.size / totalUnique) * 100).toFixed(1))
      : 0;

    return {
      user1Stats: { totalBottles: col1.length, avgRating: getAvgRating(col1), topTypes: getTopTypes(col1) },
      user2Stats: { totalBottles: col2.length, avgRating: getAvgRating(col2), topTypes: getTopTypes(col2) },
      shared,
      uniqueToUser1,
      uniqueToUser2,
      overlapPercentage,
    };
  }

  // --- Trade Listings ---

  async createTradeListing(userId: number, data: InsertTradeListing): Promise<TradeListing> {
    // Verify the whiskey belongs to the user
    const whiskey = await this.getWhiskey(data.whiskeyId);
    if (!whiskey || whiskey.userId !== userId) {
      throw Object.assign(new Error("Whiskey not found in your collection"), { status: 404 });
    }

    const [listing] = await db
      .insert(tradeListings)
      .values({
        userId,
        whiskeyId: data.whiskeyId,
        seeking: data.seeking,
        notes: data.notes,
      })
      .returning();

    return listing;
  }

  async updateTradeListing(id: number, userId: number, data: UpdateTradeListing): Promise<TradeListing | undefined> {
    const [listing] = await db
      .select()
      .from(tradeListings)
      .where(and(eq(tradeListings.id, id), eq(tradeListings.userId, userId)));

    if (!listing) return undefined;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.status !== undefined) updateData.status = data.status;
    if (data.seeking !== undefined) updateData.seeking = data.seeking;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updated] = await db
      .update(tradeListings)
      .set(updateData)
      .where(eq(tradeListings.id, id))
      .returning();

    return updated;
  }

  async deleteTradeListing(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(tradeListings)
      .where(and(eq(tradeListings.id, id), eq(tradeListings.userId, userId)))
      .returning();

    return result.length > 0;
  }

  async getTradeListing(id: number): Promise<(TradeListing & { whiskey: Whiskey; user: PublicUser }) | undefined> {
    const [listing] = await db
      .select()
      .from(tradeListings)
      .where(eq(tradeListings.id, id));

    if (!listing) return undefined;

    const whiskey = await this.getWhiskey(listing.whiskeyId);
    if (!whiskey) return undefined;

    const user = await this.getUser(listing.userId);
    if (!user) return undefined;

    return {
      ...listing,
      whiskey,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage,
        bio: user.bio,
        profileSlug: user.profileSlug,
        createdAt: user.createdAt,
      },
    };
  }

  async getUserTradeListings(userId: number): Promise<Array<TradeListing & { whiskey: Whiskey }>> {
    const listings = await db
      .select()
      .from(tradeListings)
      .where(eq(tradeListings.userId, userId))
      .orderBy(desc(tradeListings.createdAt));

    const results = [];
    for (const listing of listings) {
      const whiskey = await this.getWhiskey(listing.whiskeyId);
      if (whiskey) results.push({ ...listing, whiskey });
    }

    return results;
  }

  async browseTradeListings(limit: number = 30, type?: string): Promise<Array<TradeListing & { whiskey: Whiskey; user: PublicUser }>> {
    const listings = await db
      .select()
      .from(tradeListings)
      .where(eq(tradeListings.status, 'available'))
      .orderBy(desc(tradeListings.createdAt))
      .limit(limit);

    const results = [];
    for (const listing of listings) {
      const whiskey = await this.getWhiskey(listing.whiskeyId);
      if (!whiskey) continue;

      // Filter by type if specified
      if (type && whiskey.type !== type) continue;

      const user = await this.getUser(listing.userId);
      if (!user || !user.isPublic) continue;

      results.push({
        ...listing,
        whiskey,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          profileImage: user.profileImage,
          bio: user.bio,
          profileSlug: user.profileSlug,
          createdAt: user.createdAt,
        },
      });
    }

    return results;
  }

  // ==================== PHASE 5: PALATE DEVELOPMENT ====================

  // --- Challenges ---

  async getChallenges(activeOnly: boolean = true): Promise<Challenge[]> {
    if (activeOnly) {
      return db.select().from(challenges).where(eq(challenges.isActive, true)).orderBy(desc(challenges.createdAt));
    }
    return db.select().from(challenges).orderBy(desc(challenges.createdAt));
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async createChallenge(data: InsertChallenge): Promise<Challenge> {
    const [challenge] = await db.insert(challenges).values(data).returning();
    return challenge;
  }

  // --- User Challenges ---

  async getUserChallenges(userId: number, status?: string): Promise<(UserChallenge & { challenge: Challenge })[]> {
    const conditions = [eq(userChallenges.userId, userId)];
    if (status) {
      conditions.push(eq(userChallenges.status, status as any));
    }

    const rows = await db
      .select()
      .from(userChallenges)
      .where(and(...conditions))
      .orderBy(desc(userChallenges.startedAt));

    const results: (UserChallenge & { challenge: Challenge })[] = [];
    for (const row of rows) {
      const challenge = await this.getChallenge(row.challengeId);
      if (challenge) {
        results.push({ ...row, challenge });
      }
    }
    return results;
  }

  async getUserChallenge(id: number): Promise<(UserChallenge & { challenge: Challenge }) | undefined> {
    const [row] = await db.select().from(userChallenges).where(eq(userChallenges.id, id));
    if (!row) return undefined;
    const challenge = await this.getChallenge(row.challengeId);
    if (!challenge) return undefined;
    return { ...row, challenge };
  }

  async joinChallenge(userId: number, challengeId: number): Promise<UserChallenge> {
    // Check if already enrolled in this challenge
    const [existing] = await db.select().from(userChallenges)
      .where(and(
        eq(userChallenges.userId, userId),
        eq(userChallenges.challengeId, challengeId),
        eq(userChallenges.status, 'active')
      ));
    if (existing) {
      throw new Error('Already enrolled in this challenge');
    }

    const [uc] = await db.insert(userChallenges).values({
      userId,
      challengeId,
      progress: 0,
      status: 'active',
    }).returning();
    return uc;
  }

  async updateChallengeProgress(id: number, progress: number, metadata?: any): Promise<UserChallenge | undefined> {
    const uc = await this.getUserChallenge(id);
    if (!uc) return undefined;

    const updates: any = { progress, metadata };

    // Check if challenge is completed
    if (progress >= uc.challenge.goalCount) {
      updates.status = 'completed';
      updates.completedAt = new Date();
    }

    const [updated] = await db.update(userChallenges)
      .set(updates)
      .where(eq(userChallenges.id, id))
      .returning();

    // If just completed, award XP
    if (updates.status === 'completed') {
      await this.addXP(uc.userId, uc.challenge.xpReward, 'challenge_complete');
    }

    return updated;
  }

  async abandonChallenge(id: number): Promise<UserChallenge | undefined> {
    const [updated] = await db.update(userChallenges)
      .set({ status: 'abandoned' })
      .where(eq(userChallenges.id, id))
      .returning();
    return updated;
  }

  // --- User Progress & XP ---

  async getUserProgress(userId: number): Promise<UserProgress> {
    const [existing] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    if (existing) return existing;

    // Auto-create progress record for new users
    const [created] = await db.insert(userProgress).values({ userId }).returning();
    return created;
  }

  async addXP(userId: number, amount: number, reason: string): Promise<UserProgress> {
    const progress = await this.getUserProgress(userId);
    const newXP = progress.xp + amount;
    const levelInfo = getLevelForXP(newXP);

    const [updated] = await db.update(userProgress)
      .set({
        xp: newXP,
        level: levelInfo.level,
        updatedAt: new Date(),
      })
      .where(eq(userProgress.userId, userId))
      .returning();

    return updated;
  }

  async updateStreak(userId: number): Promise<UserProgress> {
    const progress = await this.getUserProgress(userId);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastActivity = progress.lastActivityDate;

    let newStreak = progress.currentStreak;
    let longestStreak = progress.longestStreak;

    if (lastActivity === today) {
      // Already counted today
      return progress;
    } else if (lastActivity === yesterday) {
      // Continuing streak
      newStreak += 1;
    } else {
      // Streak broken or first activity
      newStreak = 1;
    }

    if (newStreak > longestStreak) {
      longestStreak = newStreak;
    }

    const [updated] = await db.update(userProgress)
      .set({
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: today,
        updatedAt: new Date(),
      })
      .where(eq(userProgress.userId, userId))
      .returning();

    // Award streak XP milestones
    if (newStreak === 7) await this.addXP(userId, 50, 'streak_7');
    if (newStreak === 30) await this.addXP(userId, 200, 'streak_30');

    return updated;
  }

  async incrementReviewCount(userId: number): Promise<void> {
    const progress = await this.getUserProgress(userId);
    await db.update(userProgress)
      .set({
        totalReviews: progress.totalReviews + 1,
        updatedAt: new Date(),
      })
      .where(eq(userProgress.userId, userId));

    // Award XP for reviews
    await this.addXP(userId, 25, 'review_complete');
    await this.updateStreak(userId);
  }

  async getLeaderboard(limit: number = 20): Promise<(UserProgress & { username: string; displayName: string | null; profileImage: string | null })[]> {
    const rows = await db
      .select()
      .from(userProgress)
      .orderBy(desc(userProgress.xp))
      .limit(Math.min(limit, 50));

    const results: (UserProgress & { username: string; displayName: string | null; profileImage: string | null })[] = [];
    for (const row of rows) {
      const user = await this.getUser(row.userId);
      if (user && user.isPublic) {
        results.push({
          ...row,
          username: user.username,
          displayName: user.displayName,
          profileImage: user.profileImage,
        });
      }
    }
    return results;
  }

  // --- Palate Exercises ---

  async createPalateExercise(data: {
    userId: number;
    title: string;
    description: string;
    exerciseType: string;
    difficulty: string;
    instructions: any;
    targetFlavors?: any;
    whiskeyIds?: any;
  }): Promise<PalateExercise> {
    const [exercise] = await db.insert(palateExercises).values(data as any).returning();
    return exercise;
  }

  async getUserExercises(userId: number, completedOnly?: boolean): Promise<PalateExercise[]> {
    const conditions = [eq(palateExercises.userId, userId)];
    if (completedOnly !== undefined) {
      conditions.push(eq(palateExercises.isCompleted, completedOnly));
    }
    return db.select().from(palateExercises)
      .where(and(...conditions))
      .orderBy(desc(palateExercises.createdAt));
  }

  async getExercise(id: number): Promise<PalateExercise | undefined> {
    const [exercise] = await db.select().from(palateExercises).where(eq(palateExercises.id, id));
    return exercise;
  }

  async completeExercise(id: number, userNotes?: string): Promise<PalateExercise | undefined> {
    const [updated] = await db.update(palateExercises)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        userNotes,
      })
      .where(eq(palateExercises.id, id))
      .returning();

    if (updated) {
      // Award XP for completing exercise
      await this.addXP(updated.userId, 30, 'exercise_complete');
    }

    return updated;
  }

  // --- Seed challenges ---

  async seedDefaultChallenges(): Promise<void> {
    const existing = await db.select().from(challenges).limit(1);
    if (existing.length > 0) return; // Already seeded

    const defaultChallenges: InsertChallenge[] = [
      {
        title: 'First Sip',
        description: 'Complete your first whiskey review. Take your time and explore each component.',
        type: 'review_streak',
        difficulty: 'beginner',
        goalCount: 1,
        xpReward: 50,
        isActive: true,
        isRecurring: false,
      },
      {
        title: 'Review Streak: Week Warrior',
        description: 'Review at least one whiskey per day for 7 consecutive days.',
        type: 'review_streak',
        difficulty: 'intermediate',
        goalCount: 7,
        xpReward: 150,
        durationDays: 7,
        isActive: true,
        isRecurring: true,
      },
      {
        title: 'Flavor Hunter: Vanilla',
        description: 'Identify vanilla notes in 3 different whiskeys during your tastings.',
        type: 'flavor_hunt',
        difficulty: 'beginner',
        goalCount: 3,
        goalDetails: { flavorTarget: 'vanilla' },
        xpReward: 75,
        isActive: true,
        isRecurring: false,
      },
      {
        title: 'Flavor Hunter: Smoke & Peat',
        description: 'Find smoke or peat characteristics in 3 whiskeys. Try Islay scotches!',
        type: 'flavor_hunt',
        difficulty: 'intermediate',
        goalCount: 3,
        goalDetails: { flavorTarget: ['smoke', 'peat'] },
        xpReward: 100,
        isActive: true,
        isRecurring: false,
      },
      {
        title: 'World Explorer',
        description: 'Review whiskeys from 5 different countries. Expand your horizons!',
        type: 'explore_type',
        difficulty: 'intermediate',
        goalCount: 5,
        goalDetails: { dimension: 'country' },
        xpReward: 200,
        isActive: true,
        isRecurring: false,
      },
      {
        title: 'Bourbon Deep Dive',
        description: 'Review 5 different bourbons. Compare and contrast their profiles.',
        type: 'explore_type',
        difficulty: 'beginner',
        goalCount: 5,
        goalDetails: { typeTarget: 'Bourbon' },
        xpReward: 125,
        isActive: true,
        isRecurring: false,
      },
      {
        title: 'Blind Instinct',
        description: 'Complete 3 blind tastings. Trust your palate!',
        type: 'blind_identify',
        difficulty: 'advanced',
        goalCount: 3,
        xpReward: 250,
        isActive: true,
        isRecurring: true,
      },
      {
        title: 'The Nose Knows',
        description: 'Score the nose component on 10 different whiskeys. Train your olfactory senses.',
        type: 'flavor_hunt',
        difficulty: 'beginner',
        goalCount: 10,
        goalDetails: { component: 'nose' },
        xpReward: 100,
        isActive: true,
        isRecurring: false,
      },
      {
        title: 'Community Spirit',
        description: 'Follow 5 other whiskey enthusiasts and explore their collections.',
        type: 'community_challenge',
        difficulty: 'beginner',
        goalCount: 5,
        goalDetails: { action: 'follow' },
        xpReward: 75,
        isActive: true,
        isRecurring: false,
      },
      {
        title: 'Critic\'s Circle',
        description: 'Write detailed tasting notes for 10 whiskeys. Quality matters!',
        type: 'review_streak',
        difficulty: 'advanced',
        goalCount: 10,
        xpReward: 300,
        isActive: true,
        isRecurring: true,
      },
    ];

    await db.insert(challenges).values(defaultChallenges);
  }
}

export const storage = new DatabaseStorage();