import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

import { KeyRound, ShieldCheck, ArrowLeft, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  forgotPassword, verifyResetOtp, resetPassword,
  forgotPasswordVendor, verifyResetOtpVendor, resetPasswordVendor,
  forgotPasswordAdmin, verifyResetOtpAdmin, resetPasswordAdmin,
} from '../../api/auth.api';

const STEPS = {
  EMAIL: 'email',
  OTP: 'otp',
  PASSWORD: 'password',
  SUCCESS: 'success',
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'user';

  // Helper: pick the correct API function based on role
  const getForgotFn = () => {
    if (role === 'vendor') return forgotPasswordVendor;
    if (role === 'admin') return forgotPasswordAdmin;
    return forgotPassword;
  };
  const getVerifyResetFn = () => {
    if (role === 'vendor') return verifyResetOtpVendor;
    if (role === 'admin') return verifyResetOtpAdmin;
    return verifyResetOtp;
  };
  const getResetFn = () => {
    if (role === 'vendor') return resetPasswordVendor;
    if (role === 'admin') return resetPasswordAdmin;
    return resetPassword;
  };
  const getLoginPath = () => {
    if (role === 'vendor') return '/vendor/login';
    if (role === 'admin') return '/admin/login';
    return '/login';
  };

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const { data } = await getForgotFn()({ email: email.trim().toLowerCase() });
      toast.success('OTP Sent', data.message || 'Check your email for the OTP');
      setStep(STEPS.OTP);
      setTimeLeft(60);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      setError(msg);
      toast.error('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (timeLeft > 0) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await getForgotFn()({ email: email.trim().toLowerCase() });
      toast.success('OTP Resent', data.message || 'A new OTP has been sent to your email');
      setTimeLeft(60);
      setOtp('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP';
      setError(msg);
      toast.error('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const { data } = await getVerifyResetFn()({ email: email.trim().toLowerCase(), otp });
      setResetToken(data.data.resetToken);
      toast.success('OTP Verified', 'You can now set your new password');
      setStep(STEPS.PASSWORD);
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed. Please try again.';
      setError(msg);
      toast.error('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await getResetFn()({ resetToken, password });
      toast.success('Password Reset', 'Your password has been reset successfully');
      setStep(STEPS.SUCCESS);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(msg);
      toast.error('Reset Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  // Step indicator data
  const stepData = [
    { key: STEPS.EMAIL, label: 'Email', icon: Mail },
    { key: STEPS.OTP, label: 'Verify', icon: ShieldCheck },
    { key: STEPS.PASSWORD, label: 'Reset', icon: KeyRound },
  ];

  const getStepIndex = () => {
    if (step === STEPS.SUCCESS) return 3;
    return stepData.findIndex((s) => s.key === step);
  };

  const currentStepIndex = getStepIndex();

  const handleBack = () => {
    setError('');
    if (step === STEPS.OTP) {
      setStep(STEPS.EMAIL);
      setOtp('');
    } else if (step === STEPS.PASSWORD) {
      // Can't go back from password step since resetToken is one-use
      navigate(getLoginPath());
    } else {
      navigate(getLoginPath());
    }
  };

  return (
    <div className="swiggy-auth-page-bg animate-fade-in">
      <div className="swiggy-auth-card animate-scale-in">
        {/* Back Button */}
        {step !== STEPS.SUCCESS && (
          <button
            onClick={handleBack}
            className="swiggy-close-btn hover-scale"
            aria-label="Back"
          >
            <ArrowLeft size={24} />
          </button>
        )}

        {/* Step Indicator */}
        {step !== STEPS.SUCCESS && (
          <div className="fp-step-indicator">
            {stepData.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              return (
                <div key={s.key} className="fp-step-item">
                  <div className={`fp-step-dot ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                    {isCompleted ? (
                      <CheckCircle size={16} />
                    ) : (
                      <StepIcon size={14} />
                    )}
                  </div>
                  <span className={`fp-step-label ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                    {s.label}
                  </span>
                  {idx < stepData.length - 1 && (
                    <div className={`fp-step-line ${isCompleted ? 'completed' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─────── STEP 1: Email ─────── */}
        {step === STEPS.EMAIL && (
          <>
            <div className="swiggy-auth-header-row">
              <div className="swiggy-auth-title-col">
                <h1 className="swiggy-auth-title">Forgot Password</h1>
                <p className="swiggy-auth-subtitle">
                  Enter the email address associated with your account and we'll send you an OTP to reset your password.
                </p>
                <div className="swiggy-title-line"></div>
              </div>
            </div>

            <form onSubmit={handleSendOtp} className="swiggy-auth-form">
              {error && (
                <div className="swiggy-auth-error-msg animate-shake">
                  <span>{error}</span>
                </div>
              )}

              <div className="swiggy-inputs-stack">
                <div className="swiggy-input-container" style={{ borderRadius: '12px' }}>
                  <input
                    className="swiggy-input"
                    type="email"
                    id="forgotEmail"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <label htmlFor="forgotEmail" className="swiggy-label">Email Address</label>
                </div>
              </div>

              <button
                className="swiggy-auth-submit-btn hover-lift"
                type="submit"
                disabled={loading}
              >
                {loading ? 'SENDING OTP...' : 'SEND OTP'}
              </button>
            </form>

            <p className="fp-back-to-login">
              Remember your password? <Link to="/login" className="swiggy-auth-link">Log in</Link>
            </p>
          </>
        )}

        {/* ─────── STEP 2: Verify OTP ─────── */}
        {step === STEPS.OTP && (
          <>
            <div className="swiggy-auth-header-row">
              <div className="swiggy-auth-title-col">
                <h1 className="swiggy-auth-title">Enter OTP</h1>
                <p className="swiggy-auth-subtitle">
                  We've sent a 6-digit OTP to <strong>{email}</strong>. Enter it below to continue.
                </p>
                <div className="swiggy-title-line"></div>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="swiggy-auth-form">
              {error && (
                <div className="swiggy-auth-error-msg animate-shake">
                  <span>{error}</span>
                </div>
              )}

              <div className="swiggy-inputs-stack">
                {/* Email (read-only) */}
                <div className="swiggy-input-container border-bottom-none disabled-style" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                  <input
                    className="swiggy-input"
                    type="text"
                    id="otpEmailDisplay"
                    placeholder=" "
                    value={email}
                    disabled
                  />
                  <label htmlFor="otpEmailDisplay" className="swiggy-label">Email Address</label>
                </div>

                {/* OTP Input */}
                <div className="swiggy-input-container" style={{ borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                  <input
                    className="swiggy-input"
                    type="text"
                    id="resetOtpInput"
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
                  <label htmlFor="resetOtpInput" className="swiggy-label">One time password</label>
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
                    onClick={handleResendOtp}
                    className="swiggy-resend-btn hover-scale"
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                className="swiggy-auth-submit-btn hover-lift"
                type="submit"
                disabled={loading}
              >
                {loading ? 'VERIFYING...' : 'VERIFY OTP'}
              </button>
            </form>
          </>
        )}

        {/* ─────── STEP 3: New Password ─────── */}
        {step === STEPS.PASSWORD && (
          <>
            <div className="swiggy-auth-header-row">
              <div className="swiggy-auth-title-col">
                <h1 className="swiggy-auth-title">Reset Password</h1>
                <p className="swiggy-auth-subtitle">
                  Create a strong new password for your account. Make sure it's at least 6 characters.
                </p>
                <div className="swiggy-title-line"></div>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="swiggy-auth-form">
              {error && (
                <div className="swiggy-auth-error-msg animate-shake">
                  <span>{error}</span>
                </div>
              )}

              <div className="swiggy-inputs-stack">
                {/* New Password */}
                <div className="swiggy-input-container border-bottom-none" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                  <input
                    className="swiggy-input"
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <label htmlFor="newPassword" className="swiggy-label">New Password</label>
                  <button
                    type="button"
                    className="swiggy-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="swiggy-input-container" style={{ borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                  <input
                    className="swiggy-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder=" "
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <label htmlFor="confirmPassword" className="swiggy-label">Confirm Password</label>
                  <button
                    type="button"
                    className="swiggy-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password strength hint */}
              {password && (
                <div className="fp-password-hints">
                  <div className={`fp-hint ${password.length >= 6 ? 'pass' : 'fail'}`}>
                    <span className="fp-hint-dot" />
                    At least 6 characters
                  </div>
                  <div className={`fp-hint ${/[A-Z]/.test(password) ? 'pass' : 'fail'}`}>
                    <span className="fp-hint-dot" />
                    One uppercase letter
                  </div>
                  <div className={`fp-hint ${/[0-9]/.test(password) ? 'pass' : 'fail'}`}>
                    <span className="fp-hint-dot" />
                    One number
                  </div>
                </div>
              )}

              <button
                className="swiggy-auth-submit-btn hover-lift"
                type="submit"
                disabled={loading}
                style={{ marginTop: password ? '8px' : '24px' }}
              >
                {loading ? 'RESETTING...' : 'RESET PASSWORD'}
              </button>
            </form>
          </>
        )}

        {/* ─────── SUCCESS ─────── */}
        {step === STEPS.SUCCESS && (
          <div className="fp-success-container animate-scale-in">
            <div className="fp-success-icon-wrapper">
              <CheckCircle className="fp-success-icon" size={48} />
            </div>
            <h2 className="fp-success-title">Password Reset Successful!</h2>
            <p className="fp-success-text">
              Your password has been updated. You can now log in with your new password.
            </p>
            <button
              className="swiggy-auth-submit-btn hover-lift"
              onClick={() => navigate(getLoginPath())}
            >
              GO TO LOGIN
            </button>
          </div>
        )}

        {/* Footer */}
        {step !== STEPS.SUCCESS && (
          <p className="swiggy-auth-footer-text">
            By continuing, I accept the <Link to="/terms-and-conditions" className="bold-text" style={{textDecoration: 'none', color: 'inherit'}}>Terms & Conditions</Link> & <Link to="/privacy-policy" className="bold-text" style={{textDecoration: 'none', color: 'inherit'}}>Privacy Policy</Link>
          </p>
        )}
      </div>

      {/* ─────── Styles ─────── */}
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
          margin-bottom: 24px;
          transition: transform 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .swiggy-close-btn:hover {
          color: #4A35E8;
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
          line-height: 1.5;
        }

        .swiggy-auth-subtitle strong {
          color: #282c3f;
          font-weight: 700;
        }

        .swiggy-auth-link {
          color: #4A35E8;
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

        .swiggy-auth-form {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        .swiggy-auth-error-msg {
          background: #fff5f5;
          color: #4A35E8;
          padding: 12px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 20px;
          text-align: center;
          border-radius: 4px;
          border: 1px solid rgba(74, 53, 232, 0.1);
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
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
          border-color: #4A35E8;
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
          color: #4A35E8;
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
          color: #4A35E8;
          font-weight: 750;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }

        .swiggy-resend-btn:hover {
          opacity: 0.8;
        }

        .swiggy-resend-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .swiggy-auth-submit-btn {
          width: 100%;
          background: #4A35E8;
          color: #ffffff;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(74, 53, 232, 0.2);
          text-align: center;
          margin-top: 24px;
        }

        .swiggy-auth-submit-btn:hover {
          background: #3220A8;
          box-shadow: 0 6px 20px rgba(74, 53, 232, 0.3);
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

        .swiggy-auth-footer-text .bold-text,
        .bold-text {
          color: #282c3f;
          font-weight: 700;
        }

        /* ── Step Indicator ── */
        .fp-step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
          gap: 0;
        }

        .fp-step-item {
          display: flex;
          align-items: center;
          gap: 0;
        }

        .fp-step-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f0f0;
          color: #93959f;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .fp-step-dot.active {
          background: #4A35E8;
          color: #ffffff;
          box-shadow: 0 3px 12px rgba(74, 53, 232, 0.25);
        }

        .fp-step-dot.completed {
          background: #16a34a;
          color: #ffffff;
        }

        .fp-step-label {
          font-size: 0.7rem;
          font-weight: 650;
          color: #93959f;
          position: absolute;
          margin-top: 52px;
          text-align: center;
          width: 50px;
          margin-left: -9px;
          transition: color 0.3s ease;
        }

        .fp-step-label.active {
          color: #4A35E8;
        }

        .fp-step-label.completed {
          color: #16a34a;
        }

        .fp-step-line {
          width: 64px;
          height: 2px;
          background: #e5e7eb;
          margin: 0 8px;
          transition: background 0.3s ease;
        }

        .fp-step-line.completed {
          background: #16a34a;
        }

        /* ── Back to Login ── */
        .fp-back-to-login {
          text-align: center;
          font-size: 0.9rem;
          color: #686b78;
          margin-top: 20px;
        }

        /* ── Password Hints ── */
        .fp-password-hints {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 4px;
        }

        .fp-hint {
          font-size: 0.78rem;
          font-weight: 550;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #93959f;
          transition: color 0.2s ease;
        }

        .fp-hint.pass {
          color: #16a34a;
        }

        .fp-hint.fail {
          color: #d4d5d9;
        }

        .fp-hint-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }

        /* ── Success State ── */
        .fp-success-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px 0;
        }

        .fp-success-icon-wrapper {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          animation: fp-pulse 2s ease-in-out infinite;
        }

        .fp-success-icon {
          color: #16a34a;
        }

        @keyframes fp-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.15); }
          50% { transform: scale(1.04); box-shadow: 0 0 0 12px rgba(22, 163, 74, 0); }
        }

        .fp-success-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #282c3f;
          margin: 0 0 12px 0;
        }

        .fp-success-text {
          font-size: 0.95rem;
          color: #686b78;
          line-height: 1.5;
          margin: 0 0 32px 0;
          max-width: 320px;
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
          .fp-step-line {
            width: 40px;
          }
        }
      `}</style>
    </div>
  );
}
