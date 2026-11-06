const express = require('express');
const router = express.Router();
const db = require('./db');
const {queues, servedUsers} = require('./data'); 

router.get("/", function(req, res){
    const sql = `
        SELECT
            q.queue_id,
            q.service_id,
            qe.user_id,
            COALESCE(up.full_name, qe.user_id) AS name
        FROM Queue q
        LEFT JOIN QueueEntry qe
            ON q.queue_id = qe.queue_id
            AND qe.status = 'waiting'
        LEFT JOIN UserProfile up
            ON qe.user_id = up.user_id
        WHERE q.status = 'open'
        ORDER BY q.service_id, qe.position
    `;

    db.all(sql, [], function(err, rows) {
        if (err) {
            return res.status(500).json({
                error: "Unable to get queues"
            });
        }

        const queueMap = new Map();

        rows.forEach(row => {
            if (!queueMap.has(row.queue_id)) {
                queueMap.set(row.queue_id, {
                    serviceId: row.service_id,
                    users: []
                });
            }

            if (row.user_id !== null) {
                queueMap.get(row.queue_id).users.push({
                    id: row.user_id,
                    name: row.name
                });
            }
        });

        return res.status(200).json(
            Array.from(queueMap.values())
        );
    });
});

function queueValidation(serviceId) {
    const id = Number(serviceId);

    if(!Number.isInteger(id) || id <= 0){
        return { error: "Invalid ID", status: 400 };
    }

    const queue = queues.find(q => q.serviceId === id);
    if(!queue){
        return { error: "Queue not found", status: 404 };
    }
    return {queue};
}



router.delete("/:serviceId/users/:userId", function(req, res) {
    const serviceId = Number(req.params.serviceId);
    const userId = req.params.userId;

    if (!Number.isInteger(serviceId) || serviceId <= 0) {
        return res.status(400).json({ error: "Invalid service ID" });
    }

    const q_sql = `SELECT queue_id FROM Queue WHERE service_id = ? AND status = 'open' ORDER BY queue_id DESC LIMIT 1`;

    if (!userId || !userId.trim()) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    db.get(q_sql, [serviceId], function(err, queue) {
        if (err) {
            return res.status(500).json({ error: "Error retrieving queue" });
        }

        if (!queue) {
            return res.status(404).json({ error: "Queue not found" });
        }

        db.get(
            `SELECT
                qe.entry_id,
                qe.position,
                qe.user_id AS id,
                COALESCE(up.full_name, qe.user_id) AS name
            FROM QueueEntry qe
            LEFT JOIN UserProfile up
                ON qe.user_id = up.user_id
            WHERE qe.queue_id = ?
                AND qe.user_id = ?
                AND qe.status = 'waiting'`,
            [queue.queue_id, userId],
            function(err, user) {
                if (err) {
                    return res.status(500).json({ error: "Error retrieving user" });
                }

                if (!user) {
                    return res.status(404).json({ error: "User not found in queue" });
                }

                const sql = `
                    UPDATE QueueEntry
                    SET status = CASE
                        WHEN entry_id = ? THEN 'canceled'
                        ELSE status
                    END,
                    position = CASE
                        WHEN entry_id != ? AND position > ?
                        THEN position - 1
                        ELSE position
                    END
                    WHERE queue_id = ?
                        AND status = 'waiting'
                        AND (entry_id = ? OR position > ?)`;

                db.run(sql, [
                    user.entry_id,
                    user.entry_id,
                    user.position,
                    queue.queue_id,
                    user.entry_id,
                    user.position
                ], function(err) {
                    if (err) {
                        return res.status(500).json({ error: "Unable to delete user" });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({ error: "User not found in queue" });
                    }

                    return res.status(200).json({
                        message: "User removed from queue",
                        user: {
                            id: user.id,
                            name: user.name
                        }
                    });
                });
            }
        );
    }); 
}); 

              
router.post("/:serviceId/serve", function(req, res){
    const serviceId = Number(req.params.serviceId);
    
    if(!Number.isInteger(serviceId) || serviceId <= 0){
        return res.status(400).json({ error: "Invalid service ID"});
    }

    const q_sql = `SELECT queue_id FROM Queue WHERE service_id = ? AND status = 'open' ORDER BY queue_id DESC LIMIT 1`;

    db.get(q_sql, [serviceId], function(err, queue){
        if(err){
            return res.status(500).json({error: "Error retrieving queue"});
        }
        if(!queue){
            return res.status(404).json({error: "Queue not found"});
        }

        const u_sql = `
        SELECT
            qe.entry_id,
            qe.position,
            qe.user_id AS id,
            COALESCE(up.full_name, qe.user_id) AS name
        FROM QueueEntry qe
        LEFT JOIN UserProfile up
            ON qe.user_id = up.user_id
        WHERE qe.queue_id = ?
        AND qe.status = 'waiting'
        ORDER BY qe.position ASC, qe.entry_id ASC
        LIMIT 1`;

        db.get(u_sql, [queue.queue_id], function(err, user){
            if(err){
                return res.status(500).json({error: "Error retrieving user"});
            }
            if(!user){
                return res.status(404).json({error: "No users in queue"});
            }
            const sql = `
                UPDATE QueueEntry
                SET status = CASE
                    WHEN entry_id = ? THEN 'served'
                    ELSE status
                END,
                position = CASE
                    WHEN entry_id != ? AND position > ? 
                    THEN position - 1
                    ELSE position
                END
                WHERE queue_id = ? AND status = 'waiting' AND (entry_id = ? OR position > ?)`;
            
            db.run(sql, [user.entry_id, user.entry_id, user.position, queue.queue_id, user.entry_id, user.position], function(err){
                if (err){
                    return res.status(500).json({error: "Unable to serve user"});
                }

                if(this.changes === 0){
                    return res.status(409).json({error: "Conflict Error"});
                }
                
                return res.status(200).json({message: "User served", user:{
                    id: user.id,
                    name: user.name
                }});
            });

        });
    });
})

