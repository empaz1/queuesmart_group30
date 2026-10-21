const express = require('express');
const router = express.Router();

const {services} = require('./data');

router.get("/", function(req, res){
    res.json(services);
});

router.post("/", function(req, res){
    const { name, description, duration, priority } = req.body;
    
    if (!name || !description || !duration || !priority) {
        return res.status(400).json({ error: "Missing required fields" });
    }
     const newService = {
        id: services.length + 1,
        name,
        description,
        duration,
        priority
    };
    
    services.push(newService);
    res.status(201).json(newService);
});

module.exports = router;