import React, { useContext } from "react";
import { CartContext } from "../context/CartContext";
import styles from "../styles/Cart.module.css";

const CartItems = () => {
  const { cartItems, updateQuantity, removeFromCart } = useContext(CartContext);

  const handleMouseEnter = (text) => {
    if (!window.speechSynthesis.speaking) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={styles.cartItems}>
      {cartItems.length === 0 ? (
        <p className={styles.noResults}>Your cart is empty</p>
      ) : (
        cartItems.map((item) => (
          <div
            key={item.product_id}
            className={styles.cartItem}
            onMouseEnter={() => handleMouseEnter(item.product_name)}
          >
            <div className={styles.cartImageName}>
              <img
                src={item.image_url}
                alt={item.product_name}
                className={styles.cartImage}
              />
              <p className={styles.cartProductName}>{item.product_name}</p>
            </div>
            <div className={styles.cartAmountToggle}>
              <button onClick={() => item.quantity>1 && updateQuantity(item.product_id, item.quantity - 1)}>
                -
              </button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                +
              </button>
            </div>
            <p className={styles.cartPrice}>${(item.price * item.quantity).toFixed(2)}</p>
            <button
              className={styles.removeButton}
              onClick={() => removeFromCart(item.product_id)}
            >
              Remove
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default CartItems;