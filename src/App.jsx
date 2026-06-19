import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import FoodDetail from './pages/FoodDetail';
import Cart from './pages/user/Cart';
import Orders from './pages/user/Orders';
import OrderDetail from './pages/user/OrderDetail';
import Profile from './pages/user/Profile';
import Dashboard from './pages/vendor/Dashboard';
import MenuManagement from './pages/vendor/MenuManagement';
import VendorOrders from './pages/vendor/VendorOrders';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="app-layout">
            <Navbar />
            <div className="app-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/restaurants" element={<Restaurants />} />
                <Route path="/restaurants/:id" element={<RestaurantDetail />} />
                <Route path="/food/:id" element={<FoodDetail />} />
                <Route path="/cart" element={<ProtectedRoute allowedRoles={['user']}><Cart /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute allowedRoles={['user']}><Orders /></ProtectedRoute>} />
                <Route path="/orders/:orderId" element={<ProtectedRoute allowedRoles={['user']}><OrderDetail /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute allowedRoles={['user', 'vendor']}><Profile /></ProtectedRoute>} />
                <Route path="/vendor" element={<ProtectedRoute allowedRoles={['vendor']}><Dashboard /></ProtectedRoute>} />
              </Routes>
            </div>
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
