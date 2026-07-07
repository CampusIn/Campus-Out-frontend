import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, ClipboardList, User, LogOut, Flame, Store, Shield, Bike, MapPin, ChevronDown, Navigation, Search, ShoppingBag } from 'lucide-react';
import { getMenuSuggestions } from '../api/menu.api';

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

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeLocation, setActiveLocation] = useState(searchParams.get('hostel') || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const locationRef = useRef(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Sync state with URL search params when URL changes
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setActiveLocation(searchParams.get('hostel') || '');
  }, [searchParams]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions with debounce
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed || location.pathname.startsWith('/marketplace')) {
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (search.trim()) {
      newParams.set('search', search.trim());
    } else {
      newParams.delete('search');
    }
    const targetPath = location.pathname.startsWith('/marketplace') ? '/marketplace' : '/restaurants';
    navigate(`${targetPath}?${newParams.toString()}`);
  };

  const handleCustomAddressSubmit = (val) => {
    if (!val.trim()) return;
    setActiveLocation(val.trim());
    setDropdownOpen(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('hostel', val.trim());
    const targetPath = location.pathname.startsWith('/marketplace') ? '/marketplace' : '/restaurants';
    navigate(`${targetPath}?${newParams.toString()}`);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setActiveLocation("Locating...");
          setDropdownOpen(false);
          
          const targetPath = location.pathname.startsWith('/marketplace') ? '/marketplace' : '/restaurants';
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await res.json();
            const locationName = data.locality || data.city || data.principalSubdivision;
            const resolvedName = locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            setActiveLocation(resolvedName);
            const newParams = new URLSearchParams(searchParams);
            newParams.set('hostel', resolvedName);
            navigate(`${targetPath}?${newParams.toString()}`);
          } catch (error) {
            console.error("Reverse geocoding failed, using fallback:", error);
            const fallbackName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setActiveLocation(fallbackName);
            const newParams = new URLSearchParams(searchParams);
            newParams.set('hostel', fallbackName);
            navigate(`${targetPath}?${newParams.toString()}`);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not retrieve current location. Please select one of the saved addresses or type a custom one.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Hide main customer navbar on homepage, vendor portal, admin dashboard, and delivery partner routes
  if (
    location.pathname === '/' || 
    location.pathname.startsWith('/vendor') || 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/delivery')
  ) {
    return null;
  }

  const isActive = (path) => location.pathname === path;
  const isHomepage = location.pathname === '/restaurants' || location.pathname === '/marketplace';

  return (
    <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 10000 }}>
      <ContentWrapper className="navbar-flex-row">
        <div className="navbar-left-content">
          <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ background: '#b31522', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={20} color="#ffffff" style={{ animation: 'pulseSoft 2s infinite' }} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#111111' }}>
              CAMPUS<span style={{ color: '#b31522' }}>IN</span>
            </span>
          </Link>

          {isHomepage && (
            <>
              <div className="nav-vertical-separator"></div>

              {/* Location Selector */}
              <div className="location-selector-wrapper" ref={locationRef} style={{ position: 'relative' }}>
                <button 
                  type="button" 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="location-display-btn-nav"
                >
                  <Navigation size={16} color="#b31522" style={{ fill: '#b31522', transform: 'rotate(45deg)', flexShrink: 0 }} />
                  <div className="location-info-text-nav">
                    <span className="location-title-main-nav">Others</span>
                    <span className="location-desc-sub-nav">
                      {activeLocation ? savedAddresses.find(a => a.name === activeLocation)?.name || activeLocation : 'Select Location'}
                    </span>
                    <ChevronDown size={14} color="#b31522" strokeWidth={3} style={{ flexShrink: 0 }} />
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="swiggy-location-popover animate-scale-in" style={{ top: '45px', left: 0 }}>
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

                    {savedAddresses.map((addr) => (
                      <button 
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setActiveLocation(addr.name);
                          setDropdownOpen(false);
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set('hostel', addr.name);
                          const targetPath = location.pathname.startsWith('/marketplace') ? '/marketplace' : '/restaurants';
                          navigate(`${targetPath}?${newParams.toString()}`);
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
            </>
          )}
        </div>

        {isHomepage ? (
          <div className="navbar-right-content-homepage">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="desktop-header-search-form-nav" ref={suggestionsRef}>
              <input 
                type="text" 
                className="desktop-search-input-field-nav"
                placeholder={location.pathname === '/marketplace' ? "Search for textbooks, cycles, coolers..." : "Search for restaurant and food"} 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                onFocus={() => {
                  if (search.trim()) {
                    setShowSuggestions(true);
                  }
                }}
              />
              <Search size={16} color="#686b78" className="search-right-lens-icon-nav" style={{ cursor: 'pointer' }} onClick={handleSearchSubmit} />

              {showSuggestions && (
                <div className="nav-search-suggestions-dropdown">
                  {loadingSuggestions ? (
                    <div className="nav-suggestion-loading">
                      <div className="nav-suggestion-spinner"></div>
                      <span>Searching for dishes...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((item) => (
                      <div 
                        key={item._id} 
                        className="nav-suggestion-item"
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
                          <img src={item.image} alt={item.name} className="nav-suggestion-image" />
                        ) : (
                          <div className="nav-suggestion-image-placeholder">
                            <Search size={14} color="#a0aec0" />
                          </div>
                        )}
                        <div className="nav-suggestion-info">
                          <span className="nav-suggestion-name">{item.name}</span>
                          <span className="nav-suggestion-meta">
                            {item.category && <span className="nav-suggestion-category">{item.category}</span>}
                            {item.category && item.price && <span className="nav-suggestion-dot">&bull;</span>}
                            {item.price && <span className="nav-suggestion-price">₹{item.price}</span>}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="nav-suggestion-empty">
                      No dishes found matching "{search}"
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Homepage Desktop-Only circular Profile User Avatar button */}
            <div className="homepage-profile-avatar-container">
              <Link to="/profile" className="homepage-profile-circle-btn hover-scale">
                <User size={18} color="#ffffff" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link 
              to="/restaurants" 
              className="nav-link"
              style={{ 
                color: isActive('/restaurants') ? '#b31522' : '#718096', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '0.9rem',
                transition: 'color 0.2s'
              }}
            >
              <Store size={18} />
              Restaurants
            </Link>
            
            <Link 
              to="/marketplace" 
              className="nav-link"
              style={{ 
                color: isActive('/marketplace') ? '#b31522' : '#718096', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '0.9rem',
                transition: 'color 0.2s'
              }}
            >
              <ShoppingBag size={18} />
              Marketplace
            </Link>
            
            {user ? (
              <>
                {user.role === 'user' && (
                  <>
                    <Link 
                      to="/cart" 
                      className="nav-link"
                      style={{ 
                        color: isActive('/cart') ? '#b31522' : '#718096', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                      }}
                    >
                      <ShoppingCart size={18} />
                      Cart
                    </Link>
                    <Link 
                      to="/orders" 
                      className="nav-link"
                      style={{ 
                        color: isActive('/orders') ? '#b31522' : '#718096', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                      }}
                    >
                      <ClipboardList size={18} />
                      Orders
                    </Link>
                    <Link 
                      to="/profile" 
                      className="nav-link"
                      style={{ 
                        color: isActive('/profile') ? '#b31522' : '#718096', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                      }}
                    >
                      <User size={18} />
                      Profile
                    </Link>
                  </>
                )}
                
                {user.role === 'vendor' && (
                  <>
                    <Link 
                      to="/vendor" 
                      className="nav-link"
                      style={{ 
                        color: isActive('/vendor') ? '#b31522' : '#718096', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                      }}
                    >
                      <Store size={18} />
                      Dashboard
                    </Link>
                    <Link 
                      to="/profile" 
                      className="nav-link"
                      style={{ 
                        color: isActive('/profile') ? '#b31522' : '#718096', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                      }}
                    >
                      <User size={18} />
                      Profile
                    </Link>
                  </>
                )}
                
                {user.role === 'admin' && (
                  <>
                    <Link 
                      to="/admin" 
                      className="nav-link"
                      style={{ 
                        color: isActive('/admin') ? '#b31522' : '#718096', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                      }}
                    >
                      <Shield size={18} />
                      Admin Dashboard
                    </Link>
                  </>
                )}
                
                {user.role === 'delivery_partner' && (
                  <>
                    <Link 
                      to="/delivery/dashboard" 
                      className="nav-link"
                      style={{ 
                        color: isActive('/delivery/dashboard') ? '#06c169' : '#718096', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                      }}
                    >
                      <Bike size={18} />
                      Delivery Dashboard
                    </Link>
                  </>
                )}
                
                <button 
                  onClick={logout} 
                  className="nav-link hover-darken" 
                  style={{ 
                    background: '#fff5f5', 
                    border: 'none', 
                    color: '#b31522',
                    cursor: 'pointer', 
                    fontFamily: 'inherit', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/delivery/login" 
                  className="nav-link"
                  style={{ 
                    color: isActive('/delivery/login') ? '#06c169' : '#718096', 
                    fontWeight: 700, 
                    fontSize: '0.9rem',
                    marginRight: '8px'
                  }}
                >
                  Delivery Portal
                </Link>
                <Link 
                  to="/login" 
                  className="nav-link"
                  style={{ 
                    color: isActive('/login') ? '#b31522' : '#718096', 
                    fontWeight: 700, 
                    fontSize: '0.9rem' 
                  }}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary animate-pulse-soft"
                  style={{ 
                    background: '#b31522', 
                    color: '#ffffff', 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    fontWeight: 700, 
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </ContentWrapper>
    </nav>
  );
}
