import nodemailer from "nodemailer";

const parseBoolean = (value) => String(value || "").trim().toLowerCase() === "true";
const parseNumber = (value, fallback) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
};

let transporterPromise = null;
let missingConfigLogged = false;
let testAccount = null;

const getMailUser = () => String(process.env.EMAIL_USER || process.env.SMTP_USER || "").trim();
const getMailPass = () => String(process.env.EMAIL_PASS || process.env.SMTP_PASS || "").replace(/\s+/g, "");

const hasMailerConfig = () =>
    Boolean(getMailUser() && getMailPass());

const createTestTransporter = async () => {
    if (process.env.NODE_ENV === "production") {
        return null;
    }

    if (!testAccount) {
        testAccount = await nodemailer.createTestAccount();
    }

    if (!missingConfigLogged) {
        missingConfigLogged = true;
        console.warn("SMTP settings are missing. Using Nodemailer Ethereal test account for local development.");
        console.warn(`Ethereal account user=${testAccount.user}, pass=${testAccount.pass}`);
    }

    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};

const createTransporter = async () => {
    if (!hasMailerConfig()) {
        return createTestTransporter();
    }

    const mailUser = getMailUser();
    const mailPass = getMailPass();
    const service = process.env.EMAIL_SERVICE || process.env.SMTP_SERVICE || "gmail";
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = parseBoolean(process.env.SMTP_SECURE) || port === 465;
    const smtpHost = String(process.env.SMTP_HOST || "").trim();

    const transportOptions = {
        auth: {
            user: mailUser,
            pass: mailPass,
        },
        connectionTimeout: parseNumber(process.env.SMTP_CONNECTION_TIMEOUT_MS, 10_000),
        greetingTimeout: parseNumber(process.env.SMTP_GREETING_TIMEOUT_MS, 10_000),
        socketTimeout: parseNumber(process.env.SMTP_SOCKET_TIMEOUT_MS, 20_000),
        port,
        secure,
    };

    if (smtpHost) {
        transportOptions.host = smtpHost;
        transportOptions.tls = {
            rejectUnauthorized: false,
        };
        if (process.env.NODE_ENV !== "production") {
            console.log(`Creating custom SMTP transporter: host=${smtpHost}:${port}, secure=${secure}`);
        }
    } else {
        transportOptions.service = service;
        if (process.env.NODE_ENV !== "production") {
            console.log(`Creating email transporter: service=${service}, user=${mailUser}, port=${port}, secure=${secure}`);
        }
    }

    return nodemailer.createTransport(transportOptions);
};

const getTransporter = async () => {
    if (!transporterPromise) {
        transporterPromise = createTransporter();
    }

    try {
        return await transporterPromise;
    } catch (error) {
        transporterPromise = null;
        throw error;
    }
};

export const sendEmail = async ({ to, subject, text, html }) => {
    const recipients = Array.isArray(to)
        ? to.filter(Boolean)
        : String(to || "").trim();

    if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
        console.warn("No recipients provided for email");
        return false;
    }

    const transporter = await getTransporter();
    if (!transporter) {
        console.warn("Email transporter not available - SMTP config missing");
        return false;
    }

    const from = process.env.MAIL_FROM || process.env.EMAIL_FROM || getMailUser();

    try {
        if (process.env.NODE_ENV !== "production") {
            console.log(`Sending email to ${recipients} with subject: ${subject}`);
        }
        const info = await transporter.sendMail({
            from,
            to: recipients,
            subject: String(subject || "JBM Electro notification").slice(0, 200),
            text: text || "",
            html: html || undefined,
        });

        if (process.env.NODE_ENV !== "production") {
            console.log(`Email sent successfully to ${recipients}`);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`Preview URL: ${previewUrl}`);
            }
        }
        return true;
    } catch (error) {
        console.error(`Failed to send email to ${recipients}:`, error.message);
        console.error("Error details:", error);
        transporterPromise = null;
        return false;
    }
};


export const resetMailerTransporter = () => {
    transporterPromise = null;
    missingConfigLogged = false;
};
