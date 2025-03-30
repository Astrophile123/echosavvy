import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TiShoppingCart} from "react-icons/ti";
import { HiMicrophone } from "react-icons/hi2";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { MdOutlineHome } from "react-icons/md";
import styles from "./Products.module.css";
import axios from "axios";

const products = [
  { id: 22, name: "Smartphone", category: "Mobile Phones", price: "$699.99", description: "Latest model with high-resolution camera and fast processor.", image: "/image/phone.png" },
  { id: 23, name: "Laptop", category: "Computers", price: "$999.99", description: "Powerful laptop with 16GB RAM and 512GB SSD.", image: "/image/laptop.jpeg" },
  { id: 24, name: "Tablet", category: "Tablets", price: "$399.99", description: "Lightweight tablet with a stunning display and long battery life.", image: "/image/tab.avif" },
  { id: 25, name: "Smartwatch", category: "Wearables", price: "$199.99", description: "Track your fitness and receive notifications on the go.", image: "/image/fit.jpg" },
  { id: 26, name: "Wireless Headphones", category: "Audio", price: "$149.99", description: "Noise-canceling headphones with superior sound quality.", image: "/image/wirelessheadphones.jpg" },
  { id: 27, name: "Bluetooth Speaker", category: "Audio", price: "$89.99", description: "Portable speaker with rich sound and long battery life.", image: "/image/speak.webp" },
  { id: 28, name: "Digital Camera", category: "Cameras", price: "$499.99", description: "High-quality camera for stunning photography.", image: "/image/cam.png" },
  { id: 29, name: "Gaming Console", category: "Gaming", price: "$399.99", description: "Next-gen gaming console with immersive graphics and exclusive games.", image: "/image/console.webp" },
  { id: 30, name: "E-Reader", category: "E-Readers", price: "$129.99", description: "Lightweight e-reader with a glare-free display for reading anywhere.", image: "/image/epaper.png" },
  { id: 31, name: "Drone", category: "Drones", price: "$299.99", description: "High-performance drone with HD camera and long flight time.", image: "/image/drone.jpeg" },
  { id: 32, name: "Monitor", category: "Computers", price: "$249.99", description: "27-inch 4K monitor with vibrant colors and sharp details.", image: "/image/monitor1.jpg" },
  { id: 33, name: "Printer", category: "Office", price: "$129.99", description: "All-in-one printer for home and office use.", image: "/image/printer.png" },
  { id: 34, name: "External Hard Drive", category: "Storage", price: "$79.99", description: "1TB external hard drive for extra storage.", image: "/image/harddisk.png" },
  { id: 35, name: "Router", category: "Networking", price: "$99.99", description: "High-speed Wi-Fi router for seamless connectivity.", image: "/image/router1.jpeg" },
  { id: 36, name: "Keyboard", category: "Accessories", price: "$59.99", description: "Mechanical keyboard for gamers and typists.", image: "/image/keyboard.webp" },
  { id: 37, name: "Mouse", category: "Accessories", price: "$39.99", description: "Ergonomic mouse for comfortable use.", image: "/image/mouse.jpeg" },
  { id: 38, name: "Smart Bulb", category: "Smart Home", price: "$19.99", description: "Wi-Fi enabled smart bulb for home automation.", image: "/image/bulb.jpg" },
  { id: 39, name: "Power Bank", category: "Accessories", price: "$29.99", description: "10000mAh power bank for on-the-go charging.", image: "/image/power.jpeg" },
  { id: 40, name: "VR Headset", category: "Gaming", price: "$299.99", description: "Immersive VR headset for gaming and entertainment.", image: "/image/vrhead.webp" },
];

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [isListening, setIsListening] = useState(false);
  const [user_id, setUserId] = useState(localStorage.getItem("user_id"));
  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = "en-IN";
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
    } else {
      console.warn("Speech recognition not supported.");
    }

    synthRef.current.onvoiceschanged = () => synthRef.current.getVoices();

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("guestCart");
    navigate("/login");
  };

  const handleSpeechResult = (event) => {
    const transcript = event.results[0][0].transcript;
    setSearchTerm(transcript);
    handleSearch({ target: { value: transcript } });
    setIsListening(false);
  };

  const handleSpeechError = () => {
    setIsListening(false);
    speakText("Sorry, I couldn't understand you. Please try again.");
  };

  const startVoiceSearch = () => {
    if (recognitionRef.current) {
      synthRef.current.cancel();
      recognitionRef.current.start();
      setIsListening(true);
      speakText("Listening...");
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1.2;
    synthRef.current.speak(utterance);
  };

  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    setFilteredProducts(value ? products.filter(p => p.name.toLowerCase().includes(value)) : products);
  };

  const handleAddToCart = async (product) => {
    const userId = localStorage.getItem("user_id");
    const token = localStorage.getItem("token");
  
    if (!userId || !token) {
      speakText("Please log in to add items to the cart.");
      return;
    }
  
 
    const cleanPrice = Number(String(product.price).replace(/[^0-9.-]+/g, ""));
    
    if (isNaN(cleanPrice)) {
      alert(`Invalid price format: ${product.price}`);
      return;
    }
  
    try {
      speakText(`Adding ${product.name} to cart...`);
      const response = await axios.post(
        "http://localhost:8082/api/cart/add",
        {
          user_id: userId,
          product_id: product.id,
          product_name: product.name,
          price: cleanPrice,  // Use cleaned price
          quantity: 1,
          image_url: product.image
        },
        { 
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          } 
        }
      );
  
      if (response.status === 200) {
        speakText(`${product.name} added successfully!`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      navigate("/cart");
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      speakText("Failed to add to cart. See console for details.");
    }
  };

  return (
    <main className={styles.productDisplay}>
      <div className={styles.topBar}>
        <h1 className={styles.platformName} onMouseEnter={() => speakText("Welcome to EchoSavvy products page")}>
          Echosavvy
        </h1>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search products..."
            className={styles.searchBar}
            value={searchTerm}
            onChange={handleSearch}
            aria-label="Search products by name"
            onMouseEnter={() => speakText("Search bar for products search")}
            onMouseLeave={stopSpeech}
          />

          <HiMicrophone
            className={styles.microphoneIcon}
            size={20}
            onClick={startVoiceSearch}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") startVoiceSearch(); }}
            tabIndex={0}
            aria-label="Start voice search"
            onMouseEnter={() => speakText("Click here to search products")}
            onMouseLeave={stopSpeech}
          />
        </div>

        <div className={styles.userControls}>
          <Link 
            to="/cart" 
            className={styles.cartButton}
            onMouseEnter={() => speakText("Cart button, click to view your cart")}
            onMouseLeave={stopSpeech}
          >
            <TiShoppingCart size={24} /> Cart
          </Link>
          
          {!user_id && (
    <Link 
      to="/" 
      className={styles.homeButton}
      onMouseEnter={() => speakText("Home button, click to return to homepage")}
      onMouseLeave={stopSpeech}
    >
      <MdOutlineHome size={30} /> Home
    </Link>
  )}
  
  {user_id && (
    <button 
      className={styles.logoutButton} 
      onClick={handleLogout}
      onMouseEnter={() => speakText("Logout")}
      onMouseLeave={stopSpeech}
    >
      <RiLogoutBoxRLine size={20} /> Logout
    </button>
  )}
</div>
      </div>

      <div className={styles.productsDisp}>
        <div className={styles.productGrid} onMouseLeave={stopSpeech}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className={styles.productCard}
                onMouseEnter={() => speakText(`${product.name}, Price: ${product.price}, Category: ${product.category}, Description: ${product.description}`)}
                onMouseLeave={stopSpeech}
              >
                <img src={product.image} alt={product.name} className={styles.productImage} />
                <h3>{product.name}</h3>
                <p className={styles.category}>Category: {product.category}</p>
                <p className={styles.price}>₹{product.price}</p>
                <button
                  className={styles.addToCart}
                  onClick={() => handleAddToCart(product)}
                  onMouseEnter={() => speakText("Add to cart")}
                  onMouseLeave={stopSpeech}
                >
                  Add to Cart
                </button>
              </div>
            ))
          ) : (
            <p className={styles.noResults} aria-live="polite" onMouseEnter={() => speakText("Sorry,  no products found matching your search.")}>
              No products found.
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Products;