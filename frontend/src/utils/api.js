import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const GET_CACHE_TTL_MS = 30_000;
const getCache = new Map();

const buildQueryString = (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, String(value));
        }
    });

    const value = query.toString();
    return value ? `?${value}` : "";
};

const cachedGet = (url, config) => {
    const cacheKey = `${url}:${JSON.stringify(config || {})}`;
    const cached = getCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
        return cached.promise;
    }

    const promise = api.get(url, config).catch((error) => {
        getCache.delete(cacheKey);
        throw error;
    });

    getCache.set(cacheKey, {
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
        promise,
    });

    return promise;
};

const clearApiCache = () => {
    getCache.clear();
};

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("pos-token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("pos-user");
            localStorage.removeItem("pos-token");
        }
        return Promise.reject(error);
    }
);

// AUTH APIs
export const authAPI = {
    loginCustomer: (email, password) =>
        api.post("/auth/customer/login", { email, password }),
    registerCustomer: (customerData) =>
        api.post("/auth/customer/register", customerData),
    googleCustomer: (credential) =>
        api.post("/auth/google/customer", { credential }),
    requestOtp: (email) =>
        api.post("/auth/otp/request", { email }),
    verifyOtp: (email, otp) =>
        api.post("/auth/otp/verify", { email, otp }),
    requestPasswordReset: (email) =>
        api.post("/auth/password/forgot", { email }),
    resetPassword: ({ email, token, password }) =>
        api.post("/auth/password/reset", { email, token, password }),
    loginStaff: (email, password) =>
        api.post("/auth/staff/login", { email, password }),
    getSession: () => api.get("/auth/session")
};

// PRODUCTS APIs
export const productsAPI = {
    getAll: (params) => cachedGet(`/products${buildQueryString(params)}`),
    getById: (id) => api.get(`/products/${id}`),
    create: (productData) => api.post("/products", productData).finally(clearApiCache),
    update: (id, productData) => api.put(`/products/${id}`, productData).finally(clearApiCache),
    delete: (id) => api.delete(`/products/${id}`).finally(clearApiCache),
    getLowStock: (threshold = 10) => cachedGet(`/products/low-stock?threshold=${threshold}`),
    updateStock: (productId, quantity, reason = "") =>
        api.post("/products/update-stock", { productId, quantity, reason }).finally(clearApiCache),
    getMovements: (id, limit = 50) => cachedGet(`/products/${id}/movements?limit=${limit}`)
};

// PACKAGE DEAL APIs
export const packagesAPI = {
    getAll: (includeInactive = false) =>
        api.get(`/packages${includeInactive ? "?includeInactive=true" : ""}`),
    getById: (id) => api.get(`/packages/${id}`),
    create: (packageData) => api.post("/packages", packageData),
    update: (id, packageData) => api.put(`/packages/${id}`, packageData),
    delete: (id) => api.delete(`/packages/${id}`)
};

// PROMOTIONS APIs
export const promotionsAPI = {
    getAll: (includeInactive = false) =>
        api.get(`/promotions${includeInactive ? "?includeInactive=true" : ""}`),
    create: (promotionData) => api.post("/promotions", promotionData),
    update: (id, promotionData) => api.put(`/promotions/${id}`, promotionData),
    delete: (id) => api.delete(`/promotions/${id}`),
    getStats: () => api.get("/promotions/stats")
};

// CUSTOMERS APIs
export const customersAPI = {
    getMe: () => api.get("/customers/me"),
    updateMe: (customerData) => api.put("/customers/me", customerData),
    getEmailPreferences: () => api.get("/customers/me/email-preferences"),
    updateEmailPreferences: (preferences) => api.put("/customers/me/email-preferences", preferences),
    getAll: () => api.get("/customers"),
    getById: (id) => api.get(`/customers/${id}`),
    getByEmail: (email) => api.get(`/customers/email/${email}`),
    create: (customerData) => api.post("/customers", customerData),
    update: (id, customerData) => api.put(`/customers/${id}`, customerData),
    delete: (id) => api.delete(`/customers/${id}`),
    getStats: () => api.get("/customers/stats"),
    updateMembership: (id, membershipData) => api.put(`/customers/${id}/membership`, membershipData),
    getMembershipHistory: (id, limit = 50) =>
        api.get(`/customers/${id}/membership/history?limit=${limit}`)
};

