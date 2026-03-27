import express from "express";


import {
  createBooking,
  getUserBookings,
  updateBookingStatus,
  getProviderBookings
} from "../controllers/bookingController";

const router = express.Router();



router.post("/", createBooking);
router.get("/:userId", getUserBookings);
router.get("/provider/:providerId", getProviderBookings);
router.put("/:bookingId", updateBookingStatus);

export default router;
