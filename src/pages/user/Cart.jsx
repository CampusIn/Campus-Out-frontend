import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getCart, clearCart } from '../../api/cart.api';
import { createOrder, getCoupons, applyCoupon, getPlatformSettings } from '../../api/order.api';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import { useConfirm } from '../../context/ConfirmContext';
import MarketplaceCart from './MarketplaceCart';

import { Store, Gift, Tag, Receipt, ShoppingCart, Building, Coffee, Compass, Wallet, Loader, Percent, Phone, ArrowLeft, Trash2, Plus, Minus, MapPin, BookOpen, Edit, ShoppingBag, Check, X, AlertTriangle } from 'lucide-react';
import { confetti } from '../../components/Confetti';
import { SlideConfirmButton } from '../../components/SlideConfirmButton';
import { ProgressiveCardReveal } from '../../components/ProgressiveCardReveal';

export default function Cart() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { cart, setCart, fetchCart, loading, updateCartItemQtyOptimistic, deleteCartItemOptimistic, error: cartError, updatingItems } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = searchParams.get('tab') === 'marketplace' ? 'marketplace' : 'food';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'address'
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [customerPhone, setCustomerPhone] = useState('');

  // Coupon integration states
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [pricingSummary, setPricingSummary] = useState(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [activeCouponIndex, setActiveCouponIndex] = useState(0);
  const [couponsList, setCouponsList] = useState([]);
  const [isFetchingCoupons, setIsFetchingCoupons] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [shakePhone, setShakePhone] = useState(false);
  const [shakeAddress, setShakeAddress] = useState(false);

  useEffect(() => {
    if (isCouponModalOpen) {
      document.body.classList.add('hide-bottom-nav');
    } else {
      document.body.classList.remove('hide-bottom-nav');
    }
    return () => document.body.classList.remove('hide-bottom-nav');
  }, [isCouponModalOpen]);

  // Resize listener for responsive modal/bottom-sheet toggle
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Re-apply active coupon when cart contents or amounts change
  useEffect(() => {
    const reapplyActiveCoupon = async () => {
      if (!cart || cart.items?.length === 0) {
        setSelectedCoupon(null);
        setPricingSummary(null);
        return;
      }

      if (selectedCoupon?.couponId) {
        try {
          const { data } = await applyCoupon(selectedCoupon.couponId);
          if (data.success && data.data) {
            setSelectedCoupon(data.data.coupon);
            setPricingSummary(data.data.pricing);
          } else {
            setSelectedCoupon(null);
            setPricingSummary(null);
          }
        } catch (err) {
          setSelectedCoupon(null);
          setPricingSummary(null);
          toast.error(err.response?.data?.message || 'Selected coupon is no longer applicable.');
        }
      }
    };

    reapplyActiveCoupon();
  }, [cart?.totalAmount, cart?.items?.length]);

  const [platformSettings, setPlatformSettings] = useState({
    deliveryCharge: 20,
    freeDeliveryAbove: 80,
    gstPercentage: 0,
    packagingCharge: 0,
    platformCharge: 0
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await getPlatformSettings();
        if (data.success && data.data) {
          setPlatformSettings({
            deliveryCharge: Number(data.data.deliveryCharge ?? 20),
            freeDeliveryAbove: Number(data.data.freeDeliveryAbove ?? 80),
            gstPercentage: Number(data.data.gstPercentage ?? 0),
            packagingCharge: Number(data.data.packagingCharge ?? 0),
            platformCharge: Number(data.data.platformCharge ?? 0)
          });
        }
      } catch (err) {
        console.error('Failed to fetch platform settings, using defaults.', err);
      }
    };
    fetchSettings();
  }, []);

  const getDefaultPricing = () => {
    if (!cart) return null;
    const subTotal = cart.totalAmount;
    const gstAmount = Math.round((subTotal * platformSettings.gstPercentage) / 100);
    const packagingCharge = platformSettings.packagingCharge;
    const platformCharge = platformSettings.platformCharge;
    const deliveryCharge = subTotal >= platformSettings.freeDeliveryAbove ? 0 : platformSettings.deliveryCharge;
    const finalAmount = subTotal + gstAmount + deliveryCharge + packagingCharge + platformCharge;

    return {
      subTotal,
      couponDiscount: 0,
      gstAmount,
      packagingCharge,
      platformCharge,
      deliveryCharge,
      finalAmount
    };
  };

  const boysHostels = [
    'Boys Hostel 1 (BH-1)',
    'Boys Hostel 2 (BH-2)',
    'Boys Hostel 3 (BH-3)',
    'Boys Hostel 4 (BH-4)',
    'Boys Hostel 5 (BH-5)',
    'Boys Hostel 6 (BH-6)',
    'Boys Hostel 7 (BH-7 & 7E)',
    'Mega Hostel Boys Block A',
    'Mega Hostel Boys Block B',
    'Mega Hostel Boys Block F',
    'Mega Hostel Boys Block E'
  ];

  const girlsHostels = [
    'Girls Hostel 1 (GH-1)',
    'Girls Hostel 2 (GH-2)',
    'Mega Girls Hostel'
  ];

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQtyChange = async (menuItemId, quantity) => {
    if (quantity < 1) return;
    try {
      await updateCartItemQtyOptimistic(menuItemId, quantity);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemove = async (menuItemId) => {
    try {
      await deleteCartItemOptimistic(menuItemId);
    } catch {}
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setCart(null);
    } catch {}
  };

  const handleOrder = async (paymentMethod) => {
    let hasError = false;

    if (!deliveryAddress.trim()) {
      setShakeAddress(true);
      setTimeout(() => setShakeAddress(false), 500);
      toast.error('Please enter a delivery address');
      hasError = true;
    }

    if (!customerPhone.trim() || !/^[6-9]\d{9}$/.test(customerPhone.trim())) {
      setShakePhone(true);
      setTimeout(() => setShakePhone(false), 500);
      toast.error('Please enter a valid 10-digit mobile number');
      hasError = true;
    }

    if (hasError) return false;

    try {
      const { data } = await createOrder(paymentMethod, selectedCoupon?.couponId, customerPhone.trim(), deliveryAddress.trim());
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      toast.success(`Order placed successfully! #${data.data?.order?.orderNumber || ''}`);
      setCart(null);
      setSelectedCoupon(null);
      setPricingSummary(null);
      // Automatically redirect to orders page after 2.5 seconds
      setTimeout(() => {
        navigate('/orders');
      }, 2500);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order placement failed');
      return false;
    }
  };

  const fetchAndOpenCouponsModal = async () => {
    setIsCouponModalOpen(true);
    setIsFetchingCoupons(true);
    try {
      const { data } = await getCoupons();
      if (data.success) {
        setCouponsList(data.data || []);
      } else {
        setCouponsList([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch coupons');
      setCouponsList([]);
    } finally {
      setIsFetchingCoupons(false);
    }
  };

  const handleApply = async (couponId) => {
    setIsApplyingCoupon(true);
    try {
      const { data } = await applyCoupon(couponId);
      if (data.success && data.data) {
        setSelectedCoupon(data.data.coupon);
        setPricingSummary(data.data.pricing);
        toast.success('Coupon applied successfully.');
        setIsCouponModalOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon(null);
    setPricingSummary(null);
    toast.success('Coupon removed successfully.');
  };

  const CouponSkeleton = () => (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #edf2f7',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      animation: 'pulseSoft 1.5s ease-in-out infinite'
    }}>
      <div style={{ height: '24px', background: '#e2e8f0', borderRadius: '6px', width: '40%' }}></div>
      <div style={{ height: '18px', background: '#edf2f7', borderRadius: '4px', width: '70%' }}></div>
      <div style={{ height: '14px', background: '#edf2f7', borderRadius: '4px', width: '50%' }}></div>
      <div style={{ height: '36px', background: '#edf2f7', borderRadius: '8px', width: '100%', marginTop: '4px' }}></div>
    </div>
  );

  const CouponCard = ({ coupon }) => {
    const isApplied = selectedCoupon?.couponId === coupon._id;
    const expiryStr = coupon.expiryDate 
      ? new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';

    return (
      <div className="card" style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: isApplied ? '1.5px solid #06c169' : '1px solid #edf2f7',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: isApplied ? '0 4px 12px rgba(6, 193, 105, 0.05)' : '0 2px 8px rgba(0,0,0,0.01)',
        position: 'relative',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              display: 'inline-block',
              background: '#fff5f5',
              color: '#b31522',
              fontWeight: 800,
              fontSize: '0.85rem',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px dashed #b31522',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              {coupon.code}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111111' }}>
              {coupon.discountType === 'PERCENTAGE' 
                ? `${coupon.discountValue}% OFF` 
                : `₹${coupon.discountValue} OFF`}
            </div>
          </div>
          {isApplied && (
            <div style={{
              background: '#e6f9f0',
              color: '#06c169',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Check size={12} />
              <span>Applied</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8rem', color: '#718096' }}>
          <div>Min. Order Value: <strong>₹{coupon.minimumOrderValue}</strong></div>
          {coupon.discountType === 'PERCENTAGE' && coupon.maximumDiscount && (
            <div>Max Discount: <strong>₹{coupon.maximumDiscount}</strong></div>
          )}
          {expiryStr && <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '2px' }}>Valid till {expiryStr}</div>}
        </div>

        <button
          type="button"
          onClick={() => handleApply(coupon._id)}
          disabled={isApplyingCoupon || isApplied}
          style={{
            marginTop: '6px',
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            background: isApplied ? '#06c169' : '#b31522',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.85rem',
            border: 'none',
            cursor: (isApplyingCoupon || isApplied) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            opacity: (isApplyingCoupon && !isApplied) ? 0.7 : 1
          }}
          className="hover-lift"
        >
          {isApplyingCoupon && !isApplied ? (
            <>
              <Loader size={14} className="animate-spin" />
              <span>Applying...</span>
            </>
          ) : isApplied ? (
            <span>Applied Successfully</span>
          ) : (
            <span>Apply Coupon</span>
          )}
        </button>
      </div>
    );
  };

  const getSelectStyle = (isHostelSelected) => ({
    padding: '10px 36px 10px 34px',
    borderRadius: '20px',
    border: isHostelSelected ? '2px solid #b31522' : '1px solid #edf2f7',
    backgroundColor: isHostelSelected ? '#fff5f5' : '#ffffff',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px',
    color: isHostelSelected ? '#b31522' : '#4a5568',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    outline: 'none',
    minWidth: '150px'
  });

  return (
    <div className="home-dashboard page animate-fade-in" style={{ paddingBottom: '96px', background: '#fcfcfc' }}>
      
      {/* Header Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }} className="animate-slide-up">
        <button 
          className="circle-icon-btn hover-scale" 
          onClick={() => {
            if (activeTab === 'food' && checkoutStep === 'address') {
              setCheckoutStep('cart');
            } else {
              navigate(-1);
            }
          }}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111111' }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#718096' }}>
          {(activeTab === 'food' && checkoutStep === 'address') ? 'Back to Cart' : 'Back'}
        </span>
      </div>

      <div className="section-header-row animate-slide-up delay-1" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 850, color: '#111111', margin: 0 }}>
          {activeTab === 'food' && checkoutStep === 'address' ? 'Select Delivery Address' : 'Your Cart'}
        </h1>
      </div>

      {/* Slidable Toggle Switcher */}
      {!(activeTab === 'food' && checkoutStep === 'address') && (
        <div style={{ 
          display: 'flex', 
          background: '#f1f5f9', 
          borderRadius: '50px', 
          padding: '4px', 
          position: 'relative', 
          width: '100%', 
          maxWidth: '400px', 
          margin: '0 auto 24px auto',
          border: '1.5px solid #edf2f7',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          {/* Sliding indicator */}
          <div style={{
            position: 'absolute',
            top: '4px',
            bottom: '4px',
            left: activeTab === 'food' ? '4px' : '50%',
            width: 'calc(50% - 4px)',
            background: '#ffffff',
            borderRadius: '50px',
            boxShadow: '0 2px 8px rgba(179, 21, 34, 0.08)',
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1
          }}></div>

          {/* Food Cart Tab Button */}
          <button
            type="button"
            onClick={() => setActiveTab('food')}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '12px 0',
              fontSize: '0.9rem',
              fontWeight: 800,
              color: activeTab === 'food' ? '#b31522' : '#64748b',
              cursor: 'pointer',
              zIndex: 2,
              transition: 'color 0.2s',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Coffee size={16} />
            <span>Food Cart</span>
          </button>

          {/* Marketplace Cart Tab Button */}
          <button
            type="button"
            onClick={() => setActiveTab('marketplace')}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '12px 0',
              fontSize: '0.9rem',
              fontWeight: 800,
              color: activeTab === 'marketplace' ? '#b31522' : '#64748b',
              cursor: 'pointer',
              zIndex: 2,
              transition: 'color 0.2s',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ShoppingBag size={16} />
            <span>Market Cart</span>
          </button>
        </div>
      )}

      {activeTab === 'marketplace' ? (
        <MarketplaceCart isEmbedded={true} />
      ) : loading && !cart ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <p style={{ fontWeight: 650, color: '#718096' }}>Loading your cart...</p>
        </div>
      ) : cartError ? (
        <div className="card animate-scale-in" style={{ background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '24px', textAlign: 'center', padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={36} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', margin: 0 }}>Unable to Load Cart</h2>
          <p style={{ fontSize: '0.95rem', color: '#dc2626', maxWidth: '400px', margin: 0, lineHeight: 1.5, fontWeight: 700 }}>
            {cartError}
          </p>
          <p style={{ fontSize: '0.88rem', color: '#718096', maxWidth: '320px', margin: '0 auto', lineHeight: 1.4 }}>
            Some items in your cart may be out of stock or unavailable. Please clear your cart to start fresh.
          </p>
          <button 
            onClick={handleClear}
            className="btn btn-primary hover-lift hover-darken" 
            style={{ width: 'auto', padding: '12px 28px', borderRadius: '12px', background: '#dc2626', borderColor: '#dc2626', color: '#ffffff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginTop: '8px' }}
          >
            Clear Cart & Start Over
          </button>
        </div>
      ) : !cart || cart.items?.length === 0 ? (
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
                    gap: '12px', 
                    overflowX: 'auto', 
                    paddingBottom: '8px',
                    width: '100%',
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', fontSize: '14px', pointerEvents: 'none', zIndex: 1 }}>👦</span>
                    <select 
                      value={boysHostels.includes(deliveryAddress) ? deliveryAddress : ""}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      style={getSelectStyle(boysHostels.includes(deliveryAddress))}
                    >
                      <option value="" disabled>Boys Hostels</option>
                      {boysHostels.map(hostel => (
                        <option key={hostel} value={hostel}>{hostel}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', fontSize: '14px', pointerEvents: 'none', zIndex: 1 }}>👧</span>
                    <select 
                      value={girlsHostels.includes(deliveryAddress) ? deliveryAddress : ""}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      style={getSelectStyle(girlsHostels.includes(deliveryAddress))}
                    >
                      <option value="" disabled>Girls Hostels</option>
                      {girlsHostels.map(hostel => (
                        <option key={hostel} value={hostel}>{hostel}</option>
                      ))}
                    </select>
                  </div>
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
                    className={shakeAddress ? 'shake-input' : ''}
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

              {/* Mobile Number Input */}
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
                <label htmlFor="customerPhone" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111111' }}>
                  Mobile Number <span style={{ color: '#b31522' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '16px', color: '#718096' }} />
                  <input
                    type="tel"
                    id="customerPhone"
                    className={shakePhone ? 'shake-input' : ''}
                    placeholder="Enter your 10-digit mobile number..."
                    value={customerPhone}
                    maxLength={10}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      padding: '16px 16px 16px 46px',
                      borderRadius: '16px',
                      border: customerPhone && !/^[6-9]\d{9}$/.test(customerPhone) ? '1.5px solid #b31522' : '1.5px solid #edf2f7',
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
                  This number will be shared with the vendor and delivery agent for order coordination.
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
                  {customerPhone && (
                    <div>
                      <p style={{ margin: '0 0 6px 0', color: '#718096' }}>
                        <strong>Contact Number:</strong>
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={16} style={{ color: '#b31522', flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, color: '#111111' }}>{customerPhone}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bill summary breakdown */}
                <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #edf2f7' }}>
                  {(() => {
                    const currentPricing = pricingSummary || getDefaultPricing();
                    if (!currentPricing) return null;
                    return (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#718096' }}>Subtotal</span>
                          <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{currentPricing.subTotal}</span>
                        </div>
                        {currentPricing.couponDiscount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: '#718096' }}>Coupon Discount</span>
                            <span style={{ color: '#06c169', fontWeight: 700 }}>-&#8377;{currentPricing.couponDiscount}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#718096' }}>GST</span>
                          <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{currentPricing.gstAmount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#718096' }}>Packaging Charge</span>
                          <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{currentPricing.packagingCharge}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#718096' }}>Platform Fee</span>
                          <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{currentPricing.platformCharge}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#718096' }}>Delivery Charge</span>
                          <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{currentPricing.deliveryCharge}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, borderTop: '1px solid #edf2f7', paddingTop: '10px', marginTop: '4px', color: '#111111' }}>
                          <span>Final Amount</span>
                          <span>&#8377;{currentPricing.finalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Confirm & Place Order trigger */}
                <SlideConfirmButton 
                  variant="destructive"
                  onConfirm={() => handleOrder(paymentMethod)}
                  disabled={false}
                  confirmedLabel="Order Confirmed"
                  style={{ marginTop: '12px' }}
                >
                  Slide to Place Order
                </SlideConfirmButton>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#b31522' }}>
                        &#8377;{item.menuItem?.price}
                      </span>
                      {item.menuItem?.stockQty !== undefined && item.quantity >= item.menuItem.stockQty && (
                        <span style={{ 
                          fontSize: '0.68rem', 
                          color: '#d97706', 
                          background: '#fef3c7', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontWeight: 800,
                          border: '1px solid #f59e0b'
                        }}>
                          Max stock reached ({item.menuItem.stockQty} available)
                        </span>
                      )}
                    </div>

                    {/* Quantity controls and remove button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div className="quantity-pill" style={{ height: '36px', padding: '0 8px', display: 'flex', alignItems: 'center', background: '#f7fafc', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '12px', opacity: updatingItems[item.menuItem?._id || item.menuItem] ? 0.6 : 1 }}>
                        <button 
                          className="qty-btn hover-scale" 
                          onClick={() => handleQtyChange(item.menuItem?._id || item.menuItem, item.quantity - 1)}
                          disabled={updatingItems[item.menuItem?._id || item.menuItem]}
                          style={{ fontSize: '1rem', width: '20px', border: 'none', background: 'none', cursor: updatingItems[item.menuItem?._id || item.menuItem] ? 'not-allowed' : 'pointer', color: '#718096' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-number" style={{ width: '20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', color: '#111111' }}>{item.quantity}</span>
                        <button 
                          className="qty-btn hover-scale" 
                          onClick={() => handleQtyChange(item.menuItem?._id || item.menuItem, item.quantity + 1)}
                          disabled={updatingItems[item.menuItem?._id || item.menuItem] || (item.menuItem?.stockQty !== undefined && item.quantity >= item.menuItem.stockQty)}
                          style={{ 
                            fontSize: '1rem', 
                            width: '20px', 
                            border: 'none', 
                            background: 'none', 
                            cursor: (updatingItems[item.menuItem?._id || item.menuItem] || (item.menuItem?.stockQty !== undefined && item.quantity >= item.menuItem.stockQty)) ? 'not-allowed' : 'pointer', 
                            color: (updatingItems[item.menuItem?._id || item.menuItem] || (item.menuItem?.stockQty !== undefined && item.quantity >= item.menuItem.stockQty)) ? '#cbd5e0' : '#718096' 
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button 
                        className="hover-scale" 
                        onClick={() => handleRemove(item.menuItem?._id || item.menuItem)}
                        disabled={updatingItems[item.menuItem?._id || item.menuItem]}
                        style={{ 
                          border: 'none',
                          background: 'none',
                          color: updatingItems[item.menuItem?._id || item.menuItem] ? '#cbd5e0' : '#dc2626',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: updatingItems[item.menuItem?._id || item.menuItem] ? 'not-allowed' : 'pointer',
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
              


              {/* Premium Coupons & Offers Section */}
              <div className="card hover-lift" style={{
                padding: '16px',
                background: '#ffffff',
                border: '1px solid #edf2f7',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#fff5f5', color: '#b31522', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                      <Tag size={18} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111111' }}>Coupons & Offers</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={fetchAndOpenCouponsModal}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#b31522', 
                      fontWeight: 800, 
                      fontSize: '0.85rem', 
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    View Available Coupons
                  </button>
                </div>

                {!selectedCoupon ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: '#f8fafc', 
                    padding: '12px 16px', 
                    borderRadius: '12px',
                    border: '1px dashed #e2e8f0'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>
                      No coupon applied
                    </span>
                    <button 
                      type="button" 
                      onClick={fetchAndOpenCouponsModal}
                      style={{ 
                        background: '#b31522', 
                        color: '#ffffff', 
                        border: 'none', 
                        padding: '6px 14px', 
                        borderRadius: '8px', 
                        fontWeight: 700, 
                        fontSize: '0.8rem', 
                        cursor: 'pointer' 
                      }}
                    >
                      Apply Coupon
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: '#e6f9f0', 
                    padding: '12px 16px', 
                    borderRadius: '12px',
                    border: '1px solid #06c169'
                  }} className="animate-scale-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{ color: '#06c169', display: 'flex', flexShrink: 0 }} className="animate-pulse-soft">
                        <Check size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            background: '#06c169', 
                            color: '#ffffff', 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            padding: '2px 8px', 
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {selectedCoupon.code}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111111' }}>
                            Applied
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#06c169', fontWeight: 700, marginTop: '2px' }}>
                          Saved ₹{selectedCoupon.couponDiscount} on this order!
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        type="button" 
                        onClick={fetchAndOpenCouponsModal}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#06c169', 
                          fontWeight: 800, 
                          fontSize: '0.8rem', 
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          padding: 0
                        }}
                      >
                        Change
                      </button>
                      <span style={{ color: '#cbd5e0', fontSize: '0.8rem' }}>|</span>
                      <button 
                        type="button" 
                        onClick={handleRemoveCoupon}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#718096', 
                          fontWeight: 700, 
                          fontSize: '0.8rem', 
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          padding: 0
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Bill receipt card */}
              <div className="card animate-scale-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111111', borderBottom: '1px solid #edf2f7', paddingBottom: '12px', margin: 0 }}>
                  Bill Summary
                </h3>

                {/* Grey receipt box */}
                <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #edf2f7' }}>
                  {(() => {
                    const currentPricing = pricingSummary || getDefaultPricing();
                    if (!currentPricing) return null;
                    return (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#718096' }}>Subtotal</span>
                          <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{currentPricing.subTotal}</span>
                        </div>
                        {currentPricing.couponDiscount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: '#718096' }}>Coupon Discount</span>
                            <span style={{ color: '#06c169', fontWeight: 700 }}>-&#8377;{currentPricing.couponDiscount}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#718096' }}>GST</span>
                          <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{currentPricing.gstAmount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#718096' }}>Packaging Charge</span>
                          <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{currentPricing.packagingCharge}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#718096' }}>Platform Fee</span>
                          <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{currentPricing.platformCharge}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#718096' }}>Delivery Charge</span>
                          <span style={{ fontWeight: 700, color: '#111111' }}>&#8377;{currentPricing.deliveryCharge}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, borderTop: '1px solid #edf2f7', paddingTop: '10px', marginTop: '4px', color: '#111111' }}>
                          <span>Final Amount</span>
                          <span>&#8377;{currentPricing.finalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
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

      
      {/* Coupon Bottom Sheet / Modal Overlay */}
      {isCouponModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCouponModalOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: isMobile ? '0' : '20px',
            animation: 'fadeIn 0.25s ease-in-out forwards'
          }}
        >
          <div 
            style={{
              background: '#ffffff',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              borderBottomLeftRadius: isMobile ? '0px' : '24px',
              borderBottomRightRadius: isMobile ? '0px' : '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: isMobile ? '80vh' : '85vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
              border: '1px solid #edf2f7',
              animation: isMobile ? 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              boxSizing: 'border-box'
            }}
          >
            {isMobile && (
              <div style={{
                width: '40px',
                height: '4px',
                background: '#cbd5e0',
                borderRadius: '2px',
                margin: '-8px auto 8px auto',
                flexShrink: 0
              }} />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 850, color: '#111111', margin: 0 }}>
                Available Coupons
              </h3>
              <button 
                type="button"
                onClick={() => setIsCouponModalOpen(false)} 
                style={{
                  background: '#f8fafc',
                  border: '1px solid #edf2f7',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#718096',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              overflowY: 'auto', 
              paddingRight: '4px', 
              flex: 1 
            }}>
              {isFetchingCoupons ? (
                <>
                  <CouponSkeleton />
                  <CouponSkeleton />
                  <CouponSkeleton />
                </>
              ) : couponsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#718096', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#f7fafc', color: '#a0aec0', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Percent size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#111111', fontWeight: 700 }}>No coupons available</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>Check back later for exclusive discount codes.</p>
                  </div>
                </div>
              ) : (
                <ProgressiveCardReveal
                  activeIndex={activeCouponIndex}
                  onActiveChange={setActiveCouponIndex}
                  style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
                >
                  {couponsList.map(coupon => {
                    const isApplied = selectedCoupon?.couponId === coupon._id;
                    const expiryStr = coupon.expiryDate 
                      ? new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '';
                    return (
                      <ProgressiveCardReveal.Card key={coupon._id}>
                        <ProgressiveCardReveal.CardCollapsed>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={{ fontWeight: 800, color: '#111111', fontSize: '0.9rem' }}>
                              {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                            </span>
                            <span style={{ background: '#fff5f5', color: '#b31522', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 800, border: '1px dashed #b31522' }}>
                              {coupon.code}
                            </span>
                          </div>
                        </ProgressiveCardReveal.CardCollapsed>
                        <ProgressiveCardReveal.CardExpanded>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{
                                  display: 'inline-block',
                                  background: '#fff5f5',
                                  color: '#b31522',
                                  fontWeight: 800,
                                  fontSize: '0.85rem',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  border: '1px dashed #b31522',
                                  letterSpacing: '0.5px',
                                  marginBottom: '6px'
                                }}>
                                  {coupon.code}
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111111' }}>
                                  {coupon.discountType === 'PERCENTAGE' 
                                    ? `${coupon.discountValue}% OFF` 
                                    : `₹${coupon.discountValue} OFF`}
                                </div>
                              </div>
                              {isApplied && (
                                <div style={{
                                  background: '#e6f9f0',
                                  color: '#06c169',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  padding: '4px 8px',
                                  borderRadius: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <Check size={12} />
                                  <span>Applied</span>
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8rem', color: '#718096' }}>
                              <div>Min. Order Value: <strong>₹{coupon.minimumOrderValue}</strong></div>
                              {coupon.discountType === 'PERCENTAGE' && coupon.maximumDiscount && (
                                <div>Max Discount: <strong>₹{coupon.maximumDiscount}</strong></div>
                              )}
                              {expiryStr && <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '2px' }}>Valid till {expiryStr}</div>}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleApply(coupon._id); }}
                              disabled={isApplyingCoupon || isApplied}
                              style={{
                                marginTop: '6px',
                                width: '100%',
                                padding: '10px',
                                borderRadius: '10px',
                                background: isApplied ? '#06c169' : '#b31522',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                border: 'none',
                                cursor: (isApplyingCoupon || isApplied) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                opacity: (isApplyingCoupon && !isApplied) ? 0.7 : 1
                              }}
                            >
                              {isApplyingCoupon && !isApplied ? (
                                <>
                                  <Loader size={14} className="animate-spin" />
                                  <span>Applying...</span>
                                </>
                              ) : isApplied ? (
                                <span>Applied Successfully</span>
                              ) : (
                                <span>Apply Coupon</span>
                              )}
                            </button>
                          </div>
                        </ProgressiveCardReveal.CardExpanded>
                      </ProgressiveCardReveal.Card>
                    );
                  })}
                </ProgressiveCardReveal>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Responsive layout overrides via media queries */}
      <style>{`
        /* Desktop: side-by-side 2-column layout */
        @media (min-width: 769px) {
          .split-layout-container {
            display: flex !important;
            flex-direction: row !important;
            gap: 32px !important;
            align-items: flex-start !important;
          }
          .split-left-main {
            flex: 1 1 0% !important;
            min-width: 0 !important;
          }
          .split-right-aside {
            flex: 0 0 340px !important;
            width: 340px !important;
            position: sticky !important;
            top: 24px !important;
          }
        }
        @media (min-width: 1024px) {
          .split-right-aside {
            flex: 0 0 380px !important;
            width: 380px !important;
          }
        }
        /* Mobile: single stacked column */
        @media (max-width: 768px) {
          .split-layout-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          .split-right-aside {
            position: relative !important;
            top: auto !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
