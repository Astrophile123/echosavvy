import React from "react";
import { FaTrash } from "react-icons/fa";
import { useCart } from "./CartContext";

const CartItems = ({ item, onMouseEnter, onMouseLeave }) => {
  const { product_id, product_name, price, quantity, image_url } = item;
  const { removeItem, increaseAmount, decreaseAmount } = useCart();

  return (
    <div
      className="cart-item"
      aria-label={`Cart item: ${product_name}, Quantity: ${quantity}, Price: ${price}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="cart-image--name">
        <img src={image_url} alt={product_name} aria-hidden="true" />
        <p>{product_name}</p>
      </div>
      <p aria-label={`Price: ${price}`}>${price}</p>
      <div className="cart-amount-toggle">
        <button
          onClick={() => decreaseAmount(product_id)} 
          aria-label={`Decrease quantity of ${product_name}. Current quantity: ${quantity}`}
        >
          -
        </button>
        <span aria-label={`Quantity: ${quantity}`}>{quantity}</span>
        <button
          onClick={() => increaseAmount(product_id)} 
          aria-label={`Increase quantity of ${product_name}. Current quantity: ${quantity}`}
        >
          +
        </button>
      </div>
      <p aria-label={`Total: ${price * quantity}`}>Total: ${(price * quantity).toFixed(2)}</p>
      <FaTrash
        className="remove-icon"
        onClick={() => removeItem(product_id)}
        aria-label={`Remove ${product_name} from cart. To remove, please click on this button.`}
      />
    </div>
  );
};

export default CartItems;