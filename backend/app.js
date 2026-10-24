const express = require('express');
const app = express();
app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

app.get("/", function(req, res) {
    res.send("QueueSmart Backend API is functioning properly.");
});

const loginRouter = require('./login_backend');
app.use("/api/auth", loginRouter);

const serviceManagementRouter = require('./services_backend');
app.use("/api/services", serviceManagementRouter);

const queueManagerRouter = require('./queues_backend');
app.use("/api/queues", queueManagerRouter);

module.exports = app;
