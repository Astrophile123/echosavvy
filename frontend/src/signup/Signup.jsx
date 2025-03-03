import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './Signup.module.css';

const Signup = () => {
  const [userData, setUserData] = useState({ username: '', phone: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [currentField, setCurrentField] = useState(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        setUserData((prev) => ({ ...prev, [currentField]: transcript }));
        speakText(`You entered: ${transcript}`);
      };

      recognition.onerror = () => {
        speakText('Error with voice input. Please try again.');
      };

      recognitionRef.current = recognition;
    }
  }, [currentField]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.2;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFieldFocus = (field, message) => {
    setCurrentField(field);
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setTimeout(() => recognitionRef.current.start(), 200);
    }
    speakText(message);
  };

  const base64urlEncode = (buffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  const registerFingerprint = async () => {
    try {
      const publicKeyCredential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: 'Echosavvy' },
          user: {
            id: new Uint8Array(16),
            name: userData.username,
            displayName: userData.username,
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: { authenticatorAttachment: 'platform' },
          timeout: 60000,
          attestation: 'none',
        },
      });

      if (!publicKeyCredential) throw new Error('Fingerprint registration failed.');

      const credential_id = publicKeyCredential.id;
      const public_key = base64urlEncode(publicKeyCredential.response.attestationObject);

      return { credential_id, public_key };
    } catch {
      setErrorMessage('Fingerprint registration failed. Please try again.');
      speakText('Fingerprint registration failed. Please try again.');
      return null;
    }
  };

  const registerUser = async () => {
    const fingerprintData = await registerFingerprint();
    if (!fingerprintData) return;

    try {
      const response = await axios.post('http://localhost:8082/signup', {
        ...userData,
        credential_id: fingerprintData.credential_id,
        public_key: fingerprintData.public_key,
      });

      if (response.status === 200) {
        speakText('Signup successful. Redirecting to products page.');
        navigate('/products');
      } else {
        throw new Error('Signup failed');
      }
    } catch {
      setErrorMessage('Signup failed. Please check your connection and try again.');
      speakText('Signup failed. Please check your connection and try again.');
    }
  };

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.pageHeading}>Echosavvy</h1>
      <div className={styles.formContainer}>
        <h2>Signup</h2>
        <input
          type="text"
          placeholder="Enter Your Username"
          value={userData.username}
          onFocus={() => handleFieldFocus('username', 'Enter your username and speak now.')}
          onChange={(e) => setUserData({ ...userData, username: e.target.value })}
          className={styles.userInput}
        />
        <input
          type="tel"
          placeholder="Enter Your Phone Number"
          value={userData.phone}
          onFocus={() => handleFieldFocus('phone', 'Enter your phone number and speak now.')}
          onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
          className={styles.userInput}
        />
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        <button className={styles.submitButton} onClick={registerUser}>Signup with Fingerprint</button>
        <Link to="/login">
          <p className={styles.link}>Already Have An Account? Login now!</p>
        </Link>
      </div>
    </div>
  );
};

export default Signup;
