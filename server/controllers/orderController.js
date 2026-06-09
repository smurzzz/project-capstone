import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Product from "../models/Product.js";
import InventoryMovement from "../models/InventoryMovement.js";
import PackageDeal from "../models/PackageDeal.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import MembershipHistory from "../models/MembershipHistory.js";
import {
    cleanString,
    isValidEmail,
    isValidPhone,
    isStaffRole,
    isValidObjectId,
    normalizeEmail,
    parseOrderQuantity,
} from "../utils/validation.js";
import {
    sendOrderCreatedEmail,
    sendOrderStatusEmail,
} from "../utils/notifications.js";
import { createPaymentCheckout } from "../utils/payments.js";
import {
    calculateMembershipPoints,
    getActiveMembership,
} from "../utils/membership.js";
import {
    calculatePromotions,
    recordPromotionRedemptions,
} from "../utils/promotionEngine.js";

const paymentMethodAliases = new Map([
    ["gcash", "GCash"],
    ["bank_transfer", "Bank Transfer"],
    ["cod", "Cash on Delivery"],
    ["cash on delivery", "Cash on Delivery"],
    ["cash_on_delivery", "Cash on Delivery"],
]);
const paymentMethods = new Set(["GCash", "Cash on Delivery", "Bank Transfer"]);

const normalizePaymentMethod = (value) => {
    const rawValue = String(value || "").trim();
    const lookupKey = rawValue.toLowerCase();

    if (paymentMethodAliases.has(lookupKey)) {
        return paymentMethodAliases.get(lookupKey);
    }

    if (paymentMethods.has(rawValue)) {
        return rawValue;
    }

    return null;
};

