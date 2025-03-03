import { useState } from 'react';
import styles from './Checkout.module.css';

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Order placed successfully!');
  };

  return (
    <div className={styles.checkoutContainer}>
      <h1 className={styles.checkoutHeader}>Checkout</h1>
      <form onSubmit={handleSubmit} className={styles.checkoutForm}>
        <div className={styles.paymentSection}>
          <h2>Payment Method</h2>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="creditCard"
              checked={paymentMethod === 'creditCard'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Credit Card
          </label>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="paypal"
              checked={paymentMethod === 'paypal'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            PayPal
          </label>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="cashOnDelivery"
              checked={paymentMethod === 'cashOnDelivery'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Cash on Delivery
          </label>
        </div>

        <div className={styles.addressSection}>
          <h2>Shipping Address</h2>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address"
            required
          />
        </div>

        <div className={styles.phoneSection}>
          <h2>Phone Number</h2>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            required
          />
        </div>

        <button type="submit" className={styles.submitButton}>
          Place Order
        </button>
      </form>
    </div>
  );
};

export default Checkout;