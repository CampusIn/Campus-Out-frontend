import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItemQty, deleteCartItem, clearCart } from '../../api/cart.api';
import { createOrder } from '../../api/order.api';
import BottomNav from '../../components/BottomNav';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import { ArrowLeft, Store, Trash2, Plus, Minus, Gift, Tag, Receipt, ShoppingCart, MapPin, Building, BookOpen, Coffee, Compass, Edit, Wallet, ShoppingBag } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const toast = useToast();
  const { cart, setCart, fetchCart, loading } = useCart();
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'address'
  const [deliveryAddress, setDeliveryAddress] = useState('Hostel Block 3, Room 204');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const campusAddresses = [
    { label: 'Hostel Block 3, Room 204', Icon: Building },
    { label: 'Central Library Entrance', Icon: BookOpen },
    { label: 'Food Court Block A, Table 12', Icon: Coffee },
    { label: 'Sports Complex Pavilion', Icon: Compass }
  ];

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQtyChange = async (menuItemId, quantity) => {
    if (quantity < 1) return;
    try {
      await updateCartItemQty(menuItemId, quantity);
      fetchCart();
    } catch {}
  };

  const handleRemove = async (menuItemId) => {
    try {
      await deleteCartItem(menuItemId);
      fetchCart();
    } catch {}
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setCart(null);
    } catch {}
  };

  const handleOrder = async (paymentMethod) => {
    try {
      const { data } = await createOrder(paymentMethod);
      toast.success(`Order placed successfully! #${data.data.orderNumber}`);
      setCart(null);
      // Automatically redirect to orders page after 2.5 seconds
      setTimeout(() => {
        navigate('/orders');
      }, 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order placement failed');
    }
  };

  if (loading && !cart) {
    return (
      <div className="home-dashboard page animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p className="loading-text" style={{ color: '#718096' }}>Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="home-dashboard page animate-fade-in" style={{ paddingBottom: '96px', background: '#fcfcfc' }}>
      
      {/* Header Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }} className="animate-slide-up">
        <button 
          className="circle-icon-btn hover-scale" 
          onClick={() => checkoutStep === 'address' ? setCheckoutStep('cart') : navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111111' }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#718096' }}>
          {checkoutStep === 'address' ? 'Back to Cart' : 'Back'}
        </span>
      </div>

      <div className="section-header-row animate-slide-up delay-1" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 850, color: '#111111', margin: 0 }}>
          {checkoutStep === 'address' ? 'Select Delivery Address' : 'Your Cart'}
        </h1>
      </div>

      {!cart || cart.items?.length === 0 ? (
        <div className="card animate-scale-in delay-2" style={{ background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '24px', textAlign: 'center', padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: '#fff5f5', color: '#b31522', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="animate-pulse-soft">
            <ShoppingCart size={36} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', margin: 0 }}>Your cart is empty</h2>
          <p style={{ fontSize: '0.9rem', color: '#718096', maxWidth: '320px', margin: 0, lineHeight: 1.5 }}>Add items from our premium campus eateries to start ordering.</p>
          <Link to="/restaurants" className="btn btn-primary hover-lift hover-darken" style={{ width: 'auto', padding: '12px 24px', borderRadius: '12px', background: '#b31522', color: '#ffffff', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', marginTop: '8px' }}>
            Browse Restaurants
          </Link>
        </div>
      ) : checkoutStep === 'address' ? (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active restaurant indicator */}
          <div style={{ 
            background: '#fff5f5', 
            color: '#b31522', 
            padding: '14px 18px', 
            borderRadius: '16px', 
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid rgba(179, 21, 34, 0.05)'
          }}>
            <Store size={18} />
            <span>Ordering from: <strong>{cart.restaurant?.restaurantName}</strong></span>
          </div>

          {/* 2 Column Split layout for Address selection */}
          <div className="split-layout-container" style={{ display: 'flex', gap: '32px' }}>
            
            {/* Left panel: Address selections */}
            <div className="split-left-main" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
              
              {/* Campus Pre-saved address suggestions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#718096', paddingLeft: '4px' }}>
                  Quick Suggestions
                </span>
                <div 
                  className="subcategory-scroll" 
                  style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    overflowX: 'auto', 
                    paddingBottom: '8px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {campusAddresses.map((addr) => {
                    const isSelected = deliveryAddress === addr.label;
                    return (
                      <button
                        type="button"
                        key={addr.label}
                        onClick={() => setDeliveryAddress(addr.label)}
                        className="hover-scale"
                        style={{
                          padding: '10px 16px',
                          borderRadius: '20px',
                          border: isSelected ? '2px solid #b31522' : '1px solid #edf2f7',
                          background: isSelected ? '#fff5f5' : '#ffffff',
                          color: isSelected ? '#b31522' : '#4a5568',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          outline: 'none'
                        }}
                      >
                        <addr.Icon size={14} style={{ color: isSelected ? '#b31522' : '#718096' }} />
                        <span>{addr.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Address Input */}
              <div 
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #edf2f7', 
                  borderRadius: '24px', 
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                }}
              >
                <label htmlFor="deliveryAddress" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111111' }}>
                  Delivery Address
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '16px', color: '#718096' }} />
                  <input
                    type="text"
                    id="deliveryAddress"
                    placeholder="Enter delivery room, department or hostel location..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px 16px 16px 46px',
                      borderRadius: '16px',
                      border: '1.5px solid #edf2f7',
                      fontSize: '0.95rem',
                      outline: 'none',
                      background: '#f8fafc',
                      color: '#111111',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#718096', margin: 0, paddingLeft: '4px' }}>
                  Select a quick suggestion above or type your custom location details.
                </p>
              </div>

              {/* Payment Method Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111111', margin: 0 }}>Payment Method</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      border: paymentMethod === 'COD' ? '2px solid #b31522' : '1px solid #edf2f7',
                      borderRadius: '12px',
                      padding: '16px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: paymentMethod === 'COD' ? '#b31522' : '#4a5568',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: paymentMethod === 'COD' ? '0 4px 12px rgba(179, 21, 34, 0.03)' : 'none'
                    }}
                    className="hover-scale"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Wallet size={16} />
                      <span>Cash on Delivery</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PAY_ON_PICKUP')}
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      border: paymentMethod === 'PAY_ON_PICKUP' ? '2px solid #b31522' : '1px solid #edf2f7',
                      borderRadius: '12px',
                      padding: '16px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: paymentMethod === 'PAY_ON_PICKUP' ? '#b31522' : '#4a5568',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: paymentMethod === 'PAY_ON_PICKUP' ? '0 4px 12px rgba(179, 21, 34, 0.03)' : 'none'
                    }}
                    className="hover-scale"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <ShoppingBag size={16} />
                      <span>Pay on Pickup</span>
                    </div>
                  </button>
                </div>
              </div>

            </div>

            {/* Right panel: Summary receipt & Order Action */}
            <div className="split-right-aside" style={{ width: '100%' }}>
              
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111111', borderBottom: '1px solid #edf2f7', paddingBottom: '12px', margin: 0 }}>
                  Order Details
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 6px 0', color: '#718096' }}>
                      <strong>Delivering to:</strong>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} style={{ color: '#b31522', flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: '#111111' }}>
                        {deliveryAddress || 'Please specify an address'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px 0', color: '#718096' }}>
                      <strong>Payment Mode:</strong>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {paymentMethod === 'COD' ? <Wallet size={16} style={{ color: '#b31522', flexShrink: 0 }} /> : <ShoppingBag size={16} style={{ color: '#b31522', flexShrink: 0 }} />}
                      <span style={{ fontWeight: 700, color: '#111111' }}>
                        {paymentMethod === 'COD' ? 'Cash on Delivery' : 'Pay on Pickup'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bill summary breakdown */}
                <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#718096' }}>Subtotal</span>
                    <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{cart.totalAmount}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#718096' }}>Service & Delivery Fee</span>
                    <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;15.00</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, borderTop: '1px solid #edf2f7', paddingTop: '10px', marginTop: '4px', color: '#111111' }}>
                    <span>Total Amount</span>
                    <span>&#8377;{(cart.totalAmount + 15.00).toFixed(2)}</span>
                  </div>
                </div>

                {/* Confirm & Place Order trigger */}
                <button 
                  type="button"
                  className="btn btn-primary hover-lift hover-darken" 
                  onClick={() => handleOrder(paymentMethod)}
                  disabled={!deliveryAddress.trim()}
                  style={{ 
                    padding: '16px', 
                    background: '#b31522', 
                    color: '#ffffff', 
                    border: 'none', 
                    borderRadius: '12px', 
                    fontWeight: 700, 
                    fontSize: '0.95rem', 
                    cursor: !deliveryAddress.trim() ? 'not-allowed' : 'pointer',
                    opacity: !deliveryAddress.trim() ? 0.6 : 1
                  }}
                >
                  Confirm & Place Order (&#8377;{(cart.totalAmount + 15.00).toFixed(2)})
                </button>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="cart-layout-responsive" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active restaurant indicator */}
          <div className="animate-slide-up delay-1" style={{ 
            background: '#fff5f5', 
            color: '#b31522', 
            padding: '14px 18px', 
            borderRadius: '16px', 
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid rgba(179, 21, 34, 0.05)'
          }}>
            <Store size={18} />
            <span>Ordering from: <strong>{cart.restaurant?.restaurantName}</strong></span>
          </div>

          {/* Desktop 2-column flex layout container */}
          <div className="split-layout-container animate-slide-up delay-2">
            
            {/* Left Col: Cart Items List */}
            <div className="split-left-main" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              {cart.items.map((item) => (
                <div 
                  key={item.menuItem?._id || item._id} 
                  className="card hover-lift" 
                  style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '16px' }}
                >
                  {/* Item Image */}
                  <div style={{ width: '70px', height: '70px', borderRadius: '12px', background: '#f7fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #edf2f7' }}>
                    {item.menuItem?.image ? (
                      <img src={item.menuItem.image} alt={item.menuItem?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Store size={28} style={{ color: '#cbd5e0' }} />
                    )}
                  </div>

                  {/* Body details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111111', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.menuItem?.name}
                    </h3>
                    <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#b31522', marginBottom: '8px' }}>
                      &#8377;{item.menuItem?.price}
                    </p>

                    {/* Quantity controls and remove button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div className="quantity-pill" style={{ height: '36px', padding: '0 8px', display: 'flex', alignItems: 'center', background: '#f7fafc', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '12px' }}>
                        <button 
                          className="qty-btn hover-scale" 
                          onClick={() => handleQtyChange(item.menuItem?._id, item.quantity - 1)}
                          style={{ fontSize: '1rem', width: '20px', border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-number" style={{ width: '20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', color: '#111111' }}>{item.quantity}</span>
                        <button 
                          className="qty-btn hover-scale" 
                          onClick={() => handleQtyChange(item.menuItem?._id, item.quantity + 1)}
                          style={{ fontSize: '1rem', width: '20px', border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button 
                        className="hover-scale" 
                        onClick={() => handleRemove(item.menuItem?._id)}
                        style={{ 
                          border: 'none',
                          background: 'none',
                          color: '#dc2626',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px'
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Col: Summary Card */}
            <div className="split-right-aside" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              
              {/* Make it a gift card */}
              <div className="card gift-promo-card hover-lift" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#fff5f5', color: '#b31522', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                    <Gift size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111111' }}>Make it a gift</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>Add a personalized gift note</p>
                  </div>
                </div>
                <button type="button" style={{ background: 'none', border: 'none', color: '#b31522', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>Add</button>
              </div>

              {/* Add promo code card */}
              <div className="card gift-promo-card hover-lift" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#fff5f5', color: '#b31522', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                    <Tag size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111111' }}>Add promo code</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>Use a coupon for discount</p>
                  </div>
                </div>
                <button type="button" style={{ background: 'none', border: 'none', color: '#b31522', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>Add</button>
              </div>

              {/* Main Bill receipt card */}
              <div className="card animate-scale-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111111', borderBottom: '1px solid #edf2f7', paddingBottom: '12px', margin: 0 }}>
                  Bill Summary
                </h3>

                {/* Grey receipt box */}
                <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#718096' }}>Subtotal</span>
                    <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{cart.totalAmount}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#718096' }}>Service Fee</span>
                    <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;15.00</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#718096' }}>Delivery Fee</span>
                    <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;35.00</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#718096' }}>Delivery Discount</span>
                    <span style={{ color: '#06c169', fontWeight: 700 }}>-&#8377;35.00</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, borderTop: '1px solid #edf2f7', paddingTop: '10px', marginTop: '4px', color: '#111111' }}>
                    <span>Total Amount</span>
                    <span>&#8377;{(cart.totalAmount + 15.00).toFixed(2)}</span>
                  </div>
                </div>

                {/* Proceed to Select Address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                  <button 
                    className="btn btn-primary hover-lift hover-darken" 
                    onClick={() => setCheckoutStep('address')} 
                    style={{ padding: '16px', background: '#b31522', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
                  >
                    Proceed to Select Address
                  </button>
                </div>

                {/* Clear cart action */}
                <button 
                  className="hover-scale" 
                  style={{ color: '#dc2626', border: 'none', background: 'none', fontWeight: 700, cursor: 'pointer', marginTop: '8px', fontSize: '0.9rem' }}
                  onClick={handleClear}
                >
                  Clear Cart
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      <BottomNav activeTab="cart" />

      {/* Responsive layout overrides via media queries */}
      <style>{`
        @media (max-width: 768px) {
          .split-layout-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          .split-right-aside {
            position: relative !important;
            top: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
