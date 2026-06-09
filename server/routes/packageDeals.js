import express from "express";
import { optionalAuth, verifyAdmin, verifyToken } from "../middleware/auth.js";
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
router.post("/", verifyToken, verifyAdmin, createPackageDeal);
router.put("/:id", verifyToken, verifyAdmin, updatePackageDeal);
router.delete("/:id", verifyToken, verifyAdmin, deletePackageDeal);

export default router;
