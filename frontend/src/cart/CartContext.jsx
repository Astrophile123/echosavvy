import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current user info
  const getAuthInfo = () => {
    return {
      user_id: localStorage.getItem("user_id"),
      token: localStorage.getItem("token")
    };
  };

  // Fetch cart items from API
  const fetchCartItems = useCallback(async () => {
    const { user_id, token } = getAuthInfo();
    setLoading(true);
    setError(null);

    try {
      if (!token) {
        // Handle guest cart from localStorage
        const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
        setCartItems(guestCart);
        return;
      }

      const response = await axios.get("http://localhost:8082/api/cart", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCartItems(response.data || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setError(error.response?.data?.message || "Failed to fetch cart items");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize cart on mount
  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  // Add item to cart
  const addToCart = async (item) => {
    const { user_id, token } = getAuthInfo();
    setLoading(true);
    setError(null);

    try {
      if (token) {
        // Authenticated user - add to server
        const response = await axios.post(
          "http://localhost:8082/api/cart/add",
          {
            product_id: item.product_id,
            product_name: item.product_name,
            price: item.price,
            quantity: item.quantity || 1,
            image_url: item.image_url
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Refresh cart after addition
        await fetchCartItems();
        return response.data;
      } else {
        // Guest user - add to local storage
        const guestCart = [...cartItems];
        const existingItem = guestCart.find(i => i.product_id === item.product_id);

        if (existingItem) {
          existingItem.quantity += item.quantity || 1;
        } else {
          guestCart.push({
            ...item,
            quantity: item.quantity || 1
          });
        }

        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        setCartItems(guestCart);
        return guestCart;
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setError(error.response?.data?.message || "Failed to add item to cart");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (product_id) => {
    const { user_id, token } = getAuthInfo();
    setLoading(true);
    setError(null);

    try {
      if (token) {
        await axios.delete("http://localhost:8082/api/cart/remove", {
          data: { product_id },
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchCartItems();
      } else {
        const guestCart = cartItems.filter(item => item.product_id !== product_id);
        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        setCartItems(guestCart);
      }
    } catch (error) {
      console.error("Error removing item:", error);
      setError(error.response?.data?.message || "Failed to remove item");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (product_id, change) => {
    const { user_id, token } = getAuthInfo();
    setLoading(true);
    setError(null);

    try {
      if (token) {
        // Find current item to determine new quantity
        const currentItem = cartItems.find(item => item.product_id === product_id);
        if (!currentItem) return;

        const newQuantity = currentItem.quantity + change;
        if (newQuantity < 1) {
          await removeItem(product_id);
          return;
        }

        await axios.put(
          "http://localhost:8082/api/cart/update",
          { product_id, quantity: newQuantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        await fetchCartItems();
      } else {
        const guestCart = [...cartItems];
        const item = guestCart.find(item => item.product_id === product_id);

        if (item) {
          item.quantity += change;
          if (item.quantity < 1) {
            // Remove if quantity drops to 0
            await removeItem(product_id);
          } else {
            localStorage.setItem("guestCart", JSON.stringify(guestCart));
            setCartItems(guestCart);
          }
        }
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      setError(error.response?.data?.message || "Failed to update quantity");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    const { token } = getAuthInfo();
    setLoading(true);
    setError(null);

    try {
      if (token) {
        // For authenticated users - clear on server
        // Note: You might need to implement a clear endpoint on your backend
        await Promise.all(
          cartItems.map(item => 
            axios.delete("http://localhost:8082/api/cart/remove", {
              data: { product_id: item.product_id },
              headers: { Authorization: `Bearer ${token}` }
            })
          )
        );
        await fetchCartItems();
      } else {
        // For guest users - clear local storage
        localStorage.removeItem("guestCart");
        setCartItems([]);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      setError(error.response?.data?.message || "Failed to clear cart");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Calculate total items in cart
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Calculate total price
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1),
    0
  ).toFixed(2);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        fetchCartItems,
        addToCart,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        setCartItems // Only expose if absolutely necessary
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};