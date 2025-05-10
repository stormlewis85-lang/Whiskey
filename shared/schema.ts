import { pgTable, text, serial, integer, real, timestamp, jsonb, uuid, boolean, unique, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    usernameUnique: unique("username_unique").on(table.username),
    emailUnique: unique("email_unique").on(table.email),
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
  // User relationship
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
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
});

// Add relations after tables are defined
export const usersRelations = relations(users, ({ many }) => ({
  whiskeys: many(whiskeys),
  reviewComments: many(reviewComments),
  reviewLikes: many(reviewLikes),
  priceTracks: many(priceTracks),
  marketValues: many(marketValues),
}));

export const whiskeysRelations = relations(whiskeys, ({ one, many }) => ({
  user: one(users, {
    fields: [whiskeys.userId],
    references: [users.id],
  }),
  comments: many(reviewComments),
  likes: many(reviewLikes),
  priceHistory: many(priceTracks),
  marketValuations: many(marketValues),
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
