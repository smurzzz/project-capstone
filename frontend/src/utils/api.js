import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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
    loginStaff: (email, password) =>
        api.post("/auth/staff/login", { email, password })
};

// PRODUCTS APIs
export const productsAPI = {
    getAll: () => api.get("/products"),
    getById: (id) => api.get(`/products/${id}`),
    create: (productData) => api.post("/products", productData),
    update: (id, productData) => api.put(`/products/${id}`, productData),
    delete: (id) => api.delete(`/products/${id}`),
    getLowStock: (threshold = 10) => api.get(`/products/low-stock?threshold=${threshold}`),
    updateStock: (productId, quantity) => api.post("/products/update-stock", { productId, quantity })
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

// CUSTOMERS APIs
export const customersAPI = {
    getMe: () => api.get("/customers/me"),
    updateMe: (customerData) => api.put("/customers/me", customerData),
    getAll: () => api.get("/customers"),
    getById: (id) => api.get(`/customers/${id}`),
    getByEmail: (email) => api.get(`/customers/email/${email}`),
    create: (customerData) => api.post("/customers", customerData),
    update: (id, customerData) => api.put(`/customers/${id}`, customerData),
    delete: (id) => api.delete(`/customers/${id}`),
    getStats: () => api.get("/customers/stats")
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
