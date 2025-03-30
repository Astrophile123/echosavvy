import { useState, useEffect, useRef } from 'react';
import styles from "./Signup.module.css";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [userData, setUserData] = useState({ username: '', phone: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [currentField, setCurrentField] = useState(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const synthRef = useRef(window.speechSynthesis);
  const inputTimeout = useRef(null);


  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        console.log(`Recognized speech: ${transcript}`);

        setUserData((prev) => ({
          ...prev,
          [currentField]: transcript
        }));

        if (transcript.toLowerCase() === 'submit') {
          registerUser();
        }

        speakText(`You entered: ${transcript}`);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        speakText('Error with voice input. Please try again.');
      };

      recognitionRef.current = recognition;
    } else {
      console.error('Speech Recognition API is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [currentField]);

  
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
  
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Google UK English Female'));
  
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
  
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };
  

  const confirmDetails = () => {
    speakText(`You entered username: ${userData.username} and phone number: ${userData.phone}.`);
  };
  
  const handleFieldFocus = (field, message) => {
    setCurrentField(field);

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setTimeout(() => recognitionRef.current.start(), 200);
    }

    speakText(message);
  };

  
  const handleMouseHover = (message) => {
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
          const publicKey = publicKeyCredential.response.getPublicKey
            ? base64urlEncode(publicKeyCredential.response.getPublicKey())
            : base64urlEncode(publicKeyCredential.response.attestationObject);
      
          return { credential_id, public_key: publicKey }; // ✅ Fixed Typo
      
        } catch (error) {
          console.error(error);
          setErrorMessage('Fingerprint registration failed. Please try again.');
          speakText('Fingerprint registration failed. Please try again.');
          return null;
        }
      };

  const registerUser = async () => {
    const fingerprintData = await registerFingerprint();
    console.log("📤 Initiating fingerprint-based signup...");
    if (!fingerprintData) {
      setErrorMessage('Fingerprint registration failed. Please try again.');
      speakText('Fingerprint registration failed. Please try again.');
      return;
    }
    
    if (!userData.username.trim() || !userData.phone.trim()) {
      setErrorMessage("Username and phone number are required.");
      speakText("Username and phone number are required.");
      return;
    }
  
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
      <h1 
  className={styles.pageHeading} 
  onMouseEnter={() => handleMouseHover('Welcome to Echosavvy sign up page.')}
>
  Echosavvy
</h1>


      <div className={styles.formContainer}>
        <h2>Signup</h2>

        <input
          type="text"
          required
          placeholder="Enter Your Username"
          value={userData.username}  // FIXED: Changed from name to username
          onFocus={() => handleFieldFocus('username', 'Enter your user name and speak now.')}
          onChange={(e) => setUserData({ ...userData, username: e.target.value })}  // FIXED: Changed 'name' to 'username'
          onMouseEnter={() => handleMouseHover('Enter your username.')}
          className={styles.userFullNameInput}
        />

        <input
          type="tel"
          required
          placeholder="Enter Your Phone Number"
          value={userData.phone}
          onFocus={() => handleFieldFocus('phone', 'Enter your phone number and speak now.')}
          onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
          onMouseEnter={() => handleMouseHover('Enter your phone number.')}
          className={styles.userPhoneInput}
        />

        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

        <button
  className={styles.submitButton}
  onClick={registerUser}
  onMouseEnter={() => handleMouseHover("Click to sign up with fingerprint")}
  disabled={!userData.username || !userData.phone}
>
  Signup with Fingerprint
</button>


        <Link
          to="/login"
          onFocus={() => handleMouseHover('Navigate to login page.')}
          onMouseEnter={() => handleMouseHover('Navigate to login page.')}
          onMouseLeave={() => synthRef.current.cancel()}
        >
          <p className={styles.link}>Already Have An Account? Login now!</p>
        </Link>
      </div>
    </div>
  );
};

export default Signup;