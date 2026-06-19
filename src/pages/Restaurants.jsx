import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getRestaurants } from '../api/restaurant.api';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { MapPin, ChevronDown, User, Search, LayoutGrid, Flame, Pizza, Cake, Coffee, Star, Clock } from 'lucide-react';

// Available categories with labels, backend tags and Lucide Icons
const categoriesList = [
  {
    id: 'All',
    label: 'All',
    backend: 'All',
    icon: <LayoutGrid size={20} />
  },
  {
    id: 'Burgers',
    label: 'Burgers',
    backend: 'Fast Food',
    icon: <Flame size={20} />
  },
  {
    id: 'Pizza',
    label: 'Pizza',
    backend: 'North Indian',
    icon: <Pizza size={20} />
  },
  {
    id: 'Desserts',
    label: 'Desserts',
    backend: 'Bakery',
    icon: <Cake size={20} />
  },
  {
    id: 'Drinks',
    label: 'Drinks',
    backend: 'Cafe',
    icon: <Coffee size={20} />
  }
];

const foodImages = [
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80', // Burger
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80', // Pizza
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80', // Mixed foods
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80', // Salad bowl
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=500&q=80', // Chinese/Dumplings
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80', // Tacos/Mexican
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80', // Coffee/Desserts
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80'  // Extra Pizza
];

const promoTexts = [
  '50% OFF UPTO ₹80',
  '70% OFF UPTO ₹130',
  'ITEMS AT ₹119',
  '50% OFF',
  'ITEMS AT ₹19',
  'ITEMS AT ₹59',
  'ITEMS AT ₹139',
  '60% OFF UPTO ₹120'
];

