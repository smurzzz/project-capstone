/**
 * Consistent error response handler for controllers.
 * Centralizes error logging and response formatting.
 */
import logger from "./logger.js";

const sendErrorResponse = (res, statusCode, message, details = null) => {
    const response = { success: false, message };
    if (details) {
        response.details = details;
    }
    res.status(statusCode).json(response);
};

const handleControllerError = (res, error, context, defaultStatusCode = 500, defaultMessage = "Operation failed") => {
    const statusCode = error.statusCode || defaultStatusCode;
    const message = error.message || defaultMessage;
    
    logger.error(context, error);
    sendErrorResponse(res, statusCode, message);
};

export { sendErrorResponse, handleControllerError };
