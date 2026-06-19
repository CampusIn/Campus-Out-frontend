import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, ClipboardList, User, LogOut, Flame, Store } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (location.pathname === '/') return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar" style={{ padding: '12px 24px', position: 'sticky', top: 0, zIndex: 1000 }}>
      <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <div style={{ background: '#b31522', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Flame size={20} color="#ffffff" style={{ animation: 'pulseSoft 2s infinite' }} />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#111111' }}>
          CAMPUS<span style={{ color: '#b31522' }}>IN</span>
        </span>
      </Link>
      
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link 
          to="/restaurants" 
          className="nav-link"
          style={{ 
            color: isActive('/restaurants') ? '#b31522' : '#718096', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '0.9rem',
            transition: 'color 0.2s'
          }}
        >
          <Store size={18} />
          Restaurants
        </Link>
        
        {user ? (
          <>
            {user.role === 'user' && (
              <>
                <Link 
                  to="/cart" 
                  className="nav-link"
                  style={{ 
                    color: isActive('/cart') ? '#b31522' : '#718096', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                  }}
                >
                  <ShoppingCart size={18} />
                  Cart
                </Link>
                <Link 
                  to="/orders" 
                  className="nav-link"
                  style={{ 
                    color: isActive('/orders') ? '#b31522' : '#718096', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                  }}
                >
                  <ClipboardList size={18} />
                  Orders
                </Link>
                <Link 
                  to="/profile" 
                  className="nav-link"
                  style={{ 
                    color: isActive('/profile') ? '#b31522' : '#718096', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                  }}
                >
                  <User size={18} />
                  Profile
                </Link>
              </>
            )}
            
            {user.role === 'vendor' && (
              <>
                <Link 
                  to="/vendor" 
                  className="nav-link"
                  style={{ 
                    color: isActive('/vendor') ? '#b31522' : '#718096', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                  }}
                >
                  <Store size={18} />
                  Dashboard
                </Link>
                <Link 
                  to="/profile" 
                  className="nav-link"
                  style={{ 
                    color: isActive('/profile') ? '#b31522' : '#718096', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                  }}
                >
                  <User size={18} />
                  Profile
                </Link>
              </>
            )}
            
            <button 
              onClick={logout} 
              className="nav-link hover-darken" 
              style={{ 
                background: '#fff5f5', 
                border: 'none', 
                color: '#b31522',
                cursor: 'pointer', 
                fontFamily: 'inherit', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className="nav-link"
              style={{ 
                color: isActive('/login') ? '#b31522' : '#718096', 
                fontWeight: 700, 
                fontSize: '0.9rem' 
              }}
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="btn btn-primary animate-pulse-soft"
              style={{ 
                background: '#b31522', 
                color: '#ffffff', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                fontWeight: 700, 
                fontSize: '0.9rem',
                textDecoration: 'none'
              }}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

