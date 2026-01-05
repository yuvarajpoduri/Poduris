import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import connectDB from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// Load env vars
dotenv.config();

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import familyMemberRoutes from "./routes/familyMemberRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// Connect to database
connectDB();

const app = express();

// --- UPDATED CORS CONFIGURATION ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Middleware
<<<<<<< HEAD
=======
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://poduris.onrender.com"
    ],
    credentials: true
  })
);

>>>>>>> cfafd3c76027ac7f3a5705296173f72a1e34a1d8
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- UPDATED SESSION CONFIGURATION ---
app.use(
  session({
    name: "family_tree_sid",
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: {
      // Set to true only if using HTTPS (Production)
      secure: process.env.NODE_ENV === "production",
      // 'lax' is required for localhost cross-origin; 'none' for production cross-domain
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60 * 1000,
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/family-members", familyMemberRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});

// Helpful debug log for Cloudinary
if (process.env.NODE_ENV !== "production") {
  console.log("Cloudinary Configured:", !!process.env.CLOUDINARY_API_KEY);
}
