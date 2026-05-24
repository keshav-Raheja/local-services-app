import express from "express";
import { askSupport, getFAQs } from "../controllers/supportController";

const router = express.Router();

router.post("/ask", askSupport);
router.get("/faqs", getFAQs);

export default router;
