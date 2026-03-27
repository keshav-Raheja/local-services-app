import express from "express";
import { registerUser, loginUser } from "../controllers/authController";
import { register } from "../controllers/authController";

const router = express.Router();
router.post("/register", register);
router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;
