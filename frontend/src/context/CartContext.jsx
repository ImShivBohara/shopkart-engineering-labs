import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartQuantity as apiUpdateCartQuantity,
  removeFromCart as apiRemoveFromCart,
} from "../services/api";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getCart();
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cart || []);
      } else if (response.status === 401) {
        setCartItems([]);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to load cart");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId) => {
    try {
      const response = await apiAddToCart(productId);
      const data = await response.json();

      if (response.ok) {
        setCartItems(data.cart || []);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Failed to add to cart" };
      }
    } catch (err) {
      return { success: false, message: "Error connecting to server" };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const response = await apiUpdateCartQuantity(productId, quantity);
      const data = await response.json();

      if (response.ok) {
        setCartItems(data.cart || []);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Failed to update quantity" };
      }
    } catch (err) {
      return { success: false, message: "Error connecting to server" };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await apiRemoveFromCart(productId);
      const data = await response.json();

      if (response.ok) {
        setCartItems(data.cart || []);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Failed to remove item" };
      }
    } catch (err) {
      return { success: false, message: "Error connecting to server" };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
