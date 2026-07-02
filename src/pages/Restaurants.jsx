import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getRestaurants } from '../api/restaurant.api';
import { getRestaurantMenu, getMenuSuggestions } from '../api/menu.api';
import { getActiveBanners, getActiveAnnouncements } from '../api/homepageCMS.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BottomNav from '../components/BottomNav';
import { MapPin, ChevronDown, User, Search, LayoutGrid, Flame, Pizza, Cake, Coffee, Star, Clock, Navigation, Megaphone, ShoppingBag, Utensils, Volume2, Bell } from 'lucide-react';

// Category icon mapping based on category names
const categoryIcons = {
  'All': <LayoutGrid size={20} />,
  'Burgers': <Flame size={20} />,
  'Fast Food': <Flame size={20} />,
  'Pizza': <Pizza size={20} />,
  'North Indian': <Pizza size={20} />,
  'Desserts': <Cake size={20} />,
  'Bakery': <Cake size={20} />,
  'Drinks': <Coffee size={20} />,
  'Cafe': <Coffee size={20} />,
  'Other': <Utensils size={20} />
};

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

const savedAddresses = [
  { id: 'hostel_a', name: 'Hostel A', detail: 'Hostel A (Boys) &bull; Men\'s Hostel Block, Campus Road' },
  { id: 'hostel_b', name: 'Hostel B', detail: 'Hostel B (Girls) &bull; Women\'s Hostel Block, Campus Road' },
  { id: 'hostel_c', name: 'Hostel C', detail: 'Hostel C &bull; PG Block C, Campus East' },
  { id: 'library', name: 'Central Library', detail: 'Central Library &bull; Main Campus Academic Center' },
  { id: 'academic', name: 'Academic Block', detail: 'Academic Block &bull; Science & Arts Department' }
];

const ContentWrapper = ({ children, className = "" }) => (
  <div className={`homepage-content-wrapper ${className}`}>
    {children}
  </div>
);

