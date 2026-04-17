import { BrowserRouter as Router, Routes, Route  } from 'react-router-dom'
import Root from './utils/Root'; 
import Login from './pages/Login';
import ProtectedRoutes from './utils/ProtectedRoutes';
import Dashboard from './pages/Dashboard';
import Inventory from './components/Inventory';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route 
          path="/admin/dashboard" element={
          <ProtectedRoutes requireRole={['admin']}>
            <Dashboard />
          </ProtectedRoutes>}
        >
          <Route
            index
            element={<h1>Welcome to the Admin Dashboard</h1>}
           />

           <Route path='orders' element={<h1>Orders</h1>} />
           <Route path='appointments' element={<h1>Appointments</h1>} />
           <Route path='inventory' element={<Inventory />} />
           <Route path='commissions' element={<h1>Commissions</h1>} />
           <Route path='reports' element={<h1>Reports</h1>} />
        </Route>
        <Route path="/customer/dashboard" element={<ProtectedRoutes requireRole={['customer']}><h1>Customer Dashboard</h1></ProtectedRoutes>} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<h1>Unauthorized</h1>} />
      </Routes>
    </Router>
  )
}

export default App