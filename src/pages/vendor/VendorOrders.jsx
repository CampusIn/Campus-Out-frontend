import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { getVendorOrders, changeOrderStatus } from '../../api/order.api';
import { assignDeliveryPartner } from '../../api/delivery.api';
import { useToast } from '../../context/ToastContext';
import { ShoppingBag, User, Clock, CreditCard, UserPlus, CheckCircle2, ChevronRight, Loader, Phone, MapPin } from 'lucide-react';

const statusFlow = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];

export default function VendorOrders() {
  const { restaurant } = useOutletContext();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Assignment states
  const [partnerIds, setPartnerIds] = useState({});
  const [assignLoading, setAssignLoading] = useState(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(null);

  useEffect(() => {
    if (restaurant) {
      fetchOrders();
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

  const handleAssignPartner = async (orderId) => {
    if (restaurant.isSuspended) {
      toast.error('Actions are disabled because your restaurant is suspended.');
      return;
    }
    const partnerId = partnerIds[orderId];
    if (!partnerId || !partnerId.trim()) {
      toast.error('Please enter a valid Delivery Partner ID');
      return;
    }
    
    setAssignLoading(orderId);
    try {
      await assignDeliveryPartner(orderId, partnerId.trim());
      toast.success('Delivery partner assigned successfully!');
      setPartnerIds(prev => ({ ...prev, [orderId]: '' }));
      await fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign delivery partner');
    } finally {
      setAssignLoading(null);
    }
  };

  const handlePartnerIdChange = (orderId, val) => {
    setPartnerIds(prev => ({ ...prev, [orderId]: val }));
  };

  const getNextStatusLabel = (currentStatus) => {
    const idx = statusFlow.indexOf(currentStatus);
    if (idx === -1 || idx >= statusFlow.length - 1) return null;
    return `Move to ${statusFlow[idx + 1]}`;
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
                      <Link to={`/vendor/orders/${o._id}`} style={{ fontSize: '0.78rem', color: 'var(--vendor-primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        View Details <ChevronRight size={12} />
                      </Link>
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
                      const subTotal = o.items ? o.items.reduce((total, item) => total + (item.priceAtPurchase * item.quantity), 0) : o.totalAmount;
                      const hasBreakdown = o.deliveryCharge !== undefined || o.discountAmount !== undefined || o.gstAmount !== undefined || o.packagingCharge !== undefined;
                      
                      if (!hasBreakdown && subTotal === o.totalAmount) {
                        return null; // No extra breakdown needed
                      }

                      const discount = o.discountAmount || 0;
                      const gst = o.gstAmount || 0;
                      const packaging = o.packagingCharge || 0;
                      const delivery = o.deliveryCharge || 0;

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
                              <span>GST</span>
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
                      <span style={{ color: 'var(--vendor-primary)' }}>₹{o.totalAmount}</span>
                    </div>
                  </div>

                  {/* Delivery partner section */}
                  {o.orderStatus !== 'CANCELLED' && (
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px' }}>
                      {o.deliveryPartner ? (
                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={14} color="var(--vendor-primary)" />
                          Assigned Partner: <strong>{o.deliveryPartner.username || o.deliveryPartner.name || o.deliveryPartner}</strong>
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <input 
                              className="input-pill" 
                              style={{ paddingLeft: '12px', fontSize: '0.8rem', height: '36px', marginBottom: 0, borderRadius: '8px' }}
                              placeholder="Partner ID"
                              value={partnerIds[o._id] || ''}
                              onChange={(e) => handlePartnerIdChange(o._id, e.target.value)}
                              disabled={restaurant.isSuspended || assignLoading === o._id}
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
                {o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED' && (
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
    </div>
  );
}
