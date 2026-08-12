import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { MarketCartProvider } from './context/MarketCartContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import RouteTitleUpdater from './components/RouteTitleUpdater';
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
import VendorLogin from './pages/auth/VendorLogin';
import VendorRegister from './pages/auth/VendorRegister';
import AdminLogin from './pages/auth/AdminLogin';

// Custom lazy wrapper to handle chunk load errors after deployment (e.g. Vercel)
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });

// Admin Lazy Pages
const AdminLayout = lazyWithRetry(() => import('./components/AdminLayout'));
const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard'));
const AdminSettings = lazyWithRetry(() => import('./pages/admin/AdminSettings'));
const AdminCoupons = lazyWithRetry(() => import('./pages/admin/AdminCoupons'));
const AdminAnnouncements = lazyWithRetry(() => import('./pages/admin/AdminAnnouncements'));
const AdminRestaurants = lazyWithRetry(() => import('./pages/admin/AdminRestaurants'));
const AdminUsers = lazyWithRetry(() => import('./pages/admin/AdminUsers'));
const AdminBanners = lazyWithRetry(() => import('./pages/admin/AdminBanners'));
const AdminAbandonedCarts = lazyWithRetry(() => import('./pages/admin/AdminAbandonedCarts'));
const AdminMarketplace = lazyWithRetry(() => import('./pages/admin/AdminMarketplace'));
const AdminInventory = lazyWithRetry(() => import('./pages/admin/AdminInventory'));
const AdminRepairPartners = lazyWithRetry(() => import('./pages/admin/AdminRepairPartners'));
const AdminRepairRequests = lazyWithRetry(() => import('./pages/admin/AdminRepairRequests'));
const Marketplace = lazyWithRetry(() => import('./pages/user/Marketplace'));
const MarketplaceProductDetail = lazyWithRetry(() => import('./pages/user/MarketplaceProductDetail'));
const MarketplaceCart = lazyWithRetry(() => import('./pages/user/MarketplaceCart'));
const MarketplaceOrderDetail = lazyWithRetry(() => import('./pages/user/MarketplaceOrderDetail'));
const RepairRequests = lazyWithRetry(() => import('./pages/user/RepairRequests'));
const TermsAndConditions = lazyWithRetry(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/LegalPolicy'));
const RefundPolicy = lazyWithRetry(() => import('./pages/RefundPolicy'));
const WhoWeAre = lazyWithRetry(() => import('./pages/WhoWeAre'));

// Printing Lazy Pages
const PrintingFlow = lazyWithRetry(() => import('./pages/user/printing/PrintingFlow'));
const PrintingOrders = lazyWithRetry(() => import('./pages/user/printing/PrintingOrders'));
const PrintingOrderDetail = lazyWithRetry(() => import('./pages/user/printing/PrintingOrderDetail'));

const AdminPrintingOrders = lazyWithRetry(() => import('./pages/admin/printing/AdminPrintingOrders'));
const AdminPrintingOrderDetail = lazyWithRetry(() => import('./pages/admin/printing/AdminPrintingOrderDetail'));
export default function App() {
  return (
    <BrowserRouter>
      <RouteTitleUpdater />
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
                    <Route path="/terms-and-conditions" element={
                      <Suspense fallback={<div className="loading-container"><div className="spinner"></div></div>}>
                        <TermsAndConditions />
                      </Suspense>
                    } />
                    <Route path="/privacy-policy" element={
                      <Suspense fallback={<div className="loading-container"><div className="spinner"></div></div>}>
                        <PrivacyPolicy />
                      </Suspense>
                    } />
                    <Route path="/who-we-are" element={
                      <Suspense fallback={<div className="loading-container"><div className="spinner"></div></div>}>
                        <WhoWeAre />
                      </Suspense>
                    } />
                    <Route path="/refund-policy" element={
                      <Suspense fallback={<div className="loading-container"><div className="spinner"></div></div>}>
                        <RefundPolicy />
                      </Suspense>
                    } />
                    <Route path="/restaurants" element={<Restaurants />} />
                    <Route path="/restaurants/:id" element={<RestaurantDetail />} />
                    <Route path="/food/:id" element={<FoodDetail />} />
                    <Route path="/cart" element={<ProtectedRoute allowedRoles={['user']}><Cart /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute allowedRoles={['user']}><Orders /></ProtectedRoute>} />
                    <Route path="/orders/:orderId" element={<ProtectedRoute allowedRoles={['user']}><OrderDetail /></ProtectedRoute>} />
                    <Route 
                      path="/printing" 
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <Suspense fallback={
                            <div className="loading-container" style={{ minHeight: '80vh' }}>
                              <div className="spinner"></div>
                              <p style={{ fontWeight: 650, color: '#64748b' }}>Loading Printing...</p>
                            </div>
                          }>
                            <PrintingFlow />
                          </Suspense>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/printing/orders" 
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <Suspense fallback={
                            <div className="loading-container" style={{ minHeight: '80vh' }}>
                              <div className="spinner"></div>
                              <p style={{ fontWeight: 650, color: '#64748b' }}>Loading Orders...</p>
                            </div>
                          }>
                            <PrintingOrders />
                          </Suspense>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/printing/orders/:orderId" 
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <Suspense fallback={
                            <div className="loading-container" style={{ minHeight: '80vh' }}>
                              <div className="spinner"></div>
                              <p style={{ fontWeight: 650, color: '#64748b' }}>Loading Order...</p>
                            </div>
                          }>
                            <PrintingOrderDetail />
                          </Suspense>
                        </ProtectedRoute>
                      } 
                    />
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
                      path="/repair-requests" 
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <Suspense fallback={
                            <div className="homepage-content-wrapper animate-pulse" style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 16px 96px 16px' }}>
                              {/* Header Outlay */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0' }} />
                                <div>
                                  <div style={{ width: '180px', height: '22px', background: '#e2e8f0', borderRadius: '8px', marginBottom: '6px' }} />
                                  <div style={{ width: '240px', height: '14px', background: '#e2e8f0', borderRadius: '6px' }} />
                                </div>
                              </div>

                              {/* Tab Switcher Outlay */}
                              <div style={{ height: '48px', background: '#e2e8f0', borderRadius: '16px', marginBottom: '24px' }} />

                              {/* Cards Outlay */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {Array.from({ length: 3 }).map((_, idx) => (
                                  <div key={idx} style={{ height: '115px', background: '#ffffff', borderRadius: '20px', border: '1.5px solid #edf2f7', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ width: '150px', height: '20px', background: '#e2e8f0', borderRadius: '8px' }} />
                                      <div style={{ width: '80px', height: '22px', background: '#e2e8f0', borderRadius: '12px' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ width: '180px', height: '16px', background: '#e2e8f0', borderRadius: '6px' }} />
                                      <div style={{ width: '100px', height: '28px', background: '#e2e8f0', borderRadius: '10px' }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          }>
                            <RepairRequests />
                          </Suspense>
                        </ProtectedRoute>
                      } 
                    />
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
                    <Route path="/vendor/login" element={<VendorLogin />} />
                    <Route path="/vendor/register" element={<VendorRegister />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
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
                      <Route path="repair-partners" element={<AdminRepairPartners />} />
                      <Route path="repair-requests" element={<AdminRepairRequests />} />
                      <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
                      <Route path="inventory" element={<AdminInventory />} />
                      <Route path="printing/orders" element={<AdminPrintingOrders />} />
                      <Route path="printing/orders/:orderId" element={<AdminPrintingOrderDetail />} />
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