// MEMBERSHIP APIs
export const membershipAPI = {
    // Customer endpoints
    applyForMembership: (applicationData) => {
        const jsonData = { ...applicationData };
        delete jsonData.idFile;
        return api.post('/memberships/apply', jsonData);
    },
    getMyMembership: () => api.get('/memberships/me'),
    getApplicationStatus: () => api.get('/memberships/me/status'),
    getMembershipBenefits: (tier) => api.get(`/memberships/benefits/${tier}`),
    getMyMembershipHistory: () => api.get('/memberships/me/history'),
    renewMembership: (membshipData) => api.post('/memberships/renew', membshipData),
    
    // Admin endpoints
    getAllApplications: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        return api.get(`/memberships/applications?${params.toString()}`);
    },
    getApplicationById: (applicationId) => api.get(`/memberships/applications/${applicationId}`),
    approveApplication: (applicationId, data) => 
        api.post(`/memberships/applications/${applicationId}/approve`, data),
    rejectApplication: (applicationId, data) => 
        api.post(`/memberships/applications/${applicationId}/reject`, data),
    getCustomerMembership: (customerId) => api.get(`/memberships/customer/${customerId}`),
    updateMembershipTier: (customerId, tierData) => 
        api.put(`/memberships/customer/${customerId}/tier`, tierData),
    renewMembershipAdmin: (customerId, renewalData) => 
        api.post(`/memberships/customer/${customerId}/renew`, renewalData),
    suspendMembership: (customerId, data) => 
        api.post(`/memberships/customer/${customerId}/suspend`, data),
    getMembershipStats: () => api.get('/memberships/stats')
};

// ORDERS APIs
export const ordersAPI = {
    getAll: () => api.get("/orders"),
    getById: (id) => api.get(`/orders/${id}`),
    getByCustomer: (customerId) => api.get(`/orders/customer/${customerId}`),
    create: (orderData) => api.post("/orders", orderData),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
    cancel: (id) => api.put(`/orders/${id}/cancel`, {}),
    getStats: () => api.get("/orders/stats")
};

// EMAIL APIs
export const mailAPI = {
    sendAdminNotification: ({ to, subject, title, message, details }) =>
        api.post("/mail/admin-notification", { to, subject, title, message, details }),
    sendOrderReceipt: (orderId, to) =>
        api.post(`/mail/orders/${orderId}/receipt`, { to })
};

// APPOINTMENTS APIs
export const appointmentsAPI = {
    getAll: () => api.get('/appointments'),
    getById: (id) => api.get(`/appointments/${id}`),
    getByCustomer: (customerId) => api.get(`/appointments/customer/${customerId}`),
    getMyAppointments: () => api.get('/appointments/my-appointments'),
    create: (data) => api.post('/appointments', data),
    update: (id, data) => api.put(`/appointments/${id}`, data),
    updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),
    delete: (id) => api.delete(`/appointments/${id}`),
    getAvailableSlots: (date) => api.get(`/appointments/available-slots?date=${encodeURIComponent(date)}`),
    getStats: () => api.get('/appointments/stats')
};

// STAFF APIs
export const staffAPI = {
    getAll: () => api.get("/staff"),
    getById: (id) => api.get(`/staff/${id}`),
    create: (staffData) => api.post("/staff", staffData),
    update: (id, staffData) => api.put(`/staff/${id}`, staffData),
    updatePassword: (id, oldPassword, newPassword) =>
        api.put(`/staff/${id}/password`, { oldPassword, newPassword }),
    delete: (id) => api.delete(`/staff/${id}`),
    deactivate: (id) => api.put(`/staff/${id}/deactivate`, {}),
    getStats: () => api.get("/staff/stats")
};

// REPORTS APIs
export const reportsAPI = {
    getOverview: ({ period = "monthly", offset = 0, date } = {}) => {
        const params = new URLSearchParams({
            period,
            offset: String(offset),
        });

        if (date) {
            params.set("date", date);
        }

        return api.get(`/reports/overview?${params.toString()}`);
    }
};

export default api;
