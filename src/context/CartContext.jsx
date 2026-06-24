import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart } from '../api/cart.api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user || user.role !== 'user') {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await getCart();
      setCart(data.data);
    } catch (e) {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const cartTotalQty = cart?.items
    ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  return (
    <CartContext.Provider value={{ cart, setCart, fetchCart, cartTotalQty, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
