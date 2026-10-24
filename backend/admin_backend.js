const express = require("express");
const router = express.Router();
const { verifyAdmin } = require("./middleware");
const { users, services, queues } = require("./data");

router.get('/dashboard', verifyAdmin, (req, res) => {
    let totalQueuedUsers = 0;

    const serviceOverview = services.map(service => {
        const serviceObject = queues.find(q => q.serviceId === service.id);
        const waitingUsers = serviceObject && serviceObject.users ? serviceObject.users : [];
        
        totalQueuedUsers += waitingUsers.length;

        return {
           id: service.id,
           name: service.name,
           description: service.description,
           duration: service.duration,
           priority: service.priority || "Normal",
           waiting: waitingUsers
        };
    });

    return res.status(200).json({
        totalUsers: users.length,
        totalServices: services.length,
        totalQueuedUsers,
        services: serviceOverview
    });
});

router.post('/queues/call-next',verifyAdmin,(req, res) => {
    const { serviceId } = req.body;
    const targetServiceId = Number(serviceId);
    const serviceObject = queues.find(q => q.serviceId === targetServiceId);

    if (!serviceObject || !serviceObject.users || serviceObject.users.length === 0) {
        return res.status(404).json({ error: "No customers waiting in the queue" });
    }
    const nextUser = serviceObject.users.shift();
    return res.status(200).json({ 
        message: "Successfully called the next customer" ,
        nextUser,
        remainingQueue: serviceObject.users
     });
});
module.exports = router;