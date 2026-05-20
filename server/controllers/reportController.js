import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import PackageDeal from "../models/PackageDeal.js";
import Product from "../models/Product.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const currency = (value) => Math.round(Number(value || 0) * 100) / 100;

const startOfDay = (date) => {
    const nextDate = new Date(date);
    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
};

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

const addMonths = (date, months) => {
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + months);
    return nextDate;
};

const startOfWeek = (date) => {
    const nextDate = startOfDay(date);
    const day = nextDate.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    return addDays(nextDate, mondayOffset);
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const parseDateInput = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) {
        return startOfDay(new Date());
    }

    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const formatRangeLabel = ({ period, startDate, endDate }) => {
    const formatter = new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    if (period === "daily") {
        return formatter.format(startDate);
    }

    if (period === "monthly") {
        return new Intl.DateTimeFormat("en", {
            month: "long",
            year: "numeric",
        }).format(startDate);
    }

    return `${formatter.format(startDate)} - ${formatter.format(addDays(endDate, -1))}`;
};

const getPeriodRange = ({ periodValue, offsetValue, dateValue }) => {
    const validPeriods = new Set(["daily", "weekly", "monthly", "last30"]);
    const period = validPeriods.has(periodValue) ? periodValue : "monthly";
    const offset = Math.max(0, Number.parseInt(offsetValue || "0", 10) || 0);
    const now = new Date();

    if (period === "daily") {
        const startDate = addDays(startOfDay(parseDateInput(dateValue)), -offset);
        const endDate = addDays(startDate, 1);

        return {
            period,
            offset,
            startDate,
            endDate,
            previousStartDate: addDays(startDate, -1),
            previousEndDate: startDate,
            label: formatRangeLabel({ period, startDate, endDate }),
        };
    }

    if (period === "last30") {
        const endDate = addDays(startOfDay(now), 1 - (30 * offset));
        const startDate = addDays(endDate, -30);

        return {
            period,
            offset,
            startDate,
            endDate,
            previousStartDate: addDays(startDate, -30),
            previousEndDate: startDate,
            label: formatRangeLabel({ period, startDate, endDate }),
        };
    }

    if (period === "weekly") {
        const latestStart = startOfWeek(now);
        const startDate = addDays(latestStart, -7 * offset);
        const endDate = addDays(startDate, 7);

        return {
            period,
            offset,
            startDate,
            endDate,
            previousStartDate: addDays(startDate, -7),
            previousEndDate: startDate,
            label: formatRangeLabel({ period, startDate, endDate }),
        };
    }

    const latestStart = startOfMonth(now);
    const startDate = addMonths(latestStart, -offset);
    const endDate = addMonths(startDate, 1);

    return {
        period,
        offset,
        startDate,
        endDate,
        previousStartDate: addMonths(startDate, -1),
        previousEndDate: startDate,
        label: formatRangeLabel({ period, startDate, endDate }),
    };
};

const percentChange = (current, previous) => {
    if (!previous) {
        return current ? 100 : 0;
    }

    return Math.round(((current - previous) / previous) * 1000) / 10;
};

const revenueForRange = async (match) => {
    const result = await Order.aggregate([
        { $match: { ...match, status: "Completed" } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    return {
        revenue: currency(result[0]?.total || 0),
        completedOrders: result[0]?.count || 0,
    };
};

const buildDateBuckets = ({ startDate, endDate }) => {
    const buckets = [];

    for (let cursor = new Date(startDate); cursor < endDate; cursor = addDays(cursor, 1)) {
        buckets.push({
            key: formatDateKey(cursor),
            label: new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric",
            }).format(cursor),
            revenue: 0,
            orders: 0,
        });
    }

    return buckets;
};

const getTrend = async ({ startDate, endDate }) => {
    const buckets = buildDateBuckets({ startDate, endDate });
    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    const rows = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                orders: { $sum: 1 },
                revenue: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "Completed"] }, "$total", 0],
                    },
                },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    rows.forEach((row) => {
        const bucket = bucketMap.get(row._id);
        if (bucket) {
            bucket.orders = row.orders || 0;
            bucket.revenue = currency(row.revenue || 0);
        }
    });

    return buckets;
};

const getCategorySales = async (match) => {
    const rows = await OrderItem.aggregate([
        {
            $lookup: {
                from: "orders",
                localField: "orderId",
                foreignField: "_id",
                as: "order",
            },
        },
        { $unwind: "$order" },
        { $match: { "order.status": "Completed", "order.createdAt": match.createdAt } },
        {
            $lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                as: "product",
            },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: "$product.category",
                sales: { $sum: "$subtotal" },
                units: { $sum: "$quantity" },
            },
        },
        { $sort: { sales: -1 } },
        { $limit: 8 },
    ]);

    return rows.map((row) => ({
        category: row._id || "Uncategorized",
        sales: currency(row.sales),
        units: row.units || 0,
    }));
};

