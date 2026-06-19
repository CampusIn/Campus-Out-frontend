import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function VerifyEmail() {
  const { verifyEmail, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState(null);
  const [timeLeft, setTimeLeft] = useState(28); // 28 seconds timer

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (otp.length < 6) {
      setMsg({ success: false, error: 'Please enter a 6-digit OTP code' });
      return;
    }
    
    const result = await verifyEmail(email, otp);
    setMsg(result);
    if (result.success) {
      setTimeout(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const role = JSON.parse(atob(token.split('.')[1])).role;
          navigate(role === 'vendor' ? '/vendor' : '/restaurants', { replace: true });
        }
      }, 1000);
    }
  };

  const handleResend = () => {
    if (timeLeft > 0) return;
    setMsg({ success: true, message: 'OTP resent successfully!' });
    setTimeLeft(30);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="swiggy-auth-page-bg animate-fade-in">
      <div className="swiggy-auth-card animate-scale-in">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="swiggy-close-btn hover-scale"
          aria-label="Back"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Header Block with Title and Food Icon */}
        <div className="swiggy-auth-header-row">
          <div className="swiggy-auth-title-col">
            <h1 className="swiggy-auth-title">Enter OTP</h1>
            <p className="swiggy-auth-subtitle">
              We've sent an OTP to your email address.
            </p>
            <div className="swiggy-title-line"></div>
          </div>
          <div className="swiggy-auth-icon-col">
            <div className="swiggy-food-circle">
              <img 
                src="https://images.unsplash.com/photo-1626700051175-6518c4793f4f?auto=format&fit=crop&w=120&q=80" 
                alt="Burrito Roll" 
                className="swiggy-food-img"
              />
            </div>
          </div>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="swiggy-auth-form">
          {msg && (
            <p className={`swiggy-auth-error-msg ${msg.success ? 'success-style' : ''} animate-shake`}>
              {msg.success ? (msg.message || 'Verification successful!') : msg.error}
            </p>
          )}

          {/* Stacked Inputs Container */}
          <div className="swiggy-inputs-stack">
            {/* Email Box (Read-only) */}
            <div className="swiggy-input-container border-bottom-none disabled-style">
              <input 
                className="swiggy-input" 
                type="text" 
                id="emailDisplay"
                placeholder=" "
                value={email}
                disabled
              />
              <label htmlFor="emailDisplay" className="swiggy-label">Email Address</label>
            </div>

            {/* OTP Input Box */}
            <div className="swiggy-input-container">
              <input 
                className="swiggy-input" 
                type="text" 
                id="otpInput"
                maxLength="6"
                placeholder=" "
                value={otp}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^[0-9]+$/.test(val)) {
                    setOtp(val);
                  }
                }}
                required 
                autoFocus
              />
              <label htmlFor="otpInput" className="swiggy-label">One time password</label>
            </div>
          </div>

          {/* Timer and Resend Row */}
          <div className="swiggy-timer-row">
            {timeLeft > 0 ? (
              <span className="swiggy-timer-text">
                Resend code in <strong className="bold-text">{formatTime(timeLeft)}</strong>
              </span>
            ) : (
              <button 
                type="button" 
                onClick={handleResend}
                className="swiggy-resend-btn hover-scale"
              >
                Resend OTP
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button 
            className="swiggy-auth-submit-btn hover-lift" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'VERIFYING...' : 'VERIFY OTP'}
          </button>
        </form>

        {/* Footer info text */}
        <p className="swiggy-auth-footer-text">
          By clicking on Verify OTP, I accept the <span className="bold-text">Terms & Conditions</span> & <span className="bold-text">Privacy Policy</span>
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
          line-height: 1.4;
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
          margin-bottom: 16px;
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

        .disabled-style {
          background: #f7f9fa;
        }

        .disabled-style .swiggy-input {
          color: #7e808c;
          cursor: not-allowed;
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

        .swiggy-timer-row {
          margin-bottom: 24px;
          display: flex;
          justify-content: flex-end;
        }

        .swiggy-timer-text {
          font-size: 0.85rem;
          color: #7e808c;
        }

        .swiggy-resend-btn {
          background: none;
          border: none;
          color: #b31522;
          font-weight: 750;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }

        .swiggy-resend-btn:hover {
          opacity: 0.8;
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

        .bold-text {
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
