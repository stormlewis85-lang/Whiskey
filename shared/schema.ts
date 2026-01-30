import { pgTable, text, serial, integer, real, timestamp, jsonb, uuid, boolean, unique, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

// Bottle status enum for collection management
export const bottleStatusEnum = pgEnum('bottle_status', ['sealed', 'open', 'finished', 'gifted']);

// Blind tasting status enum
export const blindTastingStatusEnum = pgEnum('blind_tasting_status', ['active', 'revealed', 'completed']);

// Distilleries Schema
export const distilleries = pgTable("distilleries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  country: text("country"),
  region: text("region"),
  type: text("type"), // Primary spirit type: Bourbon, Scotch, Irish, Japanese, Rye, etc.
  yearFounded: integer("year_founded"),
  parentCompany: text("parent_company"),
  website: text("website"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImage: text("profile_image"),
  authToken: text("auth_token"),  // Add token field for token-based auth
  tokenExpiry: timestamp("token_expiry"),  // When the token expires
  // Profile fields
  bio: text("bio"),
  profileSlug: text("profile_slug"),
  isPublic: boolean("is_public").default(false),
  showWishlistOnProfile: boolean("show_wishlist_on_profile").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    usernameUnique: unique("username_unique").on(table.username),
    emailUnique: unique("email_unique").on(table.email),
    profileSlugUnique: unique("profile_slug_unique").on(table.profileSlug),
  };
});

// Whiskey to Users Relations will be defined after whiskeys is defined

// Whiskey Collection Schema
export const whiskeys = pgTable("whiskeys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  distillery: text("distillery"),
  type: text("type"),
  age: integer("age"),
  price: real("price"),
  abv: real("abv"),
  proof: real("proof"), // Proof (ABV * 2)
  region: text("region"),
  rating: real("rating").default(0),
  dateAdded: timestamp("date_added").defaultNow(),
  lastReviewed: timestamp("last_reviewed"),
  releaseDate: date("release_date"), // Release date
  msrp: real("msrp"), // Manufacturer's Suggested Retail Price
  pricePaid: real("price_paid"), // Actual price paid
  image: text("image"),
  notes: jsonb("notes").default([]),
  // Additional bourbon/whiskey categorization fields
  bottleType: text("bottle_type"), // Single Barrel, Small Batch, etc.
  mashBill: text("mash_bill"), // High Corn, High Rye, Wheated
  caskStrength: text("cask_strength"), // Yes/No
  finished: text("finished"), // Yes/No
  finishType: text("finish_type"), // What it was finished in
  // Collection management fields
  isWishlist: boolean("is_wishlist").default(false), // Track bottles on wishlist vs owned
  status: bottleStatusEnum("status").default('sealed'), // sealed, open, finished, gifted
  quantity: integer("quantity").default(1), // Number of bottles owned
  purchaseDate: date("purchase_date"), // When bottle was purchased
  purchaseLocation: text("purchase_location"), // Where bottle was purchased
  // Visibility for public profiles
  isPublic: boolean("is_public").default(false), // Whether this whiskey shows on public profile
  // Barcode/UPC for lookup
  barcode: text("barcode"), // Barcode for scanning/lookup
  upc: text("upc"), // Universal Product Code
  // Distillery reference
  distilleryId: integer("distillery_id").references(() => distilleries.id, { onDelete: 'set null' }),
  // User relationship
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
});

// Follows table for social features
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: integer("following_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Prevent duplicate follows
    uniqueFollow: unique("unique_follow").on(table.followerId, table.followingId),
  };
});

