import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function WhoWeAre() {
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
          <h1 style={{ fontSize: '2.2rem', fontWeight: 850, color: '#111111', marginBottom: '8px' }}>Who We Are</h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#4a5568', lineHeight: 1.6, fontSize: '1rem', marginTop: '32px' }}>
            <section>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111111', marginBottom: '16px' }}>Built by students who know what "I'll do it later" means.</h3>
              
              <p style={{ marginBottom: '16px' }}>CampusIn is a student first platform born at <strong>NIT Jalandhar</strong>, built to make everyday campus life a little easier.</p>
              
              <p style={{ marginBottom: '16px' }}>From <strong>stationery and NITJ merchandise to electronics, gifts, and everyday essentials</strong>, we bring the things you need closer to you without turning every small purchase into another task on your to do list.</p>
              
              <p style={{ marginBottom: '16px' }}>We're building CampusIn because student life already has enough things to worry about.</p>
              
              <p style={{ marginBottom: '16px' }}><strong>Assignments. Attendance. Deadlines. Group projects where only one person actually works.</strong></p>
              
              <p style={{ marginBottom: '16px' }}>Shopping shouldn't be one of them.</p>
              
              <p style={{ marginBottom: '16px' }}>So, we're making it <strong>simple, convenient, and actually useful for students</strong> because we're students too, and we've been on both sides of the "bro, where can I get this?" conversation.</p>
              
              <p style={{ marginTop: '32px', fontSize: '1.1rem', color: '#4A35E8' }}><strong>CampusIn. Your Campus. Your Store. Less hassle.</strong></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
