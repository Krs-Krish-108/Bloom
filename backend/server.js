
import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import connectDB from "./utils/db.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import messageRoutes from "./routes/message.route.js";
import storyRoutes from "./routes/story.route.js";
import musicRoutes from "./routes/music.route.js";
import { app, server } from "./socket/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config();

const PORT = process.env.PORT || 8000;

// Middleware should run before routes.
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

const allowedOrigins = [
    process.env.URL,
    "http://localhost:5173",
    "http://localhost:3000"
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || (process.env.URL && origin.startsWith(process.env.URL))) {
            callback(null, true);
        } else {
            callback(null, true); // Permissive with credentials for Vercel preview domains
        }
    },
    credentials: true
};
app.use(cors(corsOptions));

// Health check endpoint (for Render / uptime monitoring)
app.get("/health", (req, res) => {
    return res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/post", postRoutes);
app.use("/api/v1/message", messageRoutes);
app.use("/api/v1/story", storyRoutes);
app.use("/api/v1/music", musicRoutes);

// Static File Serving & Wildcard Fallback (when hosted as unified app)
const frontendDistPath = path.resolve(__dirname, "..", "frontend", "dist", "index.html");
const hasFrontendDist = fs.existsSync(frontendDistPath);

if (process.env.NODE_ENV === "production" && hasFrontendDist) {
    app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));
    app.get(/.*/, (req, res) => {
        res.sendFile(frontendDistPath);
    });
} else {
    // Default root route (especially when frontend is hosted separately on Vercel)
    app.get("/", (req, res) => {
        return res.status(200).json({
            message: "Instagram Clone Backend is running smoothly on Render!",
            success: true,
            status: "online"
        });
    });
}


const startServer = async () => {
    try {
        await connectDB();

        server.listen(PORT, () => {
            console.log(`Server is listening at port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();
