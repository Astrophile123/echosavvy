const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');


const app = express();


const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  
    allowedHeaders: ['Content-Type', 'Authorization'],  
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', authRoutes);

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "ecommerce"
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

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

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

    if (!token) {
        return res.status(401).json({ message: "🚫 Unauthorized - No Token Provided" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "🚫 Invalid Token" });
        }
        req.user = decoded;
        next();
    });
};

app.post('/cart/add', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { user_id, product_id, product_name, price, quantity, image_url } = req.body;

        if (!user_id || !product_id || !product_name || !price || !quantity || !image_url) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const total_amount = price * quantity;

        await db.promise().query(
            "INSERT INTO cart (user_id, product_id, product_name, price, quantity, image_url, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [user_id, product_id, product_name, price, quantity, image_url, total_amount]
        );

        res.status(200).json({ message: "Added to cart successfully" });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});
app.get('/cart/:user_id', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user_id = req.params.user_id;

        const [results] = await db.promise().query(
            "SELECT * FROM cart WHERE user_id = ?",
            [user_id]
        );

        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching cart items:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});
app.delete('/cart/remove', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { user_id, product_id } = req.body;

        await db.promise().query(
            "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
            [user_id, product_id]
        );

        res.status(200).json({ message: "Item removed from cart" });
    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});
app.put('/cart/update', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { user_id, product_id, quantity } = req.body;

        const [results] = await db.promise().query(
            "UPDATE cart SET quantity = ?, total_amount = price * ? WHERE user_id = ? AND product_id = ?",
            [quantity, quantity, user_id, product_id]
        );

        res.status(200).json({ message: "Cart updated successfully" });
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});
app.listen(8082, () => {
    console.log("🚀 Server is running on http://localhost:8082");
});