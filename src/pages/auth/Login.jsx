import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff, Lock } from 'lucide-react';

export default function Login() {
  const { login, logout, loading, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  useEffect(() => {
    const redirectMsg = localStorage.getItem('authRedirectMessage');
    if (redirectMsg) {
      setShowSessionExpiredModal(true);
      localStorage.removeItem('authRedirectMessage');
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'delivery_partner') {
        logout();
        setError('Access Denied. Please use the Delivery Partner Portal to login.');
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(user.role === 'vendor' ? '/vendor' : '/restaurants', { replace: true });
      }
    }
  }, [user, navigate, logout]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'delivery_partner') {
          setError('Access Denied. Please use the Delivery Partner Portal to login.');
          await logout();
        } else if (payload.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate(payload.role === 'vendor' ? '/vendor' : '/restaurants', { replace: true });
        }
      }
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="swiggy-auth-page-bg animate-fade-in">
      {/* Session Expired Modal */}
      {showSessionExpiredModal && (
        <div className="session-expired-modal-overlay">
          <div className="session-expired-modal-card animate-scale-in">
            <div className="session-expired-icon-wrapper">
              <Lock className="session-expired-icon animate-bounce" size={28} />
            </div>
            <h2 className="session-expired-title">Session Expired</h2>
            <p className="session-expired-text">
              For your security, your session has timed out. Please log in again to continue ordering.
            </p>
            <button 
              className="session-expired-btn"
              onClick={() => setShowSessionExpiredModal(false)}
            >
              Okay, Log In
            </button>
          </div>
        </div>
      )}

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
            <h1 className="swiggy-auth-title">Login</h1>
            <p className="swiggy-auth-subtitle">
              or <Link to="/register" className="swiggy-auth-link">create an account</Link>
            </p>
            <p className="swiggy-auth-subtitle" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
              Are you a Delivery Partner? <Link to="/delivery/login" className="swiggy-auth-link" style={{ color: '#06c169' }}>Access Portal</Link>
            </p>
            <div className="swiggy-title-line"></div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="swiggy-auth-form">
          {error && (
            <p className="swiggy-auth-error-msg animate-shake">
              {error}
            </p>
          )}

          {/* Stacked Inputs Container */}
          <div className="swiggy-inputs-stack">
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
            <div className="swiggy-input-container">
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
          </div>

          <Link to="#" className="swiggy-forgot-password hover-scale">
            Forgot Password?
          </Link>

          {/* Login Submit Button */}
          <button 
            className="swiggy-auth-submit-btn hover-lift" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        {/* Footer info text */}
        <p className="swiggy-auth-footer-text">
          By clicking on Login, I accept the <span className="bold-text">Terms & Conditions</span> & <span className="bold-text">Privacy Policy</span>
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

        /* Stacked Inputs styling */
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

        .swiggy-forgot-password {
          align-self: flex-end;
          color: #b31522;
          font-size: 0.85rem;
          font-weight: 750;
          text-decoration: none;
          margin-bottom: 24px;
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

        /* Session Expired Modal Styles */
        .session-expired-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(179, 21, 34, 0.04);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .session-expired-modal-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 32px 24px;
          width: 90%;
          max-width: 360px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .session-expired-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #fff5f5;
          color: #b31522;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .session-expired-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0 0 10px 0;
        }

        .session-expired-text {
          font-size: 0.9rem;
          color: #7e7e7e;
          line-height: 1.5;
          margin: 0 0 24px 0;
        }

        .session-expired-btn {
          width: 100%;
          background: #b31522;
          color: #ffffff;
          border: none;
          padding: 14px;
          font-size: 0.95rem;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(179, 21, 34, 0.2);
        }

        .session-expired-btn:hover {
          background: #960f1a;
          box-shadow: 0 6px 16px rgba(179, 21, 34, 0.3);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
