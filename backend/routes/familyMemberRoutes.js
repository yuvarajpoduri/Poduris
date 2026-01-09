import express from "express";
import {
  getFamilyMembers,
  getFamilyMember,
  getFamilyMembersByGeneration,
  getDashboardStats,
  getAvailableFamilyMembers,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} from "../controllers/familyMemberController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.get("/available", getAvailableFamilyMembers);
router.get("/stats/dashboard", protect, getDashboardStats);
router.get("/generation/:generation", protect, getFamilyMembersByGeneration);
router.get("/:id", protect, getFamilyMember);
router.get("/", protect, getFamilyMembers);

router.post("/", protect, authorize("admin"), createFamilyMember);
router.put("/:id", protect, updateFamilyMember); // Members can update their own, admin can update any
router.delete("/:id", protect, authorize("admin"), deleteFamilyMember);

export default router;
