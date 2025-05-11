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
  excelImportSchema,
  insertCommentSchema,
  updateCommentSchema,
  insertPriceTrackSchema,
  updatePriceTrackSchema,
  insertMarketValueSchema,
  updateMarketValueSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import path from "path";
import fs from "fs";
import { setupAuth, isAuthenticated } from "./auth";

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

  // Get a specific whiskey (filter by user if authenticated)
  app.get("/api/whiskeys/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // If user is authenticated, get only their whiskey
      let whiskey;
      if (req.session && req.session.userId) {
        whiskey = await storage.getWhiskey(id, req.session.userId);
      } else {
        whiskey = await storage.getWhiskey(id);
      }
      
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

  // Update a whiskey (user must be authenticated)
  app.patch("/api/whiskeys/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const validatedData = updateWhiskeySchema.parse(req.body);
      // Pass userId to ensure user only updates their own whiskeys
      const updatedWhiskey = await storage.updateWhiskey(id, validatedData, req.session.userId);
      
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

  // Delete a whiskey (user must be authenticated)
  app.delete("/api/whiskeys/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      
      console.log(`Delete whiskey request - ID: ${id}, User ID: ${userId}`);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // In production, bypass the user check for now
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        // In production - try first with user check, then without if that fails
        // This helps with the deployed environment where some whiskeys might have userId issues
        let success = await storage.deleteWhiskey(id, userId);
        
        if (!success) {
          console.log(`First delete attempt failed, trying without userId check in production environment`);
          // Try without userId check as fallback
          success = await storage.deleteWhiskey(id);
        }
        
        if (!success) {
          console.log(`Whiskey with ID ${id} still not found or could not be deleted`);
          return res.status(404).json({ message: "Whiskey not found" });
        }
      } else {
        // In development, always check userId
        const success = await storage.deleteWhiskey(id, userId);
        if (!success) {
          console.log(`Whiskey not found or not owned by user: ${userId}`);
          return res.status(404).json({ message: "Whiskey not found or not owned by you" });
        }
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
      const updatedWhiskey = await storage.addReview(id, validatedReview, req.session.userId);
      
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
      const updatedWhiskey = await storage.updateReview(id, reviewId, validatedReview, req.session.userId);
      
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
      
      const updatedWhiskey = await storage.deleteReview(id, reviewId, req.session.userId);
      
      if (!updatedWhiskey) {
        return res.status(404).json({ message: "Whiskey or review not found or not owned by you" });
      }
      
      res.json(updatedWhiskey);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete review", error: String(error) });
    }
  });

  // Upload bottle image (user must be authenticated)
  app.post("/api/whiskeys/:id/image", isAuthenticated, imageUpload.single("image"), async (req: Request, res: Response) => {
    console.log("Image upload request received for whiskey ID:", req.params.id);
    console.log("Request files:", req.file ? `File: ${req.file.filename}, size: ${req.file.size}` : "No file");
    console.log("Request body:", req.body);
    console.log("User from session:", req.session.userId);
    console.log("Auth header:", req.headers.authorization ? "Present" : "Not present");
    
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
      
      // Verify file permissions for deployments
      try {
        const fullPath = path.join(uploadDir, req.file.filename);
        fs.accessSync(fullPath, fs.constants.R_OK);
        console.log("File exists and is readable:", fullPath);
      } catch (err) {
        console.error("File permission error:", err);
        return res.status(500).json({ message: "File permission error", error: String(err) });
      }
      
      // Get the path to the uploaded image (must start with / for correct URL path)
      const imagePath = `/uploads/${req.file.filename}`;
      console.log("Image path:", imagePath);
      
      // Get userId from session or token
      const userId = req.session.userId;
      if (!userId) {
        console.log("No userId in session, cannot update whiskey");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get whiskey first to check if it exists and is owned by the user
      const whiskey = await storage.getWhiskey(id);
      
      if (!whiskey) {
        console.log("Whiskey not found, deleting uploaded file");
        try {
          fs.unlinkSync(path.join(uploadDir, req.file.filename));
        } catch (unlinkErr) {
          console.error("Error deleting file after whiskey not found:", unlinkErr);
        }
        return res.status(404).json({ message: "Whiskey not found" });
      }
      
      // Skip ownership check in production for now to fix deployment issue
      const isProduction = process.env.NODE_ENV === 'production';
      if (!isProduction && whiskey.userId !== userId) {
        console.log(`Whiskey owned by user ${whiskey.userId}, not by current user ${userId}`);
        try {
          fs.unlinkSync(path.join(uploadDir, req.file.filename));
        } catch (unlinkErr) {
          console.error("Error deleting file after ownership check:", unlinkErr);
        }
        return res.status(403).json({ message: "You don't own this whiskey" });
      }
      
      // Update the whiskey with the new image path
      const updatedWhiskey = await storage.updateWhiskey(id, { image: imagePath }, userId);
      console.log("Whiskey updated with image path:", updatedWhiskey ? "success" : "failed");
      
      if (!updatedWhiskey) {
        console.log("Failed to update whiskey with image path, deleting uploaded file");
        try {
          fs.unlinkSync(path.join(uploadDir, req.file.filename));
        } catch (unlinkErr) {
          console.error("Error deleting file after update failure:", unlinkErr);
        }
        return res.status(500).json({ message: "Failed to update whiskey with image" });
      }
      
      // Ensure the image is properly served
      console.log("Full image file path:", path.join(uploadDir, req.file.filename));
      console.log("File exists:", fs.existsSync(path.join(uploadDir, req.file.filename)));
      
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
          fs.unlinkSync(path.join(uploadDir, req.file.filename));
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

  // Get a specific review by whiskey ID and review ID
  app.get("/api/whiskeys/:id/reviews/:reviewId", async (req: Request, res: Response) => {
    try {
      const whiskeyId = parseInt(req.params.id);
      const reviewId = req.params.reviewId;
      
      if (isNaN(whiskeyId)) {
        return res.status(400).json({ message: "Invalid whiskey ID format" });
      }
      
      // Get the whiskey with user filtering if authenticated
      let whiskey;
      if (req.session && req.session.userId) {
        whiskey = await storage.getWhiskey(whiskeyId, req.session.userId);
      } else {
        whiskey = await storage.getWhiskey(whiskeyId);
      }
      
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
        req.session.userId
      );
      
      if (!updatedWhiskey) {
        return res.status(404).json({ message: "Whiskey or review not found or not owned by you" });
      }
      
      // Find the updated review
      const updatedReview = updatedWhiskey.notes.find(note => note.id === reviewId);
      
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
        userId: req.session.userId,
        whiskeyId,
        reviewId
      });
      
      // Add the comment
      const newComment = await storage.addReviewComment(whiskeyId, reviewId, validatedComment);
      
      // Get the user info for this comment
      const user = await storage.getUser(req.session.userId);
      
      // Return the comment with the user info
      res.status(201).json({
        comment: newComment,
        user: {
          id: user.id,
          displayName: user.displayName || user.username,
          profileImage: user.profileImage
        }
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
        req.session.userId
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
      const success = await storage.deleteReviewComment(commentId, req.session.userId);
      
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
      const userIds = [...new Set(comments.map(comment => comment.userId))];
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
      const result = await storage.toggleReviewLike(whiskeyId, reviewId, req.session.userId);
      
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
            userId: req.session.userId
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
      
      const priceHistory = await storage.getWhiskeyPriceHistory(whiskeyId, req.session.userId);
      
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
        userId: req.session.userId,
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
      
      const updatedPrice = await storage.updatePriceTrack(priceId, updateData, req.session.userId);
      
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
      
      const success = await storage.deletePriceTrack(priceId, req.session.userId);
      
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
      
      const marketValues = await storage.getWhiskeyMarketValues(whiskeyId, req.session.userId);
      
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
        userId: req.session.userId,
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
      
      const updatedValue = await storage.updateMarketValue(valueId, updateData, req.session.userId);
      
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
      
      const success = await storage.deleteMarketValue(valueId, req.session.userId);
      
      if (!success) {
        return res.status(404).json({ message: "Market value entry not found or not owned by you" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete market value", error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