export default function Restaurants() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const isFirstMount = useRef(true);

  const fetchRestaurants = async (currentSearch = search) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (currentSearch) params.search = currentSearch;
      
      const categoryObj = categoriesList.find(c => c.id === activeCategory);
      const backendCategory = categoryObj ? categoryObj.backend : 'All';
      if (backendCategory !== 'All') params.category = backendCategory;
      
      const { data } = await getRestaurants(params);
      setRestaurants(data.data.restaurant || []);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(search);
  }, [page, activeCategory]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const query = searchParams.get('search') || '';
    setSearch(query);
    setPage(1);
    fetchRestaurants(query);
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRestaurants(search);
  };

  const mockTopPicks = [
    {
      _id: 'pizza_palace_id',
      restaurantName: 'Pizza Palace',
      category: 'Italian, Pizza',
      averageRating: 4.6,
      deliveryTime: 20,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80'
    },
    {
      _id: 'dominos_pizza_id',
      restaurantName: "Domino's Pizza",
      category: 'Pizza, Fast Food',
      averageRating: 4.3,
      deliveryTime: 25,
      image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=300&q=80'
    },
    {
      _id: 'pizza_hut_id',
      restaurantName: 'Pizza Hut',
      category: 'Pizza, Italian',
      averageRating: 4.2,
      deliveryTime: 30,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=300&q=80'
    },
    {
      _id: 'burger_bang_id',
      restaurantName: 'Burger Bang',
      category: 'Burgers, Fast Food',
      averageRating: 4.6,
      deliveryTime: 20,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80'
    }
  ];

  const topPicks = restaurants.length >= 2 
    ? restaurants.slice(0, 4).map((r, idx) => ({
        ...r,
        image: idx % 2 === 0 
          ? 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80'
      }))
    : mockTopPicks;

  return (
    <div className="home-dashboard page animate-fade-in" style={{ background: '#fcfcfc', minHeight: '100vh', paddingBottom: '96px' }}>
      
      {/* Location Bar */}
      <div className="dashboard-location-bar animate-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="location-display" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={22} color="#b31522" className="animate-pulse-soft" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111111' }}>Koramangala, Bengaluru</span>
          <ChevronDown size={18} color="#718096" />
        </div>
        <Link to="/profile" className="profile-avatar-btn hover-scale" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#fff5f5', borderRadius: '50%', color: '#b31522' }}>
          <User size={20} />
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="dashboard-search-container animate-slide-up delay-1" style={{ position: 'relative', marginBottom: '24px' }}>
        <input 
          className="dashboard-search-input"
          placeholder="Search for restaurants or dishes..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid #cbd5e0', background: '#f7fafc', fontSize: '0.95rem' }}
        />
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />
      </form>

      {/* Promo Banner */}
      <div className="premium-promo-banner animate-scale-in delay-2" style={{ display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(135deg, #b31522, #5f080f)', borderRadius: '20px', padding: '24px', color: '#ffffff', marginBottom: '28px', overflow: 'hidden', position: 'relative' }}>
        <div className="premium-promo-text" style={{ zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
          <span className="premium-promo-title" style={{ fontSize: '1.75rem', fontWeight: 950, lineHeight: 1.1 }}>Flat<br />40% OFF</span>
          <span className="premium-promo-desc" style={{ fontSize: '0.9rem', opacity: 0.9 }}>On your first order</span>
          <button 
            className="premium-promo-btn hover-lift" 
            type="button" 
            onClick={() => { setActiveCategory('Burgers'); setPage(1); }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ffffff', color: '#b31522', fontWeight: 700, cursor: 'pointer', marginTop: '8px', fontSize: '0.85rem' }}
          >
            ORDER NOW
          </button>
        </div>
        <img 
          src="/onboarding_burger.png" 
          alt="Cheeseburger promo" 
          className="premium-promo-image onboarding-burger-img" 
          style={{ width: '140px', height: '140px', objectFit: 'contain' }}
        />
      </div>

      {/* Horizontal Category Badges Scrolling */}
      <div className="horizontal-scroll-container animate-fade-in delay-3" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '28px' }}>
        {categoriesList.map((cat) => (
          <button 
            key={cat.id} 
            className={`category-badge-btn hover-scale hover-lift ${activeCategory === cat.id ? 'active' : ''}`} 
            onClick={() => { setActiveCategory(cat.id); setPage(1); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '24px',
              border: activeCategory === cat.id ? 'none' : '1px solid #e2e8f0',
              background: activeCategory === cat.id ? '#b31522' : '#ffffff',
              color: activeCategory === cat.id ? '#ffffff' : '#4a5568',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <div className="category-badge-icon-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
              {cat.icon}
            </div>
            <span className="category-badge-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Top Picks For You section */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111' }}>Top Picks For You</h2>
      </div>

      <div className="top-picks-scroll responsive-grid-4 animate-slide-up delay-3" style={{ marginBottom: '32px' }}>
        {topPicks.map((pick) => (
          <Link 
            to={(pick._id && typeof pick._id === 'string' && pick._id.includes('_id')) ? '/restaurants' : `/restaurants/${pick._id}`} 
            key={pick._id} 
            className="top-pick-card hover-lift"
            style={{ textDecoration: 'none', color: 'inherit', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'block' }}
          >
            <div className="top-pick-img-container" style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
              <img src={pick.image} alt={pick.restaurantName} className="top-pick-img hover-scale" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="top-pick-content" style={{ padding: '12px' }}>
              <div className="top-pick-name" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111111', marginBottom: '2px' }}>{pick.restaurantName}</div>
              <div className="top-pick-cuisine" style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '8px' }}>{(pick.category || 'Food').split(',')[0]}</div>
              <div className="top-pick-stats" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span className="top-pick-rating" style={{ fontWeight: 700, color: '#111111', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Star size={14} color="#ffc700" fill="#ffc700" /> {pick.averageRating > 0 ? pick.averageRating.toFixed(1) : '4.5'}
                </span>
                <span className="top-pick-time" style={{ color: '#718096', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={12} /> {pick.deliveryTime} min
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* All Restaurants List section */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111' }}>All Restaurants</h2>
      </div>

      {loading ? (
        <p className="loading-text" style={{ textAlign: 'center', color: '#718096', padding: '24px' }}>Loading restaurants...</p>
      ) : restaurants.length === 0 ? (
        <p className="empty-text" style={{ textAlign: 'center', color: '#718096', padding: '24px' }}>No restaurants found</p>
      ) : (
        <div className="swiggy-restaurants-grid animate-slide-up">
          {restaurants.map((r, idx) => {
            const foodImage = foodImages[idx % foodImages.length];
            const promoText = promoTexts[idx % promoTexts.length];
            return (
              <Link to={`/restaurants/${r._id}`} key={r._id} className="swiggy-restaurant-card">
                {/* Image Banner with Overlay */}
                <div className="swiggy-card-img-wrapper">
                  <img src={foodImage} alt={r.restaurantName} className="swiggy-card-img" />
                  <div className="swiggy-card-overlay">
                    <span className="swiggy-promo-text">{promoText}</span>
                  </div>
                </div>
                {/* Restaurant Info */}
                <div className="swiggy-card-info">
                  <h3 className="swiggy-card-name">{r.restaurantName}</h3>
                  <div className="swiggy-card-rating-row">
                    <div className="swiggy-rating-star-circle">
                      <Star size={10} color="#ffffff" fill="#ffffff" />
                    </div>
                    <span className="swiggy-rating-val">{r.averageRating > 0 ? r.averageRating.toFixed(1) : '4.5'}</span>
                    <span className="swiggy-bullet-dot">&bull;</span>
                    <span className="swiggy-delivery-time">{r.deliveryTime} mins</span>
                  </div>
                  <p className="swiggy-card-cuisines">{r.category}</p>
                  <p className="swiggy-card-location">{r.location}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Nav (hidden on desktop via css) */}
      <BottomNav activeTab="home" />

      {/* Local custom overrides for scroll sections */}
      <style>{`
        /* Swiggy Restaurants Grid */
        .swiggy-restaurants-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px 24px;
        }

        .swiggy-restaurant-card {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          background: #ffffff;
          overflow: hidden;
          transition: transform 0.2s ease;
          cursor: pointer;
        }

        .swiggy-card-img-wrapper {
          position: relative;
          height: 170px;
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
        }

        .swiggy-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .swiggy-restaurant-card:hover .swiggy-card-img {
          transform: scale(1.04);
        }

        .swiggy-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 0) 100%);
          display: flex;
          align-items: flex-end;
          padding: 12px 16px;
        }

        .swiggy-promo-text {
          color: #ffffff;
          font-size: 1.15rem;
          font-weight: 900;
          letter-spacing: -0.5px;
          text-transform: uppercase;
        }

        .swiggy-card-info {
          padding: 12px 4px 4px 4px;
        }

        .swiggy-card-name {
          font-size: 1.1rem;
          font-weight: 800;
          color: #282c3f;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .swiggy-card-rating-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          font-weight: 700;
          color: #282c3f;
          margin-bottom: 6px;
        }

        .swiggy-rating-star-circle {
          background: #198754;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .swiggy-bullet-dot {
          color: #686b78;
        }

        .swiggy-card-cuisines {
          font-size: 0.85rem;
          color: #686b78;
          margin: 0 0 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
        }

        .swiggy-card-location {
          font-size: 0.85rem;
          color: #686b78;
          margin: 0;
          font-weight: 500;
        }

        @media (min-width: 769px) {
          .top-picks-scroll.responsive-grid-4 {
            display: grid !important;
          }
          .dashboard-location-bar {
            margin-top: 16px;
          }
        }
        @media (max-width: 1024px) {
          .swiggy-restaurants-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 768px) {
          .top-picks-scroll {
            display: flex !important;
            overflow-x: auto;
            gap: 16px;
            padding-bottom: 8px;
          }
          .top-pick-card {
            flex: 0 0 200px;
          }
          .swiggy-restaurants-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
        }
        @media (max-width: 480px) {
          .swiggy-restaurants-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
