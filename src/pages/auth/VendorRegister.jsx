/* eslint-disable */
import { X, Eye, EyeOff, Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';


export default function VendorRegister() {
  const { register, loading, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [msg, setMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'vendor') {
        navigate('/vendor', { replace: true });
      }
    }
  }, [user, navigate]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.password !== form.confirmPassword) {
      setMsg({ success: false, error: 'Passwords do not match' });
      return;
    }
    const result = await register(form.username, form.email, form.password, 'vendor');
    setMsg(result);
    if (result.success) {
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}&role=vendor`);
      }, 2000);
    }
  };

  return (
    <div className="swiggy-auth-page-bg animate-fade-in">
      <div className="swiggy-auth-card animate-scale-in">
        {/* Close Button */}
        <button 
          onClick={() => navigate('/')} 
          className="swiggy-close-btn hover-scale"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Vendor Badge */}
        <div className="vendor-portal-badge">
          <Store size={16} />
          <span>Vendor Partner Portal</span>
        </div>

        {/* Header Block with Title */}
        <div className="swiggy-auth-header-row">
          <div className="swiggy-auth-title-col">
            <h1 className="swiggy-auth-title">Partner Sign Up</h1>
            <p className="swiggy-auth-subtitle">
              or <Link to="/vendor/login" className="swiggy-auth-link vendor-link">login to your vendor account</Link>
            </p>
            <div className="swiggy-title-line vendor-line"></div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="swiggy-auth-form">
          {msg && (
            <p className={`swiggy-auth-error-msg ${msg.success ? 'success-style' : ''} animate-shake`}>
              {msg.success ? 'Vendor account created! Redirecting to verify email...' : msg.error}
            </p>
          )}

          {/* Stacked Inputs Container */}
          <div className="swiggy-inputs-stack">
            {/* Username Input */}
            <div className="swiggy-input-container border-bottom-none">
              <input 
                className="swiggy-input" 
                type="text" 
                id="vendor-username"
                placeholder=" " 
                value={form.username} 
                onChange={(e) => setForm({ ...form, username: e.target.value })} 
                required 
              />
              <label htmlFor="vendor-username" className="swiggy-label">Restaurant / Business Name</label>
            </div>

            {/* Email Input */}
            <div className="swiggy-input-container border-bottom-none">
              <input 
                className="swiggy-input" 
                type="email" 
                id="vendor-email"
                placeholder=" " 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                required 
              />
              <label htmlFor="vendor-email" className="swiggy-label">Business Email Address</label>
            </div>

            {/* Password Input */}
            <div className="swiggy-input-container border-bottom-none">
              <input 
                className="swiggy-input" 
                type={showPassword ? "text" : "password"} 
                id="vendor-password"
                placeholder=" " 
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
                required 
              />
              <label htmlFor="vendor-password" className="swiggy-label">Password</label>
              
              <button 
                type="button" 
                className="swiggy-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {/* Confirm Password Input */}
            <div className="swiggy-input-container">
              <input 
                className="swiggy-input" 
                type={showConfirmPassword ? "text" : "password"} 
                id="vendor-confirmPassword"
                placeholder=" " 
                value={form.confirmPassword} 
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} 
                required 
              />
              <label htmlFor="vendor-confirmPassword" className="swiggy-label">Confirm Password</label>
              
              <button 
                type="button" 
                className="swiggy-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            className="swiggy-auth-submit-btn vendor-accent-btn hover-lift" 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '24px' }}
          >
            {loading ? 'CREATING ACCOUNT...' : 'REGISTER AS VENDOR'}
          </button>
        </form>

        {/* Footer info text */}
        <p className="swiggy-auth-footer-text">
          By clicking on Sign up, I accept the <span className="bold-text">Terms & Conditions</span> & <span className="bold-text">Privacy Policy</span>
        </p>

        <p className="swiggy-auth-footer-text" style={{ marginTop: '8px' }}>
          Not a vendor? <Link to="/register" className="swiggy-auth-link vendor-link" style={{ fontSize: '0.75rem' }}>Sign up as a customer</Link>
        </p>
      </div>

      {/* Embedded Vendor Auth Styles */}
      <style>{`
        .swiggy-auth-page-bg {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          padding: 20px;
          font-family: 'Outfit', sans-serif;
        }

        .swiggy-auth-card {
          width: 100%;
          max-width: 480px;
          padding: 40px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
          border: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .swiggy-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #282c3f;
          align-self: flex-start;
          padding: 4px;
          margin-bottom: 16px;
          transition: transform 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .swiggy-close-btn:hover {
          color: #15803d;
        }

        .vendor-portal-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f0fdf4;
          color: #15803d;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 20px;
          align-self: flex-start;
          letter-spacing: 0.3px;
        }

        .swiggy-auth-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 36px;
        }

        .swiggy-auth-title-col {
          flex: 1;
        }

        .swiggy-auth-title {
          font-size: 2rem;
          font-weight: 750;
          color: #282c3f;
          margin: 0 0 6px 0;
          letter-spacing: -0.5px;
        }

        .swiggy-auth-subtitle {
          font-size: 0.95rem;
          color: #686b78;
          margin: 0;
        }

        .swiggy-auth-link {
          text-decoration: none;
          font-weight: 750;
          transition: opacity 0.2s;
        }

        .vendor-link {
          color: #15803d;
        }

        .swiggy-auth-link:hover {
          opacity: 0.85;
        }

        .swiggy-title-line {
          width: 32px;
          height: 2px;
          background: #282c3f;
          margin-top: 16px;
        }

        .vendor-line {
          background: #15803d;
        }

        .swiggy-auth-form {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .swiggy-auth-error-msg {
          background: #f0fdf4;
          color: #15803d;
          padding: 12px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 20px;
          text-align: center;
          border-radius: 4px;
          border: 1px solid rgba(21, 128, 61, 0.1);
        }

        .swiggy-auth-error-msg.success-style {
          background: #f0fdf4;
          color: #15803d;
          border-color: rgba(21, 128, 61, 0.1);
        }

        .swiggy-inputs-stack {
          display: flex;
          flex-direction: column;
          margin-bottom: 12px;
        }

        .swiggy-input-container {
          position: relative;
          background: #ffffff;
          border: 1px solid #d4d5d9;
          transition: all 0.2s ease;
        }

        .swiggy-inputs-stack .swiggy-input-container:first-child {
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }

        .swiggy-inputs-stack .swiggy-input-container:last-child {
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }

        .border-bottom-none {
          border-bottom: none;
        }

        .swiggy-input-container:focus-within {
          border-color: #15803d;
          box-shadow: 0 1px 10px rgba(0, 0, 0, 0.04);
          z-index: 10;
        }

        .swiggy-input {
          width: 100%;
          border: none;
          outline: none;
          font-size: 1.05rem;
          font-weight: 650;
          padding: 24px 16px 10px 16px;
          color: #282c3f;
          background: transparent;
          font-family: inherit;
        }

        .swiggy-label {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          font-weight: 550;
          color: #93959f;
          pointer-events: none;
          transition: all 0.2s ease;
        }

        .swiggy-input:focus ~ .swiggy-label,
        .swiggy-input:not(:placeholder-shown) ~ .swiggy-label {
          top: 14px;
          font-size: 0.75rem;
          color: #93959f;
        }

        .swiggy-password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #7e808c;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .swiggy-password-toggle:hover {
          color: #15803d;
        }

        .swiggy-auth-submit-btn {
          width: 100%;
          color: #ffffff;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: center;
        }

        .vendor-accent-btn {
          background: #15803d;
          box-shadow: 0 4px 15px rgba(21, 128, 61, 0.2);
        }

        .vendor-accent-btn:hover {
          background: #166534;
          box-shadow: 0 6px 20px rgba(21, 128, 61, 0.3);
        }

        .swiggy-auth-submit-btn:disabled {
          background: #d4d5d9;
          color: #ffffff;
          cursor: not-allowed;
          box-shadow: none;
        }

        .swiggy-auth-footer-text {
          font-size: 0.75rem;
          color: #7e808c;
          line-height: 1.4;
          margin: 16px 0 0 0;
        }

        .swiggy-auth-footer-text .bold-text {
          color: #282c3f;
          font-weight: 700;
        }

        @media (max-width: 600px) {
          .swiggy-auth-page-bg {
            padding: 0;
            background: #ffffff;
          }
          .swiggy-auth-card {
            border: none;
            box-shadow: none;
            border-radius: 0;
            min-height: 100vh;
            padding: 32px 24px;
          }
        }
      `}</style>
    </div>
  );
}
