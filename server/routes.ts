import express, { type Express, type Request, type Response } from "express";
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
import path from "path";
import fs from "fs";
import { setupAuth, isAuthenticated } from "./auth";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup multer for Excel file uploads (in memory)
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Setup multer for image file uploads (on disk)
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Create a unique filename with timestamp and original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'bottle-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Get all whiskeys (filter by user if authenticated)
  app.get("/api/whiskeys", async (req: Request, res: Response) => {
    try {
      // If user is authenticated, get only their whiskeys
      if (req.session && req.session.userId) {
        const whiskeys = await storage.getWhiskeys(req.session.userId);
        return res.json(whiskeys);
      }
      
      // If no user, return all whiskeys (public or demo view)
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

  // Create a new whiskey (user must be authenticated)
  app.post("/api/whiskeys", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Ensure the whiskey is associated with the current user
      const whiskey = {
        ...req.body,
        userId: req.session.userId
      };
      
      const validatedData = insertWhiskeySchema.parse(whiskey);
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
  
  // Update a review
  app.put("/api/whiskeys/:id/reviews/:reviewId", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const reviewId = req.params.reviewId;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      const validatedReview = reviewNoteSchema.parse(req.body);
      const updatedWhiskey = await storage.updateReview(id, reviewId, validatedReview);
      
      if (!updatedWhiskey) {
        return res.status(404).json({ message: "Whiskey or review not found" });
      }
      
      res.json(updatedWhiskey);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to update review", error: String(error) });
    }
  });
  
  // Delete a review
  app.delete("/api/whiskeys/:id/reviews/:reviewId", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const reviewId = req.params.reviewId;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      const updatedWhiskey = await storage.deleteReview(id, reviewId);
      
      if (!updatedWhiskey) {
        return res.status(404).json({ message: "Whiskey or review not found" });
      }
      
      res.json(updatedWhiskey);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete review", error: String(error) });
    }
  });

  // Upload bottle image
  app.post("/api/whiskeys/:id/image", imageUpload.single("image"), async (req: Request, res: Response) => {
    console.log("Image upload request received for whiskey ID:", req.params.id);
    console.log("Request files:", req.file || "No file");
    console.log("Request body:", req.body);
    
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        console.log("Invalid ID format:", req.params.id);
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      if (!req.file) {
        console.log("No image file found in request");
        return res.status(400).json({ message: "No image uploaded" });
      }
      
      console.log("File uploaded successfully:", req.file.filename);
      
      // Get the path to the uploaded image
      const imagePath = `/uploads/${req.file.filename}`;
      console.log("Image path:", imagePath);
      
      // Update the whiskey with the new image path
      const updatedWhiskey = await storage.updateWhiskey(id, { image: imagePath });
      console.log("Whiskey updated with image path:", updatedWhiskey ? "success" : "failed");
      
      if (!updatedWhiskey) {
        console.log("Whiskey not found, deleting uploaded file");
        // If whiskey not found, delete the uploaded file to avoid orphaned files
        fs.unlinkSync(path.join(process.cwd(), "uploads", req.file.filename));
        return res.status(404).json({ message: "Whiskey not found" });
      }
      
      console.log("Image upload successful, returning response");
      res.json({ 
        success: true, 
        whiskey: updatedWhiskey,
        image: imagePath
      });
    } catch (error) {
      console.error("Error in image upload:", error);
      
      // If there's an error, try to delete the uploaded file if it exists
      if (req.file) {
        try {
          console.log("Deleting uploaded file due to error");
          fs.unlinkSync(path.join(process.cwd(), 'uploads', req.file.filename));
        } catch (err) {
          console.error("Error deleting file:", err);
          // Ignore errors when cleaning up files
        }
      }
      
      res.status(500).json({ message: "Failed to upload image", error: String(error) });
    }
  });

  // Serve uploaded images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  console.log("Serving uploads from:", path.join(process.cwd(), 'uploads'));
  
  // Import Excel file
  app.post("/api/import", excelUpload.single("file"), async (req: Request, res: Response) => {
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
        const row = jsonData[i] as Record<string, any>;
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
