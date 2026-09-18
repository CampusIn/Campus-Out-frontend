import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import { ArrowFillButton } from '../components/block/arrow-fill-button';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Bus, 
  Sparkles, 
  HeartHandshake, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  PhoneCall, 
  Mountain, 
  Tent, 
  GraduationCap, 
  Coffee,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

const FEATURED_TRIPS = [
  {
    id: 'triund-trek',
    title: 'Triund Trek & Dharamshala Escape',
    category: 'Weekend Treks',
    duration: '2 Days / 1 Night',
    nextDate: 'Every Weekend',
    pickup: 'Campus Main Gate',
    price: '₹2,499',
    originalPrice: '₹3,499',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    description: 'Breathtaking Dhauladhar views, summit camping under starlit skies, and vibrant McLeod Ganj cafe culture.',
    highlights: ['Alpine Dome Tents', 'Campfire & Acoustic Music', 'Guided Summit Trek', 'All Meals & Transport']
  },
  {
    id: 'kasol-tosh',
    title: 'Kasol & Tosh Valley Experience',
    category: 'Camping & Adventure',
    duration: '3 Days / 2 Nights',
    nextDate: 'Upcoming Long Weekend',
    pickup: 'Campus Main Gate',
    price: '₹3,899',
    originalPrice: '₹5,299',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    description: 'Parvati riverbanks, pine forests, cozy mountain cafes, and peaceful village treks for an unforgettable recharge.',
    highlights: ['Riverside Campsite', 'Tosh Village Hike', 'Parvati Valley Stargazing', 'Round-trip AC Volvo']
  },
  {
    id: 'iit-networking',
    title: 'Inter-College Fest & Tech Conclave',
    category: 'Networking & Fests',
    duration: '3 Days / 2 Nights',
    nextDate: 'Oct 2026 Batch',
    pickup: 'Campus Transit Hub',
    price: '₹2,999',
    originalPrice: '₹4,000',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
    description: 'Exclusive delegate passes to premier institute hackathons, cultural festivals, and peer-to-peer networking.',
    highlights: ['Fest Delegate Access', 'Student Hostel Stay', 'Hackathon Mentorship', 'Institute Certificate']
  },
  {
    id: 'rishikesh-rafting',
    title: 'Rishikesh River Rafting & Cliff Jump',
    category: 'Camping & Adventure',
    duration: '2 Days / 2 Nights',
    nextDate: 'Bi-Weekly Departures',
    pickup: 'Campus Main Gate',
    price: '₹3,299',
    originalPrice: '₹4,499',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
    description: '16km Grade III Ganga river rafting, cliff jumping, beach volleyball, and live DJ bonfire nights.',
    highlights: ['Grade III Rapids Rafting', 'Riverside Jungle Camps', 'Cliff Jumping & Body Surfing', 'Barbecue & Bonfire']
  },
  {
    id: 'manali-solang',
    title: 'Old Manali & Solang Valley Chill',
    category: 'Weekend Treks',
    duration: '3 Days / 2 Nights',
    nextDate: 'Nov 2026 Special',
    pickup: 'Campus Main Gate',
    price: '₹4,199',
    originalPrice: '₹5,500',
    image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
    description: 'Snow viewpoints, Old Manali hippie lanes, paragliding, hot spring dips, and mountain cafe hopping.',
    highlights: ['3-Star Hill Hotel Stay', 'Solang Adventure Zone', 'Jogini Waterfall Trek', 'Buffet Breakfast & Dinner']
  },
  {
    id: 'custom-society',
    title: 'Custom Batch & Club Retreat',
    category: 'Custom Group',
    duration: 'Customizable (1-4 Days)',
    nextDate: 'On Demand',
    pickup: 'Hostel / Campus Gate',
    price: 'Custom Quote',
    originalPrice: 'Best Rates',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    description: 'Designed specially for student societies, sports teams, and department farewells with complete flexibility.',
    highlights: ['Dedicated Private Bus', 'Exclusive Group Stays', 'Custom Itineraries', 'Dedicated Trip Leader']
  }
];

const CATEGORIES = ['All', 'Weekend Treks', 'Camping & Adventure', 'Networking & Fests', 'Custom Group'];

