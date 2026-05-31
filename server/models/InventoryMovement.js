import mongoose from "mongoose";

const inventoryMovementSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
    },
    productName: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ["order_deduction", "order_cancellation", "manual_adjustment"],
        required: true,
        index: true,
    },
    quantityChange: {
        type: Number,
        required: true,
    },
    stockBefore: {
        type: Number,
        required: true,
        min: 0,
    },
    stockAfter: {
        type: Number,
        required: true,
        min: 0,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null,
        index: true,
    },
    referenceNumber: {
        type: String,
        trim: true,
        default: "",
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
    reason: {
        type: String,
        trim: true,
        default: "",
    },
}, { timestamps: true });

inventoryMovementSchema.index({ createdAt: -1 });
inventoryMovementSchema.index({ productId: 1, createdAt: -1 });

const InventoryMovement = mongoose.model("InventoryMovement", inventoryMovementSchema);
export default InventoryMovement;
