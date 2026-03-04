import { pgTable, text, serial, integer, real, timestamp, jsonb, uuid, boolean, unique, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

// Bottle status enum for collection management
export const bottleStatusEnum = pgEnum('bottle_status', ['sealed', 'open', 'finished', 'gifted']);

// Drop status enum for store drops
export const dropStatusEnum = pgEnum('drop_status', ['active', 'expired', 'sold_out']);

// Store claim status enum
export const claimStatusEnum = pgEnum('claim_status', ['pending', 'approved', 'rejected']);

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
  password: text("password"), // Nullable for OAuth-only users
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
  // Security fields
  emailVerified: boolean("email_verified").default(false),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  accountLockedUntil: timestamp("account_locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    usernameUnique: unique("username_unique").on(table.username),
    emailUnique: unique("email_unique").on(table.email),
    profileSlugUnique: unique("profile_slug_unique").on(table.profileSlug),
  };
});

// OAuth Providers - linked social accounts
export const oauthProviders = pgTable("oauth_providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text("provider").notNull(), // 'google'
  providerUserId: text("provider_user_id").notNull(),
  providerEmail: text("provider_email"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueProvider: unique("unique_oauth_provider").on(table.provider, table.providerUserId),
}));

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Login Attempts - for rate limiting
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull(), // username or IP
  success: boolean("success").notNull().default(false),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
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
  // Rick House relations
  tastingSessions: many(tastingSessions),
  // Auth relations
  oauthProviders: many(oauthProviders),
  passwordResetTokens: many(passwordResetTokens),
  // Hunt relations
  storeFollows: many(storeFollows),
  drops: many(drops),
  notifications: many(notifications),
  // Club relations
  clubMemberships: many(clubMembers),
  clubSessionRatings: many(clubSessionRatings),
  // Social Layer relations
  activities: many(activities, { relationName: 'activities' }),
  tradeListings: many(tradeListings),
}));

// OAuth Providers relations
export const oauthProvidersRelations = relations(oauthProviders, ({ one }) => ({
  user: one(users, {
    fields: [oauthProviders.userId],
    references: [users.id],
  }),
}));

// Password Reset Tokens relations
export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
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
  // Rick House relations
  tastingSessions: many(tastingSessions),
  generatedScripts: many(generatedScripts),
  // Hunt relations
  drops: many(drops),
  // Club relations
  clubSessionWhiskeys: many(clubSessionWhiskeys),
  // Social Layer relations
  tradeListings: many(tradeListings),
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

// Password validation schema with security requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

// Create User Schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true, emailVerified: true, failedLoginAttempts: true, accountLockedUntil: true, lastLoginAt: true });

// Registration schema with strong password requirements
export const registerUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: passwordSchema.optional(), // Optional for OAuth users
  email: z.string().email("Invalid email address").optional(),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Password reset schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
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

// OAuth Provider types
export type OAuthProvider = typeof oauthProviders.$inferSelect;
export type InsertOAuthProvider = typeof oauthProviders.$inferInsert;

// Password Reset Token types
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Login Attempt types
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertLoginAttempt = typeof loginAttempts.$inferInsert;

// ==================== THE HUNT TABLES ====================

// Stores — liquor stores that users can follow
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"), // City, State
  address: text("address"),
  instagramHandle: text("instagram_handle"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  isVerified: boolean("is_verified").default(false),
  submittedBy: integer("submitted_by").references(() => users.id, { onDelete: 'set null' }),
  // Phase 2: Store Profile fields
  claimedBy: integer("claimed_by").references(() => users.id, { onDelete: 'set null' }),
  claimedAt: timestamp("claimed_at"),
  description: text("description"),
  phone: text("phone"),
  website: text("website"),
  hours: text("hours"), // Free-form text, e.g. "Mon-Sat 9am-9pm, Sun 12-6pm"
  coverImage: text("cover_image"),
  logoImage: text("logo_image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Store Follows — user follows a store
export const storeFollows = pgTable("store_follows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueStoreFollow: unique("unique_store_follow").on(table.userId, table.storeId),
}));

