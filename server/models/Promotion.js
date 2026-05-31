import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    code: {
        type: String,
        uppercase: true,
        trim: true,
        sparse: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ["percentage", "fixed_amount"],
        required: true,
    },
    value: {
        type: Number,
        required: true,
        min: 0,
    },
    maxDiscount: {
        type: Number,
        min: 0,
        default: 0,
    },
    minOrderAmount: {
        type: Number,
        min: 0,
        default: 0,
    },
    eligibility: {
        customerType: {
            type: String,
            enum: ["all", "members", "non_members"],
            default: "all",
        },
        tiers: [{
            type: String,
            enum: ["Silver", "Gold", "Platinum"],
        }],
        productIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        }],
        categories: [{
            type: String,
            trim: true,
        }],
    },
    usageLimit: {
        type: Number,
        min: 0,
        default: 0,
    },
    perCustomerLimit: {
        type: Number,
        min: 0,
        default: 1,
    },
    usedCount: {
        type: Number,
        min: 0,
        default: 0,
    },
    priority: {
        type: Number,
        default: 100,
        index: true,
    },
    isAutomatic: {
        type: Boolean,
        default: false,
        index: true,
    },
    isExclusive: {
        type: Boolean,
        default: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    startsAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    endsAt: {
        type: Date,
        default: null,
        index: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
}, { timestamps: true });

promotionSchema.index({ isActive: 1, startsAt: 1, endsAt: 1, priority: 1 });

const Promotion = mongoose.model("Promotion", promotionSchema);
export default Promotion;
