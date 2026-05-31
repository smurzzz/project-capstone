const PAYMENT_METHODS_REQUIRING_CHECKOUT = new Set(["GCash", "Maya", "Credit Card", "Debit Card"]);
const PAYMENT_FETCH_TIMEOUT_MS = Number(process.env.PAYMENT_FETCH_TIMEOUT_MS || 15_000);

const roundMoney = (amount) => Math.round(Number(amount || 0) * 100) / 100;

const buildFallbackCheckout = ({ amount, referenceNumber, customer }) => ({
    provider: "manual",
    status: "pending",
    reference: referenceNumber,
    checkoutUrl: "",
    message: `Collect ${roundMoney(amount)} using ${customer?.paymentMethod || "the selected payment method"}.`,
});

const createPayMongoCheckout = async ({ amount, referenceNumber, customer, items }) => {
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
        return buildFallbackCheckout({ amount, referenceNumber, customer });
    }

    const appUrl = process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || "";
    const payload = {
        data: {
            attributes: {
                line_items: items.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    amount: Math.round(item.unitPrice * 100),
                    currency: "PHP",
                })),
                payment_method_types: ["gcash", "paymaya", "card"],
                description: `Order ${referenceNumber}`,
                reference_number: referenceNumber,
                customer_email: customer.email,
                customer_name: customer.name,
                success_url: appUrl ? `${appUrl}/tracking?order=${encodeURIComponent(referenceNumber)}` : undefined,
                cancel_url: appUrl ? `${appUrl}/dashboard` : undefined,
            },
        },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PAYMENT_FETCH_TIMEOUT_MS);

    let response;
    try {
        response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
    } catch (error) {
        throw Object.assign(new Error("Payment gateway is unavailable. Please try again later."), {
            statusCode: 503,
        });
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        const text = await response.text();
        throw Object.assign(new Error(`Payment gateway error: ${text || response.statusText}`), {
            statusCode: 502,
        });
    }

    const json = await response.json();
    const attributes = json?.data?.attributes || {};

    return {
        provider: "paymongo",
        status: "checkout_created",
        reference: json?.data?.id || referenceNumber,
        checkoutUrl: attributes.checkout_url || "",
        message: "Payment checkout created",
    };
};

export const createPaymentCheckout = async ({ paymentMethod, amount, referenceNumber, customer, items }) => {
    if (!PAYMENT_METHODS_REQUIRING_CHECKOUT.has(paymentMethod)) {
        return {
            provider: "manual",
            status: paymentMethod === "Cash on Delivery" || paymentMethod === "Cash" ? "cash_on_delivery" : "pending",
            reference: referenceNumber,
            checkoutUrl: "",
            message: "Manual payment selected",
        };
    }

    const provider = String(process.env.PAYMENT_GATEWAY || "manual").toLowerCase();
    if (provider === "paymongo") {
        return createPayMongoCheckout({ amount, referenceNumber, customer, items });
    }

    return buildFallbackCheckout({ amount, referenceNumber, customer: { ...customer, paymentMethod } });
};
