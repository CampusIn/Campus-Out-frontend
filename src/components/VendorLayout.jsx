import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getMyRestaurants, createRestaurant, toggleRestaurantStatus } from '../api/restaurant.api';
import CustomSelect from './CustomSelect';

import { Package, UtensilsCrossed, Flame, Store, Phone, DollarSign, LayoutDashboard, ShoppingBag, BarChart2, Settings, User, LogOut, ChevronDown, Menu, X, MapPin, Clock, AlertTriangle } from 'lucide-react';
import '../pages/vendor/VendorPortal.css';

const categories = ['Fast Food', 'Cafe', 'Bakery', 'South Indian', 'North Indian', 'Chinese', 'Other'];

export default function VendorLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Form state for creating restaurant
  const [restaurantForm, setRestaurantForm] = useState({
    restaurantName: '',
    description: '',
    category: '',
    phone: '',
    email: user?.email || '',
    location: '',
    deliveryTime: '',
    minimumOrder: ''
  });

  const fetchVendorRestaurant = async () => {
    try {
      const { data } = await getMyRestaurants();
      if (data.data && data.data.length > 0) {
        setRestaurant(data.data[0]);
      } else {
        setRestaurant(null);
      }
    } catch (err) {
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorRestaurant();
  }, []);

  // Handle click outside profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleRegisterRestaurant = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await createRestaurant(restaurantForm);
      toast.success('Restaurant registered successfully!');
      fetchVendorRestaurant();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register restaurant');
      setLoading(false);
    }
  };

  const handleToggleShopStatus = async () => {
    if (!restaurant) return;
    if (restaurant.isSuspended) {
      toast.error('Your restaurant has been suspended by system control');
      return;
    }
    try {
      const newStatus = !restaurant.isOpen;
      await toggleRestaurantStatus(restaurant._id, newStatus);
      setRestaurant({ ...restaurant, isOpen: newStatus });
      toast.success(`Eatery is now ${newStatus ? 'OPEN' : 'CLOSED'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update shop status');
    }
  };

  // Get human readable title of current active route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/vendor/dashboard')) return 'Dashboard Overview';
    if (path.includes('/vendor/orders')) return 'Manage Orders';
    if (path.includes('/vendor/inventory')) return 'Inventory Listing';
    if (path.includes('/vendor/menu/bulk-upload')) return 'Bulk Upload Menu';
    if (path.includes('/vendor/menu')) return 'Menu Management';
    if (path.includes('/vendor/analytics')) return 'Analytics Reports';
    if (path.includes('/vendor/settings')) return 'Shop Settings';
    return 'Vendor Portal';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '16px', background: '#f8faf9' }}>
        <div style={{ background: '#06c169', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Flame size={32} color="#ffffff" style={{ animation: 'pulseSoft 2s infinite' }} />
        </div>
        <p style={{ fontFamily: 'Outfit', fontWeight: 650, color: '#64748b' }}>Loading Vendor Workspace...</p>
      </div>
    );
  }

  // CASE 1: No Restaurant Registered Yet
  if (!restaurant) {
    return (
      <div style={{ background: '#f8faf9', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#06c169', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={20} color="#ffffff" />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#1e293b' }}>
                CAMPUS<span style={{ color: '#06c169' }}>IN</span>
              </span>
            </div>
            <button className="btn btn-outline" style={{ width: 'auto', padding: '8px 16px', borderRadius: '10px' }} onClick={() => logout('vendor')}>
              Logout
            </button>
          </div>

          <form className="vendor-register-card" onSubmit={handleRegisterRestaurant}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                Register Your Campus Eatery
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Create your shop profile to start uploading your menu, tracking inventory, and managing student orders.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Restaurant Name *</label>
              <input 
                className="input-pill" 
                style={{ paddingLeft: '20px' }} 
                placeholder="e.g. Snack Shack" 
                value={restaurantForm.restaurantName} 
                onChange={(e) => setRestaurantForm({ ...restaurantForm, restaurantName: e.target.value })} 
                required 
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Description</label>
              <input 
                className="input-pill" 
                style={{ paddingLeft: '20px' }} 
                placeholder="Brief summary of your cuisine or specialities" 
                value={restaurantForm.description} 
                onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })} 
              />
            </div>
            
            <div className="vendor-form-row">
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Category *</label>
                <CustomSelect
                  options={categories}
                  value={restaurantForm.category}
                  onChange={(val) => setRestaurantForm({ ...restaurantForm, category: val })}
                  placeholder="Select Category"
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Phone Number *</label>
                <input 
                  className="input-pill" 
                  style={{ paddingLeft: '20px' }} 
                  placeholder="e.g. +91 9876543210" 
                  value={restaurantForm.phone} 
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })} 
                  required 
                />
              </div>
            </div>
            
            <div className="vendor-form-row">
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Eatery Email</label>
                <input 
                  className="input-pill" 
                  style={{ paddingLeft: '20px' }} 
                  type="email" 
                  placeholder="e.g. contact@snackshack.com" 
                  value={restaurantForm.email} 
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, email: e.target.value })} 
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Campus Location *</label>
                <input 
                  className="input-pill" 
                  style={{ paddingLeft: '20px' }} 
                  placeholder="e.g. Block C Food Court" 
                  value={restaurantForm.location} 
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, location: e.target.value })} 
                  required 
                />
              </div>
            </div>

            <div className="vendor-form-row">
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Est. Delivery Time (mins)</label>
                <input 
                  className="input-pill" 
                  style={{ paddingLeft: '20px' }} 
                  type="number" 
                  placeholder="e.g. 20" 
                  value={restaurantForm.deliveryTime} 
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, deliveryTime: e.target.value })} 
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Min. Order Amount (₹)</label>
                <input 
                  className="input-pill" 
                  style={{ paddingLeft: '20px' }} 
                  type="number" 
                  placeholder="e.g. 50" 
                  value={restaurantForm.minimumOrder} 
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, minimumOrder: e.target.value })} 
                />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" style={{ marginTop: '12px', background: '#06c169', borderColor: '#06c169', fontWeight: 700, height: '48px', borderRadius: '50px' }}>
              Register Eatery
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Navigation Items
  const menuItems = [
    { name: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Orders', path: '/vendor/orders', icon: <ShoppingBag size={20} /> },
    { name: 'Inventory', path: '/vendor/inventory', icon: <Package size={20} /> },
    { name: 'Menu Management', path: '/vendor/menu', icon: <UtensilsCrossed size={20} /> },
    { name: 'Analytics', path: '/vendor/analytics', icon: <BarChart2 size={20} /> },
    { name: 'Settings', path: '/vendor/settings', icon: <Settings size={20} /> }
  ];

  const sidebarContent = (
    <>
      <div className="vendor-sidebar-header">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div className="vendor-brand-logo">
            <Flame size={20} color="#ffffff" />
          </div>
          <span className="vendor-brand-text">
            CAMPUS<span style={{ color: '#06c169' }}>IN</span>
          </span>
        </Link>
      </div>

      <div className="vendor-sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `vendor-sidebar-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </div>

      <div className="vendor-sidebar-footer">
        <button className="vendor-sidebar-logout-btn" onClick={() => logout('vendor')}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="vendor-layout">
      {/* Desktop Sidebar */}
      <aside className="vendor-sidebar hide-mobile">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <div className={`vendor-sidebar mobile-sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{ display: mobileOpen ? 'flex' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
          <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="#64748b" />
          </button>
        </div>
        {sidebarContent}
      </div>

      {/* Main Panel */}
      <div className="vendor-main">
        {/* Top Header */}
        <header className="vendor-top-nav">
          <div className="vendor-nav-left">
            <button className="vendor-mobile-toggle" onClick={() => setMobileOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="vendor-page-title">{getPageTitle()}</h2>
          </div>

          <div className="vendor-nav-right">
            {/* Open / Closed status */}
            <div className="vendor-shop-status">
              <Store size={16} color={restaurant.isOpen ? '#06c169' : '#64748b'} />
              <span className="hide-mobile" style={{ color: restaurant.isOpen ? '#1e293b' : '#64748b' }}>
                Shop: {restaurant.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={restaurant.isOpen} 
                  disabled={restaurant.isSuspended}
                  onChange={handleToggleShopStatus}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Profile Dropdown */}
            <div className="vendor-profile-wrapper" ref={profileRef}>
              <button className="vendor-profile-trigger" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="vendor-profile-avatar">
                  {user?.username ? user.username[0].toUpperCase() : 'V'}
                </div>
                <span className="vendor-profile-name hide-mobile">
                  {restaurant.restaurantName}
                </span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {profileOpen && (
                <div className="vendor-profile-dropdown">
                  <div className="vendor-profile-info">
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user?.username || 'Vendor Partner'}</div>
                    <div className="vendor-profile-email">{user?.email}</div>
                  </div>
                  <Link to="/vendor/settings" className="vendor-profile-item" onClick={() => setProfileOpen(false)}>
                    <Settings size={16} />
                    Shop Settings
                  </Link>
                  <button className="vendor-profile-item logout" onClick={() => logout('vendor')}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="vendor-content">
          {restaurant.isSuspended && (
            <div className="low-stock-alert-card" style={{ marginBottom: '24px', backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}>
              <div className="low-stock-alert-details" style={{ alignItems: 'center' }}>
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <strong>Your eatery has been suspended by campus administration. Status changes and inventory updates are disabled.</strong>
              </div>
            </div>
          )}
          <Outlet context={{ restaurant, setRestaurant, fetchVendorRestaurant }} />
        </main>
      </div>
    </div>
  );
}
