import { pgTable, text, serial, integer, real, timestamp, jsonb, uuid, boolean, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  region: text("region"),
  rating: real("rating").default(0),
  dateAdded: timestamp("date_added").defaultNow(),
  lastReviewed: timestamp("last_reviewed"),
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

// Review Note Schema - used within the notes field
export const reviewNoteSchema = z.object({
  id: z.string().optional(),
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
}));

export const whiskeysRelations = relations(whiskeys, ({ one }) => ({
  user: one(users, {
    fields: [whiskeys.userId],
    references: [users.id],
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

// Export all types
export type InsertWhiskey = z.infer<typeof insertWhiskeySchema>;
export type UpdateWhiskey = z.infer<typeof updateWhiskeySchema>;
export type Whiskey = typeof whiskeys.$inferSelect;
export type ExcelImportWhiskey = z.infer<typeof excelImportSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
