// src/notFound/NotFound.jsx
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './NotFound.module.css';

const NotFound = () => {
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1.1;
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    speak(" Page not found");
    return () => window.speechSynthesis.cancel();
  }, []);

  const handleHomeLinkHover = () => {
    speak("Return to home page");
  };

  const handleHomeLinkFocus = () => {
    speak("Return to home page, press enter to activate");
  };

  return (
    <div className={styles.container}>
      <h1 
        onMouseEnter={() => speak(" Page not found")}
        onFocus={() => speak(" Page not found")}
      >
        404 - Page Not Found
      </h1>
      <p 
        onMouseEnter={() => speak("The page you're looking for doesn't exist")}
        onFocus={() => speak("The page you're looking for doesn't exist")}
      >
        The page you&aposre looking for doesn&apost exist.
      </p>
      <Link 
        to="/" 
        className={styles.homeLink}
        onMouseEnter={handleHomeLinkHover}
        onFocus={handleHomeLinkFocus}
        onClick={() => speak("Returning to home page")}
      >
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;