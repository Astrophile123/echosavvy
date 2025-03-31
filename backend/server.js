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

// **User Login (Fingerprint Authentication)**
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
app.post('/api/cart/add', async (req, res) => { 
    try {
        const token = req.headers.authorization?.split(" ")[1];
        console.log("🔹 Received Token:", token);

        if (!token) {
            console.error("❌ No token provided");
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("🔹 Decoded User ID:", decoded.id);

        if (!decoded.user_id) {
            return res.status(403).json({ error: "Invalid user" });
          }
      
        const user_id = decoded.user_id;
        const { product_id, product_name, price, quantity, image_url } = req.body;

        console.log("🛒 Received Data:", req.body);

        if (!product_id || !product_name || !price || !quantity || !image_url) {
            console.error("❌ Missing required fields:", req.body);
            return res.status(400).json({ message: "All fields are required" });
        }

        const total_amount = price * quantity;

        // Check if product is already in cart
        const [existing] = await db.promise().query(
            "SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?",
            [user_id, product_id]
        );
        console.log("🔹 Existing Cart Item:", existing);

        if (existing.length > 0) {
            const newQuantity = existing[0].quantity + quantity;
            await db.promise().query(
                "UPDATE cart SET quantity = ?, total_amount = price * ? WHERE user_id = ? AND product_id = ?",
                [newQuantity, newQuantity, user_id, product_id]
            );
            console.log("✅ Cart updated successfully");
            return res.status(200).json({ message: "Cart updated successfully" });
        }

        // Insert new cart item
        await db.promise().query(
            "INSERT INTO cart (user_id, product_id, product_name, price, quantity, image_url, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [user_id, product_id, product_name, price, quantity, image_url, total_amount]
        );

        console.log("✅ Added to cart successfully");
        res.status(200).json({ message: "Added to cart successfully" });

    } catch (error) {
        console.error("❌ Database error:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});

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
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.user_id; // Fix: Ensure consistency with other routes
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity) {
            return res.status(400).json({ message: "Product ID and quantity are required" });
        }

        console.log(`🔄 Updating Cart - UserID: ${userId}, ProductID: ${product_id}, Quantity: ${quantity}`);

        // Fetch price from the products table
        const [productResult] = await db.promise().query(
            "SELECT price FROM products WHERE id = ?",
            [product_id]
        );

        if (productResult.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        const price = productResult[0].price;
        const totalAmount = price * quantity;

        // Update cart
        const [result] = await db.promise().query(
            "UPDATE cart SET quantity = ?, total_amount = ? WHERE user_id = ? AND product_id = ?",
            [quantity, totalAmount, userId, product_id]
        );

        console.log("✅ Cart updated successfully");
        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Cart updated successfully" });
        } else {
            res.status(400).json({ message: "Failed to update cart" });
        }
    } catch (error) {
        console.error("❌ Error updating cart:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});

app.post('/auth/passkey/register', async (req, res) => {
    const { username } = req.body;
    
    // Generate registration options
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
        userVerification: "required", // Requires biometrics
        residentKey: "required"
      }
    };
  
    res.json(options);
  });
  
  // 2. Add passkey login endpoint
  app.post('/auth/passkey/login', async (req, res) => {
    const { credential } = req.body;
    
    // Verify credential against stored passkeys
    const user = await verifyPasskey(credential); // Your verification logic
    
    if (user) {
      // Return same token format as password login
      const token = generateToken(user.id);
      res.json({ success: true, token, user_id: user.id });
    }
  });
  

app.listen(8082, () => {
    console.log("🚀 Server is running on http://localhost:8082");
});