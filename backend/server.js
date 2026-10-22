const express = require('express');
const app = express();
const PORT = 3000;

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

app.listen(PORT, function() {
    console.log(`Server is running on http://localhost:${PORT}`);
});