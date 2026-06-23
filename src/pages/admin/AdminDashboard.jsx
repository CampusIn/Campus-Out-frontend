import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getAdminDashboard,
  getAdminUsers,
  getAdminVendors,
  getAdminRestaurants,
  blockUser,
  unblockUser,
  suspendRestaurant,
  activateRestaurant,
  getAdminOrders,
  getAdminOrderById,
} from '../../api/admin.api';
import {
  LayoutDashboard,
  Users,
  Store,
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  ShoppingBag,
  LogOut,
  Sliders,
  CheckCircle,
  XCircle,
  Calendar,
  Lock,
  Unlock,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react';

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'vendors' | 'restaurants' | 'orders'
  
  // Dashboard overall stats state
  const [stats, setStats] = useState({
    userCount: 0,
    vendorCount: 0,
    restaurantCount: 0,
    orderCount: 0,
    revenue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Lists state
  const [usersList, setUsersList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [vendorPage, setVendorPage] = useState(1);
  const [restaurantPage, setRestaurantPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);

  const [userTotalPages, setUserTotalPages] = useState(1);
  const [vendorTotalPages, setVendorTotalPages] = useState(1);
  const [restaurantTotalPages, setRestaurantTotalPages] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);

  // Search/Filters states
  const [userSearch, setUserSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [restaurantCategory, setRestaurantCategory] = useState('');
  const [restaurantStatus, setRestaurantStatus] = useState(''); // '' | 'true' | 'false'
  const [ordersStatus, setOrdersStatus] = useState(''); // '' | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [suspendingIds, setSuspendingIds] = useState({});

  // Global loading states for tabs
  const [tabLoading, setTabLoading] = useState(false);

  // Fetch stats data
  const fetchStats = async () => {
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
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setTabLoading(true);
    try {
      const { data } = await getAdminUsers({
        search: userSearch,
        page: userPage,
        limit: 8,
      });
      if (data.success) {
        setUsersList(data.data.users || []);
        setUserTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching users');
    } finally {
      setTabLoading(false);
    }
  }, [userSearch, userPage, toast]);

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    setTabLoading(true);
    try {
      const { data } = await getAdminVendors({
        search: vendorSearch,
        page: vendorPage,
        limit: 8,
      });
      if (data.success) {
        // Checking for backend typo "venodors" and falling back to "vendors"
        setVendorsList(data.data.venodors || data.data.vendors || []);
        setVendorTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching vendors');
    } finally {
      setTabLoading(false);
    }
  }, [vendorSearch, vendorPage, toast]);

  // Fetch restaurants
  const fetchRestaurants = useCallback(async () => {
    setTabLoading(true);
    try {
      const { data } = await getAdminRestaurants({
        search: restaurantSearch,
        category: restaurantCategory,
        isOpen: restaurantStatus || undefined,
        page: restaurantPage,
        limit: 6,
      });
      if (data.success) {
        setRestaurantsList(data.data.restaurants || []);
        setRestaurantTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching restaurants');
    } finally {
      setTabLoading(false);
    }
  }, [restaurantSearch, restaurantCategory, restaurantStatus, restaurantPage, toast]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setTabLoading(true);
    try {
      const { data } = await getAdminOrders({
        status: ordersStatus || undefined,
        page: ordersPage,
        limit: 8,
      });
      if (data.success) {
        setOrdersList(data.data.orders || []);
        setOrdersTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching orders');
    } finally {
      setTabLoading(false);
    }
  }, [ordersStatus, ordersPage, toast]);

  // Handle blocking/unblocking user
  const handleToggleBlockUser = async (userId, currentlyBlocked) => {
    try {
      if (currentlyBlocked) {
        const { data } = await unblockUser(userId);
        if (data.success) {
          toast.success(data.message || 'User unblocked successfully');
          setUsersList((prev) => prev.map((u) => u._id === userId ? { ...u, isBlocked: false } : u));
          setVendorsList((prev) => prev.map((v) => v._id === userId ? { ...v, isBlocked: false } : v));
          fetchStats();
        }
      } else {
        const { data } = await blockUser(userId);
        if (data.success) {
          toast.success(data.message || 'User blocked successfully');
          setUsersList((prev) => prev.map((u) => u._id === userId ? { ...u, isBlocked: true } : u));
          setVendorsList((prev) => prev.map((v) => v._id === userId ? { ...v, isBlocked: true } : v));
          fetchStats();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  // Handle suspending/activating restaurant
  const handleToggleSuspendRestaurant = async (restaurantId, currentlySuspended) => {
    setSuspendingIds((prev) => ({ ...prev, [restaurantId]: true }));
    try {
      if (currentlySuspended) {
        const { data } = await activateRestaurant(restaurantId);
        if (data.success || data.statusCode === 200) {
          toast.success(data.message || 'Restaurant activated successfully');
          setRestaurantsList((prev) => prev.map((r) => r._id === restaurantId ? { ...r, isSuspended: false } : r));
        }
      } else {
        const { data } = await suspendRestaurant(restaurantId);
        if (data.success || data.statusCode === 200) {
          toast.success(data.message || 'Restaurant suspended successfully');
          setRestaurantsList((prev) => prev.map((r) => r._id === restaurantId ? { ...r, isSuspended: true } : r));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSuspendingIds((prev) => ({ ...prev, [restaurantId]: false }));
    }
  };

  // View order details in modal
  const handleViewOrderDetails = async (orderId) => {
    setOrderDetailLoading(true);
    try {
      const { data } = await getAdminOrderById(orderId);
      if (data.success) {
        setSelectedOrder(data.data.order);
        setShowOrderModal(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching order details');
    } finally {
      setOrderDetailLoading(false);
    }
  };

  // Handle active tab changes
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'vendors') {
      fetchVendors();
    } else if (activeTab === 'restaurants') {
      fetchRestaurants();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, userPage, vendorPage, restaurantPage, ordersPage, fetchUsers, fetchVendors, fetchRestaurants, fetchOrders]);

  // Reset pagination on search change
  const handleUserSearchChange = (e) => {
    setUserSearch(e.target.value);
    setUserPage(1);
  };

  const handleVendorSearchChange = (e) => {
    setVendorSearch(e.target.value);
    setVendorPage(1);
  };

  const handleRestaurantSearchChange = (e) => {
    setRestaurantSearch(e.target.value);
    setRestaurantPage(1);
  };

  const handleRestaurantCategoryChange = (e) => {
    setRestaurantCategory(e.target.value);
    setRestaurantPage(1);
  };

  const handleRestaurantStatusChange = (status) => {
    setRestaurantStatus(status);
    setRestaurantPage(1);
  };
  
  // Custom ratios
  const avgOrderValue = stats.orderCount > 0 ? (stats.revenue / stats.orderCount).toFixed(2) : 0;
  const userEngagementRatio = stats.userCount > 0 ? (stats.orderCount / stats.userCount).toFixed(1) : 0;
  const restVendorRatio = stats.vendorCount > 0 ? (stats.restaurantCount / stats.vendorCount).toFixed(1) : 0;

  // Categories list matching standard cuisines
  const categories = ['Fast Food', 'Cafe', 'Bakery', 'South Indian', 'North Indian', 'Chinese', 'Other'];

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

          <nav className="admin-nav-links">
            <button
              onClick={() => setActiveTab('overview')}
              className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <LayoutDashboard size={20} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>Users ({stats.userCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`admin-nav-item ${activeTab === 'vendors' ? 'active' : ''}`}
            >
              <Users size={20} className="vendor-icon-color" />
              <span>Vendors ({stats.vendorCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('restaurants')}
              className={`admin-nav-item ${activeTab === 'restaurants' ? 'active' : ''}`}
            >
              <Store size={20} />
              <span>Restaurants ({stats.restaurantCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            >
              <ClipboardList size={20} />
              <span>Orders ({stats.orderCount})</span>
            </button>
          </nav>

          <div className="admin-sidebar-footer">
            <button className="btn btn-outline admin-logout-btn" onClick={logout}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main-viewport">
          
          {/* Header */}
          <header className="admin-header card">
            <div className="admin-title-area">
              <span className="admin-role-badge">SYSTEM CONTROL</span>
              <h1>Campus Administration</h1>
              <p>Monitor real-time revenue stats, users activity, vendors, and cafeteria status</p>
            </div>
            <button 
              className="btn btn-sm btn-outline refresh-btn" 
              onClick={() => {
                fetchStats();
                if (activeTab === 'users') fetchUsers();
                if (activeTab === 'vendors') fetchVendors();
                if (activeTab === 'restaurants') fetchRestaurants();
                if (activeTab === 'orders') fetchOrders();
                toast.success('Data refreshed successfully');
              }}
              style={{ width: 'auto', gap: '6px' }}
            >
              <RefreshCw size={14} className={statsLoading ? 'spin-anim' : ''} />
              Refresh
            </button>
          </header>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="overview-tab-content">
              {statsLoading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Calculating system analytics...</p>
                </div>
              ) : (
                <div className="overview-main-layout">
                  {/* Stats Cards Grid */}
                  <div className="stats-cards-grid">
                    {/* Revenue Card */}
                    <div className="stat-card card gradient-card-revenue animate-slide-up">
                      <div className="stat-card-header">
                        <span className="stat-card-title">Total Revenue</span>
                        <div className="stat-icon-wrapper">
                          <DollarSign size={22} color="#ffffff" />
                        </div>
                      </div>
                      <div className="stat-card-value">₹{stats.revenue.toLocaleString()}</div>
                      <div className="stat-card-footer">
                        <span>Delivered orders total amount</span>
                      </div>
                    </div>

                    {/* Orders Card */}
                    <div className="stat-card card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                      <div className="stat-card-header">
                        <span className="stat-card-title">Completed Orders</span>
                        <div className="stat-icon-wrapper icon-bg-blue">
                          <ShoppingBag size={22} color="#4f46e5" />
                        </div>
                      </div>
                      <div className="stat-card-value">{stats.orderCount}</div>
                      <div className="stat-card-footer text-muted">
                        <span>All order instances recorded</span>
                      </div>
                    </div>

                    {/* Active Users */}
                    <div className="stat-card card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                      <div className="stat-card-header">
                        <span className="stat-card-title">Campus Customers</span>
                        <div className="stat-icon-wrapper icon-bg-red">
                          <Users size={22} color="#b31522" />
                        </div>
                      </div>
                      <div className="stat-card-value">{stats.userCount}</div>
                      <div className="stat-card-footer text-muted">
                        <span>Active students & staff accounts</span>
                      </div>
                    </div>

                    {/* Active Vendors */}
                    <div className="stat-card card animate-slide-up" style={{ animationDelay: '0.3s' }}>
                      <div className="stat-card-header">
                        <span className="stat-card-title">Eatery Vendors</span>
                        <div className="stat-icon-wrapper icon-bg-green">
                          <Store size={22} color="#06c169" />
                        </div>
                      </div>
                      <div className="stat-card-value">{stats.vendorCount}</div>
                      <div className="stat-card-footer text-muted">
                        <span>Registered cafeteria managers</span>
                      </div>
                    </div>
                  </div>

                  {/* Custom SVG Bar Chart: Key Efficiency Ratios */}
                  <div className="chart-card card animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <h3 className="chart-title">Key Efficiency Ratios</h3>
                    <p className="chart-subtitle">Calculated operational metric indicators</p>

                    <div className="metric-bars-container">
                      
                      {/* Metric 1 */}
                      <div className="metric-bar-group">
                        <div className="metric-bar-label-row">
                          <span className="metric-bar-name">Average Order Value (AOV)</span>
                          <span className="metric-bar-val">₹{avgOrderValue}</span>
                        </div>
                        <div className="metric-progress-bg">
                          {/* Assumed target max is 500 for visualization */}
                          <div 
                            className="metric-progress-fill color-rev" 
                            style={{ width: `${Math.min((stats.revenue / (stats.orderCount || 1)) / 500 * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="metric-description">Target Benchmark: ₹250.00 / order</span>
                      </div>

                      {/* Metric 2 */}
                      <div className="metric-bar-group">
                        <div className="metric-bar-label-row">
                          <span className="metric-bar-name">Orders Per Customer Ratio</span>
                          <span className="metric-bar-val">{userEngagementRatio}x</span>
                        </div>
                        <div className="metric-progress-bg">
                          {/* Assumed max target is 10 */}
                          <div 
                            className="metric-progress-fill color-orders" 
                            style={{ width: `${Math.min((userEngagementRatio / 10) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="metric-description">Customer usage frequency scale</span>
                      </div>

                      {/* Metric 3 */}
                      <div className="metric-bar-group">
                        <div className="metric-bar-label-row">
                          <span className="metric-bar-name">Cafeterias per Vendor Ratio</span>
                          <span className="metric-bar-val">{restVendorRatio}</span>
                        </div>
                        <div className="metric-progress-bg">
                          {/* Assumed max target is 2 */}
                          <div 
                            className="metric-progress-fill color-vendors" 
                            style={{ width: `${Math.min((restVendorRatio / 2) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="metric-description">Average outlets run per manager</span>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="data-table-tab card animate-fade-in">
              <div className="table-actions-header">
                <h2>Customer Directory</h2>
                
                {/* Search field */}
                <div className="search-input-wrapper custom-search">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    className="input-pill search-input-field"
                    placeholder="Search customer username..."
                    value={userSearch}
                    onChange={handleUserSearchChange}
                  />
                </div>
              </div>

              {tabLoading ? (
                <div className="loading-container p-4">
                  <div className="spinner"></div>
                  <p>Searching directory...</p>
                </div>
              ) : usersList.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} className="empty-icon" />
                  <p>No customers matched your search query.</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email Address</th>
                          <th>Role</th>
                          <th>Joined Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((usr) => (
                          <tr key={usr._id}>
                            <td className="font-bold">{usr.username}</td>
                            <td>{usr.email}</td>
                            <td>
                              <span className="role-chip chip-user">
                                {usr.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="text-muted text-sm">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} />
                                {new Date(usr.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            </td>
                            <td>
                              {usr.isBlocked ? (
                                <span className="status-badge closed-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Lock size={12} />
                                  Blocked
                                </span>
                              ) : (
                                <span className="status-badge open-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Unlock size={12} />
                                  Active
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                className={`btn btn-sm ${usr.isBlocked ? 'btn-green' : 'btn-outline danger-btn'}`}
                                onClick={() => handleToggleBlockUser(usr._id, usr.isBlocked)}
                                style={{ width: 'auto', padding: '4px 10px', height: '30px', fontSize: '0.75rem' }}
                              >
                                {usr.isBlocked ? 'Unblock' : 'Block'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {userTotalPages > 1 && (
                    <div className="pagination-wrapper">
                      <button
                        className="btn btn-sm btn-outline pagination-btn"
                        disabled={userPage === 1}
                        onClick={() => setUserPage(userPage - 1)}
                      >
                        <ChevronLeft size={16} />
                        Prev
                      </button>
                      <span className="pagination-info">
                        Page <strong>{userPage}</strong> of {userTotalPages}
                      </span>
                      <button
                        className="btn btn-sm btn-outline pagination-btn"
                        disabled={userPage === userTotalPages}
                        onClick={() => setUserPage(userPage + 1)}
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: VENDOR MANAGEMENT */}
          {activeTab === 'vendors' && (
            <div className="data-table-tab card animate-fade-in">
              <div className="table-actions-header">
                <h2>Cafeteria Vendor Directory</h2>
                
                {/* Search field */}
                <div className="search-input-wrapper custom-search">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    className="input-pill search-input-field"
                    placeholder="Search vendor username..."
                    value={vendorSearch}
                    onChange={handleVendorSearchChange}
                  />
                </div>
              </div>

              {tabLoading ? (
                <div className="loading-container p-4">
                  <div className="spinner"></div>
                  <p>Searching directory...</p>
                </div>
              ) : vendorsList.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} className="empty-icon" />
                  <p>No vendors matched your search query.</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive-wrapper">
                    <table className="admin-table">
                       <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email Address</th>
                          <th>Role</th>
                          <th>Joined Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorsList.map((vnd) => (
                          <tr key={vnd._id}>
                            <td className="font-bold">{vnd.username}</td>
                            <td>{vnd.email}</td>
                            <td>
                              <span className="role-chip chip-vendor">
                                {vnd.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="text-muted text-sm">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} />
                                {new Date(vnd.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            </td>
                            <td>
                              {vnd.isBlocked ? (
                                <span className="status-badge closed-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Lock size={12} />
                                  Blocked
                                </span>
                              ) : (
                                <span className="status-badge open-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Unlock size={12} />
                                  Active
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                className={`btn btn-sm ${vnd.isBlocked ? 'btn-green' : 'btn-outline danger-btn'}`}
                                onClick={() => handleToggleBlockUser(vnd._id, vnd.isBlocked)}
                                style={{ width: 'auto', padding: '4px 10px', height: '30px', fontSize: '0.75rem' }}
                              >
                                {vnd.isBlocked ? 'Unblock' : 'Block'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {vendorTotalPages > 1 && (
                    <div className="pagination-wrapper">
                      <button
                        className="btn btn-sm btn-outline pagination-btn"
                        disabled={vendorPage === 1}
                        onClick={() => setVendorPage(vendorPage - 1)}
                      >
                        <ChevronLeft size={16} />
                        Prev
                      </button>
                      <span className="pagination-info">
                        Page <strong>{vendorPage}</strong> of {vendorTotalPages}
                      </span>
                      <button
                        className="btn btn-sm btn-outline pagination-btn"
                        disabled={vendorPage === vendorTotalPages}
                        onClick={() => setVendorPage(vendorPage + 1)}
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 4: RESTAURANT MANAGEMENT */}
          {activeTab === 'restaurants' && (
            <div className="data-table-tab card animate-fade-in">
              <div className="table-actions-header flex-column">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
                  <h2>Campus Cafeteria Directory</h2>
                  
                  {/* Search field */}
                  <div className="search-input-wrapper custom-search" style={{ maxWidth: '300px' }}>
                    <Search size={18} className="search-icon" />
                    <input
                      type="text"
                      className="input-pill search-input-field"
                      placeholder="Search cafeteria name..."
                      value={restaurantSearch}
                      onChange={handleRestaurantSearchChange}
                    />
                  </div>
                </div>

                {/* Filters Row */}
                <div className="filters-bar-row">
                  <div className="filter-group">
                    <Filter size={16} className="filter-icon" />
                    <span className="filter-title">Cuisine Category:</span>
                    <select
                      className="filter-select"
                      value={restaurantCategory}
                      onChange={handleRestaurantCategoryChange}
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <Sliders size={16} className="filter-icon" />
                    <span className="filter-title">Shop Status:</span>
                    <div className="status-toggle-buttons">
                      <button
                        className={`status-filter-btn ${restaurantStatus === '' ? 'active' : ''}`}
                        onClick={() => handleRestaurantStatusChange('')}
                      >
                        All
                      </button>
                      <button
                        className={`status-filter-btn status-open ${restaurantStatus === 'true' ? 'active' : ''}`}
                        onClick={() => handleRestaurantStatusChange('true')}
                      >
                        Open
                      </button>
                      <button
                        className={`status-filter-btn status-closed ${restaurantStatus === 'false' ? 'active' : ''}`}
                        onClick={() => handleRestaurantStatusChange('false')}
                      >
                        Closed
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {tabLoading ? (
                <div className="loading-container p-4">
                  <div className="spinner"></div>
                  <p>Searching cafes...</p>
                </div>
              ) : restaurantsList.length === 0 ? (
                <div className="empty-state">
                  <Store size={48} className="empty-icon" />
                  <p>No restaurants match the search or filter settings.</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Cafeteria Name</th>
                          <th>Category</th>
                          <th>Location</th>
                          <th>Contact Details</th>
                          <th>Delivery Details</th>
                          <th>Shop Status</th>
                          <th>Suspension</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {restaurantsList.map((rest) => (
                          <tr key={rest._id}>
                            <td>
                              <div className="font-bold">{rest.restaurantName}</div>
                              <span className="text-xs text-muted">ID: {rest._id}</span>
                            </td>
                            <td>
                              <span className="category-chip">
                                {rest.category}
                              </span>
                            </td>
                            <td>📍 {rest.location}</td>
                            <td className="text-sm">
                              <div>📞 {rest.phone}</div>
                              <div className="text-muted text-xs">{rest.email}</div>
                            </td>
                            <td className="text-sm">
                              <div>⏱️ {rest.deliveryTime || 20} mins</div>
                              <div className="text-muted text-xs">Min: ₹{rest.minimumOrder || 0}</div>
                            </td>
                            <td>
                              {rest.isOpen ? (
                                <span className="status-badge open-badge">
                                  <CheckCircle size={14} />
                                  Open
                                </span>
                              ) : (
                                <span className="status-badge closed-badge">
                                  <XCircle size={14} />
                                  Closed
                                </span>
                              )}
                            </td>
                            <td>
                              {rest.isSuspended ? (
                                <span className="status-badge closed-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <ShieldAlert size={12} />
                                  Suspended
                                </span>
                              ) : (
                                <span className="status-badge open-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle size={12} />
                                  Active
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                className={`btn btn-sm ${rest.isSuspended ? 'btn-green' : 'btn-outline danger-btn'}`}
                                onClick={() => handleToggleSuspendRestaurant(rest._id, rest.isSuspended)}
                                style={{ width: 'auto', padding: '4px 10px', height: '30px', fontSize: '0.75rem' }}
                                disabled={suspendingIds[rest._id]}
                              >
                                {suspendingIds[rest._id]
                                  ? (rest.isSuspended ? 'Activating...' : 'Suspending...')
                                  : (rest.isSuspended ? 'Suspended' : 'Suspend')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {restaurantTotalPages > 1 && (
                    <div className="pagination-wrapper">
                      <button
                        className="btn btn-sm btn-outline pagination-btn"
                        disabled={restaurantPage === 1}
                        onClick={() => setRestaurantPage(restaurantPage - 1)}
                      >
                        <ChevronLeft size={16} />
                        Prev
                      </button>
                      <span className="pagination-info">
                        Page <strong>{restaurantPage}</strong> of {restaurantTotalPages}
                      </span>
                      <button
                        className="btn btn-sm btn-outline pagination-btn"
                        disabled={restaurantPage === restaurantTotalPages}
                        onClick={() => setRestaurantPage(restaurantPage + 1)}
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 5: GLOBAL ORDERS */}
          {activeTab === 'orders' && (
            <div className="data-table-tab card animate-fade-in">
              <div className="table-actions-header">
                <h2>Campus System Orders</h2>
                
                {/* Filters Row */}
                <div className="filters-bar-row" style={{ marginTop: 0 }}>
                  <div className="filter-group">
                    <Filter size={16} className="filter-icon" />
                    <span className="filter-title">Order Status:</span>
                    <select
                      className="filter-select"
                      value={ordersStatus}
                      onChange={(e) => {
                        setOrdersStatus(e.target.value);
                        setOrdersPage(1);
                      }}
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="PREPARING">PREPARING</option>
                      <option value="READY">READY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>
              </div>

              {tabLoading ? (
                <div className="loading-container p-4">
                  <div className="spinner"></div>
                  <p>Searching order history...</p>
                </div>
              ) : ordersList.length === 0 ? (
                <div className="empty-state">
                  <ShoppingBag size={48} className="empty-icon" />
                  <p>No orders found matching the filter query.</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order Number</th>
                          <th>Customer</th>
                          <th>Date & Time</th>
                          <th>Total Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersList.map((ord) => (
                          <tr key={ord._id}>
                            <td className="font-bold">#{ord.orderNumber}</td>
                            <td>{ord.user?.username || 'Customer'}</td>
                            <td className="text-muted text-sm">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} />
                                {new Date(ord.createdAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>
                            <td className="font-bold">₹{ord.totalAmount}</td>
                            <td>
                              <span className={`order-status-badge ${ord.orderStatus}`} style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '50px', fontWeight: 800 }}>
                                {ord.orderStatus}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => handleViewOrderDetails(ord._id)}
                                style={{ width: 'auto', padding: '6px 12px', height: '32px', fontSize: '0.78rem' }}
                                disabled={orderDetailLoading}
                              >
                                {orderDetailLoading && selectedOrder?._id === ord._id ? 'Loading...' : 'Details'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {ordersTotalPages > 1 && (
                    <div className="pagination-wrapper">
                      <button
                        className="btn btn-sm btn-outline pagination-btn"
                        disabled={ordersPage === 1}
                        onClick={() => setOrdersPage(ordersPage - 1)}
                      >
                        <ChevronLeft size={16} />
                        Prev
                      </button>
                      <span className="pagination-info">
                        Page <strong>{ordersPage}</strong> of {ordersTotalPages}
                      </span>
                      <button
                        className="btn btn-sm btn-outline pagination-btn"
                        disabled={ordersPage === ordersTotalPages}
                        onClick={() => setOrdersPage(ordersPage + 1)}
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Order Details Modal Overlay */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Detail summary</h3>
              <button className="close-modal-btn" onClick={() => setShowOrderModal(false)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Order #{selectedOrder.orderNumber}</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className={`order-status-badge ${selectedOrder.orderStatus}`} style={{ height: 'fit-content', padding: '4px 12px', borderRadius: '50px', fontWeight: 800, fontSize: '0.78rem' }}>
                  {selectedOrder.orderStatus}
                </span>
              </div>

              {/* Customer and Payment details info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '16px', fontSize: '0.88rem' }}>
                <div>
                  <h5 style={{ margin: '0 0 6px 0', color: '#64748b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Customer Details</h5>
                  <p style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>{selectedOrder.user?.username || 'Customer'}</p>
                </div>
                <div>
                  <h5 style={{ margin: '0 0 6px 0', color: '#64748b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Payment Details</h5>
                  <p style={{ margin: 0, fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>Method: {selectedOrder.paymentMethod || 'Online'}</p>
                  <p style={{ margin: 0, color: selectedOrder.paymentStatus === 'PAID' ? '#15803d' : '#b91c1c', fontWeight: 800, fontSize: '0.82rem' }}>
                    Status: {selectedOrder.paymentStatus || 'Pending'}
                  </p>
                </div>
              </div>

              {/* Items summary */}
              <div>
                <h5 style={{ margin: '0 0 10px 0', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Purchased Items</h5>
                <div style={{ background: '#ffffff', border: '1.5px solid #f1f5f9', borderRadius: '16px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #f1f5f9' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Item Name</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', textAlign: 'center', width: '60px' }}>Qty</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', textAlign: 'right', width: '80px' }}>Price</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', textAlign: 'right', width: '100px' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 650, color: '#1e293b' }}>{item.itemName}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: '#475569' }}>{item.quantity}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', color: '#475569' }}>₹{item.priceAtPurchase}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            ₹{item.priceAtPurchase * item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total calculations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'flex-end', width: '240px', fontSize: '0.92rem', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Items Subtotal:</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 850, fontSize: '1.15rem', borderTop: '2px dashed #e2e8f0', paddingTop: '10px', color: 'var(--primary)' }}>
                  <span>Grand Total:</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" style={{ width: 'auto', padding: '10px 24px', borderRadius: '12px', fontWeight: 700 }} onClick={() => setShowOrderModal(false)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled block containing local classes */}
      <style>{`
        .admin-dashboard-container,
        .admin-dashboard-container * {
          box-sizing: border-box;
        }

        .admin-dashboard-container {
          width: 100%;
          max-width: 1300px;
          margin: 32px auto 64px auto;
          padding: 0 20px;
          font-family: 'Outfit', sans-serif;
          min-height: 80vh;
        }

        .admin-grid-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 40px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .admin-grid-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        /* Sidebar styling */
        .admin-sidebar {
          display: flex;
          flex-direction: column;
          padding: 24px 18px;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          border: 1px solid #f0f0f0;
          gap: 28px;
          margin: 0;
          align-self: start;
        }

        .admin-profile-section {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .admin-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #fff1f2;
          border: 1.5px solid #ffe4e6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          font-weight: 800;
          font-size: 1rem;
        }

        .admin-profile-info h3 {
          font-size: 0.95rem;
          font-weight: 750;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .admin-profile-info p {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
        }

        .admin-nav-links {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 12px 16px;
          border-radius: 12px;
          color: #64748b;
          font-weight: 650;
          font-size: 0.9rem;
          text-align: left;
          transition: all 0.2s ease;
          width: 100%;
        }

        .admin-nav-item:hover {
          background: #f8fafc;
          color: #0f172a;
          transform: translateX(3px);
        }

        .admin-nav-item.active {
          background: #fff5f5;
          color: var(--primary);
        }

        .admin-nav-item.active svg {
          stroke: var(--primary);
        }

        .vendor-icon-color {
          color: #06c169;
        }

        .admin-logout-btn {
          width: 100%;
          justify-content: center;
          padding: 12px;
          font-size: 0.85rem;
          border-radius: 12px;
          color: var(--primary);
          background: #fff5f5;
          border-color: rgba(179, 21, 34, 0.1);
        }

        .admin-logout-btn:hover {
          background: var(--primary);
          color: #ffffff;
        }

        /* Viewport content area */
        .admin-main-viewport {
          display: flex;
          flex-direction: column;
          gap: 48px;
          margin: 0;
          align-self: start;
          min-width: 0;
          width: 100%;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #f0f0f0;
          flex-wrap: wrap;
          gap: 16px;
        }

        .admin-role-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--primary);
          background: #fff5f5;
          padding: 3px 8px;
          border-radius: 50px;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .admin-title-area h1 {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .admin-title-area p {
          font-size: 0.88rem;
          color: #64748b;
          margin: 0;
        }

        /* Stats Cards */
        .stats-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px;
        }

        .stat-card {
          padding: 28px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid #f0f0f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.04);
        }

        .gradient-card-revenue {
          background: linear-gradient(135deg, var(--primary) 0%, #d42230 100%) !important;
          color: #ffffff !important;
          border: none !important;
        }

        .stat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-card-title {
          font-size: 0.85rem;
          font-weight: 650;
          color: #64748b;
        }

        .gradient-card-revenue .stat-card-title {
          color: rgba(255, 255, 255, 0.8);
        }

        .stat-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gradient-card-revenue .stat-icon-wrapper {
          background: rgba(255, 255, 255, 0.15);
        }

        .icon-bg-blue { background: #e0e7ff; }
        .icon-bg-red { background: #fee2e2; }
        .icon-bg-green { background: #dcfce7; }

        .stat-card-value {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .gradient-card-revenue .stat-card-value {
          color: #ffffff;
        }

        .stat-card-footer {
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
        }

        .stat-card-footer.text-muted {
          color: #94a3b8;
        }

        /* Overview layout */
        .overview-main-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .overview-main-layout {
            grid-template-columns: 1fr;
            gap: 28px;
          }
        }

        .chart-card {
          padding: 32px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid #f0f0f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .chart-title {
          font-size: 1.05rem;
          font-weight: 750;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .chart-subtitle {
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 36px;
        }

        .donut-chart-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          flex-wrap: wrap;
        }

        .donut-svg {
          transform: rotate(0deg);
          transition: transform 0.5s ease;
        }

        .donut-segment {
          transition: stroke-dashoffset 0.8s ease-in-out;
        }

        .donut-center-num {
          font-size: 1.85rem;
          font-weight: 800;
          fill: #0f172a;
          font-family: inherit;
        }

        .donut-center-label {
          font-size: 0.78rem;
          font-weight: 600;
          fill: #94a3b8;
          text-transform: uppercase;
          font-family: inherit;
        }

        .donut-legend {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .legend-color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .color-primary { background: var(--primary); }
        .color-accent { background: var(--accent-green); }

        .legend-text {
          font-size: 0.85rem;
          color: #475569;
        }

        /* Metric Progress Bars */
        .metric-bars-container {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .metric-bar-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .metric-bar-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 650;
          color: #475569;
        }

        .metric-bar-val {
          color: #0f172a;
          font-weight: 800;
        }

        .metric-progress-bg {
          height: 8px;
          width: 100%;
          background: #f1f5f9;
          border-radius: 50px;
          overflow: hidden;
        }

        .metric-progress-fill {
          height: 100%;
          border-radius: 50px;
          transition: width 1s ease-in-out;
        }

        .color-rev { background: var(--primary); }
        .color-orders { background: #4f46e5; }
        .color-vendors { background: #06c169; }

        .metric-description {
          font-size: 0.75rem;
          color: #94a3b8;
          font-style: italic;
        }

        /* Directory Tables */
        .data-table-tab {
          padding: 24px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }

        .table-actions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          border-bottom: 1.5px solid #f1f5f9;
          padding-bottom: 16px;
        }

        .table-actions-header.flex-column {
          flex-direction: column;
          align-items: flex-start;
        }

        .table-actions-header h2 {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }

        .custom-search {
          width: 100%;
          max-width: 340px;
        }

        .search-icon {
          position: absolute;
          left: 18px;
          color: #94a3b8;
        }

        .search-input-field {
          padding-left: 46px;
          height: 42px;
          font-size: 0.88rem;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
        }

        .search-input-field:focus {
          border-color: var(--primary);
          background: #ffffff;
        }

        .filters-bar-row {
          display: flex;
          gap: 20px;
          width: 100%;
          margin-top: 12px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 6px 14px;
          border-radius: 12px;
        }

        .filter-icon {
          color: #64748b;
        }

        .filter-title {
          font-size: 0.8rem;
          font-weight: 650;
          color: #475569;
        }

        .filter-select {
          border: none;
          background: transparent;
          font-size: 0.8rem;
          font-weight: 700;
          color: #0f172a;
          outline: none;
          cursor: pointer;
        }

        .status-toggle-buttons {
          display: flex;
          background: #e2e8f0;
          padding: 2px;
          border-radius: 8px;
        }

        .status-filter-btn {
          border: none;
          background: transparent;
          padding: 4px 10px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .status-filter-btn.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .table-responsive-wrapper {
          overflow-x: auto;
          width: 100%;
          max-width: 100%;
          display: block;
          -webkit-overflow-scrolling: touch;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .admin-table th {
          background: #f8fafc;
          padding: 12px 16px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          border-bottom: 1.5px solid #e2e8f0;
        }

        .admin-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.88rem;
          color: #1e293b;
        }

        .admin-table tbody tr:hover {
          background: #f8fafc;
        }

        .font-bold {
          font-weight: 700;
          color: #0f172a !important;
        }

        .role-chip {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .chip-user {
          background: #eff6ff;
          color: #1e40af;
        }

        .chip-vendor {
          background: #ecfdf5;
          color: #065f46;
        }

        .category-chip {
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 50px;
        }

        .open-badge {
          background: #ecfdf5;
          color: #15803d;
        }

        .closed-badge {
          background: #fef2f2;
          color: #b91c1c;
        }

        /* Pagination style */
        .pagination-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 16px;
        }

        .pagination-info {
          font-size: 0.82rem;
          color: #64748b;
        }

        .pagination-btn {
          width: auto;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 36px;
          padding: 6px 14px;
          font-size: 0.8rem;
          border-radius: 10px;
        }

        /* Loading / Empty States */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 0;
          color: #64748b;
          gap: 12px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f1f5f9;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spin-anim {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 0;
          color: #94a3b8;
          gap: 12px;
        }

        .empty-icon {
          stroke-width: 1.5;
        }

        /* General entrance animations */
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .animate-slide-up {
          opacity: 0;
          animation: slideUp 0.5s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .danger-btn {
          color: var(--primary) !important;
          border-color: rgba(179, 21, 34, 0.2) !important;
          background: #fff5f5 !important;
        }
        .danger-btn:hover {
          background: var(--primary) !important;
          color: #ffffff !important;
          border-color: var(--primary) !important;
        }
        .btn-green {
          background: var(--accent-green) !important;
          color: #ffffff !important;
          border: none !important;
        }
        .btn-green:hover {
          background: #05a057 !important;
          transform: translateY(-1px);
        }

        /* Order status badges */
        .order-status-badge {
          display: inline-block;
          font-weight: 800;
          font-size: 0.72rem;
          text-transform: uppercase;
        }
        .order-status-badge.PENDING {
          background: #fef3c7;
          color: #d97706;
        }
        .order-status-badge.ACCEPTED,
        .order-status-badge.CONFIRMED {
          background: #e0f2fe;
          color: #0284c7;
        }
        .order-status-badge.PREPARING {
          background: #e0e7ff;
          color: #4f46e5;
        }
        .order-status-badge.READY {
          background: #ecfdf5;
          color: #059669;
        }
        .order-status-badge.DELIVERED {
          background: #dcfce7;
          color: #15803d;
        }
        .order-status-badge.CANCELLED {
          background: #fee2e2;
          color: #b91c1c;
        }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        /* Modal Content */
        .modal-content {
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 28px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: slideUp 0.3s ease-out forwards;
          max-width: 600px;
          width: 90%;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1.5px solid #f1f5f9;
          padding-bottom: 16px;
        }

        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .close-modal-btn {
          border: none;
          background: none;
          font-size: 1.8rem;
          line-height: 1;
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .close-modal-btn:hover {
          color: #0f172a;
        }

        @media (max-width: 768px) {
          .admin-dashboard-container {
            margin: 16px auto 48px auto;
            padding: 0 12px;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }
          .admin-grid-layout {
            grid-template-columns: 1fr;
            gap: 16px;
            width: 100%;
            min-width: 0;
            max-width: 100%;
          }
          .admin-sidebar {
            flex-direction: column;
            padding: 16px;
            gap: 16px;
            border-radius: 16px;
            width: 100%;
            min-width: 0;
            max-width: 100%;
          }
          .admin-profile-section {
            width: 100%;
            padding-bottom: 12px;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
          }
          .admin-avatar {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            font-size: 0.85rem;
          }
          .admin-profile-info h3 {
            font-size: 0.85rem;
          }
          .admin-profile-info p {
            font-size: 0.75rem;
          }
          .admin-nav-links {
            flex-direction: row;
            overflow-x: auto;
            width: 100%;
            gap: 8px;
            padding-bottom: 4px;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }
          .admin-nav-item {
            padding: 10px 16px;
            white-space: nowrap;
            font-size: 0.82rem;
            flex-shrink: 0;
            width: auto;
            justify-content: center;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
          }
          .admin-nav-item.active {
            border-color: rgba(179, 21, 34, 0.1);
          }
          .admin-nav-item:hover {
            transform: none;
          }
          .admin-sidebar-footer {
            width: 100%;
            margin-top: 4px;
          }
          .admin-logout-btn {
            padding: 10px;
            font-size: 0.82rem;
          }
          .admin-header {
            padding: 16px 20px;
            border-radius: 16px;
            gap: 12px;
          }
          .admin-title-area h1 {
            font-size: 1.35rem;
          }
          .admin-title-area p {
            font-size: 0.8rem;
          }
          .stats-cards-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .stat-card {
            padding: 16px;
            border-radius: 16px;
            gap: 8px;
          }
          .stat-card-value {
            font-size: 1.45rem;
          }
          .stat-card-title {
            font-size: 0.8rem;
          }
          .donut-chart-container {
            flex-direction: column;
            gap: 20px;
          }
          .overview-main-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .data-table-tab {
            padding: 16px;
            border-radius: 16px;
            width: 100%;
            min-width: 0;
            max-width: 100%;
            overflow: hidden;
          }
          .table-actions-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .custom-search {
            max-width: 100%;
          }
          .filters-bar-row {
            flex-direction: column;
            gap: 10px;
            width: 100%;
          }
          .filter-group {
            width: 100%;
            justify-content: space-between;
          }
          .status-toggle-buttons {
            flex: 1;
            justify-content: space-between;
          }
          .status-filter-btn {
            flex: 1;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .stats-cards-grid {
            grid-template-columns: 1fr;
          }
          .admin-sidebar {
            padding: 12px;
          }
          .admin-profile-section {
            display: none;
          }
        }
      `}</style>

    </div>
  );
}
