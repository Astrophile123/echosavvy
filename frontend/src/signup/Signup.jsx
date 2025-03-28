import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './Signup.module.css';

const Signup = () => {
  const [userData, setUserData] = useState({ username: '', phone: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [currentField, setCurrentField] = useState(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const inputTimeout = useRef(null);
  const navigate = useNavigate();

  const speakText = useCallback((text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.voice =
      synthRef.current.getVoices().find((voice) => voice.name.includes("Google UK English Female")) ||
      synthRef.current.getVoices()[0];
    synthRef.current.speak(utterance);
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';


      recognition.onresult = (event) => {
        clearTimeout(inputTimeout.current);
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
    
        if (transcript.length > 1) {
            recognitionRef.current.inputReceived = true;
            setUserData((prev) => ({ ...prev, [currentField]: transcript }));
            speakText(`You entered: ${transcript}`);
        } else {
            recognitionRef.current.inputReceived = false;
            speakText("No input detected. Please try again.");
            setTimeout(() => recognitionRef.current.start(), 2000);
        }
    };
    
    recognition.onend = () => {
        setTimeout(() => {
            if (!recognitionRef.current.inputReceived) { 
                speakText("No input detected. Please try again.");
                setTimeout(() => recognitionRef.current.start(), 5000); 
            }
            recognitionRef.current.inputReceived = false;  
        }, 500);
    
      };
        recognitionRef.current = recognition;
      } else {
        speakText('Sorry, your browser does not support voice input.');
      }
  
      return () => recognitionRef.current?.stop();
    }, [currentField, speakText]);
  const handleFieldFocus = useCallback((field) => {
    setCurrentField(field);

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    speakText(`Please say your ${field}`);

    setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    }, 2000);
  }, [speakText]);

  const base64urlEncode = (buffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      const registerFingerprint = async () => {
        try {
          const publicKeyCredential = await navigator.credentials.create({
            publicKey: {
              challenge: crypto.getRandomValues(new Uint8Array(32)),
              rp: { name: 'Echosavvy' },
              user: {
                id: new TextEncoder().encode(userData.username),
                name: userData.username,
                displayName: userData.username,
              },
              pubKeyCredParams: [
                { type: 'public-key', alg: -7 },
                { type: 'public-key', alg: -257 },
              ],
              authenticatorSelection: { authenticatorAttachment: 'platform' },
              timeout: 60000,
              attestation: 'none',
            },
          });
      
          if (!publicKeyCredential) throw new Error('Fingerprint registration failed.');
      
          const credential_id = publicKeyCredential.id;
          const public_key = base64urlEncode(publicKeyCredential.response.clientDataJSON);
      
          return { credential_id, public_key };
        } catch (error) {
          console.error(error);
          setErrorMessage('Fingerprint registration failed. Please try again.');
          speakText('Fingerprint registration failed. Please try again.');
          return null;
        }
      };

      
  const registerUser = async () => {
    const fingerprintData = await registerFingerprint();
    if (!fingerprintData) return;

    try {
      const response = await axios.post('http://localhost:8082/api/signup', {
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
    } catch (error) {
      console.error(error.response?.data || error.message);
      setErrorMessage('Signup failed. Please check your connection and try again.');
      speakText('Signup failed. Please check your connection and try again.');
    }
  };

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.pageHeading} onMouseEnter={() => speakText('Welcome to Echosavvy signup page')}>
        Echosavvy
      </h1>
      <div className={styles.formContainer}>
        <h2 onMouseEnter={() => speakText('Signup Form')}>Signup</h2>
        <input
          type="text"
          placeholder="Enter Your Username"
          value={userData.username}
          onFocus={() => handleFieldFocus('username')}
          onChange={(e) => setUserData({ ...userData, username: e.target.value })}
          onMouseEnter={() => speakText('Enter your username')}
          className={styles.userInput}
        />
        <input
          type="tel"
          placeholder="Enter Your Phone Number"
          value={userData.phone}
          onFocus={() => handleFieldFocus('phone')}
          onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
          onMouseEnter={() => speakText('Enter your phone number')}
          className={styles.userInput}
        />
        {errorMessage && <p className={styles.errorMessage} onMouseEnter={() => speakText(errorMessage)}>{errorMessage}</p>}
        <button className={styles.submitButton} onClick={registerUser} onMouseEnter={() => speakText('Signup with Fingerprint')}>
          Signup with Fingerprint
        </button>
        <Link to="/login">
          <p className={styles.link} onMouseEnter={() => speakText('Already have an account? Login now!')}>
            Already Have An Account? Login now!
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Signup;
