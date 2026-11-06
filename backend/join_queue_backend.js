
const express = require('express');
const router = express.Router();
const db = require('./db');

const {
    findOpenQueue,
    addQueueEntry,
    findUserEntry,
    getNextPosition,
    findQueueEntry,
    getQueuePosition,
    leaveQueueEntry
} = require('./queue_entry_db');

function validId(value) {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }
    return id;
}

function validUserId(value) {
    if (typeof value === 'string' && /^u[1-9]\d*$/.test(value)) {
        return value;
    }

    const id = validId(value);
    return id === null ? null : String(id);
}

function getWaitTime(position, duration) {
    return Math.max(0, position - 1) * duration;
}

function getStatus(position, served) {
    if (position === 0) {
        return served ? "Served" : "Not in Queue";
    }
    if (position === 1) {
        return "Almost Ready";
    }
    return "Waiting";
}

// Join queue
router.post('/', function(req, res) {
    const userId = validUserId(req.body.userId);
    const serviceId = validId(req.body.serviceId);
    const name = req.body.name;

    if (!userId || !serviceId) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: "Name is required" });
    }

    db.get(
        'SELECT * FROM Service WHERE service_id = ?',
        [serviceId],
        function(err, service) {
            if (err) {
                return res.status(500).json({ error: "Database error" });
            }
            if (!service) {
                return res.status(404).json({ error: "Service not found" });
            }

            db.get(
                'SELECT user_id FROM UserCredentials WHERE user_id = ?',
                [userId],
                function(err, user) {
                    if (err) {
                        return res.status(500).json({ error: "Database error" });
                    }
                    if (!user) {
                        return res.status(404).json({ error: "User not found" });
                    }

                    findOpenQueue(serviceId, function(err, queue) {
                        if (err) {
                            return res.status(500).json({ error: "Database error" });
                        }
                        if (!queue) {
                            return res.status(404).json({ error: "Queue not found" });
                        }

                        findUserEntry(userId, function(err, entry) {
                            if (err) {
                                return res.status(500).json({ error: "Database error" });
                            }

                            if (entry) {
                                const message = entry.queue_id === queue.queue_id
                                    ? "User is already in this queue"
                                    : "User is already in another queue";

                                return res.status(400).json({ error: message });
                            }

                            getNextPosition(queue.queue_id, function(err, result) {
                                if (err) {
                                    return res.status(500).json({ error: "Database error" });
                                }

                                const position = result.position;

                                addQueueEntry(queue.queue_id, userId, position, function(err) {
                                    if (err) {
                                        return res.status(500).json({ error: "Database error" });
                                    }

                                    return res.status(201).json({
                                        message: "Successfully joined!",
                                        service: service.service_name,
                                        position: position,
                                        waitTime: getWaitTime(position, service.expected_duration),
                                        status: getStatus(position, false)
                                    });
                                });
                            });
                        });
                    });
                }
            );
        }
    );
});

// Leave queue
router.delete('/:serviceId/users/:userId', function(req, res) {
    const serviceId = validId(req.params.serviceId);
    const userId = validUserId(req.params.userId);

    if (!serviceId || !userId) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    findOpenQueue(serviceId, function(err, queue) {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (!queue) {
            return res.status(404).json({ error: "Queue not found" });
        }

        findQueueEntry(queue.queue_id, userId, function(err, entry) {
            if (err) {
                return res.status(500).json({ error: "Database error" });
            }
            if (!entry || entry.status !== 'waiting') {
                return res.status(404).json({ error: "User is not in this queue" });
            }

            leaveQueueEntry(queue.queue_id, userId, function(err) {
                if (err) {
                    return res.status(500).json({ error: "Database error" });
                }

                return res.status(200).json({ message: "You left the queue." });
            });
        });
    });
});

// Queue status
router.get('/:serviceId/users/:userId/status', function(req, res) {
    const serviceId = validId(req.params.serviceId);
    const userId = validUserId(req.params.userId);

    if (!serviceId || !userId) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    db.get(
        'SELECT * FROM Service WHERE service_id = ?',
        [serviceId],
        function(err, service) {
            if (err) {
                return res.status(500).json({ error: "Database error" });
            }
            if (!service) {
                return res.status(404).json({ error: "Queue not found" });
            }

            findOpenQueue(serviceId, function(err, queue) {
                if (err) {
                    return res.status(500).json({ error: "Database error" });
                }
                if (!queue) {
                    return res.status(404).json({ error: "Queue not found" });
                }

                findQueueEntry(queue.queue_id, userId, function(err, entry) {
                    if (err) {
                        return res.status(500).json({ error: "Database error" });
                    }

                    if (!entry || entry.status !== 'waiting') {
                        return res.status(200).json({
                            service: service.service_name,
                            position: 0,
                            waitTime: 0,
                            status: getStatus(0, entry && entry.status === 'served')
                        });
                    }

                    getQueuePosition(queue.queue_id, entry.position, function(err, result) {
                        if (err) {
                            return res.status(500).json({ error: "Database error" });
                        }

                        const position = result.position;

                        return res.status(200).json({
                            service: service.service_name,
                            position: position,
                            waitTime: getWaitTime(position, service.expected_duration),
                            status: getStatus(position, false)
                        });
                    });
                });
            });
        }
    );
});

module.exports = router;
