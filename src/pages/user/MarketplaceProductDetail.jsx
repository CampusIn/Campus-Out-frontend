import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { getUserProductById } from '../../api/marketplace.api';
import BottomNav from '../../components/BottomNav';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Package,
  Layers,
  Calendar,
  User,
  ShoppingBag,
  Share2,
  Heart,
  ChevronRight
} from 'lucide-react';

export default function MarketplaceProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Product link copied to clipboard!');
  };

  const scrollToImage = (index) => {
    setActiveImageIndex(index);
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: index * width,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = (e) => {
    const width = e.currentTarget.offsetWidth;
    if (width === 0) return;
    const index = Math.round(e.currentTarget.scrollLeft / width);
    if (index !== activeImageIndex) {
      setActiveImageIndex(index);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await getUserProductById(productId);
        if (data.success) {
          setProduct(data.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error fetching product details');
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, navigate, toast]);

  if (loading) {
    return (
      <div className="main-content-scrollable animate-fade-in" style={{ background: '#f8fafc', minHeight: '85vh' }}>
        <div className="marketplace-detail-container">
          {/* Back Button Skeleton */}
          <div className="skeleton-animation" style={{ width: '150px', height: '24px', borderRadius: '6px', marginBottom: '24px' }}></div>

          {/* Product Details Layout Grid Skeleton */}
          <div className="marketplace-detail-card" style={{ pointerEvents: 'none' }}>
            
            {/* Left Column: Image Gallery Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              {/* Main Image Slider Skeleton */}
              <div className="skeleton-animation" style={{ width: '100%', aspectRatio: '4/3', borderRadius: '20px' }}></div>
              {/* Thumbnail Navigation Skeleton */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton-animation" style={{ width: '70px', height: '70px', borderRadius: '10px' }}></div>
                ))}
              </div>
            </div>

            {/* Right Column: Descriptions & Contacts Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
              {/* Title & Badge Skeleton */}
              <div>
                <div className="skeleton-animation" style={{ height: '14px', width: '20%', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div className="skeleton-animation" style={{ height: '32px', width: '80%', borderRadius: '6px', marginBottom: '16px' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton-animation" style={{ height: '48px', borderRadius: '12px' }}></div>
                  ))}
                </div>
              </div>

              {/* Price Skeleton */}
              <div className="skeleton-animation" style={{ height: '88px', borderRadius: '16px' }}></div>

              {/* Description Skeleton */}
              <div>
                <div className="skeleton-animation" style={{ height: '14px', width: '30%', borderRadius: '4px', marginBottom: '10px' }}></div>
                <div className="skeleton-animation" style={{ height: '96px', borderRadius: '16px' }}></div>
              </div>

              {/* Contact Card Skeleton */}
              <div className="skeleton-animation" style={{ height: '150px', borderRadius: '20px' }}></div>
            </div>

          </div>
        </div>
        <BottomNav activeTab="marketplace" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="main-content-scrollable animate-fade-in" style={{ background: '#f8fafc', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Package size={48} color="#94a3b8" />
          <h3 style={{ marginTop: '16px', fontWeight: 800 }}>Product Not Found</h3>
          <button onClick={() => navigate('/marketplace')} className="btn btn-primary" style={{ marginTop: '16px' }}>
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  // Pre-filled WhatsApp message
  const whatsappUrl = product.sellerPhoneNumber
    ? `https://wa.me/91${product.sellerPhoneNumber.trim()}?text=${encodeURIComponent(
        `Hi, I saw your listing for "${product.name}" on Campus Out Marketplace. Is it still available?`
      )}`
    : '';

  return (
    <div className="main-content-scrollable animate-fade-in" style={{ background: '#f8fafc', minHeight: '85vh', paddingBottom: '160px' }}>
      <div className="marketplace-detail-container">
        
        {/* Detail Wrapper Card for Desktop & Mobile */}
        <div className="marketplace-detail-card" style={{ position: 'relative' }}>
          
          {/* Top Floating Nav Bar inside the card for premium feel */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <button 
              onClick={() => navigate('/marketplace')}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                pointerEvents: 'auto',
                transition: 'transform 0.15s'
              }}
              className="hover-scale"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          {/* Left Column: Image Gallery & Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <div className="marketplace-carousel-wrapper">
              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                style={{
                  display: 'flex',
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  borderRadius: '20px',
                  width: '100%',
                  aspectRatio: '4/3',
                  background: '#ffffff',
                  border: '1px solid #f1f5f9'
                }}
              >
                {product.images && product.images.length > 0 ? (
                  product.images.map((imgUrl, index) => (
                    <div 
                      key={index}
                      style={{
                        minWidth: '100%',
                        width: '100%',
                        height: '100%',
                        scrollSnapAlign: 'start',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`${product.name}-${index}`} 
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                      />
                    </div>
                  ))
                ) : (
                  <div style={{ minWidth: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={48} color="#94a3b8" />
                  </div>
                )}
              </div>
            </div>

            {/* Pagination Dots */}
            {product.images && product.images.length > 1 && (
              <div className="marketplace-carousel-dots">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToImage(index)}
                    className={`marketplace-carousel-dot ${activeImageIndex === index ? 'active' : ''}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Descriptions & Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <div>
              {/* Category Explorer Link */}
              <button 
                onClick={() => navigate('/marketplace', { state: { filterCategory: product.category?._id } })}
                className="marketplace-explore-link"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                Explore all {product.category?.name || 'items'} items <ChevronRight size={14} />
              </button>

              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.25, marginBottom: '8px' }}>
                {product.name}
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '16px' }}>
                <Calendar size={14} />
                <span>Posted {product.createdAt ? `on ${new Date(product.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'recently'}</span>
              </div>
            </div>

            {/* Variant / Option Selectors (Zepto Style) */}
            
            {/* Condition Options */}
            <div>
              <h4 className="marketplace-option-label">Product Condition:</h4>
              <div className="marketplace-options-grid">
                {['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'].map((cond) => {
                  const isMatch = product.condition === cond;
                  return (
                    <div 
                      key={cond}
                      className={`marketplace-option-card ${isMatch ? 'active' : ''}`}
                      style={{ opacity: isMatch ? 1 : 0.4, cursor: 'default' }}
                    >
                      <span>{cond.replace('_', ' ')}</span>
                      <span className="marketplace-option-subtext">{isMatch ? 'Available' : 'N/A'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stock / Quantity Options */}
            <div>
              <h4 className="marketplace-option-label">Quantity / Stock:</h4>
              <div className="marketplace-options-grid">
                <div className="marketplace-option-card active" style={{ cursor: 'default' }}>
                  <span>{product.stock > 0 ? `${product.stock} Units` : 'Out of Stock'}</span>
                  <span className="marketplace-option-subtext" style={{ color: product.stock > 0 ? '#16a34a' : '#dc2626' }}>
                    {product.stock > 0 ? 'In Stock' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="marketplace-option-label">Product Details:</h4>
              <p style={{
                color: '#334155',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                background: '#f8fafc',
                border: '1.5px solid #edf2f7',
                borderRadius: '16px',
                padding: '16px 20px',
                whiteSpace: 'pre-line',
                margin: 0
              }}>
                {product.description}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Sticky Bottom Footer Bar */}
      <div className="marketplace-sticky-footer">
        <div>
          <div className="marketplace-footer-price-label">Price</div>
          <div className="marketplace-footer-price">₹{product.price}</div>
        </div>
        
        <div className="marketplace-footer-actions">
          {product.sellerPhoneNumber ? (
            <>
              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="marketplace-footer-btn marketplace-footer-btn-secondary"
              >
                <MessageCircle size={18} fill="#ffffff" />
                <span>WhatsApp</span>
              </a>

              {/* Call Seller Button */}
              <a
                href={`tel:${product.sellerPhoneNumber.trim()}`}
                className="marketplace-footer-btn marketplace-footer-btn-primary"
              >
                <Phone size={16} fill="#ffffff" />
                <span>Call Seller</span>
              </a>
            </>
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
              No contact details available
            </div>
          )}
        </div>
      </div>

      <BottomNav activeTab="marketplace" />
    </div>
  );
}
