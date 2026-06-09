import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import {
    cleanString,
    isValidEmail,
    isValidFutureDate,
    isValidPhone,
    isStaffRole,
    isValidObjectId,
    normalizeEmail,
} from "../utils/validation.js";
import {
    sendAppointmentCreatedEmail,
    sendAppointmentStatusEmail,
} from "../utils/notifications.js";

const ALL_SLOTS = [
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 1:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
    "4:00 PM - 5:00 PM",
];

const VALID_STATUSES = ["Scheduled", "Confirmed", "Completed", "Cancelled"];

const getDayRange = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { date, start, end };
};

const getAuthenticatedCustomer = async (user) => {
    if (user?.type !== "customer") {
        return null;
    }

    const account = await User.findById(user.id);
    if (!account) {
        return null;
    }

    let customer = account.customerId ? await Customer.findById(account.customerId) : null;
    if (!customer) {
        customer = await Customer.findOne({ "contactInfo.email": account.email });
    }

    if (customer && String(account.customerId || "") !== String(customer._id)) {
        account.customerId = customer._id;
        await account.save();
    }

    return customer;
};

const findOrCreateCustomer = async ({ req, contactInfo }) => {
    const authCustomer = await getAuthenticatedCustomer(req.user);
    if (authCustomer) {
        return authCustomer;
    }

    const name = cleanString(contactInfo?.name, 120);
    const email = normalizeEmail(contactInfo?.email);
    const phone = cleanString(contactInfo?.phone, 30);
    const address = cleanString(contactInfo?.address, 500);

    if (!name || !email || !phone) {
        return null;
    }

    const customer = await Customer.findOne({ "contactInfo.email": email });
    if (customer) {
        customer.name = name;
        customer.contactInfo.phone = phone;
        customer.contactInfo.address = address || customer.contactInfo.address;
        customer.updatedAt = new Date();
        await customer.save();
        return customer;
    }

    return Customer.create({
        name,
        contactInfo: { email, phone, address },
        role: "Guest",
    });
};

const canAccessAppointment = async (req, appointment) => {
    if (isStaffRole(req.user?.role)) {
        return true;
    }

    const customer = await getAuthenticatedCustomer(req.user);
    return Boolean(customer && String(customer._id) === String(appointment.customerId?._id || appointment.customerId));
};

/**
 * Get all appointments (Staff/Admin only)
 */
export const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate("customerId", "name contactInfo role")
            .sort({ date: 1, timeSlot: 1 });

        res.status(200).json({
            success: true,
            data: appointments,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID",
            });
        }

        const appointment = await Appointment.findById(req.params.id)
            .populate("customerId", "name contactInfo role");

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        if (!(await canAccessAppointment(req, appointment))) {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }

        res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get appointments by customer ID
 */
export const getAppointmentsByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!isValidObjectId(customerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }

        if (!isStaffRole(req.user?.role)) {
            const customer = await getAuthenticatedCustomer(req.user);
            if (!customer || String(customer._id) !== String(customerId)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }
        }

        const appointments = await Appointment.find({ customerId })
            .populate("customerId", "name contactInfo role")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: appointments,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get appointments for authenticated customer
 */
