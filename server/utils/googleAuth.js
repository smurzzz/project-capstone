import { createPublicKey, createVerify } from "crypto";

const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

let cachedKeys = {
    expiresAt: 0,
    keys: new Map(),
};

const decodeBase64Url = (value) => {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(normalized + padding, "base64");
};

const decodeJwtPart = (value) => {
    try {
        return JSON.parse(decodeBase64Url(value).toString("utf8"));
    } catch (error) {
        throw Object.assign(new Error("Invalid Google credential"), { statusCode: 401 });
    }
};

const getMaxAgeMs = (cacheControl) => {
    const match = /max-age=(\d+)/i.exec(cacheControl || "");
    return match ? Number(match[1]) * 1000 : 60 * 60 * 1000;
};

const fetchGoogleKeys = async () => {
    if (cachedKeys.expiresAt > Date.now() && cachedKeys.keys.size > 0) {
        return cachedKeys.keys;
    }

    if (typeof fetch !== "function") {
        throw Object.assign(new Error("Google auth requires a Node runtime with fetch support"), {
            statusCode: 500,
        });
    }

    const response = await fetch(GOOGLE_CERTS_URL);
    if (!response.ok) {
        throw Object.assign(new Error("Unable to verify Google credential right now"), {
            statusCode: 503,
        });
    }

    const payload = await response.json();
    const keys = new Map((payload.keys || []).map((key) => [key.kid, key]));

    cachedKeys = {
        expiresAt: Date.now() + getMaxAgeMs(response.headers.get("cache-control")),
        keys,
    };

    return keys;
};

const assertAudience = (audience, clientId) => {
    if (Array.isArray(audience)) {
        return audience.includes(clientId);
    }

    return audience === clientId;
};

export const verifyGoogleIdToken = async (credential) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
        throw Object.assign(new Error("Google authentication is not configured on the server"), {
            statusCode: 500,
        });
    }

    const parts = String(credential || "").split(".");
    if (parts.length !== 3) {
        throw Object.assign(new Error("Invalid Google credential"), { statusCode: 401 });
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = decodeJwtPart(encodedHeader);
    const payload = decodeJwtPart(encodedPayload);

    if (header.alg !== "RS256" || !header.kid) {
        throw Object.assign(new Error("Invalid Google credential"), { statusCode: 401 });
    }

    const keys = await fetchGoogleKeys();
    const jwk = keys.get(header.kid);

    if (!jwk) {
        cachedKeys = { expiresAt: 0, keys: new Map() };
        throw Object.assign(new Error("Google credential key was not recognized"), {
            statusCode: 401,
        });
    }

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    verifier.end();

    const verified = verifier.verify(
        createPublicKey({ key: jwk, format: "jwk" }),
        decodeBase64Url(encodedSignature)
    );

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (
        !verified ||
        !GOOGLE_ISSUERS.has(payload.iss) ||
        !assertAudience(payload.aud, clientId) ||
        Number(payload.exp || 0) < nowSeconds ||
        !payload.sub ||
        !payload.email
    ) {
        throw Object.assign(new Error("Invalid Google credential"), { statusCode: 401 });
    }

    if (payload.email_verified !== true && payload.email_verified !== "true") {
        throw Object.assign(new Error("Google email is not verified"), { statusCode: 401 });
    }

    return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        picture: payload.picture || "",
    };
};
