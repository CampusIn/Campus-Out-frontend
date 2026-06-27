import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  getAdminOrders,
  getAdminOrderById,
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
} from 'lucide-react';
import './AdminPortal.css';

export default function AdminDashboard() {
  const { stats, fetchStats, statsLoading } = useOutletContext();
  const toast = useToast();

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
            toast.success('Data refreshed successfully');
          }}
          disabled={statsLoading || tabLoading}
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
                              {new Date(ord.createdAt).toLocaleString(undefined, {
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
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => handleViewOrderDetails(ord._id)}
                              style={{ width: 'auto', padding: '4px 10px', height: '30px', fontSize: '0.75rem' }}
                            >
                              View Details
                            </button>
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
                            {new Date(ord.createdAt).toLocaleString(undefined, {
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
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleViewOrderDetails(ord._id)}
                        style={{ width: '100%', height: '36px', borderRadius: '10px', fontSize: '0.8rem' }}
                      >
                        View Details
                      </button>
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
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="modal-grid-cols-2" style={{ gap: '8px 16px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Customer</span>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>{selectedOrder.user?.username || 'Guest Customer'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Phone</span>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>{selectedOrder.phone || selectedOrder.user?.phone || '+91 98765 43210'}</p>
                  </div>
                </div>
                <div style={{ marginTop: '8px', borderTop: '1px solid #edf2f7', paddingTop: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Deliver To</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 600, color: '#1e293b', fontSize: '0.82rem' }}>{selectedOrder.address || 'Hostel Block 3, Room 204'}</p>
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
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>{new Date(selectedOrder.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Status</span>
                  <span className={`status-badge order-status-badge ${selectedOrder.orderStatus}`} style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
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
