import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getUserCategories, getUserProducts } from '../../api/marketplace.api';
import BottomNav from '../../components/BottomNav';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  Tag,
  Info,
  DollarSign,
  Package,
  ChevronDown,
  User,
  Bookmark,
  MapPin
} from 'lucide-react';

export default function Marketplace() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Loading state
  const [loading, setLoading] = useState(true);

  // Data states
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Geolocation state
  const [location, setLocation] = useState('Locating...');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await res.json();
            const locationName = data.locality || data.city || data.principalSubdivision || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
            setLocation(locationName);
          } catch (error) {
            console.error("Reverse geocoding failed:", error);
            setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          }
        },
        (error) => {
          console.error("Geolocation failed:", error);
          setLocation('Kochi');
        }
      );
    } else {
      setLocation('Kochi');
    }
  }, []);

  // Query states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters expanded toggler
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories (active only, no pagination limit)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await getUserCategories({ page: 1, limit: 100 });
        if (data.success) {
          setCategories(data.data.categories || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getUserProducts({
        search: search || undefined,
        category: selectedCategory || undefined,
        condition: selectedCondition || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        page,
        limit: 12
      });
      if (data.success) {
        setProducts(data.data.products || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedCondition, minPrice, maxPrice, page, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle category pill click
  const handleCategoryClick = (catId) => {
    setSelectedCategory(prev => prev === catId ? '' : catId);
    setPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedCondition('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  return (
    <div className="main-content-scrollable animate-fade-in" style={{ background: '#f8fafc', minHeight: '85vh' }}>
      
      {/* Redesigned Location & Avatar Header (Matches Food page) */}
      <div className="marketplace-header-container" style={{ background: '#ffffff', borderBottom: 'none', padding: '16px 20px 0 20px' }}>
        
        {/* Top Location Bar */}
        <div className="dashboard-location-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={22} color="#b31522" className="animate-pulse-soft" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111111' }}>
              {location}
            </span>
            <ChevronDown size={18} color="#718096" />
          </div>
          
          <Link 
            to="/profile" 
            className="profile-avatar-btn hover-scale" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '40px', 
              height: '40px', 
              background: '#fff5f5', 
              borderRadius: '50%', 
              color: '#b31522',
              border: '1px solid #ffe4e6'
            }}
          >
            {user && user.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <User size={20} />
            )}
          </Link>
        </div>

        {/* 2. Search Section */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
          <div className="dashboard-search-container" style={{ margin: 0 }}>
            <input
              type="text"
              className="dashboard-search-input"
              placeholder="Search for textbooks, cycles, coolers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Search className="dashboard-search-icon" />
          </div>

          {/* Toggle Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '48px',
              width: '48px',
              borderRadius: '12px',
              border: 'none',
              background: showFilters ? 'var(--primary-light)' : '#f1f5f9',
              color: showFilters ? 'var(--primary)' : '#718096',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s'
            }}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Advanced Filters Block (Dropdown) */}
        {showFilters && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            animation: 'slideDown 0.2s ease-out',
            marginTop: '-4px'
          }}>
            {/* Condition Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Item Condition</label>
              <select
                value={selectedCondition}
                onChange={(e) => {
                  setSelectedCondition(e.target.value);
                  setPage(1);
                }}
                style={{
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.85rem',
                  fontWeight: 650,
                  outline: 'none',
                  background: '#ffffff'
                }}
              >
                <option value="">Any Condition</option>
                <option value="NEW">New (Unused)</option>
                <option value="LIKE_NEW">Like New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair (Used)</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Price Range (₹)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    height: '42px',
                    width: '100%',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <span style={{ color: '#94a3b8' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    height: '42px',
                    width: '100%',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Reset Actions */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <button
                onClick={resetFilters}
                style={{
                  height: '42px',
                  padding: '0 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 750,
                  fontSize: '0.85rem',
                  transition: 'all 0.15s',
                  width: '100%'
                }}
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 4. Categories Horizontal Strip */}
      <div style={{ background: '#ffffff', padding: '8px 20px 16px 20px', borderBottom: '1px solid #edf2f7', marginBottom: '8px' }}>
        <div className="marketplace-cat-strip-container">
          <button
            onClick={() => {
              setSelectedCategory('');
              setPage(1);
            }}
            className={`marketplace-cat-strip-item ${!selectedCategory ? 'active' : ''}`}
          >
            <div className="marketplace-cat-strip-icon-box">
              <Layers size={20} color={!selectedCategory ? 'var(--primary)' : '#64748b'} />
            </div>
            <span className="marketplace-cat-strip-text">All</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => handleCategoryClick(cat._id)}
                className={`marketplace-cat-strip-item ${isSelected ? 'active' : ''}`}
              >
                <div className="marketplace-cat-strip-icon-box">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} />
                  ) : (
                    <Layers size={20} color={isSelected ? 'var(--primary)' : '#64748b'} />
                  )}
                </div>
                <span className="marketplace-cat-strip-text">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="home-dashboard" style={{ background: 'transparent', paddingTop: '8px' }}>

        {/* Products Grid */}
        {loading ? (
          <div className="marketplace-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="marketplace-product-card" style={{ pointerEvents: 'none' }}>
                {/* Thumbnail Skeleton */}
                <div className="skeleton-animation" style={{ width: '100%', paddingTop: '75%', background: '#e2e8f0' }}></div>
                {/* Body Skeleton */}
                <div className="marketplace-product-card-body">
                  <div style={{ marginBottom: '12px' }}>
                    <div className="skeleton-animation" style={{ height: '12px', width: '30%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div className="skeleton-animation" style={{ height: '18px', width: '80%', background: '#e2e8f0', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <div className="skeleton-animation" style={{ height: '20px', width: '40%', background: '#e2e8f0', borderRadius: '4px' }}></div>
                    <div className="skeleton-animation" style={{ height: '12px', width: '30%', background: '#e2e8f0', borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: 'var(--shadow)',
            color: '#64748b'
          }}>
            <Package size={48} style={{ margin: '0 auto 16px auto', color: '#94a3b8' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>No Listings Found</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>We couldn't find any products matching your search criteria.</p>
            <button onClick={resetFilters} className="btn btn-outline" style={{ width: 'auto', padding: '10px 20px' }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="marketplace-grid">
              {products.map((prod) => (
                <div
                  key={prod._id}
                  onClick={() => navigate(`/marketplace/product/${prod._id}`)}
                  className="marketplace-product-card"
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', width: '100%', paddingTop: '75%', background: '#f8fafc' }}>
                    {prod.images && prod.images[0] ? (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        loading="lazy"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={36} color="#94a3b8" />
                      </div>
                    )}

                    {/* Condition Tag */}
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: prod.condition === 'NEW' ? '#e1f5fe' : prod.condition === 'LIKE_NEW' ? '#e8f5e9' : prod.condition === 'GOOD' ? '#fff9c4' : '#ffe0b2',
                      color: prod.condition === 'NEW' ? '#0288d1' : prod.condition === 'LIKE_NEW' ? '#2e7d32' : prod.condition === 'GOOD' ? '#f57f17' : '#e65100',
                      padding: '4px 10px',
                      borderRadius: '50px',
                      fontSize: '0.68rem',
                      fontWeight: 850,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                    }}>
                      {prod.condition}
                    </span>
                  </div>

                  {/* Body details */}
                  <div className="marketplace-product-card-body">
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        {prod.category?.name || 'Item'}
                      </span>
                      <h3 className="marketplace-product-card-title">
                        {prod.name}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                      <span className="marketplace-product-card-price">
                        ₹{prod.price}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 750, color: '#16a34a' }}>
                        Available
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '48px', paddingBottom: '32px' }}>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ width: 'auto', padding: '10px 16px', borderRadius: '12px' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#475569' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ width: 'auto', padding: '10px 16px', borderRadius: '12px' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
      <BottomNav activeTab="marketplace" />
    </div>
  );
}
