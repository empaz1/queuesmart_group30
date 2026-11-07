const express = require("express");
const router = express.Router();
const { verifyAdmin } = require("./user_roles");
const db = require("./db");

router.get('/dashboard', verifyAdmin, (req, res) => {

    db.get("SELECT COUNT(*) AS count FROM UserCredentials", [], (err, userRow) => {
        if (err) return res.status(500).json({ error: "Database error counting users" });
        const totalUsers = userRow ? userRow.count : 0;

        const servicesQuery = `SELECT service_id as id, service_name as name, description, expected_duration as duration, priority_level as priority FROM Service`;
        
        db.all(servicesQuery, [], (err, services) => {
            if (err) return res.status(500).json({ error: "Database error fetching services" });

            const serviceOverview = services || [];

            serviceOverview.forEach(s => s.waiting = []);
            
            const waitingQuery = `
                SELECT q.service_id, qe.user_id 
                FROM QueueEntry qe 
                JOIN Queue q ON qe.queue_id = q.queue_id 
                WHERE qe.status = 'waiting'
                ORDER BY qe.position ASC
            `;
            db.all(waitingQuery, [], (err, waitingUsers) => {
                if (err) return res.status(500).json({ error: "Database error fetching queues" });
                
                const totalQueuedUsers = waitingUsers ? waitingUsers.length : 0;

                if (waitingUsers) {
                    waitingUsers.forEach(wu => {
                        const service = serviceOverview.find(s => s.id === wu.service_id);
                        if (service) {
                            service.waiting.push(wu.user_id);
                        }
                    });
                }

                return res.status(200).json({
                    totalUsers,
                    totalServices: serviceOverview.length,
                    totalQueuedUsers,
                    services: serviceOverview
                });
            });
        });
    });
});
router.post('/queues/call-next',verifyAdmin,(req, res) => {
    
    const targetServiceId = Number(req.body.serviceId);

    const findQuery = `
        SELECT qe.entry_id, qe.user_id, q.queue_id, qe.position 
        FROM QueueEntry qe
        JOIN Queue q ON qe.queue_id = q.queue_id
        WHERE q.service_id = ? AND qe.status = 'waiting'
        ORDER BY qe.position ASC LIMIT 1
    `;
    db.get(findQuery, [targetServiceId], (err, nextUser) => {
        if (err) return res.status(500).json({ error: "Database error fetching next user" });

        if (!nextUser) {
            return res.status(404).json({ error: "No customers waiting in the queue" });
        }

        const updateSql = `
            UPDATE QueueEntry
            SET status = CASE WHEN entry_id = ? THEN 'served' ELSE status END,
                position = CASE WHEN entry_id != ? AND position > ? THEN position - 1 ELSE position END
            WHERE queue_id = ? AND status = 'waiting' AND (entry_id = ? OR position > ?)`;

        db.run(updateSql, [nextUser.entry_id, nextUser.entry_id, nextUser.position, nextUser.queue_id, nextUser.entry_id, nextUser.position], function(err) {
            if (err) return res.status(500).json({ error: "Database error updating queue" });

            db.all("SELECT user_id FROM QueueEntry WHERE queue_id = ? AND status = 'waiting' ORDER BY position ASC", [nextUser.queue_id], (err, remaining) => {
                if (err) return res.status(500).json({ error: "Database error fetching remaining queue" });
                
                return res.status(200).json({ 
                    message: "Successfully called the next customer",
                    nextUser: nextUser.user_id,
                    remainingQueue: remaining ? remaining.map(r => r.user_id) : []
                });
            });
        });
    });
});

module.exports = router;

        