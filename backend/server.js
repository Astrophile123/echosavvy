const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cartRoutes');

const JWT_SECRET = "echosavvy";
const app = express();


const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  
    allowedHeaders: ['Content-Type', 'Authorization'],  
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', authRoutes);
app.use('/api/cart', cartRoutes);

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "ecommerce",
    port: 3306,
    connectTimeout:10000
});


db.connect((err) => {
    if (err) {
        console.error("❌ MySQL Connection Error:", err);
        process.exit(1); 
    }
    console.log("✅ Connected to MySQL");
});


app.post('/signup', async (req, res) => {
    const { username, phone, credential_id, public_key } = req.body;

    if (!username || !phone || !credential_id || !public_key) {
        return res.status(400).json({ message: "⚠️ All fields are required" });
    }

    try {
        const [existingUser] = await db.promise().query("SELECT * FROM users WHERE username = ?", [username]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "⚠️ Username already exists" });
        }

        await db.promise().query(
            "INSERT INTO users (username, phone, credential_id, public_key) VALUES (?, ?, ?, ?)",
            [username, phone, credential_id, public_key]
        );

        res.json({ message: "✅ User registered successfully" });

    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});


app.post('/login', async (req, res) => {
    const { username, credential_id } = req.body;

    if (!username || !credential_id) {
        return res.status(400).json({ message: "⚠️ Username and credential_id are required" });
    }

    try {
        const [results] = await db.promise().query("SELECT * FROM users WHERE username = ?", [username]);

        if (results.length === 0) {
            return res.status(401).json({ message: "❌ User not found" });
        }

        const user = results[0];
        if (user.credential_id !== credential_id) {
            return res.status(401).json({ message: "❌ Invalid fingerprint credentials" });
        }

        const token = ({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ success: true, token, user_id: user.id });

    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

app.get('/products', async (req, res) => {
    try {
        const [products] = await db.promise().query("SELECT * FROM products");
        res.json({ success: true, products });

    } catch (error) {
        console.error("❌ Products Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch products", error: error.message });
    }
});


const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Received Token:",token);

    if (!token) {
        return res.status(401).json({ message: "🚫 Unauthorized - No Token Provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "🚫 Invalid Token" });
        }
        req.user = decoded;
        next();
    });
};

app.get('/api/cart', async (req, res) => {
    try{
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("🔹 Decoded Token:", decoded);
        const userId = decoded.user_id;
        if (!userId) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        const [cartItems] = await db.promise().query(
            "SELECT * FROM cart WHERE user_id = ?",[userId]);
            res.json(cartItems);
    }catch(error){

        console.error("Error fetching cart items:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});

app.post('/auth/passkey/register', async (req, res) => {
    const { username } = req.body;
    
    const options = {
      challenge: crypto.randomBytes(32),
      rp: { name: "EchoSavvy" },
      user: {
        id: crypto.randomBytes(16),
        name: username,
        displayName: username
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      authenticatorSelection: {
        userVerification: "required",
        residentKey: "required"
      }
    };
  
    res.json(options);
  });
  
  app.post('/auth/passkey/login', async (req, res) => {
    const { credential } = req.body;
    
    
    const user = await verifyPasskey(credential); 
    
    if (user) {
      
      const token = generateToken(user.id);
      res.json({ success: true, token, user_id: user.id });
    }
  });

  app.post('/api/cart/add', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user_id =  decoded.user_id; 
        if (!user_id) return res.status(403).json({ error: "Invalid user" });

        const { product_id, product_name, price, quantity = 1, image_url } = req.body;

        const [existingProduct] = await db.promise().query(
            "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
            [user_id, product_id]
        );

        if (existingProduct.length > 0) {
            // Update the quantity if the product already exists in the cart
            const newQuantity = existingProduct[0].quantity + quantity;
            await db.promise().query(
                "UPDATE cart SET quantity = ?, total_amount = price * ? WHERE user_id = ? AND product_id = ?",
                [newQuantity, newQuantity, user_id, product_id]
            );
            return res.status(200).json({ message: "Cart updated successfully" });
        } else {
            // Insert new product if not found
            const total_amount = price * quantity;
            await db.promise().query(
                "INSERT INTO cart (user_id, product_id, product_name, price, quantity, image_url, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [user_id, product_id, product_name, price, quantity, image_url, total_amount]
            );
            return res.status(200).json({ message: "Added to cart successfully" });
        }
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});

app.delete('/api/cart/remove', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.user_id;
        const { product_id } = req.body;

        await db.promise().query(
            "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
            [userId, product_id]
        );

        res.status(200).json({ message: "Item removed from cart" });
    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});


app.put('/api/cart/update', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id || decoded.user_id;
        const { product_id, quantity } = req.body;

       
        const [existing] = await db.promise().query(
            "SELECT * FROM cart WHERE user_id = ? AND product_id = ?", 
            [userId, product_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Cart item not found" });
        }

       
        await db.promise().query(
            "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
            [quantity, userId, product_id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(8082, () => {
    console.log("🚀 Server is running on http://localhost:8082");
});