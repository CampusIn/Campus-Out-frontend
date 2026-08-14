import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { getVendorOrders, changeOrderStatus, getPlatformSettingsVendor } from '../../api/order.api';
import { downloadVendorOrderInvoice } from '../../api/vendor.api';
import { assignDeliveryPartner, viewDeliveryPartners } from '../../api/delivery.api';
import Combobox from '../../components/Combobox';
import { useToast } from '../../context/ToastContext';

import { CreditCard, UserPlus, Loader, Phone, FileDown, ShoppingBag, User, Clock, CheckCircle, ChevronRight, MapPin } from 'lucide-react';

const statusFlow = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function VendorOrders() {
  const { restaurant } = useOutletContext();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [platformSettings, setPlatformSettings] = useState({
    deliveryCharge: 0,
    freeDeliveryAbove: 0,
    gstPercentage: 0,
    packagingCharge: 0
  });
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState('');

  // Assignment states
  const [partnerIds, setPartnerIds] = useState({});
  const [assignLoading, setAssignLoading] = useState(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(null);
  const [downloadingInvoiceMap, setDownloadingInvoiceMap] = useState({});
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await getPlatformSettingsVendor();
        if (data.success && data.data) {
          setPlatformSettings({
            deliveryCharge: Number(data.data.deliveryCharge ?? 0),
            freeDeliveryAbove: Number(data.data.freeDeliveryAbove ?? 0),
            gstPercentage: Number(data.data.gstPercentage ?? 0),
            packagingCharge: Number(data.data.packagingCharge ?? 0)
          });
        }
      } catch (err) {
        console.error('Failed to fetch platform settings for vendor', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (restaurant) {
      fetchOrders();
      fetchDeliveryPartners();
    }
  }, [restaurant, page]);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await getVendorOrders({ page, limit: 6 });
      setOrders(data.data.orders || []);
      setTotalPages(data.data.pagination?.totalPages || 1);
    } catch {
      setOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, currentStatus) => {
    if (restaurant.isSuspended) {
      toast.error('Actions are disabled because your restaurant is suspended.');
      return;
    }
    const idx = statusFlow.indexOf(currentStatus);
    if (idx === -1 || idx >= statusFlow.length - 1) return;
    const nextStatus = statusFlow[idx + 1];
    
    setStatusChangeLoading(orderId);
    try {
      await changeOrderStatus(orderId, nextStatus);
      await fetchOrders(true);
      toast.success(`Order status updated to ${nextStatus}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setStatusChangeLoading(null);
    }
  };

  const handleConfirmReject = async (orderId, message) => {
    if (!message.trim()) return;
    setStatusChangeLoading(orderId);
    setRejectingOrderId(null);
    try {
      await changeOrderStatus(orderId, 'REJECTED', message.trim());
      await fetchOrders(true);
      toast.success('Order rejected successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject order');
    } finally {
      setStatusChangeLoading(null);
      setRejectionMessage('');
    }
  };

  const handleAssignPartner = async (orderId) => {
    if (restaurant.isSuspended) {
      toast.error('Actions are disabled because your restaurant is suspended.');
      return;
    }
    const partnerId = partnerIds[orderId];
    if (!partnerId) {
      toast.error('Please select a Delivery Partner');
      return;
    }
    
    setAssignLoading(orderId);
    try {
      await assignDeliveryPartner(orderId, partnerId);
      toast.success('Delivery partner assigned successfully!');
      setPartnerIds(prev => ({ ...prev, [orderId]: '' }));
      await fetchOrders(true);
      await fetchDeliveryPartners();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign delivery partner');
    } finally {
      setAssignLoading(null);
    }
  };

  const handlePartnerIdChange = (orderId, val) => {
    setPartnerIds(prev => ({ ...prev, [orderId]: val }));
  };

  const handleDownloadInvoice = async (orderId, orderNumber) => {
    setDownloadingInvoiceMap((prev) => ({ ...prev, [orderId]: true }));
    try {
      const response = await downloadVendorOrderInvoice(orderId);
      
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

  const getNextStatusLabel = (currentStatus) => {
    const idx = statusFlow.indexOf(currentStatus);
    if (idx === -1 || idx >= statusFlow.length - 1) return null;
    return `Move to ${statusFlow[idx + 1].replace(/_/g, ' ')}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ width: '200px', height: '28px' }} className="skeleton"></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }}></div>
          <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
          Incoming Orders
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Accept new requests, prepare items, and coordinate delivery assignments.
        </p>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--vendor-border)', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#64748b' }}>
          No incoming orders recorded at this moment.
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {orders.map((o) => (
              <div 
                key={o._id} 
                className="vendor-card"
                style={{ 
                  justifyContent: 'space-between',
                  gap: '16px',
                  border: o.orderStatus === 'PENDING' ? '1.5px solid var(--vendor-primary)' : '1px solid var(--vendor-border)'
                }}
              >
                <div>
                  {/* Card Title Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 850, fontSize: '1.05rem', color: '#1e293b' }}>#{o.orderNumber}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Clock size={12} />
                        {new Date(o.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span className={`status-badge ${o.orderStatus.toLowerCase().replace(/_/g, '-')}`}>
                        {o.orderStatus.replace(/_/g, ' ')}
                      </span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Link to={`/vendor/orders/${o._id}`} style={{ fontSize: '0.78rem', color: 'var(--vendor-primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          View Details <ChevronRight size={12} />
                        </Link>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleDownloadInvoice(o._id, o.orderNumber)}
                          disabled={downloadingInvoiceMap[o._id]}
                          title="Download Invoice PDF"
                          style={{ 
                            width: '26px', 
                            height: '26px', 
                            padding: 0, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderRadius: '6px',
                            borderWidth: '1px',
                            color: 'var(--vendor-primary)',
                            borderColor: 'rgba(74, 53, 232, 0.2)',
                            background: 'transparent'
                          }}
                        >
                          {downloadingInvoiceMap[o._id] ? (
                            <Loader size={12} className="animate-spin" />
                          ) : (
                            <FileDown size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#475569', marginBottom: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} color="#64748b" />
                      <strong>Customer:</strong> {o.user?.username || 'Unknown Customer'}
                    </span>
                    {(o.customerPhone || o.phone || o.user?.phone) && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={14} color="#64748b" />
                        <strong>Phone:</strong> {o.customerPhone || o.phone || o.user?.phone}
                      </span>
                    )}
                    {(o.deliveryAddress || o.address) && (
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin size={14} color="#64748b" style={{ marginTop: '2px' }} />
                        <span><strong>Address:</strong> {o.deliveryAddress || o.address}</span>
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CreditCard size={14} color="#64748b" />
                      <strong>Payment:</strong> {o.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Pay on Pickup'} ({o.paymentStatus})
                    </span>
                  </div>

                  {/* Items List */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Items to prepare:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                      {o.items?.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#1e293b' }}>
                          <span>{item.itemName} <strong style={{ color: 'var(--vendor-primary)' }}>x{item.quantity}</strong></span>
                          <span style={{ fontWeight: 700 }}>₹{item.priceAtPurchase * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Invoice Breakdown */}
                    {(() => {
                      if (o.pricing) {
                        const p = o.pricing;
                        const discount = p.couponDiscount || p.discountAmount || 0;
                        const gst = p.gstAmount || 0;
                        const packaging = p.packagingCharge || 0;
                        const delivery = p.deliveryCharge || 0;

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#64748b', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Subtotal</span>
                              <span style={{ fontWeight: 650, color: '#1e293b' }}>₹{p.subTotal}</span>
                            </div>
                            {discount > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Coupon Discount {o.couponCode ? `(${o.couponCode})` : ''}</span>
                                <span style={{ color: '#06c169', fontWeight: 700 }}>-₹{discount}</span>
                              </div>
                            )}
                            {gst > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>GST ({p.gstPercentage}%)</span>
                                <span style={{ fontWeight: 650, color: '#1e293b' }}>₹{gst}</span>
                              </div>
                            )}
                            {packaging > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Packaging Charge</span>
                                <span style={{ fontWeight: 650, color: '#1e293b' }}>₹{packaging}</span>
                              </div>
                            )}
                            {delivery > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Delivery Charge</span>
                                <span style={{ fontWeight: 650, color: '#1e293b' }}>₹{delivery}</span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      const subTotal = o.items ? o.items.reduce((total, item) => total + (item.priceAtPurchase * item.quantity), 0) : o.totalAmount;
                      const discount = o.discountAmount || 0;
                      const subTotalAfterDiscount = subTotal - discount;

                      const gst = o.gstAmount !== undefined && o.gstAmount !== null && o.gstAmount !== 0 ? o.gstAmount : Math.round((subTotalAfterDiscount * platformSettings.gstPercentage) / 100);
                      const packaging = o.packagingCharge !== undefined && o.packagingCharge !== null && o.packagingCharge !== 0 ? o.packagingCharge : platformSettings.packagingCharge;
                      const delivery = o.deliveryCharge !== undefined && o.deliveryCharge !== null && o.deliveryCharge !== 0 ? o.deliveryCharge : (subTotalAfterDiscount >= platformSettings.freeDeliveryAbove ? 0 : platformSettings.deliveryCharge);

                      const hasBreakdown = gst > 0 || packaging > 0 || delivery > 0 || discount > 0;
                      
                      if (!hasBreakdown) {
                        return null; // No extra breakdown needed
                      }

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#64748b', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Subtotal</span>
                            <span style={{ fontWeight: 650, color: '#1e293b' }}>₹{subTotal}</span>
                          </div>
                          {discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Coupon Discount {o.couponCode ? `(${o.couponCode})` : ''}</span>
                              <span style={{ color: '#06c169', fontWeight: 700 }}>-₹{discount}</span>
                            </div>
                          )}
                          {gst > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>GST ({o.gstPercentage ?? platformSettings.gstPercentage}%)</span>
                              <span style={{ fontWeight: 650, color: '#1e293b' }}>₹{gst}</span>
                            </div>
                          )}
                          {packaging > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Packaging Charge</span>
                              <span style={{ fontWeight: 650, color: '#1e293b' }}>₹{packaging}</span>
                            </div>
                          )}
                          {delivery > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Delivery Charge</span>
                              <span style={{ fontWeight: 650, color: '#1e293b' }}>₹{delivery}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800 }}>
                      <span>Total Invoice</span>
                      <span style={{ color: 'var(--vendor-primary)' }}>₹{o.pricing?.finalAmount || o.totalAmount}</span>
                    </div>
                    {o.orderStatus === 'REJECTED' && o.rejectionMsg && (
                      <div style={{ marginTop: '12px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.82rem' }}>
                        <strong style={{ display: 'block', marginBottom: '2px' }}>Rejection Reason:</strong>
                        {o.rejectionMsg}
                      </div>
                    )}
                  </div>

                  {/* Delivery partner section */}
                  {o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'REJECTED' && (
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px' }}>
                      {o.deliveryPartner ? (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle size={14} color="var(--vendor-primary)" />
                            Assigned Partner: <strong>{o.deliveryPartner.user?.username || 'Assigned'}</strong>
                          </span>
                          <span style={{ fontSize: '0.75rem', paddingLeft: '20px' }}>
                            Vehicle: {o.deliveryPartner.vehicleNumber} &bull; Phone: {o.deliveryPartner.phoneNumber}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ relative: true, flex: 1 }}>
                            <Combobox
                              placeholder="Select Partner"
                              options={partnerOptions}
                              value={partnerIds[o._id] || ''}
                              onChange={(val) => handlePartnerIdChange(o._id, val)}
                              disabled={restaurant.isSuspended || assignLoading === o._id}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <button 
                            className="btn btn-outline" 
                            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.78rem', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                            disabled={restaurant.isSuspended || assignLoading === o._id}
                            onClick={() => handleAssignPartner(o._id)}
                          >
                            {assignLoading === o._id ? <Loader size={12} className="animate-spin" /> : <UserPlus size={12} />}
                            Assign
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Status action buttons */}
                {o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED' && (
                  <div>
                    {o.orderStatus === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button 
                          className="btn btn-primary"
                          style={{ background: 'var(--vendor-primary)', borderColor: 'var(--vendor-primary)', color: '#ffffff', flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, borderRadius: '12px' }}
                          disabled={restaurant.isSuspended || statusChangeLoading === o._id}
                          onClick={() => handleStatusChange(o._id, o.orderStatus)}
                        >
                          {statusChangeLoading === o._id ? (
                            <Loader size={16} className="animate-spin" />
                          ) : (
                            <>
                              Accept Order
                              <ChevronRight size={16} />
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ borderColor: '#dc2626', color: '#dc2626', flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, borderRadius: '12px' }}
                          disabled={restaurant.isSuspended || statusChangeLoading === o._id}
                          onClick={() => setRejectingOrderId(o._id)}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="btn btn-primary"
                        style={{ background: 'var(--vendor-primary)', borderColor: 'var(--vendor-primary)', color: '#ffffff', width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, borderRadius: '12px' }}
                        disabled={restaurant.isSuspended || statusChangeLoading === o._id}
                        onClick={() => handleStatusChange(o._id, o.orderStatus)}
                      >
                        {statusChangeLoading === o._id ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <>
                            {getNextStatusLabel(o.orderStatus)}
                            <ChevronRight size={16} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="vendor-pagination">
              <button 
                className="btn btn-outline btn-sm" 
                style={{ width: 'auto' }} 
                disabled={page === 1} 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#64748b' }}>
                {page} of {totalPages}
              </span>
              <button 
                className="btn btn-outline btn-sm" 
                style={{ width: 'auto' }} 
                disabled={page === totalPages} 
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      {/* Rejection Modal */}
      {rejectingOrderId && (
        <div className="vendor-modal-overlay" onClick={() => { setRejectingOrderId(null); setRejectionMessage(''); }}>
          <div className="vendor-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Reject Order</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
              Please enter a reason for rejecting this order. This message will be visible to the customer.
            </p>
            <textarea
              className="input-field"
              style={{ width: '100%', height: '100px', borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '12px', outline: 'none', resize: 'none', marginBottom: '16px', fontSize: '0.9rem' }}
              placeholder="Reason (e.g. Restaurant is closing, out of stock...)"
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                style={{ width: 'auto', padding: '8px 20px', borderRadius: '10px' }}
                onClick={() => { setRejectingOrderId(null); setRejectionMessage(''); }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ width: 'auto', padding: '8px 20px', borderRadius: '10px', background: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
                onClick={() => handleConfirmReject(rejectingOrderId, rejectionMessage)}
                disabled={!rejectionMessage.trim()}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
