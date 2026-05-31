import {
    isRedisConfigured,
    redisGet,
    redisGetJson,
    redisIncr,
    redisSetJson,
} from "./redisStore.js";

const memoryCache = new Map();
const memoryVersions = new Map();

const getMemoryVersion = (namespace) => memoryVersions.get(namespace) || 1;

export const getCacheVersion = async (namespace) => {
    if (!isRedisConfigured()) {
        return getMemoryVersion(namespace);
    }

    try {
        return Number(await redisGet(`cache-version:${namespace}`)) || 1;
    } catch {
        return getMemoryVersion(namespace);
    }
};

export const getJsonCache = async (key) => {
    if (isRedisConfigured()) {
        try {
            return await redisGetJson(key);
        } catch {
            return null;
        }
    }

    const cached = memoryCache.get(key);
    if (!cached || cached.expiresAt <= Date.now()) {
        memoryCache.delete(key);
        return null;
    }

    return cached.value;
};

export const setJsonCache = async (key, value, ttlSeconds = 30) => {
    if (isRedisConfigured()) {
        try {
            await redisSetJson(key, value, ttlSeconds);
            return;
        } catch {
            // Memory fallback below.
        }
    }

    memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });
};

export const bumpCacheVersion = async (namespace) => {
    memoryVersions.set(namespace, getMemoryVersion(namespace) + 1);

    if (isRedisConfigured()) {
        try {
            await redisIncr(`cache-version:${namespace}`);
        } catch {
            // Local version was already bumped.
        }
    }
};
