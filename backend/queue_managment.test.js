const request = require("supertest");
const app = require("./app");
const db = require("./db");
const fs = require("fs");
const path = require("path");

beforeAll(function(done){
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    db.exec(schema, done);
});


beforeEach(function(done) {
    db.exec(`
        DELETE FROM QueueEntry;
        DELETE FROM Queue;
        DELETE FROM UserProfile;
        DELETE FROM UserCredentials;
        DELETE FROM Service;

        INSERT INTO Service
        (service_id, service_name, description, expected_duration, priority_level)
        VALUES
        (1,'Financial Aid', 'Financial help with upcoming semesters', 45, 3);

        INSERT INTO Queue
        (queue_id, service_id, status)
        VALUES
        (1, 1, 'open');

        INSERT INTO UserCredentials
        (user_id, email, password_hash, role)
        VALUES
        ('u1', 'u1@example.invalid', 'test-only', 'User'),
        ('u2', 'u2@example.invalid', 'test-only', 'User'),
        ('u3', 'u3@example.invalid', 'test-only', 'User');

        INSERT INTO UserProfile
        (user_id, full_name, email)
        VALUES
        ('u1', 'Weston Lee', 'u1@example.invalid'),
        ('u2', 'Maria Florez', 'u2@example.invalid'),
        ('u3', 'Craig McDonald', 'u3@example.invalid');

        INSERT INTO QueueEntry
        (queue_id, user_id, position, status)
        VALUES
        (1, 'u1', 1, 'waiting'),
        (1, 'u2', 2, 'waiting'),
        (1, 'u3', 3, 'waiting');
    `, done);
});

afterAll(function(done) {
    db.close(done);
});

test("GET /api/queues returns all queues", async function(){
    const response = await request(app).get("/api/queues");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toEqual({
        serviceId: 1,
        users: [
            { id: "u1", name: "Weston Lee" },
            { id: "u2", name: "Maria Florez" },
            { id: "u3", name: "Craig McDonald" }
        ]
    });
});


test("DELETE User is removed from queue", async function(){
    
    const response = await request(app).delete("/api/queues/1/users/u2");

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe("u2");
    const getRes = await new Promise((resolve, reject) => {
        db.all(`SELECT user_id, position, status FROM QueueEntry
            WHERE queue_id = 1 ORDER BY queue_id`, [], function(err, rows){
            if (err) reject(err);
            else resolve(rows);
        });
    });

    expect(getRes).toEqual([
        { user_id: "u1", position: 1, status: "waiting" },
        { user_id: "u2", position: 2, status: "canceled" },
        { user_id: "u3", position: 2, status: "waiting" }
    ]);
});

test("DELETE does not allow improper request", async function(){
    const response = await request(app).delete("/api/queues/1/users/30");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("User not found in queue");
    const getRes = await new Promise((resolve, reject) => {
        db.all(`SELECT user_id, position, status FROM QueueEntry
            WHERE queue_id = 1 ORDER BY queue_id`, [], function(err, rows){
            if (err) reject(err);
            else resolve(rows);
        });
    });

    expect(getRes).toEqual([
        { user_id: "u1", position: 1, status: "waiting" },
        { user_id: "u2", position: 2, status: "waiting" },
        { user_id: "u3", position: 3, status: "waiting" }
    ]);
})

test("DELETE rejects invalid service ID", async function() {
    const response = await request(app)
        .delete("/api/queues/-1/users/u2");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid service ID");
});

test("DELETE rejects nonexistent queue", async function() {
    const response = await request(app)
        .delete("/api/queues/999/users/u1");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Queue not found");
});

test("DELETE rejects empty user ID", async function() {
    const response = await request(app)
        .delete("/api/queues/1/users/%20");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid user ID");
});

test("POST serves next user", async function(){
    const response = await request(app).post("/api/queues/1/serve");
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe("u1");
    
    const getRes = await new Promise((resolve, reject) => {
        db.all(`SELECT user_id, position, status FROM QueueEntry
            WHERE queue_id = 1 ORDER BY queue_id`, [], function(err, rows){
            if (err) reject(err);
            else resolve(rows);
        });
    });
    expect(getRes).toEqual([
        { user_id: "u1", position: 1, status: "served" },
        { user_id: "u2", position: 1, status: "waiting" },
        { user_id: "u3", position: 2, status: "waiting" }
    ]);
})

test("POST rejects invalid service ID", async function() {
    const response = await request(app)
        .post("/api/queues/-1/serve");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid service ID");
});

test("POST does not allow empty queue", async function(){
    await new Promise((resolve, reject) => {
        db.run(`DELETE FROM QueueEntry WHERE queue_id = ?`, [1], function(err){
            if (err) reject(err);
            else resolve();
        });
    });
    
    const response = await request(app).post("/api/queues/1/serve");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("No users in queue");
})

test("POST rejects nonexistent queue", async function() {
    const response = await request(app)
        .post("/api/queues/999/serve");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Queue not found");
});

test("PUT reorder works", async function() {
    const response = await request(app)
        .put("/api/queues/1/reorder")
        .send({
            userIds: ["u2", "u3", "u1"]
        });

    expect(response.status).toBe(200);

    const getRes = await new Promise((resolve, reject) => {
        db.all(
            `SELECT user_id, position, status
             FROM QueueEntry
             WHERE queue_id = 1 AND status = 'waiting'
             ORDER BY position`,
            [],
            function(err, rows) {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });

    expect(getRes).toEqual([
        { user_id: "u2", position: 1, status: "waiting" },
        { user_id: "u3", position: 2, status: "waiting" },
        { user_id: "u1", position: 3, status: "waiting" }
    ]);
});

test("PUT rejects userIds that is not an array", async function() {
    const response = await request(app)
        .put("/api/queues/1/reorder")
        .send({
            userIds: "u1"
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("User ID's must be an array");
});

test("PUT does not allow improper requests", async function() {
    const response = await request(app)
        .put("/api/queues/1/reorder")
        .send({
            userIds: ["u5", "u3", "u1"]
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Incorrect User IDs");

    const getRes = await new Promise((resolve, reject) => {
        db.all(
            `SELECT user_id, position
             FROM QueueEntry
             WHERE queue_id = 1 AND status = 'waiting'
             ORDER BY position`,
            [],
            function(err, rows) {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });

    expect(getRes).toEqual([
        { user_id: "u1", position: 1 },
        { user_id: "u2", position: 2 },
        { user_id: "u3", position: 3 }
    ]);
});

test("PUT rejects nonexistent queue", async function() {
    const response = await request(app)
        .put("/api/queues/999/reorder")
        .send({
            userIds: ["u2", "u3", "u1"]
        });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Queue not found");
});