// Drops — bottle sightings at stores
export const drops = pgTable("drops", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: 'cascade' }),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  whiskeyName: text("whiskey_name").notNull(),
  whiskeyType: text("whiskey_type"), // Bourbon, Scotch, etc.
  whiskeyId: integer("whiskey_id").references(() => whiskeys.id, { onDelete: 'set null' }),
  price: real("price"),
  status: dropStatusEnum("status").default('active'),
  droppedAt: timestamp("dropped_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications — in-app alerts
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // 'store_new_drop', 'wishlist_match', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional context (storeId, dropId, etc.)
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Store Claims — users request to claim ownership of a store
export const storeClaims = pgTable("store_claims", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: claimStatusEnum("status").default('pending'),
  businessRole: text("business_role"), // "owner", "manager", "employee"
  verificationNote: text("verification_note"), // User's proof of ownership
  reviewNote: text("review_note"), // Admin note on approval/rejection
  reviewedBy: integer("reviewed_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Store Views — page view analytics
export const storeViews = pgTable("store_views", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: 'cascade' }),
  viewedBy: integer("viewed_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Store relations
export const storesRelations = relations(stores, ({ one, many }) => ({
  submitter: one(users, {
    fields: [stores.submittedBy],
    references: [users.id],
  }),
  owner: one(users, {
    fields: [stores.claimedBy],
    references: [users.id],
  }),
  follows: many(storeFollows),
  drops: many(drops),
  claims: many(storeClaims),
  views: many(storeViews),
}));

// Store follows relations
export const storeFollowsRelations = relations(storeFollows, ({ one }) => ({
  user: one(users, {
    fields: [storeFollows.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [storeFollows.storeId],
    references: [stores.id],
  }),
}));

// Drops relations
export const dropsRelations = relations(drops, ({ one }) => ({
  store: one(stores, {
    fields: [drops.storeId],
    references: [stores.id],
  }),
  creator: one(users, {
    fields: [drops.createdBy],
    references: [users.id],
  }),
  whiskey: one(whiskeys, {
    fields: [drops.whiskeyId],
    references: [whiskeys.id],
  }),
}));

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Store claims relations
export const storeClaimsRelations = relations(storeClaims, ({ one }) => ({
  store: one(stores, {
    fields: [storeClaims.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [storeClaims.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [storeClaims.reviewedBy],
    references: [users.id],
  }),
}));

// Store views relations
export const storeViewsRelations = relations(storeViews, ({ one }) => ({
  store: one(stores, {
    fields: [storeViews.storeId],
    references: [stores.id],
  }),
  viewer: one(users, {
    fields: [storeViews.viewedBy],
    references: [users.id],
  }),
}));

// Store schemas
export const insertStoreSchema = createInsertSchema(stores)
  .omit({ id: true, createdAt: true, updatedAt: true, isVerified: true, claimedBy: true, claimedAt: true });

export const updateStoreSchema = insertStoreSchema.partial();

// Drop schemas
export const dropStatusValues = ['active', 'expired', 'sold_out'] as const;
export type DropStatus = typeof dropStatusValues[number];

export const insertDropSchema = createInsertSchema(drops)
  .omit({ id: true, createdAt: true, droppedAt: true });

export const updateDropSchema = z.object({
  status: z.enum(dropStatusValues).optional(),
  notes: z.string().optional(),
  price: z.number().optional(),
});

// Store types
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type UpdateStore = z.infer<typeof updateStoreSchema>;

// Store follow types
export type StoreFollow = typeof storeFollows.$inferSelect;

// Drop types
export type Drop = typeof drops.$inferSelect;
export type InsertDrop = z.infer<typeof insertDropSchema>;
export type UpdateDrop = z.infer<typeof updateDropSchema>;

// Notification types
export type Notification = typeof notifications.$inferSelect;

// Store claim schemas
export const claimStatusValues = ['pending', 'approved', 'rejected'] as const;
export type ClaimStatus = typeof claimStatusValues[number];

export const insertStoreClaimSchema = createInsertSchema(storeClaims)
  .omit({ id: true, createdAt: true, reviewedAt: true, reviewedBy: true, status: true });

export type StoreClaim = typeof storeClaims.$inferSelect;
export type InsertStoreClaim = z.infer<typeof insertStoreClaimSchema>;

// Store view types
export type StoreView = typeof storeViews.$inferSelect;

// Store profile update schema (for claimed store owners)
export const updateStoreProfileSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(1000).optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  hours: z.string().optional(),
  address: z.string().optional(),
  instagramHandle: z.string().optional(),
});

export type UpdateStoreProfile = z.infer<typeof updateStoreProfileSchema>;

// ==================== TASTING CLUBS TABLES ====================

// Club role enum
export const clubRoleEnum = pgEnum('club_role', ['admin', 'member']);

// Club member status enum
export const clubMemberStatusEnum = pgEnum('club_member_status', ['invited', 'active', 'removed']);

// Club session status enum
export const clubSessionStatusEnum = pgEnum('club_session_status', ['draft', 'active', 'revealed', 'completed']);

// Clubs table
export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Club Members table
export const clubMembers = pgTable("club_members", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: clubRoleEnum("role").default('member'),
  status: clubMemberStatusEnum("status").default('invited'),
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueClubMember: unique("unique_club_member").on(table.clubId, table.userId),
}));

// Club Sessions table
export const clubSessions = pgTable("club_sessions", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: 'cascade' }),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  status: clubSessionStatusEnum("status").default('draft'),
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  revealedAt: timestamp("revealed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Club Session Whiskeys table
export const clubSessionWhiskeys = pgTable("club_session_whiskeys", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => clubSessions.id, { onDelete: 'cascade' }),
  whiskeyId: integer("whiskey_id").notNull().references(() => whiskeys.id, { onDelete: 'cascade' }),
  label: text("label").notNull(), // A, B, C, etc.
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Club Session Ratings table
export const clubSessionRatings = pgTable("club_session_ratings", {
  id: serial("id").primaryKey(),
  sessionWhiskeyId: integer("session_whiskey_id").notNull().references(() => clubSessionWhiskeys.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: real("rating").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueSessionWhiskeyUser: unique("unique_session_whiskey_user").on(table.sessionWhiskeyId, table.userId),
}));

// Club relations
export const clubsRelations = relations(clubs, ({ one, many }) => ({
  creator: one(users, {
    fields: [clubs.createdBy],
    references: [users.id],
  }),
  members: many(clubMembers),
  sessions: many(clubSessions),
}));

export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
  club: one(clubs, {
    fields: [clubMembers.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubMembers.userId],
    references: [users.id],
  }),
}));

