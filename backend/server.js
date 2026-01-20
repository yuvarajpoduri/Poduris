import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";

import connectDB from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import familyMemberRoutes from "./routes/familyMemberRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js"; // New
import eventRoutes from "./routes/eventRoutes.js"; // Added event routes
import wishRoutes from "./routes/wishRoutes.js";

dotenv.config();

console.log("Loading environment variables...");
console.log("MONGODB_URI present:", !!process.env.MONGODB_URI);

connectDB();

const app = express();

/* =======================
   TRUST PROXY (REQUIRED)
======================= */
app.set("trust proxy", 1);

/* =======================
   CORS CONFIG
======================= */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://poduris.onrender.com",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server & mobile webviews
      if (!origin) return callback(null, true);

      if (!allowedOrigins.includes(origin)) {
        return callback(
          new Error(`CORS blocked for origin: ${origin}`),
          false
        );
      }

      return callback(null, true);
    },
    credentials: true,
  })
);

/* =======================
   BODY PARSERS
======================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =======================
   SESSION CONFIG (FIXED)
======================= */
app.use(
  session({
    name: "family_tree_sid",
    secret: process.env.SESSION_SECRET || "CHANGE_THIS_SECRET",
    resave: false,
    saveUninitialized: false,
    proxy: true, // 🔥 REQUIRED ON RENDER
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // False for localhost dev
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // Lax for localhost
      maxAge: 14 * 24 * 60 * 60 * 1000,
    },
  })
);

/* =======================
   ROUTES
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/family-members", familyMemberRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/wishes", wishRoutes);

/* =======================
   HEALTH CHECK
======================= */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

/* =======================
   ERROR HANDLER
======================= */
app.use(errorHandler);

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
