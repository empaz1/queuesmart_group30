const express = require('express');
const router = express.Router();
const {queues, servedUsers} = require('./data'); 

router.get("/", function(req, res){
    res.status(200).json(queues);
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


router.delete("/:serviceId/users/:userId", function(req, res){
    const result = queueValidation(req.params.serviceId);
    if(result.error){
        return res.status(result.status).json({ error: result.error });
    }

    const queue = result.queue;
    const userId = Number(req.params.userId);

    if(!Number.isInteger(userId) || userId <= 0){
        return res.status(400).json({ error: "Invalid user ID"});
    }

    const userIndex = queue.users.findIndex(user => user.id === userId);
    if(userIndex === -1){
        return res.status(404).json({ error: "User not found"});
    }

    const deletedUser = queue.users.splice(userIndex, 1)[0];
    return res.status(200).json ({ message: "User successfully removed", user: deletedUser });
})


router.post("/:serviceId/serve", function(req, res){
    const result = queueValidation(req.params.serviceId);
    if(result.error){
        return res.status(result.status).json({ error: result.error });
    }

    const queue = result.queue;
    
    if(queue.users.length === 0){
        return res.status(400).json({ error: "Queue is empty" });
    }

    const served = queue.users.shift();
    servedUsers.push({ serviceId: queue.serviceId, id: served.id }); 
    return res.status(200).json({ message: "User succewssfully served", user: served });
})

router.put("/:serviceId/reorder", function(req, res){
    const result = queueValidation(req.params.serviceId);
    if(result.error){
        return res.status(result.status).json({ error: result.error });
    }

    const queue = result.queue;
    const { userIds } = req.body;

    if(!Array.isArray(userIds)) {
        return res.status(400).json({ error: "User ID's must be an array"});
    }

    const idSet = queue.users.map(user => user.id);

    if(userIds.length !== idSet.length || !userIds.every(id => idSet.includes(id)) || new Set(userIds).size !== userIds.length) {
        return res.status(400).json({ error: "User ID's imporperly formatted or do not match the queue"});
    }

    queue.users.sort(
        function(a, b){
            return userIds.indexOf(a.id) - userIds.indexOf(b.id);
        }
    );

    return res.status(200).json({message: "Queue sucessfully reordered", queue: queue});

})

module.exports = router;
