
import jwt from "jsonwebtoken";

const isAuthenticated = (req, res, next) => {
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
