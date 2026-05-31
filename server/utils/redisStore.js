import net from "net";
import tls from "tls";

const DEFAULT_REDIS_TIMEOUT_MS = 2_000;

const encodeCommand = (parts) =>
    `*${parts.length}\r\n${parts.map((part) => {
        const value = String(part);
        return `$${Buffer.byteLength(value)}\r\n${value}\r\n`;
    }).join("")}`;

const parseRedisValue = (buffer) => {
    const text = buffer.toString("utf8");
    const type = text[0];

    if (type === "+") {
        return text.slice(1, text.indexOf("\r\n"));
    }

    if (type === ":") {
        return Number(text.slice(1, text.indexOf("\r\n")));
    }

    if (type === "$") {
        const firstLineEnd = text.indexOf("\r\n");
        const length = Number(text.slice(1, firstLineEnd));
        if (length < 0) return null;
        return text.slice(firstLineEnd + 2, firstLineEnd + 2 + length);
    }

    if (type === "-") {
        throw new Error(text.slice(1, text.indexOf("\r\n")));
    }

    return null;
};

const getRedisConfig = () => {
    const url = process.env.REDIS_URL;
    if (!url) {
        return null;
    }

    const parsed = new URL(url);
    return {
        host: parsed.hostname,
        port: Number(parsed.port || 6379),
        password: parsed.password ? decodeURIComponent(parsed.password) : "",
        database: parsed.pathname ? parsed.pathname.replace("/", "") : "",
        tls: parsed.protocol === "rediss:",
    };
};

const sendRawCommand = (parts) => new Promise((resolve, reject) => {
    const config = getRedisConfig();
    if (!config) {
        reject(new Error("Redis is not configured"));
        return;
    }

    const socket = config.tls
        ? tls.connect({ host: config.host, port: config.port, servername: config.host })
        : net.createConnection({ host: config.host, port: config.port });
    const chunks = [];
    const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error("Redis command timed out"));
    }, Number(process.env.REDIS_TIMEOUT_MS || DEFAULT_REDIS_TIMEOUT_MS));

    const commands = [];
    if (config.password) {
        commands.push(["AUTH", config.password]);
    }
    if (config.database) {
        commands.push(["SELECT", config.database]);
    }
    commands.push(parts);

    socket.on("connect", () => {
        socket.write(commands.map(encodeCommand).join(""));
    });

    socket.on("data", (chunk) => {
        chunks.push(chunk);
    });

    socket.on("end", () => {
        clearTimeout(timeout);
        try {
            const payload = Buffer.concat(chunks);
            const responses = payload.toString("utf8").split(/(?=[+:\-$])/g).filter(Boolean);
            resolve(parseRedisValue(Buffer.from(responses.at(-1) || "")));
        } catch (error) {
            reject(error);
        }
    });

    socket.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
    });
});

export const isRedisConfigured = () => Boolean(process.env.REDIS_URL);

export const redisIncrWithTtl = async (key, ttlMs) => {
    const count = await sendRawCommand(["INCR", key]);
    if (count === 1) {
        await sendRawCommand(["PEXPIRE", key, ttlMs]);
    }
    return count;
};

export const redisGetJson = async (key) => {
    const value = await sendRawCommand(["GET", key]);
    return value ? JSON.parse(value) : null;
};

export const redisSetJson = async (key, value, ttlSeconds) =>
    sendRawCommand(["SET", key, JSON.stringify(value), "EX", ttlSeconds]);

export const redisIncr = (key) => sendRawCommand(["INCR", key]);

export const redisGet = (key) => sendRawCommand(["GET", key]);
