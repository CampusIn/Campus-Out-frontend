import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useMarketCart } from '../context/MarketCartContext';

import { ShoppingCart, Home, ClipboardList, User, ShoppingBag } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export default function BottomNav() {
  const { user } = useAuth();
  const { cartTotalQty } = useCart();
  const { cartTotalQty: marketCartTotalQty } = useMarketCart();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Show tutorial if user is logged in (shows on every login / page load)
    if (user) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setShowTutorial(false);
    }
  }, [user]);

  useEffect(() => {
    if (!showTutorial) return;

    const dismissTutorial = () => {
      setShowTutorial(false);
    };

    // Add listeners with a small delay so current click doesn't dismiss it immediately
    const timer = setTimeout(() => {
      document.addEventListener('click', dismissTutorial);
      document.addEventListener('touchstart', dismissTutorial);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', dismissTutorial);
      document.removeEventListener('touchstart', dismissTutorial);
    };
  }, [showTutorial]);

  // Determine if we should show the nav
  const showNavRoutes = ['/restaurants', '/marketplace', '/orders', '/cart', '/profile', '/repair-requests'];
  const shouldShowNav = Boolean(user) && showNavRoutes.some(route => location.pathname.startsWith(route));

  // Determine active tab
  let activeTab = 'home';
  if (location.pathname.startsWith('/marketplace')) activeTab = 'marketplace';
  else if (location.pathname.startsWith('/orders')) activeTab = 'orders';
  else if (location.pathname.startsWith('/cart')) activeTab = 'cart';
  else if (location.pathname.startsWith('/profile')) activeTab = 'profile';

  // Show marketplace cart count when on any marketplace-related page
  const searchParams = new URLSearchParams(location.search);
  const isMarketplaceContext = 
    location.pathname.startsWith('/marketplace') || 
    (location.pathname === '/cart' && searchParams.get('tab') === 'marketplace');
  const displayCartQty = isMarketplaceContext ? marketCartTotalQty : cartTotalQty;

  if (!shouldShowNav) return null;

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 520, damping: 32 };

  const tabs = [
    { value: 'home', label: 'Home', path: '/restaurants', icon: <Home size={20} /> },
    { value: 'marketplace', label: 'Market', path: '/marketplace', icon: <ShoppingBag size={20} /> },
    { value: 'orders', label: 'Orders', path: '/orders', icon: <ClipboardList size={20} /> },
    { value: 'cart', label: 'Cart', path: isMarketplaceContext ? '/cart?tab=marketplace' : '/cart', icon: <ShoppingCart size={20} />, badge: displayCartQty > 0 ? displayCartQty : undefined },
    { value: 'profile', label: 'Profile', path: user ? '/profile' : '/login', icon: <User size={20} /> },
  ];

  return (
    <div className="bottom-nav-container">
      <nav className="godui-tab-bar">
        {tabs.map((tab) => {
          const active = tab.value === activeTab;
          return (
            <Link
              key={tab.value}
              to={tab.path}
              className={`godui-tab-item ${active ? 'active' : ''}`}
              style={{ position: tab.value === 'marketplace' ? 'relative' : undefined }}
            >
              {tab.value === 'marketplace' && showTutorial && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 15px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1000,
                  pointerEvents: 'none',
                }}>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: [0, -8, 0] }}
                    transition={{ 
                      opacity: { duration: 0.3 },
                      y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                    }}
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      width: 'max-content',
                      maxWidth: '220px',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      boxShadow: '0 8px 24px rgba(179, 21, 34, 0.4)',
                      lineHeight: '1.3',
                      position: 'relative'
                    }}
                  >
                    Marketplace: Get mattresses, pillows & more!
                    <div style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: '10px',
                      height: '10px',
                      background: 'var(--primary)',
                    }}></div>
                  </motion.div>
                </div>
              )}
              {active && (
                <motion.span
                  layoutId="bottom-nav-blob"
                  transition={spring}
                  className="godui-tab-blob"
                />
              )}
              <motion.span
                className="godui-tab-icon-wrapper"
                animate={reduceMotion || !active ? { scale: 1 } : { scale: [1, 1.18, 1] }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className="godui-tab-badge">
                    {tab.badge}
                  </span>
                )}
              </motion.span>
              {active && (
                <motion.span
                  layout
                  initial={!reduceMotion ? { opacity: 0, width: 0 } : false}
                  animate={{ opacity: 1, width: "auto" }}
                  transition={spring}
                  className="godui-tab-label"
                >
                  {tab.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