export const clubSessionsRelations = relations(clubSessions, ({ one, many }) => ({
  club: one(clubs, {
    fields: [clubSessions.clubId],
    references: [clubs.id],
  }),
  creator: one(users, {
    fields: [clubSessions.createdBy],
    references: [users.id],
  }),
  whiskeys: many(clubSessionWhiskeys),
}));

export const clubSessionWhiskeysRelations = relations(clubSessionWhiskeys, ({ one, many }) => ({
  session: one(clubSessions, {
    fields: [clubSessionWhiskeys.sessionId],
    references: [clubSessions.id],
  }),
  whiskey: one(whiskeys, {
    fields: [clubSessionWhiskeys.whiskeyId],
    references: [whiskeys.id],
  }),
  ratings: many(clubSessionRatings),
}));

export const clubSessionRatingsRelations = relations(clubSessionRatings, ({ one }) => ({
  sessionWhiskey: one(clubSessionWhiskeys, {
    fields: [clubSessionRatings.sessionWhiskeyId],
    references: [clubSessionWhiskeys.id],
  }),
  user: one(users, {
    fields: [clubSessionRatings.userId],
    references: [users.id],
  }),
}));

// Club schemas
export const clubRoleValues = ['admin', 'member'] as const;
export type ClubRole = typeof clubRoleValues[number];

export const clubMemberStatusValues = ['invited', 'active', 'removed'] as const;
export type ClubMemberStatus = typeof clubMemberStatusValues[number];

export const clubSessionStatusValues = ['draft', 'active', 'revealed', 'completed'] as const;
export type ClubSessionStatus = typeof clubSessionStatusValues[number];

export const insertClubSchema = createInsertSchema(clubs)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const updateClubSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

export const insertClubSessionSchema = createInsertSchema(clubSessions)
  .omit({ id: true, createdAt: true, startedAt: true, revealedAt: true, completedAt: true });

export const insertClubSessionRatingSchema = z.object({
  rating: z.number().min(0).max(5),
  notes: z.string().optional(),
});

// Club types
export type Club = typeof clubs.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type UpdateClub = z.infer<typeof updateClubSchema>;

export type ClubMember = typeof clubMembers.$inferSelect;

export type ClubSession = typeof clubSessions.$inferSelect;
export type InsertClubSession = z.infer<typeof insertClubSessionSchema>;

