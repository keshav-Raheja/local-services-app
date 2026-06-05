import express from "express";
import { getProviders, createProvider, getProviderBookings, getProviderProfile, updateProviderProfile } from "../controllers/providerController";
import { authenticate, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:serviceId", getProviders);
router.post("/", authenticate, requireRole("provider"), createProvider);
router.get("/bookings/:userId", authenticate, getProviderBookings);
router.get("/profile/:userId", authenticate, getProviderProfile);
router.put("/profile/:userId", authenticate, requireRole("provider"), updateProviderProfile);

export default router;