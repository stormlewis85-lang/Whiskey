import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import sharp from "sharp";
import * as XLSX from "xlsx";
import { z } from "zod";
import {
  insertWhiskeySchema,
  updateWhiskeySchema,
  reviewNoteSchema,
  excelImportSchema,
  insertCommentSchema,
  updateCommentSchema,
  insertPriceTrackSchema,
  updatePriceTrackSchema,
  insertMarketValueSchema,
  updateMarketValueSchema,
  insertFlightSchema,
  updateFlightSchema,
  updateFlightWhiskeySchema,
  insertBlindTastingSchema,
  updateBlindTastingWhiskeySchema,
  updateProfileSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import path from "path";
import fs from "fs";
import { setupAuth, isAuthenticated } from "./auth";

// Helper to get userId with type safety (throws if not authenticated)
function getUserId(req: Request): number {
  const userId = req.session?.userId;
  if (userId === undefined) {
    throw new Error("User not authenticated");
  }
  return userId;
}

// Ensure upload directory exists - use a consistent path that works in all environments
const uploadDir = path.join(process.cwd(), "uploads");
console.log("Serving uploads from:", uploadDir);
if (!fs.existsSync(uploadDir)) {
  console.log("Creating uploads directory:", uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Make sure directory is writable
try {
  fs.accessSync(uploadDir, fs.constants.W_OK);
  console.log("Uploads directory is writable");
} catch (err) {
  console.error("Error: Uploads directory is not writable:", err);
}

// Setup multer for Excel file uploads (in memory)
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Setup multer for image file uploads (on disk) - stores original temporarily
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Create a unique filename with timestamp - will be processed to WebP
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'bottle-temp-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (images will be resized/compressed)
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

// Process uploaded image: resize to max 800px wide, convert to WebP
async function processImage(inputPath: string, outputPath: string): Promise<{ width: number; height: number }> {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Don't upscale small images
  const maxWidth = 800;
  const shouldResize = metadata.width && metadata.width > maxWidth;

  // Auto-rotate based on EXIF orientation (fixes sideways mobile photos)
  let processedImage = image.rotate();

  if (shouldResize) {
    processedImage = processedImage.resize(maxWidth, null, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Convert to WebP with quality 80
  await processedImage
    .webp({ quality: 80 })
    .toFile(outputPath);

  // Get final dimensions
  const finalMetadata = await sharp(outputPath).metadata();
  return {
    width: finalMetadata.width || metadata.width || 0,
    height: finalMetadata.height || metadata.height || 0
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Get all whiskeys (requires authentication - users only see their own bottles)
  app.get("/api/whiskeys", async (req: Request, res: Response) => {
    try {
      // User must be authenticated to see their collection
      if (!req.session || !req.session.userId) {
        console.log('Unauthenticated request to /api/whiskeys - returning empty array');
        return res.json([]);
      }

      const userId = req.session.userId;
      console.log(`Getting whiskeys for authenticated user ID: ${userId}`);

      const whiskeys = await storage.getWhiskeys(userId);

      console.log(`Retrieved ${whiskeys.length} whiskey(s) for user ID: ${userId}`);
      if (whiskeys.length > 0) {
        console.log('Sample whiskey data:', {
          id: whiskeys[0].id,
          name: whiskeys[0].name,
          userId: whiskeys[0].userId
        });
      }

      return res.json(whiskeys);
    } catch (error) {
      console.error("Error retrieving whiskeys:", error);
      res.status(500).json({ message: "Failed to retrieve whiskeys", error: String(error) });
    }
  });

  // Get a specific whiskey (requires authentication - users only see their own bottles)
  app.get("/api/whiskeys/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // User must be authenticated to access bottle details
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Only return the whiskey if it belongs to this user
      const whiskey = await storage.getWhiskey(id, req.session.userId);

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
      const userId = req.session.userId;
      console.log(`Creating new whiskey for user ID: ${userId}`);
      
      const whiskey = {
        ...req.body,
        userId: userId
      };
      
      console.log("New whiskey data:", { 
        name: whiskey.name, 
        distillery: whiskey.distillery,
        userId: whiskey.userId
      });
      
      const validatedData = insertWhiskeySchema.parse(whiskey);
      const newWhiskey = await storage.createWhiskey(validatedData);
      console.log(`Successfully created whiskey ID ${newWhiskey.id} for user ${userId}`);
      res.status(201).json(newWhiskey);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to create whiskey", error: String(error) });
    }
  });

  // Update a whiskey (user must be authenticated)
  app.patch("/api/whiskeys/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const validatedData = updateWhiskeySchema.parse(req.body);
      // Pass userId to ensure user only updates their own whiskeys
      const updatedWhiskey = await storage.updateWhiskey(id, validatedData, getUserId(req));
      
      if (!updatedWhiskey) {
        return res.status(404).json({ message: "Whiskey not found or not owned by you" });
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

  // Delete a whiskey (user must be authenticated and own the bottle)
  app.delete("/api/whiskeys/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.userId;

      console.log(`Delete whiskey request - ID: ${id}, User ID: ${userId}`);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      if (!userId) {
        console.log("No userId found in session during delete operation");
        return res.status(401).json({ message: "Your login expired. Please log in again to continue." });
      }

      // Always verify ownership - user can only delete their own bottles
      const success = await storage.deleteWhiskey(id, userId);

      if (!success) {
        console.log(`Whiskey not found or not owned by user: ${userId}`);
        return res.status(404).json({ message: "Whiskey not found or not owned by you" });
      }

      console.log(`Successfully deleted whiskey: ${id}`);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting whiskey:", error);
      res.status(500).json({ message: "Failed to delete whiskey", error: String(error) });
    }
  });

  // Add a review to a whiskey (user must be authenticated)
  app.post("/api/whiskeys/:id/reviews", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const validatedReview = reviewNoteSchema.parse(req.body);
      const updatedWhiskey = await storage.addReview(id, validatedReview, getUserId(req));
      
      if (!updatedWhiskey) {
        return res.status(404).json({ message: "Whiskey not found or not owned by you" });
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
  
  // Update a review (user must be authenticated)
  app.put("/api/whiskeys/:id/reviews/:reviewId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const reviewId = req.params.reviewId;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      const validatedReview = reviewNoteSchema.parse(req.body);
      const updatedWhiskey = await storage.updateReview(id, reviewId, validatedReview, getUserId(req));
      
      if (!updatedWhiskey) {
        return res.status(404).json({ message: "Whiskey or review not found or not owned by you" });
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
  
  // Delete a review (user must be authenticated)
  app.delete("/api/whiskeys/:id/reviews/:reviewId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const reviewId = req.params.reviewId;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      const updatedWhiskey = await storage.deleteReview(id, reviewId, getUserId(req));
      
      if (!updatedWhiskey) {
        return res.status(404).json({ message: "Whiskey or review not found or not owned by you" });
      }
      
      res.json(updatedWhiskey);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete review", error: String(error) });
    }
  });

  // Upload bottle image (user must be authenticated)
  // Wrap multer to handle errors gracefully
  app.post("/api/whiskeys/:id/image", isAuthenticated, (req: Request, res: Response, next) => {
    imageUpload.single("image")(req, res, (err: any) => {
      if (err) {
        console.error("Multer error:", err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: "File too large. Maximum size is 10MB." });
        }
        return res.status(400).json({ message: err.message || "File upload error" });
      }
      next();
    });
  }, async (req: Request, res: Response) => {
    console.log("Image upload request received for whiskey ID:", req.params.id);
    console.log("Request files:", req.file ? `File: ${req.file.filename}, size: ${req.file.size}` : "No file");

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

      // Process the image: resize and convert to WebP
      const tempPath = path.join(uploadDir, req.file.filename);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const processedFilename = `bottle-${uniqueSuffix}.webp`;
      const processedPath = path.join(uploadDir, processedFilename);

      try {
        const dimensions = await processImage(tempPath, processedPath);
        console.log(`Image processed: ${dimensions.width}x${dimensions.height}`);

        // Delete the temporary original file
        fs.unlinkSync(tempPath);
        console.log("Deleted temp file:", tempPath);
      } catch (processError) {
        console.error("Image processing error:", processError);
        // Clean up temp file on error
        try { fs.unlinkSync(tempPath); } catch (e) { /* ignore */ }
        return res.status(500).json({ message: "Failed to process image", error: String(processError) });
      }

      // Verify processed file exists
      try {
        fs.accessSync(processedPath, fs.constants.R_OK);
        console.log("Processed file exists and is readable:", processedPath);
      } catch (err) {
        console.error("Processed file permission error:", err);
        return res.status(500).json({ message: "File permission error", error: String(err) });
      }

      // Get the path to the processed image
      const imagePath = `/uploads/${processedFilename}`;
      console.log("Image path:", imagePath);
      
      // Get userId from session or token
      const userId = req.session.userId;
      if (!userId) {
        console.log("No userId in session, cannot update whiskey");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get whiskey with ownership check - user can only upload images to their own bottles
      const whiskey = await storage.getWhiskey(id, userId);

      if (!whiskey) {
        console.log("Whiskey not found or not owned by user, deleting processed file");
        try {
          fs.unlinkSync(processedPath);
        } catch (unlinkErr) {
          console.error("Error deleting file after whiskey not found:", unlinkErr);
        }
        return res.status(404).json({ message: "Whiskey not found or not owned by you" });
      }

      // Update the whiskey with the new image path
      const updatedWhiskey = await storage.updateWhiskey(id, { image: imagePath }, userId);
      console.log("Whiskey updated with image path:", updatedWhiskey ? "success" : "failed");

      if (!updatedWhiskey) {
        console.log("Failed to update whiskey with image path, deleting processed file");
        try {
          fs.unlinkSync(processedPath);
        } catch (unlinkErr) {
          console.error("Error deleting file after update failure:", unlinkErr);
        }
        return res.status(500).json({ message: "Failed to update whiskey with image" });
      }

      // Ensure the image is properly served
      console.log("Full image file path:", processedPath);
      console.log("File exists:", fs.existsSync(processedPath));

      console.log("Image upload successful, returning response");
      res.json({
        success: true,
        whiskey: updatedWhiskey,
        image: imagePath
      });
    } catch (error) {
      console.error("Error in image upload:", error);
      res.status(500).json({ message: "Failed to upload image", error: String(error) });
    }
  });

  // Serve uploaded images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  console.log("Serving uploads from:", path.join(process.cwd(), 'uploads'));

  // Get a specific review by whiskey ID and review ID (requires authentication)
  app.get("/api/whiskeys/:id/reviews/:reviewId", async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      const reviewId = req.params.reviewId;

      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }

      // User must be authenticated to access their reviews
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Only return whiskey if it belongs to this user
      const whiskey = await storage.getWhiskey(whiskeyId, req.session.userId);

      if (!whiskey) {
        return res.status(404).json({ message: "Whiskey not found" });
      }
      
      // Find the review
      if (!whiskey.notes || !Array.isArray(whiskey.notes)) {
        return res.status(404).json({ message: "No reviews found for this whiskey" });
      }
      
      // Log for debugging
      console.log("Looking for review:", reviewId, "in whiskey notes:", whiskey.notes.map(n => n.id));
      
      // Find the review with string comparison for safety
      const review = whiskey.notes.find(note => String(note.id) === String(reviewId));
      
      if (!review) {
        return res.status(404).json({ 
          message: "Review not found", 
          reviewId,
          availableReviews: whiskey.notes.map(n => ({ id: n.id, date: n.date }))
        });
      }
      
      res.json({ whiskey, review });
    } catch (error) {
      res.status(500).json({ 
        message: "Error retrieving review", 
        error: String(error) 
      });
    }
  });

  // Social Features: Review Sharing API Routes

  // Toggle a review's public status (user must be authenticated)
  app.post("/api/whiskeys/:id/reviews/:reviewId/share", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      const reviewId = req.params.reviewId;
      const isPublic = req.body.isPublic === true;
      
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      const updatedWhiskey = await storage.toggleReviewPublic(
        whiskeyId,
        reviewId,
        isPublic,
        getUserId(req)
      );
      
      if (!updatedWhiskey) {
        return res.status(404).json({ message: "Whiskey or review not found or not owned by you" });
      }
      
      // Find the updated review
      const notes = updatedWhiskey.notes as { id: string; shareId?: string }[];
      const updatedReview = notes.find((note: { id: string }) => note.id === reviewId);
      
      res.json({
        success: true,
        isPublic,
        shareId: updatedReview?.shareId,
        shareUrl: updatedReview?.shareId ? `/shared/${updatedReview.shareId}` : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update sharing status", error: String(error) });
    }
  });

  // Get a shared review by its shareId (public, no auth required)
  app.get("/api/shared/:shareId", async (req: Request, res: Response) => {
    try {
      const shareId = req.params.shareId;
      const result = await storage.getSharedReview(shareId);
      
      if (!result) {
        return res.status(404).json({ message: "Shared review not found or not public" });
      }
      
      const { whiskey, review } = result;

      // Get the user info for this whiskey
      if (!whiskey.userId) {
        return res.status(404).json({ message: "Whiskey has no owner" });
      }
      const user = await storage.getUser(whiskey.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return only necessary user information (no sensitive data)
      const userInfo = {
        id: user.id,
        displayName: user.displayName || user.username,
        profileImage: user.profileImage
      };
      
      // Sanitize the whiskey object to hide sensitive information
      const sanitizedWhiskey = {
        id: whiskey.id,
        name: whiskey.name,
        distillery: whiskey.distillery,
        type: whiskey.type,
        age: whiskey.age,
        abv: whiskey.abv,
        region: whiskey.region,
        rating: whiskey.rating,
        image: whiskey.image,
        bottleType: whiskey.bottleType,
        mashBill: whiskey.mashBill,
        caskStrength: whiskey.caskStrength,
        finished: whiskey.finished,
        finishType: whiskey.finishType
      };
      
      res.json({
        whiskey: sanitizedWhiskey,
        review,
        user: userInfo
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared review", error: String(error) });
    }
  });

  // Get all public reviews (paginated, no auth required)
  app.get("/api/reviews/public", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const publicReviews = await storage.getPublicReviews(limit, offset);
      
      // Sanitize the response to remove sensitive information
      const sanitizedReviews = publicReviews.map(({ whiskey, review, user }) => ({
        whiskey: {
          id: whiskey.id,
          name: whiskey.name,
          distillery: whiskey.distillery,
          type: whiskey.type,
          age: whiskey.age,
          abv: whiskey.abv,
          region: whiskey.region,
          rating: whiskey.rating,
          image: whiskey.image,
          bottleType: whiskey.bottleType,
          mashBill: whiskey.mashBill,
          caskStrength: whiskey.caskStrength,
          finished: whiskey.finished,
          finishType: whiskey.finishType
        },
        review,
        user: {
          id: user.id,
          displayName: user.displayName || user.username,
          profileImage: user.profileImage
        }
      }));
      
      res.json(sanitizedReviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public reviews", error: String(error) });
    }
  });

  // Add a comment to a review (user must be authenticated)
  app.post("/api/whiskeys/:id/reviews/:reviewId/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      const reviewId = req.params.reviewId;
      
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      // Validate comment data
      const validatedComment = insertCommentSchema.parse({
        ...req.body,
        userId: getUserId(req),
        whiskeyId,
        reviewId
      });
      
      // Add the comment
      const newComment = await storage.addReviewComment(whiskeyId, reviewId, validatedComment);

      // Get the user info for this comment
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      // Return the comment with the user info
      res.status(201).json({
        comment: newComment,
        user: user ? {
          id: user.id,
          displayName: user.displayName || user.username,
          profileImage: user.profileImage
        } : null
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to add comment", error: String(error) });
    }
  });

  // Update a comment (user must be authenticated and own the comment)
  app.put("/api/comments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID format" });
      }
      
      // Validate comment data
      const validatedComment = updateCommentSchema.parse(req.body);
      
      // Update the comment
      const updatedComment = await storage.updateReviewComment(
        commentId,
        validatedComment,
        getUserId(req)
      );
      
      if (!updatedComment) {
        return res.status(404).json({ message: "Comment not found or not owned by you" });
      }
      
      res.json(updatedComment);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to update comment", error: String(error) });
    }
  });

  // Delete a comment (user must be authenticated and own the comment)
  app.delete("/api/comments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID format" });
      }
      
      // Delete the comment
      const success = await storage.deleteReviewComment(commentId, getUserId(req));
      
      if (!success) {
        return res.status(404).json({ message: "Comment not found or not owned by you" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment", error: String(error) });
    }
  });

  // Get all comments for a review
  app.get("/api/whiskeys/:id/reviews/:reviewId/comments", async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      const reviewId = req.params.reviewId;
      
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      // Get all comments for the review
      const comments = await storage.getReviewComments(whiskeyId, reviewId);
      
      // Get user info for each comment
      const userIds = Array.from(new Set(comments.map(comment => comment.userId)));
      const userPromises = userIds.map(userId => storage.getUser(userId));
      const users = await Promise.all(userPromises);
      
      // Map users to an object for easy lookup
      const userMap = users.reduce((map, user) => {
        if (user) {
          map[user.id] = {
            id: user.id,
            displayName: user.displayName || user.username,
            profileImage: user.profileImage
          };
        }
        return map;
      }, {} as Record<number, any>);
      
      // Combine comments with user info
      const commentsWithUsers = comments.map(comment => ({
        comment,
        user: userMap[comment.userId]
      }));
      
      res.json(commentsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments", error: String(error) });
    }
  });

  // Toggle a like on a review (user must be authenticated)
  app.post("/api/whiskeys/:id/reviews/:reviewId/like", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      const reviewId = req.params.reviewId;
      
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      // Toggle the like
      const result = await storage.toggleReviewLike(whiskeyId, reviewId, getUserId(req));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like", error: String(error) });
    }
  });

  // Get likes for a review
  app.get("/api/whiskeys/:id/reviews/:reviewId/likes", async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      const reviewId = req.params.reviewId;
      
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      // Get all likes for the review
      const likes = await storage.getReviewLikes(whiskeyId, reviewId);
      
      // Check if the current user has liked the review
      let userLiked = false;
      if (req.session && req.session.userId) {
        userLiked = likes.some(like => like.userId === req.session.userId);
      }
      
      res.json({
        count: likes.length,
        userLiked
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch likes", error: String(error) });
    }
  });
  
  // Import Excel file (user must be authenticated)
  app.post("/api/import", isAuthenticated, excelUpload.single("file"), async (req: Request, res: Response) => {
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
            // Add the userId to associate with the current user
            userId: getUserId(req)
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

  // Price Tracking API Routes
  
  // Get price history for a whiskey
  app.get("/api/whiskeys/:id/prices", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      const priceHistory = await storage.getWhiskeyPriceHistory(whiskeyId, getUserId(req));
      
      if (!priceHistory) {
        return res.status(404).json({ message: "Whiskey not found or not owned by you" });
      }
      
      res.json(priceHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price history", error: String(error) });
    }
  });
  
  // Add a price entry for a whiskey
  app.post("/api/whiskeys/:id/prices", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      // Validate price data
      const priceData = insertPriceTrackSchema.parse({
        ...req.body,
        whiskeyId,
        userId: getUserId(req),
      });
      
      const newPriceEntry = await storage.addPriceTrack(priceData);
      
      if (!newPriceEntry) {
        return res.status(404).json({ message: "Whiskey not found or not owned by you" });
      }
      
      res.status(201).json(newPriceEntry);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to add price entry", error: String(error) });
    }
  });
  
  // Update a price entry
  app.put("/api/whiskeys/:id/prices/:priceId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      const priceId = parseInt(req.params.priceId);
      
      if (isNaN(whiskeyId) || isNaN(priceId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Validate update data
      const updateData = updatePriceTrackSchema.parse(req.body);
      
      const updatedPrice = await storage.updatePriceTrack(priceId, updateData, getUserId(req));
      
      if (!updatedPrice) {
        return res.status(404).json({ message: "Price entry not found or not owned by you" });
      }
      
      res.json(updatedPrice);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to update price entry", error: String(error) });
    }
  });
  
  // Delete a price entry
  app.delete("/api/whiskeys/:id/prices/:priceId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      const priceId = parseInt(req.params.priceId);
      
      if (isNaN(whiskeyId) || isNaN(priceId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deletePriceTrack(priceId, getUserId(req));
      
      if (!success) {
        return res.status(404).json({ message: "Price entry not found or not owned by you" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete price entry", error: String(error) });
    }
  });
  
  // Market Value API Routes
  
  // Get market value history for a whiskey
  app.get("/api/whiskeys/:id/market-values", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      const marketValues = await storage.getWhiskeyMarketValues(whiskeyId, getUserId(req));
      
      if (!marketValues) {
        return res.status(404).json({ message: "Whiskey not found or not owned by you" });
      }
      
      res.json(marketValues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market values", error: String(error) });
    }
  });
  
  // Add a market value entry for a whiskey
  app.post("/api/whiskeys/:id/market-values", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      // Validate market value data
      const marketValueData = insertMarketValueSchema.parse({
        ...req.body,
        whiskeyId,
        userId: getUserId(req),
      });
      
      const newMarketValue = await storage.addMarketValue(marketValueData);
      
      if (!newMarketValue) {
        return res.status(404).json({ message: "Whiskey not found or not owned by you" });
      }
      
      res.status(201).json(newMarketValue);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to add market value", error: String(error) });
    }
  });
  
  // Update a market value entry
  app.put("/api/whiskeys/:id/market-values/:valueId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      const valueId = parseInt(req.params.valueId);
      
      if (isNaN(whiskeyId) || isNaN(valueId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Validate update data
      const updateData = updateMarketValueSchema.parse(req.body);
      
      const updatedValue = await storage.updateMarketValue(valueId, updateData, getUserId(req));
      
      if (!updatedValue) {
        return res.status(404).json({ message: "Market value entry not found or not owned by you" });
      }
      
      res.json(updatedValue);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to update market value", error: String(error) });
    }
  });
  
  // Delete a market value entry
  app.delete("/api/whiskeys/:id/market-values/:valueId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      const valueId = parseInt(req.params.valueId);

      if (isNaN(whiskeyId) || isNaN(valueId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteMarketValue(valueId, getUserId(req));

      if (!success) {
        return res.status(404).json({ message: "Market value entry not found or not owned by you" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete market value", error: String(error) });
    }
  });

  // ==================== FLAVOR ROUTES ====================

  // Get all flavors used by the user's collection
  app.get("/api/flavors", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const flavors = await storage.getAllUserFlavors(getUserId(req));
      res.json(flavors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flavors", error: String(error) });
    }
  });

  // Get whiskeys that have a specific flavor
  app.get("/api/flavors/:flavor/whiskeys", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const flavor = decodeURIComponent(req.params.flavor);
      const whiskeys = await storage.getWhiskeysWithFlavor(flavor, getUserId(req));
      res.json(whiskeys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch whiskeys by flavor", error: String(error) });
    }
  });

  // Get top flavors for a specific whiskey (requires authentication)
  app.get("/api/whiskeys/:id/flavors", async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }

      // User must be authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Only return whiskey if it belongs to this user
      const whiskey = await storage.getWhiskey(whiskeyId, req.session.userId);

      if (!whiskey) {
        return res.status(404).json({ message: "Whiskey not found" });
      }

      const topFlavors = storage.getTopFlavors(whiskey, 5);
      const allFlavors = storage.extractFlavorTags(whiskey);

      res.json({ topFlavors, allFlavors });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch whiskey flavors", error: String(error) });
    }
  });

  // ==================== RICK HOUSE ROUTES ====================

  // Get community notes for a whiskey (aggregated from all users' reviews)
  app.get("/api/whiskeys/:id/community-notes", async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }

      const communityNotes = await storage.getCommunityNotes(whiskeyId);

      if (!communityNotes) {
        return res.status(404).json({ message: "Whiskey not found" });
      }

      res.json(communityNotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch community notes", error: String(error) });
    }
  });

  // Get user's palate profile (Rick House personalization)
  app.get("/api/users/:id/palate-profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const targetUserId = parseInt(req.params.id);
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      // Users can only view their own palate profile
      const requestingUserId = getUserId(req);
      if (targetUserId !== requestingUserId) {
        return res.status(403).json({ message: "You can only view your own palate profile" });
      }

      const palateProfile = await storage.getPalateProfile(targetUserId);
      res.json(palateProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch palate profile", error: String(error) });
    }
  });

  // ==================== RICK HOUSE ROUTES ====================

  // Generate a tasting script with Rick House AI
  app.post("/api/rick/generate-script", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { whiskeyId, mode } = req.body;

      // Validate input
      if (!whiskeyId || typeof whiskeyId !== 'number') {
        return res.status(400).json({ message: "whiskeyId is required and must be a number" });
      }

      if (!mode || !['guided', 'notes'].includes(mode)) {
        return res.status(400).json({ message: "mode is required and must be 'guided' or 'notes'" });
      }

      const userId = getUserId(req);

      // Check rate limit (10 generations per day)
      const { allowed, remaining } = await storage.canUseAi(userId, 10);
      if (!allowed) {
        return res.status(429).json({
          message: "Daily limit reached. You can generate up to 10 scripts per day.",
          remaining: 0
        });
      }

      // Import and call the Rick service
      const { generateRickScript } = await import('./rick-service');

      const result = await generateRickScript({
        whiskeyId,
        userId,
        mode
      });

      // Log AI usage only if we actually generated (not cached)
      if (!result.cached) {
        await storage.logAiUsage(userId, 'rick-generate-script', whiskeyId);
      }

      res.json({ ...result, remaining: result.cached ? remaining : remaining - 1 });
    } catch (error) {
      console.error('Rick script generation error:', error);
      res.status(500).json({
        message: "Failed to generate tasting script",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Convert text to speech using ElevenLabs with Rick's voice
  app.post("/api/rick/text-to-speech", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { text, phase, requireAudio } = req.body;
      const userId = getUserId(req);

      // Validate input
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "text is required and must be a string" });
      }

      if (text.length > 5000) {
        return res.status(400).json({ message: "text is too long (max 5000 characters)" });
      }

      // Import ElevenLabs service
      const { checkElevenLabsConfig, generateSpeech } = await import('./elevenlabs-service');

      // Check if ElevenLabs is configured
      const configStatus = checkElevenLabsConfig();
      if (!configStatus.configured) {
        // Return text-only mode (don't count against rate limit)
        return res.json({
          audio: null,
          contentType: null,
          durationEstimate: Math.ceil((text.split(/\s+/).length / 150) * 60),
          phase: phase || null,
          textOnly: true,
          error: configStatus.error
        });
      }

      // Check rate limit (10 TTS calls per day, shared with script generation)
      const { allowed, remaining } = await storage.canUseAi(userId, 10);
      if (!allowed) {
        return res.status(429).json({
          message: "Daily limit reached. You can use Rick House up to 10 times per day.",
          remaining: 0
        });
      }

      // Try to generate audio
      try {
        const result = await generateSpeech({ text });

        // Log AI usage only on success
        await storage.logAiUsage(userId, 'rick-text-to-speech');

        res.json({
          audio: result.audioBase64,
          contentType: result.contentType,
          durationEstimate: result.durationEstimate,
          phase: phase || null,
          textOnly: false,
          remaining: remaining - 1
        });
      } catch (ttsError) {
        // If audio is required, return error
        if (requireAudio) {
          throw ttsError;
        }

        // Otherwise, return text-only fallback (don't count against rate limit)
        const errorMessage = ttsError instanceof Error ? ttsError.message : String(ttsError);
        console.warn('TTS failed, falling back to text-only:', errorMessage);

        res.json({
          audio: null,
          contentType: null,
          durationEstimate: Math.ceil((text.split(/\s+/).length / 150) * 60),
          phase: phase || null,
          textOnly: true,
          error: `Audio unavailable: ${errorMessage}`
        });
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      res.status(500).json({
        message: "Failed to generate speech",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Start a new tasting session with Rick
  app.post("/api/rick/start-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { whiskeyId, mode } = req.body;
      const userId = getUserId(req);

      // Validate input
      if (!whiskeyId || typeof whiskeyId !== 'number') {
        return res.status(400).json({ message: "whiskeyId is required and must be a number" });
      }

      if (!mode || !['guided', 'notes'].includes(mode)) {
        return res.status(400).json({ message: "mode is required and must be 'guided' or 'notes'" });
      }

      // Verify whiskey exists and belongs to user
      const whiskey = await storage.getWhiskey(whiskeyId, userId);
      if (!whiskey) {
        return res.status(404).json({ message: "Whiskey not found or not accessible" });
      }

      // Generate script (will use cache if available)
      const { generateRickScript } = await import('./rick-service');
      const scriptResult = await generateRickScript({ whiskeyId, userId, mode });

      // Create tasting session
      const session = await storage.createTastingSession({
        userId,
        whiskeyId,
        mode: mode as 'guided' | 'notes',
        scriptJson: scriptResult.script,
      });

      res.json({
        session: {
          id: session.id,
          whiskeyId: session.whiskeyId,
          mode: session.mode,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
        },
        script: scriptResult.script,
        cached: scriptResult.cached,
        whiskeyName: scriptResult.whiskeyName,
      });
    } catch (error) {
      console.error('Start session error:', error);
      res.status(500).json({
        message: "Failed to start tasting session",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update a tasting session (mark phases complete, store responses)
  app.patch("/api/rick/session/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const userId = getUserId(req);

      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      // Verify session exists and belongs to user
      const existingSession = await storage.getTastingSession(sessionId, userId);
      if (!existingSession) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Extract allowed update fields
      const { currentPhase, phaseResponses, audioUrl } = req.body;

      // Build update object - store phase data in scriptJson
      const currentScript = existingSession.scriptJson as Record<string, unknown> || {};
      const updateData: Record<string, unknown> = {
        scriptJson: {
          ...currentScript,
          currentPhase: currentPhase || currentScript.currentPhase,
          phaseResponses: phaseResponses || currentScript.phaseResponses || {},
        }
      };

      if (audioUrl) {
        updateData.audioUrl = audioUrl;
      }

      const updated = await storage.updateTastingSession(sessionId, userId, updateData);

      if (!updated) {
        return res.status(500).json({ message: "Failed to update session" });
      }

      res.json({
        id: updated.id,
        whiskeyId: updated.whiskeyId,
        mode: updated.mode,
        scriptJson: updated.scriptJson,
        audioUrl: updated.audioUrl,
        startedAt: updated.startedAt,
        completedAt: updated.completedAt,
      });
    } catch (error) {
      console.error('Update session error:', error);
      res.status(500).json({
        message: "Failed to update session",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Complete a tasting session and optionally link to a review
  app.post("/api/rick/complete-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { sessionId, reviewId } = req.body;
      const userId = getUserId(req);

      if (!sessionId || typeof sessionId !== 'number') {
        return res.status(400).json({ message: "sessionId is required and must be a number" });
      }

      // Verify session exists and belongs to user
      const existingSession = await storage.getTastingSession(sessionId, userId);
      if (!existingSession) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (existingSession.completedAt) {
        return res.status(400).json({ message: "Session already completed" });
      }

      // Build update with completion time and optional review link
      const currentScript = existingSession.scriptJson as Record<string, unknown> || {};
      const updateData: Record<string, unknown> = {
        completedAt: new Date(),
        scriptJson: {
          ...currentScript,
          linkedReviewId: reviewId || null,
        }
      };

      const completed = await storage.updateTastingSession(sessionId, userId, updateData);

      if (!completed) {
        return res.status(500).json({ message: "Failed to complete session" });
      }

      res.json({
        id: completed.id,
        whiskeyId: completed.whiskeyId,
        mode: completed.mode,
        startedAt: completed.startedAt,
        completedAt: completed.completedAt,
        linkedReviewId: reviewId || null,
        message: "Session completed successfully"
      });
    } catch (error) {
      console.error('Complete session error:', error);
      res.status(500).json({
        message: "Failed to complete session",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get user's tasting session history
  app.get("/api/rick/sessions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const sessions = await storage.getUserTastingSessions(userId);

      // Get whiskey names for each session
      const sessionsWithWhiskey = await Promise.all(
        sessions.map(async (session) => {
          const whiskey = await storage.getWhiskey(session.whiskeyId, userId);
          return {
            id: session.id,
            whiskeyId: session.whiskeyId,
            whiskeyName: whiskey?.name || 'Unknown',
            mode: session.mode,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            createdAt: session.createdAt
          };
        })
      );

      res.json(sessionsWithWhiskey);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        message: "Failed to get session history",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Generate a review guide script with Rick
  app.post("/api/rick/review-guide", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { whiskeyId } = req.body;
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!whiskeyId) {
        return res.status(400).json({ message: "whiskeyId is required" });
      }

      // Import the review guide generator
      const { generateRickReviewGuide } = await import('./rick-service');

      const result = await generateRickReviewGuide({
        whiskeyId: parseInt(whiskeyId),
        userId
      });

      res.json({
        success: true,
        script: result.script,
        whiskeyName: result.whiskeyName
      });
    } catch (error) {
      console.error('Review guide generation error:', error);
      res.status(500).json({
        message: "Failed to generate review guide",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ==================== RECOMMENDATION ROUTES ====================

  // Get recommendations for the user
  app.get("/api/recommendations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const recommendations = await storage.getRecommendations(getUserId(req), limit);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommendations", error: String(error) });
    }
  });

  // Get similar whiskeys to a specific whiskey
  app.get("/api/whiskeys/:id/similar", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }

      const limit = parseInt(req.query.limit as string) || 5;
      const similar = await storage.getSimilarWhiskeys(whiskeyId, getUserId(req), limit);
      res.json(similar);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch similar whiskeys", error: String(error) });
    }
  });

  // ==================== FLIGHT ROUTES ====================

  // Get all flights for the user
  app.get("/api/flights", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const flights = await storage.getFlights(getUserId(req));
      res.json(flights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flights", error: String(error) });
    }
  });

  // Get a specific flight with its whiskeys
  app.get("/api/flights/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const flightId = parseInt(req.params.id);
      if (isNaN(flightId)) {
        return res.status(400).json({ message: "Invalid flight ID format" });
      }

      const result = await storage.getFlightWithWhiskeys(flightId, getUserId(req));
      if (!result) {
        return res.status(404).json({ message: "Flight not found" });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flight", error: String(error) });
    }
  });

  // Create a new flight
  app.post("/api/flights", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const flightData = insertFlightSchema.parse({
        ...req.body,
        userId: getUserId(req)
      });

      const newFlight = await storage.createFlight(flightData);
      res.status(201).json(newFlight);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to create flight", error: String(error) });
    }
  });

  // Update a flight
  app.patch("/api/flights/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const flightId = parseInt(req.params.id);
      if (isNaN(flightId)) {
        return res.status(400).json({ message: "Invalid flight ID format" });
      }

      const updateData = updateFlightSchema.parse(req.body);
      const updated = await storage.updateFlight(flightId, updateData, getUserId(req));

      if (!updated) {
        return res.status(404).json({ message: "Flight not found" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to update flight", error: String(error) });
    }
  });

  // Delete a flight
  app.delete("/api/flights/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const flightId = parseInt(req.params.id);
      if (isNaN(flightId)) {
        return res.status(400).json({ message: "Invalid flight ID format" });
      }

      const success = await storage.deleteFlight(flightId, getUserId(req));
      if (!success) {
        return res.status(404).json({ message: "Flight not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete flight", error: String(error) });
    }
  });

  // Add a whiskey to a flight
  app.post("/api/flights/:id/whiskeys", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const flightId = parseInt(req.params.id);
      const whiskeyId = parseInt(req.body.whiskeyId);

      if (isNaN(flightId) || isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const result = await storage.addWhiskeyToFlight(flightId, whiskeyId, getUserId(req));
      if (!result) {
        return res.status(404).json({ message: "Flight not found" });
      }

      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to add whiskey to flight", error: String(error) });
    }
  });

  // Remove a whiskey from a flight
  app.delete("/api/flights/:flightId/whiskeys/:flightWhiskeyId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const flightWhiskeyId = parseInt(req.params.flightWhiskeyId);

      if (isNaN(flightWhiskeyId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.removeWhiskeyFromFlight(flightWhiskeyId, getUserId(req));
      if (!success) {
        return res.status(404).json({ message: "Flight whiskey not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove whiskey from flight", error: String(error) });
    }
  });

  // Update notes for a whiskey in a flight
  app.patch("/api/flights/:flightId/whiskeys/:flightWhiskeyId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const flightWhiskeyId = parseInt(req.params.flightWhiskeyId);

      if (isNaN(flightWhiskeyId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const updateData = updateFlightWhiskeySchema.parse(req.body);
      const updated = await storage.updateFlightWhiskey(flightWhiskeyId, updateData, getUserId(req));

      if (!updated) {
        return res.status(404).json({ message: "Flight whiskey not found" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to update flight whiskey", error: String(error) });
    }
  });

  // Reorder whiskeys in a flight
  app.post("/api/flights/:id/reorder", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const flightId = parseInt(req.params.id);
      const { whiskeyIds } = req.body;

      if (isNaN(flightId) || !Array.isArray(whiskeyIds)) {
        return res.status(400).json({ message: "Invalid request format" });
      }

      const success = await storage.reorderFlightWhiskeys(flightId, whiskeyIds, getUserId(req));
      if (!success) {
        return res.status(404).json({ message: "Flight not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder flight whiskeys", error: String(error) });
    }
  });

  // ==================== BLIND TASTING ROUTES ====================

  // Get all blind tastings for the user
  app.get("/api/blind-tastings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const blindTastings = await storage.getBlindTastings(getUserId(req));
      res.json(blindTastings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blind tastings", error: String(error) });
    }
  });

  // Get a specific blind tasting with its whiskeys
  app.get("/api/blind-tastings/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const btId = parseInt(req.params.id);
      if (isNaN(btId)) {
        return res.status(400).json({ message: "Invalid blind tasting ID format" });
      }

      const result = await storage.getBlindTastingWithWhiskeys(btId, getUserId(req));
      if (!result) {
        return res.status(404).json({ message: "Blind tasting not found" });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blind tasting", error: String(error) });
    }
  });

  // Create a new blind tasting
  app.post("/api/blind-tastings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { whiskeyIds, ...rest } = req.body;

      if (!Array.isArray(whiskeyIds) || whiskeyIds.length < 2) {
        return res.status(400).json({ message: "At least 2 whiskeys are required for a blind tasting" });
      }

      const blindTastingData = insertBlindTastingSchema.parse({
        ...rest,
        userId: getUserId(req)
      });

      const newBlindTasting = await storage.createBlindTasting(blindTastingData, whiskeyIds);
      res.status(201).json(newBlindTasting);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to create blind tasting", error: String(error) });
    }
  });

  // Delete a blind tasting
  app.delete("/api/blind-tastings/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const btId = parseInt(req.params.id);
      if (isNaN(btId)) {
        return res.status(400).json({ message: "Invalid blind tasting ID format" });
      }

      const success = await storage.deleteBlindTasting(btId, getUserId(req));
      if (!success) {
        return res.status(404).json({ message: "Blind tasting not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blind tasting", error: String(error) });
    }
  });

  // Rate a whiskey in a blind tasting
  app.post("/api/blind-tastings/:btId/whiskeys/:btwId/rate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const btwId = parseInt(req.params.btwId);
      if (isNaN(btwId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const { blindRating, blindNotes } = updateBlindTastingWhiskeySchema.parse(req.body);

      if (blindRating === undefined) {
        return res.status(400).json({ message: "Rating is required" });
      }

      const result = await storage.rateBlindTastingWhiskey(btwId, blindRating, blindNotes, getUserId(req));
      if (!result) {
        return res.status(404).json({ message: "Blind tasting whiskey not found or tasting is not active" });
      }

      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to rate blind tasting whiskey", error: String(error) });
    }
  });

  // Reveal a blind tasting
  app.post("/api/blind-tastings/:id/reveal", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const btId = parseInt(req.params.id);
      if (isNaN(btId)) {
        return res.status(400).json({ message: "Invalid blind tasting ID format" });
      }

      const result = await storage.revealBlindTasting(btId, getUserId(req));
      if (!result) {
        return res.status(404).json({ message: "Blind tasting not found or not in active status" });
      }

      // Return the full tasting with whiskey details now visible
      const fullResult = await storage.getBlindTastingWithWhiskeys(btId, getUserId(req));
      res.json(fullResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to reveal blind tasting", error: String(error) });
    }
  });

  // Complete a blind tasting
  app.post("/api/blind-tastings/:id/complete", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const btId = parseInt(req.params.id);
      if (isNaN(btId)) {
        return res.status(400).json({ message: "Invalid blind tasting ID format" });
      }

      const result = await storage.completeBlindTasting(btId, getUserId(req));
      if (!result) {
        return res.status(404).json({ message: "Blind tasting not found or not in revealed status" });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete blind tasting", error: String(error) });
    }
  });

  // ==================== BARCODE LOOKUP ROUTES ====================

  // Lookup whiskey info by barcode/UPC
  app.get("/api/barcode/:code", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const barcode = req.params.code;
      console.log(`Barcode lookup request: ${barcode}`);

      // Step 1: Check if user already has a whiskey with this barcode in their collection
      const userWhiskeys = await storage.getWhiskeys(req.session.userId);
      const existingWhiskey = userWhiskeys.find(w =>
        w.barcode === barcode || w.upc === barcode
      );

      if (existingWhiskey) {
        console.log(`Found in user collection: ${existingWhiskey.name}`);
        return res.json({
          found: true,
          source: 'collection',
          upc: barcode,
          whiskey: {
            identified: true,
            name: existingWhiskey.name,
            distillery: existingWhiskey.distillery,
            type: existingWhiskey.type,
            proof: existingWhiskey.proof || (existingWhiskey.abv ? existingWhiskey.abv * 2 : null),
            age: existingWhiskey.age ? `${existingWhiskey.age} years` : null,
            mashBill: existingWhiskey.mashBill,
            description: null,
            tastingNotes: []
          },
          message: 'Found in your collection'
        });
      }

      // Step 2: Check all whiskeys in the database for a match (shared product data)
      const allWhiskeys = await storage.getWhiskeys();
      const matchedWhiskey = allWhiskeys.find(w =>
        w.barcode === barcode || w.upc === barcode
      );

      if (matchedWhiskey) {
        console.log(`Found in database: ${matchedWhiskey.name}`);
        return res.json({
          found: true,
          source: 'database',
          upc: barcode,
          whiskey: {
            identified: true,
            name: matchedWhiskey.name,
            distillery: matchedWhiskey.distillery,
            type: matchedWhiskey.type,
            proof: matchedWhiskey.proof || (matchedWhiskey.abv ? matchedWhiskey.abv * 2 : null),
            age: matchedWhiskey.age ? `${matchedWhiskey.age} years` : null,
            mashBill: matchedWhiskey.mashBill,
            description: null,
            tastingNotes: []
          },
          message: 'Found in database'
        });
      }

      // Step 3: Not in local DB - use UPC lookup service with Claude enrichment
      console.log('Not found locally, using UPC lookup service...');
      const { lookupWhiskeyByUPC } = await import('./upc-lookup-service');
      const lookupResult = await lookupWhiskeyByUPC(barcode);

      res.json(lookupResult);
    } catch (error) {
      console.error('Barcode lookup error:', error);
      res.status(500).json({ message: "Failed to lookup barcode", error: String(error) });
    }
  });

  // Identify whiskey from image using Claude Vision
  app.post("/api/identify-image", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { image, mediaType } = req.body;

      if (!image) {
        return res.status(400).json({ message: "No image provided" });
      }

      if (!mediaType || !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
        return res.status(400).json({ message: "Invalid media type. Must be image/jpeg, image/png, image/gif, or image/webp" });
      }

      console.log('Image identification request received');
      console.log('Media type:', mediaType);

      // Remove data URL prefix if present
      let base64Data = image;
      if (image.includes(',')) {
        base64Data = image.split(',')[1];
      }

      const { identifyWhiskeyFromImage } = await import('./image-identify-service');
      const result = await identifyWhiskeyFromImage(base64Data, mediaType);

      res.json(result);
    } catch (error) {
      console.error('Image identification error:', error);
      res.status(500).json({ message: "Failed to identify whiskey from image", error: String(error) });
    }
  });

  // ==================== DISTILLERY ROUTES ====================

  // Get all distilleries (with optional search)
  app.get("/api/distilleries", async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      const distilleries = await storage.getDistilleries(search);
      res.json(distilleries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch distilleries", error: String(error) });
    }
  });

  // Get single distillery
  app.get("/api/distilleries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid distillery ID" });
      }

      const distillery = await storage.getDistillery(id);
      if (!distillery) {
        return res.status(404).json({ message: "Distillery not found" });
      }

      res.json(distillery);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch distillery", error: String(error) });
    }
  });

  // Get whiskeys from a distillery (for current user)
  app.get("/api/distilleries/:id/whiskeys", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid distillery ID" });
      }

      const whiskeys = await storage.getDistilleryWhiskeys(id, getUserId(req));
      res.json(whiskeys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch distillery whiskeys", error: String(error) });
    }
  });

  // Create a new distillery
  app.post("/api/distilleries", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { insertDistillerySchema } = await import("@shared/schema");
      const validatedData = insertDistillerySchema.parse(req.body);
      const newDistillery = await storage.createDistillery(validatedData);
      res.status(201).json(newDistillery);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to create distillery", error: String(error) });
    }
  });

  // Update a distillery (admin only - userId 5)
  app.patch("/api/distilleries/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      // Only admin (userId 5) can update distilleries
      if (userId !== 5) {
        return res.status(403).json({ message: "Only admin can update distilleries" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid distillery ID" });
      }

      const { updateDistillerySchema } = await import("@shared/schema");
      const validatedData = updateDistillerySchema.parse(req.body);
      const updated = await storage.updateDistillery(id, validatedData);

      if (!updated) {
        return res.status(404).json({ message: "Distillery not found" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to update distillery", error: String(error) });
    }
  });

  // ==================== PROFILE ROUTES ====================

  // Get current user's profile
  app.get("/api/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return profile data (exclude password hash)
      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        profileSlug: user.profileSlug,
        isPublic: user.isPublic,
        showWishlistOnProfile: user.showWishlistOnProfile,
        createdAt: user.createdAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile", error: String(error) });
    }
  });

  // Update current user's profile
  app.patch("/api/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const updateData = updateProfileSchema.parse(req.body);
      const updatedUser = await storage.updateProfile(getUserId(req), updateData);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return updated profile data (exclude password hash)
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        bio: updatedUser.bio,
        profileSlug: updatedUser.profileSlug,
        isPublic: updatedUser.isPublic,
        showWishlistOnProfile: updatedUser.showWishlistOnProfile,
        createdAt: updatedUser.createdAt
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to update profile", error: String(error) });
    }
  });

  // Get public profile by slug (no auth required)
  app.get("/api/profile/:slug", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      // First find the user by their profile slug
      const user = await storage.getUserByProfileSlug(slug);
      if (!user) {
        return res.status(404).json({ message: "Profile not found or not public" });
      }

      const profile = await storage.getPublicProfile(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found or not public" });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile", error: String(error) });
    }
  });

  // Get user's public whiskeys (no auth required)
  app.get("/api/users/:id/whiskeys", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      const whiskeys = await storage.getPublicWhiskeys(userId);
      res.json(whiskeys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user's whiskeys", error: String(error) });
    }
  });

  // Toggle whiskey visibility (public/private)
  app.patch("/api/whiskeys/:id/visibility", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }

      const { isPublic } = req.body;
      if (typeof isPublic !== "boolean") {
        return res.status(400).json({ message: "isPublic must be a boolean" });
      }

      const updated = await storage.setWhiskeyPublic(whiskeyId, isPublic, getUserId(req));
      if (!updated) {
        return res.status(404).json({ message: "Whiskey not found or not owned by you" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update whiskey visibility", error: String(error) });
    }
  });

  // ==================== FOLLOW ROUTES ====================

  // Follow a user
  app.post("/api/users/:id/follow", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      if (userId === req.session.userId) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }

      const follow = await storage.followUser(getUserId(req), userId);
      if (!follow) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(201).json({ success: true, follow });
    } catch (error) {
      res.status(500).json({ message: "Failed to follow user", error: String(error) });
    }
  });

  // Unfollow a user
  app.delete("/api/users/:id/follow", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      const success = await storage.unfollowUser(getUserId(req), userId);
      if (!success) {
        return res.status(404).json({ message: "Follow relationship not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow user", error: String(error) });
    }
  });

  // Check if following a user
  app.get("/api/users/:id/following-status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      const isFollowing = await storage.isFollowing(getUserId(req), userId);
      res.json({ isFollowing });
    } catch (error) {
      res.status(500).json({ message: "Failed to check follow status", error: String(error) });
    }
  });

  // Get user's followers
  app.get("/api/users/:id/followers", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      const followers = await storage.getFollowers(userId);
      const count = await storage.getFollowersCount(userId);

      res.json({ followers, count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch followers", error: String(error) });
    }
  });

  // Get user's following
  app.get("/api/users/:id/following", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      const following = await storage.getFollowing(userId);
      const count = await storage.getFollowingCount(userId);

      res.json({ following, count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch following", error: String(error) });
    }
  });

  // Get following feed (reviews from followed users)
  app.get("/api/feed/following", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      const reviews = await storage.getFollowingFeed(getUserId(req), limit);

      // Sanitize the response similar to public reviews
      const sanitizedReviews = reviews.map(({ whiskey, review, user }) => ({
        whiskey: {
          id: whiskey.id,
          name: whiskey.name,
          distillery: whiskey.distillery,
          type: whiskey.type,
          age: whiskey.age,
          abv: whiskey.abv,
          region: whiskey.region,
          rating: whiskey.rating,
          image: whiskey.image,
          bottleType: whiskey.bottleType,
          mashBill: whiskey.mashBill,
          caskStrength: whiskey.caskStrength,
          finished: whiskey.finished,
          finishType: whiskey.finishType
        },
        review,
        user: {
          id: user.id,
          displayName: user.displayName || user.username,
          profileImage: user.profileImage,
          profileSlug: user.profileSlug
        }
      }));

      res.json(sanitizedReviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch following feed", error: String(error) });
    }
  });

  // Get suggested users to follow
  app.get("/api/users/suggested", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const suggestions = await storage.getSuggestedUsers(getUserId(req), limit);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggested users", error: String(error) });
    }
  });

  // ==================== AI TASTING NOTES ROUTES ====================

  const AI_DAILY_LIMIT = 10; // Rate limit: 10 AI calls per user per day

  // Suggest tasting notes based on whiskey profile
  app.post("/api/ai/suggest-notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Check rate limit
      const { allowed, remaining } = await storage.canUseAi(userId, AI_DAILY_LIMIT);
      if (!allowed) {
        return res.status(429).json({
          message: "Daily AI limit reached. You can use AI tasting assistance again tomorrow.",
          remaining: 0
        });
      }

      // Get whiskey details - either by ID or from request body
      let whiskey;
      const { whiskeyId, name, distillery, type, age, abv } = req.body;

      if (whiskeyId) {
        whiskey = await storage.getWhiskey(whiskeyId, userId);
        if (!whiskey) {
          return res.status(404).json({ message: "Whiskey not found" });
        }
      } else if (name) {
        // Use provided details
        whiskey = { name, distillery, type, age, abv };
      } else {
        return res.status(400).json({ message: "Either whiskeyId or whiskey details (name) required" });
      }

      // Check if Anthropic API key is configured
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({
          message: "AI service not configured. Please add ANTHROPIC_API_KEY to your environment."
        });
      }

      // Get distillery info if available
      let distilleryInfo = "";
      if (whiskey.distilleryId) {
        const distilleryData = await storage.getDistillery(whiskey.distilleryId);
        if (distilleryData) {
          distilleryInfo = `Distillery info: ${distilleryData.name} is located in ${distilleryData.location || distilleryData.country || 'unknown location'}. `;
          if (distilleryData.type) {
            distilleryInfo += `Known for ${distilleryData.type}. `;
          }
          if (distilleryData.description) {
            distilleryInfo += distilleryData.description;
          }
        }
      }

      // Import Anthropic SDK
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const prompt = `You are a whiskey expert. Based on this whiskey's profile, suggest likely tasting notes.

Whiskey: ${whiskey.name}
Distillery: ${whiskey.distillery || 'Unknown'}
Type: ${whiskey.type || 'Unknown'}
Age: ${whiskey.age ? whiskey.age + ' years' : 'NAS (No Age Statement)'}
ABV: ${whiskey.abv ? whiskey.abv + '%' : 'Unknown'}
${distilleryInfo}

Provide tasting notes in this JSON format only, no other text:
{
  "nose": ["aroma1", "aroma2", "aroma3", "aroma4", "aroma5"],
  "palate": ["taste1", "taste2", "taste3", "taste4", "taste5"],
  "finish": ["note1", "note2", "note3"],
  "summary": "A 2-3 sentence overall description of what to expect from this whiskey."
}

Be specific and realistic for this style of whiskey. Use common tasting descriptors like vanilla, caramel, oak, honey, spice, fruit, etc.`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      });

      // Parse the response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract JSON from response (it might have markdown code blocks)
      let jsonStr = responseText;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      let suggestions;
      try {
        suggestions = JSON.parse(jsonStr);
      } catch {
        return res.status(500).json({ message: "Failed to parse AI response", raw: responseText });
      }

      // Log AI usage
      await storage.logAiUsage(userId, 'suggest-notes', whiskeyId || null);

      res.json({
        ...suggestions,
        remaining: remaining - 1
      });
    } catch (error) {
      console.error("AI suggest-notes error:", error);
      res.status(500).json({ message: "Failed to generate suggestions", error: String(error) });
    }
  });

  // Enhance user's brief notes into polished tasting notes
  app.post("/api/ai/enhance-notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Check rate limit
      const { allowed, remaining } = await storage.canUseAi(userId, AI_DAILY_LIMIT);
      if (!allowed) {
        return res.status(429).json({
          message: "Daily AI limit reached. You can use AI tasting assistance again tomorrow.",
          remaining: 0
        });
      }

      const { whiskeyId, userNotes, rating } = req.body;

      if (!userNotes || typeof userNotes !== 'string' || userNotes.trim().length === 0) {
        return res.status(400).json({ message: "userNotes is required" });
      }

      // Get whiskey details if ID provided
      let whiskeyName = "this whiskey";
      if (whiskeyId) {
        const whiskey = await storage.getWhiskey(whiskeyId, userId);
        if (whiskey) {
          whiskeyName = whiskey.name;
        }
      }

      // Check if Anthropic API key is configured
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({
          message: "AI service not configured. Please add ANTHROPIC_API_KEY to your environment."
        });
      }

      // Import Anthropic SDK
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const prompt = `You are helping a whiskey enthusiast write tasting notes. They provided brief observations. Expand these into polished, descriptive tasting notes while preserving their personal voice.

Whiskey: ${whiskeyName}
Their notes: "${userNotes}"
${rating ? `Their rating: ${rating}/5` : ''}

Provide enhanced notes in this JSON format only, no other text:
{
  "nose": "Expanded nose description (2-3 sentences based on aromas they mentioned)",
  "palate": "Expanded palate description (2-3 sentences based on flavors they mentioned)",
  "finish": "Expanded finish description (1-2 sentences)",
  "enhanced": "Their original notes rewritten as a cohesive, polished paragraph that sounds natural and authentic"
}

Important: Keep it authentic—don't invent flavors they didn't mention or imply, but elaborate on what they observed. Use their voice and style.`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      });

      // Parse the response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract JSON from response
      let jsonStr = responseText;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      let enhanced;
      try {
        enhanced = JSON.parse(jsonStr);
      } catch {
        return res.status(500).json({ message: "Failed to parse AI response", raw: responseText });
      }

      // Log AI usage
      await storage.logAiUsage(userId, 'enhance-notes', whiskeyId || null);

      res.json({
        ...enhanced,
        remaining: remaining - 1
      });
    } catch (error) {
      console.error("AI enhance-notes error:", error);
      res.status(500).json({ message: "Failed to enhance notes", error: String(error) });
    }
  });

  // Get AI usage status for current user
  app.get("/api/ai/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { allowed, remaining } = await storage.canUseAi(userId, AI_DAILY_LIMIT);

      res.json({
        dailyLimit: AI_DAILY_LIMIT,
        remaining,
        allowed,
        configured: !!process.env.ANTHROPIC_API_KEY
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get AI status", error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
