import {
    sendAppointmentConfirmationEmail,
    sendAppointmentStatusEmail as sendAppointmentStatusNotification,
    sendOrderStatusUpdateEmail,
    sendReceiptEmail,
} from "./emailService.js";

export const sendOrderCreatedEmail = async (order) =>
    sendReceiptEmail({
        to: order?.email || order?.customerId?.contactInfo?.email || "",
        order,
        items: order?.items || [],
    });

export const sendOrderStatusEmail = async (order) =>
    sendOrderStatusUpdateEmail({
        to: order?.email || order?.customerId?.contactInfo?.email || "",
        order,
    });

export const sendAppointmentCreatedEmail = async (appointment) =>
    sendAppointmentConfirmationEmail({ appointment });

export const sendAppointmentStatusEmail = async (appointment) =>
    sendAppointmentStatusNotification({ appointment });
