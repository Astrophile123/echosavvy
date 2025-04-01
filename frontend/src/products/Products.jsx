import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TiShoppingCart } from "react-icons/ti";
import { HiMicrophone } from "react-icons/hi2";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { MdOutlineHome } from "react-icons/md";
import styles from "./Products.module.css";
import axios from "axios";

const products = [
  { id: 22, name: "Smartphone", category: "Mobile Phones", price: "₹12000", description: "Latest model with high-resolution camera and fast processor.", image: "/image/phone.png" },
  { id: 23, name: "Laptop", category: "Computers", price: "₹55999", description: "Powerful laptop with 16GB RAM and 512GB SSD.", image: "/image/laptop.jpeg" },
  { id: 24, name: "Tablet", category: "Tablets", price: "₹13000", description: "Lightweight tablet with a stunning display and long battery life.", image: "/image/tab.avif" },
  { id: 25, name: "Smartwatch", category: "Wearables", price: "₹5000", description: "Track your fitness and receive notifications on the go.", image: "/image/fit.jpg" },
  { id: 26, name: "Wireless Headphones", category: "Audio", price: "₹2500", description: "Noise-canceling headphones with superior sound quality.", image: "/image/wirelessheadphones.jpg" },
  { id: 27, name: "Bluetooth Speaker", category: "Audio", price: "₹3500", description: "Portable speaker with rich sound and long battery life.", image: "/image/speak.webp" },
  { id: 28, name: "Digital Camera", category: "Cameras", price: "₹35000", description: "High-quality camera for stunning photography.", image: "/image/cam.png" },
  { id: 29, name: "Gaming Console", category: "Gaming", price: "₹5000", description: "Next-gen gaming console with immersive graphics and exclusive games.", image: "/image/console.webp" },
  { id: 30, name: "E-Reader", category: "E-Readers", price: "₹20000", description: "Lightweight e-reader with a glare-free display for reading anywhere.", image: "/image/epaper.png" },
  { id: 31, name: "Drone", category: "Drones", price: "₹10000", description: "High-performance drone with HD camera and long flight time.", image: "/image/drone.jpeg" },
  { id: 32, name: "Monitor", category: "Computers", price: "₹2500", description: "27-inch 4K monitor with vibrant colors and sharp details.", image: "/image/monitor1.jpg" },
  { id: 33, name: "Printer", category: "Office", price: "₹18000", description: "All-in-one printer for home and office use.", image: "/image/printer.png" },
  { id: 34, name: "External Hard Drive", category: "Storage", price: "₹5000", description: "1TB external hard drive for extra storage.", image: "/image/harddisk.png" },
  { id: 35, name: "Router", category: "Networking", price: "₹1500", description: "High-speed Wi-Fi router for seamless connectivity.", image: "/image/router1.jpeg" },
  { id: 36, name: "Keyboard", category: "Accessories", price: "₹4500", description: "Mechanical keyboard for gamers and typists.", image: "/image/keyboard.webp" },
  { id: 37, name: "Mouse", category: "Accessories", price: "₹1600", description: "Ergonomic mouse for comfortable use.", image: "/image/mouse.jpeg" },
  { id: 38, name: "Smart Bulb", category: "Smart Home", price: "₹250", description: "Wi-Fi enabled smart bulb for home automation.", image: "/image/bulb.jpg" },
  { id: 39, name: "Power Bank", category: "Accessories", price: "₹1500", description: "10000mAh power bank for on-the-go charging.", image: "/image/power.jpeg" },
  { id: 40, name: "VR Headset", category: "Gaming", price: "₹35000", description: "Immersive VR headset for gaming and entertainment.", image: "/image/vrhead.webp" },
];

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [isListening, setIsListening] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();


  const searchInputRef = useRef(null);
  const microphoneRef = useRef(null);
  const cartButtonRef = useRef(null);
  const logoutButtonRef = useRef(null);
  const homeButtonRef = useRef(null);
  const productRefs = useRef([]);


  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    setIsLoggedIn(!!token && !!userId);
  }, []);

  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = "en-IN";
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        handleCartClick();
      }
      if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        if (isLoggedIn) handleLogout();
      }
      if (e.ctrlKey && e.key === "h") {
        e.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoggedIn]);

 
  useEffect(() => {
    const results = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm]);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    if (value && filteredProducts.length === 0) {
      speakText("No products found matching your search.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    speakText("Logged out successfully");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const handleSpeechResult = (event) => {
    const transcript = event.results[0][0].transcript;
    setSearchTerm(transcript);
    setIsListening(false);
  };

  const handleSpeechError = () => {
    setIsListening(false);
    speakText("Sorry, I couldn't understand you. Please try again.");
  };

  const startVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
      speakText("Listening...");
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB'; 
    utterance.rate = .85;
    utterance.pitch = 1.2;

    const voices = window.speechSynthesis.getVoices();


    let selectedVoice = voices.find(voice => 
        voice.lang === 'en-GB' && voice.name.toLowerCase().includes("female")
    );

 
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang === 'en-GB');
    }

    if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
};

  const handleCartClick = () => {
    if (isLoggedIn) {
      navigate("/cart");
    } else {
      speakText("Please login to view your cart");
      navigate("/empty-cart");
    }
  };

  const handleAddToCart = async (product) => {
    if (!isLoggedIn) {
      speakText("Please login to add items to cart");
      navigate("/login");
      return;
    }

    const cleanPrice = Number(String(product.price).replace(/[^0-9.-]+/g, ""));
    
    if (isNaN(cleanPrice)) {
      speakText(`Invalid price format for ${product.name}`);
      return;
    }

    try {
      speakText(`Adding ${product.name} to cart...`);
      await axios.post(
        "http://localhost:8082/api/cart/add",
        {
          user_id: localStorage.getItem("user_id"),
          product_id: product.id,
          product_name: product.name,
          price: cleanPrice,
          quantity: 1,
          image_url: product.image
        },
        { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
      );
      speakText(`${product.name} added to cart successfully!`);
      navigate("/cart");
    } catch (error) {
      speakText("Failed to add to cart. Please try again.");
    }
  };

  return (
    <main className={styles.productDisplay}>
      <div className={styles.topBar}>
        <h1 
          className={styles.platformName} 
          onMouseEnter={() => speakText("Welcome to EchoSavvy products page")}
          onFocus={() => speakText("EchoSavvy products page")}
          tabIndex="0"
        >
          Echosavvy
        </h1>

        <div className={styles.searchContainer}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products..."
            className={styles.searchBar}
            value={searchTerm}
            onChange={handleSearch}
            aria-label="Search products by name"
            onMouseEnter={() => speakText("Search bar. Type or move to the right for voice search")}
            onFocus={() => speakText("Search products by moving to the right")}
            tabIndex="0"
          />

          <HiMicrophone
            ref={microphoneRef}
            className={styles.microphoneIcon}
            size={20}
            onClick={startVoiceSearch}
            onKeyDown={(e) => { 
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                startVoiceSearch();
              }
            }}
            tabIndex="0"
            aria-label="Start voice search"
            onMouseEnter={() => speakText("Voice search button")}
          />
        </div>

        <div className={styles.userControls}>
          <button 
            ref={cartButtonRef}
            onClick={handleCartClick}
            className={styles.cartButton}
            onMouseEnter={() => speakText(isLoggedIn ? "View your cart" : "Login to view cart")}
            onFocus={() => speakText(isLoggedIn ? "View your cart" : "Login to view cart")}
            tabIndex="0"
          >
            <TiShoppingCart size={24} aria-hidden="true" /> 
            <span>Cart</span>
          </button>
          
          {isLoggedIn ? (
            <button 
              ref={logoutButtonRef}
              className={styles.logoutButton} 
              onClick={handleLogout}
              onMouseEnter={() => speakText("Logout button")}
              onFocus={() => speakText("Press to logout")}
              tabIndex="0"
            >
              <RiLogoutBoxRLine size={18} aria-hidden="true" />
              <span>Logout</span>
            </button>
          ) : (
            <Link 
              ref={homeButtonRef}
              to="/" 
              className={styles.homeButton}
              onMouseEnter={() => speakText("Home, press to return")}
              onFocus={() => speakText("Go to home page")}
              tabIndex="0"
            >
              <MdOutlineHome size={20} aria-hidden="true" />
              <span>Home</span>
            </Link>
          )}
        </div>
      </div>

      <div className={styles.productsDisp}>
        <div className={styles.productGrid}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <div
                key={product.id}
                ref={el => productRefs.current[index] = el}
                className={styles.productCard}
                tabIndex="0"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddToCart(product);
                  }
                }}
                onMouseEnter={() => speakText(`${product.name}, ₹${product.price}`)}
                onFocus={() => speakText(`${product.name}, ₹${product.price}`)}
              >
                <img 
                  src={product.image} 
                  alt={product.name}
                  className={styles.productImage}
                  aria-hidden="true"
                />
                <h3>{product.name}</h3>
                <p className={styles.category}>Category: {product.category}</p>
                <p className={styles.price}>{product.price}</p>
                <button
                  className={styles.addToCart}
                  onClick={() => handleAddToCart(product)}
                  onMouseEnter={() => speakText(`Add ₹${product.name} to cart`)}
                  tabIndex="-1" 
                >
                  Add to Cart
                </button>
              </div>
            ))
          ) : (
            <p 
              className={styles.noResults}
              aria-live="polite"
              onMouseEnter={() => speakText("No products found")}
              onFocus={() => speakText("No matching products found")}
            >
              No products found.
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Products;