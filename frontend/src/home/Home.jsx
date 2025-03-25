import { useEffect, useRef } from 'react';
import styles from "./Home.module.css";
import { Link } from 'react-router-dom';
import homeimg from "./home.webp";
import { AiOutlineLogin } from "react-icons/ai";

const Home = () => {
  const elementsRef = useRef([]);

  
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 1;
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') || 
        voice.name.includes('Google Indian English Female')
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Speech Synthesis API is not supported in this browser.');
    }
  };

 
  const handleFocus = (index) => {
    const element = elementsRef.current[index];
    if (element) {
      const text = element.getAttribute('aria-label') || element.textContent || '';
      speakText(text.trim());
    }
  };

  
  const handleMouseEnter = (event) => {
    const text = event.target.getAttribute('aria-label') || event.target.textContent || '';
    speakText(text.trim());
  };

  
  useEffect(() => {
    elementsRef.current = Array.from(document.querySelectorAll('[data-focusable="true"]'));

    elementsRef.current.forEach((element, index) => {
      element.addEventListener('focus', () => handleFocus(index));
      element.addEventListener('mouseenter', handleMouseEnter);
    });

   
    return () => {
      elementsRef.current.forEach((element, index) => {
        element.removeEventListener('focus', () => handleFocus(index));
        element.removeEventListener('mouseenter', handleMouseEnter);
      });
    };
  }, []);

  return (
    <div>
      <h1 
        className={styles.heading} 
        tabIndex="0" 
        data-focusable="true" 
        aria-label="EchoSavvy: Home Page . Move to the right for login button"
      >
        EchoSavvy
      </h1>

      <Link to="/login">
        <button
          className={styles.login}
          tabIndex="0"
          data-focusable="true"
          aria-label="Login Button. Click to navigate to the login page."
        >
          <AiOutlineLogin />
          Login
        </button>
      </Link>

      <div className={styles.content}>
        <p
          className={styles.welcome}
          tabIndex="0"
          data-focusable="true"
          aria-label="Welcome to EchoSavvy! We are an e-commerce platform designed to empower and assist visually impaired users. Our platform prioritizes accessibility, usability, and inclusivity to ensure a seamless shopping experience for everyone. Move to the top right for login button"
        >
          Welcome to EchoSavvy! We are an e-commerce platform designed to empower and assist visually impaired users. Our platform prioritizes accessibility, usability, and inclusivity to ensure a seamless shopping experience for everyone.
        </p>
        
        <img
          className={styles.homeimg}
          src={homeimg}
          alt="EchoSavvy logo"
          tabIndex="0"
          data-focusable="true"
          aria-label="EchoSavvy homepage illustration. Move to the top right for login button"
        />
      </div>

      <div className={styles.session}>
        <p 
          className={styles.copy} 
          tabIndex="0" 
          data-focusable="true" 
          aria-label="Copyright 2025 EchoSavvy. All rights reserved. Move to the top right for login button"
        >
          &copy; 2025 EchoSavvy. All rights reserved.
        </p>
        
        <p 
          className={styles.support} 
          tabIndex="0" 
          data-focusable="true" 
          aria-label="For support, contact echosavvy@gmail.com .Move to the top right for login button"
        >
          For support: echosavvy@gmail.com
        </p>
      </div>
    </div>
  );
};

export default Home;
