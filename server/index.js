import express from "express"
import cors from "cors"
import dns from "dns"
import path from "path"
import { fileURLToPath } from "url"
import connectDb from "./db/connect.js"
import dotenv from "dotenv"
import helmet from "helmet"
import morgan from "morgan"
import logger from "./utils/logger.js"
import { createRateLimiter, sanitizeInput, securityHeaders } from "./middleware/security.js"

// Routes
import authRoutes from "./routes/auth.js"
import productsRoutes from "./routes/products.js"
import customersRoutes from "./routes/customers.js"
import ordersRoutes from "./routes/orders.js"
import appointmentsRoutes from "./routes/appointments.js"
import staffRoutes from "./routes/staff.js"
import packageDealsRoutes from "./routes/packageDeals.js"
import reportsRoutes from "./routes/reports.js"
import promotionsRoutes from "./routes/promotions.js"
import membershipsRoutes from "./routes/memberships.js"
import mailRoutes from "./routes/mail.js"
import faqRoutes from "./routes/faqs.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")

// Load environment variables: prefer project root, then server-specific overrides
dotenv.config({ path: path.join(projectRoot, ".env") })
dotenv.config({ path: path.join(__dirname, ".env") })
dotenv.config({ path: path.join(__dirname, ".env.local"), override: true })

const dnsServers = (process.env.DNS_SERVERS || "")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean)

if (dnsServers.length > 0) {
    dns.setServers(dnsServers)
}

const app = express()
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
const isDevelopment = process.env.NODE_ENV !== "production"
const isAllowedLocalDevOrigin = (origin) => {
    return /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)
}
const isAllowedVercelOrigin = (origin) => {
    return /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)
}

const corsOrigin = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isAllowedLocalDevOrigin(origin) || isAllowedVercelOrigin(origin)) {
        callback(null, true)
        return
    }
    callback(new Error("Not allowed by CORS"))
}

app.set("trust proxy", 1)
app.disable("x-powered-by")
// Standard security headers via helmet, keep custom headers afterwards
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
app.use(securityHeaders)
app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
}))
app.use(express.json({ limit: "6mb" }))
app.use(sanitizeInput)

// HTTP request logging
app.use(isDevelopment ? morgan("dev") : morgan("combined"))

// Auth routes (public). Keep auth attempts on a tighter limiter than normal API traffic.
const authRateLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX || (isDevelopment ? 1000 : 120));
const authRateLimiter = createRateLimiter({
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: authRateLimitMax,
    keyPrefix: "auth-rate-limit",
});
app.use('/api/auth', authRateLimiter, authRoutes)

// Apply default rate limiting for all other routes after auth routes so auth requests use their dedicated limit.
app.use(createRateLimiter())

// Route-level authorization is applied inside each route module.
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/packages', packageDealsRoutes)
app.use('/api/promotions', promotionsRoutes)
app.use('/api/customers', customersRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/memberships', membershipsRoutes)
app.use('/api/mail', mailRoutes)

// Health check route
// Lightweight debug middleware for FAQ endpoints to help diagnose 403/CORS/auth issues
app.use('/api/faqs', (req, res, next) => {
    try {
        const origin = req.headers.origin || req.headers.referer || "(none)";
        const auth = req.headers.authorization || "(none)";
        console.info(`[FAQ-MW] ${req.method} ${req.originalUrl} Origin=${origin} Authorization=${auth ? '[present]' : '[missing]'} `);
    } catch (err) {
        console.warn('[FAQ-MW] failed to log headers', err.message);
    }
    next();
}, faqRoutes)
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: "Server is running" })
})

// Serve frontend static files in production when the frontend build is available
if (process.env.NODE_ENV === "production") {
    const staticDir = path.join(projectRoot, "frontend", "dist")
    try {
        app.use(express.static(staticDir))
        // Serve index.html for any non-API route so client-side routing works
        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api/')) return next()
            res.sendFile(path.join(staticDir, 'index.html'))
        })
    } catch (err) {
        logger.warn('Frontend static assets not found or failed to mount', err.message)
    }
}

// 404 route
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" })
})

app.use((error, req, res, next) => {
    if (error.message === "Not allowed by CORS") {
        return res.status(403).json({ success: false, message: "Origin not allowed" })
    }

    logger.error("Unhandled error", error)

    return res.status(500).json({ success: false, message: "Internal server error" })
})

const port = process.env.PORT || 5000

const startServer = async () => {
    await connectDb()
    // Bind to all interfaces so mobile devices on the local network can reach the server
    app.listen(port, '0.0.0.0', () => {
        logger.startup(`Server running on http://localhost:${port}`)
    })
}

startServer().catch(() => {
    process.exit(1)
})
