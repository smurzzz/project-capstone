import { sendEmail } from "./mailer.js";

const appName = process.env.APP_NAME || "JBM Electro Ventures";

const escapeHtml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(Number(amount || 0));

const formatDate = (value) => {
    if (!value) return "TBD";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "TBD";

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

const formatDateTime = (value) => {
    if (!value) return "TBD";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "TBD";

    return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const buildTemplate = ({ title, preview, body }) => `
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;background:#f3f4f6;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
        ${escapeHtml(preview || title)}
    </span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;">
                    <tr>
                        <td style="background:#111827;color:#ffffff;padding:22px 28px;">
                            <div style="font-size:18px;font-weight:700;">${escapeHtml(appName)}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#111827;">${escapeHtml(title)}</h1>
                            <div style="font-size:15px;line-height:1.7;color:#374151;">
                                ${body}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="border-top:1px solid #e5e7eb;padding:18px 28px;color:#6b7280;font-size:12px;line-height:1.5;">
                            This is an automated message from ${escapeHtml(appName)}. Please do not reply with sensitive information.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const row = (label, value) => `
    <tr>
        <td style="padding:8px 0;color:#6b7280;">${escapeHtml(label)}</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">${escapeHtml(value)}</td>
    </tr>`;

const sendNotification = async (payload) => {
    try {
        return await sendEmail(payload);
    } catch (error) {
        console.error("Failed to send email notification:", error.message);
        return false;
    }
};

export const sendOtpVerificationEmail = ({ to, name = "Customer", otp, expiresInMinutes = 10 }) => {
    const subject = `${appName} verification code`;
    const text = [
        `Hello ${name},`,
        "",
        `Your verification code is ${otp}.`,
        `This code expires in ${expiresInMinutes} minutes.`,
        "",
        "If you did not request this, you can ignore this email.",
    ].join("\n");
    const html = buildTemplate({
        title: "Verify your email",
        preview: `Your verification code is ${otp}`,
        body: `
            <p>Hello ${escapeHtml(name)},</p>
            <p>Use this one-time code to verify your email address:</p>
            <div style="margin:22px 0;padding:18px;background:#f9fafb;border:1px solid #e5e7eb;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;">
                ${escapeHtml(otp)}
            </div>
            <p>This code expires in ${escapeHtml(expiresInMinutes)} minutes.</p>
        `,
    });

    return sendNotification({ to, subject, text, html });
};

export const sendPasswordResetEmail = ({ to, name = "Customer", resetToken, resetUrl, expiresInMinutes = 30 }) => {
    const subject = `${appName} password reset`;
    const text = [
        `Hello ${name},`,
        "",
        "We received a request to reset your password.",
        resetUrl ? `Reset link: ${resetUrl}` : `Reset code: ${resetToken}`,
        `This reset request expires in ${expiresInMinutes} minutes.`,
        "",
        "If you did not request this, you can ignore this email.",
    ].join("\n");
    const actionHtml = resetUrl
        ? `<p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;font-weight:700;">Reset password</a></p>`
        : `<div style="margin:22px 0;padding:18px;background:#f9fafb;border:1px solid #e5e7eb;text-align:center;font-size:24px;font-weight:700;letter-spacing:4px;color:#111827;">${escapeHtml(resetToken)}</div>`;
    const html = buildTemplate({
        title: "Reset your password",
        preview: "Password reset request",
        body: `
            <p>Hello ${escapeHtml(name)},</p>
            <p>We received a request to reset your password.</p>
            ${actionHtml}
            <p>This reset request expires in ${escapeHtml(expiresInMinutes)} minutes.</p>
            <p>If you did not request this, no action is needed.</p>
        `,
    });

    return sendNotification({ to, subject, text, html });
};

export const sendMembershipApprovalEmail = ({ to, name = "Customer", tier, expiresAt }) => {
    const subject = "Your membership has been approved";
    const text = [
        `Hello ${name},`,
        "",
        `Your ${tier} membership has been approved.`,
        `Valid until: ${formatDate(expiresAt)}`,
        "",
        "Thank you for being part of JBM Electro Ventures.",
    ].join("\n");
    const html = buildTemplate({
        title: "Membership approved",
        preview: `Your ${tier} membership is active`,
        body: `
            <p>Hello ${escapeHtml(name)},</p>
            <p>Your membership application has been approved.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">
                ${row("Membership tier", tier)}
                ${row("Valid until", formatDate(expiresAt))}
            </table>
            <p>You can now enjoy your member benefits on eligible purchases.</p>
        `,
    });

    return sendNotification({ to, subject, text, html });
};

export const sendAppointmentConfirmationEmail = ({ appointment }) => {
    const customerName = appointment?.contactInfo?.name || appointment?.customerId?.name || "Customer";
    const to = appointment?.contactInfo?.email || appointment?.customerId?.contactInfo?.email || "";
    const subject = appointment?.status === "Confirmed"
        ? "Your appointment is confirmed"
        : "Appointment request received";
    const statusText = appointment?.status === "Confirmed"
        ? "Your appointment has been confirmed."
        : "Your appointment request has been received.";
    const text = [
        `Hello ${customerName},`,
        "",
        statusText,
        `Service: ${appointment.service}`,
        `Date: ${formatDate(appointment.date)}`,
        `Time: ${appointment.timeSlot}`,
    ].join("\n");
    const html = buildTemplate({
        title: subject,
        preview: `${appointment.service} on ${formatDate(appointment.date)}`,
        body: `
            <p>Hello ${escapeHtml(customerName)},</p>
            <p>${escapeHtml(statusText)}</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">
                ${row("Service", appointment.service)}
                ${row("Date", formatDate(appointment.date))}
                ${row("Time", appointment.timeSlot)}
                ${row("Status", appointment.status || "Scheduled")}
            </table>
        `,
    });

    return sendNotification({ to, subject, text, html });
};

export const sendAppointmentStatusEmail = ({ appointment }) => {
    const customerName = appointment?.contactInfo?.name || appointment?.customerId?.name || "Customer";
    const to = appointment?.contactInfo?.email || appointment?.customerId?.contactInfo?.email || "";
    const subject = appointment?.status === "Confirmed"
        ? "Your appointment is confirmed"
        : `Appointment update: ${appointment?.status || "Updated"}`;
    const text = [
        `Hello ${customerName},`,
        "",
        `Your appointment status is now ${appointment.status}.`,
        `Service: ${appointment.service}`,
        `Date: ${formatDate(appointment.date)}`,
        `Time: ${appointment.timeSlot}`,
    ].join("\n");
    const html = buildTemplate({
        title: "Appointment status update",
        preview: `Status: ${appointment?.status || "Updated"}`,
        body: `
            <p>Hello ${escapeHtml(customerName)},</p>
            <p>Your appointment status has been updated.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">
                ${row("Status", appointment.status)}
                ${row("Service", appointment.service)}
                ${row("Date", formatDate(appointment.date))}
                ${row("Time", appointment.timeSlot)}
            </table>
        `,
    });

    return sendNotification({ to, subject, text, html });
};

export const sendAdminNotificationEmail = ({ to, subject, title, message, details = {} }) => {
    const rows = Object.entries(details)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([label, value]) => row(label, value))
        .join("");
    const text = [
        message,
        "",
        ...Object.entries(details).map(([label, value]) => `${label}: ${value}`),
    ].join("\n");
    const html = buildTemplate({
        title: title || subject || "Admin notification",
        preview: message,
        body: `
            <p>${escapeHtml(message)}</p>
            ${rows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">${rows}</table>` : ""}
        `,
    });

    return sendNotification({
        to,
        subject: subject || "Admin notification",
        text,
        html,
    });
};

export const sendReceiptEmail = ({ to, order, items = [] }) => {
    const itemRows = items.map((item) => `
        <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.productName || item.name)}</td>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(item.quantity)}</td>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatCurrency(item.subtotal ?? Number(item.price || 0) * Number(item.quantity || 0)))}</td>
        </tr>
    `).join("");
    const subject = `Receipt ${order.referenceNumber}`;
    const text = [
        `Hello ${order.fullName},`,
        "",
        `Receipt for order ${order.referenceNumber}`,
        `Total: ${formatCurrency(order.total)}`,
        `Payment method: ${order.paymentMethod}`,
        `Status: ${order.status}`,
    ].join("\n");
    const html = buildTemplate({
        title: "Receipt / Invoice",
        preview: `Receipt ${order.referenceNumber}`,
        body: `
            <p>Hello ${escapeHtml(order.fullName)},</p>
            <p>Thank you for your order. Here are your receipt details.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">
                ${row("Order reference", order.referenceNumber)}
                ${row("Date", formatDateTime(order.createdAt))}
                ${row("Payment method", order.paymentMethod)}
                ${row("Payment status", String(order.paymentStatus || "pending").replaceAll("_", " "))}
            </table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">
                <tr>
                    <th align="left" style="padding:10px 0;border-bottom:2px solid #111827;">Item</th>
                    <th align="center" style="padding:10px 0;border-bottom:2px solid #111827;">Qty</th>
                    <th align="right" style="padding:10px 0;border-bottom:2px solid #111827;">Amount</th>
                </tr>
                ${itemRows || `<tr><td colspan="3" style="padding:12px 0;color:#6b7280;">No item details available.</td></tr>`}
            </table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">
                ${row("Discount", formatCurrency(order.discountAmount || 0))}
                ${row("Total", formatCurrency(order.total))}
            </table>
        `,
    });

    return sendNotification({ to, subject, text, html });
};

export const sendOrderStatusUpdateEmail = ({ to, order }) => {
    const subject = order?.status === "Completed"
        ? `Your order is ready: ${order.referenceNumber}`
        : `Order update: ${order?.referenceNumber || ""}`.trim();
    const text = [
        `Hello ${order.fullName},`,
        "",
        `Your order status is now ${order.status}.`,
        `Reference number: ${order.referenceNumber}`,
        `Total: ${formatCurrency(order.total)}`,
        "",
        "Thank you for ordering with us.",
    ].join("\n");
    const html = buildTemplate({
        title: "Order status update",
        preview: `Order ${order.referenceNumber}: ${order.status}`,
        body: `
            <p>Hello ${escapeHtml(order.fullName)},</p>
            <p>Your order status has been updated.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">
                ${row("Order reference", order.referenceNumber)}
                ${row("Status", order.status)}
                ${row("Payment method", order.paymentMethod)}
                ${row("Total", formatCurrency(order.total))}
            </table>
            <p>Thank you for ordering with us.</p>
        `,
    });

    return sendNotification({ to, subject, text, html });
};
