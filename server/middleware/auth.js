import jwt from "jsonwebtoken";
import { isAdminRole, isStaffRole } from "../utils/validation.js";

export const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET must be set");
    }

    // Disallow common placeholder secrets to prevent insecure deployments.
    const normalized = String(secret).trim().toLowerCase();
    const isPlaceholder =
        normalized === "your-secret-key" ||
        normalized.includes("change-this") ||
        normalized.includes("development-only-change-me");

    if (isPlaceholder) {
        throw new Error("JWT_SECRET must not be a placeholder value");
    }

    // Basic strength check: require a decent length.
    if (String(secret).length < 20) {
        throw new Error("JWT_SECRET is too short");
    }

    return String(secret);
};



export const signAuthToken = (payload) =>
    jwt.sign(payload, getJwtSecret(), {
        algorithm: "HS256",
        expiresIn: process.env.JWT_EXPIRES_IN || "2d",
        ...(process.env.JWT_ISSUER ? { issuer: process.env.JWT_ISSUER } : {}),
        ...(process.env.JWT_AUDIENCE ? { audience: process.env.JWT_AUDIENCE } : {}),
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
        ...(process.env.JWT_ISSUER ? { issuer: process.env.JWT_ISSUER } : {}),
        ...(process.env.JWT_AUDIENCE ? { audience: process.env.JWT_AUDIENCE } : {}),
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
