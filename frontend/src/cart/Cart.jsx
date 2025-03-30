import { useEffect, useState, useMemo } from "react";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";
import styles from "./Cart.module.css";
import axios from "axios";
import { speakText, stopSpeech } from "./speechUtils";

const Cart = () => {
  const { 
    cartItems, 
    fetchCartItems, 
    removeItem, 
    updateQuantity,
    setCartItems // Make sure this is provided by your CartContext
  } = useCart();
  
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart items on component mount
  useEffect(() => {
    const getCartItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get("http://localhost:8082/api/cart", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCartItems(response.data || []);
      } catch (err) {
        console.error("Error fetching cart items:", err);
        setError("Failed to load cart items");
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    getCartItems();
  }, [navigate, setCartItems]);

  // Voice synthesis setup
  useEffect(() => {
    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    handleVoicesChanged();
    
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      stopSpeech();
    };
  }, []);

  // Announce cart contents when items change
  useEffect(() => {
    stopSpeech();
    if (cartItems.length === 0) {
      speakText("Your cart is empty.", voices);
    } else {
      speakText(`You have ${cartItems.length} items in your cart.`, voices);
    }
  }, [cartItems, voices]);

  // Clean up speech when window loses focus
  useEffect(() => {
    const handleWindowBlur = () => {
      stopSpeech();
      setIsSpeaking(false);
    };
    
    window.addEventListener("blur", handleWindowBlur);
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, []);

  // Calculate total price
  const calculateTotal = useMemo(() => {
    return cartItems
      .reduce((total, item) => total + (parseFloat(item.price) || 0) * (item.quantity || 1), 0)
      .toFixed(2);
  }, [cartItems]);

  // Handle mouse hover events for accessibility
  const handleMouseEnter = (text) => {
    if (!window.speechSynthesis.speaking) {
      stopSpeech();
      setIsSpeaking(true);
      speakText(text, voices);
    }
  };

  const handleMouseLeave = () => {
    setIsSpeaking(false);
    stopSpeech();
  };

  // Handle quantity updates
  const handleUpdateQuantity = async (product_id, change) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Find the current item to get existing quantity
      const currentItem = cartItems.find(item => item.product_id === product_id);
      if (!currentItem) return;

      const newQuantity = currentItem.quantity + change;
      if (newQuantity < 1) return; // Don't allow quantities below 1

      await axios.put(
        "http://localhost:8082/api/cart/update",
        { product_id, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      updateQuantity(product_id, change);
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("Failed to update quantity");
    }
  };

  // Handle item removal
  const handleRemoveItem = async (product_id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.delete("http://localhost:8082/api/cart/remove", {
        headers: { Authorization: `Bearer ${token}` },
        data: { product_id } // Axios DELETE with body needs this format
      });

      
      removeItem(product_id);
    } catch (err) {
      console.error("Error removing item:", err);
      setError("Failed to remove item");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading cart...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.cartPage} aria-label="Cart page">
      <h1 
        className={styles.heading} 
        onMouseEnter={() => handleMouseEnter("EchoSavvy Cart")}
      >
        EchoSavvy Cart
      </h1>
      
      <div className={styles.cartHeader}>
        <h2 
          className={styles.heading1} 
          onMouseEnter={() => handleMouseEnter("Your cart.")}
        >
          🛒 Your Cart
        </h2>
        <button 
          className={styles.continueShopping} 
          onClick={() => navigate("/products")} 
          onMouseEnter={() => handleMouseEnter("Continue shopping.")} 
          onMouseLeave={handleMouseLeave}
        >
          Continue Shopping
        </button>
      </div>

      {cartItems.length === 0 ? (
        <p 
          className={styles.noResults} 
          onMouseEnter={() => handleMouseEnter("Your cart is empty.")}
        >
          Your cart is empty.
        </p>
      ) : (
        <div className={styles.cartItems}>
          {cartItems.map((item) => (
            <div 
              key={item.product_id} 
              className={styles.cartItem}
              onMouseEnter={() => handleMouseEnter(
                `Product: ${item.product_name}, Quantity: ${item.quantity}, Price: ${item.price} dollars.`
              )} 
              onMouseLeave={handleMouseLeave}
            >
              <div className={styles.cartImageName}>
                <img 
                  src={item.image_url || "/default-product.png"} 
                  alt={item.product_name} 
                  className={styles.cartImage} 
                  onError={(e) => (e.target.src = "/default-product.png")} 
                />
                <p className={styles.cartProductName}>{item.product_name}</p>
              </div>
              
              <div className={styles.cartAmountToggle}>
                <button 
                  onClick={() => handleUpdateQuantity(item.product_id, -1)}
                  onMouseEnter={() => handleMouseEnter("Decrease quantity by one.")} 
                  onMouseLeave={handleMouseLeave}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button 
                  onClick={() => handleUpdateQuantity(item.product_id, 1)}
                  onMouseEnter={() => handleMouseEnter("Increase quantity by one.")} 
                  onMouseLeave={handleMouseLeave}
                >
                  +
                </button>
              </div>
              
              <p className={styles.cartPrice}>${item.price}</p>
              
              <button 
                className={styles.removeButton} 
                onClick={() => handleRemoveItem(item.product_id)}
                onMouseEnter={() => handleMouseEnter(`Remove ${item.product_name} from cart.`)} 
                onMouseLeave={handleMouseLeave}
              >
                🗑 Remove
              </button>
            </div>
          ))}
          
          <div className={styles.cartTotal}>
            <h3 
              onMouseEnter={() => handleMouseEnter(`Total amount in cart is ${calculateTotal} dollars.`)} 
              onMouseLeave={handleMouseLeave}
            >
              Total: ${calculateTotal}
            </h3>
            <button 
              className={styles.checkoutButton} 
              onClick={() => navigate("/checkout")} 
              onMouseEnter={() => handleMouseEnter("Proceed to checkout.")} 
              onMouseLeave={handleMouseLeave}
              disabled={cartItems.length === 0}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;