const buildReferenceNumber = () =>
    `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const roundMoney = (amount) => Math.round(Number(amount || 0) * 100) / 100;

const toObject = (doc) => doc.toObject ? doc.toObject() : doc;

const attachOrderItemCounts = async (orders) => {
    const orderIds = orders.map((order) => order._id);

    if (orderIds.length === 0) {
        return [];
    }

    const counts = await OrderItem.aggregate([
        { $match: { orderId: { $in: orderIds } } },
        { $group: { _id: "$orderId", itemCount: { $sum: "$quantity" } } },
    ]);
    const countMap = new Map(counts.map((item) => [String(item._id), item.itemCount]));

    return orders.map((order) => ({
        ...toObject(order),
        itemCount: countMap.get(String(order._id)) || 0,
    }));
};

const getAuthenticatedCustomer = async (user) => {
    if (user?.type !== "customer") {
        return null;
    }

    const account = await User.findById(user.id);
    if (!account) {
        return null;
    }

    let customer = null;
    if (account.customerId) {
        customer = await Customer.findById(account.customerId);
    }

    if (!customer) {
        customer = await Customer.findOne({ "contactInfo.email": account.email });
    }

    if (customer && String(account.customerId || "") !== String(customer._id)) {
        account.customerId = customer._id;
        await account.save();
    }

    return customer;
};

const assertOrderAccess = async (req, order) => {
    if (isStaffRole(req.user?.role)) {
        return true;
    }

    const customer = await getAuthenticatedCustomer(req.user);
    if (!customer || !order.customerId) {
        return false;
    }

    return String(customer._id) === String(order.customerId._id || order.customerId);
};

const restoreStockForOrder = async (orderId) => {
    const [order, orderItems] = await Promise.all([
        Order.findById(orderId),
        OrderItem.find({ orderId }),
    ]);

    await Promise.all(orderItems.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
            return null;
        }

        const stockBefore = product.stockLevel;
        product.stockLevel += item.quantity;
        product.updatedAt = new Date();
        await product.save();

        return InventoryMovement.create({
            productId: product._id,
            productName: product.productName,
            type: "order_cancellation",
            quantityChange: item.quantity,
            stockBefore,
            stockAfter: product.stockLevel,
            orderId,
            referenceNumber: order?.referenceNumber || "",
            actorType: "staff",
            reason: "Order cancelled; stock restored",
        });
    }));
};

/**
 * Get all orders (Staff/Admin only)
 */
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("customerId", "name contactInfo role")
            .sort({ createdAt: -1 });
        const data = await attachOrderItemCounts(orders);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        const order = await Order.findById(req.params.id)
            .populate("customerId", "name contactInfo role");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const canAccess = await assertOrderAccess(req, order);
        if (!canAccess) {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }

        const orderItems = await OrderItem.find({ orderId: order._id })
            .populate("productId", "productName price srp");

        res.status(200).json({
            success: true,
            data: {
                order,
                items: orderItems,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get orders by customer ID
 */
export const getOrdersByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!isValidObjectId(customerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }

        if (!isStaffRole(req.user?.role)) {
            const customer = await getAuthenticatedCustomer(req.user);

            if (!customer || String(customer._id) !== String(customerId)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }
        }

        const orders = await Order.find({ customerId })
            .populate("customerId", "name contactInfo role")
            .sort({ createdAt: -1 });
        const data = await attachOrderItemCounts(orders);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Create new order
 */
export const createOrder = async (req, res) => {
    const stockDebits = [];
    let newOrder = null;

    try {
        const fullName = cleanString(req.body.fullName, 120);
        const contactNumber = cleanString(req.body.contactNumber, 30);
        const email = normalizeEmail(req.body.email);
        const address = cleanString(req.body.address, 500);
        const paymentMethod = normalizePaymentMethod(req.body.paymentMethod);
        const rawReferenceNumber = cleanString(req.body.referenceNumber, 120);
        const referenceNumber = rawReferenceNumber || buildReferenceNumber();
        const promotionCode = cleanString(req.body.promotionCode, 80).toUpperCase();
        const notes = cleanString(req.body.notes, 1000);
        const packageId = cleanString(req.body.packageId, 80);
        const orderTypeParam = cleanString(req.body.orderType, 30);
        let items = Array.isArray(req.body.items) ? req.body.items : [];
        let packageDeal = null;
        let orderType = "products"; // default

        if (packageId) {
            if (!isValidObjectId(packageId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid package deal",
                });
            }

            packageDeal = await PackageDeal.findOne({ _id: packageId, isActive: true });
            if (!packageDeal) {
                return res.status(404).json({
                    success: false,
                    message: "Package deal not found",
                });
            }

            items = packageDeal.items
                .filter((item) => item.productId)
                .map((item) => ({
                    productId: String(item.productId),
                    quantity: item.quantity,
                }));
        }

        if (!fullName || !contactNumber || !email || !address || !paymentMethod || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: packageDeal
                    ? "This package does not have product inventory items configured"
                    : "Required order fields are missing",
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required",
            });
        }

        if (!isValidPhone(contactNumber)) {
            return res.status(400).json({
                success: false,
                message: "A valid contact number is required",
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method",
            });
        }

        if (paymentMethod === "Bank Transfer" && !rawReferenceNumber) {
            return res.status(400).json({
                success: false,
                message: "Bank transfer reference number is required",
            });
        }

        const customer = await getAuthenticatedCustomer(req.user);
        const orderCustomerId = customer?._id || null;
        const activeMembership = getActiveMembership(customer);

        const requestedItems = new Map();
        for (const item of items) {
            const productId = cleanString(item.productId, 80);
            const quantity = parseOrderQuantity(item.quantity);

            if (!isValidObjectId(productId) || quantity === null) {
                return res.status(400).json({
                    success: false,
                    message: "Each order item must include a valid product and quantity",
                });
            }

            requestedItems.set(productId, (requestedItems.get(productId) || 0) + quantity);
        }

        const productIds = [...requestedItems.keys()];
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map((product) => [String(product._id), product]));

        if (products.length !== productIds.length) {
            return res.status(404).json({
                success: false,
                message: "One or more products were not found",
            });
        }

        let subtotal = 0;
        const orderLines = [];

        for (const [productId, quantity] of requestedItems.entries()) {
            const product = productMap.get(productId);

            if (product.stockLevel < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.productName}`,
                });
            }

            const unitPrice = roundMoney(product.srp ?? product.price);
            const lineSubtotal = roundMoney(unitPrice * quantity);
            subtotal += lineSubtotal;
            orderLines.push({ product, productId, quantity, unitPrice, lineSubtotal });
        }

        subtotal = roundMoney(subtotal);
        const packageBaseTotal = packageDeal ? roundMoney(packageDeal.price) : subtotal;
        
        // Set orderType based on packageDeal
        if (packageDeal) {
            orderType = "package";
        }
        
        // Calculate promotions - REQUIRED to avoid undefined variable error
        let promotionResult = { discountAmount: 0, appliedPromotions: [] };
        if (promotionCode) {
            try {
                promotionResult = await calculatePromotions({
                    promoCode: promotionCode,
                    customer,
                    lines: orderLines,
                    orderSubtotal: packageBaseTotal,
                });
            } catch (error) {
                if (error.statusCode === 400) {
                    return res.status(400).json({
                        success: false,
                        message: error.message,
                    });
                }
            }
        }
        
        const total = roundMoney(Math.max(0, packageBaseTotal - promotionResult.discountAmount));
        const payment = await createPaymentCheckout({
            paymentMethod,
            amount: total,
            referenceNumber,
            customer: { name: fullName, email },
            items: orderLines.map((line) => ({
                name: line.product.productName,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
            })),
        });

        newOrder = await Order.create({
            customerId: orderCustomerId,
            fullName,
            contactNumber,
            email,
            address,
            packageDealId: packageDeal?._id || null,
            packageName: packageDeal?.name || "",
            paymentMethod,
            paymentStatus: payment.status,
            paymentGateway: payment.provider,
            paymentReference: payment.reference,
            paymentCheckoutUrl: payment.checkoutUrl,
            referenceNumber,
            orderType: orderTypeParam || orderType,
            total,
            discountAmount: promotionResult.discountAmount,
            membershipDiscountAmount: 0,
            promotionDiscountAmount: promotionResult.discountAmount,
            promotionCode,
            appliedPromotions: promotionResult.appliedPromotions,
            notes: packageDeal ? `${notes ? `${notes} | ` : ""}Package: ${packageDeal.name}` : notes,
            status: "Pending",
        });

        const createdItems = [];
        for (const line of orderLines) {
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: line.productId, stockLevel: { $gte: line.quantity } },
                {
                    $inc: { stockLevel: -line.quantity },
                    $set: { updatedAt: new Date() },
                },
                { returnDocument: 'after' }
            );

            if (!updatedProduct) {
                throw Object.assign(new Error(`Insufficient stock for ${line.product.productName}`), {
                    statusCode: 400,
                });
            }

            stockDebits.push({ productId: line.productId, quantity: line.quantity });

            await InventoryMovement.create({
                productId: line.productId,
                productName: line.product.productName,
                type: "order_deduction",
                quantityChange: -line.quantity,
                stockBefore: updatedProduct.stockLevel + line.quantity,
                stockAfter: updatedProduct.stockLevel,
                orderId: newOrder._id,
                referenceNumber,
                actorType: req.user?.type || "customer",
                actorId: req.user?.id || null,
                reason: "Order checkout stock deduction",
            });

            const orderItem = await OrderItem.create({
                orderId: newOrder._id,
                productId: line.productId,
                productName: line.product.productName,
                price: line.unitPrice,
                quantity: line.quantity,
                subtotal: line.lineSubtotal,
            });

            createdItems.push(orderItem);
        }

        // Record promotion redemptions (non-critical, log errors to prevent cascade)
        try {
            if (promotionResult.appliedPromotions && promotionResult.appliedPromotions.length > 0) {
                await recordPromotionRedemptions({
                    order: newOrder,
                    customerId: orderCustomerId,
                    appliedPromotions: promotionResult.appliedPromotions,
                    orderTotalBeforeDiscount: packageBaseTotal,
                });
            }
        } catch (promotionError) {
            console.error("Failed to record promotion redemptions:", promotionError);
        }

        // Send confirmation email (non-critical, log errors to prevent cascade)
        try {
            await sendOrderCreatedEmail({
                ...newOrder.toObject(),
                customerId: customer || null,
                items: createdItems,
            }, customer);
        } catch (emailError) {
            console.error("Failed to send order confirmation email:", emailError);
        }

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: {
                order: newOrder,
                items: createdItems,
                payment,
            },
        });
    } catch (error) {
        console.error("Error creating order:", error);
        await Promise.all(stockDebits.map((item) =>
            Product.findByIdAndUpdate(item.productId, {
                $inc: { stockLevel: item.quantity },
                $set: { updatedAt: new Date() },
            }, { returnDocument: 'after' })
        ));

        if (newOrder) {
            await Promise.all([
                OrderItem.deleteMany({ orderId: newOrder._id }),
                InventoryMovement.deleteMany({ orderId: newOrder._id }),
                Order.findByIdAndDelete(newOrder._id),
            ]);
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Reference number already exists",
            });
        }

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : "Internal server error",
        });
    }
};

