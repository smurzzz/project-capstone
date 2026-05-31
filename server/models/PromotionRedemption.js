import mongoose from "mongoose";

const promotionRedemptionSchema = new mongoose.Schema({
    promotionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion",
        required: true,
        index: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        index: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
        index: true,
    },
    code: {
        type: String,
        uppercase: true,
        trim: true,
        default: "",
    },
    discountAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    orderTotalBeforeDiscount: {
        type: Number,
        required: true,
        min: 0,
    },
}, { timestamps: true });

promotionRedemptionSchema.index({ promotionId: 1, customerId: 1 });

const PromotionRedemption = mongoose.model("PromotionRedemption", promotionRedemptionSchema);
export default PromotionRedemption;