export default function Trips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    college: 'NIT Jalandhar',
    destination: 'Triund Trek & Dharamshala Escape',
    groupSize: '1',
    preferredMonth: 'Next Weekend',
    notes: ''
  });

  const filteredTrips = selectedCategory === 'All' 
    ? FEATURED_TRIPS 
    : FEATURED_TRIPS.filter(trip => trip.category === selectedCategory);

  const openBookingModal = (trip = null) => {
    if (trip) {
      setSelectedTrip(trip);
      setFormData(prev => ({ ...prev, destination: trip.title }));
    }
    setSubmitted(false);
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleWhatsAppBooking = () => {
    const text = `Hi CampusIn Trips! I would like to book / enquire about a trip.%0A%0A` +
      `*Name:* ${encodeURIComponent(formData.name || 'Student')}%0A` +
      `*College:* ${encodeURIComponent(formData.college)}%0A` +
      `*Trip:* ${encodeURIComponent(formData.destination)}%0A` +
      `*Group Size:* ${encodeURIComponent(formData.groupSize)} students%0A` +
      `*Preferred Dates:* ${encodeURIComponent(formData.preferredMonth)}%0A` +
      (formData.notes ? `*Notes:* ${encodeURIComponent(formData.notes)}%0A` : '') +
      `%0APlease share available seats and detailed itinerary!`;

    window.open(`https://wa.me/917380193241?text=${text}`, '_blank');
  };

  return (
    <div className="trips-page-container">
      {/* 1. Header matching the website style */}
      <header className="trips-nav-header">
        <div className="trips-nav-inner">
          <Link to="/" className="brand-logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/CampusIn_Logo_bg_removed.png" alt="CampusIn Logo" style={{ height: '34px' }} />
            <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#4A35E8' }}>
              Campus<span style={{ color: '#20C7C9' }}>In</span>
            </span>
          </Link>

          {user && (
            <div className="trips-nav-actions">
              <Link to="/profile" className="btn-nav-profile">
                <span>{user.name?.split(' ')[0] || 'My Account'}</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 2. Hero Section - faithfully matching the reference */}
      <section className="trips-hero-section">
        <div className="trips-hero-container">
          <div className="trips-hero-left">
            <h1 className="trips-hero-title">
              <span style={{ color: '#4A35E8' }}>Campus<span style={{ color: '#20C7C9' }}>In</span></span> Trips
            </h1>

            <div className="trips-hero-body">
              <p className="body-lead">College is more than classrooms and deadlines.</p>
              <p className="body-space">Sometimes, it's about taking the road, finding new places, and sharing the journey with good people.</p>
              <p className="body-punchline">More than a trip. A different perspective</p>
            </div>

            <div className="trips-hero-action">
              <ArrowFillButton
                as="button"
                onClick={() => navigate('/trips/upcoming-trips')}
                bgColor="#111111"
                textColor="#ffffff"
                fillBgColor="#4A35E8"
                fillTextColor="#ffffff"
                hoverFillBgColor="#4A35E8"
                hoverFillTextColor="#ffffff"
                arrowColor="#ffffff"
                hoverArrowColor="#ffffff"
              >
                Book A Trip
              </ArrowFillButton>
            </div>
          </div>

          <div className="trips-hero-right">
            <div className="trips-hero-image-card">
              <img 
                src="/trips_hero.jpg" 
                alt="Friends on a mountain summit watching the sunset" 
                className="trips-hero-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1200&q=80";
                }}
              />
            </div>

            <div className="trips-hero-image-cta">
              <ArrowFillButton
                as="button"
                onClick={() => navigate('/trips/upcoming-trips')}
                bgColor="#111111"
                textColor="#ffffff"
                fillBgColor="#4A35E8"
                fillTextColor="#ffffff"
                hoverFillBgColor="#4A35E8"
                hoverFillTextColor="#ffffff"
                arrowColor="#ffffff"
                hoverArrowColor="#ffffff"
              >
                Book A Trip
              </ArrowFillButton>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Upcoming Trips Section (Spotlight Single Trip) */}
      <section className="trips-upcoming-section" id="upcoming">
        <div className="trips-content-wrapper">
          <div className="section-header-center" style={{ marginBottom: '40px' }}>
            <span className="section-badge">Next Departure</span>
            <h2 className="section-heading">Upcoming Trips</h2>
            <p className="section-subtext">
              A five-day Himalayan escape through Parvati Valley, with bus pickups directly from your college gate.
            </p>
          </div>

          {/* Spotlight Card for Single Live Trip */}
          <div className="trip-spotlight-card">
            <div className="spotlight-image-col">
              <img 
                src="/manali_paragliding.jpg" 
                alt="Kasol, Tosh & Kheerganga Escape" 
                className="spotlight-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80";
                }}
              />
              <div className="spotlight-badge-top">
                <span className="live-dot-pulse"></span>
                <span>Registrations Open</span>
              </div>
              <div className="spotlight-tag-bottom">
                <Calendar size={14} style={{ marginRight: '6px' }} />
                <span>5 Days / 4 Nights · 01–05 October</span>
              </div>
            </div>

            <div className="spotlight-content-col">
              <div className="spotlight-pickup-pill">
                <MapPin size={14} color="#4A35E8" />
                <span>Pickup: <strong>Campus Main Gate</strong></span>
              </div>

              <h3 className="spotlight-title">Kasol, Tosh & Kheerganga Escape</h3>
              <p className="spotlight-desc">
                Five days through Himalayan villages, scenic trails, riverside evenings, and the beautiful Parvati Valley. Explore Tosh, take on the Kheerganga trek, experience Manikaran, and unwind in Kasol with your college crew.
              </p>

              <div className="spotlight-highlights-grid">
                <div className="highlight-item">
                  <div className="highlight-check"><Check size={13} color="#16a34a" /></div>
                  <span>Tempo Traveller / Bus transport</span>
                </div>
                <div className="highlight-item">
                  <div className="highlight-check"><Check size={13} color="#16a34a" /></div>
                  <span>Stay in Tosh & Kasol</span>
                </div>
                <div className="highlight-item">
                  <div className="highlight-check"><Check size={13} color="#16a34a" /></div>
                  <span>Kheerganga trek experience</span>
                </div>
                <div className="highlight-item">
                  <div className="highlight-check"><Check size={13} color="#16a34a" /></div>
                  <span>Explore Tosh village</span>
                </div>
                <div className="highlight-item">
                  <div className="highlight-check"><Check size={13} color="#16a34a" /></div>
                  <span>Manikaran Sahib & hot springs</span>
                </div>
                <div className="highlight-item">
                  <div className="highlight-check"><Check size={13} color="#16a34a" /></div>
                  <span>Kasol market & riverside exploration</span>
                </div>
              </div>

              <div className="spotlight-footer">
                <div className="spotlight-price-box">
                  <div className="spotlight-price-row">
                    <span className="spotlight-price">₹3,999</span>
                  </div>
                  <span className="spotlight-price-sub">per student</span>
                </div>

                <ArrowFillButton
                  as="button"
                  onClick={() => navigate('/trips/upcoming-trips')}
                  bgColor="#111111"
                  textColor="#ffffff"
                  fillBgColor="#4A35E8"
                  fillTextColor="#ffffff"
                  hoverFillBgColor="#4A35E8"
                  hoverFillTextColor="#ffffff"
                  arrowColor="#ffffff"
                  hoverArrowColor="#ffffff"
                >
                  Book A Trip
                </ArrowFillButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer matching the current website */}
      <Footer variant="compact" />

      {/* Interactive Booking / Inquiry Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
              <X size={20} />
            </button>

            {!submitted ? (
              <div>
                <div className="modal-header">
                  <span className="modal-badge">CampusIn Trips</span>
                  <h3 className="modal-title">Book Your Next Pause</h3>
                  <p className="modal-subtitle">
                    Fill in your details below and we'll confirm seat availability and itinerary instantly.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                  <div className="form-group">
                    <label>Selected Trip / Destination</label>
                    <input 
                      type="text" 
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Triund Trek, Kasol, Rishikesh"
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Your Full Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Aniket Sharma"
                      />
                    </div>
                    <div className="form-group">
                      <label>WhatsApp Number</label>
                      <input 
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>College / Campus</label>
                      <input 
                        type="text" 
                        name="college"
                        value={formData.college}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. NIT Jalandhar"
                      />
                    </div>
                    <div className="form-group">
                      <label>Group Size (Travelers)</label>
                      <select 
                        name="groupSize"
                        value={formData.groupSize}
                        onChange={handleInputChange}
                      >
                        <option value="1">Solo (1 Student)</option>
                        <option value="2-3">2-3 Friends</option>
                        <option value="4-6">4-6 Friends</option>
                        <option value="7-15">Large Group (7-15)</option>
                        <option value="15+">Full Batch / Society (15+)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Preferred Travel Dates / Month</label>
                    <input 
                      type="text" 
                      name="preferredMonth"
                      value={formData.preferredMonth}
                      onChange={handleInputChange}
                      placeholder="e.g. Upcoming Weekend or Oct 10-12"
                    />
                  </div>

                  <div className="form-group">
                    <label>Special Requests or Questions (Optional)</label>
                    <textarea 
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any specific requests, dietary preferences, or batch questions..."
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="submit" className="btn-modal-submit">
                      Submit Booking Request
                    </button>
                    <button 
                      type="button" 
                      onClick={handleWhatsAppBooking}
                      className="btn-modal-whatsapp"
                    >
                      <PhoneCall size={16} /> Fast Booking via WhatsApp
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="modal-success-state">
                <div className="success-icon-wrap">
                  <CheckCircle2 size={56} color="#16a34a" />
                </div>
                <h3>Booking Request Received!</h3>
                <p>
                  Thank you, <strong>{formData.name || 'Friend'}</strong>! Our CampusIn Trip coordinator will reach out to you via WhatsApp at <strong>{formData.phone || 'your number'}</strong> within an hour with seat availability and details.
                </p>

                <div className="success-action-btns">
                  <button 
                    onClick={handleWhatsAppBooking} 
                    className="btn-modal-whatsapp"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Open in WhatsApp Directly
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="btn-modal-close-plain"
                  >
                    Back to Trips
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Embedded Page Styles */}
      <style>{`
        .trips-page-container {
          min-height: 100vh;
          background: #fdfdfd;
          color: #111111;
          font-family: 'Outfit', sans-serif;
        }

        /* Top Nav Header */
        .trips-nav-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #edf2f7;
          padding: 14px 24px;
        }
        .trips-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .trips-nav-links {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .trips-nav-links .nav-link {
          text-decoration: none;
          color: #64748b;
          font-weight: 600;
          font-size: 0.95rem;
          transition: color 0.15s ease;
        }
        .trips-nav-links .nav-link:hover,
        .trips-nav-links .nav-link.active {
          color: #4A35E8;
        }
        .trips-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-nav-cta {
          background: #111111;
          color: #ffffff;
          border: none;
          padding: 9px 20px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .btn-nav-cta:hover {
          background: #4A35E8;
          transform: translateY(-1px);
        }
        .btn-nav-profile {
          text-decoration: none;
          color: #111111;
          font-weight: 700;
          font-size: 0.92rem;
          background: #f1f5f9;
          padding: 8px 18px;
          border-radius: 50px;
        }

        /* Hero Section (Matching User Reference) */
        .trips-hero-section {
          padding: 60px 24px 80px 24px;
          max-width: 1240px;
          margin: 0 auto;
        }
        .trips-hero-container {
          display: grid;
          grid-template-columns: 1.15fr 1.35fr;
          gap: 48px;
          align-items: center;
        }
        .trips-hero-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-right: 16px;
        }
        .trips-hero-title {
          font-size: 3.2rem;
          font-weight: 850;
          letter-spacing: -1.5px;
          color: #111111;
          margin-bottom: 24px;
          line-height: 1.15;
        }
        .trips-hero-body {
          font-size: 1.05rem;
          line-height: 1.7;
          color: #64748b;
          margin-bottom: 32px;
        }
        .trips-hero-body p {
          margin-bottom: 12px;
        }
        .trips-hero-body .body-lead {
          color: #475569;
          font-weight: 500;
          margin-bottom: 16px;
        }
        .trips-hero-body .body-space {
          color: #64748b;
        }
        .trips-hero-body .body-space strong {
          color: #1e293b;
          font-weight: 650;
        }
        .trips-hero-body .body-pause {
          color: #64748b;
          margin-top: 18px;
        }
        .trips-hero-body .body-punchline {
          color: #111111;
          font-size: 1.15rem;
          font-weight: 750;
          margin-top: 18px;
        }
        .btn-book-hero {
          background-color: #2b2b2b;
          color: #ffffff;
          border: none;
          padding: 14px 34px;
          border-radius: 12px;
          font-size: 1.02rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
          display: inline-block;
          font-family: inherit;
        }
        .btn-book-hero:hover {
          background-color: #000000;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
        }

        /* Hero Image Container matching reference */
        .trips-hero-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .trips-hero-image-cta {
          display: none;
          justify-content: center;
        }
        .trips-hero-image-card {
          width: 100%;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.12), 0 8px 16px -6px rgba(0, 0, 0, 0.05);
          background-color: #e2e8f0;
          aspect-ratio: 16 / 11;
          display: flex;
        }
        .trips-hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.6s ease;
        }
        .trips-hero-image-card:hover .trips-hero-image {
          transform: scale(1.02);
        }

        /* Content Wrapper */
        .trips-content-wrapper {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Section Headings */
        .section-header-center {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 52px auto;
        }
        .section-badge {
          display: inline-block;
          background: #f2efff;
          color: #4A35E8;
          font-size: 0.8rem;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          padding: 6px 14px;
          border-radius: 50px;
          margin-bottom: 12px;
        }
        .section-heading {
          font-size: 2.3rem;
          font-weight: 850;
          color: #111111;
          letter-spacing: -0.8px;
          margin-bottom: 14px;
        }
        .section-subtext {
          font-size: 1.05rem;
          color: #64748b;
          line-height: 1.6;
        }

        /* Pillars Section */
        .trips-pillars-section {
          padding: 70px 0 80px 0;
          background: #fafbfc;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
        }
        .trips-pillars-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .pillar-card {
          background: #ffffff;
          border: 1px solid #edf2f7;
          border-radius: 20px;
          padding: 30px 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        .pillar-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.06);
          border-color: #cbd5e1;
        }
        .pillar-icon-box {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .bg-purple-tint { background: #f2efff; }
        .bg-teal-tint { background: #e6fafa; }
        .bg-orange-tint { background: #fff7ed; }
        .bg-green-tint { background: #f0fdf4; }
        .pillar-title {
          font-size: 1.2rem;
          font-weight: 750;
          color: #111111;
          margin-bottom: 10px;
        }
        .pillar-desc {
          font-size: 0.92rem;
          color: #64748b;
          line-height: 1.6;
        }

        /* Catalog Section */
        .trips-catalog-section {
          padding: 80px 0;
        }
        .catalog-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          gap: 20px;
          flex-wrap: wrap;
        }
        .category-pills-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .category-pill {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 8px 18px;
          border-radius: 50px;
          font-size: 0.88rem;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .category-pill:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
        .category-pill.active {
          background: #4A35E8;
          color: #ffffff;
          border-color: #4A35E8;
        }

        /* Trips Cards Grid */
        .trips-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .trip-card {
          background: #ffffff;
          border: 1px solid #edf2f7;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        .trip-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px rgba(0,0,0,0.08);
          border-color: #cbd5e1;
        }
        .trip-card-image-wrap {
          position: relative;
          height: 210px;
          overflow: hidden;
          background: #e2e8f0;
        }
        .trip-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .trip-card:hover .trip-card-image {
          transform: scale(1.05);
        }
        .trip-category-tag {
          position: absolute;
          top: 14px;
          left: 14px;
          background: rgba(17, 24, 39, 0.75);
          backdrop-filter: blur(8px);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 50px;
        }
        .trip-duration-tag {
          position: absolute;
          bottom: 14px;
          right: 14px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          color: #111111;
          font-size: 0.78rem;
          font-weight: 750;
          padding: 5px 12px;
          border-radius: 50px;
          display: flex;
          align-items: center;
        }
        .trip-card-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .trip-card-pickup-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 10px;
        }
        .trip-card-pickup-info strong {
          color: #334155;
        }
        .trip-card-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #111111;
          margin-bottom: 10px;
          line-height: 1.35;
        }
        .trip-card-desc {
          font-size: 0.9rem;
          color: #64748b;
          line-height: 1.55;
          margin-bottom: 18px;
        }
        .trip-highlights-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 20px;
        }
        .trip-highlight-chip {
          background: #f8fafc;
          border: 1px solid #edf2f7;
          color: #475569;
          font-size: 0.76rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .trip-card-divider {
          height: 1px;
          background: #f1f5f9;
          margin-top: auto;
          margin-bottom: 16px;
        }
        .trip-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .trip-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .trip-price {
          font-size: 1.35rem;
          font-weight: 850;
          color: #4A35E8;
        }
        .trip-original-price {
          font-size: 0.9rem;
          color: #94a3b8;
          text-decoration: line-through;
        }
        .trip-price-note {
          display: block;
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .btn-card-book {
          background: #111111;
          color: #ffffff;
          border: none;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .btn-card-book:hover {
          background: #4A35E8;
          transform: translateY(-1px);
        }

        /* Upcoming Trips Section */
        .trips-upcoming-section {
          padding: 80px 0;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
        }

        /* Spotlight Card — two-column layout */
        .trip-spotlight-card {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 0;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.07);
        }

        /* Image column */
        .spotlight-image-col {
          position: relative;
          min-height: 420px;
          overflow: hidden;
          background: #e2e8f0;
        }
        .spotlight-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.6s ease;
        }
        .trip-spotlight-card:hover .spotlight-image {
          transform: scale(1.03);
        }
        .spotlight-badge-top {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          color: #16a34a;
          font-size: 0.78rem;
          font-weight: 750;
          padding: 6px 14px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .live-dot-pulse {
          width: 8px;
          height: 8px;
          background: #16a34a;
          border-radius: 50%;
          display: inline-block;
          animation: livePulse 1.5s infinite;
        }
        @keyframes livePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .spotlight-tag-bottom {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(17, 17, 17, 0.7);
          backdrop-filter: blur(8px);
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 50px;
          display: flex;
          align-items: center;
        }

        /* Content column */
        .spotlight-content-col {
          padding: 40px 36px;
          display: flex;
          flex-direction: column;
        }
        .spotlight-pickup-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f2efff;
          color: #4A35E8;
          font-size: 0.82rem;
          font-weight: 700;
          padding: 5px 13px;
          border-radius: 50px;
          width: fit-content;
          margin-bottom: 16px;
        }
        .spotlight-title {
          font-size: 1.9rem;
          font-weight: 850;
          color: #111111;
          letter-spacing: -0.6px;
          margin-bottom: 14px;
          line-height: 1.25;
        }
        .spotlight-desc {
          font-size: 0.97rem;
          color: #64748b;
          line-height: 1.65;
          margin-bottom: 24px;
        }

        /* Highlights grid */
        .spotlight-highlights-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 16px;
          margin-bottom: 28px;
        }
        .highlight-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.875rem;
          color: #334155;
          line-height: 1.4;
        }
        .highlight-check {
          width: 20px;
          height: 20px;
          background: #f0fdf4;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* Spotlight footer: price + CTA */
        .spotlight-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
          flex-wrap: wrap;
        }
        .spotlight-price-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .spotlight-price-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .spotlight-price {
          font-size: 1.9rem;
          font-weight: 900;
          color: #4A35E8;
          letter-spacing: -1px;
        }
        .spotlight-original-price {
          font-size: 1rem;
          color: #94a3b8;
          text-decoration: line-through;
        }
        .spotlight-price-sub {
          font-size: 0.78rem;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Responsive: spotlight stacks on mobile */
        @media (max-width: 900px) {
          .trip-spotlight-card {
            grid-template-columns: 1fr;
          }
          .spotlight-image-col {
            min-height: 280px;
          }
          .spotlight-content-col {
            padding: 28px 24px;
          }
          .spotlight-title {
            font-size: 1.5rem;
          }
        }

        /* Modal Styles */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(6px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content {
          background: #ffffff;
          border-radius: 24px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 36px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalAppear 0.25s ease-out;
        }
        @keyframes modalAppear {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f1f5f9;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.15s ease;
        }
        .modal-close-btn:hover {
          background: #e2e8f0;
          color: #111111;
        }
        .modal-header {
          margin-bottom: 24px;
        }
        .modal-badge {
          font-size: 0.75rem;
          font-weight: 750;
          color: #4A35E8;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          display: inline-block;
          margin-bottom: 6px;
        }
        .modal-title {
          font-size: 1.6rem;
          font-weight: 850;
          color: #111111;
          margin-bottom: 6px;
        }
        .modal-subtitle {
          font-size: 0.92rem;
          color: #64748b;
          line-height: 1.5;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.95rem;
          font-family: inherit;
          color: #111111;
          background: #f8fafc;
          transition: border-color 0.2s ease;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #4A35E8;
          outline: none;
          background: #ffffff;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 12px;
        }
        .btn-modal-submit {
          background: #4A35E8;
          color: #ffffff;
          border: none;
          padding: 13px;
          border-radius: 12px;
          font-size: 0.98rem;
          font-weight: 750;
          cursor: pointer;
          transition: background 0.2s ease;
          font-family: inherit;
        }
        .btn-modal-submit:hover {
          background: #3220A8;
        }
        .btn-modal-whatsapp {
          background: #25D366;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s ease;
          font-family: inherit;
        }
        .btn-modal-whatsapp:hover {
          background: #1ebc57;
        }
        .modal-success-state {
          text-align: center;
          padding: 20px 10px;
        }
        .success-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f0fdf4;
          margin-bottom: 20px;
        }
        .modal-success-state h3 {
          font-size: 1.55rem;
          font-weight: 850;
          color: #111111;
          margin-bottom: 12px;
        }
        .modal-success-state p {
          color: #64748b;
          font-size: 0.98rem;
          line-height: 1.6;
          margin-bottom: 28px;
        }
        .success-action-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .btn-modal-close-plain {
          background: transparent;
          border: none;
          color: #64748b;
          font-weight: 650;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 8px;
        }
        .btn-modal-close-plain:hover {
          color: #111111;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .trips-hero-container {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .trips-hero-left {
            padding-right: 0;
            text-align: left;
          }
          .trips-pillars-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .trips-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .trips-nav-header {
            padding: 12px 16px;
          }
          .trips-nav-inner {
            flex-wrap: wrap;
            row-gap: 8px;
          }
          .trips-nav-actions {
            gap: 8px;
          }
          .btn-nav-profile {
            padding: 7px 14px;
            font-size: 0.85rem;
          }
          .trips-nav-links {
            display: none;
          }
          .trips-content-wrapper {
            padding: 0 16px;
          }
          .trips-hero-section {
            padding: 36px 16px 56px 16px;
          }
          .trips-hero-left {
            align-items: center;
            text-align: center;
          }
          .trips-hero-title {
            font-size: 2.3rem;
          }
          .trips-hero-action {
            display: none;
          }
          .trips-hero-image-cta {
            display: flex;
            justify-content: center;
            margin-top: 20px;
          }
          .section-header-center {
            max-width: 100%;
          }
          .section-heading {
            font-size: 1.8rem;
          }
          .section-subtext {
            font-size: 0.95rem;
          }
          .trips-pillars-grid {
            grid-template-columns: 1fr;
          }
          .trips-cards-grid {
            grid-template-columns: 1fr;
          }
          .catalog-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .trips-upcoming-section {
            padding: 56px 0;
          }
          .spotlight-content-col {
            padding: 24px 20px;
          }
          .spotlight-highlights-grid {
            grid-template-columns: 1fr;
          }
          .spotlight-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .spotlight-footer .obsidian-arrow-fill-btn {
            width: 100%;
            justify-content: center;
          }
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
          .modal-content {
            padding: 24px;
          }
        }

        @media (max-width: 480px) {
          .trips-nav-header {
            padding: 10px 14px;
          }
          .trips-hero-section {
            padding: 28px 14px 44px 14px;
          }
          .trips-hero-title {
            font-size: 1.7rem;
            letter-spacing: -0.8px;
          }
          .trips-hero-image-card {
            border-radius: 18px;
          }
          .section-badge {
            font-size: 0.72rem;
            padding: 5px 12px;
          }
          .section-heading {
            font-size: 1.5rem;
          }
          .spotlight-image-col {
            min-height: 220px;
          }
          .spotlight-badge-top,
          .spotlight-tag-bottom {
            font-size: 0.7rem;
            padding: 5px 10px;
            white-space: normal;
            max-width: calc(100% - 32px);
          }
          .spotlight-title {
            font-size: 1.3rem;
          }
          .spotlight-desc {
            font-size: 0.9rem;
          }
          .spotlight-price {
            font-size: 1.5rem;
          }
          .modal-content {
            padding: 20px;
            border-radius: 18px;
          }
          .modal-title {
            font-size: 1.35rem;
          }
        }
      `}</style>
    </div>
  );
}
