const express = require('express');
const router = express.Router();

const {services} = require('./data');

router.get("/", function(req, res){
    res.json(services);
});

function validation(name, description, duration, priority) {
    if (!name || duration == undefined || !priority) {
        return "Missing required fields";
    }

    if(typeof duration !== 'number' || !Number.isInteger(duration) || duration <= 0) {
        return "Duration must be a positive integer";
    }

    if(!["High", "Medium", "Low"].includes(priority)) {
        return "Priority must be 'Low', 'Medium', or 'High'";
    }

    if(typeof name !== 'string' || name.trim().length === 0 || name.length > 100){
        return "Service name cannot exceed 100 characters, cannot be empty, and must be a string";
    }

    return null;
}
router.post("/", function(req, res){
    const { name, description, duration, priority } = req.body;
    
    const validationError = validation(name, description, duration, priority);
    if (validationError) {
        return res.status(400).json({error: validationError});
    }

    const idcheck = services.length > 0
        ? Math.max(...services.map(service => service.id)) + 1
        : 1;

    const newService = {
        id: services.length + 1,
        name: name.trim(),
        description: description ?? "",
        duration,
        priority
    };
    
    services.push(newService);
    res.status(201).json(newService);
});

router.put("/:id", function(req, res){
    const s_id = Number(req.params.id);
    const serv = services.find(s => s.id === s_id);
    if (!serv) {
        return res.status(404).json({ error: "Service not found" });
    }
    
    const { name, description, duration, priority } = req.body;

    const error = validation(name, description, duration, priority);

    if (error) {
        return res.status(400).json({ error: error });
    }
    serv.name = name;
    serv.description = description;
    serv.duration = duration;
    serv.priority = priority;
    res.status(200).json(serv);
});

router.delete("/:id", function(req, res){
    const s_id = Number(req.params.id);
    const index = services.findIndex(s => s.id === s_id);
    if (index === -1){
        return res.status(404).json({error : "Service not found"});
    }
    services.splice(index, 1);
    res.status(200).json({message: "Service deleted successfully"});
});

module.exports = router;