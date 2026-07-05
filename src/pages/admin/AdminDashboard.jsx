import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  getAdminOrders,
  getAdminOrderById,
  getTopRestaurants,
  getPlatformSettingsAdmin,
  downloadOrderInvoice,
} from '../../api/admin.api';
import {
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  Users,
  Store,
  Calendar,
  ClipboardList,
  ChevronDown,
  FileDown,
  Loader2,
  Phone,
  Copy,
  MessageSquare,
  MessageCircle,
} from 'lucide-react';
import './AdminPortal.css';

const getWhatsAppLink = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const number = cleaned.length === 10 ? `91${cleaned}` : cleaned;
  return `https://wa.me/${number}`;
};

export default function AdminDashboard() {
  const { stats, fetchStats, statsLoading } = useOutletContext();
  const toast = useToast();

  const handleCopyToClipboard = (text, type = 'Phone number') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const [ordersList, setOrdersList] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersStatus, setOrdersStatus] = useState(''); // '' | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  const [tabLoading, setTabLoading] = useState(false);

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [downloadingInvoiceMap, setDownloadingInvoiceMap] = useState({});

  // Top restaurants states
  const [topRestaurantsList, setTopRestaurantsList] = useState([]);
  const [topRestaurantsLoading, setTopRestaurantsLoading] = useState(true);
  const [platformSettings, setPlatformSettings] = useState({
    deliveryCharge: 0,
    freeDeliveryAbove: 0,
    gstPercentage: 0,
    packagingCharge: 0
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await getPlatformSettingsAdmin();
        if (data.success && data.data) {
          setPlatformSettings({
            deliveryCharge: Number(data.data.deliveryCharge ?? 0),
            freeDeliveryAbove: Number(data.data.freeDeliveryAbove ?? 0),
            gstPercentage: Number(data.data.gstPercentage ?? 0),
            packagingCharge: Number(data.data.packagingCharge ?? 0)
          });
        }
      } catch (err) {
        console.error('Failed to fetch platform settings for admin dashboard', err);
      }
    };
    fetchSettings();
  }, []);

  const fetchTopRestaurants = useCallback(async () => {
    setTopRestaurantsLoading(true);
    try {
      const { data } = await getTopRestaurants();
      if (data.success) {
        setTopRestaurantsList(data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching top eateries');
    } finally {
      setTopRestaurantsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTopRestaurants();
  }, [fetchTopRestaurants]);

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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const handleDownloadInvoice = async (orderId, orderNumber) => {
    setDownloadingInvoiceMap((prev) => ({ ...prev, [orderId]: true }));
    try {
      const response = await downloadOrderInvoice(orderId);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Invoice #${orderNumber} downloaded successfully`);
    } catch (err) {
      console.error('Invoice download failed:', err);
      let errorMsg = 'Failed to download invoice';
      
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          errorMsg = parsed.message || errorMsg;
        } catch (e) {
          console.error('Failed to parse error blob:', e);
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      toast.error(errorMsg);
    } finally {
      setDownloadingInvoiceMap((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Custom ratios
  const avgOrderValue = stats.orderCount > 0 ? (stats.revenue / stats.orderCount).toFixed(2) : 0;
  const userEngagementRatio = stats.userCount > 0 ? (stats.orderCount / stats.userCount).toFixed(1) : 0;
  const restVendorRatio = stats.vendorCount > 0 ? (stats.restaurantCount / stats.vendorCount).toFixed(1) : 0;

  return (
    <div className="overview-tab-content">
      {/* Header */}
      <header className="admin-header card" style={{ marginBottom: '28px' }}>
        <div className="admin-title-area">
          <span className="admin-role-badge">SYSTEM CONTROL</span>
          <h1>Campus Administration</h1>
          <p>Monitor real-time revenue stats, users activity, vendors, and cafeteria status</p>
        </div>
        <button 
          className="btn btn-sm btn-outline refresh-btn" 
          onClick={() => {
            fetchStats();
            fetchOrders();
            fetchTopRestaurants();
            toast.success('Data refreshed successfully');
          }}
          disabled={statsLoading || tabLoading || topRestaurantsLoading}
          style={{ width: 'auto', gap: '6px' }}
        >
          <RefreshCw size={14} className={statsLoading || tabLoading ? 'spin-anim' : ''} />
          Refresh
        </button>
      </header>

      {statsLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Calculating system analytics...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
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

            {/* Right side metrics and widgets layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
              {/* Key Efficiency Ratios */}
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
                      <div 
                        className="metric-progress-fill color-vendors" 
                        style={{ width: `${Math.min((restVendorRatio / 2) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="metric-description">Average outlets run per manager</span>
                  </div>
                </div>
              </div>

              {/* Top Restaurants widget */}
              <div className="chart-card card animate-fade-in" style={{ animationDelay: '0.5s', padding: '24px' }}>
                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={18} style={{ color: '#b31522' }} />
                  <span>Top Eateries</span>
                </h3>
                <p className="chart-subtitle" style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 16px 0' }}>
                  Top 5 cafeterias by completed order revenue
                </p>

                {topRestaurantsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 0' }}>
                    <div style={{ height: '40px', background: '#f1f5f9', borderRadius: '10px', animation: 'pulseSoft 1.5s infinite' }}></div>
                    <div style={{ height: '40px', background: '#f1f5f9', borderRadius: '10px', animation: 'pulseSoft 1.5s infinite' }}></div>
                    <div style={{ height: '40px', background: '#f1f5f9', borderRadius: '10px', animation: 'pulseSoft 1.5s infinite' }}></div>
                  </div>
                ) : topRestaurantsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '0.85rem' }}>
                    No sales data available.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {topRestaurantsList.map((rest, index) => {
                      const name = Array.isArray(rest.restaurantName) ? rest.restaurantName[0] : (rest.restaurantName || 'Unknown eatery');
                      return (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span style={{ 
                              background: index === 0 ? '#fff5f5' : '#f8fafc',
                              color: index === 0 ? '#b31522' : '#64748b',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              #{index + 1}
                            </span>
                            <span style={{ 
                              fontWeight: 700, 
                              color: '#0f172a', 
                              fontSize: '0.85rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {name}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                              ₹{rest.totalRevenue.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {rest.totalOrders} {rest.totalOrders === 1 ? 'order' : 'orders'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Orders Management Directory */}
          <div className="data-table-tab card animate-fade-in" style={{ width: '100%' }}>
            <div className="table-actions-header">
              <h2>Recent Orders Ledger</h2>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
                {/* Desktop Tabs */}
                <div className="hide-mobile status-toggle-buttons">
                  <button
                    className={`status-filter-btn ${ordersStatus === '' ? 'active' : ''}`}
                    onClick={() => { setOrdersStatus(''); setOrdersPage(1); }}
                  >
                    ALL
                  </button>
                  <button
                    className={`status-filter-btn ${ordersStatus === 'PENDING' ? 'active' : ''}`}
                    onClick={() => { setOrdersStatus('PENDING'); setOrdersPage(1); }}
                  >
                    PENDING
                  </button>
                  <button
                    className={`status-filter-btn ${ordersStatus === 'PREPARING' ? 'active' : ''}`}
                    onClick={() => { setOrdersStatus('PREPARING'); setOrdersPage(1); }}
                  >
                    PREPARING
                  </button>
                  <button
                    className={`status-filter-btn ${ordersStatus === 'READY' ? 'active' : ''}`}
                    onClick={() => { setOrdersStatus('READY'); setOrdersPage(1); }}
                  >
                    READY
                  </button>
                  <button
                    className={`status-filter-btn ${ordersStatus === 'DELIVERED' ? 'active' : ''}`}
                    onClick={() => { setOrdersStatus('DELIVERED'); setOrdersPage(1); }}
                  >
                    DELIVERED
                  </button>
                  <button
                    className={`status-filter-btn ${ordersStatus === 'CANCELLED' ? 'active' : ''}`}
                    onClick={() => { setOrdersStatus('CANCELLED'); setOrdersPage(1); }}
                  >
                    CANCELLED
                  </button>
                </div>

                {/* Mobile Dropdown (Redesigned Custom Select) */}
                <div className="show-mobile custom-dropdown-container">
                  <button 
                    className="custom-dropdown-trigger" 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    type="button"
                  >
                    <span>{ordersStatus === '' ? 'ALL ORDERS' : ordersStatus}</span>
                    <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                  </button>
                  {isDropdownOpen && (
                    <>
                      <div className="custom-dropdown-backdrop" onClick={() => setIsDropdownOpen(false)}></div>
                      <ul className="custom-dropdown-menu">
                        <li 
                          className={ordersStatus === '' ? 'active' : ''} 
                          onClick={() => { setOrdersStatus(''); setOrdersPage(1); setIsDropdownOpen(false); }}
                        >
                          ALL ORDERS
                        </li>
                        <li 
                          className={ordersStatus === 'PENDING' ? 'active' : ''} 
                          onClick={() => { setOrdersStatus('PENDING'); setOrdersPage(1); setIsDropdownOpen(false); }}
                        >
                          PENDING
                        </li>
                        <li 
                          className={ordersStatus === 'PREPARING' ? 'active' : ''} 
                          onClick={() => { setOrdersStatus('PREPARING'); setOrdersPage(1); setIsDropdownOpen(false); }}
                        >
                          PREPARING
                        </li>
                        <li 
                          className={ordersStatus === 'READY' ? 'active' : ''} 
                          onClick={() => { setOrdersStatus('READY'); setOrdersPage(1); setIsDropdownOpen(false); }}
                        >
                          READY
                        </li>
                        <li 
                          className={ordersStatus === 'DELIVERED' ? 'active' : ''} 
                          onClick={() => { setOrdersStatus('DELIVERED'); setOrdersPage(1); setIsDropdownOpen(false); }}
                        >
                          DELIVERED
                        </li>
                        <li 
                          className={ordersStatus === 'CANCELLED' ? 'active' : ''} 
                          onClick={() => { setOrdersStatus('CANCELLED'); setOrdersPage(1); setIsDropdownOpen(false); }}
                        >
                          CANCELLED
                        </li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>

            {tabLoading ? (
              <div className="loading-container p-4">
                <div className="spinner"></div>
                <p>Searching ledger orders...</p>
              </div>
            ) : ordersList.length === 0 ? (
              <div className="empty-state">
                <ClipboardList size={48} className="empty-icon" />
                <p>No order transactions found.</p>
              </div>
            ) : (
              <>
                <div className="hide-mobile table-responsive-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Order Date</th>
                        <th>Total Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersList.map((ord) => (
                        <tr key={ord._id}>
                          <td className="font-bold">#{ord.orderNumber}</td>
                          <td>{ord.user?.username || 'Guest Customer'}</td>
                          <td className="text-muted text-sm">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} />
                              {new Date(ord.createdAt).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </div>
                          </td>
                          <td className="font-bold">₹{ord.totalAmount}</td>
                          <td>
                            <span className={`status-badge order-status-badge ${ord.orderStatus}`}>
                              {ord.orderStatus}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => handleViewOrderDetails(ord._id)}
                                style={{ width: 'auto', padding: '4px 10px', height: '30px', fontSize: '0.75rem' }}
                              >
                                View Details
                              </button>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => handleDownloadInvoice(ord._id, ord.orderNumber)}
                                disabled={downloadingInvoiceMap[ord._id]}
                                title="Download Invoice PDF"
                                style={{ 
                                  width: '30px', 
                                  height: '30px', 
                                  padding: 0, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  borderRadius: '8px'
                                }}
                              >
                                {downloadingInvoiceMap[ord._id] ? (
                                  <Loader2 size={14} className="spin-anim" />
                                ) : (
                                  <FileDown size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="show-mobile admin-mobile-cards-list">
                  {ordersList.map((ord) => (
                    <div className="admin-mobile-card" key={ord._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                          #{ord.orderNumber}
                        </span>
                        <span className={`status-badge order-status-badge ${ord.orderStatus}`}>
                          {ord.orderStatus}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Customer:</span>
                          <span style={{ fontWeight: 650, color: '#1e293b' }}>{ord.user?.username || 'Guest Customer'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Date:</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {new Date(ord.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #f1f5f9' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>Total:</span>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>₹{ord.totalAmount}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleViewOrderDetails(ord._id)}
                          style={{ flex: 1, height: '36px', borderRadius: '10px', fontSize: '0.8rem' }}
                        >
                          View Details
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleDownloadInvoice(ord._id, ord.orderNumber)}
                          disabled={downloadingInvoiceMap[ord._id]}
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            padding: 0, 
                            borderRadius: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                          title="Download Invoice PDF"
                        >
                          {downloadingInvoiceMap[ord._id] ? (
                            <Loader2 size={16} className="spin-anim" />
                          ) : (
                            <FileDown size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
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
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', padding: '20px 24px' }}>
            <div className="modal-header" style={{ paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Order details: #{selectedOrder.orderNumber}</h3>
              <button className="close-modal-btn" onClick={() => setShowOrderModal(false)}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
              {/* Customer Info Box */}
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="modal-grid-cols-2" style={{ gap: '8px 16px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Customer</span>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>
                      {selectedOrder.user?.username || 'Guest Customer'}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Phone</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <a 
                        href={`tel:${selectedOrder.customerPhone || selectedOrder.phone || selectedOrder.user?.phone}`}
                        style={{ margin: 0, fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none' }}
                      >
                        {selectedOrder.customerPhone || selectedOrder.phone || selectedOrder.user?.phone || '+91 98765 43210'}
                      </a>
                      
                      {/* Copy Button */}
                      {(selectedOrder.customerPhone || selectedOrder.phone || selectedOrder.user?.phone) && (
                        <button 
                          onClick={() => handleCopyToClipboard(selectedOrder.customerPhone || selectedOrder.phone || selectedOrder.user?.phone, 'Phone number')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'color 0.2s, background-color 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#1e293b'; e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          title="Copy Phone Number"
                        >
                          <Copy size={13} />
                        </button>
                      )}

                      {/* Call Icon Link */}
                      {(selectedOrder.customerPhone || selectedOrder.phone || selectedOrder.user?.phone) && (
                        <a 
                          href={`tel:${selectedOrder.customerPhone || selectedOrder.phone || selectedOrder.user?.phone}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            color: '#475569',
                            transition: 'transform 0.2s, background-color 0.2s, color 0.2s',
                            textDecoration: 'none'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = '#cbd5e1'; e.currentTarget.style.color = '#1e293b'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                          title="Call Customer"
                        >
                          <Phone size={12} />
                        </a>
                      )}

                      {/* SMS Icon Link */}
                      {(selectedOrder.customerPhone || selectedOrder.phone || selectedOrder.user?.phone) && (
                        <a 
                          href={`sms:${selectedOrder.customerPhone || selectedOrder.phone || selectedOrder.user?.phone}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            color: '#475569',
                            transition: 'transform 0.2s, background-color 0.2s, color 0.2s',
                            textDecoration: 'none'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = '#cbd5e1'; e.currentTarget.style.color = '#1e293b'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                          title="SMS Customer"
                        >
                          <MessageSquare size={12} />
                        </a>
                      )}

                      {/* WhatsApp Icon Link */}
                      {(selectedOrder.customerPhone || selectedOrder.phone || selectedOrder.user?.phone) && (
                        <a 
                          href={getWhatsAppLink(selectedOrder.customerPhone || selectedOrder.phone || selectedOrder.user?.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#e6f4ea',
                            color: '#137333',
                            transition: 'transform 0.2s, background-color 0.2s, color 0.2s',
                            textDecoration: 'none'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = '#ceead6'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#e6f4ea'; }}
                          title="WhatsApp Customer"
                        >
                          <MessageCircle size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '8px', borderTop: '1px solid #edf2f7', paddingTop: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Deliver To</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 600, color: '#1e293b', fontSize: '0.82rem' }}>
                    {selectedOrder.address || selectedOrder.user?.address || 'Hostel Block 3, Room 204'}
                  </p>
                </div>
              </div>

              {/* Items Summary (compact & scrollable) */}
              <div style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px 0', margin: '4px 0' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Items Summary</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => {
                    const price = item.priceAtPurchase || item.price || 0;
                    const name = item.menuItem?.name || item.itemName || 'Unknown Item';
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.menuItem?.image ? (
                            <img 
                              src={item.menuItem.image} 
                              alt={name} 
                              style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>🍽️</div>
                          )}
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>{name}</p>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>₹{price} &times; {item.quantity}</p>
                          </div>
                        </div>
                        <span style={{ fontWeight: 750, fontSize: '0.82rem', color: '#0f172a' }}>₹{price * item.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invoice Breakdown */}
              {(() => {
                const subTotal = selectedOrder.items ? selectedOrder.items.reduce((total, item) => total + ((item.priceAtPurchase || item.price || 0) * item.quantity), 0) : selectedOrder.totalAmount;
                const discount = selectedOrder.discountAmount || 0;
                const subTotalAfterDiscount = subTotal - discount;

                const gst = selectedOrder.gstAmount !== undefined && selectedOrder.gstAmount !== null && selectedOrder.gstAmount !== 0 ? selectedOrder.gstAmount : Math.round((subTotalAfterDiscount * platformSettings.gstPercentage) / 100);
                const packaging = selectedOrder.packagingCharge !== undefined && selectedOrder.packagingCharge !== null && selectedOrder.packagingCharge !== 0 ? selectedOrder.packagingCharge : platformSettings.packagingCharge;
                const delivery = selectedOrder.deliveryCharge !== undefined && selectedOrder.deliveryCharge !== null && selectedOrder.deliveryCharge !== 0 ? selectedOrder.deliveryCharge : (subTotalAfterDiscount >= platformSettings.freeDeliveryAbove ? 0 : platformSettings.deliveryCharge);

                const hasBreakdown = gst > 0 || packaging > 0 || delivery > 0 || discount > 0;

                if (!hasBreakdown) return null;

                return (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '1px solid #edf2f7', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{subTotal}</span>
                    </div>
                    {discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Coupon Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                        <span style={{ color: '#06c169', fontWeight: 700 }}>-₹{discount}</span>
                      </div>
                    )}
                    {gst > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>GST ({selectedOrder.gstPercentage ?? platformSettings.gstPercentage}%)</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{gst}</span>
                      </div>
                    )}
                    {packaging > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Packaging Charge</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{packaging}</span>
                      </div>
                    )}
                    {delivery > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Delivery Charge</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{delivery}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Order Transaction Grid */}
              <div className="modal-grid-cols-2" style={{ gap: '8px 16px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Payment Mode</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>{selectedOrder.paymentMethod || 'CASH'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Total Paid</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 850, color: 'var(--primary)', fontSize: '1.1rem' }}>₹{selectedOrder.totalAmount}</p>
                </div>
              </div>

              <div className="modal-grid-cols-2" style={{ gap: '8px 16px', marginTop: '4px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Placed On</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>{new Date(selectedOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Status</span>
                  <span className={`status-badge order-status-badge ${selectedOrder.orderStatus}`} style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                style={{ 
                  width: 'auto', 
                  padding: '8px 20px', 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  height: '36px', 
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }} 
                onClick={() => handleDownloadInvoice(selectedOrder._id, selectedOrder.orderNumber)}
                disabled={downloadingInvoiceMap[selectedOrder._id]}
              >
                {downloadingInvoiceMap[selectedOrder._id] ? (
                  <>
                    <Loader2 size={14} className="spin-anim" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <FileDown size={14} />
                    <span>Download Invoice</span>
                  </>
                )}
              </button>
              <button className="btn btn-outline" style={{ width: 'auto', padding: '8px 20px', borderRadius: '10px', fontWeight: 700, height: '36px', fontSize: '0.8rem' }} onClick={() => setShowOrderModal(false)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
