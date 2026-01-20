import express from "express";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { protect, admin } from "../middlewares/auth.js";

const router = express.Router();

router.route("/").get(protect, getEvents).post(protect, admin, createEvent);
router
  .route("/:id")
  .put(protect, admin, updateEvent)
  .delete(protect, admin, deleteEvent);

export default router;
