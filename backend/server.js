const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", function(req, res) {
    res.send("QueueSmart Backend API is functioning properly.");
});

const serviceManagementRouter = require('./service_managment');
app.use("/api/services", serviceManagementRouter);

app.listen(PORT, function() {
    console.log(`Server is running on http://localhost:${PORT}`);
});