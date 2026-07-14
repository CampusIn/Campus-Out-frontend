import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { MarketCartProvider } from './context/MarketCartContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import AuthSuccess from './pages/auth/AuthSuccess';
import ForgotPassword from './pages/auth/ForgotPassword';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import FoodDetail from './pages/FoodDetail';
import Cart from './pages/user/Cart';
import Orders from './pages/user/Orders';
import OrderDetail from './pages/user/OrderDetail';
import Profile from './pages/user/Profile';
import VendorLayout from './components/VendorLayout';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorOrderDetails from './pages/vendor/VendorOrderDetails';
import VendorInventory from './pages/vendor/VendorInventory';
import VendorMenuManagement from './pages/vendor/VendorMenuManagement';
import VendorBulkUpload from './pages/vendor/VendorBulkUpload';
import VendorAnalytics from './pages/vendor/VendorAnalytics';
import VendorSettings from './pages/vendor/VendorSettings';
import DeliveryLogin from './pages/auth/DeliveryLogin';
import DeliveryRegister from './pages/auth/DeliveryRegister';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

// Admin Lazy Pages
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminRestaurants = lazy(() => import('./pages/admin/AdminRestaurants'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminAbandonedCarts = lazy(() => import('./pages/admin/AdminAbandonedCarts'));
const AdminMarketplace = lazy(() => import('./pages/admin/AdminMarketplace'));
const Marketplace = lazy(() => import('./pages/user/Marketplace'));
const MarketplaceProductDetail = lazy(() => import('./pages/user/MarketplaceProductDetail'));
const MarketplaceCart = lazy(() => import('./pages/user/MarketplaceCart'));
const MarketplaceOrderDetail = lazy(() => import('./pages/user/MarketplaceOrderDetail'));

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <CartProvider>
              <MarketCartProvider>
                <div className="app-layout">
                <Navbar />
                <div className="app-content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/auth/success" element={<AuthSuccess />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/restaurants" element={<Restaurants />} />
                    <Route path="/restaurants/:id" element={<RestaurantDetail />} />
                    <Route path="/food/:id" element={<FoodDetail />} />
                    <Route path="/cart" element={<ProtectedRoute allowedRoles={['user']}><Cart /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute allowedRoles={['user']}><Orders /></ProtectedRoute>} />
                    <Route path="/orders/:orderId" element={<ProtectedRoute allowedRoles={['user']}><OrderDetail /></ProtectedRoute>} />
                    <Route 
                      path="/marketplace/orders/:orderId" 
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <Suspense fallback={
                            <div className="loading-container" style={{ minHeight: '80vh' }}>
                              <div className="spinner"></div>
                              <p style={{ fontWeight: 650, color: '#64748b' }}>Loading Order Details...</p>
                            </div>
                          }>
                            <MarketplaceOrderDetail />
                          </Suspense>
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/profile" element={<ProtectedRoute allowedRoles={['user', 'vendor']}><Profile /></ProtectedRoute>} />
                    <Route 
                      path="/marketplace" 
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <Suspense fallback={
                            <div className="loading-container" style={{ minHeight: '80vh' }}>
                              <div className="spinner"></div>
                              <p style={{ fontWeight: 650, color: '#64748b' }}>Loading Marketplace...</p>
                            </div>
                          }>
                            <Marketplace />
                          </Suspense>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/marketplace/cart" 
                      element={<Navigate to="/cart?tab=marketplace" replace />} 
                    />
                    <Route 
                      path="/marketplace/product/:productId" 
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <Suspense fallback={
                            <div className="loading-container" style={{ minHeight: '80vh' }}>
                              <div className="spinner"></div>
                              <p style={{ fontWeight: 650, color: '#64748b' }}>Loading Item Details...</p>
                            </div>
                          }>
                            <MarketplaceProductDetail />
                          </Suspense>
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/vendor" element={<ProtectedRoute allowedRoles={['vendor']}><VendorLayout /></ProtectedRoute>}>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<VendorDashboard />} />
                      <Route path="orders" element={<VendorOrders />} />
                      <Route path="orders/:orderId" element={<VendorOrderDetails />} />
                      <Route path="inventory" element={<VendorInventory />} />
                      <Route path="menu" element={<VendorMenuManagement />} />
                      <Route path="menu/bulk-upload" element={<VendorBulkUpload />} />
                      <Route path="analytics" element={<VendorAnalytics />} />
                      <Route path="settings" element={<VendorSettings />} />
                    </Route>
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <Suspense fallback={
                            <div className="loading-container" style={{ minHeight: '80vh' }}>
                              <div className="spinner"></div>
                              <p style={{ fontWeight: 650, color: '#64748b' }}>Loading Admin Portal...</p>
                            </div>
                          }>
                            <AdminLayout />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="marketplace" element={<AdminMarketplace />} />
                      <Route path="coupons" element={<AdminCoupons />} />
                      <Route path="announcements" element={<AdminAnnouncements />} />
                      <Route path="banners" element={<AdminBanners />} />
                      <Route path="restaurants" element={<AdminRestaurants />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
                    </Route>
                    <Route path="/delivery/login" element={<DeliveryLogin />} />
                    <Route path="/delivery/register" element={<DeliveryRegister />} />
                    <Route path="/delivery/dashboard" element={<ProtectedRoute allowedRoles={['delivery_partner']}><DeliveryDashboard /></ProtectedRoute>} />
                  </Routes>
                </div>
                <BottomNav />
                </div>
              </MarketCartProvider>
            </CartProvider>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
