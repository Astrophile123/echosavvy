import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthInfo = () => {
    return {
      user_id: localStorage.getItem("user_id"),
      token: localStorage.getItem("token")
    };
  };

  const fetchCartItems = useCallback(async () => {
    const { token } = getAuthInfo();
    setLoading(true);
    setError(null);

    try {
      if (!token) {
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

  const addToCart = async (item) => {
    const { token } = getAuthInfo();
    setLoading(true);
    setError(null);

    try {
        if (token) {
          
            const response = await axios.post(
                "http://localhost:8082/api/cart/add",
                {
                    product_id: item.product_id,
                    quantity: item.quantity || 1
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

     
            await fetchCartItems();
            return response.data;
        } else {
            
            const guestCart = [...cartItems];
            const existingIndex = guestCart.findIndex(i => i.product_id === item.product_id);

            if (existingIndex >= 0) {
              
                guestCart[existingIndex].quantity += item.quantity || 1;
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
        console.error("Error:", error);
        setError("Failed to update cart");
        throw error;
    } finally {
        setLoading(false);
    }
};
  const removeItem = async (product_id) => {
    const { token } = getAuthInfo();
    setLoading(true);
    setError(null);

    try {
      if (token) {
        await axios.delete("http://localhost:8082/api/cart/remove", {
          data: { product_id },
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      
      setCartItems(prevItems => {
        const updatedItems = prevItems.filter(item => item.product_id !== product_id);
        
      
        if (!token) {
          localStorage.setItem("guestCart", JSON.stringify(updatedItems));
        }
        
        return updatedItems;
      });

      if (token) {
        await fetchCartItems(); 
      }
    } catch (error) {
      console.error("Error removing item:", error);
      setError(error.response?.data?.message || "Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (product_id, change) => {
    const { token } = getAuthInfo();
    setLoading(true);
    setError(null);

    try {
      const currentItem = cartItems.find(item => item.product_id === product_id);
      if (!currentItem) return;

      const newQuantity = currentItem.quantity + change;
      if (newQuantity < 1) return;

     
      setCartItems(prevItems => {
        const updatedItems = prevItems.map(item =>
          item.product_id === product_id
            ? { ...item, quantity: newQuantity }
            : item
        );
        
       
        if (!token) {
          localStorage.setItem("guestCart", JSON.stringify(updatedItems));
        }
        
        return updatedItems;
      });

      if (token) {
        await axios.put(
          "http://localhost:8082/api/cart/update",
          { product_id, quantity: newQuantity },
          { 
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: (status) => status < 500
          }
        );
        
        await fetchCartItems(); 
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      setError(error.response?.data?.message || "Failed to update quantity");
      
     
      if (token) {
        await fetchCartItems();
      }
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    const { token } = getAuthInfo();
    setLoading(true);
    setError(null);

    try {
      if (token) {
        await Promise.all(
          cartItems.map(item => 
            axios.delete("http://localhost:8082/api/cart/remove", {
              data: { product_id: item.product_id },
              headers: { Authorization: `Bearer ${token}` }
            })
          )
        );
      } else {
        localStorage.removeItem("guestCart");
      }
      
      setCartItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
      setError(error.response?.data?.message || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };

  
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

 
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
        setCartItems
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