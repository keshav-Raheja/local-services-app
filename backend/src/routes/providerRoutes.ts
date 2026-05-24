import express from "express";
import { getProviders, createProvider, getProviderBookings } from "../controllers/providerController";
import { authenticate, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:serviceId", getProviders);
router.post("/", authenticate, requireRole("provider"), createProvider);
router.get("/bookings/:userId", authenticate, getProviderBookings);

export default router;