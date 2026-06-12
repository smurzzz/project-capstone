import { useState, useEffect } from "react";
import { toast } from "sonner";
import { customersAPI } from "../../utils/api.js";

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        contactInfo: {
            email: "",
            phone: "",
            address: ""
        },
        role: "Member"
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    async function fetchCustomers() {
        try {
            const response = await customersAPI.getAll();
            setCustomers(response.data.data);
        } catch {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("contact_")) {
            const field = name.replace("contact_", "");
            setFormData(prev => ({
                ...prev,
                contactInfo: {
                    ...prev.contactInfo,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await customersAPI.update(editingId, formData);
            } else {
                await customersAPI.create(formData);
            }
            fetchCustomers();
            setFormData({
                name: "",
                contactInfo: { email: "", phone: "", address: "" },
                role: "Member"
            });
            setShowForm(false);
            setEditingId(null);
        } catch {
            toast.error('Failed to save customer');
        }
    };

    const handleEdit = (customer) => {
        setFormData(customer);
        setEditingId(customer._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this customer?")) {
            try {
                await customersAPI.delete(id);
                fetchCustomers();
            } catch {
                toast.error('Failed to delete customer');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>Customers Management</h1>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setFormData({
                            name: "",
                            contactInfo: { email: "", phone: "", address: "" },
                            role: "Member"
                        });
                    }}
                    style={styles.addButton}
                >
                    {showForm ? "Cancel" : "+ Add Customer"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Customer Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    />
                    <input
                        type="email"
                        name="contact_email"
                        placeholder="Email"
                        value={formData.contactInfo.email}
                        onChange={handleInputChange}
                        required
                    />
                    <input
                        type="tel"
                        name="contact_phone"
                        placeholder="Phone"
                        value={formData.contactInfo.phone}
                        onChange={handleInputChange}
                        required
                    />
                    <input
                        type="text"
                        name="contact_address"
                        placeholder="Address"
                        value={formData.contactInfo.address}
                        onChange={handleInputChange}
                    />
                    <select name="role" value={formData.role || "Member"} onChange={handleInputChange}>
                        <option value="Member">Member</option>
                        <option value="Guest">Guest</option>
                    </select>
                    <button type="submit" style={styles.submitButton}>
                        {editingId ? "Update" : "Create"} Customer
                    </button>
                </form>
            )}

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((customer) => (
                        <tr key={customer._id}>
                            <td>{customer.name}</td>
                            <td>{customer.contactInfo.email}</td>
                            <td>{customer.contactInfo.phone}</td>
                            <td>{customer.contactInfo.address || "-"}</td>
                            <td>{customer.role || "Member"}</td>
                            <td>
                                <button
                                    onClick={() => handleEdit(customer)}
                                    style={styles.editBtn}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(customer._id)}
                                    style={styles.deleteBtn}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const styles = {
    container: {
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
    },
    addButton: {
        padding: "10px 20px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
    },
    form: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "10px"
    },
    submitButton: {
        padding: "10px 20px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        gridColumn: "1 / -1"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "white",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    },
    editBtn: {
        padding: "5px 10px",
        backgroundColor: "#ffc107",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        marginRight: "5px"
    },
    deleteBtn: {
        padding: "5px 10px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
    }
};