export const getMyAppointments = async (req, res) => {
    try {
        const customer = await getAuthenticatedCustomer(req.user);

        if (!customer) {
            return res.status(200).json({
                success: true,
                data: [],
            });
        }

        const appointments = await Appointment.find({ customerId: customer._id })
            .populate("customerId", "name contactInfo role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: appointments,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Create new appointment
 */
export const createAppointment = async (req, res) => {
    try {
        const { contactInfo } = req.body;
        const service = cleanString(req.body.service, 120);
        const timeSlot = cleanString(req.body.timeSlot, 60);
        const notes = cleanString(req.body.notes, 1000);
        const range = getDayRange(req.body.date);
        const submittedContactName = cleanString(contactInfo?.name, 120);
        const submittedContactEmail = normalizeEmail(contactInfo?.email);
        const submittedContactPhone = cleanString(contactInfo?.phone, 30);

        if (!range || !timeSlot || !service) {
            return res.status(400).json({
                success: false,
                message: "Date, time slot, and service are required",
            });
        }

        if (!isValidFutureDate(req.body.date)) {
            return res.status(400).json({
                success: false,
                message: "Appointment date cannot be in the past",
            });
        }

        if (!ALL_SLOTS.includes(timeSlot)) {
            return res.status(400).json({
                success: false,
                message: "Invalid time slot",
            });
        }

        if (submittedContactEmail && !isValidEmail(submittedContactEmail)) {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required",
            });
        }

        if (submittedContactPhone && !isValidPhone(submittedContactPhone)) {
            return res.status(400).json({
                success: false,
                message: "A valid phone number is required",
            });
        }

        const customer = await findOrCreateCustomer({ req, contactInfo });
        if (!customer) {
            return res.status(400).json({
                success: false,
                message: "Contact name, email, and phone are required",
            });
        }

        const appointmentContactName = submittedContactName || customer.name;
        const appointmentContactEmail = submittedContactEmail || customer.contactInfo?.email;
        const appointmentContactPhone = submittedContactPhone || customer.contactInfo?.phone;

        if (!appointmentContactName || !appointmentContactEmail || !appointmentContactPhone) {
            return res.status(400).json({
                success: false,
                message: "Contact name, email, and phone are required",
            });
        }

        const existingAppointment = await Appointment.findOne({
            date: { $gte: range.start, $lte: range.end },
            timeSlot,
            status: { $ne: "Cancelled" },
        });

        if (existingAppointment) {
            return res.status(400).json({
                success: false,
                message: "Time slot already booked",
            });
        }

        const newAppointment = await Appointment.create({
            customerId: customer._id,
            service,
            date: range.start,
            timeSlot,
            notes,
            contactInfo: {
                name: appointmentContactName,
                email: appointmentContactEmail,
                phone: appointmentContactPhone,
            },
            status: "Scheduled",
        });

        await sendAppointmentCreatedEmail(
            { ...newAppointment.toObject(), customerId: customer },
            customer
        );

        return res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            data: newAppointment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Update appointment
 */
export const updateAppointment = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID",
            });
        }

        const range = req.body.date ? getDayRange(req.body.date) : null;
        const timeSlot = cleanString(req.body.timeSlot, 60);
        const status = cleanString(req.body.status, 30);
        const notes = cleanString(req.body.notes, 1000);

        if (status && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        const existingAppointment = await Appointment.findById(req.params.id)
            .populate("customerId", "name contactInfo role");

        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        const update = {
            notes,
            updatedAt: new Date(),
        };

        if (range) update.date = range.start;
        if (timeSlot) update.timeSlot = timeSlot;
        if (status) update.status = status;

        const appointment = await Appointment.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
        }).populate("customerId", "name contactInfo emailPreferences role");

        if (status && existingAppointment.status !== status) {
            await sendAppointmentStatusEmail(appointment, appointment.customerId);
        }

        res.status(200).json({
            success: true,
            message: "Appointment updated successfully",
            data: appointment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (req, res) => {
    try {
        const status = cleanString(req.body.status, 30);

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID",
            });
        }

        const existingAppointment = await Appointment.findById(req.params.id);
        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                status,
                updatedAt: new Date(),
            },
            { new: true, runValidators: true }
        ).populate("customerId", "name contactInfo emailPreferences");

        if (existingAppointment.status !== status) {
            await sendAppointmentStatusEmail(appointment, appointment.customerId);
        }

        res.status(200).json({
            success: true,
            message: "Appointment status updated successfully",
            data: appointment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Delete appointment
 */
export const deleteAppointment = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID",
            });
        }

        const appointment = await Appointment.findByIdAndDelete(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Appointment deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get available time slots for a date
 */
export const getAvailableSlots = async (req, res) => {
    try {
        const range = getDayRange(req.query.date);

        if (!range) {
            return res.status(400).json({
                success: false,
                message: "Valid date query parameter is required",
            });
        }

        const bookedAppointments = await Appointment.find({
            date: {
                $gte: range.start,
                $lte: range.end,
            },
            status: { $ne: "Cancelled" },
        });

        const bookedSlots = bookedAppointments.map((appointment) => appointment.timeSlot);
        const availableSlots = ALL_SLOTS.filter((slot) => !bookedSlots.includes(slot));

        res.status(200).json({
            success: true,
            data: availableSlots,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get appointment statistics (Dashboard)
 */
export const getAppointmentStats = async (req, res) => {
    try {
        const [
            totalAppointments,
            scheduledAppointments,
            confirmedAppointments,
            completedAppointments,
        ] = await Promise.all([
            Appointment.countDocuments(),
            Appointment.countDocuments({ status: "Scheduled" }),
            Appointment.countDocuments({ status: "Confirmed" }),
            Appointment.countDocuments({ status: "Completed" }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalAppointments,
                scheduledAppointments,
                confirmedAppointments,
                completedAppointments,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