router.put("/:serviceId/reorder", function(req, res){
    const serviceId = Number(req.params.serviceId);
    const { userIds } = req.body;

    if(!Array.isArray(userIds)) {
        return res.status(400).json({ error: "User ID's must be an array"});
    }


    const q_sql = `SELECT queue_id FROM Queue WHERE service_id = ? AND status = 'open' ORDER BY queue_id DESC LIMIT 1`;

    db.get(q_sql, [serviceId], function(err, queue){
        if(err){
            return res.status(500).json({error: "Error retrieving queue"});
        }
        if(!queue){
            return res.status(404).json({error: "Queue not found"});
        }

        db.all(`
            SELECT
                qe.user_id AS id,
                COALESCE(up.full_name, qe.user_id) AS name
            FROM QueueEntry qe
            LEFT JOIN UserProfile up
                ON qe.user_id = up.user_id
            WHERE qe.queue_id = ?
            AND qe.status = 'waiting'
        `, [queue.queue_id], function(err, users){
            if(err){
                return res.status(500).json({error: "Error retrieving users"});
            }

            const current = users.map(u => String(u.id));
            const newOrder = userIds.map(id => String(id));

            if(newOrder.length !== current.length || !newOrder.every(id => current.includes(id)) || new Set(newOrder).size !== newOrder.length) {
                return res.status(400).json({error: "Incorrect User IDs"});
            }

            if(newOrder.length === 0){
                return res.status(200).json({message: "Queue reordered", queue: {serviceId, users: []}});
            }

            const statements = newOrder.map(()=> "WHEN ? THEN ?").join(" ");
            const sql =`
                UPDATE QueueEntry
                SET position = CASE user_id
                    ${statements}
                    ELSE position
                END
                WHERE queue_id = ? AND status = 'waiting'`;
            
            const params = [];
            newOrder.forEach((id, index) => {
                params.push(id, index + 1);
            });
            params.push(queue.queue_id);
            
            db.run(sql, params, function(err){
                if(err){
                    return res.status(500).json({error: "Unable to reorder queue"});
                }

                const reorderedUsers = newOrder.map(id => users.find(u => String(u.id) === id));
                return res.status(200).json({message: "Queue reordered", queue: {serviceId, users: reorderedUsers}});
            });
        });
    });

})

module.exports = router;
