import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

import { ShoppingCart, Flame, Store, Shield, Bike, Navigation, ClipboardList, User, LogOut, ChevronDown, Search, ShoppingBag } from 'lucide-react';
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

  // Hide main customer navbar on homepage, vendor portal, admin dashboard, delivery partner routes, and static pages
  if (
    location.pathname === '/' || 
    location.pathname === '/terms-and-conditions' || 
    location.pathname === '/privacy-policy' || 
    location.pathname === '/refund-policy' || 
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
              Campus<span style={{ color: '#b31522' }}>In</span>
            </span>
          </Link>


        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {isHomepage && (
            <form onSubmit={handleSearchSubmit} className="desktop-header-search-form-nav" style={{ width: '320px' }} ref={suggestionsRef}>
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
          )}

          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <>
                {user.role === 'user' && (
                  <>
                    <NavLink 
                      to="/restaurants" 
                      className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
                      title="Restaurants"
                    >
                      <Store size={18} />
                    </NavLink>
                    <NavLink 
                      to="/marketplace" 
                      className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
                      title="Marketplace"
                    >
                      <ShoppingBag size={18} />
                    </NavLink>
                    <NavLink 
                      to="/cart" 
                      className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
                      title="Cart"
                    >
                      <ShoppingCart size={18} />
                    </NavLink>
                    <NavLink 
                      to="/orders" 
                      className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
                      title="Orders"
                    >
                      <ClipboardList size={18} />
                    </NavLink>
                    <NavLink 
                      to="/profile" 
                      className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
                      title="Profile"
                    >
                      <User size={18} />
                    </NavLink>
                  </>
                )}
                
                {user.role === 'vendor' && (
                  <>
                    <NavLink 
                      to="/vendor" 
                      className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
                      title="Vendor Dashboard"
                    >
                      <Store size={18} />
                    </NavLink>
                    <NavLink 
                      to="/profile" 
                      className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
                      title="Profile"
                    >
                      <User size={18} />
                    </NavLink>
                  </>
                )}
                
                {user.role === 'admin' && (
                  <>
                    <NavLink 
                      to="/admin" 
                      className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
                      title="Admin Dashboard"
                    >
                      <Shield size={18} />
                    </NavLink>
                  </>
                )}
                
                {user.role === 'delivery_partner' && (
                  <>
                    <NavLink 
                      to="/delivery/dashboard" 
                      className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
                      title="Delivery Dashboard"
                    >
                      <Bike size={18} />
                    </NavLink>
                  </>
                )}
                
                <button 
                  onClick={() => logout('user')} 
                  className="desktop-logout-btn"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
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
        </div>
      </ContentWrapper>
    </nav>
  );
}
