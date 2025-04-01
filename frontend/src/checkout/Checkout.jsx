import { useEffect, useState } from 'react';
import styles from './Checkout.module.css';

const Checkout = () => {
  const [activePayment, setActivePayment] = useState(null);
  const [step, setStep] = useState(1); // Step 1: Payment selection, Step 2: Confirmation

  // Payment methods with accessibility features
  const paymentMethods = [
    {
      id: 'voice-pin',
      name: 'Voice Authentication',
      description: 'Confirm payment using your voice PIN',
      icon: '🗣️',
      instructions: 'After selecting, you will be prompted to say your 6-digit voice PIN'
    },
    {
      id: 'otp-call',
      name: 'OTP via Phone Call',
      description: 'Receive OTP through an automated phone call',
      icon: '📞',
      instructions: 'We will call your registered number with the verification code'
    },
    {
      id: 'tactile-card',
      name: 'Tactile Card Reader',
      description: 'For users with tactile payment cards',
      icon: '🖐️',
      instructions: 'Insert your card into the accessible reader when prompted'
    }
  ];

  // Screen reader announcements
  const announce = (message, priority = 'polite') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech before announcing
      const speech = new SpeechSynthesisUtterance(message);

      // Wait for voices to load
      const voicesLoaded = () => {
        const voices = window.speechSynthesis.getVoices();

        // Try to find Google UK English Female voice
        const googleUKVoice = voices.find((voice) => voice.name === 'Google UK English Female');
        
        // If the desired voice is available, use it
        if (googleUKVoice) {
          speech.voice = googleUKVoice;
        } else {
          // Fallback to the first available voice if Google UK English Female is not found
          speech.voice = voices[0];
        }

        speech.lang = 'en-GB'; // Set language to UK English
        speech.rate = 0.9;      // Adjust speech rate for clarity
        speech.pitch = 1.0;     // Normal pitch

        // Speak the message
        window.speechSynthesis.speak(speech);
      };

      // If voices are not loaded, wait for the 'onvoiceschanged' event
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = voicesLoaded;
      } else {
        voicesLoaded();
      }
    }

    // Update the live region for screen readers
    const liveRegion = document.getElementById('a11y-live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.innerText = message;

      // Clear after 2 seconds to allow re-announcement if needed
      setTimeout(() => {
        liveRegion.innerText = '';
      }, 2000);
    }
  };

  useEffect(() => {
    announce('Checkout page loaded. Please select your preferred payment method.');

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePaymentSelect = (method) => {
    setActivePayment(method);
    announce(`Selected ${method.name}. ${method.instructions}. Press the confirm button to proceed.`);
  };

  const handleConfirm = () => {
    if (!activePayment) {
      announce('Please select a payment method first.', 'assertive');
      return;
    }
    setStep(2);
    announce(`You have selected ${activePayment.name}. Preparing your payment. Please wait.`);

    // Simulate payment processing
    setTimeout(() => {
      announce(`Payment with ${activePayment.name} is being processed. You will receive confirmation shortly.`);
    }, 3000);
  };

  const handleMouseEnter = (method) => {
    announce(`${method.name}: ${method.description}`);
  };

  const handleMouseHoverConfirm = () => {
    announce('Confirming payment method. Click to confirm the selected method.');
  };

  return (
    <div className={styles.checkoutContainer}>
      {/* Hidden live region for screen reader announcements */}
      <div id="a11y-live-region" aria-live="polite" className={styles.hidden}></div>

      <h1 className={styles.pageTitle} aria-label="Checkout">Checkout</h1>

      {step === 1 ? (
        <>
          <div className={styles.paymentMethods}>
            <h2 className={styles.sectionTitle}>Select Payment Method</h2>
            {paymentMethods.map(method => (
              <div 
                key={method.id}
                className={`${styles.paymentCard} ${activePayment?.id === method.id ? styles.active : ''}`}
                onClick={() => handlePaymentSelect(method)}
                onKeyDown={(e) => e.key === 'Enter' && handlePaymentSelect(method)}
                tabIndex="0"
                aria-label={`${method.name}. ${method.description}`}
                role="button"
                onMouseEnter={() => handleMouseEnter(method)} // Trigger announcement on hover
              >
                <span className={styles.paymentIcon} aria-hidden="true">{method.icon}</span>
                <div className={styles.paymentDetails}>
                  <h3>{method.name}</h3>
                  <p>{method.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button 
            className={styles.confirmButton}
            onClick={handleConfirm}
            aria-label="Confirm payment method"
            onMouseEnter={handleMouseHoverConfirm} // Trigger confirmation speech on hover
          >
            Confirm Payment Method
          </button>
        </>
      ) : (
        <div className={styles.confirmationScreen}>
          <div className={styles.progressIndicator} aria-hidden="true">
            <div className={styles.progressBar}></div>
          </div>
          
          <h2 className={styles.sectionTitle}>Processing Your Payment</h2>
          {activePayment && (
            <p className={styles.paymentMethodInfo}>
              Using: {activePayment.name} ({activePayment.description})
            </p>
          )}

          {activePayment && (
            <div className={styles.instructions}>
              <h3>Next Steps:</h3>
              <p>{activePayment.instructions}</p>
            </div>
          )}

          <div className={styles.tactileFeedback} aria-hidden="true">
            <div className={styles.vibrationPattern}></div>
            <div className={styles.vibrationPattern}></div>
            <div className={styles.vibrationPattern}></div>
          </div>

          <button 
            className={styles.cancelButton}
            onClick={() => setStep(1)}
            aria-label="Go back to payment selection"
          >
            Change Payment Method
          </button>
        </div>
      )}

      <div className={styles.accessibilityFeatures}>
        <button 
          className={styles.accessibilityButton}
          onClick={() => announce('Current status: ' + (step === 1 ? 
            'Select payment method. Options available: ' + paymentMethods.map(m => m.name).join(', ') : 
            `Processing with ${activePayment?.name}. ${activePayment?.instructions}`))}
          aria-label="Repeat current status"
        >
          Repeat Instructions
        </button>
        <button 
          className={styles.accessibilityButton}
          onClick={() => window.speechSynthesis.cancel()}
          aria-label="Stop speech"
        >
          Stop Speech
        </button>
      </div>
    </div>
  );
};

export default Checkout;
