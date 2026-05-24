import express from "express";
import {
  createBooking,
  getUserBookings,
  updateBookingStatus,
  getProviderBookings,
} from "../controllers/bookingController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authenticate, createBooking);
router.get("/user/:userId", authenticate, getUserBookings);
router.get("/provider/:providerId", authenticate, getProviderBookings);
router.put("/:bookingId", authenticate, updateBookingStatus);

export default router;
