import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import {
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  MessageCircle,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';

const BOOKING_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdZ0cMEHIweURBNu_2n0PSIyBmcUpuyZv9Phhqb1AFuAdYHcw/viewform?usp=publish-editor';

const TRIP = {
  title: 'Kasol — Tosh — Kheerganga & Manikaran',
  location: 'Himachal Pradesh',
  dateRange: '01 Oct – 05 Oct 2026',
  duration: '5 Days / 4 Nights',
  tags: ['Group Trip · NIT Jalandhar'],
  basePrice: 3999,
  priceLabel: 'per person, all-inclusive',
  verified: 'Verified experiences',
  startDate: '01/10/2026',
  endDate: '05/10/2026',
  image: '/manali_paragliding.jpg',
  fallbackImage: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
  brochureUrl: '/CampusIn.trips_compressed.pdf',
  highlightIntro: 'A mountain escape through Parvati Valley, bringing together Himalayan trails, quiet villages, riverside evenings, local culture, and quality time with your college crew.',
  highlightPlaces: [
    {
      title: 'Tosh',
      description: 'A peaceful mountain village with scenic views, cafés, and laid-back Himalayan vibes.'
    },
    {
      title: 'Kheerganga',
      description: 'The main adventure — scenic trails, forest paths, mountain views, and the famous hot springs.'
    },
    {
      title: 'Kasol',
      description: 'Riverside walks, local cafés, markets, and the relaxed atmosphere of Parvati Valley.'
    },
    {
      title: 'Manikaran',
      description: 'A cultural and spiritual stop featuring Manikaran Sahib, hot springs, and the Parvati River.'
    },
    {
      title: 'Parvati Valley',
      description: 'A beautiful mix of mountains, forests, rivers, villages, and unforgettable Himalayan landscapes.'
    }
  ],
  amenities: [
    { label: 'DEPARTURE', value: '01 Oct · 10:00 PM' },
    { label: 'TRANSPORT', value: 'Tempo Traveller / Bus' },
    { label: 'STAYS', value: 'Tosh + Kasol' },
    { label: 'MEALS', value: 'Breakfast and Snacks' },
  ],
  itinerary: [
    { 
      day: 'Day 0 — 01 October: NIT Jalandhar → Himachal', 
      details: 'Depart at 10:00 PM and travel overnight by Tempo Traveller / Bus.' 
    },
    { 
      day: 'Day 1 — 02 October: Tosh', 
      details: 'Reach Himachal, continue towards Tosh, transfer from Barshaini as required, lunch and rest, explore Tosh village, scenic walk/viewpoints/sunset, dinner and overnight stay in Tosh.' 
    },
    { 
      day: 'Day 2 — 03 October: Kheerganga Trek', 
      details: 'Early breakfast and gear check, travel towards Barshaini, trek through Himalayan trails, rivers, forests and mountain views, reach Kheerganga, rest/explore/enjoy views and photographs, descend in the afternoon, travel towards Kasol, hotel check-in, dinner and overnight stay in Kasol.' 
    },
    { 
      day: 'Day 3 — 04 October: Manikaran → Kasol', 
      details: 'Breakfast, travel to Manikaran, visit Manikaran Sahib, hot springs and Parvati River, return to Kasol, lunch/rest, explore Kasol market, riverside evening, optional short walk to Chalal if time permits, dinner and overnight stay in Kasol.' 
    },
    { 
      day: 'Day 4 — 05 October: Kasol → NIT Jalandhar', 
      details: 'Breakfast, final packing and room check, checkout and luggage loading, final headcount, departure from Kasol by Tempo Traveller / Bus, return journey and arrival at NIT Jalandhar depending on traffic and road conditions.' 
    },
  ],
  inclusions: [
    'Round-trip transportation via Tempo Traveller / Bus',
    'Accommodations in Tosh and Kasol',
    'Guided Kheerganga Trek with trail assistance',
    'Complete sightseeing as per itinerary (Manikaran, Tosh, Kasol)',
    'Trip coordinator & buddy system support',
    'All tolls, parking and state entry permits',
    'College ID / Essential packing checklist support',
  ],
  exclusions: [
    'Personal expenses & unlisted snacks/meals',
    'Porter charges or personal gear rentals',
    'Unlisted adventure activities',
    'Entry tickets to any monument or museum',
    'Expenses arising due to unforeseen weather or natural calamities',
    'Anything not mentioned in inclusions',
  ],
  safetyPoints: [
    'Stay Together — use the buddy system during trekking.',
    'Headcount — before every major departure.',
    'Trek Smart — stay on established routes and follow local instructions.',
    'Weather — mountain conditions can change quickly and activities may be modified if required.',
  ],
};

const PACKAGE_OPTIONS = [
  { name: 'Triple Sharing', price: 3999 },
  { name: 'Double Sharing', price: 3999 },
];

export default function UpcomingTrips() {
  const navigate = useNavigate();

  const [travelers, setTravelers] = useState(2);
  const [packageOption, setPackageOption] = useState('Triple Sharing');
  const [openDays, setOpenDays] = useState({ 2: true }); // Day 3 open by default

  const toggleDay = (idx) => {
    setOpenDays((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const currentPackage = PACKAGE_OPTIONS.find((p) => p.name === packageOption) || PACKAGE_OPTIONS[0];
  const unitPrice = currentPackage.price;
  const totalPrice = unitPrice * travelers;

  const handleSecureSpot = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // safe fallback
    }

    window.open(BOOKING_FORM_URL, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppFloating = () => {
    const text = `Hi CampusIn Trips! I have an enquiry regarding the *${TRIP.title}* trip (${TRIP.dateRange}).`;
    window.open(`https://wa.me/917380193241?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="ut-page">
      {/* Header */}
      <header className="ut-header">
        <div className="ut-header-inner">
          <Link to="/" className="ut-brand">
            <img src="/CampusIn_Logo_bg_removed.png" alt="CampusIn Logo" className="ut-brand-logo" />
            <span className="ut-brand-text">
              Campus<span className="ut-brand-accent">In</span>
            </span>
          </Link>

          <button className="ut-back-btn" onClick={() => navigate('/trips')}>
            <ArrowLeft size={16} />
            <span>All Trips</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="ut-main-container">

        {/* 1. Trip Header Block */}
        <div className="ut-heading-block">
          <div className="ut-title-row">
            <h1 className="ut-trip-title">{TRIP.title}</h1>
            <span className="ut-pill-tag ut-pill-tag--desktop">{TRIP.tags[0]}</span>
          </div>

          <div className="ut-meta-container">
            <div className="ut-meta-item ut-meta-location">
              <MapPin size={16} className="ut-meta-icon" />
              <span>{TRIP.location}</span>
            </div>
            <div className="ut-meta-subrow">
              <span className="ut-meta-item">
                <Calendar size={16} className="ut-meta-icon" />
                <span>{TRIP.dateRange}</span>
              </span>
              <span className="ut-meta-item">
                <Clock size={16} className="ut-meta-icon" />
                <span>{TRIP.duration}</span>
              </span>
            </div>
          </div>

          <div className="ut-pill-wrap--mobile">
            <span className="ut-pill-tag">{TRIP.tags[0]}</span>
          </div>
        </div>

        {/* 2. Top Two-Column Grid: Hero Image on Left, Booking Card on Right */}
        <div className="ut-top-grid">
          {/* Left Column: Hero Image */}
          <div className="ut-hero-image-wrap">
            <img
              src={TRIP.image}
              alt={TRIP.title}
              className="ut-hero-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = TRIP.fallbackImage;
              }}
            />
          </div>

          {/* Right Column: Booking Widget Card */}
          <div className="ut-booking-card">
            <div className="ut-price-header">
              <span className="ut-price-val">&#8377;{unitPrice.toLocaleString('en-IN')}</span>
              <span className="ut-verified-badge">{TRIP.verified}</span>
            </div>
            <div className="ut-price-sub">{TRIP.priceLabel}</div>

            {/* Date Fields */}
            <div className="ut-dates-grid">
              <div className="ut-input-box">
                <label className="ut-field-title">Start Date</label>
                <div className="ut-date-display">{TRIP.startDate}</div>
              </div>
              <div className="ut-input-box">
                <label className="ut-field-title">End Date</label>
                <div className="ut-date-display">{TRIP.endDate}</div>
              </div>
            </div>

            {/* Travelers Field */}
            <div className="ut-travelers-group">
              <label className="ut-field-title">Travelers</label>
              <div className="ut-travelers-input-wrap">
                <button
                  type="button"
                  className="ut-stepper-btn"
                  onClick={() => setTravelers((v) => Math.max(1, v - 1))}
                  aria-label="Decrease travelers"
                >
                  &#8722;
                </button>
                <span className="ut-travelers-num">{travelers}</span>
                <button
                  type="button"
                  className="ut-stepper-btn"
                  onClick={() => setTravelers((v) => Math.min(30, v + 1))}
                  aria-label="Increase travelers"
                >
                  +
                </button>
                <span className="ut-travelers-suffix">{travelers === 1 ? 'person' : 'people'}</span>
              </div>
            </div>

            {/* Package Option */}
            <div className="ut-package-group">
              <label className="ut-field-title">Package Option</label>
              <div className="ut-select-wrap">
                <select
                  className="ut-package-select"
                  value={packageOption}
                  onChange={(e) => setPackageOption(e.target.value)}
                >
                  {PACKAGE_OPTIONS.map((opt) => (
                    <option key={opt.name} value={opt.name}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="ut-select-arrow" />
              </div>
            </div>

            {/* Secure Spot CTA */}
            <button className="ut-secure-btn" onClick={handleSecureSpot}>
              Secure Your Spot
            </button>

            {/* Total Row */}
            <div className="ut-total-strip">
              <span className="ut-total-label">Total for {travelers} {travelers === 1 ? 'person' : 'people'}</span>
              <div className="ut-total-price-wrap">
                <span className="ut-total-amount">&#8377;{totalPrice.toLocaleString('en-IN')}</span>
                <span className="ut-total-suffix"> Incl. transport &amp; stay</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Full-Width Amenity Strip (Under Hero Image and Booking Widget) */}
        <div className="ut-amenities-strip">
          {TRIP.amenities.map((item, idx) => (
            <div key={idx} className="ut-amenity-cell">
              <span className="ut-amenity-tag">{item.label}</span>
              <span className="ut-amenity-val">{item.value}</span>
            </div>
          ))}
        </div>

        {/* 4. Bottom Two-Column Section: Highlights & Itinerary on Left, Inclusions & Safety on Right */}
        <div className="ut-bottom-grid">
          {/* Left Column: Highlights & Itinerary */}
          <div className="ut-details-col">
            {/* Trip Highlights */}
            <section className="ut-highlights-section">
              <h2 className="ut-section-heading">Trip Highlights</h2>
              <div className="ut-highlights-content">
                <p className="ut-highlight-p">{TRIP.highlightIntro}</p>
                <div className="ut-highlight-places">
                  {TRIP.highlightPlaces.map((place, i) => (
                    <div key={i} className="ut-highlight-place">
                      <h3 className="ut-highlight-place-title">{place.title}</h3>
                      <p className="ut-highlight-place-desc">{place.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Day-Wise Itinerary */}
            <section className="ut-itinerary-section">
              <h2 className="ut-section-heading ut-itinerary-heading">DAY-WISE ITINERARY</h2>
              <div className="ut-itinerary-accordion">
                {TRIP.itinerary.map((item, idx) => {
                  const isOpen = !!openDays[idx];
                  return (
                    <div
                      key={idx}
                      className={`ut-accordion-card ${isOpen ? 'ut-accordion-card--open' : ''}`}
                    >
                      <button
                        type="button"
                        className="ut-accordion-btn"
                        onClick={() => toggleDay(idx)}
                      >
                        <span className="ut-accordion-title">{item.day}</span>
                        {isOpen ? (
                          <ChevronUp size={18} className="ut-accordion-icon" />
                        ) : (
                          <ChevronDown size={18} className="ut-accordion-icon" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="ut-accordion-content">
                          <p>{item.details}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: Inclusions & Safety Block */}
          <div className="ut-sidebar-col">
            {/* Inclusions / Exclusions Card */}
            <div className="ut-inclusions-card">
              <div className="ut-features-list">
                {TRIP.inclusions.map((item, i) => (
                  <div key={`inc-${i}`} className="ut-feature-row">
                    <CheckCircle2 size={16} className="ut-feature-icon ut-feature-icon--check" />
                    <span className="ut-feature-text">{item}</span>
                  </div>
                ))}
                {TRIP.exclusions.map((item, i) => (
                  <div key={`exc-${i}`} className="ut-feature-row">
                    <XCircle size={16} className="ut-feature-icon ut-feature-icon--cross" />
                    <span className="ut-feature-text">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety & Trust Block */}
            <div className="ut-safety-card">
              <h3 className="ut-safety-title">Safety &amp; Trust</h3>
              <div className="ut-safety-content">
                {TRIP.safetyPoints.map((pt, i) => (
                  <p key={i} className="ut-safety-item">{pt}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Download Brochure */}
        <div className="ut-brochure-card">
          <div className="ut-brochure-info">
            <h3 className="ut-brochure-title">Want the full trip brochure?</h3>
            <p className="ut-brochure-desc">Download the detailed PDF with the itinerary, pricing and inclusions.</p>
          </div>
          <a
            href={TRIP.brochureUrl}
            download
            className="ut-brochure-btn"
          >
            <Download size={18} />
            <span>Download Brochure</span>
          </a>
        </div>

      </main>

      {/* Floating WhatsApp Button */}
      <button
        className="ut-floating-whatsapp"
        onClick={handleWhatsAppFloating}
        aria-label="Chat with us on WhatsApp"
      >
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="currentColor"
          className="ut-whatsapp-svg"
        >
          <path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.98.57 3.825 1.554 5.397L2 22l4.71-1.523a10.007 10.007 0 0 0 5.321 1.554h.005c5.536 0 10.031-4.495 10.031-10.031 0-5.536-4.495-10.031-10.036-10.031zm0 18.232h-.004a8.163 8.163 0 0 1-4.168-1.144l-.299-.178-3.097 1.002 1.023-3.02-.196-.312A8.164 8.164 0 0 1 3.832 12.03c0-4.52 3.679-8.199 8.2-8.199 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.201-8.201 8.201zm4.492-6.142c-.246-.123-1.455-.718-1.68-.8-.225-.082-.389-.123-.553.123-.164.246-.635.8-.779.963-.143.164-.287.185-.533.061-.246-.123-1.037-.382-1.976-1.218-.73-.65-1.223-1.454-1.367-1.7-.143-.246-.015-.379.108-.501.111-.111.246-.287.369-.431.123-.143.164-.246.246-.41.082-.164.041-.308-.02-.431-.061-.123-.553-1.332-.758-1.825-.199-.48-.401-.415-.553-.423l-.472-.008c-.164 0-.431.061-.656.308-.225.246-.861.841-.861 2.05s.881 2.378 1.004 2.542c.123.164 1.733 2.646 4.198 3.711.586.254 1.044.406 1.401.52.589.187 1.125.161 1.549.097.472-.071 1.455-.595 1.66-1.169.205-.574.205-1.066.143-1.169-.062-.102-.226-.164-.472-.287z"/>
        </svg>
      </button>

      {/* Website Footer */}
      <Footer />

      {/* Scoped Styles for Pixel-Perfect Matching */}
      <style>{`
        .ut-page {
          min-height: 100vh;
          background: #ffffff;
          color: #111827;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative;
        }

        /* Nav Header */
        .ut-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #f1f5f9;
          padding: 12px 24px;
        }
        .ut-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .ut-brand {
          display: flex;
          align-items: center;
          text-decoration: none;
          gap: 6px;
        }
        .ut-brand-logo {
          height: 34px;
          width: auto;
          object-fit: contain;
        }
        .ut-brand-text {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #4A35E8;
        }
        .ut-brand-accent {
          color: #20C7C9;
        }
        .ut-nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .ut-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f4f4f5;
          border: 1px solid #e4e4e7;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #3f3f46;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .ut-back-btn:hover {
          background: #e4e4e7;
          color: #18181b;
        }
        .ut-nav-item {
          text-decoration: none;
          color: #64748b;
          font-weight: 600;
          font-size: 0.88rem;
          transition: color 0.15s;
        }
        .ut-nav-item:hover {
          color: #4A35E8;
        }
        .ut-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ut-auth-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ut-btn-login {
          text-decoration: none;
          color: #4A35E8;
          font-weight: 700;
          font-size: 0.88rem;
          padding: 6px 12px;
        }
        .ut-btn-register {
          text-decoration: none;
          background: #4A35E8;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.88rem;
          padding: 7px 16px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .ut-btn-register:hover {
          background: #3622c4;
        }
        .ut-btn-profile {
          text-decoration: none;
          background: #f2efff;
          color: #4A35E8;
          font-weight: 700;
          font-size: 0.88rem;
          padding: 7px 16px;
          border-radius: 8px;
        }

        /* Container */
        .ut-main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px 24px 70px 24px;
        }

        /* Title Area */
        .ut-heading-block {
          margin-bottom: 22px;
        }
        .ut-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 10px;
        }
        .ut-trip-title {
          font-size: 2.1rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #111827;
          margin: 0;
          line-height: 1.2;
        }
        .ut-pill-tag {
          display: inline-block;
          background: #f4f4f5;
          color: #71717a;
          font-size: 0.76rem;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 9999px;
          letter-spacing: 0.2px;
        }
        .ut-pill-wrap--mobile {
          display: none;
        }
        .ut-pill-tag--desktop {
          display: inline-block;
        }
        .ut-meta-container {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 22px;
        }
        .ut-meta-subrow {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .ut-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.88rem;
          color: #374151;
          font-weight: 500;
        }
        .ut-meta-icon {
          color: #6b7280;
          flex-shrink: 0;
        }

        /* Top Grid */
        .ut-top-grid {
          display: grid;
          grid-template-columns: 1fr 370px;
          gap: 32px;
          align-items: start;
        }

        /* Hero Image */
        .ut-hero-image-wrap {
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 16 / 9.8;
          background: #e2e8f0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
        }
        .ut-hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }
        .ut-hero-image-wrap:hover .ut-hero-image {
          transform: scale(1.015);
        }

        /* Booking Widget Card */
        .ut-booking-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        }
        .ut-price-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }
        .ut-price-val {
          font-size: 1.95rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .ut-verified-badge {
          font-size: 0.74rem;
          color: #9ca3af;
          font-weight: 500;
          white-space: nowrap;
        }
        .ut-price-sub {
          font-size: 0.78rem;
          color: #9ca3af;
          margin-top: 4px;
          margin-bottom: 20px;
        }

        /* Date Inputs */
        .ut-dates-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .ut-input-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ut-field-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #27272a;
          letter-spacing: 0.1px;
        }
        .ut-date-display {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #27272a;
          background: #ffffff;
          letter-spacing: 0.2px;
        }

        /* Travelers Row */
        .ut-travelers-group {
          margin-bottom: 16px;
        }
        .ut-travelers-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 6px 12px;
          margin-top: 6px;
          background: #ffffff;
        }
        .ut-stepper-btn {
          width: 26px;
          height: 26px;
          background: #f4f4f5;
          border: none;
          border-radius: 5px;
          font-size: 1.1rem;
          font-weight: 700;
          color: #27272a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
          line-height: 1;
          font-family: inherit;
        }
        .ut-stepper-btn:hover {
          background: #e4e4e7;
        }
        .ut-travelers-num {
          font-size: 0.95rem;
          font-weight: 700;
          color: #18181b;
          min-width: 18px;
          text-align: center;
        }
        .ut-travelers-suffix {
          font-size: 0.86rem;
          color: #71717a;
          margin-left: auto;
        }

        /* Package Option Dropdown */
        .ut-package-group {
          margin-bottom: 20px;
        }
        .ut-select-wrap {
          position: relative;
          margin-top: 6px;
        }
        .ut-package-select {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 9px 36px 9px 12px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #18181b;
          background: #ffffff;
          appearance: none;
          cursor: pointer;
          font-family: inherit;
        }
        .ut-package-select:focus {
          outline: 2px solid #4A35E8;
          outline-offset: 1px;
        }
        .ut-select-arrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #71717a;
        }

        /* CTA Button */
        .ut-secure-btn {
          width: 100%;
          background: #4A35E8;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 13px 20px;
          font-size: 0.96rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.2px;
        }
        .ut-secure-btn:hover {
          background: #3622c4;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(74, 53, 232, 0.35);
        }
        .ut-secure-btn:active {
          transform: translateY(0);
        }

        /* Total Row */
        .ut-total-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 18px;
          padding-top: 4px;
        }
        .ut-total-label {
          font-size: 0.84rem;
          color: #374151;
          font-weight: 500;
        }
        .ut-total-price-wrap {
          text-align: right;
        }
        .ut-total-amount {
          font-size: 0.95rem;
          font-weight: 800;
          color: #111827;
        }
        .ut-total-suffix {
          font-size: 0.72rem;
          color: #6b7280;
          font-weight: 400;
        }

        /* Full Width Amenity Strip */
        .ut-amenities-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #f4f4f5;
          border-radius: 14px;
          padding: 20px 28px;
          margin: 32px 0 40px 0;
          gap: 20px;
        }
        .ut-amenity-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ut-amenity-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: #71717a;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .ut-amenity-val {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
        }

        /* Bottom Two-Column Grid */
        .ut-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 370px;
          gap: 32px;
          align-items: start;
        }

        /* Headings */
        .ut-section-heading {
          font-size: 1.55rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.4px;
          margin-bottom: 16px;
        }
        .ut-itinerary-heading {
          margin-top: 44px;
          letter-spacing: 0.4px;
        }

        /* Highlights */
        .ut-highlights-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ut-highlight-p {
          font-size: 0.91rem;
          color: #4b5563;
          line-height: 1.7;
          margin: 0;
        }
        .ut-highlight-places {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ut-highlight-place {
          padding-left: 14px;
          border-left: 2px solid #e5e7eb;
        }
        .ut-highlight-place-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px;
        }
        .ut-highlight-place-desc {
          font-size: 0.91rem;
          color: #4b5563;
          line-height: 1.7;
          margin: 0;
        }

        /* Itinerary Accordion */
        .ut-itinerary-accordion {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ut-accordion-card {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
          overflow: hidden;
          transition: border-color 0.15s, background 0.15s;
        }
        .ut-accordion-card--open {
          border-color: #d1d5db;
          background: #fafafa;
        }
        .ut-accordion-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          gap: 14px;
        }
        .ut-accordion-title {
          font-size: 0.92rem;
          font-weight: 600;
          color: #18181b;
        }
        .ut-accordion-icon {
          color: #3f3f46;
          flex-shrink: 0;
        }
        .ut-accordion-content {
          padding: 0 20px 18px 20px;
          font-size: 0.88rem;
          color: #4b5563;
          line-height: 1.7;
        }
        .ut-accordion-content p {
          margin: 0;
        }

        /* Right Column Sidebar */
        .ut-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Inclusions Card */
        .ut-inclusions-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }
        .ut-features-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .ut-feature-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.83rem;
          color: #374151;
          line-height: 1.45;
        }
        .ut-feature-icon {
          flex-shrink: 0;
          margin-top: 1px;
        }
        .ut-feature-icon--check {
          color: #16a34a;
        }
        .ut-feature-icon--cross {
          color: #ef4444;
        }
        .ut-feature-text {
          flex: 1;
        }

        /* Safety & Trust Card */
        .ut-safety-card {
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          border-radius: 14px;
          padding: 22px;
        }
        .ut-safety-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: #111827;
          margin-bottom: 12px;
          letter-spacing: -0.2px;
        }
        .ut-safety-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ut-safety-item {
          font-size: 0.82rem;
          color: #4b5563;
          line-height: 1.55;
          margin: 0;
        }

        /* Download Brochure Card */
        .ut-brochure-card {
          margin-top: 28px;
          background: linear-gradient(135deg, #4A35E8 0%, #6c4fed 100%);
          border-radius: 16px;
          padding: 28px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .ut-brochure-info {
          flex: 1;
          min-width: 220px;
        }
        .ut-brochure-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 6px;
          letter-spacing: -0.2px;
        }
        .ut-brochure-desc {
          font-size: 0.87rem;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
          line-height: 1.5;
        }
        .ut-brochure-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #4A35E8;
          font-weight: 700;
          font-size: 0.9rem;
          padding: 12px 22px;
          border-radius: 10px;
          text-decoration: none;
          white-space: nowrap;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
        }
        .ut-brochure-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
        }

        /* Floating WhatsApp Button */
        .ut-floating-whatsapp {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 999;
          width: 54px;
          height: 54px;
          background: #25D366;
          color: #ffffff;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ut-floating-whatsapp:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.5);
        }
        .ut-whatsapp-svg {
          fill: currentColor;
        }

        /* Responsive Breakpoints */
        @media (max-width: 960px) {
          .ut-top-grid,
          .ut-bottom-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .ut-amenities-strip {
            grid-template-columns: repeat(2, 1fr);
            padding: 16px 20px;
            margin: 24px 0 32px 0;
          }
          .ut-trip-title {
            font-size: 1.65rem;
          }
        }

        @media (max-width: 600px) {
          .ut-page {
            overflow-x: hidden;
          }
          .ut-header {
            padding: 12px 16px;
          }
          .ut-brand-logo {
            height: 30px;
          }
          .ut-brand-text {
            font-size: 1.25rem;
          }
          .ut-back-btn {
            padding: 6px 12px;
            font-size: 0.8rem;
          }
          .ut-main-container {
            padding: 20px 16px 60px 16px;
          }
          .ut-title-row {
            display: block;
            margin-bottom: 6px;
          }
          .ut-trip-title {
            font-size: 1.95rem;
            font-weight: 800;
            line-height: 1.2;
            letter-spacing: -0.5px;
            margin-bottom: 0;
          }
          .ut-pill-tag--desktop {
            display: none;
          }
          .ut-pill-wrap--mobile {
            display: flex;
            justify-content: flex-start;
            margin-top: 14px;
            margin-bottom: 4px;
          }
          .ut-pill-tag {
            font-size: 0.74rem;
            padding: 5px 14px;
            color: #71717a;
            background: #f4f4f5;
          }
          .ut-meta-container {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            margin-top: 10px;
            width: 100%;
          }
          .ut-meta-location {
            font-size: 0.88rem;
          }
          .ut-meta-subrow {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 18px;
            width: 100%;
          }
          .ut-meta-item {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 6px;
            font-size: 0.85rem;
            color: #374151;
            font-weight: 500;
          }
          .ut-hero-image-wrap {
            border-radius: 18px;
            aspect-ratio: 4 / 4.9;
            margin-top: 18px;
            width: 100%;
          }
          .ut-hero-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .ut-booking-card {
            padding: 22px 18px;
            border-radius: 16px;
            margin-top: 20px;
          }
          .ut-price-val {
            font-size: 1.85rem;
          }
          .ut-dates-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .ut-date-display {
            padding: 9px 12px;
            font-size: 0.86rem;
          }
          .ut-travelers-input-wrap {
            padding: 6px 12px;
          }
          .ut-package-select {
            padding: 9px 32px 9px 12px;
            font-size: 0.88rem;
          }
          .ut-secure-btn {
            padding: 13px 18px;
            font-size: 0.96rem;
          }
          .ut-total-strip {
            margin-top: 16px;
          }
          .ut-total-label {
            font-size: 0.82rem;
          }
          .ut-total-amount {
            font-size: 0.92rem;
          }
          .ut-total-suffix {
            font-size: 0.72rem;
          }
          /* Vertical Stack Card matching Screenshot 2 */
          .ut-amenities-strip {
            display: flex;
            flex-direction: column;
            gap: 18px;
            padding: 24px 22px;
            border-radius: 16px;
            background: #f4f4f5;
            margin: 28px 0 36px 0;
          }
          .ut-amenity-cell {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .ut-amenity-tag {
            font-size: 0.72rem;
            font-weight: 700;
            color: #71717a;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          }
          .ut-amenity-val {
            font-size: 1rem;
            font-weight: 700;
            color: #111827;
          }
          .ut-section-heading {
            font-size: 1.5rem;
            margin-bottom: 14px;
          }
          .ut-itinerary-heading {
            margin-top: 36px;
            font-size: 1.25rem;
          }
          .ut-highlight-p {
            font-size: 0.9rem;
            line-height: 1.7;
          }
          .ut-accordion-card {
            border-radius: 12px;
            margin-bottom: 12px;
          }
          .ut-accordion-btn {
            padding: 18px 20px;
            gap: 12px;
          }
          .ut-accordion-title {
            font-size: 0.94rem;
            line-height: 1.4;
          }
          .ut-accordion-content {
            padding: 0 20px 18px 20px;
            font-size: 0.88rem;
            color: #6b7280;
            line-height: 1.65;
          }
          .ut-inclusions-card {
            padding: 22px 18px;
            border-radius: 16px;
            margin-top: 24px;
          }
          .ut-feature-row {
            font-size: 0.82rem;
            gap: 10px;
          }
          .ut-safety-card {
            padding: 20px 18px;
            border-radius: 14px;
            margin-top: 16px;
          }
          .ut-safety-title {
            font-size: 1rem;
            margin-bottom: 10px;
          }
          .ut-safety-item {
            font-size: 0.8rem;
            line-height: 1.55;
          }
          .ut-brochure-card {
            padding: 22px 20px;
            border-radius: 14px;
            margin-top: 24px;
            flex-direction: column;
            align-items: flex-start;
          }
          .ut-brochure-btn {
            width: 100%;
            justify-content: center;
          }
          .ut-floating-whatsapp {
            bottom: 20px;
            right: 18px;
            width: 50px;
            height: 50px;
          }
          .ut-floating-whatsapp svg {
            width: 26px;
            height: 26px;
          }
        }

        @media (max-width: 380px) {
          .ut-dates-grid {
            grid-template-columns: 1fr;
          }
          .ut-amenities-strip {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
