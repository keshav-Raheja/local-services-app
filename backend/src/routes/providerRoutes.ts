import express from "express";
import { getProviders, createProvider, getProviderBookings, getProviderProfile, updateProviderProfile } from "../controllers/providerController";
import { authenticate, requireRole } from "../middleware/authMiddleware";
import { getProviderDashboard } from "../controllers/providerDashboardController";
import { getProviderOfferings, createProviderOffering, updateProviderOffering } from "../controllers/providerController";
import { listProviderCredits, createProviderCredit, recordProviderRepayment } from "../controllers/creditController";

const router = express.Router();

router.get("/dashboard", authenticate, requireRole("provider"), getProviderDashboard);
router.get("/offerings", authenticate, requireRole("provider"), getProviderOfferings);
router.post("/offerings", authenticate, requireRole("provider"), createProviderOffering);
router.put("/offerings/:offeringId", authenticate, requireRole("provider"), updateProviderOffering);
router.get("/credits", authenticate, requireRole("provider"), listProviderCredits);
router.post("/credits", authenticate, requireRole("provider"), createProviderCredit);
router.post("/credits/:creditId/repayments", authenticate, requireRole("provider"), recordProviderRepayment);
router.get("/bookings/:userId", authenticate, requireRole("provider"), getProviderBookings);
router.get("/profile/:userId", authenticate, requireRole("provider"), getProviderProfile);
router.put("/profile/:userId", authenticate, requireRole("provider"), updateProviderProfile);
router.get("/:serviceId", getProviders);
router.post("/", authenticate, requireRole("provider"), createProvider);

export default router;
