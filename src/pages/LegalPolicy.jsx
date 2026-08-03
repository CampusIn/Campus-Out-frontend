import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';

export default function LegalPolicy() {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '60px' }}>
      <header className="page-header" style={{ background: '#ffffff', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #edf2f7', position: 'sticky', top: 0, zIndex: 10 }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111111' }}
        >
          <ArrowLeft size={18} />
        </button>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ background: '#b31522', borderRadius: '8px', padding: '4px', display: 'flex' }}>
            <Flame size={16} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111111' }}>
            CAMPUS<span style={{ color: '#b31522' }}>IN</span>
          </span>
        </Link>
      </header>

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '24px', border: '1px solid #edf2f7', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 850, color: '#111111', marginBottom: '8px' }}>Privacy Policy</h1>
          <p style={{ color: '#718096', fontWeight: 600, marginBottom: '32px' }}>Last Updated: [19/08/2025]</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#4a5568', lineHeight: 1.6, fontSize: '0.95rem' }}>
            <p>CampusIn (“we,” “our,” or “us”) values your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.</p>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>1. Information We Collect</h2>
              <p style={{ marginBottom: '8px' }}>We may collect the following details when you use our services:</p>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Name, college ID, contact number, email address</li>
                <li>Hostel/room details for delivery</li>
                <li>Payment information (UPI, card, etc.)</li>
                <li>Preferences related to stationery orders</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>2. How We Use Your Information</h2>
              <p style={{ marginBottom: '8px' }}>We use your data to:</p>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Deliver stationery items quickly inside your campus</li>
                <li>Process payments securely</li>
                <li>Send important updates, offers, or reminders related to our services</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>3. Data Protection</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>All data is stored securely and accessed only by authorized CampusIn team members.</li>
                <li>We use standard security practices to prevent data theft, misuse, or unauthorized access.</li>
                <li>Payment information is processed through trusted and secure gateways.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>4. Sharing of Information</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>We do not sell, rent, or trade your data to third parties.</li>
                <li>Data may only be shared with Delivery staff (for order completion).</li>
                <li>If required by law, we may disclose your information to authorities.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>5. Your Rights</h2>
              <p style={{ marginBottom: '8px' }}>As a user, you have the right to:</p>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Access the data we hold about you</li>
                <li>Request correction or deletion of your data</li>
                <li>Opt out of promotional messages at any time</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>6. Policy Updates</h2>
              <p>CampusIn may update this Privacy Policy from time to time. Updates will be shared on our platform, and continued use means you agree to the updated policy.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>7. Contact Us</h2>
              <p>If you have any questions about privacy or data usage, contact us at:</p>
              <p>📧 <a href="mailto:contact.campusin@gmail.com" style={{ color: '#b31522', textDecoration: 'none' }}>contact.campusin@gmail.com</a></p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px', marginTop: '16px' }}>Privacy Policies of UGC</h2>
              <p>Any posts, comments provided by you is visible across website to other users. By accepting this you provide your consent to display your information.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