/**
 * Update order status (Staff/Admin only)
 */
export const updateOrderStatus = async (req, res) => {
    try {
        const status = cleanString(req.body.status, 30);
        const validStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const previousStatus = order.status;

        if (status === "Cancelled" && order.status !== "Cancelled") {
            if (order.status === "Completed") {
                return res.status(400).json({
                    success: false,
                    message: "Cannot cancel a completed order",
                });
            }

            await restoreStockForOrder(order._id);
        }

        order.status = status;
        order.updatedAt = new Date();
        await order.save();

        if (status === "Completed" && previousStatus !== "Completed" && order.customerId) {
            const customer = await Customer.findById(order.customerId);
            const earnedPoints = calculateMembershipPoints({ customer, amount: order.total });

            if (earnedPoints > 0 && customer) {
                customer.membership.pointsBalance = (customer.membership.pointsBalance || 0) + earnedPoints;
                customer.updatedAt = new Date();
                await customer.save();

                await MembershipHistory.create({
                    customerId: customer._id,
                    action: "points_earned",
                    newStatus: customer.membership.status,
                    newTier: customer.membership.tier,
                    pointsChange: earnedPoints,
                    actorType: req.user?.type || "staff",
                    actorId: req.user?.id || null,
                    notes: `Points earned from completed order ${order.referenceNumber}`,
                });
            }

            // TODO: Implement activateMembershipForCompletedPackageOrder function
        }

        const populatedOrder = await Order.findById(order._id)
            .populate("customerId", "name contactInfo role emailPreferences");

        if (previousStatus !== status) {
            try {
                await sendOrderStatusEmail(populatedOrder, populatedOrder.customerId);
            } catch (emailError) {
                console.error("Failed to send order status email:", emailError);
            }
        }

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: populatedOrder,
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get order statistics (Dashboard)
 */
export const getOrderStats = async (req, res) => {
    try {
        const [totalOrders, completedOrders, pendingOrders, confirmedOrders] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: "Completed" }),
            Order.countDocuments({ status: "Pending" }),
            Order.countDocuments({ status: "Confirmed" }),
        ]);

        const totalRevenueResult = await Order.aggregate([
            { $match: { status: "Completed" } },
            { $group: { _id: null, total: { $sum: "$total" } } },
        ]);

        const totalDiscountResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$discountAmount" } } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                completedOrders,
                pendingOrders,
                confirmedOrders,
                totalRevenue: totalRevenueResult[0]?.total || 0,
                totalDiscounts: totalDiscountResult[0]?.total || 0,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Cancel order
 */
export const cancelOrder = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.status === "Completed") {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel a completed order",
            });
        }

        if (order.status === "Cancelled") {
            return res.status(200).json({
                success: true,
                message: "Order is already cancelled",
                data: order,
            });
        }

        await restoreStockForOrder(order._id);

        order.status = "Cancelled";
        order.updatedAt = new Date();
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("customerId", "name contactInfo role");

        await sendOrderStatusEmail(populatedOrder);

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: populatedOrder,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
