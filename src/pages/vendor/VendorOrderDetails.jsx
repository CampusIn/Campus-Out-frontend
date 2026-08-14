import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { getSingleVendorOrder, changeOrderStatus, getPlatformSettingsVendor } from '../../api/order.api';
import { downloadVendorOrderInvoice } from '../../api/vendor.api';
import { assignDeliveryPartner, viewDeliveryPartners } from '../../api/delivery.api';
import Combobox from '../../components/Combobox';
import { useToast } from '../../context/ToastContext';

import { Phone, CreditCard, UserPlus, Loader, Package, FileDown, ArrowLeft, Clock, User, MapPin, CheckCircle, ChevronRight, Copy, MessageSquare } from 'lucide-react';

const statusFlow = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const getWhatsAppLink = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const number = cleaned.length === 10 ? `91${cleaned}` : cleaned;
  return `https://wa.me/${number}`;
};

export default function VendorOrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { restaurant } = useOutletContext();

  const handleCopyToClipboard = (text, type = 'Phone number') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Assignment and status states
  const [partnerId, setPartnerId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
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
  const [platformSettings, setPlatformSettings] = useState({
    deliveryCharge: 0,
    freeDeliveryAbove: 0,
    gstPercentage: 0,
    packagingCharge: 0
  });
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState('');

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
        console.error('Failed to fetch platform settings for vendor order details', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (orderId && restaurant) {
      fetchOrderDetails();
      fetchDeliveryPartners();
    }
  }, [orderId, restaurant]);

  const fetchOrderDetails = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await getSingleVendorOrder(orderId);
      setOrder(data.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch order details');
      navigate('/vendor/orders');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStatusChange = async (currentStatus) => {
    if (restaurant?.isSuspended) {
      toast.error('Actions are disabled because your restaurant is suspended.');
      return;
    }
    const idx = statusFlow.indexOf(currentStatus);
    if (idx === -1 || idx >= statusFlow.length - 1) return;
    const nextStatus = statusFlow[idx + 1];
    
    setStatusChangeLoading(true);
    try {
      await changeOrderStatus(orderId, nextStatus);
      await fetchOrderDetails(true);
      toast.success(`Order status updated to ${nextStatus}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const handleConfirmReject = async (orderId, message) => {
    if (!message.trim()) return;
    setStatusChangeLoading(true);
    setRejectingOrderId(null);
    try {
      await changeOrderStatus(orderId, 'REJECTED', message.trim());
      await fetchOrderDetails(true);
      toast.success('Order rejected successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject order');
    } finally {
      setStatusChangeLoading(false);
      setRejectionMessage('');
    }
  };

  const handleAssignPartner = async () => {
    if (restaurant?.isSuspended) {
      toast.error('Actions are disabled because your restaurant is suspended.');
      return;
    }
    if (!partnerId) {
      toast.error('Please select a Delivery Partner');
      return;
    }
    
    setAssignLoading(true);
    try {
      await assignDeliveryPartner(orderId, partnerId);
      toast.success('Delivery partner assigned successfully!');
      setPartnerId('');
      await fetchOrderDetails(true);
      await fetchDeliveryPartners();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign delivery partner');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId, orderNumber) => {
    setDownloadingInvoice(true);
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
      setDownloadingInvoice(false);
    }
  };

  const getNextStatusLabel = (currentStatus) => {
    const idx = statusFlow.indexOf(currentStatus);
    if (idx === -1 || idx >= statusFlow.length - 1) return null;
    return `Move to ${statusFlow[idx + 1].replace(/_/g, ' ')}`;
  };

  if (loading || !order) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ width: '200px', height: '28px' }} className="skeleton"></div>
        <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }}></div>
      </div>
    );
  }

  const subTotal = order.pricing 
    ? order.pricing.subTotal 
    : (order.items ? order.items.reduce((total, item) => total + (item.priceAtPurchase * item.quantity), 0) : order.totalAmount);
  const discount = order.pricing 
    ? (order.pricing.couponDiscount || order.pricing.discountAmount || 0) 
    : (order.discountAmount || 0);
  const subTotalAfterDiscount = subTotal - discount;

  const gst = order.pricing 
    ? order.pricing.gstAmount 
    : (order.gstAmount !== undefined && order.gstAmount !== null && order.gstAmount !== 0 ? order.gstAmount : Math.round((subTotalAfterDiscount * platformSettings.gstPercentage) / 100));
  const gstPercentage = order.pricing ? order.pricing.gstPercentage : (order.gstPercentage ?? platformSettings.gstPercentage);
  const packaging = order.pricing 
    ? order.pricing.packagingCharge 
    : (order.packagingCharge !== undefined && order.packagingCharge !== null && order.packagingCharge !== 0 ? order.packagingCharge : platformSettings.packagingCharge);
  const delivery = order.pricing 
    ? order.pricing.deliveryCharge 
    : (order.deliveryCharge !== undefined && order.deliveryCharge !== null && order.deliveryCharge !== 0 ? order.deliveryCharge : (subTotalAfterDiscount >= platformSettings.freeDeliveryAbove ? 0 : platformSettings.deliveryCharge));


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Back navigation & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => navigate('/vendor/orders')}
            style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              Order #{order.orderNumber}
            </h1>
            <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <Clock size={14} />
              {new Date(order.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        <button 
          className="btn btn-outline hover-lift" 
          style={{ 
            width: 'auto', 
            padding: '0 16px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontWeight: 700,
            height: '40px',
            fontSize: '0.85rem',
            borderColor: 'rgba(74, 53, 232, 0.2)',
            color: 'var(--vendor-primary)',
            background: 'transparent'
          }}
          disabled={downloadingInvoice}
          onClick={() => handleDownloadInvoice(order._id, order.orderNumber)}
        >
          {downloadingInvoice ? <Loader size={16} className="animate-spin" /> : <FileDown size={16} />}
          Download Invoice
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Order details & Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="vendor-card" style={{ padding: '24px', border: '1px solid var(--vendor-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Status & Actions</h3>
              <span className={`status-badge ${order.orderStatus.toLowerCase().replace(/_/g, '-')}`}>
                {order.orderStatus.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Status action buttons */}
            {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'REJECTED' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Update the order status below to notify the customer.
                </p>
                {order.orderStatus === 'PENDING' ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className="btn btn-primary hover-lift"
                      style={{ background: 'var(--vendor-primary)', borderColor: 'var(--vendor-primary)', color: '#ffffff', flex: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, borderRadius: '12px' }}
                      disabled={restaurant?.isSuspended || statusChangeLoading}
                      onClick={() => handleStatusChange(order.orderStatus)}
                    >
                      {statusChangeLoading ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <>
                          Accept Order
                          <ChevronRight size={16} />
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline hover-lift"
                      style={{ borderColor: '#dc2626', color: '#dc2626', flex: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, borderRadius: '12px' }}
                      disabled={restaurant?.isSuspended || statusChangeLoading}
                      onClick={() => setRejectingOrderId(order._id)}
                    >
                      Reject Order
                    </button>
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary hover-lift"
                    style={{ background: 'var(--vendor-primary)', borderColor: 'var(--vendor-primary)', color: '#ffffff', width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, borderRadius: '12px' }}
                    disabled={restaurant?.isSuspended || statusChangeLoading}
                    onClick={() => handleStatusChange(order.orderStatus)}
                  >
                    {statusChangeLoading ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <>
                        {getNextStatusLabel(order.orderStatus)}
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0, fontWeight: 600 }}>
                  This order has been {order.orderStatus.toLowerCase()}. No further actions can be taken.
                </p>
                {order.orderStatus === 'REJECTED' && order.rejectionMsg && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem' }}>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>Rejection Reason:</strong>
                    {order.rejectionMsg}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="vendor-card" style={{ padding: '24px', border: '1px solid var(--vendor-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} color="var(--vendor-primary)" />
              Items Ordered
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order.items?.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingBottom: '16px', borderBottom: index !== order.items.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#f8fafc', overflow: 'hidden', flexShrink: 0, border: '1px solid #edf2f7' }}>
                    {item.menuItem?.image ? (
                      <img src={item.menuItem.image} alt={item.itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.itemName}
                    </h4>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Qty: <strong style={{ color: '#1e293b' }}>{item.quantity}</strong> &times; ₹{item.priceAtPurchase}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>
                    ₹{item.priceAtPurchase * item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Customer info, Payment, Delivery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="vendor-card" style={{ padding: '24px', border: '1px solid var(--vendor-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 16px 0' }}>Customer Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <User size={16} color="#64748b" style={{ marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', color: '#1e293b', marginBottom: '2px' }}>Name</strong>
                  {order.user?.username || 'Unknown Customer'}
                </div>
              </div>
              
              {(order.customerPhone || order.user?.phone) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Phone size={16} color="#64748b" style={{ marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', color: '#1e293b', marginBottom: '2px' }}>Phone Number</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <a href={`tel:${order.customerPhone || order.user?.phone}`} style={{ color: 'var(--vendor-primary)', textDecoration: 'none', fontWeight: 600 }}>
                        {order.customerPhone || order.user?.phone}
                      </a>
                      
                      {/* Copy Icon */}
                      <button 
                        onClick={() => handleCopyToClipboard(order.customerPhone || order.user?.phone, 'Phone number')}
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
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#1e293b'; e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        title="Copy Phone Number"
                      >
                        <Copy size={14} />
                      </button>

                      {/* Call Icon Link */}
                      <a 
                        href={`tel:${order.customerPhone || order.user?.phone}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#475569',
                          transition: 'transform 0.2s, background-color 0.2s, color 0.2s',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                        title="Call Customer"
                      >
                        <Phone size={13} />
                      </a>

                      {/* SMS Icon Link */}
                      <a 
                        href={`sms:${order.customerPhone || order.user?.phone}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#475569',
                          transition: 'transform 0.2s, background-color 0.2s, color 0.2s',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                        title="SMS Customer"
                      >
                        <MessageSquare size={13} />
                      </a>

                      {/* WhatsApp Icon Link */}
                      <a 
                        href={getWhatsAppLink(order.customerPhone || order.user?.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
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
                        <MessageSquare size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {(order.deliveryAddress || order.user?.address) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <MapPin size={16} color="#64748b" style={{ marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', color: '#1e293b', marginBottom: '2px' }}>Delivery Address</strong>
                    {order.deliveryAddress || order.user?.address}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="vendor-card" style={{ padding: '24px', border: '1px solid var(--vendor-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 16px 0' }}>Payment Summary</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={18} color="#64748b" />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#1e293b' }}>
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Pay on Pickup'}
                </strong>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: order.paymentStatus === 'PAID' ? '#06c169' : '#eab308' }}>
                  STATUS: {order.paymentStatus}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 650, color: '#1e293b' }}>₹{subTotal}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span style={{ color: '#06c169', fontWeight: 700 }}>-₹{discount}</span>
                </div>
              )}
              {gst > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST ({gstPercentage}%)</span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--vendor-primary)' }}>₹{order.pricing?.finalAmount || order.totalAmount}</span>
              </div>
            </div>
          </div>

          {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'REJECTED' && (
            <div className="vendor-card" style={{ padding: '24px', border: '1px solid var(--vendor-border)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 16px 0' }}>Delivery Assignment</h3>
              {order.deliveryPartner ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e6f9f0', color: '#06c169', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: '#1e293b' }}>Partner Assigned</strong>
                    <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 700, display: 'block' }}>
                      {order.deliveryPartner.user?.username || 'Assigned'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      Vehicle: {order.deliveryPartner.vehicleNumber} &bull; Phone: {order.deliveryPartner.phoneNumber}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    Select a Delivery Partner to assign this order for delivery.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <Combobox
                        placeholder="Select Partner"
                        options={partnerOptions}
                        value={partnerId}
                        onChange={(val) => setPartnerId(val)}
                        disabled={restaurant?.isSuspended || assignLoading}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <button 
                      className="btn btn-outline hover-lift" 
                      style={{ padding: '0 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      disabled={restaurant?.isSuspended || assignLoading}
                      onClick={handleAssignPartner}
                    >
                      {assignLoading ? <Loader size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      Assign
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
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
