import React, { useEffect, useState, useRef } from "react";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";
import styles from "./Cart.module.css";


const speakText = (text) => {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(
      (v) =>
        v.name.includes("Google हिन्दी") ||
        v.name.includes("Microsoft Neerja") ||
        v.name.includes("Google भारतीय महिला")
    );
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.pitch = 1;
    utterance.rate = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }
};

const stopSpeech = () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
};

const Cart = () => {
  const { cartItems, fetchCartItems, removeItem, updateQuantity } = useCart();
  const user_id = localStorage.getItem("user_id");
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    fetchCartItems(user_id);
  }, [user_id]);

  useEffect(() => {
    if (cartItems.length === 0) {
      speakText("Your cart is empty.");
    } else {
      speakText(`You have ${cartItems.length} items in your cart.`);
    }

    return () => stopSpeech();
  }, [cartItems]);

  useEffect(() => {
    const handleWindowBlur = () => {
      stopSpeech();
      setIsSpeaking(false);
    };

    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  const calculateTotal = () => {
    return cartItems
      .reduce((total, item) => {
        const price =
          typeof item.price === "string"
            ? parseFloat(item.price.replace("$", ""))
            : parseFloat(item.price);
        return total + price * item.quantity;
      }, 0)
      .toFixed(2);
  };

  const handleMouseEnter = (text) => {
    if (!isSpeaking) {
      setIsSpeaking(true);
      speakText(text);
    }
  };

  const handleMouseLeave = () => {
    setIsSpeaking(false);
    stopSpeech();
  };

  return (
    <div className={styles.cartPage} aria-label="Cart page">
      <h1 className={styles.heading} onMouseEnter={() => handleMouseEnter("EchoSavvy Cart")}>
        EchoSavvy Cart
      </h1>
      <h2 className={styles.heading1} aria-label="Your cart" onMouseEnter={() => handleMouseEnter("Your cart .")}>
        🛒 Your Cart
      </h2>

      {cartItems.length === 0 ? (
        <p
          className={styles.noResults}
          aria-label="Your cart is empty"
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
              onMouseEnter={() =>
                handleMouseEnter(
                  `Product: ${item.product_name}, Quantity: ${item.quantity}, Price: ${item.price} dollars.`
                )
              }
              onMouseLeave={handleMouseLeave}
            >
              <div className={styles.cartImageName}>
                <img
                  src={item.image}
                  alt={item.product_name}
                  className={styles.cartImage}
                  onError={(e) => {
                    e.target.src = "";
                  }}
                />
                <p className={styles.cartProductName}>{item.product_name}</p>
              </div>

              <div className={styles.cartAmountToggle}>
                <button
                  onClick={() => {
                    if (item.quantity > 1) {
                      updateQuantity(item.product_id, item.quantity - 1);
                    }
                  }}
                  onMouseEnter={() =>
                    handleMouseEnter("Decrease quantity by one.")
                  }
                  onMouseLeave={handleMouseLeave}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  onMouseEnter={() =>
                    handleMouseEnter("Increase quantity by one.")
                  }
                  onMouseLeave={handleMouseLeave}
                >
                  +
                </button>
              </div>

              <p className={styles.cartPrice}>${item.price}</p>

              <button
                className={styles.removeButton}
                onClick={() => removeItem(item.product_id)}
                onMouseEnter={() =>
                  handleMouseEnter(`Remove ${item.product_name} from cart.`)
                }
                onMouseLeave={handleMouseLeave}
              >
                🗑 Remove
              </button>
            </div>
          ))}

          <div className={styles.cartTotal}>
            <h3
              aria-label={`Total: $${calculateTotal()}`}
              onMouseEnter={() =>
                handleMouseEnter(`Total amount in cart is ${calculateTotal()} dollars.`)
              }
              onMouseLeave={handleMouseLeave}
            >
              Total: ${calculateTotal()}
            </h3>
            <button
            className={styles.checkoutButton}
            aria-label="Proceed to checkout. To proceed, please click on this button."
               onMouseEnter={() =>
              handleMouseEnter("Proceed to checkout. Click to proceed.")
              }
            onMouseLeave={handleMouseLeave}
            onClick={() => navigate("/checkout")} 
            >
           Proceed to Checkout
          </button>
          </div>
        </div>
      )}

      <button
        className={styles.continueShopping}
        onClick={() => navigate("/products")}
        aria-label="Continue shopping. To continue shopping, please click on this button."
        onMouseEnter={() => handleMouseEnter("Continue shopping. Click to continue.")}
        onMouseLeave={handleMouseLeave}
      >
        Continue Shopping
      </button>
    </div>
  );
};

export default Cart;