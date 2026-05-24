import express from "express";
import { createService, getServices, deleteService } from "../controllers/serviceController";
import { authenticate, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", getServices);
router.post("/", authenticate, requireRole("admin"), createService);
router.delete("/:id", authenticate, requireRole("admin"), deleteService);

export default router;