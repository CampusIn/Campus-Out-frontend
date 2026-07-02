import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { getRestaurantById } from '../api/restaurant.api';
import { getRestaurantMenu } from '../api/menu.api';
import { getRestaurantReviews } from '../api/review.api';
import { getCoupons } from '../api/order.api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import BottomNav from '../components/BottomNav';
import { ArrowLeft, Heart, Share2, Star, Clock, Plus, Minus, MapPin, Info as InfoIcon, ShoppingBag, Search, Users, ChevronDown, ChevronUp, Flame } from 'lucide-react';

export default function RestaurantDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { cart, fetchCart, addToCartOptimistic, updateCartItemQtyOptimistic, deleteCartItemOptimistic } = useCart();
  
  const [activeTab, setActiveTab] = useState('Menu'); // 'Menu', 'Reviews', 'Info'
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [dishSearch, setDishSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);
  const [ratingsOnly, setRatingsOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [bubblePos, setBubblePos] = useState({ x: null, y: null });
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });

  const onPointerDown = useCallback((e) => {
    isDragging.current = false;
    const rect = dragRef.current.getBoundingClientRect();
    const startX = e.clientX ?? e.touches?.[0]?.clientX;
    const startY = e.clientY ?? e.touches?.[0]?.clientY;
    dragStart.current = { mx: startX, my: startY, bx: rect.left, by: rect.top };
    const onMove = (me) => {
      const cx = me.clientX ?? me.touches?.[0]?.clientX;
      const cy = me.clientY ?? me.touches?.[0]?.clientY;
      const dx = Math.abs(cx - dragStart.current.mx);
      const dy = Math.abs(cy - dragStart.current.my);
      if (dx > 4 || dy > 4) isDragging.current = true;
      const newX = dragStart.current.bx + (cx - dragStart.current.mx);
      const newY = dragStart.current.by + (cy - dragStart.current.my);
      const bw = dragRef.current?.offsetWidth || 64;
      const bh = dragRef.current?.offsetHeight || 64;
      setBubblePos({
        x: Math.max(8, Math.min(window.innerWidth - bw - 8, newX)),
        y: Math.max(8, Math.min(window.innerHeight - bh - 8, newY))
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  }, []);

  const handleBubbleClick = useCallback(() => {
    if (!isDragging.current) setCartExpanded(prev => !prev);
  }, []);
  const [showCoupon, setShowCoupon] = useState(true);
  const [bestCoupon, setBestCoupon] = useState({
    code: 'CAMPUS40',
    discountType: 'PERCENTAGE',
    discountValue: 40,
    maximumDiscount: 100
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (location.state?.searchDish) {
      setDishSearch(location.state.searchDish);
    }
  }, [location.state]);

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

        if (user) {
          try {
            const couponRes = await getCoupons();
            const couponsList = couponRes.data?.data || [];
            if (couponsList.length > 0) {
              setBestCoupon(couponsList[0]);
            } else {
              setBestCoupon(null);
            }
          } catch (e) {
            console.error('Error fetching coupons:', e);
          }
        }
      } catch {
        navigate('/restaurants');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, user]);

  useEffect(() => {
    if (menu.length > 0) {
      const initial = {};
      menu.forEach(item => {
        initial[item.category || 'General'] = true;
      });
      setExpandedCategories(initial);
    }
  }, [menu]);

  const handleAdd = async (menuItemId) => {
    if (!user) return navigate('/login');
    const menuItemObj = menu.find(item => item._id === menuItemId);
    if (!menuItemObj) return;
    try {
      await addToCartOptimistic(menuItemObj, id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleIncrement = async (menuItemId, currentQty) => {
    try {
      await updateCartItemQtyOptimistic(menuItemId, currentQty + 1);
    } catch (err) {
      toast.error('Failed to update quantity');
    }
  };

  const handleDecrement = async (menuItemId, currentQty) => {
    try {
      if (currentQty === 1) {
        await deleteCartItemOptimistic(menuItemId);
      } else {
        await updateCartItemQtyOptimistic(menuItemId, currentQty - 1);
      }
    } catch (err) {
      toast.error('Failed to update quantity');
    }
  };

  const displayTopPicks = useMemo(() => {
    if (!menu || menu.length === 0) return [];
    const withImages = menu.filter(item => item.image);
    const sourceList = withImages.length > 0 ? withImages : menu;
    // Stable random shuffle
    return [...sourceList]
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
  }, [menu]);

  if (loading) {
    return (
      <div className="restaurant-detail-page page animate-fade-in" style={{ paddingBottom: '96px', background: '#fcfcfc' }}>
        {/* Dark / Premium Header Wrapper Skeleton */}
        <div className="restaurant-detail-header-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              type="button" 
              onClick={() => navigate('/restaurants')}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
            >
              <ArrowLeft size={24} />
            </button>
          </div>
        </div>

        {/* Floating White Info Card Skeleton */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '20px', 
          border: '1px solid #edf2f7', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)', 
          margin: '-100px 16px 0 16px', 
          padding: '35px 30px', 
          position: 'relative', 
          zIndex: 10 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              {/* Title shimmer */}
              <div className="skeleton-shimmer" style={{ width: '60%', height: '24px', borderRadius: '8px', marginBottom: '12px' }}></div>
              {/* Meta shimmer */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="skeleton-shimmer" style={{ width: '70px', height: '16px', borderRadius: '6px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '100px', height: '16px', borderRadius: '6px' }}></div>
              </div>
            </div>
            {/* Rating box shimmer */}
            <div className="skeleton-shimmer" style={{ width: '56px', height: '48px', borderRadius: '12px' }}></div>
          </div>

          <div style={{ borderTop: '1.5px dashed #edf2f7', margin: '20px 0 16px 0' }}></div>

          {/* Location info shimmer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="skeleton-shimmer" style={{ width: '16px', height: '16px', borderRadius: '50%' }}></div>
            <div className="skeleton-shimmer" style={{ width: '40%', height: '14px', borderRadius: '4px' }}></div>
          </div>
        </div>

        {/* Tab row shimmer */}
        <div style={{ display: 'flex', borderBottom: '1px solid #edf2f7', margin: '24px 16px 0 16px', paddingBottom: '2px', gap: '24px' }}>
          <div className="skeleton-shimmer" style={{ width: '80px', height: '20px', borderRadius: '4px', marginBottom: '8px' }}></div>
          <div className="skeleton-shimmer" style={{ width: '80px', height: '20px', borderRadius: '4px', marginBottom: '8px' }}></div>
          <div className="skeleton-shimmer" style={{ width: '80px', height: '20px', borderRadius: '4px', marginBottom: '8px' }}></div>
        </div>

        {/* Search bar shimmer */}
        <div style={{ padding: '0 16px', marginTop: '16px' }}>
          <div className="skeleton-shimmer" style={{ width: '100%', height: '42px', borderRadius: '16px' }}></div>
        </div>

        {/* Filters shimmer */}
        <div style={{ padding: '0 16px', marginTop: '12px', display: 'flex', gap: '8px' }}>
          <div className="skeleton-shimmer" style={{ width: '90px', height: '30px', borderRadius: '20px' }}></div>
          <div className="skeleton-shimmer" style={{ width: '110px', height: '30px', borderRadius: '20px' }}></div>
        </div>

        {/* Categories / items list shimmer */}
        <div style={{ padding: '0 16px', marginTop: '24px' }}>
          {/* Category Title shimmer */}
          <div className="skeleton-shimmer" style={{ width: '120px', height: '22px', borderRadius: '6px', marginBottom: '16px' }}></div>

          {/* 3 food item skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px 0', 
              borderBottom: '1px solid #f1f5f9',
              gap: '16px'
            }}>
              <div style={{ flex: 1 }}>
                {/* Veg icon shimmer */}
                <div className="skeleton-shimmer" style={{ width: '14px', height: '14px', borderRadius: '3px', marginBottom: '8px' }}></div>
                {/* Dish name shimmer */}
                <div className="skeleton-shimmer" style={{ width: '45%', height: '18px', borderRadius: '6px', marginBottom: '8px' }}></div>
                {/* Dish price shimmer */}
                <div className="skeleton-shimmer" style={{ width: '20%', height: '14px', borderRadius: '4px', marginBottom: '8px' }}></div>
                {/* Dish description shimmer */}
                <div className="skeleton-shimmer" style={{ width: '85%', height: '12px', borderRadius: '4px', marginBottom: '4px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '60%', height: '12px', borderRadius: '4px' }}></div>
              </div>
              {/* Dish image + Add button shimmer */}
              <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
                <div className="skeleton-shimmer" style={{ width: '100%', height: '100%', borderRadius: '16px' }}></div>
                <div className="skeleton-shimmer" style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '75px', height: '32px', borderRadius: '8px', border: '2px solid #ffffff' }}></div>
              </div>
            </div>
          ))}
        </div>

        <BottomNav activeTab="restaurants" />
      </div>
    );
  }

  if (!restaurant) return null;

  const subcategories = ['All', ...new Set(menu.map(item => item.category || 'General'))];

  // Check item quantity in cart helper
  const getCartQty = (menuItemId) => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find(i => {
      const idToCheck = i.menuItem?._id || i.menuItem;
      return idToCheck?.toString() === menuItemId?.toString();
    });
    return item ? item.quantity : 0;
  };

  // Get total quantity of items in cart
  const cartTotalQty = cart && cart.items 
    ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  // Cover image fallback
  const coverImage = restaurant.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';

  const isVegItem = (item) => {
    if (item.foodType) {
      return item.foodType === 'veg';
    }
    const name = (item.name || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const nonVegKeywords = ['chicken', 'meat', 'egg', 'fish', 'beef', 'mutton', 'pork', 'non-veg', 'nonveg', 'prawn', 'ham', 'bacon', 'kabab', 'kebab'];
    return !nonVegKeywords.some(kw => name.includes(kw) || desc.includes(kw) || cat.includes(kw));
  };

  const filteredMenu = menu.filter(item => {
    if (activeSubcategory !== 'All' && (item.category || 'General') !== activeSubcategory) {
      return false;
    }
    if (dishSearch.trim() && !item.name.toLowerCase().includes(dishSearch.toLowerCase()) && !item.description?.toLowerCase().includes(dishSearch.toLowerCase())) {
      return false;
    }
    const isVeg = isVegItem(item);
    if (vegOnly && !isVeg) return false;
    if (nonVegOnly && isVeg) return false;
    
    return true;
  });

  const categoriesGrouped = filteredMenu.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const VegIcon = ({ isVeg }) => (
    <div style={{ 
      width: '13px', 
      height: '13px', 
      border: `1.5px solid ${isVeg ? '#1f8a4c' : '#e53e3e'}`, 
      borderRadius: '3px', 
      display: 'inline-flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#ffffff',
      flexShrink: 0
    }}>
      <div style={{ width: '5.5px', height: '5.5px', borderRadius: '50%', background: isVeg ? '#1f8a4c' : '#e53e3e' }}></div>
    </div>
  );

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  return (
    <div className="restaurant-detail-page animate-fade-in" style={{ paddingBottom: '120px' }}>
      
      {/* Dark / Premium Header Wrapper */}
      <div className="restaurant-detail-header-wrapper">
        {/* Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => navigate('/restaurants')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#ffffff', 
              cursor: 'pointer', 
              padding: '4px' 
            }}
          >
            <ArrowLeft size={24} />
          </button>
          {/* Header Actions removed */}
        </div>
      </div>

      {/* Floating White Info Card */}
      <div style={{ 
        background: '#ffffff', 
        borderRadius: '20px', 
        border: '1px solid #edf2f7', 
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)', 
        margin: '-100px 16px 0 16px', 
        padding: '35px 30px', 
        position: 'relative', 
        zIndex: 10 
      }}>

        {/* Name and Rating */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1a202c', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
              {restaurant.restaurantName}
            </h1>
            <div style={{ fontSize: '0.82rem', color: '#718096', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{restaurant.deliveryTime || 30} mins</span>
              <span>•</span>
              <span>{restaurant.location || 'Campus food zone'}</span>
            </div>
          </div>

          {/* Rating Block */}
          {restaurant.reviewCount > 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              border: '1px solid #edf2f7', 
              borderRadius: '12px', 
              padding: '6px 8px', 
              background: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '2px', 
                fontWeight: 800, 
                fontSize: '0.85rem', 
                color: '#ffffff', 
                background: '#1f8a4c', 
                padding: '2px 6px', 
                borderRadius: '6px' 
              }}>
                {(restaurant.averageRating || 0).toFixed(1)} <Star size={11} fill="#ffffff" color="#ffffff" />
              </span>
              <span style={{ fontSize: '0.62rem', color: '#718096', fontWeight: 800, marginTop: '4px', whiteSpace: 'nowrap' }}>
                {restaurant.reviewCount} rating{restaurant.reviewCount > 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              border: '1px solid #edf2f7', 
              borderRadius: '12px', 
              padding: '6px 8px', 
              background: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '2px', 
                fontWeight: 800, 
                fontSize: '0.85rem', 
                color: '#718096', 
                background: '#edf2f7', 
                padding: '2px 6px', 
                borderRadius: '6px' 
              }}>
                -- <Star size={11} fill="#718096" color="#718096" />
              </span>
              <span style={{ fontSize: '0.62rem', color: '#718096', fontWeight: 800, marginTop: '4px', whiteSpace: 'nowrap' }}>
                No ratings
              </span>
            </div>
          )}
        </div>

        {/* Coupon Section */}
        {bestCoupon && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            borderTop: '1px solid #edf2f7', 
            paddingTop: '12px', 
            marginTop: '12px' 
          }}>
            <span style={{ background: '#fff5f5', border: '1px dashed #b31522', color: '#b31522', padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 850 }}>
              {bestCoupon.code}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#4a5568', fontWeight: 700 }}>
              {bestCoupon.discountType === 'PERCENTAGE'
                ? `${bestCoupon.discountValue}% OFF up to ₹${bestCoupon.maximumDiscount}`
                : `Flat ₹${bestCoupon.discountValue} OFF`}
            </span>
          </div>
        )}
      </div>

      {/* Tab Selection */}
      <div style={{ display: 'flex', borderBottom: '1px solid #edf2f7', margin: '20px 16px 0 16px' }}>
        {['Menu', 'Reviews', 'Info'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'none',
              fontSize: '0.9rem',
              fontWeight: 800,
              color: activeTab === tab ? '#b31522' : '#718096',
              borderBottom: activeTab === tab ? '3px solid #b31522' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab === 'Reviews' ? `Reviews (${reviews.length})` : tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'Menu' && (
        <div>
          {/* Search bar inside menu */}
          <div style={{ padding: '0 16px', marginTop: '16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: '#f0f0f2', 
              borderRadius: '16px', 
              padding: '10px 16px', 
              gap: '10px' 
            }}>
              <Search size={18} color="#718096" />
              <input 
                type="text" 
                placeholder="Search for dishes" 
                value={dishSearch} 
                onChange={(e) => setDishSearch(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: '#111111', fontWeight: 600 }}
              />
            </div>
          </div>

          {/* Veg / Non-Veg Quick Filters */}
          <div style={{ padding: '0 16px', marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setVegOnly(!vegOnly);
                if (nonVegOnly) setNonVegOnly(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid',
                background: vegOnly ? '#e6fffa' : '#ffffff',
                color: vegOnly ? '#319795' : '#718096',
                borderColor: vegOnly ? '#319795' : '#e2e8f0',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: vegOnly ? '0 2px 4px rgba(49, 151, 149, 0.15)' : 'none'
              }}
            >
              <VegIcon isVeg={true} />
              Veg Only
            </button>

            <button
              onClick={() => {
                setNonVegOnly(!nonVegOnly);
                if (vegOnly) setVegOnly(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid',
                background: nonVegOnly ? '#fff5f5' : '#ffffff',
                color: nonVegOnly ? '#e53e3e' : '#718096',
                borderColor: nonVegOnly ? '#e53e3e' : '#e2e8f0',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: nonVegOnly ? '0 2px 4px rgba(229, 62, 62, 0.15)' : 'none'
              }}
            >
              <VegIcon isVeg={false} />
              Non-Veg Only
            </button>
          </div>


          {/* Top Picks Horizontal Scroll */}
          {displayTopPicks.length > 0 && !dishSearch.trim() && (
            <div style={{ padding: '0 16px', marginTop: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1a202c', marginBottom: '16px' }}>Top Picks</h3>
              <div className="subcategory-scroll" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
                {displayTopPicks.map(item => {
                  const qty = getCartQty(item._id);
                  const isVeg = isVegItem(item);
                  return (
                    <div key={item._id} style={{ flexShrink: 0, width: '160px', position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85))' }}></div>
                      
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', color: '#ffffff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                          <VegIcon isVeg={isVeg} />
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '32px' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, marginTop: '4px' }}>₹{item.price}</div>
                      </div>
                      
                      {/* ADD Button on Top Picks */}
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        {qty > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '12px', padding: '2px 6px', gap: '6px', border: '1px solid #cbd5e0', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                            <button type="button" onClick={() => handleDecrement(item._id, qty)} style={{ border: 'none', background: 'none', color: '#b31522', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer' }}>-</button>
                            <span style={{ fontWeight: 800, fontSize: '0.75rem', color: '#111111' }}>{qty}</span>
                            <button type="button" onClick={() => handleIncrement(item._id, qty)} style={{ border: 'none', background: 'none', color: '#b31522', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer' }}>+</button>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => handleAdd(item._id)} 
                            style={{ background: '#ffffff', border: '1.5px solid #1f8a4c', color: '#1f8a4c', borderRadius: '8px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                          >
                            ADD
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categorized Menu Accordion List */}
          <div style={{ marginTop: '24px' }}>
            {Object.keys(categoriesGrouped).length === 0 ? (
              <p style={{ textAlign: 'center', color: '#718096', padding: '32px' }}>No dishes match the filters.</p>
            ) : (
              Object.keys(categoriesGrouped).map(cat => {
                const isExpanded = expandedCategories[cat] !== false;
                const items = categoriesGrouped[cat];
                return (
                  <div key={cat} id={cat} style={{ borderBottom: '8px solid #f8fafc', padding: '16px 0' }}>
                    {/* Collapsible Header */}
                    <button 
                      onClick={() => toggleCategory(cat)}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        width: '100%', 
                        padding: '0 16px 12px 16px', 
                        border: 'none', 
                        background: 'none', 
                        fontWeight: 900, 
                        fontSize: '1.1rem', 
                        color: '#1a202c', 
                        cursor: 'pointer' 
                      }}
                    >
                      <span>{cat} ({items.length})</span>
                      {isExpanded ? <ChevronUp size={20} color="#4a5568" /> : <ChevronDown size={20} color="#4a5568" />}
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {items.map(item => {
                          const qty = getCartQty(item._id);
                          const isVeg = isVegItem(item);
                          const itemImage = item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=150&q=80';
                          return (
                            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 16px', borderBottom: '1px solid #f1f5f9', gap: '16px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                  <VegIcon isVeg={isVeg} />
                                </div>
                                <h4 style={{ fontSize: '0.98rem', fontWeight: 850, color: '#1d232c', margin: '0 0 4px 0' }}>{item.name}</h4>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111111', marginBottom: '6px' }}>₹{item.price}</div>
                                <p style={{ fontSize: '0.78rem', color: '#718096', lineHeight: 1.4, margin: 0, paddingRight: '8px' }}>
                                  {item.description || 'Delectable and freshly prepared for your cravings.'}
                                </p>
                              </div>
                              
                              {/* Square image and ADD button */}
                              <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                                <img src={itemImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                                
                                <div style={{ 
                                  position: 'absolute', 
                                  bottom: '-10px', 
                                  left: '50%', 
                                  transform: 'translateX(-50%)',
                                  zIndex: 5
                                }}>
                                  {qty > 0 ? (
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      background: '#ffffff', 
                                      borderRadius: '20px', 
                                      padding: '4px 10px', 
                                      gap: '10px', 
                                      border: '1px solid #cbd5e0',
                                      boxShadow: '0 4px 10px rgba(0,0,0,0.12)' 
                                    }}>
                                      <button type="button" onClick={() => handleDecrement(item._id, qty)} style={{ border: 'none', background: 'none', color: '#b31522', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem' }}>-</button>
                                      <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#111111' }}>{qty}</span>
                                      <button type="button" onClick={() => handleIncrement(item._id, qty)} style={{ border: 'none', background: 'none', color: '#b31522', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem' }}>+</button>
                                    </div>
                                  ) : item.isAvailable ? (
                                    <button 
                                      type="button" 
                                      onClick={() => handleAdd(item._id)}
                                      style={{ 
                                        background: '#ffffff', 
                                        border: '1.5px solid #1f8a4c', 
                                        color: '#1f8a4c', 
                                        borderRadius: '12px', 
                                        padding: '6px 20px', 
                                        fontWeight: 800, 
                                        fontSize: '0.8rem', 
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.08)' 
                                      }}
                                    >
                                      ADD
                                    </button>
                                  ) : (
                                    <span style={{ background: '#e2e8f0', color: '#718096', padding: '4px 12px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>Unavailable</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'Reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
          {reviews.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', fontSize: '0.9rem', padding: '32px 0' }}>No reviews yet. Be the first to review!</p>
          ) : reviews.map((r) => {
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

      {/* Info Tab */}
      {activeTab === 'Info' && (
        <div style={{ padding: '20px 16px', fontSize: '0.9rem', color: '#718096', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <MapPin size={18} color="#b31522" />
            <span><strong style={{ color: '#111111' }}>Address:</strong> {restaurant.location || 'N/A'}</span>
          </p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Clock size={18} color="#b31522" />
            <span><strong style={{ color: '#111111' }}>Delivery Time:</strong> {restaurant.deliveryTime || 30} minutes</span>
          </p>
          <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: 0 }}>
            <InfoIcon size={18} color="#b31522" style={{ marginTop: '3px' }} />
            <span><strong style={{ color: '#111111' }}>Description:</strong> {restaurant.description || 'No description available.'}</span>
          </p>
        </div>
      )}

      {/* Floating Categories Picker Menu Button */}
      {activeTab === 'Menu' && Object.keys(categoriesGrouped).length > 0 && (
        <div style={{ position: 'fixed', bottom: '86px', left: '50%', transform: 'translateX(-50%)', zIndex: 999 }}>
          <button 
            type="button"
            onClick={() => setShowCategoryMenu(prev => !prev)}
            style={{ 
              background: '#0c0f12', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '24px', 
              padding: '10px 18px', 
              fontWeight: 800, 
              fontSize: '0.82rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              cursor: 'pointer' 
            }}
          >
            <Flame size={14} /> MENU
          </button>
          
          {showCategoryMenu && (
            <div style={{ 
              position: 'absolute', 
              bottom: '48px', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              background: '#0c0f12', 
              borderRadius: '16px', 
              padding: '12px 8px', 
              minWidth: '180px', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {Object.keys(categoriesGrouped).map(cat => (
                <button 
                  key={cat}
                  type="button"
                  onClick={() => {
                    setShowCategoryMenu(false);
                    const el = document.getElementById(cat);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#ffffff', 
                    textAlign: 'left', 
                    padding: '8px 12px', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{cat}</span>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{categoriesGrouped[cat].length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Draggable Floating Cart Bubble */}
      {cartTotalQty > 0 && (
        <div
          ref={dragRef}
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown}
          style={{
            position: 'fixed',
            left: bubblePos.x !== null ? bubblePos.x : 'auto',
            right: bubblePos.x !== null ? 'auto' : '20px',
            top: bubblePos.y !== null ? bubblePos.y : 'auto',
            bottom: bubblePos.y !== null ? 'auto' : '96px',
            zIndex: 1000,
            userSelect: 'none',
            touchAction: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px'
          }}
        >
          {/* Expanded Cart Panel */}
          {cartExpanded && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '16px',
                minWidth: '200px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid #f1f5f9',
                animation: 'scaleIn 0.18s ease'
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: 600, marginBottom: '8px' }}>
                {cartTotalQty} item{cartTotalQty > 1 ? 's' : ''} in cart
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>
                ₹{(cart.totalAmount || 0).toFixed(2)}
              </div>
              <Link
                to="/cart"
                style={{
                  display: 'block',
                  background: '#b31522',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}
              >
                View Cart →
              </Link>
            </div>
          )}

          {/* Circular Bubble Button */}
          <button
            type="button"
            onClick={handleBubbleClick}
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: '#b31522',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              boxShadow: '0 4px 16px rgba(179, 21, 34, 0.35)',
              position: 'relative',
              flexShrink: 0
            }}
          >
            <ShoppingBag size={22} />
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ffffff',
              color: '#b31522',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.7rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #b31522'
            }}>
              {cartTotalQty}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
