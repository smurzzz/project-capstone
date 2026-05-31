import nodemailer from "nodemailer";

const parseBoolean = (value) => String(value || "").trim().toLowerCase() === "true";
const parseNumber = (value, fallback) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
};

let transporterPromise = null;
let missingConfigLogged = false;

const hasMailerConfig = () =>
    Boolean(process.env.SMTP_USER && process.env.SMTP_PASS) &&
    Boolean(
        process.env.SMTP_SERVICE ||
        (process.env.SMTP_HOST && process.env.SMTP_PORT)
    );

const createTransporter = async () => {
    if (!hasMailerConfig()) {
        if (!missingConfigLogged) {
            missingConfigLogged = true;
            console.warn("Email notifications are disabled. SMTP configuration is missing.");
        }

        return null;
    }

    if (process.env.SMTP_SERVICE) {
        return nodemailer.createTransport({
            service: process.env.SMTP_SERVICE,
            connectionTimeout: parseNumber(process.env.SMTP_CONNECTION_TIMEOUT_MS, 10_000),
            greetingTimeout: parseNumber(process.env.SMTP_GREETING_TIMEOUT_MS, 10_000),
            socketTimeout: parseNumber(process.env.SMTP_SOCKET_TIMEOUT_MS, 20_000),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    const port = Number(process.env.SMTP_PORT || 587);

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: parseBoolean(process.env.SMTP_SECURE) || port === 465,
        connectionTimeout: parseNumber(process.env.SMTP_CONNECTION_TIMEOUT_MS, 10_000),
        greetingTimeout: parseNumber(process.env.SMTP_GREETING_TIMEOUT_MS, 10_000),
        socketTimeout: parseNumber(process.env.SMTP_SOCKET_TIMEOUT_MS, 20_000),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const getTransporter = async () => {
    if (!transporterPromise) {
        transporterPromise = createTransporter();
    }

    return transporterPromise;
};

export const sendEmail = async ({ to, subject, text, html }) => {
    const recipients = Array.isArray(to)
        ? to.filter(Boolean)
        : String(to || "").trim();

    if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
        return false;
    }

    const transporter = await getTransporter();
    if (!transporter) {
        return false;
    }

    const from = process.env.MAIL_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
        from,
        to: recipients,
        subject: String(subject || "JBM Electro notification").slice(0, 200),
        text: text || "",
        html: html || undefined,
    });

    return true;
};

export const resetMailerTransporter = () => {
    transporterPromise = null;
    missingConfigLogged = false;
};
