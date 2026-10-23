const request = require("supertest");
const app = require("./app");


const {queues} = require("./data")

beforeEach(function(){
    return queues[0].users = [
        { id: 1, name: "Weston Lee" },
        { id: 2, name: "Maria Florez" },
        { id: 3, name: "Craig McDonald" }
    ];
});


test("GET /api/queues returns all queues", async function(){
    const response = await request(app).get("/api/queues");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
})

test("DELETE User is removed from queue", async function(){
    

    const response = await request(app).delete("/api/queues/1/users/2");

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(2);
    expect(queues[0].users.some(user => user.id === 2)).toBe(false);
});

test("DELETE does not allow improper request", async function(){
    const response = await request(app).delete("/api/queues/1/users/30");

    expect(response.status).toBe(404);
})

test("POST serves next user", async function(){
    const response = await request(app).post("/api/queues/1/serve");
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(1);
    expect(queues[0].users.length).toBe(2);
    expect(queues[0].users[0].id).toBe(2);
})

test("POST does not allow empty queue", async function(){
    queues[0].users = [];
    const response = await request(app).post("/api/queues/1/serve")
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Queue is empty");
})

test("PUT reorder works", async function(){
    const response = await request(app).put("/api/queues/1/reorder").send({
        userIds: [2,3,1]
    });

    expect(response.status).toBe(200);
    const newIds = queues[0].users.map(user => user.id)
    expect(newIds).toEqual([2,3,1]);
})

test("PUT does not allow improper requests", async function(){
    const response = await request(app).put("/api/queues/1/reorder").send({
        userIds: [5,3,1]
    });

    expect(response.status).toBe(400);
    const check = queues[0].users.map(user => user.id);
    expect(check).toEqual([1,2,3]);
})