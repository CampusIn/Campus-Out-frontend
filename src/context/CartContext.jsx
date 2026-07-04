import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart, addToCart, updateCartItemQty, deleteCartItem } from '../api/cart.api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!user || user.role !== 'user') {
      setCart(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await getCart();
      setCart(data.data);
    } catch (e) {
      setCart(null);
      setError(e.response?.data?.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCartOptimistic = useCallback(async (menuItem, restaurantId, quantityToAdd = 1) => {
    if (!user) return;

    setCart(prevCart => {
      let updatedItems = [];
      if (prevCart && prevCart.restaurant === restaurantId) {
        updatedItems = [...prevCart.items];
        const idx = updatedItems.findIndex(item => {
          const idToCheck = item.menuItem?._id || item.menuItem;
          return idToCheck?.toString() === menuItem._id?.toString();
        });
        if (idx > -1) {
          updatedItems[idx] = {
            ...updatedItems[idx],
            quantity: updatedItems[idx].quantity + quantityToAdd
          };
        } else {
          updatedItems.push({
            _id: Math.random().toString(),
            menuItem,
            quantity: quantityToAdd
          });
        }
      } else {
        updatedItems = [{
          _id: Math.random().toString(),
          menuItem,
          quantity: quantityToAdd
        }];
      }

      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
      return {
        restaurant: restaurantId,
        items: updatedItems,
        totalAmount
      };
    });

    try {
      await addToCart({ menuItemId: menuItem._id, quantity: quantityToAdd });
      fetchCart();
    } catch (err) {
      fetchCart(); // Reset to server state on error
      throw err;
    }
  }, [user, fetchCart]);

  const updateCartItemQtyOptimistic = useCallback(async (menuItemId, quantity) => {
    if (!user) return;

    setCart(prevCart => {
      if (!prevCart) return null;
      const updatedItems = prevCart.items.map(item => {
        const idToCheck = item.menuItem?._id || item.menuItem;
        if (idToCheck?.toString() === menuItemId?.toString()) {
          return { ...item, quantity };
        }
        return item;
      });

      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
      return {
        ...prevCart,
        items: updatedItems,
        totalAmount
      };
    });

    try {
      await updateCartItemQty(menuItemId, quantity);
      fetchCart();
    } catch (err) {
      fetchCart();
      throw err;
    }
  }, [user, fetchCart]);

  const deleteCartItemOptimistic = useCallback(async (menuItemId) => {
    if (!user) return;

    setCart(prevCart => {
      if (!prevCart) return null;
      const updatedItems = prevCart.items.filter(item => {
        const idToCheck = item.menuItem?._id || item.menuItem;
        return idToCheck?.toString() !== menuItemId?.toString();
      });

      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
      return {
        ...prevCart,
        items: updatedItems,
        totalAmount
      };
    });

    try {
      await deleteCartItem(menuItemId);
      fetchCart();
    } catch (err) {
      fetchCart();
      throw err;
    }
  }, [user, fetchCart]);

  const cartTotalQty = cart?.items
    ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  return (
    <CartContext.Provider value={{
      cart,
      setCart,
      fetchCart,
      cartTotalQty,
      loading,
      error,
      setError,
      addToCartOptimistic,
      updateCartItemQtyOptimistic,
      deleteCartItemOptimistic
    }}>
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
