const express = require('express');
const router = express.Router();
const { services, queues, servedUsers } = require('./data');

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
    return validId(value);
}

function findQueue(serviceId) {
    return queues.find(q => q.serviceId === serviceId);
}

// 0 means the user is not in the queue
function getPosition(queue, userId) {
    return queue.users.findIndex(user => user.id === userId) + 1;
}

// only the people ahead of you count
function getWaitTime(position, service) {
    return Math.max(0, position - 1) * service.duration;
}

function wasServed(serviceId, userId) {
    return servedUsers.some(u => u.serviceId === serviceId && u.id === userId);
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

// join a queue
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

    const service = services.find(s => s.id === serviceId);
    if (!service) {
        return res.status(404).json({ error: "Service not found" });
    }

    let queue = findQueue(serviceId);
    if (!queue) {
        queue = { serviceId: serviceId, users: [] };
        queues.push(queue);
    }

    if (getPosition(queue, userId) > 0) {
        return res.status(400).json({ error: "User is already in this queue" });
    }

    if (queues.some(q => q.users.some(user => user.id === userId))) {
        return res.status(400).json({ error: "User is already in another queue" });
    }

    queue.users.push({ id: userId, name: name.trim() });

    // joining again clears an old served record
    const servedIndex = servedUsers.findIndex(u => u.serviceId === serviceId && u.id === userId);
    if (servedIndex !== -1) {
        servedUsers.splice(servedIndex, 1);
    }

    const position = getPosition(queue, userId);
    return res.status(201).json({
        message: "Successfully joined!",
        service: service.name,
        position: position,
        waitTime: getWaitTime(position, service),
        status: getStatus(position, false)
    });
});

// leave a queue
router.delete('/:serviceId/users/:userId', function(req, res) {
    const serviceId = validId(req.params.serviceId);
    const userId = validUserId(req.params.userId);

    if (!serviceId || !userId) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    const queue = findQueue(serviceId);
    if (!queue) {
        return res.status(404).json({ error: "Queue not found" });
    }

    const index = queue.users.findIndex(user => user.id === userId);
    if (index === -1) {
        return res.status(404).json({ error: "User is not in this queue" });
    }

    queue.users.splice(index, 1);
    return res.status(200).json({ message: "You left the queue." });
});

// position, wait time and status
router.get('/:serviceId/users/:userId/status', function(req, res) {
    const serviceId = validId(req.params.serviceId);
    const userId = validUserId(req.params.userId);

    if (!serviceId || !userId) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    const service = services.find(s => s.id === serviceId);
    const queue = findQueue(serviceId);
    if (!service || !queue) {
        return res.status(404).json({ error: "Queue not found" });
    }

    const position = getPosition(queue, userId);
    return res.status(200).json({
        service: service.name,
        position: position,
        waitTime: getWaitTime(position, service),
        status: getStatus(position, wasServed(serviceId, userId))
    });
});

module.exports = router;
