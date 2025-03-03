import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';

const Login = () => {
  const [userData, setUserData] = useState({ username: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const navigate = useNavigate();

  const base64urlToUint8Array = (base64url) => {
    if (!base64url || typeof base64url !== "string") return new Uint8Array();
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(base64);
    return new Uint8Array([...binaryString].map(char => char.charCodeAt(0)));
  };

  const uint8ArrayToBase64 = (arrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const speakText = useCallback((text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1.2;
    utterance.voice = synthRef.current.getVoices().find(voice => voice.name.includes("Google UK English Female")) || synthRef.current.getVoices()[0];
    synthRef.current.speak(utterance);
  }, []);

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

      recognition.onerror = () => speakText('Voice input failed. Please try again.');
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
      setTimeout(() => recognitionRef.current.start(), 200);
    }
    speakText(`Please say your ${field}`);
  }, [speakText]);

  const handleMouseHover = (message) => {
    speakText(message);
  };

  const authenticateWithFingerprint = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      speakText("Fetching authentication challenge. Please wait.");
      const challengeResponse = await axios.post('http://localhost:8082/api/get-challenge', { username: userData.username });
      if (!challengeResponse.data.success) throw new Error(challengeResponse.data.message || "Failed to get challenge.");
      
      const { challenge, credential_id } = challengeResponse.data;
      if (!challenge || !credential_id) throw new Error("Invalid challenge response from server.");

      speakText("Place your finger on the scanner to log in.");
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: base64urlToUint8Array(challenge),
          allowCredentials: [{ id: base64urlToUint8Array(credential_id), type: "public-key" }],
          userVerification: "required",
          timeout: 60000,
        },
      });
      
      if (!credential) throw new Error("Fingerprint authentication failed.");
      
      const response = await axios.post('http://localhost:8082/api/login', {
        username: userData.username,
        credential_id: uint8ArrayToBase64(credential.rawId),
        authenticatorData: uint8ArrayToBase64(credential.response.authenticatorData),
        clientDataJSON: uint8ArrayToBase64(credential.response.clientDataJSON),
        signature: uint8ArrayToBase64(credential.response.signature),
      });

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        speakText("Login successful. Redirecting to the products page.");
        navigate('/products');
      } else {
        throw new Error(response.data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage(error.message);
      speakText(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.pageHeading} onMouseEnter={() => handleMouseHover("Welcome to EchoSavvy login page")}>Echosavvy</h1>
      <div className={styles.formContainer}>
        <h2 onMouseEnter={() => handleMouseHover("Login page")}>Login</h2>
        <input
          type="text"
          required
          placeholder="Enter Your Username"
          value={userData.username}
          onFocus={() => handleFieldFocus('username')}
          onChange={(e) => setUserData({ ...userData, username: e.target.value })}
          onMouseEnter={() => handleMouseHover("Enter your username")}
          className={styles.userPhoneInput}
          disabled={loading}
        />
        {errorMessage && <p className={styles.errorMessage} onMouseEnter={() => handleMouseHover(errorMessage)}>{errorMessage}</p>}
        <button className={styles.submitButton} onClick={authenticateWithFingerprint} onMouseEnter={() => handleMouseHover("Click to login with fingerprint")} disabled={loading}>
          {loading ? 'Authenticating...' : 'Login with Fingerprint'}
        </button>
        <Link to="/signup" onMouseEnter={() => handleMouseHover("Go to Signup Page")}> 
          <p className={styles.link}>Don't Have An Account? Signup now!</p>
        </Link>
      </div>
    </div>
  );
};

export default Login;


