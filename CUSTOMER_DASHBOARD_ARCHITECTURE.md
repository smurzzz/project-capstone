# 🏗️ Customer Management Dashboard - Technical Architecture Guide

## System Architecture

### Overall Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Side (React)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Admin Pages                                  │ │
│  │  - Customers.jsx (Main Dashboard)                       │ │
│  │    ├─ Search & Filters Component                        │ │
│  │    ├─ StatsGrid (4 stat cards)                          │ │
│  │    ├─ CustomerTable Component                           │ │
│  │    ├─ MembershipEditModal                               │ │
│  │    └─ RoleEditModal                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Client Pages                                 │ │
│  │  - ClientHome.jsx (Dashboard)                           │ │
│  │    └─ MembershipBanner Component (New)                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Utilities                                    │ │
│  │  - api.js (Axios instances & endpoints)                 │ │
│  │  - AuthContext.jsx (Auth state management)              │ │
│  │  - membership.js (Helper functions)                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
              │ (API Calls with JWT)
              ↓
┌─────────────────────────────────────────────────────────────┐
│                Server Side (Express)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Routes                                       │ │
│  │  - routes/customers.js                                  │ │
│  │    ├─ GET /customers (get all)                          │ │
│  │    ├─ POST /customers (create)                          │ │
│  │    ├─ GET /customers/:id                                │ │
│  │    ├─ PUT /customers/:id (update)                       │ │
│  │    ├─ PUT /customers/:id/membership (update membership) │ │
│  │    └─ DELETE /customers/:id                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Middleware                                   │ │
│  │  - verifyToken (JWT validation)                         │ │
│  │  - verifyStaff (Staff/Admin check)                      │ │
│  │  - verifyAdmin (Admin-only check)                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Controllers                                  │ │
│  │  - controllers/customerController.js                    │ │
│  │    ├─ getAllCustomers()                                 │ │
│  │    ├─ getCustomerById()                                 │ │
│  │    ├─ createCustomer()                                  │ │
│  │    ├─ updateCustomer()                                  │ │
│  │    ├─ updateMembership()                                │ │
│  │    ├─ getMembershipHistory()                            │ │
│  │    └─ deleteCustomer()                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          ↓                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Models                                       │ │
│  │  - models/Customer.js                                   │ │
│  │  - models/User.js                                       │ │
│  │  - models/Staff.js                                      │ │
│  │  - models/MembershipHistory.js                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
              ↓ (Database Queries)
              │
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
├─────────────────────────────────────────────────────────────┤
│  - customers collection                                      │
│  - users collection                                          │
│  - staff collection                                          │
│  - membershiphistory collection                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Structure

### 1. Customers.jsx (Main Container)
**Type:** Page Component (Container)  
**Location:** `frontend/src/pages/admin/Customers.jsx`  
**Responsibility:** Manage overall dashboard state and logic

**State Management:**
```javascript
const [customers, setCustomers] = useState([])           // All customers
const [loading, setLoading] = useState(true)             // Loading state
const [error, setError] = useState(null)                 // Error messages
const [success, setSuccess] = useState(null)             // Success messages
const [searchTerm, setSearchTerm] = useState("")          // Search query
const [filterRole, setFilterRole] = useState("all")      // Role filter
const [filterMembership, setFilterMembership] = useState("all") // Status filter
const [editingCustomer, setEditingCustomer] = useState(null)    // Modal customer
const [showMembershipModal, setShowMembershipModal] = useState(false)
const [showRoleModal, setShowRoleModal] = useState(false)
```

**Key Functions:**
- `fetchCustomers()` - API call to get all customers
- `handleEditMembership()` - Open membership modal
- `handleEditRole()` - Open role modal
- `handleSaveChanges()` - Refresh data after changes
- `handleDelete()` - Delete customer with confirmation

---

### 2. CustomerTable.jsx (Presentational)
**Type:** Presentational Component  
**Location:** `frontend/src/components/admin/CustomerTable.jsx`  
**Responsibility:** Display customer data in table format

**Props:**
```javascript
{
  customers: Array,           // Customer data
  onEditMembership: Function, // Edit membership callback
  onEditRole: Function,       // Edit role callback
  onDelete: Function,         // Delete callback
  loading: Boolean            // Loading state
}
```

**Key Features:**
- Renders customer table with 8 columns
- Color-coded status badges
- Action buttons in last column
- Responsive table wrapper
- Empty and loading states

---

### 3. MembershipEditModal.jsx (Modal Component)
**Type:** Modal Component  
**Location:** `frontend/src/components/admin/MembershipEditModal.jsx`  
**Responsibility:** Handle membership editing