export type ClubSessionWhiskey = typeof clubSessionWhiskeys.$inferSelect;

export type ClubSessionRating = typeof clubSessionRatings.$inferSelect;
export type InsertClubSessionRating = z.infer<typeof insertClubSessionRatingSchema>;

// ==================== PHASE 4: SOCIAL LAYER TABLES ====================

// Activity type enum
export const activityTypeEnum = pgEnum('activity_type', [
  'follow', 'add_bottle', 'review', 'like', 'trade_list', 'trade_complete'
]);

// Trade listing status enum
export const tradeStatusEnum = pgEnum('trade_status', ['available', 'pending', 'completed', 'withdrawn']);

// Activities table - tracks user actions for the activity feed
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: activityTypeEnum("type").notNull(),
  targetUserId: integer("target_user_id").references(() => users.id, { onDelete: 'cascade' }),
  whiskeyId: integer("whiskey_id").references(() => whiskeys.id, { onDelete: 'cascade' }),
  metadata: jsonb("metadata"), // Flexible extra data (review rating, trade details, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

// Trade Listings table - bottles flagged for trade
export const tradeListings = pgTable("trade_listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  whiskeyId: integer("whiskey_id").notNull().references(() => whiskeys.id, { onDelete: 'cascade' }),
  status: tradeStatusEnum("status").default('available'),
  seeking: text("seeking"), // What the user wants in return
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity relations
export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
    relationName: 'activities',
  }),
  targetUser: one(users, {
    fields: [activities.targetUserId],
    references: [users.id],
    relationName: 'targetActivities',
  }),
  whiskey: one(whiskeys, {
    fields: [activities.whiskeyId],
    references: [whiskeys.id],
  }),
}));

// Trade listing relations
export const tradeListingsRelations = relations(tradeListings, ({ one }) => ({
  user: one(users, {
    fields: [tradeListings.userId],
    references: [users.id],
  }),
  whiskey: one(whiskeys, {
    fields: [tradeListings.whiskeyId],
    references: [whiskeys.id],
  }),
}));

// Activity schemas
export const activityTypeValues = ['follow', 'add_bottle', 'review', 'like', 'trade_list', 'trade_complete'] as const;
export type ActivityType = typeof activityTypeValues[number];

export const insertActivitySchema = createInsertSchema(activities)
  .omit({ id: true, createdAt: true });

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Trade listing schemas
export const tradeStatusValues = ['available', 'pending', 'completed', 'withdrawn'] as const;
export type TradeStatus = typeof tradeStatusValues[number];

export const insertTradeListingSchema = z.object({
  whiskeyId: z.number().int(),
  seeking: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateTradeListingSchema = z.object({
  status: z.enum(tradeStatusValues).optional(),
  seeking: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export type TradeListing = typeof tradeListings.$inferSelect;
export type InsertTradeListing = z.infer<typeof insertTradeListingSchema>;
export type UpdateTradeListing = z.infer<typeof updateTradeListingSchema>;

// ==================== PHASE 5: PALATE DEVELOPMENT TABLES ====================

// Challenge type enum
export const challengeTypeEnum = pgEnum('challenge_type', [
  'blind_identify',      // Identify whiskey characteristics blind
  'flavor_hunt',         // Find specific flavors in tastings
  'review_streak',       // Complete reviews on consecutive days
  'explore_type',        // Try whiskeys from new categories/regions
  'community_challenge'  // Social challenges with friends
]);

// Challenge difficulty enum
export const challengeDifficultyEnum = pgEnum('challenge_difficulty', [
  'beginner', 'intermediate', 'advanced', 'expert'
]);

// User challenge status enum
export const userChallengeStatusEnum = pgEnum('user_challenge_status', [
  'active', 'completed', 'abandoned', 'expired'
]);

// Challenges table — defines available challenges
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: challengeTypeEnum("type").notNull(),
  difficulty: challengeDifficultyEnum("difficulty").notNull().default('beginner'),
  goalCount: integer("goal_count").notNull().default(1),  // Target number to complete
  goalDetails: jsonb("goal_details"),  // Type-specific config (e.g., { flavorTarget: "vanilla", typeTarget: "Scotch" })
  xpReward: integer("xp_reward").notNull().default(50),
  durationDays: integer("duration_days"),  // NULL = no time limit
  isActive: boolean("is_active").notNull().default(true),
  isRecurring: boolean("is_recurring").notNull().default(false),  // Can be re-taken
  createdAt: timestamp("created_at").defaultNow(),
});

// User challenges — tracks per-user enrollment and progress
export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  progress: integer("progress").notNull().default(0),  // Current count toward goal
  status: userChallengeStatusEnum("status").notNull().default('active'),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),  // Progress details (e.g., { identifiedFlavors: ["vanilla", "oak"] })
});

