import re

with open("src/pages/Home.jsx", "r") as f:
    content = f.read()

new_jsx_and_style = r'''
    <div className="landing-page-container">
      {/* Background Decorators */}
      <div className="bg-decor dots-top-left"></div>
      <div className="bg-decor dots-top-right"></div>
      <div className="bg-decor dots-mid-right"></div>
      <div className="bg-decor dots-bottom-left"></div>
      
      <div className="bg-decor cross cyan-cross top-right">+</div>
      <div className="bg-decor cross cyan-cross mid-left">+</div>
      <div className="bg-decor cross orange-cross mid-left-2">+</div>
      
      <div className="bg-decor circle orange-circle top-left"></div>
      <div className="bg-decor circle cyan-circle mid-right"></div>
      <div className="bg-decor circle cyan-circle bottom-left"></div>
      <div className="bg-decor circle orange-circle bottom-right"></div>
      
      {/* Dashed lines */}
      <svg className="bg-decor dashed-line-1" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0 100 Q 50 150 100 100 T 200 100" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" fill="none" />
      </svg>
      <svg className="bg-decor dashed-line-2" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0 50 Q 50 0 100 50 T 200 50" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" fill="none" />
      </svg>

      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <Link to="/" className="brand-logo">
            <div className="logo-icon-wrapper">
              <svg viewBox="0 0 100 100" width="36" height="36" className="colorful-logo">
                <rect width="100" height="100" rx="20" fill="white" />
                <path d="M 70 30 C 50 10 20 20 20 50 C 20 80 50 90 70 70" stroke="url(#grad1)" strokeWidth="15" strokeLinecap="round" fill="none" />
                <text x="45" y="65" fontSize="24" fontWeight="bold" fill="#20C7C9">In</text>
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4A35E8" />
                    <stop offset="50%" stopColor="#20C7C9" />
                    <stop offset="100%" stopColor="#06c169" />
                  </linearGradient>
                </defs>
              </svg>
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
        <div className="blob blob-purple"></div>
        <div className="blob blob-cyan"></div>
        
        <img src="/burger.avif" alt="Burger" className="hero-img hero-burger" />
        <img src="/momo.avif" alt="Momo" className="hero-img hero-momo" />
        <img src="/pizza.avif" alt="Pizza" className="hero-img hero-pizza" />
        
        <div className="tomato-img">🍅</div>

        <div ref={heroContentRef} className="hero-content-wrapper">
          <h1 className="hero-title animate-slide-up">
            <span className="text-dark">Cravings called.</span><br />
            <span className="text-indigo">We answered.</span><br />
            <span className="text-dark">Craving It?</span><br />
            <span className="text-indigo">Campus<span className="text-cyan">In</span> It!</span>
          </h1>
          <p className="hero-subtitle animate-slide-up delay-1">
            Your campus favourites,<br/>delivered hot and fresh to your hostel.
          </p>

          <div className="hero-actions animate-slide-up delay-2">
            <Link to="/login" className="btn-primary">
              Sign In <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
            <Link to="/register" className="btn-secondary">
              Register <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Promo/Service Cards Section */}
      <section ref={promoSectionRef} className={`promo-section ${promoSectionVisible ? 'active' : ''}`}>
        <div ref={promoContentRef} className="section-container promo-content-wrapper">
          <h2 className="section-heading">
            <span className="text-dark">Better campus food,</span><br/>
            <span className="text-indigo">closer to you.</span>
          </h2>
          <p className="section-subtext promo-subtext">
            From canteen favourites to late-night cravings, Campus<span className="text-cyan">In</span> brings the best food around your campus straight to your hostel.
          </p>

          <div className="promo-cards-container">
            <div className="promo-stat-card">
              <div className="stat-icon-wrapper text-indigo">
                <HomeIcon size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-number">One Campus</span>
                <span className="stat-label">all your favourites</span>
              </div>
            </div>

            <div className="promo-stat-card">
              <div className="stat-icon-wrapper text-indigo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">Quick delivery</span>
                <span className="stat-label">straight to your hostel</span>
              </div>
            </div>

            <div className="promo-stat-card">
              <div className="stat-icon-wrapper text-indigo">
                <ShoppingBag size={24} />
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
          <div className="title-underline"></div>
          
          <p className="section-subtext features-subtext">
            From hostel cravings to college essentials, Campus<span className="text-cyan">In</span> brings everything students need into one place.
          </p>

          <div className="features-icon-grid">
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <div className="icon-circle bg-indigo-light">
                  <ChefHat size={26} color="#4A35E8" />
                </div>
              </div>
              <span className="card-label">Campus Food</span>
            </div>
            
            <div className="feature-icon-card">
              <div className="card-icon-container">
                <div className="icon-circle bg-cyan-light">
                  <BookOpen size={26} color="#20C7C9" />
                </div>
              </div>
              <span className="card-label">College<br/>Essentials</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <div className="icon-circle bg-coral-light">
                  <ShoppingBag size={26} color="#FF5A3D" />
                </div>
              </div>
              <span className="card-label">Campus Resale</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <div className="icon-circle bg-azure-light">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2498E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path></svg>
                </div>
              </div>
              <span className="card-label">Top Picks</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <div className="icon-circle bg-yellow-light">
                  <Percent size={26} color="#FBB03B" />
                </div>
              </div>
              <span className="card-label">Student Deals</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <div className="icon-circle bg-azure-light">
                  <Search size={26} color="#2498E8" />
                </div>
              </div>
              <span className="card-label">Quick Search</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <div className="icon-circle bg-pink-light">
                  <Gift size={26} color="#D53F8C" />
                </div>
              </div>
              <span className="card-label">Special Gifts</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <div className="icon-circle bg-indigo-light">
                  <CreditCard size={26} color="#4A35E8" />
                </div>
              </div>
              <span className="card-label">Easy Payments</span>
            </div>

            <div className="feature-icon-card">
              <div className="card-icon-container">
                <div className="icon-circle bg-cyan-light">
                  <HomeIcon size={26} color="#20C7C9" />
                </div>
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
          <p className="zomato-footer-copyright" style={{textAlign: 'center', width: '100%'}}>
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
            --dark: #07101C;
            --text-gray: #4A5568;
        }

        html, body {
          max-width: 100% !important;
          overflow-x: hidden !important;
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

        .text-dark { color: var(--dark); font-weight: 800; }
        .text-indigo { color: var(--indigo); font-weight: 800; }
        .text-cyan { color: var(--cyan); font-weight: 800; }

        .bg-indigo-light { background-color: rgba(74, 53, 232, 0.08); }
        .bg-cyan-light { background-color: rgba(32, 199, 201, 0.08); }
        .bg-coral-light { background-color: rgba(255, 90, 61, 0.08); }
        .bg-azure-light { background-color: rgba(36, 152, 232, 0.08); }
        .bg-yellow-light { background-color: rgba(251, 176, 59, 0.08); }
        .bg-pink-light { background-color: rgba(213, 63, 140, 0.08); }

        /* Background Decorators */
        .bg-decor {
          position: absolute;
          z-index: 0;
          pointer-events: none;
        }
        
        .dots-top-left { top: 120px; left: 40px; }
        .dots-top-right { top: 60px; right: 40px; }
        .dots-mid-right { top: 50%; right: 40px; }
        .dots-bottom-left { bottom: 100px; left: 40px; }

        .dots-top-left, .dots-top-right, .dots-mid-right, .dots-bottom-left {
          width: 36px; height: 36px;
          background-image: radial-gradient(#94A3B8 2px, transparent 2px);
          background-size: 12px 12px;
        }

        .cross {
          font-size: 24px;
          font-weight: 300;
          line-height: 1;
        }
        .cyan-cross { color: var(--cyan); }
        .orange-cross { color: var(--coral); }
        .top-right { top: 320px; right: 10%; }
        .mid-left { top: 550px; left: 15%; }
        .mid-left-2 { top: 450px; left: 8%; }

        .circle {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid;
        }
        .cyan-circle { border-color: var(--cyan); }
        .orange-circle { border-color: var(--coral); }
        .top-left { top: 380px; left: 10%; }
        .mid-right { top: 650px; right: 15%; }
        .bottom-left { bottom: 350px; left: 12%; }
        .bottom-right { bottom: 250px; right: 10%; }

        .dashed-line-1 {
          top: 600px; right: -50px;
          width: 200px; height: 200px;
        }
        .dashed-line-2 {
          top: 400px; left: -50px;
          width: 200px; height: 200px;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          z-index: 0;
          opacity: 0.5;
        }
        .blob-purple {
          width: 300px; height: 300px;
          background: rgba(74, 53, 232, 0.2);
          bottom: -50px; left: -100px;
        }
        .blob-cyan {
          width: 250px; height: 250px;
          background: rgba(32, 199, 201, 0.2);
          bottom: 0px; right: -80px;
        }

        /* 1. Header Styles */
        .landing-header {
          position: absolute;
          top: 0; left: 0; width: 100%;
          z-index: 100;
          background: transparent;
          padding: 24px 30px;
        }

        .header-content {
          max-width: 1200px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
        }

        .brand-logo {
          display: flex; align-items: center; gap: 12px; text-decoration: none;
        }
        
        .logo-icon-wrapper {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          width: 42px; height: 42px;
          background: white;
        }

        .brand-name { font-size: 1.6rem; font-weight: 800; color: var(--dark); letter-spacing: -0.5px; }
        .brand-name-sub { color: var(--cyan); }
        .header-menu { cursor: pointer; }

        /* 2. Hero Section */
        .hero-section {
          position: relative;
          min-height: 100vh;
          width: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 120px 24px 60px 24px;
          box-sizing: border-box;
        }

        .hero-content-wrapper {
          position: relative;
          max-width: 900px; text-align: center; z-index: 20;
          margin-top: 40px;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 900;
          line-height: 1.15;
          margin-bottom: 24px;
          letter-spacing: -1.5px;
        }

        .hero-subtitle {
          font-size: 1.25rem; color: var(--text-gray);
          margin-bottom: 40px; max-width: 500px;
          margin-left: auto; margin-right: auto;
          line-height: 1.5; font-weight: 500;
        }

        /* Images */
        .hero-img {
          position: absolute;
          z-index: 10;
          filter: drop-shadow(0 15px 25px rgba(0,0,0,0.15));
        }
        .hero-burger {
          bottom: 2%; left: 2%;
          width: 220px;
        }
        .hero-momo {
          bottom: 4%; right: -2%;
          width: 200px;
        }
        .hero-pizza {
          display: none;
        }
        .tomato-img {
          position: absolute;
          bottom: 2%; left: 60%;
          font-size: 2.5rem;
          z-index: 10;
          filter: drop-shadow(0 5px 10px rgba(0,0,0,0.2));
        }

        /* Hero Actions Styling - Stacked vertically like the image */
        .hero-actions {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 16px; width: 100%; max-width: 320px; margin: 0 auto;
        }

        .btn-primary {
          background: var(--indigo); color: #ffffff;
          padding: 16px 24px; border-radius: 12px;
          font-weight: 700; font-size: 1.1rem;
          text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 20px;
          width: 100%; box-sizing: border-box;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 10px 25px rgba(74, 53, 232, 0.25);
        }
        
        .btn-secondary {
          background: #ffffff; color: var(--indigo);
          border: 1.5px solid var(--indigo);
          padding: 16px 24px; border-radius: 12px;
          font-weight: 700; font-size: 1.1rem;
          text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 20px;
          width: 100%; box-sizing: border-box;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        /* 3. Promo Section */
        .promo-section {
          padding: 60px 24px; position: relative; z-index: 10;
          width: 100%; box-sizing: border-box;
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }

        .promo-content-wrapper { max-width: 600px !important; }

        .section-heading {
          font-size: 2.8rem; font-weight: 900;
          margin-bottom: 20px; letter-spacing: -1px; line-height: 1.1;
        }

        .promo-subtext {
          font-size: 1.1rem; color: var(--text-gray); max-width: 480px; margin: 0 auto 50px;
          line-height: 1.6;
        }

        .promo-cards-container {
          display: flex; flex-direction: column; gap: 16px;
          width: 100%; max-width: 360px; margin: 0 auto;
        }

        .promo-stat-card {
          background: #ffffff; border-radius: 16px;
          padding: 16px 24px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
          display: flex; align-items: center; gap: 20px;
          border: 1px solid rgba(0,0,0,0.03);
          transition: transform 0.2s ease;
        }

        .stat-icon-wrapper {
          border-radius: 12px; width: 50px; height: 50px;
          background: rgba(74, 53, 232, 0.06);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .stat-info {
          display: flex; flex-direction: column; align-items: flex-start; text-align: left;
        }

        .stat-number { font-size: 1.15rem; font-weight: 800; color: var(--dark); line-height: 1.2; }
        .stat-label { font-size: 0.9rem; color: #718096; font-weight: 500; }

        /* 4. App Features Section */
        .app-features-section {
          padding: 80px 24px 100px; position: relative; z-index: 12;
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }

        .app-features-wrapper { max-width: 600px !important; display: flex; flex-direction: column; align-items: center; }

        .title-underline {
          width: 40px; height: 4px; background-color: var(--cyan);
          border-radius: 2px; margin: 15px auto 25px;
        }

        .features-subtext {
          font-size: 1.1rem; color: var(--text-gray); max-width: 450px;
          line-height: 1.6; margin-bottom: 50px;
        }

        /* 3x3 Feature Icons Grid */
        .features-icon-grid {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;
          width: 100%; max-width: 450px; margin-bottom: 50px;
        }

        .feature-icon-card {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          background: #ffffff;
          border-radius: 16px;
          padding: 20px 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0,0,0,0.02);
        }

        .card-icon-container {
          display: flex; align-items: center; justify-content: center;
        }
        
        .icon-circle {
          width: 56px; height: 56px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }

        .card-label {
          font-size: 0.85rem; font-weight: 700; color: var(--dark); line-height: 1.2; text-align: center;
        }

        .and-more-text { font-size: 1.4rem; font-weight: 900; margin-top: 20px; }

        /* Footer override */
        .zomato-footer {
          background-color: transparent;
          color: var(--text-gray);
          padding: 40px 24px;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .hero-title { font-size: 3rem; }
          .hero-burger { width: 160px; left: -20px; }
          .hero-momo { width: 140px; right: -20px; }
          .section-heading { font-size: 2.2rem; }
          .features-icon-grid { gap: 12px; }
          .feature-icon-card { padding: 16px 8px; }
          .icon-circle { width: 48px; height: 48px; }
          .card-label { font-size: 0.8rem; }
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

print("Updated Home.jsx for better resemblance")
