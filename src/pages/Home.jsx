import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { Flame, Search, MapPin, ChevronDown, ArrowRight, Clock, Heart, Award, Star, SlidersHorizontal } from 'lucide-react';
import { getRestaurants } from '../api/restaurant.api';

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

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  // Redirect if already logged in to provide a smooth experience
  useEffect(() => {
    if (user) {
      navigate(user.role === 'vendor' ? '/vendor' : '/restaurants', { replace: true });
    }
  }, [user, navigate]);

  // Fetch canteens for homepage listing
  useEffect(() => {
    if (!user) {
      fetchTopRestaurants();
    }
  }, [user]);

  const fetchTopRestaurants = async () => {
    setLoadingRestaurants(true);
    try {
      const { data } = await getRestaurants({ page: 1, limit: 8 });
      setRestaurants(data?.data?.restaurant || []);
    } catch (e) {
      setRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  if (user) return null;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() || hostel) {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (hostel) params.append('hostel', hostel);
      navigate(`/restaurants?${params.toString()}`);
    } else {
      navigate('/restaurants');
    }
  };

  return (
    <div className="landing-page-container">
      {/* 1. Header (Transparent over Red Hero) */}
      <header className="landing-header">
        <div className="header-content">
          <Link to="/" className="brand-logo">
            <div className="logo-icon">
              <Flame size={22} color="#b31522" className="logo-flame-animation" />
            </div>
            <span className="brand-name">
              CAMPUS<span className="brand-name-sub">IN</span>
            </span>
          </Link>

          <nav className="header-nav hide-mobile">
            <Link to="/restaurants" className="nav-link-item">Restaurants</Link>
            <Link to="/register" className="nav-link-item">Partner with us</Link>
            <a href="#help" className="nav-link-item">Get Help</a>
          </nav>

          <div className="header-actions">
            <Link to="/login" className="btn-signin-nav">Sign In</Link>
            <Link to="/register" className="btn-register-nav hide-mobile">Register</Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Red Background with Floating Food and Search Box) */}
      <section className="hero-section">
        {/* Floating food items (Hidden on Mobile for cleaner view) */}
        <div className="floating-food food-left hide-mobile">
          <img 
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80" 
            alt="Delicious Burger" 
            className="floating-image"
          />
        </div>
        <div className="floating-food food-right hide-mobile">
          <img 
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80" 
            alt="Hot Pizza" 
            className="floating-image"
          />
        </div>

        <div className="hero-content-wrapper">
          <h1 className="hero-title animate-slide-up">
            Order food & canteens.<br />
            Discover best meals. <span className="highlight-yellow">CampusIn</span> it!
          </h1>
          <p className="hero-subtitle animate-slide-up delay-1">
            Fresh, hot meals from your favorite campus restaurants delivered straight to your hostel door.
          </p>

          {/* Search bar Widget */}
          <form onSubmit={handleSearchSubmit} className="hero-search-form animate-slide-up delay-2">
            <div className="search-field-location">
              <MapPin size={20} color="#b31522" className="field-icon" />
              <select 
                value={hostel} 
                onChange={(e) => setHostel(e.target.value)}
                className="location-select-input"
              >
                <option value="">Select Hostel / Building</option>
                <option value="Hostel A">Hostel A (Boys)</option>
                <option value="Hostel B">Hostel B (Girls)</option>
                <option value="Hostel C">Hostel C</option>
                <option value="PG Block">PG Hostel Block</option>
                <option value="Central Library">Central Library</option>
                <option value="Academic Block">Academic Block</option>
              </select>
              <ChevronDown size={16} color="#718096" className="dropdown-arrow-icon" />
            </div>

            <div className="search-field-divider"></div>

            <div className="search-field-query">
              <Search size={20} color="#718096" className="field-icon" />
              <input 
                type="text" 
                placeholder="Search for restaurants, dishes or drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="query-text-input"
              />
            </div>

            <button type="submit" className="search-submit-btn hover-scale">
              Find Food
            </button>
          </form>
        </div>
      </section>

      {/* 3. Promo/Service Cards Section */}
      <section className="services-section">
        <div className="section-container">
          <div className="services-grid">
            {/* Card 1: Canteen Delivery */}
            <div className="service-card hover-lift">
              <div className="service-card-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80" 
                  alt="Campus Canteen Food" 
                  className="service-card-image"
                />
              </div>
              <div className="service-card-info">
                <span className="promo-badge badge-red">UP TO 40% OFF</span>
                <h3 className="service-card-title">Campus Delivery</h3>
                <p className="service-card-desc">
                  Order from your favorite canteens and enjoy fresh meals on campus.
                </p>
                <Link to="/restaurants" className="service-card-arrow-btn">
                  <ArrowRight size={20} color="#ffffff" />
                </Link>
              </div>
            </div>

            {/* Card 2: Hostel Delivery */}
            <div className="service-card hover-lift">
              <div className="service-card-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80" 
                  alt="Late Night Snacks" 
                  className="service-card-image"
                />
              </div>
              <div className="service-card-info">
                <span className="promo-badge badge-yellow">LATE NIGHT SHIFT</span>
                <h3 className="service-card-title">Hostel Drop</h3>
                <p className="service-card-desc">
                  Late night cravings or study sessions? We deliver straight to your room.
                </p>
                <Link to="/restaurants" className="service-card-arrow-btn">
                  <ArrowRight size={20} color="#ffffff" />
                </Link>
              </div>
            </div>

            {/* Card 3: Self-Pickup */}
            <div className="service-card hover-lift">
              <div className="service-card-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80" 
                  alt="Coffee Coffee" 
                  className="service-card-image"
                />
              </div>
              <div className="service-card-info">
                <span className="promo-badge badge-green">SKIP THE QUEUE</span>
                <h3 className="service-card-title">Self Pickup</h3>
                <p className="service-card-desc">
                  Pre-order coffee and snacks. Beat the rush and pick up when ready.
                </p>
                <Link to="/restaurants" className="service-card-arrow-btn">
                  <ArrowRight size={20} color="#ffffff" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Restaurants to Explore Grid Section (Swiggy Style) */}
      <section className="restaurants-explore-section">
        <div className="section-container">
          <h2 className="explore-section-title">Restaurants to explore</h2>
          
          {/* Swiggy Filter Chips */}
          <div className="filter-chips-row">
            <button type="button" onClick={() => navigate('/restaurants')} className="filter-chip">
              Filter <SlidersHorizontal size={14} className="chip-icon-right" />
            </button>
            <button type="button" onClick={() => navigate('/restaurants')} className="filter-chip">
              Sort By <ChevronDown size={14} className="chip-icon-right" />
            </button>
            <button type="button" onClick={() => navigate('/restaurants?category=Fast+Food')} className="filter-chip">
              Fast Delivery <span className="new-badge-tag">NEW</span>
            </button>
            <button type="button" onClick={() => navigate('/restaurants?category=North+Indian')} className="filter-chip">
              Veg/Non-Veg <ChevronDown size={14} className="chip-icon-right" />
            </button>
            <button type="button" onClick={() => navigate('/restaurants')} className="filter-chip">
              Ratings <ChevronDown size={14} className="chip-icon-right" />
            </button>
            <button type="button" onClick={() => navigate('/restaurants')} className="filter-chip">
              Delivery Time <ChevronDown size={14} className="chip-icon-right" />
            </button>
            <button type="button" onClick={() => navigate('/restaurants')} className="filter-chip">
              Cost For Two <ChevronDown size={14} className="chip-icon-right" />
            </button>
          </div>

          {loadingRestaurants ? (
            <p style={{ textAlign: 'center', color: '#718096', padding: '40px', fontWeight: 650 }}>Loading canteens...</p>
          ) : restaurants.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#718096', padding: '40px', fontWeight: 650 }}>No canteens available on campus right now.</p>
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
        </div>
      </section>

      {/* 5. Trust/Features Badges */}
      <section className="features-section">
        <div className="section-container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon-circle">
                <Clock size={28} color="#b31522" />
              </div>
              <h4 className="feature-item-title">Super Fast Delivery</h4>
              <p className="feature-item-desc">Get your hot food in less than 20 minutes right to your doorstep.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon-circle">
                <Heart size={28} color="#b31522" />
              </div>
              <h4 className="feature-item-title">Quality Canteens</h4>
              <p className="feature-item-desc">Only certified, clean, and top-rated campus canteens and partners.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon-circle">
                <Award size={28} color="#b31522" />
              </div>
              <h4 className="feature-item-title">Exclusive Deals</h4>
              <p className="feature-item-desc">Pocket-friendly student combos, flat discounts, and midnight specials.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="landing-footer" id="help">
        <div className="footer-content-container">
          <div className="footer-main-grid">
            <div className="footer-brand-column">
              <div className="footer-logo">
                <div className="logo-icon icon-white">
                  <Flame size={20} color="#ffffff" />
                </div>
                <span className="brand-name font-white">
                  CAMPUS<span className="brand-name-sub">IN</span>
                </span>
              </div>
              <p className="footer-brand-desc">
                Simplifying on-campus food ordering and delivery. Made by students, for students.
              </p>
              <p className="footer-copyright">
                &copy; {new Date().getFullYear()} CampusIn. All rights reserved.
              </p>
            </div>

            <div className="footer-links-column">
              <h5 className="footer-links-title">Company</h5>
              <Link to="/restaurants" className="footer-link-item">About Us</Link>
              <Link to="/restaurants" className="footer-link-item">Careers</Link>
              <Link to="/restaurants" className="footer-link-item">Team</Link>
            </div>

            <div className="footer-links-column">
              <h5 className="footer-links-title">Contact Us</h5>
              <a href="#help" className="footer-link-item">Help & Support</a>
              <Link to="/register" className="footer-link-item">Partner with us</Link>
              <Link to="/restaurants" className="footer-link-item">Ride with us</Link>
            </div>

            <div className="footer-links-column">
              <h5 className="footer-links-title">Available Near</h5>
              <span className="footer-link-static">Main Campus Hostel Block</span>
              <span className="footer-link-static">Engineering Canteens</span>
              <span className="footer-link-static">Medical College Hostel</span>
              <span className="footer-link-static">Post Graduate PG Wing</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Local Styles for Landing Page Redesign */}
      <style>{`
        /* Colors & Styles Root */
        .landing-page-container {
          background-color: #ffffff;
          color: #1a1a1a;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Outfit', sans-serif;
        }

        /* 1. Header Styles */
        .landing-header {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 100;
          background: transparent;
          padding: 20px 40px;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .logo-icon {
          background: #ffffff;
          border-radius: 12px;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }

        .logo-flame-animation {
          animation: pulseSoft 2s infinite;
        }

        .brand-name {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .brand-name-sub {
          color: #ffc700;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-link-item {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: color 0.2s ease;
        }

        .nav-link-item:hover {
          color: #ffffff;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-signin-nav {
          background: #ffffff;
          color: #b31522;
          padding: 10px 24px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .btn-signin-nav:hover {
          background: #f7fafc;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }

        .btn-register-nav {
          background: transparent;
          color: #ffffff;
          border: 2px solid #ffffff;
          padding: 8px 24px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .btn-register-nav:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }

        /* 2. Hero Section */
        .hero-section {
          background: linear-gradient(135deg, #b31522 0%, #800e16 50%, #61070d 100%);
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 140px 24px 80px 24px;
          overflow: hidden;
        }

        /* Floating Food items */
        .floating-food {
          position: absolute;
          z-index: 10;
          pointer-events: none;
        }

        .food-left {
          left: 5%;
          top: 30%;
        }

        .food-right {
          right: 5%;
          bottom: 15%;
        }

        .floating-image {
          width: 220px;
          height: 220px;
          object-fit: cover;
          border-radius: 50%;
          border: 6px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          animation: float 6s ease-in-out infinite;
        }

        .food-right .floating-image {
          animation-delay: 2.5s;
          width: 240px;
          height: 240px;
        }

        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

        .hero-content-wrapper {
          max-width: 800px;
          text-align: center;
          z-index: 20;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.15;
          color: #ffffff;
          margin-bottom: 20px;
          letter-spacing: -1px;
        }

        .highlight-yellow {
          color: #ffc700;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        /* Search Widget Form */
        .hero-search-form {
          background: #ffffff;
          padding: 8px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
          max-width: 820px;
          margin: 0 auto;
        }

        .search-field-location {
          display: flex;
          align-items: center;
          padding: 0 20px;
          flex: 1.1;
          position: relative;
        }

        .field-icon {
          margin-right: 12px;
          flex-shrink: 0;
        }

        .location-select-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1a1a1a;
          cursor: pointer;
          appearance: none;
          padding-right: 24px;
        }

        .dropdown-arrow-icon {
          position: absolute;
          right: 20px;
          pointer-events: none;
        }

        .search-field-divider {
          width: 1.5px;
          height: 30px;
          background-color: #e2e8f0;
        }

        .search-field-query {
          display: flex;
          align-items: center;
          padding: 0 20px;
          flex: 1.8;
        }

        .query-text-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 500;
          color: #1a1a1a;
        }

        .query-text-input::placeholder {
          color: #a0aec0;
        }

        .search-submit-btn {
          background: #111111;
          color: #ffffff;
          border: none;
          padding: 16px 36px;
          border-radius: 50px;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .search-submit-btn:hover {
          background: #b31522;
        }

        /* 3. Promo Cards Section */
        .services-section {
          padding: 80px 24px;
          background-color: #ffffff;
        }

        .section-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }

        .service-card {
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          border: 1px solid #f0f0f0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .service-card:hover {
          border-color: rgba(179, 21, 34, 0.15);
          box-shadow: 0 20px 40px rgba(179, 21, 34, 0.08);
        }

        .service-card-image-wrapper {
          height: 200px;
          overflow: hidden;
          position: relative;
        }

        .service-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .service-card:hover .service-card-image {
          transform: scale(1.06);
        }

        .service-card-info {
          padding: 28px 24px 76px 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .promo-badge {
          display: inline-block;
          align-self: flex-start;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 5px 12px;
          border-radius: 50px;
          margin-bottom: 14px;
          letter-spacing: 0.5px;
        }

        .badge-red {
          background: #fff5f5;
          color: #b31522;
        }

        .badge-yellow {
          background: #fffdf0;
          color: #b37400;
        }

        .badge-green {
          background: #f0fdf4;
          color: #15803d;
        }

        .service-card-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #111111;
          margin-bottom: 8px;
        }

        .service-card-desc {
          font-size: 0.95rem;
          color: #718096;
          line-height: 1.5;
        }

        .service-card-arrow-btn {
          position: absolute;
          bottom: 24px;
          left: 24px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #b31522;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(179, 21, 34, 0.3);
          transition: all 0.25s ease;
        }

        .service-card:hover .service-card-arrow-btn {
          background: #111111;
          transform: translateX(4px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }

        /* 4. Restaurants Section */
        .restaurants-explore-section {
          padding: 60px 24px 80px 24px;
          background: #ffffff;
          border-top: 1px solid #f3f3f3;
        }

        .explore-section-title {
          font-size: 1.65rem;
          font-weight: 800;
          color: #282c3f;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }

        /* Filter Chips styling */
        .filter-chips-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }

        .filter-chip {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 550;
          color: #4a5568;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .filter-chip:hover {
          border-color: #cbd5e0;
          background: #f7fafc;
        }

        .chip-icon-right {
          margin-left: 2px;
          color: #718096;
        }

        .new-badge-tag {
          font-size: 0.65rem;
          font-weight: 800;
          background: #ff5200;
          color: #ffffff;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 4px;
          letter-spacing: 0.5px;
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

        /* 5. Features Section */
        .features-section {
          padding: 60px 24px;
          background-color: #fcfcfc;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }

        .feature-item {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px;
        }

        .feature-icon-circle {
          width: 70px;
          height: 70px;
          background: #fff5f5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(179, 21, 34, 0.05);
        }

        .feature-item-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #111111;
          margin-bottom: 8px;
        }

        .feature-item-desc {
          font-size: 0.9rem;
          color: #718096;
          line-height: 1.5;
          max-width: 280px;
        }

        /* 6. Footer Styles */
        .landing-footer {
          background-color: #111111;
          color: #a0aec0;
          padding: 80px 24px 60px 24px;
        }

        .footer-content-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.2fr;
          gap: 50px;
        }

        .footer-brand-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icon-white {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .font-white {
          color: #ffffff;
        }

        .footer-brand-desc {
          font-size: 0.9rem;
          line-height: 1.6;
          max-width: 280px;
        }

        .footer-copyright {
          font-size: 0.8rem;
          color: #718096;
          margin-top: 12px;
        }

        .footer-links-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-links-title {
          font-size: 1rem;
          font-weight: 750;
          color: #ffffff;
          margin-bottom: 8px;
          letter-spacing: 0.2px;
        }

        .footer-link-item {
          color: #a0aec0;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .footer-link-item:hover {
          color: #ffffff;
        }

        .footer-link-static {
          font-size: 0.9rem;
          font-weight: 500;
          color: #718096;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .services-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
          .swiggy-restaurants-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
          .features-grid {
            gap: 20px;
          }
          .food-left .floating-image,
          .food-right .floating-image {
            width: 160px;
            height: 160px;
          }
        }

        @media (max-width: 768px) {
          .hide-mobile {
            display: none !important;
          }

          .landing-header {
            padding: 16px 20px;
          }

          .brand-name {
            font-size: 1.35rem;
          }

          .hero-section {
            padding: 120px 20px 60px 20px;
            min-height: auto;
          }

          .hero-title {
            font-size: 2.25rem;
          }

          .hero-subtitle {
            font-size: 1.05rem;
            margin-bottom: 30px;
          }

          /* Search Widget Form Mobile Styling */
          .hero-search-form {
            flex-direction: column;
            border-radius: 20px;
            padding: 16px;
            gap: 14px;
          }

          .search-field-location,
          .search-field-query {
            padding: 0;
            width: 100%;
          }

          .search-field-divider {
            width: 100%;
            height: 1px;
            background-color: #e2e8f0;
          }

          .search-submit-btn {
            width: 100%;
            padding: 14px;
            border-radius: 12px;
          }

          .services-section {
            padding: 50px 20px;
          }

          .services-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .swiggy-restaurants-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          .features-section {
            padding: 40px 20px;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .footer-main-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }

        @media (max-width: 480px) {
          .swiggy-restaurants-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}
