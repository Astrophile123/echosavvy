const express = require('express');
const router = express.Router();
const db = require('../db');  
const crypto = require('crypto');
const { Fido2Lib } = require("fido2-lib");

const fido2 = new Fido2Lib({
    timeout: 60000,
    rpId: "localhost",
    challengeSize: 32,
    cryptoParams: [-7, -257],
});

// Helper functions for Base64URL encoding
const base64urlToBase64 = (str) => str.replace(/-/g, "+").replace(/_/g, "/");
const base64ToBase64url = (str) => str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// ✅ **Generate a challenge for WebAuthn**
router.post('/get-challenge', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ success: false, message: 'Username is required' });
        }

        // Generate a cryptographically secure challenge
        const challengeBuffer = crypto.randomBytes(32);
        const challenge = base64ToBase64url(challengeBuffer.toString('base64'));

        // Retrieve user's credential ID
        const [user] = await db.promise().query(
            'SELECT credential_id FROM users WHERE username = ?',
            [username]
        );

        if (user.length === 0 || !user[0].credential_id) {
            return res.status(400).json({ success: false, message: 'User not found or no registered credentials' });
        }

        // Save challenge in the database
        await db.promise().query(
            'UPDATE users SET challenge = ? WHERE username = ?',
            [challenge, username]
        );

        // Return challenge and credential ID
        res.status(200).json({ 
            success: true, 
            challenge, 
            credential_id: user[0].credential_id 
        });

    } catch (error) {
        console.error('Challenge Generation Error:', error);
        res.status(500).json({ success: false, message: 'Server error. Try again.' });
    }
});

// ✅ **Signup Route - Registers User with Fingerprint**
router.post('/signup', async (req, res) => {
    try {
        const { username, phone, credential_id, public_key } = req.body;
        if (!username || !phone || !credential_id || !public_key) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if the user already exists
        const [existingUser] = await db.promise().query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        // Convert Base64URL to Base64 before storing
        const fixedPublicKey = base64urlToBase64(public_key);

        await db.promise().query(
            'INSERT INTO users (username, phone, credential_id, public_key) VALUES (?, ?, ?, ?)',
            [username, phone, credential_id, fixedPublicKey]
        );

        res.status(200).json({ success: true, message: 'Signup successful' });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// ✅ **Login Route - Authenticate User with WebAuthn**
router.post('/login', async (req, res) => {
    try {
        const { username, credential_id } = req.body;
        if (!username || !credential_id) {
            return res.status(400).json({ success: false, message: 'Username and credential ID are required' });
        }

        const [user] = await db.promise().query(
            'SELECT public_key FROM users WHERE username = ? AND credential_id = ?',
            [username, credential_id]
        );

        if (user.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found or credential mismatch' });
        }

        // **Fix: Do not convert again; it's already Base64**
        const publicKey = user[0].public_key;  

        res.status(200).json({ success: true, publicKey });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

module.exports = router;
