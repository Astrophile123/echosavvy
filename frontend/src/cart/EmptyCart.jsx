import { Link } from "react-router-dom";
import styles from './EmptyCart.module.css';
import { speakText } from "./speechUtils";

const EmptyCart = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 onMouseEnter={() => speakText('Your Cart is Empty')}>Your Cart is Empty</h2>
        <p onMouseEnter={() => speakText('Please login to add items to your cart')}>Please login to add items to your cart</p>
        <div className={styles.buttons}>
          <Link to="/login" className={styles.loginButton}onMouseEnter={() => speakText('click to login now')}>
            Login
          </Link>
      
        </div>
      </div>
    </div>
  );
};

export default EmptyCart;