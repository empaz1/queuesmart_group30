const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("./db");
                       
//register
router.post('/register', async (req, res) => {
    const identifier =req.body.email || req.body.username;
    const { password, role } = req.body;
    
    if (!identifier || !password || !role) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const userId = crypto.randomUUID();
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const assignedRole = role === 'Administrator' ? 'Administrator' : 'User';
        const insertCredentials = `INSERT INTO UserCredentials (user_id, email, password_hash, role) VALUES (?, ?, ?, ?)`;

        db.run(insertCredentials, [userId, identifier, passwordHash, assignedRole], function(err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(409).json({ error: "Email already in use" });
                }
                return res.status(500).json({ error: "Database error during registration." });
            }
            res.status(201).json({ message: "Account created.", userId: userId, role: assignedRole });
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

//login
router.post('/login', (req, res) => {
    const identifier = req.body.email || req.body.username;
    const {password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ error: "Email/username and password are required" });
    }
    const query = `SELECT user_id, password_hash, role FROM UserCredentials WHERE email = ?`;
    
    db.get(query, [identifier], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error during login." });
        }
        
        if (!row) {
            return res.status(401).json({ error: "Invalid email/ password" }); 
        }

        try {
            
            const match = await bcrypt.compare(password, row.password_hash);
            
            if (match) {
                res.status(200).json({ message: "Login successful", userId: row.user_id, role: row.role });
            } else {
                res.status(401).json({ error: "Invalid email/ password" });
            }
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    });
});

module.exports = router;