**Props:**
```javascript
{
  customer: Object,    // Customer being edited
  onClose: Function,   // Close modal callback
  onSave: Function     // Save success callback
}
```

**Form Fields:**
- Status select (None, Pending, Active, Suspended)
- Tier select (Silver, Gold, Platinum)
- Expiration date input
- Notes textarea

**API Call:**
```javascript
customersAPI.updateMembership(customer._id, {
  status: String,
  tier: String,
  expiresAt: Date,
  notes: String
})
```

---

### 4. RoleEditModal.jsx (Modal Component)
**Type:** Modal Component  
**Location:** `frontend/src/components/admin/RoleEditModal.jsx`  
**Responsibility:** Handle role changes

**Props:**
```javascript
{
  customer: Object,    // Customer being edited
  onClose: Function,   // Close modal callback
  onSave: Function     // Save success callback
}
```

**Role Options:**
- Guest (membership.status = "None")
- Member (membership.status = "Active")

---

### 5. MembershipBanner.jsx (Client Component)
**Type:** Presentational Component  
**Location:** `frontend/src/components/membership/MembershipBanner.jsx`  
**Responsibility:** Display membership info on client dashboard

**Data Source:**
```javascript
customersAPI.getMe() // Gets logged-in customer
```

**Auto-Refresh:**
- Fetches data every 30 seconds
- Automatically updates display
- No manual refresh needed

**Displayed Information:**
- Tier badge with icon
- Membership status
- Benefits list
- Loyalty points
- Discount percentage
- Membership dates
- Validity progress bar

---

## Data Flow Diagrams

### Create/Update Membership Flow
```
User Action
    ↓
MembershipEditModal Form
    ↓
customersAPI.updateMembership(id, data)
    ↓
Express Middleware (verifyToken → verifyStaff)
    ↓
customerController.updateMembership()
    ↓
Customer Model Updated
    ↓
MembershipHistory Record Created
    ↓
Response Sent to Frontend
    ↓
Customers.jsx Re-fetches Data
    ↓
CustomerTable Re-renders
    ↓
MembershipBanner Auto-Refreshes (30s)
```

### Search & Filter Flow
```
User Types/Selects Filter
    ↓
React State Updated
    ↓
useMemo Re-calculates filteredCustomers
    ↓
CustomerTable Re-renders with Filtered Data
    ↓
No API Call (Client-side filtering)
```

### Membership Banner Auto-Sync Flow
```
Component Mounts
    ↓
useEffect Runs
    ↓
customersAPI.getMe() Called
    ↓
Membership Data Fetched
    ↓
State Updated
    ↓
Component Renders
    ↓
setInterval Timer Starts (30 seconds)
    ↓
Every 30 seconds: Re-fetch & Update
```

---

## API Integration

### Axios Configuration
```javascript
// frontend/src/utils/api.js
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
})

// Request Interceptor - Add JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pos-token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response Interceptor - Handle 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear auth on 401
      localStorage.removeItem("pos-user")
      localStorage.removeItem("pos-token")
    }
    return Promise.reject(error)
  }
)
```

### Customer API Methods
```javascript
export const customersAPI = {
  getMe: () => api.get("/customers/me"),
  updateMe: (data) => api.put("/customers/me", data),
  getAll: () => api.get("/customers"),
  getById: (id) => api.get(`/customers/${id}`),
  getByEmail: (email) => api.get(`/customers/email/${email}`),
  create: (data) => api.post("/customers", data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getStats: () => api.get("/customers/stats"),
  updateMembership: (id, data) => 
    api.put(`/customers/${id}/membership`, data),
  getMembershipHistory: (id, limit = 50) =>
    api.get(`/customers/${id}/membership/history?limit=${limit}`)
}
```

---

## State Management

### Global State (AuthContext)
```javascript
{
  user: {
    id: String,
    name: String,
    email: String,
    role: String,      // "admin", "customer"
    type: String,      // "staff" or "customer"
    customerId: String
  },
  loading: Boolean,
  login: Function,
  logout: Function,
  updateUser: Function
}
```

### Local State (Customers.jsx)
- Customers array with full data
- Search term for filtering
- Filter selections (role, membership status)
- Modal open/close states
- Error and success message states

### Component State (CustomerTable.jsx)
- No local state (pure presentational)
- All data via props

---

## Error Handling

### Error Handling Strategy
```javascript
try {
  const response = await customersAPI.updateMembership(id, data)
  onSave() // Success callback
  onClose() // Close modal
} catch (error) {
  const message = error.response?.data?.message || 
                  "Failed to update membership"
  setError(message)
  // Error message auto-dismisses after 5 seconds
}
```

