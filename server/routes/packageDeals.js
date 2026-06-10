import express from "express";
import { optionalAuth, verifyAdmin, verifyStaff, verifyToken } from "../middleware/auth.js";
import {
    createPackageDeal,
    deletePackageDeal,
    getAllPackageDeals,
    getPackageDealById,
    updatePackageDeal,
    getPackagesForMembershipApplication,
} from "../controllers/packageDealController.js";

const router = express.Router();

router.get("/", optionalAuth, getAllPackageDeals);
router.get("/application/membership", getPackagesForMembershipApplication);
router.get("/:id", getPackageDealById);
router.post("/", verifyToken, verifyStaff, createPackageDeal);
router.put("/:id", verifyToken, verifyStaff, updatePackageDeal);
router.delete("/:id", verifyToken, verifyStaff, deletePackageDeal);

export default router;
