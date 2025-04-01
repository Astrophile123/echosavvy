const express = require('express');
const router = express.Router();
const db = require('../db');  
const crypto = require('crypto');
const { Fido2Lib } = require("fido2-lib");

const JWT_SECRET = 'echosavvy';


const fido2 = new Fido2Lib({
    timeout: 60000,
    rpId: "localhost",
    challengeSize: 32,
    cryptoParams: [-7, -257],
});


const base64urlToBase64 = (str) => str.replace(/-/g, "+").replace(/_/g, "/");
const base64ToBase64url = (str) => str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");


router.post('/get-challenge', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ success: false, message: 'Username is required' });
        }

       
        const challengeBuffer = crypto.randomBytes(32);
        const challenge = base64ToBase64url(challengeBuffer.toString('base64'));

       
        const [user] = await db.promise().query(
            'SELECT credential_id FROM users WHERE username = ?',
            [username]
        );

        if (user.length === 0 || !user[0].credential_id) {
            return res.status(400).json({ success: false, message: 'User not found or no registered credentials' });
        }

        await db.promise().query(
            'UPDATE users SET challenge = ? WHERE username = ?',
            [challenge, username]
        );

        
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


router.post('/signup', async (req, res) => {
    try {
        const { username, phone, credential_id, public_key } = req.body;
        if (!username || !phone || !credential_id || !public_key) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

       
        const [existingUser] = await db.promise().query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

       
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


const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    try {
        const { username, credential_id } = req.body;
        if (!username || !credential_id) {
            return res.status(400).json({ success: false, message: 'Username and credential ID are required' });
        }

        const [user] = await db.promise().query(
            'SELECT id, public_key FROM users WHERE username = ? AND credential_id = ?',
            [username, credential_id]
        );

        if (user.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found or credential mismatch' });
        }

       
        const token = jwt.sign(
            { user_id: user[0].id, username: user[0].username },
             JWT_SECRET,
              { expiresIn: "3d" }
            );

        
        await db.promise().query(
            'UPDATE users SET token = ? WHERE username = ?',
            [token, username]
        );

        res.status(200).json({ success: true, token, user_id: user[0].id });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});


router.post('/register-challenge', async (req, res) => {
    try {
        const challengeBuffer = crypto.randomBytes(32);
        const challenge = base64ToBase64url(challengeBuffer.toString('base64'));

        res.status(200).json({ success: true, challenge });
    } catch (error) {
        console.error('Error generating challenge:', error);
        res.status(500).json({ success: false, message: 'Server error. Try again.' });
    }
});


module.exports = router;
