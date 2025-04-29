import { pgTable, text, serial, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
});

// Review Note Schema - used within the notes field
export const reviewNoteSchema = z.object({
  id: z.string().optional(),
  rating: z.number().min(0).max(5),
  date: z.string(),
  text: z.string(),
  flavor: z.string().optional(),
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

export type InsertWhiskey = z.infer<typeof insertWhiskeySchema>;
export type UpdateWhiskey = z.infer<typeof updateWhiskeySchema>;
export type Whiskey = typeof whiskeys.$inferSelect;
export type ExcelImportWhiskey = z.infer<typeof excelImportSchema>;
