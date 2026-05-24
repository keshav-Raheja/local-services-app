import { Request, Response } from "express";
import Review from "../models/reviewModel";
import Booking from "../models/bookingModel";
import Provider from "../models/providerModel";

// ADD REVIEW
export const addReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { providerId, rating, feedback } = req.body;
    const userId = req.user?.id;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    // Check completed booking
    const booking = await Booking.findOne({ userId, providerId, status: "completed" });
    if (!booking) {
      res.status(400).json({ message: "You can only review after a completed booking" });
      return;
    }

    // Prevent duplicate review per booking
    const existingReview = await Review.findOne({ userId, providerId, bookingId: booking._id });
    if (existingReview) {
      res.status(400).json({ message: "You already reviewed this booking" });
      return;
    }

    const review = await Review.create({ userId, providerId, rating, feedback, bookingId: booking._id });

    // Update provider average rating
    const allReviews = await Review.find({ providerId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Provider.findByIdAndUpdate(providerId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("Review error:", error);
    res.status(500).json({ message: "Error adding review" });
  }
};

// GET REVIEWS BY PROVIDER
export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { providerId } = req.params;
    const reviews = await Review.find({ providerId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews" });
  }
};