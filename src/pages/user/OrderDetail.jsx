import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, cancelOrder } from '../../api/order.api';
import { createReview } from '../../api/review.api';
import { ArrowLeft, Star, Calendar, CreditCard, Clock, Store, Check, AlertCircle } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import { useConfirm } from '../../context/ConfirmContext';

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const getStatusColors = (status) => {
    const colors = {
      PENDING: { color: '#dd6b20', bgColor: '#fffaf0', borderColor: '#feebc8' },
      CONFIRMED: { color: '#2b6cb0', bgColor: '#ebf8ff', borderColor: '#bee3f8' },
      PREPARING: { color: '#2f855a', bgColor: '#f0fff4', borderColor: '#c6f6d5' },
      READY: { color: '#6b46c1', bgColor: '#faf5ff', borderColor: '#e9d8fd' },
      OUT_FOR_DELIVERY: { color: '#c53030', bgColor: '#fff5f5', borderColor: '#fed7d7' },
      DELIVERED: { color: '#2f855a', bgColor: '#f0fff4', borderColor: '#c6f6d5' },
      CANCELLED: { color: '#e53e3e', bgColor: '#fff5f5', borderColor: '#fed7d7' },
      REJECTED: { color: '#e53e3e', bgColor: '#fff5f5', borderColor: '#fed7d7' }
    };
    return colors[status] || { color: '#4a5568', bgColor: '#f7fafc', borderColor: '#e2e8f0' };
  };
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data } = await getOrderById(orderId);
      setOrder(data.data);
    } catch {
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const confirm = useConfirm();

  const handleCancel = async () => {
    if (!await confirm('Are you sure you want to cancel this order?')) return;
    try {
      const { data } = await cancelOrder(orderId);
      setOrder(data.data);
      setMsg('Order cancelled successfully.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Cannot cancel order');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!order?.restaurant) return;
    
    setReviewLoading(true);
    setReviewMsg('');
    try {
      await createReview(order.restaurant, { rating, comment });
      setReviewMsg('Thank you! Review submitted successfully.');
      setComment('');
    } catch (err) {
      setReviewMsg(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="home-dashboard page animate-fade-in" style={{ paddingBottom: '96px', background: '#fcfcfc' }}>
        {/* Back navigation shimmer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button 
            type="button" 
            onClick={() => navigate('/orders')}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111111' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="skeleton-shimmer" style={{ width: '100px', height: '16px', borderRadius: '4px' }}></div>
        </div>

        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {/* Main Card Shimmer */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '24px' }}>
            
            {/* Header row shimmer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div className="skeleton-shimmer" style={{ width: '120px', height: '24px', borderRadius: '6px', marginBottom: '6px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '160px', height: '16px', borderRadius: '4px' }}></div>
              </div>
              <div className="skeleton-shimmer" style={{ width: '90px', height: '28px', borderRadius: '50px' }}></div>
            </div>

            {/* Details list box shimmer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f7fafc', padding: '16px', borderRadius: '16px', border: '1px solid #edf2f7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton-shimmer" style={{ width: '120px', height: '14px', borderRadius: '4px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '100px', height: '14px', borderRadius: '4px' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton-shimmer" style={{ width: '110px', height: '14px', borderRadius: '4px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '60px', height: '14px', borderRadius: '4px' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton-shimmer" style={{ width: '90px', height: '14px', borderRadius: '4px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '130px', height: '14px', borderRadius: '4px' }}></div>
              </div>
              <div style={{ borderTop: '1.5px dashed #e2e8f0', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton-shimmer" style={{ width: '80px', height: '18px', borderRadius: '4px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '70px', height: '18px', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Items Summary shimmer title */}
            <div className="skeleton-shimmer" style={{ width: '110px', height: '18px', borderRadius: '4px', marginTop: '12px', marginBottom: '4px' }}></div>

            {/* 2 item rows shimmer */}
            {[1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="skeleton-shimmer" style={{ width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0 }}></div>
                  <div className="skeleton-shimmer" style={{ width: '120px', height: '16px', borderRadius: '4px' }}></div>
                </div>
                <div className="skeleton-shimmer" style={{ width: '50px', height: '16px', borderRadius: '4px' }}></div>
              </div>
            ))}
          </div>
        </div>

        <BottomNav activeTab="orders" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="home-dashboard page animate-fade-in" style={{ paddingBottom: '96px', background: '#fcfcfc' }}>
      
      {/* Back navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }} className="animate-slide-up">
        <button 
          className="circle-icon-btn hover-scale" 
          onClick={() => navigate('/orders')}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111111' }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#718096' }}>Back to Orders</span>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto' }} className="animate-slide-up delay-1">
        
        {/* Main Order Details Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '24px' }}>
          
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 850, color: '#111111', margin: 0 }}>Order #{order.orderNumber}</h1>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#b31522', marginTop: '4px', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Store size={16} />
                <span>{order.restaurantName}</span>
              </p>
            </div>
            
            {(() => {
              const colors = getStatusColors(order.orderStatus);
              return (
                <span className={`order-status-badge ${order.orderStatus}`} style={{
                  fontSize: '0.8rem',
                  padding: '6px 14px',
                  borderRadius: '50px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: colors.color,
                  backgroundColor: colors.bgColor,
                  border: `1.5px solid ${colors.borderColor}`
                }}>
                  {order.orderStatus.replace(/_/g, ' ')}
                </span>
              );
            })()}
          </div>

          {order.orderStatus === 'REJECTED' && order.rejectionMsg && (
            <div className="animate-scale-in" style={{ padding: '16px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '16px', color: '#c53030' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} style={{ color: '#dc2626' }} />
                <span>Order Rejected</span>
              </p>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', fontWeight: 600, color: '#9b2c2c', lineHeight: 1.4 }}>
                <strong>Reason:</strong> {order.rejectionMsg}
              </p>
            </div>
          )}

          {msg && (
            <div className="animate-scale-in">
              <p className="msg msg-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} />
                <span>{msg}</span>
              </p>
            </div>
          )}

          {/* Details list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: '#4a5568', background: '#f7fafc', padding: '16px', borderRadius: '16px', border: '1px solid #edf2f7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={14} /> Payment Method</span>
              <span style={{ fontWeight: 700, color: '#111111' }}>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Pay on Pickup'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} /> Payment Status</span>
              <span style={{ fontWeight: 800, color: order.paymentStatus === 'PAID' ? '#06c169' : '#dc2626' }}>
                {order.paymentStatus}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> Placed On</span>
              <span style={{ fontWeight: 700, color: '#111111' }}>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, borderTop: '1.5px dashed #e2e8f0', paddingTop: '12px', marginTop: '4px', color: '#111111' }}>
              <span>Total Paid</span>
              <span style={{ color: '#b31522', fontWeight: 900 }}>&#8377;{order.totalAmount}</span>
            </div>
          </div>

          {/* Cancel Button */}
          {order.orderStatus === 'PENDING' && (
            <button className="btn btn-outline hover-lift" style={{ color: '#dc2626', borderColor: '#dc2626', background: 'transparent', padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', width: '100%', transition: 'all 0.2s' }} onClick={handleCancel}>
              Cancel Order
            </button>
          )}

          {/* Items breakdown */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111111', marginTop: '12px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px', margin: '12px 0 0 0' }}>
            Items Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#4a5568' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.menuItem?.image && (
                    <img 
                      src={item.menuItem.image} 
                      alt={item.itemName} 
                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #edf2f7' }} 
                    />
                  )}
                  <span style={{ fontWeight: 600 }}>
                    {item.itemName} <strong style={{ color: '#b31522' }}>x{item.quantity}</strong>
                  </span>
                </div>
                <span style={{ fontWeight: 800, color: '#111111' }}>&#8377;{item.priceAtPurchase * item.quantity}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Rate & Review Form */}
        {order.orderStatus === 'DELIVERED' && (
          <div className="card animate-scale-in" style={{ padding: '24px', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111111', margin: '0 0 4px 0' }}>Rate Your Meal</h3>
            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '20px', margin: '0 0 20px 0' }}>
              Let us know how your experience was at {order.restaurantName}.
            </p>

            {reviewMsg && (
              <div style={{ marginBottom: '16px' }} className="animate-scale-in">
                <p className={`msg ${reviewMsg.includes('Thank') ? 'msg-success' : 'msg-error'}`}>
                  {reviewMsg}
                </p>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Star selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568' }}>Your Rating</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="hover-scale"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Star size={24} fill={star <= rating ? '#ffc700' : 'none'} color={star <= rating ? '#ffc700' : '#e2e8f0'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568' }}>Write a Comment</span>
                <textarea
                  className="input-pill"
                  style={{ 
                    borderRadius: '12px', 
                    padding: '12px 16px', 
                    height: '100px', 
                    resize: 'none',
                    fontFamily: 'inherit',
                    border: '1px solid #cbd5e0',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                  placeholder="Tell us what you liked or how we can improve..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              {/* Submit Review Button */}
              <button 
                type="submit" 
                className="btn btn-primary hover-lift hover-darken" 
                disabled={reviewLoading}
                style={{ padding: '16px', borderRadius: '12px', background: '#b31522', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', marginTop: '8px' }}
              >
                {reviewLoading ? 'Submitting Review...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

      </div>

      <BottomNav activeTab="orders" />
    </div>
  );
}
