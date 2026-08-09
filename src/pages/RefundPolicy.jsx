import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';

export default function RefundPolicy() {
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
            Campus<span style={{ color: '#b31522' }}>In</span>
          </span>
        </Link>
      </header>

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '24px', border: '1px solid #edf2f7', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 850, color: '#111111', marginBottom: '8px' }}>Refund Policies</h1>
          <p style={{ color: '#718096', fontWeight: 600, marginBottom: '32px' }}>Last Updated: [19/08/2025]</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#4a5568', lineHeight: 1.6, fontSize: '0.95rem' }}>
            <p>At CampusIn, we want every student to get quality products at fair prices. Please read our Refund & Replacement Policy carefully:</p>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>1. No Refund Policy</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>We do not offer cash refunds for any item.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>2. Replacement Policy</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Replacement is available only if the item is found faulty/damaged at the time of delivery.</li>
                <li>Students must check the item in front of the delivery partner during delivery.</li>
                <li>Once the delivery partner confirms that the item was accepted in good condition, no return or replacement will be accepted later.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>3. Open Box Delivery Option</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>We provide an Open Box Delivery service.</li>
                <li>Students are encouraged to open and check the item instantly before accepting it.</li>
                <li>If any issue is found, inform the delivery partner immediately for a quick replacement.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', marginBottom: '12px' }}>4. Exceptions</h2>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Items damaged after delivery will not be eligible for replacement.</li>
                <li>Perishable or consumable items (like food from future canteen tie-ups) will also not be replaced once accepted.</li>
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
