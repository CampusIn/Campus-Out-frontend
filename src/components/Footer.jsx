import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer({ variant = 'default' }) {
  const isCompact = variant === 'compact';

  return (
    <footer className={`zomato-footer ${isCompact ? 'zomato-footer-compact' : ''}`} id="help">
      <div className="zomato-footer-container">
        {/* Top Row: Logo */}
        <div className="zomato-footer-top-row">
          <Link to="/" className="brand-logo" style={{ cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/CampusIn_Logo_bg_removed.png" alt="CampusIn Logo" style={{ height: '32px', marginRight: '0px', marginLeft: '0px' }} />
            <span className="brand-name" style={{ color: '#ffffff', fontSize: '1.4rem', fontWeight: 800 }}>
              Campus<span className="brand-name-sub" style={{ color: '#20C7C9' }}>In</span>
            </span>
          </Link>
        </div>

        {/* Links Grid */}
        <div className="zomato-footer-grid">
          {/* Column 1: About CampusIn */}
          <div className="zomato-footer-col">
            <h6 className="zomato-footer-title">About CampusIn</h6>
            <nav className="zomato-footer-links">
              <Link to="/who-we-are">Who We Are</Link>
              {!isCompact && <Link to="/trips">CampusIn Trips</Link>}
              <a href="mailto:contact@campusin.store">Email: contact@campusin.store</a>
              <a href="https://wa.me/917380193241" target="_blank" rel="noopener noreferrer">Phone: +91 7380193241</a>
            </nav>
          </div>

          {!isCompact && (
            <div className="zomato-footer-col">
              <h6 className="zomato-footer-title">Explore</h6>
              <nav className="zomato-footer-links">
                <Link to="/restaurants">Food & Dining</Link>
                <Link to="/marketplace">Student Marketplace</Link>
                <Link to="/printing">Campus Printing</Link>
                <Link to="/trips">Weekend Trips & Treks</Link>
              </nav>
            </div>
          )}

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
              <a 
                href="https://www.instagram.com/campusin.nitj?igsh=MWYxcm81MjBvZzh3bw==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="zomato-social-icon-btn" 
                aria-label="Instagram"
              >
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

      <style>{`
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
        .zomato-footer-compact .zomato-footer-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        .zomato-footer-col {
          display: flex;
          flex-direction: column;
        }
        .zomato-footer-title {
          font-size: 0.85rem;
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
          width: 28px;
          height: 28px;
          background-color: #ffffff;
          border-radius: 50%;
          text-decoration: none;
          transition: transform 0.2s ease;
        }
        .zomato-social-icon-btn:hover {
          transform: scale(1.1);
        }
        .zomato-footer-divider {
          height: 1px;
          background-color: #1e232b;
          margin-bottom: 24px;
        }
        .zomato-footer-copyright {
          font-size: 0.8rem;
          color: #636b78;
          line-height: 1.6;
        }
        @media (max-width: 900px) {
          .zomato-footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 28px;
          }
          .zomato-footer-compact .zomato-footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 540px) {
          .zomato-footer-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </footer>
  );
}