// Review Comments schema
export const reviewComments = pgTable("review_comments", {
  id: serial("id").primaryKey(),
  whiskeyId: integer("whiskey_id").notNull().references(() => whiskeys.id, { onDelete: 'cascade' }),
  reviewId: text("review_id").notNull(), // References the review's ID in the notes array
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Review Likes schema
export const reviewLikes = pgTable("review_likes", {
  id: serial("id").primaryKey(),
  whiskeyId: integer("whiskey_id").notNull().references(() => whiskeys.id, { onDelete: 'cascade' }),
  reviewId: text("review_id").notNull(), // References the review's ID in the notes array
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Ensure a user can only like a review once
    userReviewUnique: unique("user_review_unique").on(table.userId, table.reviewId)
  };
});

// Price Tracking schema
export const priceTracks = pgTable("price_tracks", {
  id: serial("id").primaryKey(),
  whiskeyId: integer("whiskey_id").notNull().references(() => whiskeys.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  price: real("price").notNull(),
  store: text("store"),
  location: text("location"),
  date: date("date").notNull().defaultNow(),
  url: text("url"), // URL to online store listing
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Market Value Estimates schema
export const marketValues = pgTable("market_values", {
  id: serial("id").primaryKey(),
  whiskeyId: integer("whiskey_id").notNull().references(() => whiskeys.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  retailPrice: real("retail_price"), // MSRP or regular retail price
  secondaryValue: real("secondary_value"), // Value on secondary market
  auctionValue: real("auction_value"), // Value at auctions
  source: text("source"), // Source of the valuation (website, auction house, etc.)
  date: date("date").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasting Flights schema
export const flights = pgTable("flights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  tastingDate: date("tasting_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Flight Whiskeys junction table
export const flightWhiskeys = pgTable("flight_whiskeys", {
  id: serial("id").primaryKey(),
  flightId: integer("flight_id").notNull().references(() => flights.id, { onDelete: 'cascade' }),
  whiskeyId: integer("whiskey_id").notNull().references(() => whiskeys.id, { onDelete: 'cascade' }),
  order: integer("order").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blind Tastings schema
export const blindTastings = pgTable("blind_tastings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  status: blindTastingStatusEnum("status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  revealedAt: timestamp("revealed_at"),
  completedAt: timestamp("completed_at"),
});

// Blind Tasting Whiskeys table
export const blindTastingWhiskeys = pgTable("blind_tasting_whiskeys", {
  id: serial("id").primaryKey(),
  blindTastingId: integer("blind_tasting_id").notNull().references(() => blindTastings.id, { onDelete: 'cascade' }),
  whiskeyId: integer("whiskey_id").notNull().references(() => whiskeys.id, { onDelete: 'cascade' }),
  label: text("label").notNull(), // A, B, C, etc.
  order: integer("order").notNull().default(0),
  blindRating: real("blind_rating"),
  blindNotes: text("blind_notes"),
  revealedAt: timestamp("revealed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Review Note Schema - used within the notes field
export const reviewNoteSchema = z.object({
  id: z.string().optional().default(() => uuidv4()),
  rating: z.number().min(0).max(5),
  date: z.string(),
  text: z.string(),
  flavor: z.string().optional(),
  // Visual details
  visualColor: z.string().optional(),
  visualViscosity: z.string().optional(),
  visualClarity: z.string().optional(),
  visualScore: z.number().min(1).max(5).optional(),
  visualNotes: z.string().optional(),
  // Nose details
  noseAromas: z.array(z.string()).optional(),
  noseScore: z.number().min(1).max(5).optional(),
  noseNotes: z.string().optional(),
  // Mouthfeel details
  mouthfeelAlcohol: z.string().optional(),
  mouthfeelViscosity: z.string().optional(),
  mouthfeelPleasantness: z.string().optional(),
  mouthfeelScore: z.number().min(1).max(5).optional(),
  mouthfeelNotes: z.string().optional(),
  // Taste details
  tasteFlavors: z.array(z.string()).optional(),
  tasteCorrelation: z.boolean().optional(),
  tasteScore: z.number().min(1).max(5).optional(),
  tasteNotes: z.string().optional(),
  // Finish details
  finishFlavors: z.array(z.string()).optional(),
  finishCorrelation: z.boolean().optional(),
  finishLength: z.string().optional(),
  finishPleasantness: z.string().optional(),
  finishScore: z.number().min(1).max(5).optional(),
  finishNotes: z.string().optional(),
  // Value details
  valueAvailability: z.string().optional(),
  valueBuyAgain: z.string().optional(),
  valueOccasion: z.string().optional(),
  valueScore: z.number().min(1).max(5).optional(),
  valueNotes: z.string().optional(),
  // Legacy fields for compatibility
  visual: z.string().optional(),
  nose: z.string().optional(),
  mouthfeel: z.string().optional(),
  taste: z.string().optional(),
  finish: z.string().optional(),
  value: z.string().optional(),
  // Social sharing options
  isPublic: z.boolean().default(false),
  shareId: z.string().optional().default(() => uuidv4()), // Unique ID for sharing the review
  // Flavor profile ratings (0-5 scale)
  flavorProfileFruitFloral: z.number().min(0).max(5).optional(),
  flavorProfileSweet: z.number().min(0).max(5).optional(),
  flavorProfileSpice: z.number().min(0).max(5).optional(),
  flavorProfileHerbal: z.number().min(0).max(5).optional(),
  flavorProfileGrain: z.number().min(0).max(5).optional(),
  flavorProfileOak: z.number().min(0).max(5).optional()
});

export type ReviewNote = z.infer<typeof reviewNoteSchema>;

// Insert Schema for Whiskey
export const insertWhiskeySchema = createInsertSchema(whiskeys)
  .omit({ id: true, dateAdded: true })
  .extend({
    notes: z.array(reviewNoteSchema).default([]),
  });

// Update Schema for Whiskey
export const updateWhiskeySchema = insertWhiskeySchema.partial();

// Bottle status type for validation
export const bottleStatusValues = ['sealed', 'open', 'finished', 'gifted'] as const;
export type BottleStatus = typeof bottleStatusValues[number];

// Excel Import Schema
export const excelImportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  distillery: z.string().optional(),
  type: z.string().optional(),
  age: z.number().optional().nullable(),
  price: z.number().optional().nullable(),
  abv: z.number().optional().nullable(),
  region: z.string().optional(),
  rating: z.number().min(0).max(5).optional().nullable(),
  notes: z.array(reviewNoteSchema).optional().default([]),
  // Additional categorization fields
  bottleType: z.string().optional(),
  mashBill: z.string().optional(),
  caskStrength: z.string().optional(),
  finished: z.string().optional(),
  finishType: z.string().optional(),
  // Collection management fields
  isWishlist: z.boolean().optional().default(false),
  status: z.enum(bottleStatusValues).optional().default('sealed'),
  quantity: z.number().int().min(0).optional().default(1),
  purchaseDate: z.string().optional().nullable(),
  purchaseLocation: z.string().optional().nullable(),
  // Barcode/UPC
  barcode: z.string().optional().nullable(),
  upc: z.string().optional().nullable(),
  // Distillery reference
  distilleryId: z.number().int().optional().nullable(),
});

// Add relations after tables are defined
export const usersRelations = relations(users, ({ many }) => ({
  whiskeys: many(whiskeys),
  reviewComments: many(reviewComments),
  reviewLikes: many(reviewLikes),
  priceTracks: many(priceTracks),
  marketValues: many(marketValues),
  flights: many(flights),
  blindTastings: many(blindTastings),
  // Follow relations
  followers: many(follows, { relationName: 'followers' }),
  following: many(follows, { relationName: 'following' }),
}));

// Distilleries relations
export const distilleriesRelations = relations(distilleries, ({ many }) => ({
  whiskeys: many(whiskeys),
}));

// Follows relations
export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: 'following',
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: 'followers',
  }),
}));

export const whiskeysRelations = relations(whiskeys, ({ one, many }) => ({
  user: one(users, {
    fields: [whiskeys.userId],
    references: [users.id],
  }),
  distillery: one(distilleries, {
    fields: [whiskeys.distilleryId],
    references: [distilleries.id],
  }),
  comments: many(reviewComments),
  likes: many(reviewLikes),
  priceHistory: many(priceTracks),
  marketValuations: many(marketValues),
  flightWhiskeys: many(flightWhiskeys),
  blindTastingWhiskeys: many(blindTastingWhiskeys),
}));

export const reviewCommentsRelations = relations(reviewComments, ({ one }) => ({
  user: one(users, {
    fields: [reviewComments.userId],
    references: [users.id],
  }),
  whiskey: one(whiskeys, {
    fields: [reviewComments.whiskeyId],
    references: [whiskeys.id],
  }),
}));

export const reviewLikesRelations = relations(reviewLikes, ({ one }) => ({
  user: one(users, {
    fields: [reviewLikes.userId],
    references: [users.id],
  }),
  whiskey: one(whiskeys, {
    fields: [reviewLikes.whiskeyId],
    references: [whiskeys.id],
  }),
}));

// Create User Schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSchema = createInsertSchema(users)
  .omit({ id: true, password: true, createdAt: true, updatedAt: true })
  .partial();

// Comment schemas
export const insertCommentSchema = createInsertSchema(reviewComments)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const updateCommentSchema = createInsertSchema(reviewComments)
  .omit({ id: true, userId: true, whiskeyId: true, reviewId: true, createdAt: true, updatedAt: true })
  .partial();

// Like schema
export const insertLikeSchema = createInsertSchema(reviewLikes)
  .omit({ id: true, createdAt: true });

// Price Track schemas
export const insertPriceTrackSchema = createInsertSchema(priceTracks)
  .omit({ id: true, createdAt: true });

export const updatePriceTrackSchema = createInsertSchema(priceTracks)
  .omit({ id: true, userId: true, whiskeyId: true, createdAt: true })
  .partial();

// Market Value schemas
export const insertMarketValueSchema = createInsertSchema(marketValues)
  .omit({ id: true, createdAt: true });

export const updateMarketValueSchema = createInsertSchema(marketValues)
  .omit({ id: true, userId: true, whiskeyId: true, createdAt: true })
  .partial();

// Distillery schemas
export const insertDistillerySchema = createInsertSchema(distilleries)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const updateDistillerySchema = insertDistillerySchema.partial();

// Price Track relations
export const priceTracksRelations = relations(priceTracks, ({ one }) => ({
  user: one(users, {
    fields: [priceTracks.userId],
    references: [users.id],
  }),
  whiskey: one(whiskeys, {
    fields: [priceTracks.whiskeyId],
    references: [whiskeys.id],
  }),
}));

// Market Value relations
export const marketValuesRelations = relations(marketValues, ({ one }) => ({
  user: one(users, {
    fields: [marketValues.userId],
    references: [users.id],
  }),
  whiskey: one(whiskeys, {
    fields: [marketValues.whiskeyId],
    references: [whiskeys.id],
  }),
}));

// Flight relations
export const flightsRelations = relations(flights, ({ one, many }) => ({
  user: one(users, {
    fields: [flights.userId],
    references: [users.id],
  }),
  whiskeys: many(flightWhiskeys),
}));

export const flightWhiskeysRelations = relations(flightWhiskeys, ({ one }) => ({
  flight: one(flights, {
    fields: [flightWhiskeys.flightId],
    references: [flights.id],
  }),
  whiskey: one(whiskeys, {
    fields: [flightWhiskeys.whiskeyId],
    references: [whiskeys.id],
  }),
}));

// Blind Tasting relations
export const blindTastingsRelations = relations(blindTastings, ({ one, many }) => ({
  user: one(users, {
    fields: [blindTastings.userId],
    references: [users.id],
  }),
  whiskeys: many(blindTastingWhiskeys),
}));

export const blindTastingWhiskeysRelations = relations(blindTastingWhiskeys, ({ one }) => ({
  blindTasting: one(blindTastings, {
    fields: [blindTastingWhiskeys.blindTastingId],
    references: [blindTastings.id],
  }),
  whiskey: one(whiskeys, {
    fields: [blindTastingWhiskeys.whiskeyId],
    references: [whiskeys.id],
  }),
}));

// Export all types
export type InsertWhiskey = z.infer<typeof insertWhiskeySchema>;
export type UpdateWhiskey = z.infer<typeof updateWhiskeySchema>;
export type Whiskey = typeof whiskeys.$inferSelect;
export type ExcelImportWhiskey = z.infer<typeof excelImportSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type ReviewComment = typeof reviewComments.$inferSelect;
export type InsertReviewComment = z.infer<typeof insertCommentSchema>;
export type UpdateReviewComment = z.infer<typeof updateCommentSchema>;

export type ReviewLike = typeof reviewLikes.$inferSelect;
export type InsertReviewLike = z.infer<typeof insertLikeSchema>;

export type PriceTrack = typeof priceTracks.$inferSelect;
export type InsertPriceTrack = z.infer<typeof insertPriceTrackSchema>;
export type UpdatePriceTrack = z.infer<typeof updatePriceTrackSchema>;

export type MarketValue = typeof marketValues.$inferSelect;
export type InsertMarketValue = z.infer<typeof insertMarketValueSchema>;
export type UpdateMarketValue = z.infer<typeof updateMarketValueSchema>;

export type Distillery = typeof distilleries.$inferSelect;
export type InsertDistillery = z.infer<typeof insertDistillerySchema>;
export type UpdateDistillery = z.infer<typeof updateDistillerySchema>;

// Flight schemas
export const insertFlightSchema = createInsertSchema(flights)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const updateFlightSchema = insertFlightSchema.partial();

export const insertFlightWhiskeySchema = createInsertSchema(flightWhiskeys)
  .omit({ id: true, createdAt: true });

export const updateFlightWhiskeySchema = insertFlightWhiskeySchema
  .omit({ flightId: true, whiskeyId: true })
  .partial();

// Blind Tasting schemas
export const blindTastingStatusValues = ['active', 'revealed', 'completed'] as const;
export type BlindTastingStatus = typeof blindTastingStatusValues[number];

export const insertBlindTastingSchema = createInsertSchema(blindTastings)
  .omit({ id: true, createdAt: true, revealedAt: true, completedAt: true });

export const updateBlindTastingSchema = insertBlindTastingSchema.partial();

export const insertBlindTastingWhiskeySchema = createInsertSchema(blindTastingWhiskeys)
  .omit({ id: true, createdAt: true, revealedAt: true });

export const updateBlindTastingWhiskeySchema = z.object({
  blindRating: z.number().min(0).max(5).optional(),
  blindNotes: z.string().optional(),
});

// Flight types
export type Flight = typeof flights.$inferSelect;
export type InsertFlight = z.infer<typeof insertFlightSchema>;
export type UpdateFlight = z.infer<typeof updateFlightSchema>;

export type FlightWhiskey = typeof flightWhiskeys.$inferSelect;
export type InsertFlightWhiskey = z.infer<typeof insertFlightWhiskeySchema>;
export type UpdateFlightWhiskey = z.infer<typeof updateFlightWhiskeySchema>;

// Blind Tasting types
export type BlindTasting = typeof blindTastings.$inferSelect;
export type InsertBlindTasting = z.infer<typeof insertBlindTastingSchema>;
export type UpdateBlindTasting = z.infer<typeof updateBlindTastingSchema>;

export type BlindTastingWhiskey = typeof blindTastingWhiskeys.$inferSelect;
export type InsertBlindTastingWhiskey = z.infer<typeof insertBlindTastingWhiskeySchema>;
export type UpdateBlindTastingWhiskey = z.infer<typeof updateBlindTastingWhiskeySchema>;

// Follow schemas and types
export const insertFollowSchema = createInsertSchema(follows)
  .omit({ id: true, createdAt: true });

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;

// Profile settings schema
export const updateProfileSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().max(500).optional(),
  profileSlug: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/,
    "Profile URL can only contain lowercase letters, numbers, underscores, and hyphens").optional(),
  isPublic: z.boolean().optional(),
  showWishlistOnProfile: z.boolean().optional(),
  profileImage: z.string().optional(),
});

export type UpdateProfile = z.infer<typeof updateProfileSchema>;

// Public profile type (safe to expose)
export type PublicUser = Pick<User,
  'id' | 'username' | 'displayName' | 'profileImage' | 'bio' | 'profileSlug' | 'createdAt'
>;

// AI Usage Logs for rate limiting and analytics
export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text("endpoint").notNull(), // 'suggest-notes' or 'enhance-notes'
  whiskeyId: integer("whiskey_id").references(() => whiskeys.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Usage relations
export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  user: one(users, {
    fields: [aiUsageLogs.userId],
    references: [users.id],
  }),
  whiskey: one(whiskeys, {
    fields: [aiUsageLogs.whiskeyId],
    references: [whiskeys.id],
  }),
}));

