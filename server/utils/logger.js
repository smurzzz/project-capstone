/**
 * Centralized logging utility for consistent error and info logging.
 * Respects NODE_ENV to suppress verbose logging in production.
 */

const isDevelopment = process.env.NODE_ENV !== "production";

const logger = {
    /**
     * Log errors for debugging (development only)
     */
    error: (context, error) => {
        if (isDevelopment) {
            const errorMessage = error?.message || String(error);
            const errorStack = error?.stack;
            console.error(`[${context}] ${errorMessage}`);
            if (errorStack && isDevelopment) {
                console.error(errorStack);
            }
        }
    },

    /**
     * Log info messages (development only)
     */
    info: (message) => {
        if (isDevelopment) {
            console.log(`[INFO] ${message}`);
        }
    },

    /**
     * Log warnings (development only)
     */
    warn: (context, message) => {
        if (isDevelopment) {
            console.warn(`[${context}] ${message}`);
        }
    },

    /**
     * Always log critical server startup info (production and development)
     */
    startup: (message) => {
        console.log(`[SERVER] ${message}`);
    },
};

export default logger;
