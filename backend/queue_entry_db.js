
const db = require('./db');

// Get open queue
function findOpenQueue(serviceId, callback) {
    db.get(
        "SELECT * FROM Queue WHERE service_id = ? AND status = 'open'",
        [serviceId],
        callback
    );
}

// Add user to queue
function addQueueEntry(queueId, userId, position, callback) {
    db.run(
        'INSERT INTO QueueEntry (queue_id, user_id, position) VALUES (?, ?, ?)',
        [queueId, userId, position],
        callback
    );
}

// Check if user is already waiting
function findUserEntry(userId, callback) {
    db.get(
        "SELECT * FROM QueueEntry WHERE user_id = ? AND status = 'waiting'",
        [userId],
        callback
    );
}

// Get next position
function getNextPosition(queueId, callback) {
    db.get(
        "SELECT COALESCE(MAX(position), 0) + 1 AS position FROM QueueEntry WHERE queue_id = ? AND status = 'waiting'",
        [queueId],
        callback
    );
}

// Find user's queue entry
function findQueueEntry(queueId, userId, callback) {
    db.get(
        'SELECT * FROM QueueEntry WHERE queue_id = ? AND user_id = ? ORDER BY entry_id DESC LIMIT 1',
        [queueId, userId],
        callback
    );
}

// Get current position
function getQueuePosition(queueId, position, callback) {
    db.get(
        "SELECT COUNT(*) AS position FROM QueueEntry WHERE queue_id = ? AND status = 'waiting' AND position <= ?",
        [queueId, position],
        callback
    );
}

// Leave queue
function leaveQueueEntry(queueId, userId, callback) {
    db.run(
        "UPDATE QueueEntry SET status = 'canceled' WHERE queue_id = ? AND user_id = ? AND status = 'waiting'",
        [queueId, userId],
        callback
    );
}

module.exports = {
    findOpenQueue,
    addQueueEntry,
    findUserEntry,
    getNextPosition,
    findQueueEntry,
    getQueuePosition,
    leaveQueueEntry
};
