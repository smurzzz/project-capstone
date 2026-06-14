import mongoose from "mongoose";

const membershipHistorySchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true,
    },
    action: {
        type: String,
        enum: ["registered", "approved", "renewed", "updated", "suspended", "rejected", "points_earned", "points_redeemed", "force_removed"],
        required: true,
    },
    previousStatus: {
        type: String,
        trim: true,
        default: "",
    },
    newStatus: {
        type: String,
        trim: true,
        default: "",
    },
    previousTier: {
        type: String,
        trim: true,
        default: "",
    },
    newTier: {
        type: String,
        trim: true,
        default: "",
    },
    pointsChange: {
        type: Number,
        default: 0,
    },
    actorType: {
        type: String,
        enum: ["system", "staff", "customer"],
        default: "system",
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    notes: {
        type: String,
        trim: true,
        default: "",
    },
}, { timestamps: true });

membershipHistorySchema.index({ customerId: 1, createdAt: -1 });

const MembershipHistory = mongoose.model("MembershipHistory", membershipHistorySchema);
export default MembershipHistory;
