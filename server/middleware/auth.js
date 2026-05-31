import jwt from "jsonwebtoken";
import { isAdminRole, isStaffRole } from "../utils/validation.js";

const DEVELOPMENT_SECRET = "development-only-change-me";

export const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret === "your-secret-key" || secret.includes("change-this")) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("JWT_SECRET must be set to a strong value in production");
        }

        return secret || DEVELOPMENT_SECRET;
    }

    return secret;
};

export const signAuthToken = (payload) =>
    jwt.sign(payload, getJwtSecret(), {
        algorithm: "HS256",
        expiresIn: process.env.JWT_EXPIRES_IN || "2d",
        issuer: process.env.JWT_ISSUER || undefined,
        audience: process.env.JWT_AUDIENCE || undefined,
    });

const getBearerToken = (req) => {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token || token.length > 4096) {
        return null;
    }

    return token;
};

const verifyAuthToken = (token) =>
    jwt.verify(token, getJwtSecret(), {
        algorithms: ["HS256"],
        issuer: process.env.JWT_ISSUER || undefined,
        audience: process.env.JWT_AUDIENCE || undefined,
    });

export const optionalAuth = (req, res, next) => {
    try {
        const token = getBearerToken(req);

        if (!token) {
            return next();
        }

        req.user = verifyAuthToken(token);
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

/**
 * Middleware to verify JWT token
 */
export const verifyToken = (req, res, next) => {
    try {
        const token = getBearerToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        req.user = verifyAuthToken(token);
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

/**
 * Middleware to verify user is Admin
 */
export const verifyAdmin = (req, res, next) => {
    if (req.user?.type !== "staff" || !isAdminRole(req.user?.role)) {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin privileges required",
        });
    }

    next();
};

/**
 * Middleware to verify user is Staff or Admin
 */
export const verifyStaff = (req, res, next) => {
    if (req.user?.type !== "staff" || !isStaffRole(req.user?.role)) {
        return res.status(403).json({
            success: false,
            message: "Access denied. Staff privileges required",
        });
    }

    next();
};