// User progress — XP, levels, streaks
export const userProgress = pgTable("user_progress", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),  // Consecutive days with activity
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: date("last_activity_date"),
  totalReviews: integer("total_reviews").notNull().default(0),
  totalChallengesCompleted: integer("total_challenges_completed").notNull().default(0),
  totalFlavorIds: integer("total_flavor_ids").notNull().default(0),  // Unique flavors identified
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Palate exercises — AI-generated exercises from Rick House
export const palateExercises = pgTable("palate_exercises", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  exerciseType: text("exercise_type").notNull(),  // 'nose_training', 'blind_comparison', 'flavor_isolation', 'palate_calibration'
  difficulty: challengeDifficultyEnum("difficulty").notNull().default('beginner'),
  instructions: jsonb("instructions").notNull(),  // AI-generated step-by-step instructions
  targetFlavors: jsonb("target_flavors"),  // Flavors to focus on
  whiskeyIds: jsonb("whiskey_ids"),  // Recommended whiskeys for the exercise
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  userNotes: text("user_notes"),  // User's notes after completing
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge relations
export const challengesRelations = relations(challenges, ({ many }) => ({
  userChallenges: many(userChallenges),
}));

export const userChallengesRelations = relations(userChallenges, ({ one }) => ({
  user: one(users, {
    fields: [userChallenges.userId],
    references: [users.id],
  }),
  challenge: one(challenges, {
    fields: [userChallenges.challengeId],
    references: [challenges.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
}));

export const palateExercisesRelations = relations(palateExercises, ({ one }) => ({
  user: one(users, {
    fields: [palateExercises.userId],
    references: [users.id],
  }),
}));

// Phase 5 Zod schemas
export const challengeTypeValues = ['blind_identify', 'flavor_hunt', 'review_streak', 'explore_type', 'community_challenge'] as const;
export type ChallengeType = typeof challengeTypeValues[number];

export const challengeDifficultyValues = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export type ChallengeDifficulty = typeof challengeDifficultyValues[number];

export const userChallengeStatusValues = ['active', 'completed', 'abandoned', 'expired'] as const;
export type UserChallengeStatus = typeof userChallengeStatusValues[number];

export const insertChallengeSchema = createInsertSchema(challenges)
  .omit({ id: true, createdAt: true });

export const insertUserChallengeSchema = z.object({
  challengeId: z.number().int(),
});

export const insertPalateExerciseSchema = createInsertSchema(palateExercises)
  .omit({ id: true, createdAt: true, completedAt: true, isCompleted: true });

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type PalateExercise = typeof palateExercises.$inferSelect;

// XP level thresholds
export const XP_LEVELS = [
  { level: 1, xpRequired: 0, title: 'Newcomer' },
  { level: 2, xpRequired: 100, title: 'Apprentice' },
  { level: 3, xpRequired: 300, title: 'Enthusiast' },
  { level: 4, xpRequired: 600, title: 'Connoisseur' },
  { level: 5, xpRequired: 1000, title: 'Aficionado' },
  { level: 6, xpRequired: 1500, title: 'Expert' },
  { level: 7, xpRequired: 2200, title: 'Master' },
  { level: 8, xpRequired: 3000, title: 'Sommelier' },
  { level: 9, xpRequired: 4000, title: 'Grand Master' },
  { level: 10, xpRequired: 5500, title: 'Legend' },
] as const;

export function getLevelForXP(xp: number): { level: number; title: string; xpRequired: number; nextLevelXp: number | null } {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      return {
        level: XP_LEVELS[i].level,
        title: XP_LEVELS[i].title,
        xpRequired: XP_LEVELS[i].xpRequired,
        nextLevelXp: i < XP_LEVELS.length - 1 ? XP_LEVELS[i + 1].xpRequired : null,
      };
    }
  }
  return { level: 1, title: 'Newcomer', xpRequired: 0, nextLevelXp: 100 };
}

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
