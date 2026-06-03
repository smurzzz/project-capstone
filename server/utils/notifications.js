import {
    sendAppointmentConfirmationEmail,
    sendAppointmentStatusEmail as sendAppointmentStatusNotification,
    sendOrderStatusUpdateEmail,
    sendReceiptEmail,
} from "./emailService.js";

const shouldSendEmail = (customer, emailType) => {
    if (!customer?.emailPreferences?.enabled) return false;
    return customer.emailPreferences[emailType] !== false;
};

export const sendOrderCreatedEmail = async (order, customer) => {
    if (customer && !shouldSendEmail(customer, "orders")) {
        return false;
    }
    return sendReceiptEmail({
        to: order?.email || order?.customerId?.contactInfo?.email || "",
        order,
        items: order?.items || [],
    });
};

export const sendOrderStatusEmail = async (order, customer) => {
    if (customer && !shouldSendEmail(customer, "orders")) {
        return false;
    }
    return sendOrderStatusUpdateEmail({
        to: order?.email || order?.customerId?.contactInfo?.email || "",
        order,
    });
};

export const sendAppointmentCreatedEmail = async (appointment, customer) => {
    if (customer && !shouldSendEmail(customer, "appointments")) {
        return false;
    }
    return sendAppointmentConfirmationEmail({ appointment });
};

export const sendAppointmentStatusEmail = async (appointment, customer) => {
    if (customer && !shouldSendEmail(customer, "appointments")) {
        return false;
    }
    return sendAppointmentStatusNotification({ appointment });
};
