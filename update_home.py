import re

with open("src/pages/Home.jsx", "r") as f:
    content = f.read()

# We want to replace everything inside the return ( ... );
# We'll locate "return (" and the final ");" before the closing brace of the component.
# Actually, the file ends with:
#   return (
#     <div className="landing-page-container">
#       ...
#     </div>
#   );
# }

new_jsx_and_style = r'''
    <div className="landing-page-container">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <Link to="/" className="brand-logo">
            <div className="logo-icon">
              <span style={{color: '#4A35E8', fontWeight: 'bold', fontSize: '1.2rem'}}>C</span>
            </div>
            <span className="brand-name">
              Campus<span className="brand-name-sub">In</span>
            </span>
          </Link>
          <div className="header-menu">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B192C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroSectionRef} className="hero-section">
        <div className="hero-bg-shapes">
          <div className="bg-circle-1"></div>
          <div className="bg-dots-1"></div>
          <div className="bg-dots-2"></div>
          <svg className="bg-line-1" viewBox="0 0 100 100"><path d="M0 100 C 20 0 50 0 100 100" stroke="#20C7C9" strokeWidth="1" fill="none" strokeDasharray="5,5"/></svg>
        </div>
        
        <img src="/burger.avif" alt="Burger" className="hero-floating hero-burger" />
        <img src="/momo.avif" alt="Momo" className="hero-floating hero-momo" />
        <span className="hero-floating hero-tomato">🍅</span>

        <div ref={heroContentRef} className="hero-content-wrapper">
          <h1 className="hero-title animate-slide-up">
            <span className="text-dark">Cravings called.</span> <br />
            <span className="text-indigo">We answered.</span><br />
            <span className="text-dark">Craving It?</span><br />
            <span className="text-dark">Campus<span className="text-cyan">In</span> It!</span>
          </h1>
          <p className="hero-subtitle animate-slide-up delay-1">
            Your campus favourites, <br/>delivered hot and fresh to your hostel.
          </p>

          <div className="hero-actions animate-slide-up delay-2">
            <Link to="/login" className="btn-primary">
              Sign In <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
            <Link to="/register" className="btn-secondary">
              Register <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Promo/Service Cards Section */}
      <section ref={promoSectionRef} className={`promo-section ${promoSectionVisible ? 'active' : ''}`}>
        <div ref={promoContentRef} className="section-container promo-content-wrapper">
          <h2 className="section-heading">
            Better campus food,<br/>
            <span className="text-indigo">closer to you.</span>
          </h2>
          <p className="section-subtext">
            From canteen favourites to late-night cravings, Campus<span className="text-cyan">In</span> brings the best food around your campus straight to your hostel.
          </p>

          <div className="promo-cards-container">
            <div className="promo-stat-card">
              <div className="stat-icon-wrapper text-indigo bg-indigo-light">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">One Campus</span>
                <span className="stat-label">all your favourites</span>
              </div>
            </div>

            <div className="promo-stat-card">
              <div className="stat-icon-wrapper text-indigo bg-indigo-light">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">Quick delivery</span>
                <span className="stat-label">straight to your hostel</span>
              </div>
              <img src="/pizza.avif" alt="Pizza slice" className="promo-side-img" />
            </div>

            <div className="promo-stat-card">
              <div className="stat-icon-wrapper text-indigo bg-indigo-light">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">Zero hassle</span>
                <span className="stat-label">just CampusIn it</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Features Grid Section */}
      <section className="app-features-section">
        <div className="section-container app-features-wrapper">
          <h2 className="section-heading text-dark">
            More than food.<br/>
            <span className="text-indigo">It's campus life,<br/>simplified.</span>
          </h2>
          <p className="section-subtext">
            From hostel cravings to college essentials, Campus<span className="text-cyan">In</span> brings everything students need into one place.
          </p>

          <div className="features-icon-grid">
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4A35E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"></path><path d="M7 21h10"></path><path d="M10 6.5a1.5 1.5 0 0 0 3-1.5 1.5 1.5 0 0 1 3-1.5"></path><path d="M14 6.5a1.5 1.5 0 0 0-3-1.5 1.5 1.5 0 0 1-3-1.5"></path></svg>
              </div>
              <span className="card-label">Campus Food</span>
            </div>
            
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#20C7C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10Z"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"></path><path d="M8 10h8"></path><path d="M8 14h8"></path></svg>
              </div>
              <span className="card-label">College<br/>Essentials</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF5A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              </div>
              <span className="card-label">Campus Resale</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2498E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path></svg>
              </div>
              <span className="card-label">Top Picks</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <Percent size={32} color="#FBB03B" />
              </div>
              <span className="card-label">Student Deals</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <Search size={32} color="#2498E8" />
              </div>
              <span className="card-label">Quick Search</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <Gift size={32} color="#D53F8C" />
              </div>
              <span className="card-label">Special Gifts</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <CreditCard size={32} color="#4A35E8" />
              </div>
              <span className="card-label">Easy Payments</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <HomeIcon size={32} color="#20C7C9" />
              </div>
              <span className="card-label">Hostel Delivery</span>
            </div>
          </div>

          <h3 className="and-more-text">
            <span className="text-dark">One campus.</span> <span className="text-indigo">One app.</span> <span className="text-cyan">A lot more.</span>
          </h3>
        </div>
      </section>

      {/* Footer */}
      <footer className="zomato-footer" id="help">
        <div className="zomato-footer-container">
          <div className="zomato-footer-top-row">
            <div className="brand-logo" style={{ cursor: 'default' }}>
              <div className="logo-icon icon-white" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: 'none' }}>
                <span style={{color: '#ffffff', fontWeight: 'bold'}}>C</span>
              </div>
              <span className="brand-name" style={{ color: '#ffffff' }}>
                Campus<span className="brand-name-sub" style={{ color: '#20C7C9' }}>In</span>
              </span>
            </div>
          </div>
          <div className="zomato-footer-grid">
            <div className="zomato-footer-col">
              <h6 className="zomato-footer-title">About CampusIn</h6>
              <nav className="zomato-footer-links">
                <Link to="/restaurants">Who We Are</Link>
                <Link to="/restaurants">Blog</Link>
                <Link to="/restaurants">Contact Us</Link>
              </nav>
            </div>
            <div className="zomato-footer-col">
              <div className="zomato-footer-subcol">
                <h6 className="zomato-footer-title">For Restaurants</h6>
                <nav className="zomato-footer-links">
                  <Link to="/vendor/register">Partner With Us</Link>
                  <Link to="/vendor/login">Vendor Login</Link>
                </nav>
              </div>
            </div>
            <div className="zomato-footer-col">
              <h6 className="zomato-footer-title">Learn More</h6>
              <nav className="zomato-footer-links">
                <Link to="/privacy-policy">Privacy</Link>
                <Link to="/terms-and-conditions">Terms & Conditions</Link>
                <Link to="/refund-policy">Refund Policies</Link>
              </nav>
            </div>
            <div className="zomato-footer-col">
              <h6 className="zomato-footer-title">Social Links</h6>
              <div className="zomato-social-icons">
                <a href="#" className="zomato-social-icon-btn" aria-label="Instagram">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="zomato-footer-divider"></div>
          <p className="zomato-footer-copyright">
            &copy; {new Date().getFullYear()} CampusIn Ltd. All rights reserved.
          </p>
        </div>
      </footer>

      <style>{`
        /* Colors & Styles Root */
        :root {
            --white: #FFFDF8;
            --indigo: #4A35E8;
            --cyan: #20C7C9;
            --azure: #2498E8;
            --coral: #FF5A3D;
            --dark: #0B192C;
            --text-gray: #4A5568;
            --bg-light: #F7FAFC;
        }

        html, body {
          max-width: 100% !important;
          overflow-x: clip !important;
          background-color: var(--white);
        }

        .landing-page-container {
          background-color: var(--white);
          color: var(--dark);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Outfit', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Typography helpers */
        .text-dark { color: var(--dark); }
        .text-indigo { color: var(--indigo); }
        .text-cyan { color: var(--cyan); }
        .text-coral { color: var(--coral); }
        .bg-indigo-light { background-color: rgba(74, 53, 232, 0.08); }

        /* 1. Header Styles */
        .landing-header {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 100;
          background: transparent;
          padding: 24px 30px;
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
          gap: 12px;
          text-decoration: none;
        }

        .logo-icon {
          background: #ffffff;
          border-radius: 12px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
        }

        .brand-name {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--dark);
          letter-spacing: -0.5px;
        }

        .brand-name-sub {
          color: var(--cyan);
        }

        .header-menu {
          cursor: pointer;
        }

        /* 2. Hero Section */
        .hero-section {
          position: relative;
          min-height: 90vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 160px 24px 60px 24px;
          overflow: hidden;
          box-sizing: border-box;
        }

        /* Hero Background Shapes */
        .hero-bg-shapes {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          z-index: 0;
          pointer-events: none;
        }
        .bg-circle-1 {
          position: absolute;
          width: 400px;
          height: 400px;
          background: rgba(74, 53, 232, 0.03);
          border-radius: 50%;
          bottom: -100px;
          left: -100px;
        }
        .bg-dots-1, .bg-dots-2 {
          position: absolute;
          width: 80px; height: 80px;
          background-image: radial-gradient(var(--azure) 15%, transparent 15%);
          background-size: 16px 16px;
          opacity: 0.2;
        }
        .bg-dots-1 { top: 20%; left: 10%; }
        .bg-dots-2 { bottom: 30%; right: 10%; }
        .bg-line-1 {
          position: absolute;
          bottom: 10%; right: 20%;
          width: 200px; height: 200px;
          opacity: 0.5;
        }

        .hero-content-wrapper {
          position: relative;
          max-width: 900px;
          text-align: center;
          z-index: 20;
        }

        .hero-title {
          font-size: 4.2rem;
          font-weight: 900;
          line-height: 1.15;
          margin-bottom: 24px;
          letter-spacing: -1px;
        }

        .hero-subtitle {
          font-size: 1.2rem;
          color: var(--text-gray);
          margin-bottom: 40px;
          max-width: 450px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        /* Hero Floating Images */
        .hero-floating {
          position: absolute;
          z-index: 5;
          pointer-events: none;
          filter: drop-shadow(0 15px 25px rgba(0,0,0,0.1));
        }
        .hero-burger {
          bottom: 5%; left: 5%;
          width: 180px;
          transform: rotate(-10deg);
        }
        .hero-momo {
          bottom: 5%; right: 5%;
          width: 160px;
          transform: rotate(15deg);
        }
        .hero-tomato {
          bottom: -2%; left: 50%;
          font-size: 3rem;
          transform: translateX(-50%);
        }

        /* Hero Actions Styling */
        .hero-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .btn-primary {
          background: var(--indigo);
          color: #ffffff;
          padding: 16px 36px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 1.05rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
          box-shadow: 0 10px 25px rgba(74, 53, 232, 0.3);
        }

        .btn-primary:hover {
          background: #3925B3;
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(74, 53, 232, 0.4);
        }

        .btn-secondary {
          background: #ffffff;
          color: var(--indigo);
          border: 1.5px solid var(--indigo);
          padding: 15px 36px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 1.05rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: transform 0.25s ease, background 0.25s ease;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }

        .btn-secondary:hover {
          background: var(--bg-light);
          transform: translateY(-3px);
        }

        /* 3. Promo Section */
        .promo-section {
          padding: 80px 24px;
          position: relative;
          z-index: 10;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .promo-content-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 600px !important;
        }

        .section-heading {
          font-size: 2.8rem;
          font-weight: 800;
          color: var(--dark);
          margin-bottom: 20px;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .section-subtext {
          font-size: 1.1rem;
          color: var(--text-gray);
          max-width: 480px;
          line-height: 1.6;
          margin-bottom: 50px;
        }

        .promo-cards-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          max-width: 420px;
        }

        .promo-stat-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 24px 30px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          gap: 20px;
          border: 1px solid rgba(0,0,0,0.02);
          position: relative;
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease;
        }

        .promo-stat-card:hover {
          box-shadow: 0 20px 50px rgba(74, 53, 232, 0.08);
          transform: translateY(-5px);
        }

        .stat-icon-wrapper {
          border-radius: 16px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .stat-number {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--dark);
          line-height: 1.3;
        }

        .stat-label {
          font-size: 0.95rem;
          color: var(--text-gray);
          font-weight: 500;
        }

        .promo-side-img {
          position: absolute;
          right: -40px;
          bottom: -20px;
          width: 110px;
          pointer-events: none;
          filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));
        }


        /* 4. App Features Section */
        .app-features-section {
          padding: 80px 24px 120px;
          position: relative;
          z-index: 12;
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
          max-width: 600px !important;
        }

        /* 3x3 Feature Icons Grid */
        .features-icon-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          width: 100%;
          padding: 0 10px;
          box-sizing: border-box;
          margin-bottom: 50px;
          justify-items: center;
        }

        .feature-icon-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .card-icon-container {
          width: 90px;
          height: 90px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .feature-icon-card:hover .card-icon-container {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(74, 53, 232, 0.1);
        }

        .card-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--dark);
          line-height: 1.2;
          text-align: center;
        }

        .and-more-text {
          font-size: 1.6rem;
          font-weight: 800;
          margin-top: 20px;
        }

        /* Footer override */
        .zomato-footer {
          background-color: var(--dark);
          color: #a0aec0;
          padding: 60px 24px;
        }
        .zomato-footer-title { color: var(--white); }
        .zomato-footer-links a:hover { color: var(--cyan); }
        .zomato-social-icon-btn { color: var(--dark); }

        /* Mobile Breakpoints */
        @media (max-width: 768px) {
          .hero-section { padding: 140px 20px 40px; }
          .hero-title { font-size: 3.2rem; }
          .hero-subtitle { font-size: 1.1rem; }
          .hero-actions { flex-direction: column; width: 100%; max-width: 300px; margin: 0 auto; }
          .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
          
          .hero-burger { width: 110px; left: -20px; top: 10%; }
          .hero-momo { width: 100px; right: -10px; top: 5%; }
          
          .section-heading { font-size: 2.4rem; }
          .features-icon-grid { gap: 16px; }
          .card-icon-container { width: 80px; height: 80px; }
          .card-label { font-size: 0.85rem; }
          
          .promo-side-img { width: 80px; right: -10px; }
        }
      `}</style>
    </div>
'''

new_content = re.sub(
    r'<div className="landing-page-container">.*</div>', 
    new_jsx_and_style, 
    content, 
    flags=re.DOTALL
)

with open("src/pages/Home.jsx", "w") as f:
    f.write(new_content)

print("Updated Home.jsx")