const getTopProducts = async (match) => {
    const rows = await OrderItem.aggregate([
        {
            $lookup: {
                from: "orders",
                localField: "orderId",
                foreignField: "_id",
                as: "order",
            },
        },
        { $unwind: "$order" },
        { $match: { "order.status": "Completed", "order.createdAt": match.createdAt } },
        {
            $group: {
                _id: "$productName",
                sold: { $sum: "$quantity" },
                revenue: { $sum: "$subtotal" },
            },
        },
        { $sort: { revenue: -1 } },
        { $limit: 8 },
    ]);

    return rows.map((row) => ({
        product: row._id || "Product",
        sold: row.sold || 0,
        revenue: currency(row.revenue),
    }));
};

const getStatusBreakdown = async (match) => {
    const rows = await Order.aggregate([
        { $match: match },
        { $group: { _id: "$status", value: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);

    return rows.map((row) => ({ name: row._id || "Unknown", value: row.value || 0 }));
};

const getRepeatCustomers = async () => {
    const rows = await Order.aggregate([
        { $match: { customerId: { $ne: null } } },
        { $group: { _id: "$customerId", orderCount: { $sum: 1 } } },
        { $match: { orderCount: { $gt: 1 } } },
        { $count: "count" },
    ]);

    return rows[0]?.count || 0;
};

export const getReportOverview = async (req, res) => {
    try {
        const range = getPeriodRange({
            periodValue: req.query.period,
            offsetValue: req.query.offset,
            dateValue: req.query.date,
        });
        const match = { createdAt: { $gte: range.startDate, $lt: range.endDate } };
        const previousMatch = {
            createdAt: { $gte: range.previousStartDate, $lt: range.previousEndDate },
        };
        const appointmentMatch = { date: { $gte: range.startDate, $lt: range.endDate } };

        const [
            allTimeRevenue,
            periodRevenue,
            previousRevenue,
            totalOrders,
            periodOrders,
            previousOrders,
            totalCustomers,
            newCustomers,
            previousNewCustomers,
            totalAppointments,
            appointments,
            inventoryItems,
            inventoryValueResult,
            lowStockItems,
            packageDeals,
            repeatCustomers,
            trend,
            categorySales,
            topProducts,
            statusBreakdown,
            recentOrders,
        ] = await Promise.all([
            revenueForRange({}),
            revenueForRange(match),
            revenueForRange(previousMatch),
            Order.countDocuments(),
            Order.countDocuments(match),
            Order.countDocuments(previousMatch),
            Customer.countDocuments(),
            Customer.countDocuments(match),
            Customer.countDocuments(previousMatch),
            Appointment.countDocuments(),
            Appointment.countDocuments(appointmentMatch),
            Product.countDocuments(),
            Product.aggregate([
                {
                    $group: {
                        _id: null,
                        value: { $sum: { $multiply: ["$stockLevel", "$price"] } },
                    },
                },
            ]),
            Product.countDocuments({
                $expr: {
                    $and: [
                        { $gt: ["$minStock", 0] },
                        { $lt: ["$stockLevel", "$minStock"] },
                    ],
                },
            }),
            PackageDeal.countDocuments({ isActive: true }),
            getRepeatCustomers(),
            getTrend(range),
            getCategorySales(match),
            getTopProducts(match),
            getStatusBreakdown(match),
            Order.find()
                .populate("customerId", "name contactInfo role")
                .sort({ createdAt: -1 })
                .limit(5),
        ]);

        const avgOrderValue = periodRevenue.completedOrders
            ? currency(periodRevenue.revenue / periodRevenue.completedOrders)
            : 0;
        const previousAvgOrderValue = previousRevenue.completedOrders
            ? currency(previousRevenue.revenue / previousRevenue.completedOrders)
            : 0;

        return res.status(200).json({
            success: true,
            data: {
                period: {
                    type: range.period,
                    offset: range.offset,
                    label: range.label,
                    startDate: range.startDate,
                    endDate: range.endDate,
                },
                allTime: {
                    totalRevenue: allTimeRevenue.revenue,
                    totalOrders,
                    totalCustomers,
                    repeatCustomers,
                    appointments: totalAppointments,
                    inventoryItems,
                    inventoryValue: currency(inventoryValueResult[0]?.value || 0),
                    lowStockItems,
                    packageDeals,
                },
                metrics: {
                    totalRevenue: periodRevenue.revenue,
                    totalOrders: periodOrders,
                    completedOrders: periodRevenue.completedOrders,
                    newCustomers,
                    totalCustomers,
                    avgOrderValue,
                    appointments,
                },
                comparison: {
                    revenue: percentChange(periodRevenue.revenue, previousRevenue.revenue),
                    orders: percentChange(periodOrders, previousOrders),
                    newCustomers: percentChange(newCustomers, previousNewCustomers),
                    avgOrderValue: percentChange(avgOrderValue, previousAvgOrderValue),
                },
                charts: {
                    revenueTrend: trend,
                    ordersTrend: trend,
                    categorySales,
                    topProducts,
                    statusBreakdown,
                },
                recentOrders: recentOrders.map((order) => ({
                    _id: order._id,
                    referenceNumber: order.referenceNumber,
                    customerName: order.customerId?.name || order.fullName || "Guest",
                    total: order.total,
                    status: order.status,
                    createdAt: order.createdAt,
                })),
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
