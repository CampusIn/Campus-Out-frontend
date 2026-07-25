import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAdminDashboard } from '../api/admin.api';

import { Store, Ticket, Megaphone, Package, LayoutDashboard, Users, Settings, LogOut, RefreshCw, ChevronDown, Image, ShoppingBag, ClipboardList, Wrench } from 'lucide-react';
import '../pages/admin/AdminPortal.css';

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState({
    userCount: 0,
    vendorCount: 0,
    restaurantCount: 0,
    orderCount: 0,
    revenue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await getAdminDashboard();
      if (data.success) {
        setStats(data.data);
      } else {
        toast.error('Failed to load system stats');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching admin stats');
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Close mobile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuOptions = [
    { path: '/admin/dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard size={18} /> },
    { path: '/admin/settings', label: 'Platform Settings', icon: <Settings size={18} /> },
    { path: '/admin/marketplace', label: 'Marketplace Console', icon: <Package size={18} /> },
    { path: '/admin/coupons', label: 'Coupon Campaigns', icon: <Ticket size={18} /> },
    { path: '/admin/announcements', label: 'Announcements Bulletin', icon: <Megaphone size={18} /> },
    { path: '/admin/banners', label: 'Banner Ads', icon: <Image size={18} /> },
    { path: '/admin/restaurants', label: `Cafeteria Directory (${stats.restaurantCount})`, icon: <Store size={18} /> },
    { path: '/admin/users', label: `User Directory (${stats.userCount + stats.vendorCount})`, icon: <Users size={18} /> },
    { path: '/admin/repair-partners', label: 'Repair Partners', icon: <Wrench size={18} /> },
    { path: '/admin/abandoned-carts', label: 'Abandoned Carts', icon: <ShoppingBag size={18} /> },
    { path: '/admin/inventory', label: 'Inventory Tracker', icon: <ClipboardList size={18} /> },
  ];

  const getCurrentPageLabel = () => {
    const matched = menuOptions.find(opt => location.pathname === opt.path);
    return matched ? matched.label : 'Select Section';
  };

  const getCurrentPageIcon = () => {
    const matched = menuOptions.find(opt => location.pathname === opt.path);
    return matched ? matched.icon : <LayoutDashboard size={18} />;
  };

  return (
    <div className="admin-dashboard-container page animate-fade-in">
      <div className="admin-grid-layout">
        
        {/* Sidebar Nav */}
        <aside className="admin-sidebar card">
          <div className="admin-profile-section">
            <div className="admin-avatar">
              <span>AD</span>
            </div>
            <div className="admin-profile-info">
              <h3>Administrator</h3>
              <p>{user?.email || 'admin@campusout.com'}</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="admin-nav-links">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Settings size={20} />
              <span>Platform Settings</span>
            </NavLink>

            <NavLink
              to="/admin/marketplace"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Package size={20} />
              <span>Marketplace</span>
            </NavLink>

            <NavLink
              to="/admin/coupons"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Ticket size={20} />
              <span>Coupons</span>
            </NavLink>

            <NavLink
              to="/admin/announcements"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Megaphone size={20} />
              <span>Announcements</span>
            </NavLink>

            <NavLink
              to="/admin/banners"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Image size={20} />
              <span>Banners</span>
            </NavLink>

            <NavLink
              to="/admin/restaurants"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Store size={20} />
              <span>Restaurants ({stats.restaurantCount})</span>
            </NavLink>

            <NavLink
              to="/admin/users"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>Users ({stats.userCount + stats.vendorCount})</span>
            </NavLink>

            <NavLink
              to="/admin/repair-partners"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Wrench size={20} />
              <span>Repair Partners</span>
            </NavLink>

            <NavLink
              to="/admin/abandoned-carts"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <ShoppingBag size={20} />
              <span>Abandoned Carts</span>
            </NavLink>

            <NavLink
              to="/admin/inventory"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <ClipboardList size={20} />
              <span>Inventory Tracker</span>
            </NavLink>
          </nav>

          {/* Mobile Dropdown Switcher with Lucide Icons */}
          <div className="admin-mobile-nav" ref={dropdownRef}>
            <span className="admin-mobile-nav-label">System Console Menu</span>
            <div style={{ position: 'relative', width: '100%' }}>
              <button
                type="button"
                className="admin-mobile-nav-select-trigger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  height: '44px',
                  padding: '0 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  textAlign: 'left',
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getCurrentPageIcon()}
                  <span>{getCurrentPageLabel()}</span>
                </div>
                <ChevronDown 
                  size={16} 
                  style={{ 
                    color: '#64748b', 
                    transition: 'transform 0.2s', 
                    transform: mobileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    flexShrink: 0
                  }} 
                />
              </button>

              {mobileMenuOpen && (
                <div
                  className="admin-mobile-nav-dropdown"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    padding: '6px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  {menuOptions.map((opt) => (
                    <button
                      key={opt.path}
                      type="button"
                      onClick={() => {
                        navigate(opt.path);
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: location.pathname === opt.path ? '#fff5f5' : 'transparent',
                        color: location.pathname === opt.path ? 'var(--primary)' : '#0f172a',
                        fontWeight: location.pathname === opt.path ? 800 : 650,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="admin-sidebar-footer">
            <button className="btn btn-outline admin-logout-btn" onClick={logout}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main-viewport">
          <Outlet context={{ stats, fetchStats, statsLoading }} />
        </main>

      </div>
    </div>
  );
}
