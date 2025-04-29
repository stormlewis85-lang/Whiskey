import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";
import { 
  insertWhiskeySchema, 
  updateWhiskeySchema, 
  reviewNoteSchema,
  excelImportSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all whiskeys
  app.get("/api/whiskeys", async (req: Request, res: Response) => {
    try {
      const whiskeys = await storage.getWhiskeys();
      res.json(whiskeys);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve whiskeys", error: String(error) });
    }
  });

  // Get a specific whiskey
  app.get("/api/whiskeys/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const whiskey = await storage.getWhiskey(id);
      
      if (!whiskey) {
        return res.status(404).json({ message: "Whiskey not found" });
      }
      
      res.json(whiskey);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve whiskey", error: String(error) });
    }
  });

  // Create a new whiskey
  app.post("/api/whiskeys", async (req: Request, res: Response) => {
    try {
      const validatedData = insertWhiskeySchema.parse(req.body);
      const newWhiskey = await storage.createWhiskey(validatedData);
      res.status(201).json(newWhiskey);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to create whiskey", error: String(error) });
    }
  });

  // Update a whiskey
  app.patch("/api/whiskeys/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const validatedData = updateWhiskeySchema.parse(req.body);
      const updatedWhiskey = await storage.updateWhiskey(id, validatedData);
      
      if (!updatedWhiskey) {
        return res.status(404).json({ message: "Whiskey not found" });
      }
      
      res.json(updatedWhiskey);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to update whiskey", error: String(error) });
    }
  });

  // Delete a whiskey
  app.delete("/api/whiskeys/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteWhiskey(id);
      
      if (!success) {
        return res.status(404).json({ message: "Whiskey not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete whiskey", error: String(error) });
    }
  });

  // Add a review to a whiskey
  app.post("/api/whiskeys/:id/reviews", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const validatedReview = reviewNoteSchema.parse(req.body);
      const updatedWhiskey = await storage.addReview(id, validatedReview);
      
      if (!updatedWhiskey) {
        return res.status(404).json({ message: "Whiskey not found" });
      }
      
      res.json(updatedWhiskey);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to add review", error: String(error) });
    }
  });

  // Import Excel file
  app.post("/api/import", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check file type
      const fileType = req.file.originalname.split('.').pop()?.toLowerCase();
      if (fileType !== 'xlsx' && fileType !== 'xls') {
        return res.status(400).json({ message: "Only Excel files (.xlsx, .xls) are supported" });
      }

      // Read the Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Validate and process the data
      const importedWhiskeys = [];
      const errors = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        try {
          // Match Excel column names to our schema
          const mapped = {
            name: row.Name || row.name,
            distillery: row.Distillery || row.distillery,
            type: row.Type || row.type,
            age: row.Age || row.age,
            price: row.Price || row.price,
            abv: row.ABV || row.abv,
            region: row.Region || row.region,
            rating: row.Rating || row.rating,
            notes: [],
          };

          const validatedData = excelImportSchema.parse(mapped);
          
          // Create the whiskey
          const newWhiskey = await storage.createWhiskey(validatedData);
          importedWhiskeys.push(newWhiskey);
        } catch (error) {
          errors.push({
            row: i + 1, // +1 to account for 0-indexing
            error: error instanceof ZodError 
              ? fromZodError(error).message 
              : String(error)
          });
        }
      }

      // Return the results
      res.status(201).json({
        success: importedWhiskeys.length > 0,
        imported: importedWhiskeys,
        errors: errors.length > 0 ? errors : undefined,
        totalImported: importedWhiskeys.length,
        totalErrors: errors.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to import data", error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
