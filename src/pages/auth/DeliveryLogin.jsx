import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff, Bike } from 'lucide-react';

export default function DeliveryLogin() {
  const { login, logout, loading, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'delivery_partner') {
        navigate('/delivery/dashboard', { replace: true });
      } else {
        // Redirect normal users who are already logged in to their respective portals
        navigate(user.role === 'vendor' ? '/vendor' : '/restaurants', { replace: true });
      }
    }
  }, [user, navigate]);

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
        if (payload.role !== 'delivery_partner') {
          // Block non-delivery partners and clear their session immediately
          setError('Access Denied. This portal is strictly for registered Delivery Partners.');
          await logout();
        } else {
          navigate('/delivery/dashboard', { replace: true });
        }
      }
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="delivery-auth-page-bg animate-fade-in">
      <div className="delivery-auth-card animate-scale-in">
        {/* Close Button */}
        <button 
          onClick={() => navigate('/')} 
          className="delivery-close-btn hover-scale"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Header Block with Title */}
        <div className="delivery-auth-header-row">
          <div className="delivery-auth-title-col">
            <div className="delivery-portal-badge">
              <Bike size={16} />
              <span>Delivery Partner Portal</span>
            </div>
            <h1 className="delivery-auth-title">Partner Login</h1>
            <p className="delivery-auth-subtitle">
              or <Link to="/delivery/register" className="delivery-auth-link">become a partner</Link>
            </p>
            <div className="delivery-title-line"></div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="delivery-auth-form">
          {error && (
            <p className="delivery-auth-error-msg animate-shake">
              {error}
            </p>
          )}

          {/* Stacked Inputs Container */}
          <div className="delivery-inputs-stack">
            {/* Email Input */}
            <div className="delivery-input-container border-bottom-none">
              <input 
                className="delivery-input" 
                type="email" 
                id="email"
                placeholder=" " 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                required 
              />
              <label htmlFor="email" className="delivery-label">Email Address</label>
            </div>

            {/* Password Input */}
            <div className="delivery-input-container">
              <input 
                className="delivery-input" 
                type={showPassword ? "text" : "password"} 
                id="password"
                placeholder=" " 
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
                required 
              />
              <label htmlFor="password" className="delivery-label">Password</label>
              
              <button 
                type="button" 
                className="delivery-password-toggle"
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

          <Link to="#" className="delivery-forgot-password hover-scale">
            Forgot Password?
          </Link>

          {/* Submit Button */}
          <button 
            className="delivery-auth-submit-btn hover-lift" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'LOGGING IN...' : 'LOGIN TO PORTAL'}
          </button>
        </form>

        {/* Footer info text */}
        <p className="delivery-auth-footer-text">
          By logging in, I accept the <span className="bold-text">Delivery Partner Terms & Conditions</span> & <span className="bold-text">Privacy Policy</span>
        </p>
      </div>

      {/* Embedded Delivery Auth Styles */}
      <style>{`
        .delivery-auth-page-bg {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f4fbf7; /* Light greenish bg for delivery theme */
          padding: 20px;
          font-family: 'Outfit', sans-serif;
        }

        .delivery-auth-card {
          width: 100%;
          max-width: 480px;
          padding: 40px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(6, 193, 105, 0.05);
          border: 1px solid #e3f2e9;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .delivery-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #282c3f;
          align-self: flex-start;
          padding: 4px;
          margin-bottom: 20px;
          transition: transform 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delivery-close-btn:hover {
          color: #06c169;
        }

        .delivery-auth-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .delivery-auth-title-col {
          flex: 1;
        }

        .delivery-portal-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #e6f9f0;
          color: #06c169;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 800;
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .delivery-auth-title {
          font-size: 2rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 6px 0;
          letter-spacing: -0.5px;
        }

        .delivery-auth-subtitle {
          font-size: 0.95rem;
          color: #6b7280;
          margin: 0;
        }

        .delivery-auth-link {
          color: #06c169;
          text-decoration: none;
          font-weight: 750;
          transition: opacity 0.2s;
        }

        .delivery-auth-link:hover {
          opacity: 0.85;
        }

        .delivery-title-line {
          width: 36px;
          height: 3px;
          background: #06c169;
          margin-top: 14px;
          border-radius: 2px;
        }

        .delivery-auth-form {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .delivery-auth-error-msg {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 20px;
          text-align: center;
          border-radius: 6px;
          border: 1px solid rgba(220, 38, 38, 0.1);
        }

        .delivery-inputs-stack {
          display: flex;
          flex-direction: column;
          margin-bottom: 12px;
        }

        .delivery-input-container {
          position: relative;
          background: #ffffff;
          border: 1px solid #d1d5db;
          transition: all 0.2s ease;
        }

        .border-bottom-none {
          border-bottom: none;
        }

        .delivery-input-container:focus-within {
          border-color: #06c169;
          box-shadow: 0 1px 10px rgba(6, 193, 105, 0.05);
          z-index: 10;
        }

        .delivery-input {
          width: 100%;
          border: none;
          outline: none;
          font-size: 1.05rem;
          font-weight: 600;
          padding: 24px 16px 10px 16px;
          color: #111827;
          background: transparent;
          font-family: inherit;
        }

        .delivery-label {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          font-weight: 500;
          color: #9ca3af;
          pointer-events: none;
          transition: all 0.2s ease;
        }

        .delivery-input:focus ~ .delivery-label,
        .delivery-input:not(:placeholder-shown) ~ .delivery-label {
          top: 14px;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .delivery-password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .delivery-password-toggle:hover {
          color: #06c169;
        }

        .delivery-forgot-password {
          align-self: flex-end;
          color: #06c169;
          font-size: 0.85rem;
          font-weight: 750;
          text-decoration: none;
          margin-bottom: 24px;
        }

        .delivery-auth-submit-btn {
          width: 100%;
          background: #06c169;
          color: #ffffff;
          border: none;
          padding: 16px;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(6, 193, 105, 0.2);
          border-radius: 8px;
          text-align: center;
        }

        .delivery-auth-submit-btn:hover {
          background: #05a85c;
          box-shadow: 0 6px 20px rgba(6, 193, 105, 0.3);
        }

        .delivery-auth-submit-btn:disabled {
          background: #d1d5db;
          color: #9ca3af;
          cursor: not-allowed;
          box-shadow: none;
        }

        .delivery-auth-footer-text {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.4;
          margin: 20px 0 0 0;
          text-align: center;
        }

        .delivery-auth-footer-text .bold-text {
          color: #111827;
          font-weight: 700;
        }

        @media (max-width: 600px) {
          .delivery-auth-page-bg {
            padding: 0;
            background: #ffffff;
          }
          .delivery-auth-card {
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
