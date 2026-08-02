import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  getAdminOrders,
  getAdminOrderById,
  getTopRestaurants,
  getPlatformSettingsAdmin,
  downloadOrderInvoice,
} from '../../api/admin.api';

import { DollarSign, Store, FileDown, Loader2, Phone, UserPlus, Search, ChevronLeft, ChevronRight, RefreshCw, ShoppingBag, Users, Calendar, ClipboardList, ChevronDown, Copy, MessageSquare, X, Package, Tag } from 'lucide-react';
import {
  getAdminMarketplaceOrders,
  getAdminMarketplaceOrderById,
  updateAdminMarketplaceOrderStatus,
  assignAdminMarketplaceDeliveryPartner,
  downloadAdminMarketplaceOrderInvoice,
} from '../../api/marketplace.api';
import { ConfirmModal } from '../../components/ConfirmModal';
import { getMarketPlaceDashboard, getTopMarketPlaceProducts, getTopMarketPlaceCategories } from '../../api/admin.api';
import { viewDeliveryPartners } from '../../api/delivery.api';
import Combobox from '../../components/Combobox';
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
  const [dashboardServiceType, setDashboardServiceType] = useState('food'); // 'food' | 'marketplace'

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [downloadingInvoiceMap, setDownloadingInvoiceMap] = useState({});

  // Marketplace order status management & DP assignment
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [rejectionMsgInput, setRejectionMsgInput] = useState('');
  const [isRejectingMarketplace, setIsRejectingMarketplace] = useState(false);
  const [partnerIdInput, setPartnerIdInput] = useState('');
  const [assignDeliveryOpen, setAssignDeliveryOpen] = useState(false);
  const [assigningPartner, setAssigningPartner] = useState(false);
  const [deliveryPartners, setDeliveryPartners] = useState([]);

  const fetchDeliveryPartners = async () => {
    try {
      const { data } = await viewDeliveryPartners();
      if (data.success && data.data) {
        setDeliveryPartners(data.data || []);
      } else {
        setDeliveryPartners([]);
      }
    } catch (err) {
      console.error('Failed to fetch delivery partners', err);
    }
  };

  const partnerOptions = useMemo(() => {
    return deliveryPartners.map(p => ({
      value: p._id,
      label: `${p.user?.username || 'Partner'} (${p.phoneNumber})`,
      description: `Vehicle: ${p.vehicleNumber}`
    }));
  }, [deliveryPartners]);

  // Top restaurants states
  const [topRestaurantsList, setTopRestaurantsList] = useState([]);
  const [topRestaurantsLoading, setTopRestaurantsLoading] = useState(true);

  // Marketplace stats states
  const [marketplaceStats, setMarketplaceStats] = useState({
    totalRevenue: 0,
    todaysRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    categoriesCount: 0,
  });
  const [marketplaceStatsLoading, setMarketplaceStatsLoading] = useState(false);
  const [revenueCardFlipped, setRevenueCardFlipped] = useState(false);
  const [topProducts, setTopProducts] = useState([]);
  const [showAllTopProducts, setShowAllTopProducts] = useState(false);
  const [topCategories, setTopCategories] = useState([]);
  const [showAllTopCategories, setShowAllTopCategories] = useState(false);

  const [platformSettings, setPlatformSettings] = useState({
    deliveryCharge: 0,
    freeDeliveryAbove: 0,
    gstPercentage: 0,
    packagingCharge: 0
  });

  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDestructive: false,
    onConfirm: () => { }
  });

  const openConfirmModal = (options) => {
    setConfirmModalState({
      isOpen: true,
      ...options
    });
  };

  const closeConfirmModal = () => {
    setConfirmModalState(prev => ({ ...prev, isOpen: false }));
  };

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
    fetchDeliveryPartners();
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

  const fetchMarketplaceDashboard = useCallback(async () => {
    setMarketplaceStatsLoading(true);
    try {
      const [statsRes, productsRes, categoriesRes] = await Promise.all([
        getMarketPlaceDashboard(),
        getTopMarketPlaceProducts(),
        getTopMarketPlaceCategories()
      ]);
      if (statsRes.data.success) {
        setMarketplaceStats({
          totalRevenue: statsRes.data.data.overviewCards?.revenue || 0,
          todaysRevenue: statsRes.data.data.overviewCards?.todaysRevenue || 0,
          totalOrders: statsRes.data.data.overviewCards?.completedOrders || 0,
          totalProducts: statsRes.data.data.overviewCards?.productsListed || 0,
          categoriesCount: statsRes.data.data.overviewCards?.categories?.length || 0,
        });
      }
      if (productsRes.data.success) {
        setTopProducts(productsRes.data.data || []);
      }
      if (categoriesRes.data.success) {
        setTopCategories(categoriesRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching marketplace stats:', err);
    } finally {
      setMarketplaceStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dashboardServiceType === 'marketplace') {
      fetchMarketplaceDashboard();
    }
  }, [dashboardServiceType, fetchMarketplaceDashboard]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setTabLoading(true);
    try {
      const { data } = await (dashboardServiceType === 'food'
        ? getAdminOrders({
          status: ordersStatus || undefined,
          page: ordersPage,
          limit: 8,
        })
        : getAdminMarketplaceOrders({
          status: ordersStatus || undefined,
          page: ordersPage,
          limit: 8,
        }));
      if (data.success) {
        setOrdersList(data.data.orders || []);
        setOrdersTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching orders');
    } finally {
      setTabLoading(false);
    }
  }, [ordersStatus, ordersPage, dashboardServiceType, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // View order details in modal
  const handleViewOrderDetails = async (orderId) => {
    setOrderDetailLoading(true);
    try {
      const { data } = await (dashboardServiceType === 'food'
        ? getAdminOrderById(orderId)
        : getAdminMarketplaceOrderById(orderId));
      if (data.success) {
        setSelectedOrder(data.data.order);
        setRejectionMsgInput(data.data.order.rejectionMsg || '');
        setIsRejectingMarketplace(false);
        setPartnerIdInput('');
        setAssignDeliveryOpen(false);
        setShowOrderModal(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching order details');
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleUpdateMarketplaceOrderStatus = async (orderId, newStatus) => {
    if (newStatus === 'REJECTED' && !rejectionMsgInput.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }

    setStatusUpdating(true);
    try {
      const payload = { orderStatus: newStatus };
      if (newStatus === 'REJECTED') {
        payload.rejectionMsg = rejectionMsgInput;
      }
      const { data } = await updateAdminMarketplaceOrderStatus(orderId, payload);
      if (data.success) {
        toast.success(`Marketplace order marked as ${newStatus} successfully!`);
        setIsRejectingMarketplace(false);
        setRejectionMsgInput('');
        // Refresh modal data
        const updated = await getAdminMarketplaceOrderById(orderId);
        if (updated.data.success) {
          setSelectedOrder(updated.data.order);
        }
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssignMarketplaceDeliveryPartner = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!partnerIdInput) {
      toast.error('Please select a Delivery Partner');
      return;
    }

    setAssigningPartner(true);
    try {
      const { data } = await assignAdminMarketplaceDeliveryPartner(selectedOrder._id, {
        deliveryPartnerId: partnerIdInput
      });
      if (data.success) {
        toast.success('Delivery partner assigned successfully!');
        setAssignDeliveryOpen(false);
        setPartnerIdInput('');
        // Refresh modal data
        const updated = await getAdminMarketplaceOrderById(selectedOrder._id);
        if (updated.data.success) {
          setSelectedOrder(updated.data.order);
        }
        fetchOrders();
        await fetchDeliveryPartners();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign delivery partner');
    } finally {
      setAssigningPartner(false);
    }
  };

  const handleDownloadInvoice = async (orderId, orderNumber) => {
    setDownloadingInvoiceMap((prev) => ({ ...prev, [orderId]: true }));
    try {
      const response = await (dashboardServiceType === 'food'
        ? downloadOrderInvoice(orderId)
        : downloadAdminMarketplaceOrderInvoice(orderId));

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
      <header className="admin-header card" style={{ marginBottom: '20px' }}>
        <div className="admin-title-area">
          <span className="admin-role-badge">SYSTEM CONTROL</span>
          <h1>Campus Administration</h1>
          <p>Monitor real-time revenue stats, users activity, vendors, and cafeteria status</p>
        </div>
        <button
          className="btn btn-sm btn-outline refresh-btn"
          onClick={() => {
            if (dashboardServiceType === 'food') {
              fetchStats();
              fetchTopRestaurants();
            } else {
              fetchMarketplaceDashboard();
            }
            fetchOrders();
            toast.success('Data refreshed successfully');
          }}
          disabled={statsLoading || tabLoading || topRestaurantsLoading || marketplaceStatsLoading}
          style={{ width: 'auto', gap: '6px' }}
        >
          <RefreshCw size={14} className={statsLoading || tabLoading ? 'spin-anim' : ''} />
          Refresh
        </button>
      </header>

      {/* Sliding Toggle Control for Service Type */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
        <div style={{
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '30px',
          display: 'inline-flex',
          border: '1.5px solid #e2e8f0',
          cursor: 'pointer',
          userSelect: 'none',
          gap: '4px'
        }}>
          <button
            onClick={() => {
              setDashboardServiceType('food');
              setOrdersPage(1);
            }}
            style={{
              border: 'none',
              background: dashboardServiceType === 'food' ? 'var(--primary)' : 'transparent',
              color: dashboardServiceType === 'food' ? '#ffffff' : '#64748b',
              padding: '10px 20px',
              borderRadius: '26px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Store size={16} />
            Food Orders
          </button>

          <button
            onClick={() => {
              setDashboardServiceType('marketplace');
              setOrdersPage(1);
            }}
            style={{
              border: 'none',
              background: dashboardServiceType === 'marketplace' ? 'var(--primary)' : 'transparent',
              color: dashboardServiceType === 'marketplace' ? '#ffffff' : '#64748b',
              padding: '10px 20px',
              borderRadius: '26px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <ShoppingBag size={16} />
            Marketplace Orders
          </button>
        </div>
      </div>

      {statsLoading || marketplaceStatsLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Calculating system analytics...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div className="overview-main-layout">

            {dashboardServiceType === 'marketplace' ? (
              <>
                <div className="stats-cards-grid">
                  <div className="flip-card-container animate-slide-up" onClick={() => setRevenueCardFlipped(!revenueCardFlipped)}>
                    <div className={`flip-card-inner ${revenueCardFlipped ? 'flipped' : ''}`}>
                      
                      {/* Front: Today's Revenue */}
                      <div className="flip-card-front">
                        <div className="stat-card-header">
                          <span className="stat-card-title" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Today's Revenue</span>
                          <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
                            <DollarSign size={22} color="#ffffff" />
                          </div>
                        </div>
                        <div>
                          <div className="stat-card-value" style={{ color: '#ffffff', marginBottom: '4px' }}>
                            ₹{(marketplaceStats?.todaysRevenue || 0).toLocaleString()}
                          </div>
                          <div className="stat-card-footer" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                            <span>Revenue generated today</span>
                          </div>
                        </div>
                        <div className="flip-hint-badge">
                          <span>Click to Flip</span>
                        </div>
                      </div>

                      {/* Back: Marketplace Revenue (Total) */}
                      <div className="flip-card-back">
                        <div className="stat-card-header">
                          <span className="stat-card-title" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Marketplace Revenue</span>
                          <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
                            <DollarSign size={22} color="#ffffff" />
                          </div>
                        </div>
                        <div>
                          <div className="stat-card-value" style={{ color: '#ffffff', marginBottom: '4px' }}>
                            ₹{(marketplaceStats?.totalRevenue || 0).toLocaleString()}
                          </div>
                          <div className="stat-card-footer" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                            <span>Total from delivered orders</span>
                          </div>
                        </div>
                        <div className="flip-hint-badge">
                          <span>Click to Flip</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="stat-card card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-card-header">
                      <span className="stat-card-title">Marketplace Orders</span>
                      <div className="stat-icon-wrapper icon-bg-blue">
                        <ShoppingBag size={22} color="#4f46e5" />
                      </div>
                    </div>
                    <div className="stat-card-value">{marketplaceStats?.totalOrders || 0}</div>
                    <div className="stat-card-footer text-muted">
                      <span>Completed marketplace orders</span>
                    </div>
                  </div>

                  <div className="stat-card card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="stat-card-header">
                      <span className="stat-card-title">Total Products</span>
                      <div className="stat-icon-wrapper icon-bg-red">
                        <Package size={22} color="#b31522" />
                      </div>
                    </div>
                    <div className="stat-card-value">{marketplaceStats?.totalProducts || 0}</div>
                    <div className="stat-card-footer text-muted">
                      <span>Available products</span>
                    </div>
                  </div>

                  <div className="stat-card card animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <div className="stat-card-header">
                      <span className="stat-card-title">Categories</span>
                      <div className="stat-icon-wrapper icon-bg-green">
                        <ClipboardList size={22} color="#06c169" />
                      </div>
                    </div>
                    <div className="stat-card-value">{marketplaceStats?.categoriesCount || 0}</div>
                    <div className="stat-card-footer text-muted">
                      <span>Active categories</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', width: '100%' }}>
                  <div className="chart-card card animate-fade-in" style={{ animationDelay: '0.4s', padding: '24px' }}>
                    <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={18} style={{ color: '#b31522' }} />
                      <span>Top Marketplace Products</span>
                    </h3>

                    {topProducts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '0.85rem' }}>
                        No product data available.
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                          {topProducts.slice(0, 3).map((prod, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                <span style={{
                                  background: index === 0 ? '#fff5f5' : '#f8fafc',
                                  color: index === 0 ? '#b31522' : '#64748b',
                                  fontWeight: 800, fontSize: '0.8rem', width: '24px', height: '24px',
                                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                  #{index + 1}
                                </span>
                                <img 
                                  src={prod.productImage || 'https://via.placeholder.com/24'} 
                                  alt={prod.productName} 
                                  style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
                                />
                                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {prod.productName || 'Unknown Product'}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                                  ₹{(prod.totalRevenue || 0).toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {prod.totalSold || 0} sold
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {topProducts.length > 3 && (
                          <button 
                            className="btn btn-outline btn-sm"
                            style={{ width: '100%', marginTop: '16px', borderRadius: '8px', padding: '8px' }}
                            onClick={() => setShowAllTopProducts(true)}
                          >
                            View All {topProducts.length} Products
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="chart-card card animate-fade-in" style={{ animationDelay: '0.5s', padding: '24px' }}>
                    <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ClipboardList size={18} style={{ color: '#06c169' }} />
                      <span>Top Marketplace Categories</span>
                    </h3>

                    {topCategories.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '0.85rem' }}>
                        No category data available.
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                          {topCategories.slice(0, 3).map((cat, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                <span style={{
                                  background: index === 0 ? '#f0fdf4' : '#f8fafc',
                                  color: index === 0 ? '#16a34a' : '#64748b',
                                  fontWeight: 800, fontSize: '0.8rem', width: '24px', height: '24px',
                                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                  #{index + 1}
                                </span>
                                <div style={{
                                  width: '24px', height: '24px', borderRadius: '4px', background: '#f1f5f9',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <Tag size={14} color="#64748b" />
                                </div>
                                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {cat.categoryName || 'Unknown Category'}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                                  ₹{(cat.totalRevenue || 0).toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {cat.totalOrders || 0} orders
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {topCategories.length > 3 && (
                          <button 
                            className="btn btn-outline btn-sm"
                            style={{ width: '100%', marginTop: '16px', borderRadius: '8px', padding: '8px' }}
                            onClick={() => setShowAllTopCategories(true)}
                          >
                            View All {topCategories.length} Categories
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="stats-cards-grid">
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
                  <div className="chart-card card animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <h3 className="chart-title">Key Efficiency Ratios</h3>
                    <p className="chart-subtitle">Calculated operational metric indicators</p>

                    <div className="metric-bars-container">
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
              </>
            )}

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
                      {ordersList.map((ord) => {
                        const total = ord.pricing?.finalAmount || ord.totalAmount;
                        return (
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
                            <td className="font-bold">₹{total}</td>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="show-mobile admin-mobile-cards-list">
                  {ordersList.map((ord) => {
                    const total = ord.pricing?.finalAmount || ord.totalAmount;
                    return (
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
                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>₹{total}</span>
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
                    );
                  })}
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
                          <MessageSquare size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '8px', borderTop: '1px solid #edf2f7', paddingTop: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Deliver To</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 600, color: '#1e293b', fontSize: '0.82rem' }}>
                    {selectedOrder.deliveryAddressSnapShot || selectedOrder.address || selectedOrder.user?.address || 'Hostel Block 3, Room 204'}
                  </p>
                </div>
              </div>

              {/* Items Summary (compact & scrollable) */}
              <div style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '8px 0', margin: '4px 0' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Items Summary</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => {
                    const price = item.priceAtPurchase || item.price || 0;
                    const name = dashboardServiceType === 'food' ? (item.menuItem?.name || item.itemName || 'Unknown Item') : item.productName;
                    const image = dashboardServiceType === 'food' ? item.menuItem?.image : item.productImage;
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {image ? (
                            <img
                              src={image}
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
              {dashboardServiceType === 'food' ? (() => {
                if (selectedOrder.pricing) {
                  const p = selectedOrder.pricing;
                  const discount = p.couponDiscount || p.discountAmount || 0;
                  return (
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '1px solid #edf2f7', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{p.subTotal}</span>
                      </div>
                      {discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Coupon Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                          <span style={{ color: '#06c169', fontWeight: 700 }}>-₹{discount}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>GST ({p.gstPercentage}%)</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{p.gstAmount}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Packaging Charge</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{p.packagingCharge}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Delivery Charge</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{p.deliveryCharge}</span>
                      </div>
                    </div>
                  );
                }

                const subTotal = selectedOrder.items ? selectedOrder.items.reduce((total, item) => total + ((item.priceAtPurchase || item.price || 0) * item.quantity), 0) : selectedOrder.totalAmount;
                const discount = selectedOrder.discountAmount || 0;
                const subTotalAfterDiscount = subTotal - discount;

                const gst = selectedOrder.gstAmount !== undefined && selectedOrder.gstAmount !== null ? selectedOrder.gstAmount : Math.round((subTotalAfterDiscount * platformSettings.gstPercentage) / 100);
                const packaging = selectedOrder.packagingCharge !== undefined && selectedOrder.packagingCharge !== null ? selectedOrder.packagingCharge : platformSettings.packagingCharge;
                const delivery = selectedOrder.deliveryCharge !== undefined && selectedOrder.deliveryCharge !== null ? selectedOrder.deliveryCharge : (subTotalAfterDiscount >= platformSettings.freeDeliveryAbove ? 0 : platformSettings.deliveryCharge);

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
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>GST ({selectedOrder.gstPercentage ?? platformSettings.gstPercentage}%)</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{gst}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Packaging Charge</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{packaging}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Delivery Charge</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{delivery}</span>
                    </div>
                  </div>
                );
              })() : (
                selectedOrder.pricing && (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '1px solid #edf2f7', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{selectedOrder.pricing.subTotal}</span>
                    </div>
                    {selectedOrder.pricing.couponDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Coupon Discount</span>
                        <span style={{ color: '#06c169', fontWeight: 700 }}>-₹{selectedOrder.pricing.couponDiscount}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>GST ({selectedOrder.pricing.gstPercentage}%)</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{selectedOrder.pricing.gstAmount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Packaging Charge</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{selectedOrder.pricing.packagingCharge}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Delivery Charge</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{selectedOrder.pricing.deliveryCharge}</span>
                    </div>
                  </div>
                )
              )}

              {/* Order Transaction Grid */}
              <div className="modal-grid-cols-2" style={{ gap: '8px 16px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Payment Mode</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>{selectedOrder.paymentMethod || 'CASH'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Total Paid</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 850, color: 'var(--primary)', fontSize: '1.1rem' }}>
                    ₹{selectedOrder.pricing?.finalAmount || selectedOrder.totalAmount}
                  </p>
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

              {/* Marketplace specific status update & delivery partner assignment */}
              {dashboardServiceType === 'marketplace' && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Status header & actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #edf2f7' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Update Status</span>

                    {!['DELIVERED', 'CANCELLED', 'REJECTED'].includes(selectedOrder.orderStatus) ? (
                      <div>
                        {selectedOrder.orderStatus === 'PENDING' ? (
                          !isRejectingMarketplace ? (
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{
                                  flex: '1 1 120px', minHeight: '48px',
                                  padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, borderRadius: '12px', fontSize: '0.82rem', background: 'var(--primary)', color: '#ffffff', border: 'none', opacity: statusUpdating ? 0.7 : 1
                                }}
                                onClick={() => {
                                  openConfirmModal({
                                    title: 'Accept Order',
                                    message: 'Are you sure you want to accept this order?',
                                    confirmText: 'Accept Order',
                                    isDestructive: false,
                                    onConfirm: () => handleUpdateMarketplaceOrderStatus(selectedOrder._id, 'CONFIRMED')
                                  });
                                }}
                                disabled={statusUpdating}
                              >
                                Accept Order
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{
                                  flex: '1 1 120px',
                                  borderColor: '#dc2626',
                                  color: '#dc2626',
                                  padding: '10px 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontWeight: 700,
                                  borderRadius: '12px',
                                  fontSize: '0.82rem',
                                  minHeight: '48px',
                                  background: 'transparent'
                                }}
                                onClick={() => setIsRejectingMarketplace(true)}
                                disabled={statusUpdating}
                              >
                                Reject Order
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                              <textarea
                                placeholder="Please enter a reason for rejecting this order..."
                                value={rejectionMsgInput}
                                onChange={(e) => setRejectionMsgInput(e.target.value)}
                                style={{
                                  width: '100%',
                                  height: '80px',
                                  borderRadius: '12px',
                                  border: '1.5px solid #cbd5e1',
                                  padding: '10px',
                                  outline: 'none',
                                  resize: 'none',
                                  fontSize: '0.85rem'
                                }}
                              />
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  style={{
                                    flex: '1 1 120px',
                                    minHeight: '48px',
                                    padding: '10px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    borderRadius: '12px',
                                    fontSize: '0.82rem',
                                    borderColor: '#64748b',
                                    color: '#64748b',
                                    background: 'transparent'
                                  }}
                                  onClick={() => {
                                    setIsRejectingMarketplace(false);
                                    setRejectionMsgInput('');
                                  }}
                                  disabled={statusUpdating}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  style={{
                                    flex: '1 1 120px', minHeight: '48px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, borderRadius: '12px', background: '#dc2626', color: '#ffffff', fontSize: '0.82rem', border: 'none', opacity: (statusUpdating || !rejectionMsgInput.trim()) ? 0.7 : 1
                                  }}
                                  onClick={() => {
                                    openConfirmModal({
                                      title: 'Reject Order',
                                      message: 'Are you sure you want to reject this order?',
                                      confirmText: 'Reject Order',
                                      isDestructive: true,
                                      onConfirm: () => handleUpdateMarketplaceOrderStatus(selectedOrder._id, 'REJECTED')
                                    });
                                  }}
                                  disabled={statusUpdating || !rejectionMsgInput.trim()}
                                >
                                  Confirm Reject
                                </button>
                              </div>
                            </div>
                          )
                        ) : (
                          (() => {
                            const transitionMap = {
                              'CONFIRMED': { next: 'PREPARING', label: 'Prepare Order' },
                              'PREPARING': { next: 'READY', label: 'Mark Ready' },
                              'READY': { next: 'OUT_FOR_DELIVERY', label: 'Out For Delivery' },
                              'OUT_FOR_DELIVERY': { next: 'DELIVERED', label: 'Mark Delivered' }
                            };
                            const transition = transitionMap[selectedOrder.orderStatus];
                            if (!transition) return null;
                            return (
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{
                                  width: '100%', minHeight: '48px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, borderRadius: '12px', fontSize: '0.85rem', background: 'var(--primary)', color: '#ffffff', border: 'none', opacity: statusUpdating ? 0.7 : 1
                                }}
                                onClick={() => {
                                  openConfirmModal({
                                    title: transition.label,
                                    message: `Are you sure you want to ${transition.label.toLowerCase()}?`,
                                    confirmText: 'Confirm',
                                    isDestructive: false,
                                    onConfirm: () => handleUpdateMarketplaceOrderStatus(selectedOrder._id, transition.next)
                                  });
                                }}
                                disabled={statusUpdating}
                              >
                                {transition.label}
                              </button>
                            );
                          })()
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', display: 'block' }}>
                        This order has been {selectedOrder.orderStatus.toLowerCase()}. No further actions can be taken.
                      </span>
                    )}

                    {selectedOrder.orderStatus === 'REJECTED' && selectedOrder.rejectionMsg && (
                      <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '0.82rem' }}>
                        <strong style={{ display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontSize: '0.7rem', color: '#b91c1c' }}>Rejection Reason:</strong>
                        {selectedOrder.rejectionMsg}
                      </div>
                    )}
                  </div>

                  {/* Delivery Partner Details & Assignment */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      Delivery Partner Assignment
                    </span>
                    {selectedOrder.deliveryPartner ? (
                      <div style={{ fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 700, color: '#1e293b', display: 'block' }}>
                          Partner: {selectedOrder.deliveryPartner.user?.username || 'Assigned'}
                        </span>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>
                          Vehicle: {selectedOrder.deliveryPartner.vehicleNumber} &bull; Phone: {selectedOrder.deliveryPartner.phoneNumber}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.85rem', display: 'flex', alignItems: 'center', height: '30px' }}>Unassigned</span>
                          {['CONFIRMED', 'PREPARING', 'READY'].includes(selectedOrder.orderStatus) && !assignDeliveryOpen && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => setAssignDeliveryOpen(true)}
                              style={{ padding: '4px 12px', height: '30px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', borderRadius: '9999px' }}
                            >
                              <UserPlus size={14} />
                              <span>Assign Partner</span>
                            </button>
                          )}
                        </div>

                        {assignDeliveryOpen && (
                          <form onSubmit={handleAssignMarketplaceDeliveryPartner} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                            <Combobox
                              placeholder="Select Partner..."
                              options={partnerOptions}
                              value={partnerIdInput}
                              onChange={(val) => setPartnerIdInput(val)}
                              disabled={assigningPartner}
                              style={{ flex: 1, minWidth: '160px' }}
                            />
                            <button
                              type="submit"
                              className="btn btn-primary"
                              style={{ width: 'auto', padding: '0 10px', height: '36px', borderRadius: '8px', fontSize: '0.75rem' }}
                              disabled={assigningPartner}
                            >
                              {assigningPartner ? '...' : 'Assign'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => {
                                setAssignDeliveryOpen(false);
                                setPartnerIdInput('');
                              }}
                              style={{ width: 'auto', padding: '0 8px', height: '36px', borderRadius: '8px', fontSize: '0.75rem' }}
                            >
                              Cancel
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}
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

      <ConfirmModal
        {...confirmModalState}
        onClose={closeConfirmModal}
      />

      {/* View All Products Modal */}
      {showAllTopProducts && (
        <div className="modal-overlay" onClick={() => setShowAllTopProducts(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Package size={20} style={{ color: '#b31522' }} />
                <span>All Top Marketplace Products</span>
              </h3>
              <button className="close-modal-btn" onClick={() => setShowAllTopProducts(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topProducts.map((prod, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span style={{
                      background: index === 0 ? '#fff5f5' : '#f8fafc',
                      color: index === 0 ? '#b31522' : '#64748b',
                      fontWeight: 800, fontSize: '0.8rem', width: '28px', height: '28px',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      #{index + 1}
                    </span>
                    <img 
                      src={prod.productImage || 'https://via.placeholder.com/40'} 
                      alt={prod.productName} 
                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                      {prod.productName || 'Unknown Product'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                      ₹{(prod.totalRevenue || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {prod.totalSold || 0} sold
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View All Categories Modal */}
      {showAllTopCategories && (
        <div className="modal-overlay" onClick={() => setShowAllTopCategories(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <ClipboardList size={20} style={{ color: '#06c169' }} />
                <span>All Top Marketplace Categories</span>
              </h3>
              <button className="close-modal-btn" onClick={() => setShowAllTopCategories(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topCategories.map((cat, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span style={{
                      background: index === 0 ? '#f0fdf4' : '#f8fafc',
                      color: index === 0 ? '#16a34a' : '#64748b',
                      fontWeight: 800, fontSize: '0.8rem', width: '28px', height: '28px',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      #{index + 1}
                    </span>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Tag size={20} color="#64748b" />
                    </div>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                      {cat.categoryName || 'Unknown Category'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                      ₹{(cat.totalRevenue || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {cat.totalOrders || 0} orders
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
