import express from "express";
import { verifyToken } from "../middleware/auth.js";
import * as membershipController from "../controllers/membershipController.js";

const router = express.Router();

/**
 * Customer Routes (Protected)
 */
router.post("/apply", verifyToken, membershipController.applyForMembership);
router.get("/me", verifyToken, membershipController.getMyMembership);
router.get("/me/status", verifyToken, membershipController.getMyMembership);
router.get("/me/history", verifyToken, membershipController.getMyMembershipHistory);
// Benefits endpoint is public: allows frontend to render tier descriptions and
// benefits before customer authentication, reducing friction for discovery
router.get("/benefits/:tier", membershipController.getApplicationById);

/**
 * Admin Routes (Protected)
 */
router.get("/applications", verifyToken, membershipController.getAllApplications);
router.get("/applications/:applicationId", verifyToken, membershipController.getApplicationById);
router.post("/applications/:applicationId/approve", verifyToken, membershipController.approveApplication);
router.post("/applications/:applicationId/reject", verifyToken, membershipController.rejectApplication);
router.get("/customer/:customerId", verifyToken, membershipController.getApplicationById);
router.put("/customer/:customerId/tier", verifyToken, membershipController.updateMembershipTier);
router.post("/customer/:customerId/renew", verifyToken, membershipController.renewMembership);
router.post("/customer/:customerId/suspend", verifyToken, membershipController.suspendMembership);
router.get("/stats", verifyToken, membershipController.getMembershipStats);

export default router;
