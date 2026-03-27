import { Request, Response } from "express";
import Review from "../models/reviewModel";
import Booking from "../models/bookingModel";

// ADD REVIEW (WITH CONDITIONS)
export const addReview = async (req: Request, res: Response) => {
  try {
    const { userId, providerId, rating, feedback } = req.body;
    if (rating < 1 || rating > 5) {
        return res.status(400).json({
            message: "Rating must be between 1 and 5"
        });
    }

    // 1️⃣ Check booking exists
    const booking = await Booking.findOne({
      userId,
      providerId,
      status: "completed"
    });

    if (!booking) {
      return res.status(400).json({
        message: "You can only review after completing a booking"
      });
    }

    // 2️⃣ Check 5 days passed
    const bookingDate = new Date(booking.createdAt);
    const now = new Date();

    const diffDays =
      (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 5) {
      return res.status(400).json({
        message: "You can review only after 5 days of service"
      });
    }

    // 3️⃣ Prevent duplicate review
    const existingReview = await Review.findOne({
      userId,
      providerId,
      bookingId: booking._id
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You already reviewed this booking"
      });
    }

    // 4️⃣ Create review
    const review = await Review.create({
      userId,
      providerId,
      rating,
      feedback,
      bookingId: booking._id
    });

    res.status(201).json(review);

  } catch (error) {
    res.status(500).json({ message: "Error adding review" });
  }
};

// GET REVIEWS BY PROVIDER
export const getReviews = async (req: Request, res: Response) => {
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