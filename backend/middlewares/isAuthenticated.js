
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false
            });
        }

        const decode = jwt.verify(
            token,
            process.env.SECRET_KEY
        );

        req.id = decode.userId;
        req.isAdmin = Boolean(decode.isAdmin);

        // Fallback: If token was issued before or decode.isAdmin is false, check user from DB
        if (!req.isAdmin && req.id) {
            try {
                const currentUser = await User.findById(req.id).select("isAdmin email username");
                if (currentUser && (
                    currentUser.isAdmin === true ||
                    currentUser.email?.toLowerCase().startsWith("admin") ||
                    currentUser.username?.toLowerCase() === "admin"
                )) {
                    req.isAdmin = true;
                }
            } catch (dbErr) {
                // Ignore DB error here, next() will continue
            }
        }

        return next();

    } catch (error) {
        console.error("Authentication error:", error.message);

        if (
            error instanceof jwt.JsonWebTokenError ||
            error instanceof jwt.TokenExpiredError
        ) {
            return res.status(401).json({
                message: "Invalid or expired token",
                success: false
            });
        }

        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
};

export default isAuthenticated;
