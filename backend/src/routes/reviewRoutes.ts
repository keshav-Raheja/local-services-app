import express from "express";
import { addReview, getReviews } from "../controllers/reviewController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authenticate, addReview);
router.get("/:providerId", getReviews);

export default router;