import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';


const CartContext = createContext();


export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const user_id = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");


  const fetchCartItems = useCallback(async () => {
    if (token && user_id) {
      try {
        const { data } = await axios.get(`http://localhost:8082/cart/${user_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCartItems(data);
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    } else {
   
      const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      setCartItems(guestCart);
    }
  }, [token, user_id]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);


  const updateLocalStorageCart = (updatedCart) => {
    localStorage.setItem("guestCart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
  };

  const addToCart = async (item) => {
    if (token && user_id) {
      try {
        const { data } = await axios.post('http://localhost:8082/cart/add', item, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCartItems((prev) => [...prev, data]);
      } catch (error) {
        console.error("Error adding to cart:", error);
      }
    } else {
      
      const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      const existingItem = guestCart.find((i) => i.product_id === item.product_id);

      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        guestCart.push(item);
      }
      updateLocalStorageCart(guestCart);
    }
  };


  const removeItem = async (product_id) => {
    if (token && user_id) {
      try {
        await axios.delete('http://localhost:8082/cart/remove', {
          data: { user_id, product_id },
          headers: { Authorization: `Bearer ${token}` },
        });
        setCartItems((prev) => prev.filter((item) => item.product_id !== product_id));
      } catch (error) {
        console.error("Error removing item:", error);
      }
    } else {
      const updatedCart = cartItems.filter((item) => item.product_id !== product_id);
      updateLocalStorageCart(updatedCart);
    }
  };


  const updateQuantity = async (product_id, change) => {
    if (token && user_id) {
      try {
        await axios.put(
          'http://localhost:8082/cart/update',
          {
            user_id,
            product_id,
            quantity: change,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        fetchCartItems(); 
      } catch (error) {
        console.error("Error updating quantity:", error);
      }
    } else {
      const guestCart = [...cartItems];
      const item = guestCart.find((item) => item.product_id === product_id);

      if (item) {
        item.quantity += change; 
        if (item.quantity <= 0) {
          
          updateLocalStorageCart(guestCart.filter((i) => i.product_id !== product_id));
        } else {
         
          updateLocalStorageCart(guestCart);
        }
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        fetchCartItems,
        addToCart,
        removeItem,
        increaseAmount: (product_id) => updateQuantity(product_id, 1),
        decreaseAmount: (product_id) => updateQuantity(product_id, -1),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};


export const useCart = () => useContext(CartContext);