// AI Usage types
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertAiUsageLog = typeof aiUsageLogs.$inferInsert;

// ==================== RICK HOUSE TABLES ====================

// Tasting session mode enum
export const tastingSessionModeEnum = pgEnum('tasting_session_mode', ['guided', 'notes']);

// Tasting Sessions table - tracks user's guided tasting experiences with Rick
export const tastingSessions = pgTable("tasting_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  whiskeyId: integer("whiskey_id").notNull().references(() => whiskeys.id, { onDelete: 'cascade' }),
  mode: tastingSessionModeEnum("mode").notNull().default('guided'),
  scriptJson: jsonb("script_json"), // The generated Rick script
  audioUrl: text("audio_url"), // URL to generated audio file
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasting Sessions relations
export const tastingSessionsRelations = relations(tastingSessions, ({ one }) => ({
  user: one(users, {
    fields: [tastingSessions.userId],
    references: [users.id],
  }),
  whiskey: one(whiskeys, {
    fields: [tastingSessions.whiskeyId],
    references: [whiskeys.id],
  }),
}));

// Tasting Sessions schemas
export const insertTastingSessionSchema = createInsertSchema(tastingSessions)
  .omit({ id: true, createdAt: true, startedAt: true });

export const updateTastingSessionSchema = insertTastingSessionSchema.partial();

// Tasting Sessions types
export type TastingSession = typeof tastingSessions.$inferSelect;
export type InsertTastingSession = z.infer<typeof insertTastingSessionSchema>;
export type UpdateTastingSession = z.infer<typeof updateTastingSessionSchema>;

// Tasting session mode type
export const tastingSessionModeValues = ['guided', 'notes'] as const;
export type TastingSessionMode = typeof tastingSessionModeValues[number];

// Generated Scripts cache table - caches Rick's generated scripts per whiskey
export const generatedScripts = pgTable("generated_scripts", {
  id: serial("id").primaryKey(),
  whiskeyId: integer("whiskey_id").notNull().references(() => whiskeys.id, { onDelete: 'cascade' }),
  scriptJson: jsonb("script_json").notNull(), // The cached Rick script
  reviewCountAtGeneration: integer("review_count_at_generation").notNull().default(0), // Number of reviews when script was generated
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // When the cache expires (e.g., 7 days after generation)
});

// Generated Scripts relations
export const generatedScriptsRelations = relations(generatedScripts, ({ one }) => ({
  whiskey: one(whiskeys, {
    fields: [generatedScripts.whiskeyId],
    references: [whiskeys.id],
  }),
}));

// Generated Scripts schemas
export const insertGeneratedScriptSchema = createInsertSchema(generatedScripts)
  .omit({ id: true, generatedAt: true });

export const updateGeneratedScriptSchema = insertGeneratedScriptSchema.partial();

// Generated Scripts types
export type GeneratedScript = typeof generatedScripts.$inferSelect;
export type InsertGeneratedScript = z.infer<typeof insertGeneratedScriptSchema>;
export type UpdateGeneratedScript = z.infer<typeof updateGeneratedScriptSchema>;

// Flavor tag constants for search/filter
export const FLAVOR_TAGS = {
  nose: [
    'Vanilla', 'Caramel', 'Oak', 'Honey', 'Butterscotch', 'Maple',
    'Cherry', 'Apple', 'Citrus', 'Orange Peel', 'Dried Fruit', 'Raisin',
    'Cinnamon', 'Nutmeg', 'Clove', 'Black Pepper', 'Allspice',
    'Tobacco', 'Leather', 'Coffee', 'Chocolate', 'Dark Chocolate',
    'Mint', 'Eucalyptus', 'Floral', 'Rose', 'Lavender',
    'Corn', 'Wheat', 'Rye', 'Biscuit', 'Bread',
    'Smoke', 'Peat', 'Charred Wood', 'Toasted Oak', 'Burnt Sugar'
  ],
  taste: [
    'Vanilla', 'Caramel', 'Brown Sugar', 'Honey', 'Butterscotch', 'Toffee',
    'Cherry', 'Dark Fruit', 'Apple', 'Pear', 'Banana', 'Tropical Fruit',
    'Cinnamon', 'Nutmeg', 'Baking Spice', 'Black Pepper', 'White Pepper',
    'Oak', 'Charred Oak', 'Toasted Wood', 'Cedar',
    'Chocolate', 'Cocoa', 'Coffee', 'Espresso',
    'Corn', 'Grain', 'Malt', 'Bread', 'Cereal',
    'Leather', 'Tobacco', 'Earth', 'Mineral',
    'Mint', 'Herbal', 'Grass', 'Hay'
  ],
  finish: [
    'Vanilla', 'Caramel', 'Honey', 'Maple', 'Butterscotch',
    'Oak', 'Char', 'Smoke', 'Ash', 'Toasted',
    'Spice', 'Cinnamon', 'Pepper', 'Warmth', 'Heat',
    'Fruit', 'Cherry', 'Berry', 'Citrus',
    'Chocolate', 'Coffee', 'Mocha',
    'Leather', 'Tobacco', 'Earth',
    'Sweet', 'Dry', 'Tannic', 'Bitter', 'Lingering'
  ]
} as const;
