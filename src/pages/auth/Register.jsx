import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { register, loading, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', role: 'user' });
  const [msg, setMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'delivery_partner') {
        navigate('/delivery/dashboard', { replace: true });
      } else {
        navigate(user.role === 'vendor' ? '/vendor' : '/restaurants', { replace: true });
      }
    }
  }, [user, navigate]);

  if (user) {
    return null;
  }

  const handleGoogleSignIn = () => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.password !== form.confirmPassword) {
      setMsg({ success: false, error: 'Passwords do not match' });
      return;
    }
    const result = await register(form.username, form.email, form.password, form.role);
    setMsg(result);
    if (result.success) {
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
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

        {/* Header Block with Title */}
        <div className="swiggy-auth-header-row">
          <div className="swiggy-auth-title-col">
            <h1 className="swiggy-auth-title">Sign up</h1>
            <p className="swiggy-auth-subtitle">
              or <Link to="/login" className="swiggy-auth-link">login to your account</Link>
            </p>
            <p className="swiggy-auth-subtitle" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
              Are you a Delivery Partner? <Link to="/delivery/register" className="swiggy-auth-link" style={{ color: '#06c169' }}>Register here</Link>
            </p>
            <div className="swiggy-title-line"></div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="swiggy-auth-form">
          {msg && (
            <p className={`swiggy-auth-error-msg ${msg.success ? 'success-style' : ''} animate-shake`}>
              {msg.success ? 'Registration successful! Redirecting to verify email...' : msg.error}
            </p>
          )}

          {/* Stacked Inputs Container */}
          <div className="swiggy-inputs-stack">
            
            {/* Custom Tab Role Selector */}
            <div className="swiggy-role-selector">
              <button 
                type="button" 
                onClick={() => setForm(p => ({ ...p, role: 'user' }))}
                className={`swiggy-role-btn ${form.role === 'user' ? 'active' : ''}`}
              >
                Customer
              </button>
              <button 
                type="button" 
                onClick={() => setForm(p => ({ ...p, role: 'vendor' }))}
                className={`swiggy-role-btn ${form.role === 'vendor' ? 'active' : ''}`}
              >
                Vendor Partner
              </button>
            </div>

            {/* Username Input */}
            <div className="swiggy-input-container border-bottom-none">
              <input 
                className="swiggy-input" 
                type="text" 
                id="username"
                placeholder=" " 
                value={form.username} 
                onChange={(e) => setForm({ ...form, username: e.target.value })} 
                required 
              />
              <label htmlFor="username" className="swiggy-label">Full Name</label>
            </div>

            {/* Email Input */}
            <div className="swiggy-input-container border-bottom-none">
              <input 
                className="swiggy-input" 
                type="email" 
                id="email"
                placeholder=" " 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                required 
              />
              <label htmlFor="email" className="swiggy-label">Email Address</label>
            </div>

            {/* Password Input */}
            <div className="swiggy-input-container border-bottom-none">
              <input 
                className="swiggy-input" 
                type={showPassword ? "text" : "password"} 
                id="password"
                placeholder=" " 
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
                required 
              />
              <label htmlFor="password" className="swiggy-label">Password</label>
              
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
                id="confirmPassword"
                placeholder=" " 
                value={form.confirmPassword} 
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} 
                required 
              />
              <label htmlFor="confirmPassword" className="swiggy-label">Confirm Password</label>
              
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
            className="swiggy-auth-submit-btn hover-lift" 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '24px' }}
          >
            {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
          </button>

          {/* Google Register Option */}
          <div className="auth-divider">
            <span className="auth-divider-line"></span>
            <span className="auth-divider-text">or</span>
            <span className="auth-divider-line"></span>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="swiggy-google-btn hover-scale"
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        {/* Footer info text */}
        <p className="swiggy-auth-footer-text">
          By clicking on Sign up, I accept the <span className="bold-text">Terms & Conditions</span> & <span className="bold-text">Privacy Policy</span>
        </p>
      </div>

      {/* Embedded Swiggy Auth Styles */}
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
          border-radius: 8px;
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
          margin-bottom: 24px;
          transition: transform 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .swiggy-close-btn:hover {
          color: #b31522;
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
          color: #b31522;
          text-decoration: none;
          font-weight: 750;
          transition: opacity 0.2s;
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

        .swiggy-auth-icon-col {
          margin-left: 16px;
        }

        .swiggy-food-circle {
          width: 100px;
          height: 100px;
          background: #fff5f5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
        }

        .swiggy-food-img {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 50%;
        }

        .swiggy-auth-form {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .swiggy-auth-error-msg {
          background: #fff5f5;
          color: #b31522;
          padding: 12px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 20px;
          text-align: center;
          border-radius: 4px;
          border: 1px solid rgba(179, 21, 34, 0.1);
        }

        .swiggy-auth-error-msg.success-style {
          background: #f0fdf4;
          color: #15803d;
          border-color: rgba(21, 128, 61, 0.1);
        }

        /* Stacked Inputs styling */
        .swiggy-inputs-stack {
          display: flex;
          flex-direction: column;
          margin-bottom: 12px;
        }

        .swiggy-role-selector {
          display: flex;
          border: 1px solid #d4d5d9;
          border-bottom: none;
          background: #ffffff;
        }

        .swiggy-role-btn {
          flex: 1;
          border: none;
          background: transparent;
          padding: 14px;
          font-size: 0.9rem;
          font-weight: 750;
          color: #7e808c;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .swiggy-role-btn.active {
          background: #fff5f5;
          color: #b31522;
          border-bottom: 2px solid #b31522;
        }

        .swiggy-input-container {
          position: relative;
          background: #ffffff;
          border: 1px solid #d4d5d9;
          transition: all 0.2s ease;
        }

        .border-bottom-none {
          border-bottom: none;
        }

        .swiggy-input-container:focus-within {
          border-color: #b31522;
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

        /* Floating text effects */
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
          color: #b31522;
        }

        .swiggy-auth-submit-btn {
          width: 100%;
          background: #b31522;
          color: #ffffff;
          border: none;
          padding: 16px;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(179, 21, 34, 0.2);
          text-align: center;
        }

        .swiggy-auth-submit-btn:hover {
          background: #960f1a;
          box-shadow: 0 6px 20px rgba(179, 21, 34, 0.3);
        }

        .swiggy-auth-submit-btn:disabled {
          background: #d4d5d9;
          color: #ffffff;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Divider Styling */
        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 16px 0;
        }

        .auth-divider-line {
          flex: 1;
          height: 1px;
          background-color: #e2e8f0;
        }

        .auth-divider-text {
          margin: 0 10px;
          color: #7e808c;
          font-size: 0.85rem;
          font-weight: 550;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Google Button Styling */
        .swiggy-google-btn {
          width: 100%;
          background: #ffffff;
          color: #282c3f;
          border: 1px solid #d4d5d9;
          padding: 14px;
          font-size: 0.95rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
          border-radius: 4px;
        }

        .swiggy-google-btn:hover {
          background: #f8fafc;
          border-color: #a0aec0;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }

        .google-icon {
          flex-shrink: 0;
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
