import express from "express";
import { addReview, getReviews } from "../controllers/reviewController";

const router = express.Router();

router.post("/", addReview);

// GET REVIEWS
router.get("/:providerId", getReviews);

export default router;