import nodemailer from "nodemailer";

const parseBoolean = (value) => String(value || "").trim().toLowerCase() === "true";
const parseNumber = (value, fallback) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
};

let transporterPromise = null;
let missingConfigLogged = false;

const getMailUser = () => process.env.EMAIL_USER || process.env.SMTP_USER;
const getMailPass = () => process.env.EMAIL_PASS || process.env.SMTP_PASS;

const hasMailerConfig = () =>
    Boolean(getMailUser() && getMailPass());

const createTransporter = async () => {
    if (!hasMailerConfig()) {
        if (!missingConfigLogged) {
            missingConfigLogged = true;
            console.warn("Email notifications are disabled. SMTP configuration is missing.");
        }

        return null;
    }

    const mailUser = getMailUser();
    const mailPass = getMailPass();
    const service = process.env.EMAIL_SERVICE || process.env.SMTP_SERVICE || "gmail";

    if (service) {
        return nodemailer.createTransport({
            service,
            connectionTimeout: parseNumber(process.env.SMTP_CONNECTION_TIMEOUT_MS, 10_000),
            greetingTimeout: parseNumber(process.env.SMTP_GREETING_TIMEOUT_MS, 10_000),
            socketTimeout: parseNumber(process.env.SMTP_SOCKET_TIMEOUT_MS, 20_000),
            auth: {
                user: mailUser,
                pass: mailPass,
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
            user: mailUser,
            pass: mailPass,
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

    const from = process.env.MAIL_FROM || process.env.EMAIL_FROM || getMailUser();

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
