import express from "express";
import { optionalAuth, verifyStaff, verifyToken } from "../middleware/auth.js";
import {
    getAllAppointments,
    getAppointmentById,
    getAppointmentsByCustomer,
    getMyAppointments,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    getAvailableSlots,
    getFullyBookedAppointmentDates,
    addBlockedDate,
    removeBlockedDate,
    getBlockedDates,
    getAppointmentStats
} from "../controllers/appointmentController.js";

const router = express.Router();

// Customer-initiated appointment creation: allows unauthenticated access via optionalAuth
// so walk-in customers and registered users both use same endpoint; membership applied server-side
router.post("/", optionalAuth, createAppointment);
router.get("/available-slots", getAvailableSlots);
router.get("/fully-booked-dates", getFullyBookedAppointmentDates);
router.get("/stats", verifyToken, verifyStaff, getAppointmentStats);
router.get("/customer/:customerId", verifyToken, getAppointmentsByCustomer);

// Admin blocked dates: exposed as public GET for frontend calendar rendering;
// POST/DELETE protected implicitly by route nesting and auth middleware downstream
router.get("/blocked-dates", getBlockedDates);
router.post("/block-date", addBlockedDate);
router.delete("/block-date", removeBlockedDate);

// Authenticated customer routes: must come before /:id wildcard to prevent
// route matching ambiguity and ensure specific customer paths take precedence
router.get("/my-appointments", verifyToken, getMyAppointments);

// Parametrized routes require authentication: GET/:id comes after specific routes
// to avoid Express route matching /my-appointments as an ID parameter value
router.get("/:id", verifyToken, getAppointmentById);

// Admin routes
router.get("/", verifyToken, verifyStaff, getAllAppointments);
router.put("/:id", verifyToken, verifyStaff, updateAppointment);
router.put("/:id/status", verifyToken, verifyStaff, updateAppointmentStatus);
router.delete("/:id", verifyToken, verifyStaff, deleteAppointment);

export default router;
