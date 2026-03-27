import express from "express";
import {
  getProviders,
  createProvider,
  getProviderBookings
} from "../controllers/providerController";

const router = express.Router();

router.get("/:serviceId", getProviders);
router.post("/", createProvider);

// 🔥 dashboard route
router.get("/bookings/:userId", getProviderBookings);

export default router;