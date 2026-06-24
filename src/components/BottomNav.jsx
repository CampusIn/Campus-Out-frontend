import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Home, ClipboardList, ShoppingCart, User } from 'lucide-react';

export default function BottomNav({ activeTab = 'home' }) {
  const { user } = useAuth();
  const { cartTotalQty } = useCart();

  return (
    <div className="bottom-nav" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
      {/* Home Tab */}
      <Link 
        to="/restaurants" 
        className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`}
        style={{ color: activeTab === 'home' ? '#b31522' : '#718096' }}
      >
        <Home size={22} style={{ strokeWidth: activeTab === 'home' ? 2.5 : 2 }} />
        <span style={{ fontSize: '0.75rem', fontWeight: activeTab === 'home' ? 800 : 600, marginTop: '4px' }}>Home</span>
      </Link>

      {/* Orders Tab */}
      <Link 
        to="/orders" 
        className={`bottom-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
        style={{ color: activeTab === 'orders' ? '#b31522' : '#718096' }}
      >
        <ClipboardList size={22} style={{ strokeWidth: activeTab === 'orders' ? 2.5 : 2 }} />
        <span style={{ fontSize: '0.75rem', fontWeight: activeTab === 'orders' ? 800 : 600, marginTop: '4px' }}>Orders</span>
      </Link>

      {/* Cart Tab */}
      <Link 
        to="/cart" 
        className={`bottom-nav-item ${activeTab === 'cart' ? 'active' : ''}`}
        style={{ color: activeTab === 'cart' ? '#b31522' : '#718096' }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShoppingCart size={22} style={{ strokeWidth: activeTab === 'cart' ? 2.5 : 2 }} />
          {cartTotalQty > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#dc2626',
              color: '#ffffff',
              borderRadius: '10px',
              fontSize: '0.65rem',
              fontWeight: 800,
              minWidth: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #ffffff',
              boxSizing: 'border-box',
              lineHeight: 1
            }}>
              {cartTotalQty}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: activeTab === 'cart' ? 800 : 600, marginTop: '4px' }}>Cart</span>
      </Link>

      {/* Profile Tab */}
      <Link 
        to={user ? "/profile" : "/login"} 
        className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        style={{ color: activeTab === 'profile' ? '#b31522' : '#718096' }}
      >
        <User size={22} style={{ strokeWidth: activeTab === 'profile' ? 2.5 : 2 }} />
        <span style={{ fontSize: '0.75rem', fontWeight: activeTab === 'profile' ? 800 : 600, marginTop: '4px' }}>Profile</span>
      </Link>
    </div>
  );
}
