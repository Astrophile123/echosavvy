import { useEffect, useRef } from 'react';
import styles from "./Home.module.css";
import { Link } from 'react-router-dom';
import homeimg from "./home.webp";
import { AiOutlineLogin } from "react-icons/ai";
import { RiShoppingBag4Line } from "react-icons/ri";

const Home = () => {
  const elementsRef = useRef([]);

  // Speech synthesis function with slower speed for Indian users
  const speakText = (text) => {
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(voice =>
      voice.name.includes('Indian') || voice.lang === 'en-IN'
    );

    if (indianVoice) {
      utterance.voice = indianVoice;
    } else if (voices.length > 0) {
      utterance.voice = voices[0];
    }

    window.speechSynthesis.speak(utterance);
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
    speakText("Welcome to EchoSavvy! An accessible e-commerce platform. Move to the top right for login or browse products.");
    
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
  },);

  return (
    <div>
      <h1 
        className={styles.heading} 
        tabIndex="0" 
        data-focusable="true" 
        aria-label="EchoSavvy: Home Page"
      >
        EchoSavvy
      </h1>

      <div className={styles.buttonGroup}>
        <Link to="/login">
          <button
            className={styles.login}
            tabIndex="0"
            data-focusable="true"
            aria-label="Login Button. Click to navigate to the login page."
          >
            <AiOutlineLogin size={20} />
            <span className={styles.buttonText}>Login</span>
          </button>
        </Link>

        <Link to="/products">
          <button
            className={styles.productsBtn}
            tabIndex="0"
            data-focusable="true"
            aria-label="Browse Products Button. Click to view all available products without logging in."
          >
            <RiShoppingBag4Line size={20} /> 
            <span className={styles.buttonText}>Products</span>
          </button>
        </Link>
      </div>

      <div className={styles.content}>
        <p
          className={styles.welcome}
          tabIndex="0"
          data-focusable="true"
          aria-label="Welcome to EchoSavvy! We are an e-commerce platform designed to empower and assist visually impaired users. Our platform prioritizes accessibility, usability, and inclusivity to ensure a seamless shopping experience for everyone."
        >
          Welcome to EchoSavvy! We are an e-commerce platform designed to empower and assist visually impaired users. Our platform prioritizes accessibility, usability, and inclusivity to ensure a seamless shopping experience for everyone.
        </p>
        
        <img
          className={styles.homeimg}
          src={homeimg}
          alt="EchoSavvy logo"
          tabIndex="0"
          data-focusable="true"
          aria-label="EchoSavvy homepage illustration."
        />
      </div>

      <div className={styles.session}>
        <p 
          className={styles.copy} 
          tabIndex="0" 
          data-focusable="true" 
          aria-label="Copyright 2025 EchoSavvy. All rights reserved."
        >
          &copy; 2025 EchoSavvy. All rights reserved.
        </p>
        
        <p 
          className={styles.support} 
          tabIndex="0" 
          data-focusable="true" 
          aria-label="For support, contact echosavvy@gmail.com"
        >
          For support: echosavvy@gmail.com
        </p>
      </div>
    </div>
  );
};

export default Home;