export default function Restaurants() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categoriesList, setCategoriesList] = useState([
    {
      id: 'All',
      label: 'All',
      backend: 'All',
      icon: categoryIcons['All']
    }
  ]);
  const [restaurantMenuCategories, setRestaurantMenuCategories] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const isFirstMount = useRef(true);

  const [activeLocation, setActiveLocation] = useState(searchParams.get('hostel') || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const locationRef = useRef(null);
  const carouselRef = useRef(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const autoScrollTimerRef = useRef(null);

  // Homepage CMS states
  const [banners, setBanners] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingCMS, setLoadingCMS] = useState(true);
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState(null);
  const [isAnnouncementExpanded, setIsAnnouncementExpanded] = useState(false);

  const fetchCMSData = async () => {
    setLoadingCMS(true);
    try {
      const [bannersRes, announcementsRes] = await Promise.allSettled([
        getActiveBanners(),
        getActiveAnnouncements()
      ]);

      if (bannersRes.status === 'fulfilled') {
        setBanners(bannersRes.value.data?.data || []);
      }
      if (announcementsRes.status === 'fulfilled') {
        setAnnouncements(announcementsRes.value.data?.data || []);
      }
    } catch (e) {
      console.error('Error fetching CMS data:', e);
    } finally {
      setLoadingCMS(false);
    }
  };

  useEffect(() => {
    fetchCMSData();
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    let timer;

    const startAutoScroll = () => {
      timer = setInterval(() => {
        const cardWidth = 296; // 280px width + 16px gap
        const maxScroll = el.scrollWidth - el.clientWidth;
        
        if (el.scrollLeft >= maxScroll - 10) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }, 3500);
      autoScrollTimerRef.current = timer;
    };

    startAutoScroll();

    const stopAutoScroll = () => {
      if (timer) {
        clearInterval(timer);
      }
    };

    el.addEventListener('mouseenter', stopAutoScroll);
    el.addEventListener('mouseleave', startAutoScroll);
    el.addEventListener('touchstart', stopAutoScroll, { passive: true });
    el.addEventListener('touchend', startAutoScroll, { passive: true });

    return () => {
      stopAutoScroll();
      el.removeEventListener('mouseenter', stopAutoScroll);
      el.removeEventListener('mouseleave', startAutoScroll);
      el.removeEventListener('touchstart', stopAutoScroll);
      el.removeEventListener('touchend', startAutoScroll);
    };
  }, [banners]);

  const handleBannerClick = (banner) => {
    if (!banner) return;
    const { redirectType, redirectedId } = banner;
    if (redirectType === 'RESTAURANT' && redirectedId) {
      navigate(`/restaurants/${redirectedId}`);
    } else if (redirectType === 'COUPON') {
      navigate('/cart');
    } else if (redirectType === 'MARKETPLACE') {
      navigate('/restaurants');
    }
  };

  // Click outside to close location dropdown and search suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [locationRef, suggestionsRef]);

  // Fetch search suggestions with debounce
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingSuggestions(true);
      setShowSuggestions(true);
      try {
        const res = await getMenuSuggestions(trimmed);
        if (res.data?.success) {
          setSuggestions(res.data.data || []);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleCustomAddressSubmit = (val) => {
    if (!val.trim()) return;
    setActiveLocation(val.trim());
    setDropdownOpen(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('hostel', val.trim());
    setSearchParams(newParams);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setActiveLocation("Locating...");
          setDropdownOpen(false);
          
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await res.json();
            const locationName = data.locality || data.city || data.principalSubdivision;
            const resolvedName = locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            setActiveLocation(resolvedName);
            const newParams = new URLSearchParams(searchParams);
            newParams.set('hostel', resolvedName);
            setSearchParams(newParams);
          } catch (error) {
            console.error("Reverse geocoding failed, using fallback:", error);
            const fallbackName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setActiveLocation(fallbackName);
            const newParams = new URLSearchParams(searchParams);
            newParams.set('hostel', fallbackName);
            setSearchParams(newParams);
          }
        },
        () => {
          // Default fallback on error
          setActiveLocation('Hostel A');
          setDropdownOpen(false);
          const newParams = new URLSearchParams(searchParams);
          newParams.set('hostel', 'Hostel A');
          setSearchParams(newParams);
        }
      );
    } else {
      setActiveLocation('Hostel A');
      setDropdownOpen(false);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('hostel', 'Hostel A');
      setSearchParams(newParams);
    }
  };

  const fetchRestaurants = async (currentSearch = search) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (currentSearch) params.search = currentSearch;
      
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
  }, [page]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const query = searchParams.get('search') || '';
    const hostelQuery = searchParams.get('hostel') || '';
    setSearch(query);
    setActiveLocation(hostelQuery);
    setPage(1);
    fetchRestaurants(query);
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRestaurants(search);
  };

  const [topPicks, setTopPicks] = useState([]);
  const [loadingTopPicks, setLoadingTopPicks] = useState(true);

  useEffect(() => {
    const fetchTopPicksMenu = async () => {
      setLoadingTopPicks(true);
      const backendCategory = activeCategory;

      if (!restaurants || restaurants.length === 0) {
        setCategoriesList([
          {
            id: 'All',
            label: 'All',
            backend: 'All',
            icon: categoryIcons['All']
          }
        ]);
        setTopPicks([]);
        setLoadingTopPicks(false);
        return;
      }
      try {
        const menuPromises = restaurants.map(r => getRestaurantMenu(r._id).catch(() => null));
        const menuResults = await Promise.all(menuPromises);
        
        const allItems = [];
        const menuCatsMap = {};

        menuResults.forEach((res, idx) => {
          const restaurant = restaurants[idx];
          const menuList = res?.data?.data || [];
          const availableItems = menuList.filter(item => !item.isDeleted && item.isAvailable);
          
          const cats = new Set();
          availableItems.forEach(item => {
            cats.add(item.category);
            allItems.push({
              _id: item._id,
              name: item.name,
              description: item.description,
              price: item.price,
              mrp: item.mrp,
              image: item.image || (idx % 2 === 0 
                ? 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80'
                : 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80'),
              restaurantName: restaurant.restaurantName,
              restaurantId: restaurant._id,
              category: item.category,
              averageRating: restaurant.averageRating || 4.5,
              deliveryTime: restaurant.deliveryTime
            });
          });
          menuCatsMap[restaurant._id] = Array.from(cats);
        });

        setRestaurantMenuCategories(menuCatsMap);

        const uniqueCats = [...new Set(allItems.map(item => item.category))].filter(Boolean);
        const dynamicCats = [
          {
            id: 'All',
            label: 'All',
            backend: 'All',
            icon: categoryIcons['All']
          },
          ...uniqueCats.map(cat => ({
            id: cat,
            label: cat,
            backend: cat,
            icon: categoryIcons[cat] || <Utensils size={20} />
          }))
        ];
        setCategoriesList(dynamicCats);

        let filteredItems = allItems;
        if (backendCategory !== 'All') {
          filteredItems = allItems.filter(item => item.category === backendCategory);
        }

        setTopPicks(filteredItems);
      } catch (err) {
        console.error("Error fetching top pick menus:", err);
        setTopPicks([]);
      } finally {
        setLoadingTopPicks(false);
      }
    };

    fetchTopPicksMenu();
  }, [restaurants, activeCategory]);

  const displayedRestaurants = restaurants.filter(r => {
    if (activeCategory === 'All') return true;
    const cats = restaurantMenuCategories[r._id] || [];
    return cats.includes(activeCategory);
  });

  return (
    <div className="home-dashboard page animate-fade-in" style={{ background: '#fcfcfc', minHeight: '100vh' }}>
      
      <ContentWrapper>
        {/* Location Bar (hidden on desktop) */}
        <div className="dashboard-location-bar mobile-only-header animate-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 100, marginTop: '16px' }}>
          <div className="location-selector-wrapper" ref={locationRef} style={{ position: 'relative' }}>
            <button 
              type="button" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="location-display-btn"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '6px 0',
                fontFamily: 'inherit'
              }}
            >
              <MapPin size={22} color="#b31522" className="animate-pulse-soft" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111111' }}>
                {activeLocation ? savedAddresses.find(a => a.name === activeLocation)?.name || activeLocation : 'Select Location'}
              </span>
              <ChevronDown size={18} color="#718096" />
            </button>

            {dropdownOpen && (
              <div className="swiggy-location-popover animate-scale-in">
                <div style={{ padding: '0 16px 12px 16px' }}>
                  <input 
                    type="text" 
                    placeholder="Type other hostel / address..." 
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      border: '1.5px solid #e2e8f0', 
                      borderRadius: '8px', 
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCustomAddressSubmit(e.target.value);
                      }
                    }}
                  />
                </div>

                <button 
                  type="button" 
                  onClick={handleUseCurrentLocation}
                  className="swiggy-location-popover-item current-loc-item"
                >
                  <Navigation size={18} color="#b31522" className="popover-item-icon" />
                  <div className="popover-item-details">
                    <span className="current-loc-title">Use my current location</span>
                  </div>
                </button>

                <div className="swiggy-popover-divider"></div>

                <span className="swiggy-popover-header">SAVED ADDRESSES</span>

                {/* Saved Addresses list */}
                {savedAddresses.map((addr) => (
                  <button 
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setActiveLocation(addr.name);
                      setDropdownOpen(false);
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('hostel', addr.name);
                      setSearchParams(newParams);
                    }}
                    className="swiggy-location-popover-item address-item"
                  >
                    <Navigation size={18} color="#718096" className="popover-item-icon" style={{ transform: 'rotate(45deg)' }} />
                    <div className="popover-item-details">
                      <span className="address-name">{addr.name}</span>
                      <span 
                        className="address-desc" 
                        dangerouslySetInnerHTML={{ __html: addr.detail }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/profile" className="profile-avatar-btn hover-scale" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#fff5f5', borderRadius: '50%', color: '#b31522' }}>
            <User size={20} />
          </Link>
        </div>

        {/* Search Bar (hidden on desktop) */}
        <form onSubmit={handleSearchSubmit} className="dashboard-search-container mobile-only-header animate-slide-up delay-1" style={{ position: 'relative', marginBottom: '24px', zIndex: 1000 }} ref={suggestionsRef}>
          <input 
            className="dashboard-search-input"
            placeholder="Search for restaurants or dishes..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            onFocus={() => {
              if (search.trim()) {
                setShowSuggestions(true);
              }
            }}
            style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid #cbd5e0', background: '#f7fafc', fontSize: '0.95rem' }}
          />
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />

          {showSuggestions && (
            <div className="search-suggestions-dropdown">
              {loadingSuggestions ? (
                <div className="suggestion-loading">
                  <div className="suggestion-spinner"></div>
                  <span>Searching for dishes...</span>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item) => (
                  <div 
                    key={item._id} 
                    className="suggestion-item"
                    onClick={() => {
                      setShowSuggestions(false);
                      if (item.restaurant) {
                        navigate(`/restaurants/${item.restaurant}`, { state: { searchDish: item.name } });
                      } else {
                        navigate(`/restaurants`);
                      }
                    }}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="suggestion-image" />
                    ) : (
                      <div className="suggestion-image-placeholder">
                        <Search size={16} color="#a0aec0" />
                      </div>
                    )}
                    <div className="suggestion-info">
                      <span className="suggestion-name">{item.name}</span>
                      <span className="suggestion-meta">
                        {item.category && <span className="suggestion-category">{item.category}</span>}
                        {item.category && item.price && <span className="suggestion-dot">&bull;</span>}
                        {item.price && <span className="suggestion-price">₹{item.price}</span>}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="suggestion-empty">
                  No dishes found matching "{search}"
                </div>
              )}
            </div>
          )}
        </form>

        {/* Active Announcement Banner */}
        {announcements.length > 0 && dismissedAnnouncementId !== announcements[0]._id && (
          <div 
            className={`announcement-ticker animate-fade-in ${isAnnouncementExpanded ? 'expanded' : ''}`}
            onClick={() => setIsAnnouncementExpanded(!isAnnouncementExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <div className="announcement-content">
              <Volume2 size={16} color="#ffc700" className="speaker-icon" style={{ flexShrink: 0 }} />
              <span className={`announcement-text-span ${isAnnouncementExpanded ? 'expanded' : ''}`}>
                <strong>{announcements[0].title}:</strong> {announcements[0].description}
              </span>
            </div>
            <button 
              className="announcement-dismiss-btn"
              onClick={(e) => {
                e.stopPropagation();
                setDismissedAnnouncementId(announcements[0]._id);
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Promo / Main Banner */}
        {loadingCMS ? (
          <div 
            className="animate-pulse" 
            style={{ 
              height: '180px', 
              background: '#e2e8f0', 
              borderRadius: '20px', 
              marginBottom: '28px',
              width: '100%'
            }}
          />
        ) : banners.length > 0 ? (
          <div 
            className="animate-scale-in delay-2 cms-priority-banner" 
            onClick={() => handleBannerClick(banners[0])}
            style={{ 
              display: 'block', 
              borderRadius: '18px', 
              overflow: 'hidden', 
              marginBottom: '28px', 
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)'
            }}
          >
            <img 
              src={banners[0].image} 
              alt={banners[0].title} 
              className="cms-priority-banner-img"
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
        ) : (
          <div className="premium-promo-banner animate-scale-in delay-2" style={{ display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(135deg, #b31522, #5f080f)', borderRadius: '20px', padding: '24px', color: '#ffffff', marginBottom: '28px', overflow: 'hidden', position: 'relative' }}>
            <div className="premium-promo-text" style={{ zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <span className="premium-promo-title" style={{ fontSize: '1.75rem', fontWeight: 950, lineHeight: 1.1 }}>Flat<br />40% OFF</span>
              <span className="premium-promo-desc" style={{ fontSize: '0.9rem', opacity: 0.9 }}>On your first order</span>
              <button 
                className="premium-promo-btn hover-lift" 
                type="button" 
                onClick={() => { setActiveCategory('Fast Food'); setPage(1); }}
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
        )}
      </ContentWrapper>

      {/* Secondary Priority Banners Carousel Section */}
      <ContentWrapper className="home-section-spacer">
        <div className="secondary-carousel-section animate-slide-up" style={{ margin: 0 }}>
          <h3 className="carousel-section-heading">Featured Offers For You</h3>
          <div className="banners-carousel-scrollable" ref={carouselRef}>
            {loadingCMS ? (
              // Banners Carousel Skeleton
              Array.from({ length: 3 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="carousel-banner-card animate-pulse"
                  style={{ background: '#e2e8f0', borderRadius: '16px', width: '280px', height: '160px', flexShrink: 0 }}
                />
              ))
            ) : banners.slice(1).length > 0 ? (
              /* Render lower priority banners from CMS */
              banners.slice(1).map((b) => (
                <div 
                  key={b._id} 
                  className="carousel-banner-card hover-lift"
                  onClick={() => handleBannerClick(b)}
                >
                  <img 
                    src={b.image} 
                    alt={b.title} 
                    className="carousel-banner-img"
                  />
                </div>
              ))
            ) : (
              /* High Fidelity Fallback Carousel */
              <>
                {/* Purple College Deals Banner */}
                <div 
                  className="carousel-banner-card college-deals-card hover-lift"
                  onClick={() => toast.success("College Perks activated! Use code CAMPUS50")}
                >
                  <div className="college-deals-text-col">
                    <span className="college-deals-title">Campus Perks & Specials!</span>
                    <span className="college-deals-subtitle">Flat ₹50 OFF for hostel students</span>
                    <button className="college-deals-btn">VERIFY ID</button>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=300&q=80" 
                    alt="College Campus" 
                    className="college-deals-img"
                  />
                </div>

                {/* Yellow Late Night Cravings Banner */}
                <div 
                  className="carousel-banner-card late-night-card hover-lift"
                  onClick={() => { setActiveCategory('Burgers'); setPage(1); toast.success("Late night cravings filter active!"); }}
                >
                  <div className="late-night-text-col">
                    <span className="late-night-title">Midnight Study Fuel</span>
                    <span className="late-night-subtitle">24/7 Delivery to Hostels</span>
                    <span className="late-night-badge">30% OFF</span>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80" 
                    alt="Midnight burgers" 
                    className="late-night-img"
                  />
                </div>

                {/* Red Student Discount Banner */}
                <div 
                  className="carousel-banner-card student-discount-card hover-lift"
                  onClick={() => toast.success("Student card discount auto-applied!")}
                >
                  <div className="student-text-col">
                    <span className="student-title">Exam Season Saver</span>
                    <span className="student-subtitle">Flat ₹50 Cashbacks</span>
                    <span className="student-badge">STUDENT SPECIAL</span>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80" 
                    alt="Student food" 
                    className="student-img"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </ContentWrapper>


      {/* Horizontal Category Badges Scrolling */}
      <ContentWrapper className="home-section-spacer">
        <div className="horizontal-scroll-container animate-fade-in delay-3" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', marginBottom: 0 }}>
          {categoriesList.map((cat) => (
            <button 
              key={cat.id} 
              className={`category-badge-btn hover-scale hover-lift ${activeCategory === cat.id ? 'active' : ''}`} 
              onClick={() => { setActiveCategory(cat.id); setPage(1); }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px 8px',
                width: '76px',
                minWidth: '76px',
                flexShrink: 0,
                borderRadius: '16px',
                border: activeCategory === cat.id ? 'none' : '1px solid #e2e8f0',
                background: activeCategory === cat.id ? '#b31522' : '#ffffff',
                color: activeCategory === cat.id ? '#ffffff' : '#4a5568',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.72rem',
                transition: 'all 0.2s',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              <div className="category-badge-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cat.icon}
              </div>
              <span className="category-badge-label" style={{ wordBreak: 'break-word', maxWidth: '64px' }}>{cat.label}</span>
            </button>
          ))}
        </div>
      </ContentWrapper>

      {/* Top Picks For You section */}
      {(loadingTopPicks || topPicks.length > 0) && (
        <ContentWrapper className="home-section-spacer">
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111' }}>Top Picks For You</h2>
          </div>

          <div className="top-picks-scroll responsive-grid-4 animate-slide-up delay-3" style={{ marginBottom: 0 }}>
            {loadingTopPicks ? (
              // Top Picks Skeleton Loader
              Array.from({ length: 4 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="top-pick-card animate-pulse"
                  style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'block' }}
                >
                  <div style={{ height: '140px', background: '#e2e8f0' }} />
                  <div style={{ padding: '12px' }}>
                    <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '80%', marginBottom: '6px' }} />
                    <div style={{ height: '12px', background: '#edf2f7', borderRadius: '4px', width: '50%', marginBottom: '12px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ height: '14px', background: '#e2e8f0', borderRadius: '4px', width: '30%' }} />
                      <div style={{ height: '14px', background: '#e2e8f0', borderRadius: '4px', width: '30%' }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              topPicks.map((pick) => (
                <Link 
                  to={(pick.restaurantId && typeof pick.restaurantId === 'string' && pick.restaurantId.includes('_id')) ? '/restaurants' : `/restaurants/${pick.restaurantId}`} 
                  key={pick._id} 
                  className="top-pick-card hover-lift"
                  style={{ textDecoration: 'none', color: 'inherit', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'block' }}
                >
                  <div className="top-pick-img-container" style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
                    <img src={pick.image} alt={pick.name} className="top-pick-img hover-scale" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="top-pick-content" style={{ padding: '12px' }}>
                    <div className="top-pick-name" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111111', marginBottom: '2px' }}>{pick.name}</div>
                    <div className="top-pick-cuisine" style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '8px' }}>{pick.restaurantName}</div>
                    <div className="top-pick-stats" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span className="top-pick-rating" style={{ fontWeight: 700, color: '#111111', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Star size={14} color="#ffc700" fill="#ffc700" /> {pick.averageRating > 0 ? pick.averageRating.toFixed(1) : '4.5'}
                      </span>
                      <span className="top-pick-price" style={{ fontWeight: 850, color: '#b31522' }}>
                        ₹{pick.price}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </ContentWrapper>
      )}

      {/* All Restaurants List section */}
      <ContentWrapper className="home-section-spacer">
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111' }}>All Restaurants</h2>
        </div>

        {loading ? (
          <p className="loading-text" style={{ textAlign: 'center', color: '#718096', padding: '24px' }}>Loading restaurants...</p>
        ) : displayedRestaurants.length === 0 ? (
          <p className="empty-text" style={{ textAlign: 'center', color: '#718096', padding: '24px' }}>No restaurants found</p>
        ) : (
          <div className="swiggy-restaurants-grid animate-slide-up">
            {displayedRestaurants.map((r, idx) => {
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
      </ContentWrapper>

      {/* Floating Bottom Nav (hidden on desktop via css) */}
      <BottomNav activeTab="home" />

      {/* Local custom overrides for scroll sections */}
      <style>{`
        .home-dashboard {
          padding: 24px 16px 96px 16px !important;
        }
        @media (max-width: 768px) {
          .home-dashboard {
            padding: 16px 12px 96px 12px !important;
          }
        }

        .cms-priority-banner {
          aspect-ratio: 2.1 / 1;
        }
        @media (min-width: 769px) {
          .cms-priority-banner {
            aspect-ratio: 3.6 / 1;
          }
        }

        .cms-priority-banner-img {
          object-fit: cover;
        }
        @media (max-width: 768px) {
          .cms-priority-banner-img {
            object-fit: fill;
          }
        }

        /* Swiggy Location Dropdown Popover */
        .swiggy-location-popover {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 12px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid #f0f0f0;
          width: 340px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 200;
          display: flex;
          flex-direction: column;
          padding: 16px 0;
        }

        .swiggy-location-popover-item {
          width: 100%;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: flex-start;
          padding: 12px 20px;
          text-align: left;
          font-family: inherit;
          transition: background 0.2s ease;
          gap: 12px;
        }

        .swiggy-location-popover-item:hover {
          background: #f7fafc;
        }

        .popover-item-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .popover-item-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .current-loc-item {
          padding-top: 4px;
          padding-bottom: 12px;
        }

        .current-loc-title {
          font-size: 0.95rem;
          font-weight: 750;
          color: #b31522;
        }

        .swiggy-popover-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 8px 20px 14px 20px;
        }

        .swiggy-popover-header {
          font-size: 0.75rem;
          font-weight: 800;
          color: #93959f;
          padding: 0 20px 8px 20px;
          letter-spacing: 0.5px;
        }

        .address-name {
          font-size: 0.95rem;
          font-weight: 750;
          color: #282c3f;
        }

        .address-desc {
          font-size: 0.8rem;
          color: #7e808c;
          line-height: 1.4;
          font-weight: 550;
        }

        /* Announcement Banner Styles */
        .announcement-ticker {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 199, 0, 0.12);
          border: 1px solid rgba(255, 199, 0, 0.25);
          border-radius: 12px;
          padding: 10px 16px;
          margin-bottom: 20px;
          gap: 12px;
        }

        .announcement-content {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .speaker-icon {
          flex-shrink: 0;
          animation: pulseSoft 2s infinite;
        }

        .announcement-text-span {
          font-size: 0.85rem;
          color: #ffc700;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: all 0.2s;
        }

        .announcement-text-span.expanded {
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
          word-break: break-word;
        }

        .announcement-dismiss-btn {
          background: none;
          border: none;
          color: #ffc700;
          font-size: 0.85rem;
          font-weight: bold;
          cursor: pointer;
          padding: 2px 6px;
        }

        /* Service Selector Tabs */
        .service-tabs-container {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .service-header-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 10px;
          border-radius: 16px;
          border: none;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s;
          position: relative;
        }

        .service-header-tab.active-tab {
          background: #ffffff;
          color: #0d3a24;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }

        .service-header-tab.inactive-tab {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.85);
        }

        .service-header-tab.inactive-tab:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .service-tab-emoji {
          font-size: 1.2rem;
          display: flex;
          align-items: center;
        }

        .service-tab-label {
          font-size: 0.88rem;
          font-weight: 600;
        }

        .service-tab-label.font-bold {
          font-weight: 800;
          color: #0d3a24;
        }

        .instamart-badge-blue {
          position: absolute;
          top: -6px;
          right: 4px;
          background: #007bff;
          color: #ffffff;
          font-size: 0.62rem;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          box-shadow: 0 2px 6px rgba(0, 123, 255, 0.3);
        }

         /* Main Priority Banner Area */
        .main-priority-banner-area {
          position: relative;
          margin-top: 24px;
          margin-bottom: 8px;
          display: flex;
          justify-content: center;
          perspective: 1000px;
        }

        .cms-main-banner-card {
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.32), 
                      0 0 0 1px rgba(255, 255, 255, 0.08);
          position: relative;
          cursor: pointer;
          aspect-ratio: 2.1 / 1;
          transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
          z-index: 2;
        }

        .cms-main-banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .cms-main-banner-info-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
          color: #ffffff;
        }

        .cms-main-banner-tag {
          font-size: 0.65rem;
          font-weight: 900;
          background: #ffc700;
          color: #0d3a24;
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 6px;
        }

        .cms-main-banner-title {
          font-size: 1.2rem;
          font-weight: 800;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        /* Swiggy Mock Banner Fallback */
        .swiggy-mock-banner-wrapper {
          background: linear-gradient(135deg, #0f5231 0%, #083820 100%);
          border-radius: 20px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.32), 
                      0 0 0 1px rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
          z-index: 2;
        }

        .mock-banner-promo-title-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .mock-banner-cash-icon {
          font-size: 1.25rem;
          animation: float 4s ease-in-out infinite;
        }

        .mock-banner-title-text {
          font-size: 1.5rem;
          font-weight: 950;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .mock-banner-badge {
          background: #ffc700;
          color: #0d3a24;
          font-size: 0.72rem;
          font-weight: 900;
          padding: 3px 10px;
          border-radius: 12px;
        }

        .mock-banner-three-cards-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .mock-sub-card {
          background: rgba(255, 255, 255, 0.95);
          color: #1a1a1a;
          border-radius: 14px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          min-height: 105px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.06);
          position: relative;
          overflow: hidden;
        }

        .mock-sub-card-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: center;
        }

        .mock-sub-card-headline {
          font-size: 0.8rem;
          font-weight: 900;
          color: #000000;
        }

        .mock-sub-card-subline {
          font-size: 0.72rem;
          color: #555555;
          font-weight: 700;
        }

        .mock-sub-card-badge-yellow {
          background: #ffc700;
          color: #000000;
          font-size: 0.75rem;
          padding: 2px 6px;
          border-radius: 6px;
          font-weight: bold;
        }

        .mock-sub-card-badge-black {
          background: #111111;
          color: #ffc700;
          font-size: 0.65rem;
          padding: 3px 8px;
          border-radius: 8px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .mock-sub-card-badge-purple {
          background: #6f42c1;
          color: #ffffff;
          font-size: 0.65rem;
          padding: 3px 8px;
          border-radius: 8px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .mock-banner-footer-line {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.7);
          border-top: 1px dashed rgba(255, 255, 255, 0.15);
          padding-top: 12px;
        }

        /* Secondary Priority Banners Carousel */
        .secondary-carousel-section {
          margin: 12px 0 28px 0;
        }

        .carousel-section-heading {
          font-size: 1.15rem;
          font-weight: 850;
          color: #1a1a1a;
          margin-bottom: 12px;
          padding-left: 2px;
        }

        .banners-carousel-scrollable {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 10px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }

        .banners-carousel-scrollable::-webkit-scrollbar {
          height: 4px;
        }

        .banners-carousel-scrollable::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }

        .carousel-banner-card {
          flex: 0 0 280px;
          height: 125px;
          border-radius: 18px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          scroll-snap-align: start;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          background: #ffffff;
          border: 1px solid #edf2f7;
        }

        .carousel-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .carousel-banner-title-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(0,0,0,0.7);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: bold;
          padding: 4px 10px;
          border-radius: 8px;
        }

        /* College Deals Purple Card Mock */
        .college-deals-card {
          background: linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%);
          display: flex;
          justify-content: space-between;
          padding: 16px;
          box-sizing: border-box;
          border: none;
        }

        .college-deals-text-col {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          flex: 1;
        }

        .college-deals-title {
          font-size: 0.92rem;
          font-weight: 850;
          color: #6d28d9;
          line-height: 1.25;
        }

        .college-deals-subtitle {
          font-size: 0.72rem;
          color: #5b21b6;
          font-weight: 600;
          margin-top: 4px;
        }

        .college-deals-btn {
          background: #7c3aed;
          color: #ffffff;
          border: none;
          font-size: 0.68rem;
          font-weight: 900;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.2);
          margin-top: 8px;
        }

        .college-deals-img {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: 12px;
          margin-left: 10px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }

        /* Late Night Card Mock */
        .late-night-card {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          display: flex;
          justify-content: space-between;
          padding: 16px;
          border: none;
        }

        .late-night-text-col {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          flex: 1;
        }

        .late-night-title {
          font-size: 0.95rem;
          font-weight: 850;
          color: #78350f;
          line-height: 1.25;
        }

        .late-night-subtitle {
          font-size: 0.72rem;
          color: #92400e;
          font-weight: 600;
        }

        .late-night-badge {
          background: #78350f;
          color: #fde68a;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          margin-top: 8px;
        }

        .late-night-img {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: 12px;
          margin-left: 10px;
        }

        /* Student Discount Card Mock */
        .student-discount-card {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          display: flex;
          justify-content: space-between;
          padding: 16px;
          border: none;
        }

        .student-text-col {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          flex: 1;
        }

        .student-title {
          font-size: 0.95rem;
          font-weight: 850;
          color: #991b1b;
          line-height: 1.25;
        }

        .student-subtitle {
          font-size: 0.72rem;
          color: #b91c1c;
          font-weight: 600;
        }

        .student-badge {
          background: #991b1b;
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          margin-top: 8px;
        }

        .student-img {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: 12px;
          margin-left: 10px;
        }

        /* Filter Quick Pills row */
        .filter-quick-pills-row {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
        }

        .quick-filter-pill {
          background: #ffffff;
          color: #4a5568;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 0.82rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        }

        .quick-filter-pill:hover {
          border-color: #cbd5e0;
          background: #f7fafc;
          color: #1a202c;
        }

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

        /* Reusable Horizontal Alignment Content Wrapper */
        .homepage-content-wrapper {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 16px;
          padding-right: 16px;
          box-sizing: border-box;
        }

        /* Consistent spacing between sections */
        .home-section-spacer {
          margin-bottom: 28px;
        }

        @media (min-width: 768px) {
          .homepage-content-wrapper {
            padding-left: 24px;
            padding-right: 24px;
          }
          .home-section-spacer {
            margin-bottom: 32px;
          }
        }

        @media (min-width: 1024px) {
          .homepage-content-wrapper {
            padding-left: 32px;
            padding-right: 32px;
          }
        }

        .desktop-brand-logo {
          display: none;
        }
        .desktop-header-search-form {
          display: none;
        }

        @media (min-width: 769px) {
          .mobile-only-header {
            display: none !important;
          }
          .top-picks-scroll.responsive-grid-4 {
            display: grid !important;
          }
          .dashboard-location-bar {
            margin-top: 16px;
          }
           /* Announcement banner visibility & positioning on Web */
          .announcement-ticker {
            margin-top: 16px;
            margin-bottom: 24px;
            background: #fffbeb !important; /* Soft warm amber background */
            border: 1px solid #fde68a !important; /* Warm amber border */
          }
          .announcement-text-span {
            color: #b45309 !important; /* Dark amber text for high visibility */
            font-weight: 600 !important;
          }
          .speaker-icon {
            stroke: #b45309 !important;
          }
          .announcement-dismiss-btn {
            color: #b45309 !important;
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

        /* Suggestions Dropdown Styling */
        .search-suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          margin-top: 10px;
          z-index: 1000;
          overflow: hidden;
          border: 1px solid #edf2f7;
          display: flex;
          flex-direction: column;
          animation: slideDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideDownFade {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-bottom: 1px solid #f7fafc;
          text-align: left;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover {
          background-color: #f7fafc;
        }

        .suggestion-image {
          width: 44px;
          height: 44px;
          object-fit: cover;
          border-radius: 8px;
          background-color: #edf2f7;
        }

        .suggestion-image-placeholder {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background-color: #edf2f7;
        }

        .suggestion-info {
          display: flex;
          flex-grow: 1;
          min-width: 0;
          flex-direction: column;
        }

        .suggestion-name {
          font-size: 0.95rem;
          font-weight: 650;
          color: #2d3748;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .suggestion-meta {
          font-size: 0.8rem;
          color: #718096;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .suggestion-category {
          text-transform: capitalize;
        }

        .suggestion-dot {
          color: #cbd5e0;
        }

        .suggestion-price {
          font-weight: 700;
          color: #b31522;
        }

        .suggestion-loading, .suggestion-empty {
          padding: 20px;
          text-align: center;
          font-size: 0.9rem;
          color: #718096;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .suggestion-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #edf2f7;
          border-top: 2px solid #b31522;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
