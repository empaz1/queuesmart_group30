const express = require('express');
const router = express.Router();

const db = require('./db');

router.get("/", function(req, res){
    const sql = `
        SELECT
                service_id AS id,
                service_name AS name,
                description,
                expected_duration AS duration,
                CASE priority_level
                    WHEN 3 THEN 'High'
                    WHEN 2 THEN 'Medium'
                    ELSE 'Low'
                END AS priority
            FROM Service
        `;
        db.all(sql, [], function(err, rows){
            if (err) {
                return res.status(500).json({error: "Unable to obtain services"});
            }
            return res.status(200).json(rows);
        })
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

    if (description != null && (typeof description !== 'string' || description.length > 500)){
        return res.status(400).json({error: "Description must be less than 500 characters"});
    }

    const priorityLevel = {
        High: 3,
        Medium: 2,
        Low: 1
    };

    const sql = `
        INSERT INTO Service
        (service_name, description, expected_duration, priority_level)
        VALUES (?, ?, ?, ?)`;

    db.run(sql, [name.trim(), description ?? "", duration, priorityLevel[priority]], function(err){
        if (err){
            return res.status(500).json({error: "Unable to add service"});
        }
        return res.status(201).json({
            id: this.lastID,
            name: name.trim(),
            description: description ?? "",
            duration,
            priority
        });
    });
});

router.put("/:id", function(req, res){
    const s_id = Number(req.params.id);
    
    if (!Number.isInteger(s_id) || s_id <= 0) {
        return res.status(400).json({error: "Invalid service ID"});
    }
    
    const { name, description, duration, priority } = req.body;

    const error = validation(name, description, duration, priority);

    if (error) {
        return res.status(400).json({ error: error });
    }

    if (description != null && (typeof description !== 'string' || description.length > 500)){
        return res.status(400).json({error: "Description must be less than 500 characters"});
    }

    const priorityLevel = {
        High: 3,
        Medium: 2,
        Low: 1
    };

    const sql = `
        UPDATE Service
        SET service_name = ?, description = ?, expected_duration = ?, priority_level = ?
        WHERE service_id = ?`;
    
    db.run(sql, [name.trim(), description ?? "", duration, priorityLevel[priority], s_id], function(err){
        if (err){
            return res.status(500).json({error: "Unable to update"});
        }
        if (this.changes === 0){
            return res.status(404).json({error: "Service not found"});
        }
        return res.status(200).json({
            id: s_id,
            name: name.trim(),
            description: description ?? "",
            duration,
            priority
        });
    });
    
});

router.delete("/:id", function(req, res){
    const s_id = Number(req.params.id);
    
    if (!Number.isInteger(s_id) || s_id <= 0) {
        return res.status(400).json({error: "Invalid service ID"});
    }

    const sql = 
    `DELETE FROM Service WHERE service_id = ?`;
    
    db.run(sql, [s_id], function(err){
        if (err){
            if(err.code === 'SQLITE_CONSTRAINT'){
                return res.status(400).json({error: "Cannot delete service with queues"});
            }
            return res.status(500).json({error: "Unable to delete service"});
        }
        if (this.changes === 0){
            return res.status(404).json({error: "Service not found"});
        }
        return res.status(200).json({message: "Service deleted"});
    });
});

module.exports = router;