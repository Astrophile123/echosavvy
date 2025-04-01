const express = require("express");
const router = express.Router();
const db = require('../db'); 

router.post("/add", (req, res) => {
    const { user_id, product_id, product_name, price, image_url } = req.body;

    console.log("Request Body:", req.body); 

    if (!user_id || !product_id || !product_name || !price || !image_url) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Here we calculate total_amount correctly.
    const total_amount = price * 1;  // Starting with quantity of 1 initially

    const query = `
        INSERT INTO cart (user_id, product_id, product_name, price, image_url, quantity, total_amount)
        VALUES (?, ?, ?, ?, ?, 1, ?)
        ON DUPLICATE KEY UPDATE 
        quantity = quantity + 1, 
        total_amount = price * (quantity + 1);
    `;

    db.query(
        query,
        [user_id, product_id, product_name, price, image_url, total_amount],
        (err, result) => {
            if (err) {
                console.error("❌ Database Error:", err); 
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "✅ Product added to cart successfully" });
        }
    );
});


router.get('/:user_id', (req, res) => {
    const { user_id } = req.params;
    const sql = "SELECT * FROM cart WHERE user_id = ?";
    
    db.query(sql, [user_id], (err, results) => {
        if (err) {
            console.error("❌ Error fetching cart:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});


router.delete("/remove/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM cart WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.error("❌ Error removing item:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "✅ Product removed from cart" });
    });
});


router.delete("/clear/:user_id", (req, res) => {
    const { user_id } = req.params;
    db.query("DELETE FROM cart WHERE user_id = ?", [user_id], (err, result) => {
        if (err) {
            console.error("❌ Error clearing cart:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "✅ Cart cleared successfully" });
    });
});
router.post("/moveGuestCart", (req, res) => {
    const { user_id, cartItems } = req.body;

    if (!user_id || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: "Invalid request: No items in guest cart" });
    }

    const queries = cartItems.map(item => {
        return new Promise((resolve, reject) => {
            const { product_id, product_name, price, quantity, image_url } = item;

            db.query(
                `SELECT * FROM cart WHERE user_id = ? AND product_id = ?`,
                [user_id, product_id],
                (err, results) => {
                    if (err) return reject(err);

                    if (results.length > 0) {
                        // If product exists, update quantity and total amount
                        db.query(
                            `UPDATE cart SET quantity = ?, total_amount = price * ? WHERE user_id = ? AND product_id = ?`,
                            [quantity, quantity, user_id, product_id],
                            (updateErr) => {
                              if (updateErr) return reject(updateErr);
                              resolve();
                            }
                          );
                          
                          
                    } else {
                        // If product does not exist, insert into cart
                        db.query(
                            `INSERT INTO cart (user_id, product_id, product_name, price, quantity, image_url, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [user_id, product_id, product_name, price, quantity, image_url, price * quantity],
                            (insertErr) => {
                                if (insertErr) return reject(insertErr);
                                resolve();
                            }
                        );
                    }
                }
            );
        });
    });

    Promise.all(queries)
        .then(() => res.json({ success: true, message: "✅ Guest cart transferred successfully" }))
        .catch(err => {
            console.error("❌ Error moving guest cart:", err);
            res.status(500).json({ error: "Server error while transferring guest cart" });
        });
});


module.exports = router;