### Error Types
- **400 Bad Request** - Validation failed
- **401 Unauthorized** - Token invalid/expired
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Customer not found
- **500 Server Error** - Server error

---

## Performance Optimization

### Techniques Used

1. **Memoization (useMemo)**
   - Filters recalculated only when dependencies change
   - Prevents unnecessary re-renders
   ```javascript
   const filteredCustomers = useMemo(() => {
     // Complex filtering logic
   }, [customers, searchTerm, filterRole, filterMembership])
   ```

2. **Data Fetching Optimization**
   - Single API call to get all customers
   - Client-side filtering (no additional API calls)
   - Interval-based refresh (30 seconds) instead of polling

3. **Component Optimization**
   - Functional components with hooks
   - Proper dependency arrays in useEffect
   - Event handler memoization where needed

4. **CSS Optimization**
   - Separate CSS files (no inline styles)
   - BEM naming convention
   - Media queries for responsive design

---

## Security Considerations

### Frontend Security
1. **JWT Token Management**
   - Stored in localStorage
   - Auto-removed on 401 response
   - Added to request headers automatically

2. **Input Validation**
   - Form validation on client
   - Sanitization before API call
   - Type checking with React PropTypes

3. **XSS Prevention**
   - React escapes content automatically
   - No dangerouslySetInnerHTML used
   - Input properly escaped

### Backend Security
1. **JWT Verification**
   - Validated on every protected route
   - Checked for expiration
   - Verified against secret key

2. **Role-Based Access Control**
   - `verifyStaff` middleware checks user role
   - Only Staff/Admin can access customer endpoints
   - Admin-only actions require `verifyAdmin`

3. **Data Validation**
   - All inputs validated server-side
   - Type checking with Mongoose schemas
   - Enum validation for status/tier

4. **Audit Trail**
   - All membership changes logged
   - MembershipHistory records who made change
   - Timestamp for each modification

---

## Testing Strategies

### Unit Testing
```javascript
// Test component render
render(<CustomerTable customers={mockData} />)
expect(screen.getByText("John Doe")).toBeInTheDocument()

// Test filter logic
const filtered = useMemo filters with mock data
expect(filtered.length).toBe(expectedCount)
```

### Integration Testing
```javascript
// Test complete flow
1. Render Customers page
2. Search for customer
3. Click edit button
4. Fill form
5. Submit
6. Verify API called
7. Verify table updated
```

### E2E Testing
```javascript
// Full user journey
1. Login as staff
2. Navigate to customers
3. Edit a customer
4. Logout and login as customer
5. Verify membership banner shows changes
```

---

## Styling Architecture

### CSS Naming Convention (BEM)
```css
/* Block */
.customer-table { }

/* Element */
.customer-table__row { }
.customer-table__cell { }

/* Modifier */
.customer-table__cell--action { }
.customer-table__row--active { }

/* Utility Classes */
.text-muted { }
.hidden { }
```

### Responsive Breakpoints
```css
Desktop:    1024px+
Tablet:     768px - 1023px
Mobile:     < 768px
Small Mobile: < 480px
```

### Color System
```javascript
// Primary Colors
Primary:    #667eea (Purple)
Secondary:  #0ea5e9 (Cyan)

// Status Colors
Success:    #10b981 (Green)
Warning:    #f59e0b (Amber)
Error:      #ef4444 (Red)
Neutral:    #9ca3af (Gray)

// Tier Colors
Silver:     #64748b
Gold:       #f59e0b
Platinum:   #6366f1
```

---

## File Naming Conventions

### Components
- PascalCase: `MembershipEditModal.jsx`
- One component per file
- Corresponding CSS in same directory

### CSS Files
- kebab-case: `customer-table.css`, `modal.css`
- Specific to component or page
- Shared utilities in main CSS

### Functions
- camelCase: `fetchCustomers()`, `handleEditMembership()`
- Descriptive names: `handleSubmit` not `submit`

---

## Future Scalability

### Potential Improvements
1. **Redux/Zustand for State Management**
   - Better for complex state
   - Easier testing
   - Dev tools

2. **Infinite Scroll / Pagination**
   - For large customer lists
   - Better performance

3. **Advanced Filtering**
   - Date range filters
   - Complex queries
   - Saved filter views

4. **Real-time Updates (WebSockets)**
   - Live customer count
   - Real-time membership updates
   - Collaboration features

5. **Caching Strategy**
   - React Query for data fetching
   - Automatic cache invalidation
   - Better offline support

---

**This architecture is built for scalability, maintainability, and performance!**
