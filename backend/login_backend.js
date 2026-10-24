const express = require("express");
const router = express.Router();
const { users } = require("./data");

//register
router.post('/register', (req, res) => {
    const identifier =req.body.email || req.body.username;
    const { password, role } = req.body;
//using identifier for both email and username since we have a mix of both - will fix later
    if (!identifier || !password || !role) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    if (users.find(u => u.email === identifier || u.username === identifier)) {
        return res.status(409).json({ error: "Email already in use" });
    }

    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        email: identifier,
        username: identifier,
        password, 
        role: role === 'Administrator' ? 'Administrator' : 'User'
    };

    users.push(newUser);
    res.status(201).json({message: "Account created.", userId: newUser.id, role: newUser.role});
});

//login
router.post('/login', (req, res) => {
    const identifier = req.body.email || req.body.username;
    const {password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ error: "Email/username and password are required" });
    }

    const user = users.find(u => (u.email === identifier || u.username ===identifier) && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: "Invalid email/ password" });
    }
    res.status(200).json({message: "Login successful", userId: user.id, role: user.role });
});

module.exports = router;
