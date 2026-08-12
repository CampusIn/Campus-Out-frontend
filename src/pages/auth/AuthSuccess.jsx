import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { refreshToken, getMe } from '../../api/auth.api';

export default function AuthSuccess() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        let token = params.get('token');

        if (!token) {
          // Fallback: Send a POST request to generate a new access token using the HTTP-only refresh token cookie.
          const { data } = await refreshToken();
          token = data.data.accessToken;
        }
        
        localStorage.setItem('accessToken', token);
        
        const { data: meRes } = await getMe();
        const userObj = { 
          id: meRes.data.id, 
          role: meRes.data.role, 
          email: meRes.data.email, 
          username: meRes.data.username 
        };

        // Block delivery partners
        if (userObj.role === 'delivery_partner') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setUser(null);
          localStorage.setItem('authError', 'Access Denied. Please use the Delivery Partner Portal to login.');
          navigate('/login', { replace: true });
          return;
        }

        localStorage.setItem('user', JSON.stringify(userObj));
        setUser(userObj);

        // Redirect based on role
        if (userObj.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (userObj.role === 'vendor') {
          navigate('/vendor', { replace: true });
        } else {
          navigate('/restaurants', { replace: true });
        }
      } catch (err) {
        console.error('Failed to get access token from refresh token:', err);
        setError(err.response?.data?.message || 'Authentication failed. Please try again.');
        
        // Clear potential partial session state
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleSuccess();
  }, [setUser, navigate]);

  return (
    <div className="swiggy-auth-page-bg">
      <div className="swiggy-auth-card">
        {error ? (
          <div>
            <div className="error-icon-wrapper">
              ✕
            </div>
            <h1 className="swiggy-auth-title" style={{ color: '#ef4444' }}>Login Failed</h1>
            <p className="swiggy-auth-subtitle" style={{ marginTop: '16px' }}>{error}</p>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '12px' }}>Redirecting to login page...</p>
          </div>
        ) : (
          <div>
            <h1 className="swiggy-auth-title">Verifying Session</h1>
            <div className="spinner-container">
              <div className="spinner-glow"></div>
              <div className="spinner"></div>
            </div>
            <p className="swiggy-auth-subtitle">Securing your connection. Please wait...</p>
          </div>
        )}
      </div>

      <style>{`
        .swiggy-auth-page-bg {
          min-height: 80vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          padding: 20px;
          font-family: 'Outfit', sans-serif;
        }

        .swiggy-auth-card {
          width: 100%;
          max-width: 480px;
          padding: 48px 40px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
          border: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }

        .swiggy-auth-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #282c3f;
          margin-bottom: 8px;
        }

        .swiggy-auth-subtitle {
          font-size: 0.95rem;
          color: #7e808c;
          line-height: 1.5;
        }

        .spinner-container {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 32px auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #f1f5f9;
          border-top-color: #4A35E8;
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite;
        }

        .spinner-glow {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(74, 53, 232, 0.2);
          animation: pulse 2s infinite ease-in-out;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }

        .error-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #fff5f5;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px auto;
          font-size: 32px;
          font-weight: bold;
          animation: scaleIn 0.3s ease-out;
        }

        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
