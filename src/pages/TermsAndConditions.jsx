import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';

export default function TermsAndConditions() {
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
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/CampusIn_Logo_bg_removed.png" alt="CampusIn Logo" style={{ height: '28px', marginRight: '0px', marginLeft: '0px' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4A35E8' }}>
            Campus<span style={{ color: '#20C7C9' }}>In</span>
          </span>
        </Link>
      </header>

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '24px', border: '1px solid #edf2f7', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 850, color: '#111111', marginBottom: '8px' }}>Terms & Conditions</h1>
          <p style={{ color: '#718096', fontWeight: 600, marginBottom: '32px' }}>Last Updated: [19/08/2025]</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#4a5568', lineHeight: 1.6, fontSize: '0.95rem' }}>
            <p>Welcome to CampusIn (“we,” “our,” or “us”). By accessing or using our platform, you (“user,” “student,” or “customer”) agree to follow these Terms & Conditions.</p>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>1. Services We Provide</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>We deliver stationery items at fair and affordable rates inside college campuses.</li>
                <li>We also organize student networking trips to top institutes (like IITs, NITs, NLUs, etc.) for exposure and learning.</li>
                <li>In the future, college canteens and food partners may also be listed on our platform.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>2. Fair Usage Policy</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Our services are exclusively for college students.</li>
                <li>Stationery is for personal and academic use only, resale is strictly prohibited.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>3. Orders & Delivery</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Delivery within campus will be free in the beginning (subject to change later).</li>
                <li>Delivery time depends on product availability, usually within 1 hour during working hours.</li>
                <li>Once delivered, products cannot be returned unless damaged or incorrect.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>4. Payments</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Prices will always be lower or fairer than outside shops inside campus.</li>
                <li>Payments can be made via UPI, cash, or card (if available).</li>
                <li>All payments must be settled before or at the time of delivery.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>5. Responsibilities of Students</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Provide correct information (name, ID, room number, etc.) during orders.</li>
                <li>Respect delivery staff (who are also students).</li>
                <li>Follow rules and guidelines during trips.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>6. Liability</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>We are not responsible for misuse of stationery or networking trips.</li>
                <li>We are not liable for delays due to unforeseen circumstances (traffic, strikes, weather, etc.).</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>7. Privacy</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Student data (name, college ID, contact) will only be used for order delivery and trip booking.</li>
                <li>We will never sell your data to third parties.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>8. Changes to Terms</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>CampusIn may update these Terms & Conditions at any time.</li>
                <li>Continued use of our services means you agree to the updated terms.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>9. Contact</h2>
              <p>For any queries or complaints, reach out at:</p>
              <p>📧 <a href="mailto:contact.campusin@gmail.com" style={{ color: '#b31522', textDecoration: 'none' }}>contact.campusin@gmail.com</a></p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px', marginTop: '16px' }}>10. User Generated Content</h2>
              <p style={{ marginBottom: '12px' }}>
                Thank you for considering our request to use your post and your picture. By making available any of the contents such as reviews, photographs, videos, or other materials created by you (“User Generated Content”), you hereby grant to CampusIn a worldwide, irrevocable, perpetual, non-exclusive, fully-transferable, royalty-free license, with the right to sublicense, to use, copy, adapt, modify, distribute, license, sell, transfer, publicly display, publicly perform, transmit, stream, broadcast, access, view, and otherwise exploit such User Generated Content for purposes related to advertising, promotions, and any other business interests as CampusIn may determine.
              </p>
              <p style={{ marginBottom: '12px' }}>
                CampusIn does not claim any ownership rights in any User Generated Content and nothing in this Agreement will be deemed to restrict any rights that you may have to use and exploit any such User Generated Content. Notwithstanding the foregoing, CampusIn has the right, but not the obligation, to remove any material, including User Generated Content, whether or not such material has been modified by you, solely at its own discretion. You understand and agree that CampusIn is the sole owner of all rights in and to any work created by or for CampusIn that uses User Generated Content, in whole or in part, and you shall have no claim of any kind or nature whatsoever against CampusIn based on the use of any User Generated Content.
              </p>
              <p style={{ marginBottom: '12px' }}>
                You acknowledge and agree that you are solely responsible for all User Generated Content that you make available to CampusIn. Accordingly, you represent and warrant that: (i) you either are the sole and exclusive owner of all User Generated Content that you make available, or you have all rights, licenses, consents and releases that are necessary to grant to CampusIn the rights in such User Generated Content, as contemplated under this Agreement; and (ii) neither the User Generated Content nor your posting, uploading, publication, submission or transmittal of the User Generated Content or CampusIn’s use of the User Generated Content (or any portion thereof), will infringe, misappropriate or violate a third party’s patent, copyright, trademark, trade secret, moral rights or other proprietary or intellectual property rights, or rights of publicity or privacy, or result in the violation of any applicable law or regulation. You represent and warrant that you are at least 13 years old.
              </p>
              <p>
                CampusIn retains ownership of all intellectual property on the Website other than User Generated Content, including, but not limited to, visual interfaces, graphics, design, compilation, computer code, software, and aggregate user review ratings and any work created by or for CampusIn that uses User Generated Content, in whole or in part.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
