import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMarketCart, addToMarketCart, updateMarketCartItemQty, deleteMarketCartItem, clearMarketCart } from '../api/marketplace.api';
import { useAuth } from './AuthContext';

const MarketCartContext = createContext(null);

export function MarketCartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingItems, setUpdatingItems] = useState({});

  const fetchCart = useCallback(async () => {
    if (!user || user.role !== 'user') {
      setCart(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await getMarketCart();
      if (data.success) {
        if (!data.data || !data.data.items || data.data.items.length === 0) {
          setCart(null);
        } else {
          setCart(data.data);
        }
      }
    } catch (e) {
      setCart(null);
      setError(e.response?.data?.message || 'Failed to fetch marketplace cart');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCartOptimistic = useCallback(async (product, quantityToAdd = 1) => {
    if (!user) return;
    const productId = product._id;
    setUpdatingItems(prev => ({ ...prev, [productId]: true }));
    try {
      const { data } = await addToMarketCart(productId, quantityToAdd);
      if (data.success) {
        setCart(data.data);
        return data.data;
      }
    } catch (err) {
      throw err;
    } finally {
      setUpdatingItems(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
  }, [user]);

  const updateCartItemQtyOptimistic = useCallback(async (productId, quantity) => {
    if (!user) return;
    setUpdatingItems(prev => ({ ...prev, [productId]: true }));

    // Optimistic update to UI state
    setCart(prevCart => {
      if (!prevCart) return null;
      const updatedItems = prevCart.items.map(item => {
        if (item.product && item.product._id === productId) {
          return { ...item, quantity };
        }
        return item;
      });
      const totalAmount = updatedItems.reduce((sum, item) => {
        const itemPrice = item.product?.price || 0;
        return sum + (itemPrice * item.quantity);
      }, 0);
      return {
        ...prevCart,
        items: updatedItems,
        totalAmount
      };
    });

    try {
      const { data } = await updateMarketCartItemQty(productId, quantity);
      if (data.success && data.data) {
        setCart(prevCart => {
          if (!prevCart) return null;
          return {
            ...prevCart,
            items: data.data.items || [],
            totalAmount: data.data.totalAmount || 0
          };
        });
      }
    } catch (err) {
      await fetchCart(); // Reset to server state on error
      throw err;
    } finally {
      setUpdatingItems(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
  }, [user, fetchCart]);

  const deleteCartItemOptimistic = useCallback(async (productId) => {
    if (!user) return;
    setUpdatingItems(prev => ({ ...prev, [productId]: true }));

    // Optimistic delete
    setCart(prevCart => {
      if (!prevCart) return null;
      const updatedItems = prevCart.items.filter(item => item.product && item.product._id !== productId);
      if (updatedItems.length === 0) return null;
      const totalAmount = updatedItems.reduce((sum, item) => {
        const itemPrice = item.product?.price || 0;
        return sum + (itemPrice * item.quantity);
      }, 0);
      return {
        ...prevCart,
        items: updatedItems,
        totalAmount
      };
    });

    try {
      const { data } = await deleteMarketCartItem(productId);
      if (data.success) {
        if (!data.data || !data.data.items || data.data.items.length === 0) {
          setCart(null);
        } else {
          setCart(data.data);
        }
      }
    } catch (err) {
      await fetchCart();
      throw err;
    } finally {
      setUpdatingItems(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
  }, [user, fetchCart]);

  const clearCartOptimistic = useCallback(async () => {
    if (!user) return;
    setCart(null);
    try {
      await clearMarketCart();
    } catch (err) {
      await fetchCart();
      throw err;
    }
  }, [user, fetchCart]);

  const cartTotalQty = cart?.items
    ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  return (
    <MarketCartContext.Provider value={{
      cart,
      setCart,
      fetchCart,
      cartTotalQty,
      loading,
      error,
      setError,
      addToCartOptimistic,
      updateCartItemQtyOptimistic,
      deleteCartItemOptimistic,
      clearCartOptimistic,
      updatingItems
    }}>
      {children}
    </MarketCartContext.Provider>
  );
}

export const useMarketCart = () => {
  const context = useContext(MarketCartContext);
  if (!context) {
    throw new Error('useMarketCart must be used within a MarketCartProvider');
  }
  return context;
};
