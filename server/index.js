import express from "express"
import cors from "cors"
import connectDb from "./db/connect.js"
import dotenv from "dotenv"
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

dotenv.config()
dotenv.config({ path: ".env.local", override: true })

const app = express()
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
const isDevelopment = process.env.NODE_ENV !== "production"
const isAllowedLocalDevOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)

app.set("trust proxy", 1)
app.disable("x-powered-by")
app.use(securityHeaders)
app.use(cors({
    origin(origin, callback) {
        if (
            !origin ||
            allowedOrigins.includes(origin) ||
            (isDevelopment && isAllowedLocalDevOrigin(origin))
        ) {
            return callback(null, true)
        }

        return callback(new Error("Not allowed by CORS"))
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}))
app.use(express.json({ limit: "6mb" }))
app.use(sanitizeInput)
app.use(createRateLimiter())

// Auth routes (public). Keep auth attempts on a tighter limiter than normal API traffic.
app.use('/api/auth', createRateLimiter({
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
    keyPrefix: "auth-rate-limit",
}), authRoutes)

// Route-level authorization is applied inside each route module.
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/packages', packageDealsRoutes)
app.use('/api/promotions', promotionsRoutes)
app.use('/api/customers', customersRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/reports', reportsRoutes)

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: "Server is running" })
})

// 404 route
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" })
})

app.use((error, req, res, next) => {
    if (error.message === "Not allowed by CORS") {
        return res.status(403).json({ success: false, message: "Origin not allowed" })
    }

    return res.status(500).json({ success: false, message: "Internal server error" })
})

const port = process.env.PORT || 5000

const startServer = async () => {
    await connectDb()
    app.listen(port, () => {
        console.log("server is running on http://localhost:" + port);
    })
}

startServer().catch(() => {
    process.exit(1)
})
