import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    stockLevel: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    minStock: {
        type: Number,
        default: 0,
        min: 0
    },
    srp: {
        type: Number,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    supplier: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

productSchema.pre("validate", function normalizeProductPrice() {
    if (this.srp === undefined || this.srp === null) {
        this.srp = this.price;
    }

    if (this.price === undefined || this.price === null) {
        this.price = this.srp;
    }
});

productSchema.index({ category: 1, productName: 1 });
productSchema.index({ stockLevel: 1, minStock: 1 });
productSchema.index({
    productName: "text",
    sku: "text",
    category: "text",
    supplier: "text",
    description: "text",
});

const Product = mongoose.model("Product", productSchema);
export default Product;
