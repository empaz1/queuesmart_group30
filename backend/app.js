const express = require('express');
const app = express();
app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

app.get("/", function(req, res) {
    res.send("QueueSmart Backend API is functioning properly.");
});

const serviceManagementRouter = require('./services_backend');
app.use("/api/services", serviceManagementRouter);

const queueManagerRouter = require('./queues_backend');
app.use("/api/queues", queueManagerRouter);

// Join Queue and Queue Status
const joinQueueRouter = require('./join_queue_backend');
app.use('/api/join-queue', joinQueueRouter);

module.exports = app;

