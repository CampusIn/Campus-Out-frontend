import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenuItemById } from '../api/menu.api';
import { addToCart, updateCartItemQty, deleteCartItem } from '../api/cart.api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import BottomNav from '../components/BottomNav';
import { ArrowLeft, Share2, Heart, Star, Clock, Flame as FireIcon, Plus, Minus } from 'lucide-react';

export default function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { cart, fetchCart } = useCart();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartMsg, setCartMsg] = useState('');

  const getCartQty = (menuItemId) => {
    if (!cart || !cart.items) return 0;
    const found = cart.items.find(i => {
      const idToCheck = i.menuItem?._id || i.menuItem;
      return idToCheck?.toString() === menuItemId?.toString();
    });
    return found ? found.quantity : 0;
  };

  const handleIncrement = async (menuItemId, currentQty) => {
    try {
      await updateCartItemQty(menuItemId, currentQty + 1);
      await fetchCart();
    } catch (err) {
      setCartMsg('Failed to update quantity');
      setTimeout(() => setCartMsg(''), 2500);
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
      setCartMsg('Failed to update quantity');
      setTimeout(() => setCartMsg(''), 2500);
    }
  };



  const mockItems = {
    burger_bang: {
      name: 'Burger Bang',
      price: 8.20,
      image: '/onboarding_burger.png',
      rating: '4.6',
      time: '20-25 min',
      kcal: '110 Kcal',
      deliveryMan: {
        name: 'Alice Johnson',
        role: 'Delivery Man',
        avatar: '/avatar_alice.png'
      },
      description: 'Burger Bang delivers mouthwatering, freshly grilled burgers packed with flavor. Enjoy juicy patties, fresh toppings, and signature sauces, all made to satisfy your cravings and bring you the ultimate burger experience.'
    },
    pizza_margarita: {
      name: 'Pizza Margarita',
      price: 8.10,
      image: '/pizza_margarita.png',
      rating: '4.8',
      time: '15-20 min',
      kcal: '180 Kcal',
      deliveryMan: {
        name: 'Jack Carter',
        role: 'Delivery Man',
        avatar: '/avatar_jack.png'
      },
      description: 'Pizza Margarita features a classic crispy crust topped with fresh tomato sauce, rich mozzarella cheese, fresh basil leaves, and a drizzle of olive oil, baked to perfection.'
    }
  };

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      if (mockItems[id]) {
        setItem(mockItems[id]);
        setLoading(false);
        return;
      }
      
      try {
        const { data } = await getMenuItemById(id);
        const fetched = data.data;
        setItem({
          name: fetched.name,
          price: fetched.price,
          image: fetched.image || '/onboarding_burger.png',
          rating: '4.5',
          time: '20-30 min',
          kcal: '150 Kcal',
          deliveryMan: {
            name: 'Alice Johnson',
            role: 'Delivery Man',
            avatar: '/avatar_alice.png'
          },
          description: fetched.description || 'Delightful food prepared fresh with organic and premium ingredients.'
        });
      } catch (err) {
        setItem(mockItems.burger_bang);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      if (id === 'burger_bang' || id === 'pizza_margarita') {
        setCartMsg('Added to cart!');
        setTimeout(() => setCartMsg(''), 2500);
        return;
      }
      
      await addToCart({ menuItemId: id, quantity });
      setCartMsg('Added to cart!');
      await fetchCart();
      setTimeout(() => setCartMsg(''), 2500);
    } catch (err) {
      setCartMsg(err.response?.data?.message || 'Failed to add to cart');
      setTimeout(() => setCartMsg(''), 2500);
    }
  };

  if (loading) {
    return (
      <div className="home-dashboard page animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p className="loading-text" style={{ color: '#718096' }}>Loading delicious details...</p>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="home-dashboard page animate-fade-in" style={{ padding: '24px 20px', minHeight: '100vh', background: '#fcfcfc', paddingBottom: '96px' }}>
      
      {/* Detail Wrapper Card for Desktop */}
      <div className="food-detail-desktop-card animate-scale-in" style={{ background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        
        <div className="food-detail-split" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Left panel: Food image and back nav */}
          <div className="food-detail-image-panel" style={{ position: 'relative', background: '#fff5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: '260px' }}>
            {/* Top Floating Nav */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', width: 'calc(100% - 32px)', zIndex: 5 }}>
              <button 
                className="circle-nav-btn hover-scale" 
                onClick={() => navigate(-1)}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111111', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                <ArrowLeft size={20} />
              </button>
              <button 
                className="circle-nav-btn hover-scale"
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111111', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                <Share2 size={20} />
              </button>
            </div>
            
            <img src={item.image} alt={item.name} style={{ width: '220px', height: '220px', objectFit: 'contain', animation: 'float 4s ease-in-out infinite' }} />
          </div>

          {/* Right panel: Specs & details */}
          <div className="food-detail-info-panel" style={{ padding: '24px' }}>
            {cartMsg && (
              <div className="animate-scale-in" style={{ marginBottom: '16px' }}>
                <p className="msg msg-success">{cartMsg}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 850, color: '#111111', margin: 0 }}>{item.name}</h1>
              <button 
                className="hover-scale"
                onClick={() => setIsFavorite(!isFavorite)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isFavorite ? '#b31522' : '#a0aec0', display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                <Heart size={24} fill={isFavorite ? '#b31522' : 'none'} />
              </button>
            </div>

            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b31522', marginBottom: '20px' }}>
              ₹{(item.price * 12).toFixed(2)}
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', background: '#f7fafc', padding: '12px 16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: '#111111' }}>
                <Star size={14} color="#ffc700" fill="#ffc700" />
                <span>{item.rating}</span>
              </div>
              <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: '#718096' }}>
                <Clock size={14} />
                <span>{item.time}</span>
              </div>
              <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: '#718096' }}>
                <FireIcon size={14} color="#b31522" />
                <span>{item.kcal}</span>
              </div>
            </div>

            {/* Delivery Man Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '12px', border: '1px solid #edf2f7', borderRadius: '12px' }}>
              <img src={item.deliveryMan.avatar} alt={item.deliveryMan.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111111' }}>{item.deliveryMan.name}</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>{item.deliveryMan.role}</p>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.85rem', color: '#718096', lineHeight: 1.6, marginBottom: '28px', margin: '0 0 28px 0' }}>{item.description}</p>

            {/* Action controls */}
            {getCartQty(id) > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', background: '#f7fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px 20px', gap: '24px', justifyContent: 'center', width: '100%' }}>
                <span style={{ fontWeight: 750, fontSize: '0.95rem', color: '#4a5568' }}>In Cart:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button 
                    onClick={() => handleDecrement(id, getCartQty(id))}
                    style={{ background: '#e2e8f0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#111111', width: '32px', height: '32px', borderRadius: '50%', justifyContent: 'center' }}
                    className="hover-scale"
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111111', minWidth: '24px', textAlign: 'center' }}>
                    {getCartQty(id) < 10 ? `0${getCartQty(id)}` : getCartQty(id)}
                  </span>
                  <button 
                    onClick={() => handleIncrement(id, getCartQty(id))}
                    style={{ background: '#e2e8f0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#111111', width: '32px', height: '32px', borderRadius: '50%', justifyContent: 'center' }}
                    className="hover-scale"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f7fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '8px 12px', gap: '16px' }}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#718096' }}
                    className="hover-scale"
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#111111', minWidth: '20px', textAlign: 'center' }}>
                    {quantity < 10 ? `0${quantity}` : quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#718096' }}
                    className="hover-scale"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className="btn btn-primary hover-lift hover-darken"
                  style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'var(--primary)', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'center' }}
                >
                  Add to Cart
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      <BottomNav activeTab="home" />

      {/* Media query overrides to turn split layout on desktop */}
      <style>{`
        @media (min-width: 769px) {
          .food-detail-split {
            flex-direction: row !important;
          }
          .food-detail-image-panel {
            flex: 1 !important;
            min-height: auto !important;
            padding: 60px 40px !important;
          }
          .food-detail-info-panel {
            flex: 1.2 !important;
            padding: 40px !important;
            border-left: 1px solid #edf2f7;
          }
          .food-detail-image-panel img {
            width: 280px !important;
            height: 280px !important;
          }
        }
      `}</style>
    </div>
  );
}
