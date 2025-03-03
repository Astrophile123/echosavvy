import React, { useEffect } from 'react';
import styles from './Checkout.module.css';

const Checkout = () => {
  // Optional: Text-to-speech announcement
  useEffect(() => {
    const message = 'Redirecting to payment page. Please do not refresh the page or go back.';
    const speech = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(speech); // Announce the message

    // Cleanup speech synthesis on component unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className={styles.checkoutContainer}>
      <h1 className={styles.redirectMessage}>Redirecting to Payment Page...</h1>
      <p className={styles.warningMessage}>Please do not refresh the page or go back.</p>
    </div>
  );
};

export default Checkout;