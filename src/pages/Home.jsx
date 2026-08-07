import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef } from 'react';

import { Flame, ChefHat, Percent, Gift, CreditCard, Search, BookOpen, ShoppingBag, Wand2, Home as HomeIcon } from 'lucide-react';

import BlueprintGrid from '../components/BlueprintGrid';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Scroll triggered promo section visibility
  const [promoSectionVisible, setPromoSectionVisible] = useState(false);
  const promoSectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setPromoSectionVisible(entry.isIntersecting);
      },
      {
        threshold: 0.55,
        rootMargin: '0px 0px -5% 0px',
      }
    );

    const currentRef = promoSectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const heroSectionRef = useRef(null);
  const heroContentRef = useRef(null);
  const promoContentRef = useRef(null);

  // Scroll listener to fade out Hero content and Promo content dynamically based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const heroEl = heroSectionRef.current;
      const heroContentEl = heroContentRef.current;
      const promoEl = promoSectionRef.current;
      const promoContentEl = promoContentRef.current;

      // 1. Fade out Hero section content as user scrolls down
      if (heroEl && heroContentEl) {
        const heroOpacity = Math.max(0, 1 - scrollY / 350);
        heroContentEl.style.opacity = heroOpacity;
      }

      // 2. Fade out Promo section content as it scrolls off the top of the viewport
      if (promoEl && promoContentEl) {
        const threshold = promoEl.offsetTop;

        if (threshold && scrollY > threshold) {
          const diff = scrollY - threshold;
          const opacity = Math.max(0, 1 - diff / 350);

          promoContentEl.style.opacity = opacity;

          const floatingAssets = promoEl.querySelectorAll('.floating-asset, .deco-item');
          floatingAssets.forEach(asset => {
            asset.style.opacity = opacity;
          });
        } else {
          promoContentEl.style.opacity = 1;
          const floatingAssets = promoEl.querySelectorAll('.floating-asset, .deco-item');
          floatingAssets.forEach(asset => {
            asset.style.opacity = 1;
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);



  // Redirect if already logged in to provide a smooth experience
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'vendor') {
        navigate('/vendor', { replace: true });
      } else if (user.role === 'delivery_partner') {
        navigate('/delivery/dashboard', { replace: true });
      } else {
        navigate('/restaurants', { replace: true });
      }
    }
  }, [user, navigate]);



  if (user) return null;

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
              Campus<span className="brand-name-sub">In</span>
            </span>
          </Link>




        </div>
      </header>

      {/* 2. Hero Section (Red Background with Floating Food and Search Box) */}
      <section ref={heroSectionRef} className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
        <BlueprintGrid />

        <div ref={heroContentRef} className="hero-content-wrapper">
          <h1 className="hero-title animate-slide-up">
            Cravings called. <br></br>We answered.<br />
            Craving It?<br />
            <span style={{ whiteSpace: 'nowrap' }}><span className="highlight-yellow">CampusIn</span> It!</span>
          </h1>
          <p className="hero-subtitle animate-slide-up delay-1">
            Your campus favourites, delivered hot and fresh to your hostel.          </p>

          {/* Hero Actions */}
          <div className="hero-actions animate-slide-up delay-2">
            <Link to="/login" className="btn-signin-hero">Sign In</Link>
            <Link to="/register" className="btn-register-hero">Register</Link>
          </div>
        </div>
      </section>

      {/* 3. Promo/Service Cards Section (Replaced with Scroll-Triggered Zomato-style Food Section) */}
      <section
        ref={promoSectionRef}
        className={`zomato-promo-section ${promoSectionVisible ? 'active' : ''}`}
      >
        {/* Floating animated food items */}
        <img src="/burger.avif" alt="Burger" className="floating-asset floating-burger" />
        <img src="/momo.avif" alt="Momo" className="floating-asset floating-momo" />
        <img src="/pizza.avif" alt="Pizza" className="floating-asset floating-pizza" />

        {/* Decorative items */}
        <span className="deco-item deco-leaf">🍃</span>
        <span className="deco-item deco-tomato">🍅</span>
        <span className="deco-item deco-leaf-2">🌿</span>

        <div ref={promoContentRef} className="section-container promo-content-wrapper">
          <h2 className="promo-heading">Better campus food, closer to you.</h2>
          <p className="promo-subtext">
            From canteen favourites to late-night cravings, CampusIn brings the best food around your campus straight to your hostel.
          </p>

          <div className="promo-cards-container">
            {/* Card 1: Restaurants */}
            <div className="promo-stat-card card-left">
              <div className="stat-info">
                <span className="stat-number">One Campus</span>
                <span className="stat-label">all your favourites</span>
              </div>
              <div className="stat-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b31522" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
            </div>

            {/* Card 2: Cities */}
            <div className="promo-stat-card card-right">
              <div className="stat-info">
                <span className="stat-number">Quick delivery</span>
                <span className="stat-label">straight to your hostel</span>
              </div>
              <div className="stat-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b31522" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
            </div>

            {/* Card 3: Orders Delivered */}
            <div className="promo-stat-card card-left-2">
              <div className="stat-info">
                <span className="stat-number">Zero hassle</span>
                <span className="stat-label">just CampusIn it</span>
              </div>
              <div className="stat-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b31522" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. App Features Section ("More than food. It's campus life, simplified.") */}
      <section className="app-features-section">
        <div className="section-container app-features-wrapper">
          <h2 className="features-heading">More than food. It’s campus life, simplified.</h2>
          <p className="features-subtext">
            From hostel cravings to college essentials, CampusIn brings everything students need into one place.
          </p>

          <div className="features-icon-grid">
            {/* Card 1: Campus Food */}
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <ChefHat size={32} className="feature-icon-svg red-tint" />
              </div>
              <span className="card-label">Campus Food</span>
            </div>

            {/* Card 2: College Essentials */}
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <BookOpen size={32} className="feature-icon-svg orange-tint" />
              </div>
              <span className="card-label">College Essentials</span>
            </div>

            {/* Card 3: Campus Resale */}
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <ShoppingBag size={32} className="feature-icon-svg blue-tint" />
              </div>
              <span className="card-label">Campus Resale</span>
            </div>

            {/* Card 4: Smart Recommendations */}
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <Wand2 size={32} className="feature-icon-svg green-tint-2" />
              </div>
              <span className="card-label">Smart Recommendations</span>
            </div>

            {/* Card 5: Student Deals */}
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <Percent size={32} className="feature-icon-svg yellow-tint" />
              </div>
              <span className="card-label">Student Deals</span>
            </div>

            {/* Card 6: Quick Search */}
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <Search size={32} className="feature-icon-svg blue-tint-2" />
              </div>
              <span className="card-label">Quick Search</span>
            </div>

            {/* Card 7: Special Gifts */}
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <Gift size={32} className="feature-icon-svg pink-tint" />
              </div>
              <span className="card-label">Special Gifts</span>
            </div>

            {/* Card 8: Easy Payments */}
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <CreditCard size={32} className="feature-icon-svg purple-tint" />
              </div>
              <span className="card-label">Easy Payments</span>
            </div>

            {/* Card 9: Hostel Delivery */}
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <HomeIcon size={32} className="feature-icon-svg red-tint" />
              </div>
              <span className="card-label">Hostel Delivery</span>
            </div>
          </div>

          <h3 className="and-more-text">One campus. One app. A lot more.</h3>
        </div>
      </section>



      {/* 6. Zomato-style Footer */}
      <footer className="zomato-footer" id="help">
        <div className="zomato-footer-container">
          {/* Top Row: Logo */}
          <div className="zomato-footer-top-row">
            <div className="brand-logo" style={{ cursor: 'default' }}>
              <div className="logo-icon icon-white" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: 'none' }}>
                <Flame size={20} color="#ffffff" />
              </div>
              <span className="brand-name" style={{ color: '#ffffff' }}>
                Campus<span className="brand-name-sub" style={{ color: '#ffc700' }}>In</span>
              </span>
            </div>
          </div>

          {/* Links Grid */}
          <div className="zomato-footer-grid">
            {/* Column 1: About CampusIn */}
            <div className="zomato-footer-col">
              <h6 className="zomato-footer-title">About CampusIn</h6>
              <nav className="zomato-footer-links">
                <Link to="/restaurants">Who We Are</Link>
                <Link to="/restaurants">Blog</Link>
                <Link to="/restaurants">Contact Us</Link>
              </nav>
            </div>

            {/* Column 2: For Restaurants, Delivery Partners & Admins */}
            <div className="zomato-footer-col">
              <div className="zomato-footer-subcol">
                <h6 className="zomato-footer-title">For Restaurants</h6>
                <nav className="zomato-footer-links">
                  <Link to="/vendor/register">Partner With Us</Link>
                  <Link to="/vendor/login">Vendor Login</Link>
                </nav>
              </div>
              <div className="zomato-footer-subcol" style={{ marginTop: '24px' }}>
                <h6 className="zomato-footer-title">For Delivery Partners</h6>
                <nav className="zomato-footer-links">
                  <Link to="/delivery/register">Partner With Us</Link>
                  <Link to="/delivery/login">Delivery Portal</Link>
                </nav>
              </div>
              <div className="zomato-footer-subcol" style={{ marginTop: '24px' }}>
                <h6 className="zomato-footer-title">For Admins</h6>
                <nav className="zomato-footer-links">
                  <Link to="/admin/login">Admin Portal</Link>
                </nav>
              </div>
            </div>

            {/* Column 3: Learn More */}
            <div className="zomato-footer-col">
              <h6 className="zomato-footer-title">Learn More</h6>
              <nav className="zomato-footer-links">
                <Link to="/privacy-policy">Privacy</Link>
                <Link to="/terms-and-conditions">Terms & Conditions</Link>
                <Link to="/refund-policy">Refund Policies</Link>
              </nav>
            </div>

            {/* Column 4: Social Links */}
            <div className="zomato-footer-col">
              <h6 className="zomato-footer-title">Social Links</h6>
              <div className="zomato-social-icons">
                <a href="https://www.instagram.com/campusin.nitj?igsh=MWYxcm81MjBvZzh3bw==" target="_blank" rel="noopener noreferrer" className="zomato-social-icon-btn" aria-label="Instagram">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="zomato-footer-divider"></div>

          <p className="zomato-footer-copyright">
            By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners. &copy; {new Date().getFullYear()} CampusIn Ltd. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Local Styles for Landing Page Redesign */}
      <style>{`
        /* Colors & Styles Root */
        html, body {
          max-width: 100% !important;
          overflow-x: clip !important;
        }

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
          height: auto;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: sticky;
          top: 0;
          z-index: 1;
          padding: 140px 24px 100px 24px;
          overflow: visible;
          box-sizing: border-box;
        }



        .hero-content-wrapper {
          max-width: 900px;
          text-align: center;
          z-index: 20;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.25;
          color: #ffffff;
          margin-bottom: 28px;
          letter-spacing: -0.5px;
        }

        .highlight-yellow {
          color: #ffc700;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 48px;
          max-width: 650px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.65;
        }

        /* Hero Actions Styling */
        .hero-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-top: 32px;
        }

        .btn-signin-hero {
          background: #ffffff;
          color: #b31522;
          padding: 16px 40px;
          border-radius: 50px;
          font-weight: 800;
          font-size: 1.1rem;
          text-decoration: none;
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .btn-signin-hero:hover {
          background: #f7fafc;
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
        }

        .btn-register-hero {
          background: transparent;
          color: #ffffff;
          border: 2px solid #ffffff;
          padding: 14px 40px;
          border-radius: 50px;
          font-weight: 800;
          font-size: 1.1rem;
          text-decoration: none;
          transition: transform 0.25s ease, background 0.25s ease;
        }

        .btn-register-hero:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-3px);
        }

        /* 3. Zomato-style Promo Section */
        .zomato-promo-section {
          padding: 100px 24px 60px 24px;
          background: radial-gradient(circle at 50% 50%, #fff 60%, #fffcfc 100%);
          position: relative;
          z-index: 10;
          border-top-left-radius: 40px;
          border-top-right-radius: 40px;
          border-top: 4px solid #ffffff;
          margin-top: -40px;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.03);
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: clip;
        }

        .promo-content-wrapper {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 600px !important;
        }

        .promo-heading {
          font-size: 2.2rem;
          font-weight: 800;
          color: #b31522;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
          line-height: 1.25;
        }

        .promo-subtext {
          font-size: 1.05rem;
          color: #4a5568;
          max-width: 480px;
          line-height: 1.6;
          margin-bottom: 40px;
        }

        /* Staggered stats cards styling */
        .promo-cards-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          max-width: 340px;
          margin-top: 10px;
        }

        .promo-stat-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 18px 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #f0f0f0;
          width: 90%;
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease;
        }

        .promo-stat-card:hover {
          box-shadow: 0 15px 35px rgba(179, 21, 34, 0.08);
          border-color: rgba(179, 21, 34, 0.1);
        }

        /* Staggered offsets matching Zomato's mobile page style */
        .promo-stat-card.card-left {
          align-self: flex-start;
          transform: translateX(-15px);
        }

        .promo-stat-card.card-right {
          align-self: flex-end;
          transform: translateX(15px);
        }

        .promo-stat-card.card-left-2 {
          align-self: flex-start;
          transform: translateX(-5px);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .stat-number {
          font-size: 1.4rem;
          font-weight: 800;
          color: #1f2937;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 500;
        }

        .stat-icon-wrapper {
          background: #fff5f5;
          border-radius: 14px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Floating Scroll-Triggered Food Assets */
        .floating-asset {
          position: absolute;
          z-index: 2;
          pointer-events: none;
          transition: transform 1.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.8s cubic-bezier(0.16, 1, 0.3, 1), visibility 1.8s;
          opacity: 0;
          visibility: hidden;
          filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.12));
        }

        /* Burger: left side */
        .floating-burger {
          left: 5%;
          top: 30%;
          width: 150px;
          height: 150px;
          object-fit: contain;
          transform: translate(-200px, 50px) rotate(-45deg);
        }

        /* Momo: top right */
        .floating-momo {
          right: 6%;
          top: 12%;
          width: 160px;
          height: 160px;
          object-fit: contain;
          transform: translate(200px, -100px) rotate(45deg);
        }

        /* Pizza: bottom right */
        .floating-pizza {
          right: 5%;
          bottom: 15%;
          width: 170px;
          height: 170px;
          object-fit: contain;
          transform: translate(250px, 150px) rotate(30deg);
        }

        /* Active sliding in states */
        .zomato-promo-section.active .floating-asset {
          visibility: visible;
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 1.2s;
        }

        .zomato-promo-section.active .floating-burger {
          opacity: 1;
          transform: translate(0, 0) rotate(-5deg);
        }

        .zomato-promo-section.active .floating-momo {
          opacity: 1;
          transform: translate(0, 0) rotate(5deg);
        }

        .zomato-promo-section.active .floating-pizza {
          opacity: 1;
          transform: translate(0, 0) rotate(-10deg);
        }

        .deco-item {
          position: absolute;
          font-size: 1.5rem;
          pointer-events: none;
          transition: transform 1.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.8s ease, visibility 1.8s;
          opacity: 0;
          visibility: hidden;
          z-index: 1;
        }

        .deco-leaf {
          left: 28%;
          top: 15%;
          transform: scale(0.5) translateY(-50px);
        }

        .deco-tomato {
          right: 32%;
          top: 45%;
          transform: scale(0.5) translateY(50px);
        }

        .deco-leaf-2 {
          left: 20%;
          bottom: 20%;
          transform: scale(0.5) rotate(-30deg) translateY(50px);
        }

        .zomato-promo-section.active .deco-item {
          opacity: 0.7;
          visibility: visible;
          transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 1s ease, visibility 1s;
        }

        .zomato-promo-section.active .deco-leaf {
          transform: scale(1) translateY(0);
        }

        .zomato-promo-section.active .deco-tomato {
          transform: scale(1) translateY(0);
        }

        .zomato-promo-section.active .deco-leaf-2 {
          transform: scale(1) rotate(0deg) translateY(0);
        }

        /* 4. App Features Section */
        .app-features-section {
          padding: 80px 24px;
          background: linear-gradient(180deg, #fff5f6 0%, #ffffff 100%);
          position: relative;
          z-index: 12;
          border-top-left-radius: 40px;
          border-top-right-radius: 40px;
          border-top: 4px solid #ffffff;
          margin-top: -40px;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .app-features-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 480px !important;
        }

        .features-heading {
          font-size: 2.2rem;
          font-weight: 800;
          color: #b31522;
          margin-bottom: 16px;
          line-height: 1.25;
          letter-spacing: -0.5px;
          padding: 0 20px;
        }

        .features-subtext {
          font-size: 1.05rem;
          color: #4a5568;
          line-height: 1.5;
          margin-bottom: 40px;
          padding: 0 30px;
        }

        /* 3x3 Feature Icons Grid */
        .features-icon-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
          padding: 0 10px;
          box-sizing: border-box;
          margin-bottom: 30px;
          justify-items: center;
        }

        .feature-icon-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .card-icon-container {
          width: 95px;
          height: 95px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
          border: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-icon-card:hover .card-icon-container {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(179, 21, 34, 0.08);
          border-color: rgba(179, 21, 34, 0.1);
        }

        .card-label {
          font-size: 0.85rem;
          font-weight: 650;
          color: #2d3748;
          line-height: 1.25;
          text-align: center;
          word-break: break-word;
        }

        /* Custom Toggle Switch for Veg Mode */
        .veg-toggle-active {
          width: 48px;
          height: 26px;
          background-color: #38a169;
          border-radius: 100px;
          position: relative;
          padding: 3px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .toggle-slider {
          width: 20px;
          height: 20px;
          background-color: #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Colorful lucide icons classes */
        .feature-icon-svg {
          transition: transform 0.3s ease;
        }

        .feature-icon-card:hover .feature-icon-svg {
          transform: scale(1.08);
        }

        .orange-tint { color: #dd6b20; }
        .blue-tint { color: #3182ce; }
        .green-tint-2 { color: #48bb78; }
        .yellow-tint { color: #d69e2e; }
        .red-tint { color: #e53e3e; }
        .purple-tint { color: #805ad5; }
        .blue-tint-2 { color: #2b6cb0; }
        .pink-tint { color: #d53f8c; }

        .and-more-text {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1f2937;
          margin-top: 10px;
          margin-bottom: 40px;
          letter-spacing: -0.3px;
        }

        /* Premium App Promo Banner */
        .app-promo-banner-container {
          background-color: #0c0f12;
          width: 100%;
          border-radius: 20px;
          padding: 16px 20px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .app-promo-logo-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .promo-logo-icon {
          background-color: #b31522;
          border-radius: 8px;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .promo-logo-text {
          font-size: 0.95rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .promo-banner-message {
          font-size: 0.95rem;
          color: #ffffff;
          font-weight: 500;
          text-align: center;
          line-height: 1.4;
        }

        .promo-banner-btn {
          width: 100%;
          background-color: #ffffff;
          color: #0c0f12;
          border: none;
          outline: none;
          padding: 12px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 750;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .promo-banner-btn:hover {
          background-color: #f7fafc;
          transform: scale(1.02);
        }

        /* Desktop Layout Overrides for App Features Section */
        @media (min-width: 769px) {
          .app-features-wrapper {
            max-width: 850px !important;
          }

          .features-heading {
            font-size: 2.5rem;
          }

          .features-icon-grid {
            grid-template-columns: repeat(9, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 40px;
          }

          .card-icon-container {
            width: 80px;
            height: 80px;
          }

          .app-promo-banner-container {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 20px 30px;
          }

          .promo-banner-message {
            text-align: left;
          }

          .promo-banner-btn {
            width: auto;
            padding: 12px 28px;
          }
        }



        /* Zomato-style Footer Styles */
        .zomato-footer {
          background-color: #0c0f12;
          color: #8f939e;
          padding: 60px 24px 40px 24px;
          font-family: inherit;
          position: relative;
          z-index: 10;
          border-top: 1px solid #1c1f25;
        }

        .zomato-footer-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .zomato-footer-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }


        .zomato-footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
          margin-bottom: 40px;
        }

        .zomato-footer-col {
          display: flex;
          flex-direction: column;
        }

        .zomato-footer-subcol {
          display: flex;
          flex-direction: column;
        }

        .zomato-footer-title {
          font-size: 0.9rem;
          font-weight: 750;
          color: #ffffff;
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .zomato-footer-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .zomato-footer-links a {
          color: #8f939e;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.15s ease;
        }

        .zomato-footer-links a:hover {
          color: #ffffff;
        }

        .zomato-social-icons {
          display: flex;
          gap: 10px;
          margin-bottom: 25px;
          align-items: center;
        }

        .zomato-social-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background-color: #ffffff;
          border-radius: 50%;
          text-decoration: none;
          transition: transform 0.2s ease;
        }

        .zomato-social-icon-btn:hover {
          transform: scale(1.1);
        }

        .zomato-store-badges {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 145px;
        }

        .zomato-store-badge {
          background-color: #0f1216;
          border: 1.5px solid #2d3748;
          border-radius: 8px;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          text-decoration: none;
          color: #ffffff;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .zomato-store-badge:hover {
          border-color: #4a5568;
          transform: translateY(-1px);
        }

        .store-badge-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .store-badge-sub {
          font-size: 0.5rem;
          color: #a0aec0;
          font-weight: 500;
          text-transform: uppercase;
        }

        .store-badge-main {
          font-size: 0.8rem;
          font-weight: 750;
        }

        .zomato-footer-divider {
          height: 1px;
          background-color: #242a35;
          margin-bottom: 25px;
        }

        .zomato-footer-copyright {
          font-size: 0.78rem;
          color: #5c6270;
          line-height: 1.6;
          font-weight: 500;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .zomato-footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
          }

          .zomato-store-badges {
            flex-direction: row;
            max-width: 100%;
            gap: 12px;
          }

          .zomato-store-badge {
            flex: 1;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .zomato-footer-grid {
            grid-template-columns: 1fr;
          }
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
            padding: 160px 24px 140px 24px;
            min-height: 85vh;
            height: auto;
          }

          .hero-spacer {
            height: 85vh;
          }

          .hero-title {
            font-size: 38px;
            line-height: 1.1;
            margin-bottom: 24px;
            letter-spacing: -0.5px;
          }

          .hero-subtitle {
            font-size: 17px;
            line-height: 1.5;
            margin-bottom: 36px;
            max-width: 320px;
            margin-left: auto;
            margin-right: auto;
          }

          /* Hero Actions Mobile Styling */
          .hero-actions {
            flex-direction: row;
            gap: 12px;
            width: 100%;
            max-width: 340px;
            margin: 32px auto 0;
          }

          .btn-signin-hero, .btn-register-hero {
            flex: 1;
            padding: 14px 10px;
            font-size: 1rem;
            text-align: center;
            box-sizing: border-box;
          }

          .zomato-promo-section {
            padding: 70px 20px;
          }

          .promo-heading {
            font-size: 1.8rem;
            padding: 0 60px;
            box-sizing: border-box;
          }

          .promo-subtext {
            font-size: 0.95rem;
            margin-bottom: 30px;
            padding: 0 65px;
            box-sizing: border-box;
          }

          /* Floating food assets in mobile version */
          .floating-burger {
            left: -15px;
            top: 18%;
            width: 95px;
            height: 95px;
          }

          .floating-momo {
            right: -10px;
            top: 6%;
            width: 105px;
            height: 105px;
          }

          .floating-pizza {
            right: -15px;
            bottom: 22%;
            width: 115px;
            height: 115px;
          }
          
          .deco-leaf {
            left: 15%;
            top: 4%;
            font-size: 0.95rem;
          }
          
          .deco-tomato {
            right: 20%;
            top: 38%;
            font-size: 0.95rem;
          }
          
          .deco-leaf-2 {
            display: none;
          }

          .promo-cards-container {
            max-width: 300px;
          }

          .promo-stat-card {
            padding: 14px 18px;
            border-radius: 16px;
          }

          .swiggy-restaurants-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
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
