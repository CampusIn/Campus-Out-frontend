import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRestaurantById } from '../api/restaurant.api';
import { getRestaurantMenu } from '../api/menu.api';
import { addToCart, getCart, updateCartItemQty, deleteCartItem } from '../api/cart.api';
import { getRestaurantReviews } from '../api/review.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BottomNav from '../components/BottomNav';
import { ArrowLeft, Heart, Share2, Star, Clock, Plus, Minus, MapPin, Info as InfoIcon } from 'lucide-react';

export default function RestaurantDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Menu'); // 'Menu', 'Reviews', 'Info'
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [showCoupon, setShowCoupon] = useState(true);

  const fetchCart = async () => {
    if (!user) return;
    try {
      const { data } = await getCart();
      setCart(data.data);
    } catch {
      setCart(null);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [restRes, menuRes, revRes] = await Promise.all([
          getRestaurantById(id),
          getRestaurantMenu(id),
          getRestaurantReviews(id),
        ]);
        setRestaurant(restRes.data.data);
        setMenu(menuRes.data.data || []);
        setReviews(revRes.data.data.reviews || []);
        await fetchCart();
      } catch {
        navigate('/restaurants');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, user]);

  const handleAdd = async (menuItemId) => {
    if (!user) return navigate('/login');
    try {
      await addToCart({ menuItemId, quantity: 1 });
      toast.success('Added to cart!');
      await fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleIncrement = async (menuItemId, currentQty) => {
    try {
      await updateCartItemQty(menuItemId, currentQty + 1);
      await fetchCart();
    } catch (err) {
      toast.error('Failed to update quantity');
    }
  };

  const handleDecrement = async (menuItemId, currentQty) => {
    try {
      if (currentQty === 1) {
        await deleteCartItem(menuItemId);
      } else {
        await updateCartItemQty(menuItemId, currentQty - 1);
      }
      await fetchCart();
    } catch (err) {
      toast.error('Failed to update quantity');
    }
  };

  if (loading) {
    return (
      <div className="home-dashboard page animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p className="loading-text" style={{ color: '#718096' }}>Loading restaurant menu...</p>
      </div>
    );
  }

  if (!restaurant) return null;

  const subcategories = ['All', ...new Set(menu.map(item => item.category || 'General'))];

  // Filter menu items based on active subcategory
  const filteredMenu = activeSubcategory === 'All' 
    ? menu 
    : menu.filter(item => (item.category || 'General') === activeSubcategory);

  // Check item quantity in cart helper
  const getCartQty = (menuItemId) => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find(i => i.menuItemId === menuItemId || i.menuItemId?._id === menuItemId);
    return item ? item.quantity : 0;
  };

  // Get total quantity of items in cart
  const cartTotalQty = cart && cart.items 
    ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  // Cover image fallback
  const coverImage = restaurant.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="home-dashboard page animate-fade-in" style={{ padding: 0, background: '#fcfcfc', minHeight: '100vh', paddingBottom: '120px' }}>
      
      {/* Restaurant Header Cover */}
      <div className="restaurant-cover-image-container animate-scale-in" style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
        <img src={coverImage} alt={restaurant.restaurantName} className="restaurant-cover-image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div className="restaurant-cover-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
          {/* Overlaid Actions */}
          <div className="restaurant-cover-nav" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <button 
              type="button"
              className="restaurant-cover-nav-btn hover-scale" 
              onClick={() => navigate('/restaurants')}
              style={{ background: '#ffffff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111111', cursor: 'pointer' }}
            >
              <ArrowLeft size={20} />
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                className="restaurant-cover-nav-btn favorite-btn hover-scale"
                onClick={() => setIsFavorite(!isFavorite)}
                style={{ background: '#ffffff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isFavorite ? '#b31522' : '#111111', cursor: 'pointer' }}
              >
                <Heart size={20} fill={isFavorite ? '#b31522' : 'none'} />
              </button>
              <button 
                type="button"
                className="restaurant-cover-nav-btn hover-scale"
                style={{ background: '#ffffff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111111', cursor: 'pointer' }}
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Info Panel */}
      <div className="restaurant-details-wrapper animate-slide-up" style={{ padding: '24px 20px' }}>
        <h1 className="restaurant-detail-title" style={{ fontSize: '1.75rem', fontWeight: 850, color: '#111111', margin: '0 0 4px 0' }}>{restaurant.restaurantName}</h1>
        <p className="restaurant-detail-cuisines" style={{ fontSize: '0.9rem', color: '#718096', margin: '0 0 12px 0' }}>
          {restaurant.category} &middot; Fast Food &middot; Beverages
        </p>
        
        {/* Rating and Delivery stats */}
        <div className="restaurant-detail-stats-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#111111', fontWeight: 700, background: '#f7fafc', padding: '12px 16px', borderRadius: '12px', width: 'fit-content', marginBottom: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={14} color="#ffc700" fill="#ffc700" />
            <span>{restaurant.averageRating > 0 ? restaurant.averageRating.toFixed(1) : '4.6'} (230+)</span>
          </span>
          <span className="restaurant-detail-stats-divider" style={{ color: '#cbd5e0' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} color="#718096" />
            <span>{restaurant.deliveryTime || '20-30'} min</span>
          </span>
          <span className="restaurant-detail-stats-divider" style={{ color: '#cbd5e0' }}>|</span>
          <span>₹150 for two</span>
        </div>

        {/* Promo Coupon Banner */}
        {showCoupon && (
          <div className="premium-coupon-banner animate-scale-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff5f5', border: '1px dashed #b31522', borderRadius: '12px', padding: '12px 16px', color: '#b31522', fontWeight: 600, fontSize: '0.85rem', marginBottom: '28px' }}>
            <span>40% OFF up to ₹100 with code</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="coupon-code-badge" style={{ background: '#b31522', color: '#ffffff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>CAMPUS40</span>
              <button className="coupon-close-btn" onClick={() => setShowCoupon(false)} style={{ background: 'none', border: 'none', color: '#b31522', fontWeight: 800, cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px' }}>×</button>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="detail-tab-bar" style={{ display: 'flex', borderBottom: '2px solid #edf2f7', marginBottom: '24px' }}>
          {['Menu', 'Reviews', 'Info'].map((tab) => (
            <button
              key={tab}
              className={`detail-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: 'none',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: activeTab === tab ? '#b31522' : '#718096',
                borderBottom: activeTab === tab ? '3px solid #b31522' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'Reviews' ? `Reviews (${reviews.length > 0 ? reviews.length : '230'})` : tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'Menu' && (
          <div>
            {/* Horizontal sub-category badging list */}
            <div className="subcategory-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
              {subcategories.map((subcat) => (
                <button
                  key={subcat}
                  className={`subcategory-chip hover-scale ${activeSubcategory === subcat ? 'active' : ''}`}
                  onClick={() => setActiveSubcategory(subcat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    background: activeSubcategory === subcat ? '#b31522' : '#f1f5f9',
                    color: activeSubcategory === subcat ? '#ffffff' : '#4a5568',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {subcat}
                </button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="menu-items-list responsive-grid-2">
              {filteredMenu.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#718096', padding: '24px' }}>No menu items found</p>
              ) : (
                filteredMenu.map((item) => {
                  const qty = getCartQty(item._id);
                  const itemImage = item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=150&q=80';
                  
                  return (
                    <div key={item._id} className="menu-item-row-card hover-lift" style={{ display: 'flex', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '16px', padding: '16px', gap: '16px' }}>
                      <div className="menu-item-left" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div className="menu-item-name" style={{ fontWeight: 700, fontSize: '1rem', color: '#111111', marginBottom: '4px' }}>{item.name}</div>
                          <div className="menu-item-desc" style={{ fontSize: '0.8rem', color: '#718096', lineHeight: 1.4, marginBottom: '8px' }}>
                            {item.description || 'Beef patty, cheese, lettuce, tomato, onion.'}
                          </div>
                        </div>
                        <div className="menu-item-price" style={{ fontWeight: 800, color: '#111111', fontSize: '0.95rem' }}>₹{item.price}</div>
                      </div>

                      <div className="menu-item-right-wrapper" style={{ position: 'relative', width: '96px', height: '96px', borderRadius: '12px', flexShrink: 0 }}>
                        <img src={itemImage} alt={item.name} className="menu-item-img" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                        
                        {/* Quantity Controller overlay / Add Button */}
                        <div style={{
                          position: 'absolute',
                          bottom: '-8px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                          width: '100%'
                        }}>
                          {qty > 0 ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              background: '#ffffff',
                              borderRadius: '20px',
                              padding: '4px 8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              gap: '8px',
                              border: '1.5px solid #cbd5e0'
                            }}>
                              <button 
                                type="button" 
                                className="quantity-control-btn hover-scale"
                                onClick={() => handleDecrement(item._id, qty)}
                                style={{ width: '22px', height: '22px', border: 'none', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="quantity-display-value" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111111' }}>{qty}</span>
                              <button 
                                type="button" 
                                className="quantity-control-btn hover-scale"
                                onClick={() => handleIncrement(item._id, qty)}
                                style={{ width: '22px', height: '22px', border: 'none', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : item.isAvailable ? (
                            <button
                              type="button"
                              className="menu-add-btn-small hover-scale hover-lift"
                              onClick={() => handleAdd(item._id)}
                              style={{
                                background: '#ffffff',
                                border: '1.5px solid #b31522',
                                color: '#b31522',
                                padding: '4px 16px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                outline: 'none'
                              }}
                            >
                              Add
                            </button>
                          ) : (
                            <span style={{ background: '#e2e8f0', color: '#718096', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                              Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {(reviews.length > 0 ? reviews : [
              {
                _id: 'mock-rev-1',
                user: { username: 'Emma Watson' },
                rating: 5,
                comment: 'Delicious food! The ingredients feel very premium, and the delivery was incredibly prompt and fresh!'
              },
              {
                _id: 'mock-rev-2',
                user: { username: 'Tony Stark' },
                rating: 4,
                comment: 'Great portion sizes. The taste is authentic and very satisfying. A great addition to campus delivery!'
              }
            ]).map((r) => {
              const initial = r.user?.username ? r.user.username.charAt(0).toUpperCase() : 'U';
              return (
                <div key={r._id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#fff5f5',
                    color: '#b31522',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                    flexShrink: 0
                  }}>
                    {initial}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111111', margin: 0 }}>{r.user?.username || 'Anonymous'}</h4>
                      <span style={{ color: '#ffc700', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Star size={12} fill="#ffc700" color="#ffc700" /> {r.rating}
                      </span>
                    </div>
                    {r.comment && (
                      <p style={{ fontSize: '0.85rem', color: '#718096', lineHeight: 1.4, margin: 0 }}>
                        {r.comment}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'Info' && (
          <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#718096', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <MapPin size={18} color="#b31522" />
              <span><strong style={{ color: '#111111' }}>Address:</strong> {restaurant.location || 'Greene St, New York'}</span>
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Clock size={18} color="#b31522" />
              <span><strong style={{ color: '#111111' }}>Delivery Time:</strong> {restaurant.deliveryTime || '20-30'} minutes</span>
            </p>
            <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: 0 }}>
              <InfoIcon size={18} color="#b31522" style={{ marginTop: '3px' }} />
              <span><strong style={{ color: '#111111' }}>Description:</strong> {restaurant.description || 'Prepared fresh using high-quality ingredients.'}</span>
            </p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Cart Basket Bar */}
      {cartTotalQty > 0 && (
        <Link 
          to="/cart" 
          className="sticky-basket-bar hover-lift animate-pulse-soft"
          style={{
            bottom: '24px',
            textDecoration: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#b31522',
            padding: '16px 24px',
            borderRadius: '16px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '1rem',
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 40px)',
            maxWidth: '480px',
            boxShadow: '0 8px 24px rgba(179, 21, 34, 0.3)',
            zIndex: 999
          }}
        >
          <span>View Cart ({cartTotalQty})</span>
          <span className="basket-dot" style={{ width: '6px', height: '6px', background: '#ffffff', borderRadius: '50%' }}></span>
          <span>₹{(cart.totalAmount || 0).toFixed(2)}</span>
        </Link>
      )}
    </div>
  );
}
