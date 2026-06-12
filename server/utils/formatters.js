/**
 * Centralized formatting utilities for consistent text formatting across the application.
 * Handles HTML escaping, currency formatting, and date formatting.
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export const escapeHtml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

/**
 * Format amount as Philippine Peso currency
 */
export const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(Number(amount || 0));

/**
 * Format date as readable string (e.g., "January 15, 2024")
 * Returns "TBD" for invalid or missing dates
 */
export const formatDate = (value) => {
    if (!value) return "TBD";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "TBD";

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

/**
 * Format date and time as readable string (e.g., "January 15, 2024, 2:30 PM")
 * Returns "TBD" for invalid or missing dates
 */
export const formatDateTime = (value) => {
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
