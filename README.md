# Complete E-Commerce Management System

A comprehensive e-commerce management system with customer, inventory, order, appointment, and commission management features.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

#### Backend Setup
```bash
cd server
npm install
# Create .env file with your configuration
npm start
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📋 Features

### Customer Management
- Register and manage customer accounts
- Store contact information
- Track customer orders and appointments

### Inventory Management
- Add, update, delete products
- Track stock levels
- Get alerts for low stock items
- Organize products by category

### Order Management
- Create orders from registered customers or guests
- Track order status (Pending, Confirmed, Completed, Cancelled)
- View order items and details
- Calculate totals automatically
- Support for multiple payment methods

### Appointment Booking
- Schedule customer appointments
- Check available time slots
- Manage appointment status
- Add notes to appointments

### Commission System
- Calculate cashback for registered customers
- Track commission earnings
- Apply/redeem commissions
- View commission history

### Staff Management
- Create and manage admin/staff accounts
- Assign roles and departments
- Password management
- Deactivate accounts

### Authentication & Authorization
- Role-based access control (Admin, Staff, Customer)
- JWT token authentication
- Secure password hashing
- Login for both customers and staff

## 🗄️ Database Schema

### Collections

**Customer**
- _id (ObjectId)
- name (String)
- contactInfo (Object with email, phone, address)
- createdAt, updatedAt

**Product**
- _id (ObjectId)
- productName (String)
- stockLevel (Number)
- price (Number)
- description (String)
- category (String)
- createdAt, updatedAt

**Order**
- _id (ObjectId)
- customerId (ObjectId, FK, nullable)
- fullName, contactNumber, address
- paymentMethod (enum)
- referenceNumber
- total (Number)
- status (enum: Pending, Confirmed, Completed, Cancelled)
- createdAt, updatedAt

**OrderItem**
- _id (ObjectId)
- orderId (ObjectId, FK)
- productId (ObjectId, FK)
- productName, price (snapshot)
- quantity, subtotal
- createdAt

**Commission**
- _id (ObjectId)
- orderId (ObjectId, FK, unique)
- customerId (ObjectId, FK)
- amount, percentage
- isApplied (Boolean)
- createdAt

**Appointment**
- _id (ObjectId)
- customerId (ObjectId, FK)
- date, timeSlot
- status (enum)
- notes
- createdAt, updatedAt

**Staff**
- _id (ObjectId)
- name, email, password
- role (enum: Admin, Staff)
- phone, department
- isActive (Boolean)
- createdAt, updatedAt

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/customer/login` - Customer login
- `POST /api/auth/customer/register` - Customer registration
- `POST /api/auth/staff/login` - Staff login

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/cancel` - Cancel order

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer by ID
    - `PUT /api/customers/:id` - Update customer
    - `DELETE /api/customers/:id` - Delete customer

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/available-slots?date=YYYY-MM-DD` - Get available slots
- `PUT /api/appointments/:id/status` - Update status

### Commissions
- `GET /api/commissions` - Get all commissions
- `POST /api/commissions` - Create commission
- `PUT /api/commissions/:id/apply` - Apply commission
- `GET /api/commissions/customer/:id` - Get customer commissions

## 🛠️ Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (Authentication)
- Bcrypt (Password Hashing)
- CORS
- Dotenv

### Frontend
- React
- Vite
- React Router
- Axios
- Context API

## 📁 Project Structure

```
project-capstone/
├── server/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── customerController.js
│   │   ├── appointmentController.js
│   │   ├── commissionController.js
│   │   └── staffController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   ├── Appointment.js
│   │   ├── Commission.js
│   │   └── Staff.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── customers.js
│   │   ├── appointments.js
│   │   ├── commissions.js
│   │   └── staff.js
│   ├── middleware/
│   │   └── auth.js
│   ├── db/
│   │   └── connect.js
│   ├── index.js
│   └── seedDatabase.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   └── Inventory.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── Inventory.jsx
    │   │   ├── Orders.jsx
    │   │   ├── Customers.jsx
    │   │   └── Commissions.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── utils/
    │   │   ├── api.js
    │   │   ├── ProtectedRoutes.jsx
    │   │   └── Root.jsx
    │   ├── App.jsx
    │   └── main.jsx
```

## 🚦 Getting Started

1. Clone the repository
2. Set up MongoDB connection
3. Follow the setup guide in SETUP_GUIDE.js
4. Start the backend server
5. Start the frontend development server
6. Open http://localhost:5173 in your browser
7. Use default credentials to login

## 📝 Environment Variables

Create a `.env` file in the server directory:

```
PORT=5000
URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-secret-key-here
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API routes
- Input validation
- CORS configuration

## 📊 Dashboard Features

- **Admin Dashboard**: Overview of orders, revenue, customers, and low stock items
- **Order Management**: View and manage all orders
- **Inventory Management**: Add, edit, delete products, track stock
- **Customer Management**: Manage customer information
- **Appointment System**: Schedule and manage appointments
- **Commission Tracking**: Monitor cashback earnings

## 🤝 Contributing

This project is a capstone project and is open for modifications and improvements.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 📞 Support

For issues or questions, refer to the SCHEMA_DOCUMENTATION.md file in the server directory.
