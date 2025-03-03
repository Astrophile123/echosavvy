const express = require("express");
const router = express.Router();
const db = require('../db'); 


router.post("/add", (req, res) => {
    const { user_id, product_id, product_name, price, image_url } = req.body;

    console.log("Request Body:", req.body); // Log the request body

    if (!user_id || !product_id || !product_name || !price || !image_url) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const query = `
        INSERT INTO cart (user_id, product_id, product_name, price, image_url, quantity, total_amount)
        VALUES (?, ?, ?, ?, ?, 1, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + 1, total_amount = total_amount + ?;
    `;

    const total_amount = price * 1; // Initial quantity is 1

    db.query(
        query,
        [user_id, product_id, product_name, price, image_url, total_amount, total_amount],
        (err, result) => {
            if (err) {
                console.error("Database Error:", err); // Log the database error
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Product added to cart successfully" });
        }
    );
});

// Get Cart Items for a Specific User
router.get('/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const sql = "SELECT * FROM cart WHERE user_id = ?";
        db.query(sql, [user_id], (err, results) => {
            if (err) {
                console.error("Error fetching cart:", err);
                return res.status(500).json({ error: "Database error" });
            }
            res.json(results);
        });
        
        res.json(results);
    } catch (err) {
        console.error("❌ Error fetching cart:", err);
        res.status(500).json({ message: "Database error", error: err });
    }
});

// Remove a Product from Cart
router.delete("/remove/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM cart WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product removed from cart" });
    });
});

// Clear Entire Cart for a Specific User
router.delete("/clear/:user_id", (req, res) => {
    const { user_id } = req.params;
    db.query("DELETE FROM cart WHERE user_id = ?", [user_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Cart cleared successfully" });
    });
});

module.exports = router;