jest.mock('./db', () => {
    const sqlite3 = require('sqlite3');
    return new sqlite3.Database(':memory:');
});

const express = require('express');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const router = require('./join_queue_backend');

const app = express();
app.use(express.json());
app.use('/api/join-queue', router);

beforeAll(function(done) {
    const schema = fs.readFileSync(
        path.join(__dirname, 'schema.sql'),
        'utf8'
    );

    const testData = `
        INSERT INTO UserCredentials (user_id, email, password_hash, role)
        VALUES ('1', 'user1@test.com', 'test', 'User');

        INSERT INTO UserCredentials (user_id, email, password_hash, role)
        VALUES ('2', 'user2@test.com', 'test', 'User');

        INSERT INTO UserCredentials (user_id, email, password_hash, role)
        VALUES ('3', 'user3@test.com', 'test', 'User');

        INSERT INTO UserCredentials (user_id, email, password_hash, role)
        VALUES ('4', 'user4@test.com', 'test', 'User');

        INSERT INTO Service (service_id, service_name, expected_duration)
        VALUES (2, 'Financial Aid', 8);

        INSERT INTO Service (service_id, service_name, expected_duration)
        VALUES (3, 'IT Help Desk', 6);

        INSERT INTO Queue (queue_id, service_id, status)
        VALUES (2, 2, 'open');

        INSERT INTO Queue (queue_id, service_id, status)
        VALUES (3, 3, 'open');
    `;

    db.exec('PRAGMA foreign_keys = ON;' + schema + testData, done);
});

beforeEach(function(done) {
    db.run('DELETE FROM QueueEntry', done);
});

afterAll(function(done) {
    db.close(done);
});

test('user can join a queue', async function() {
    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    expect(res.status).toBe(201);
    expect(res.body.position).toBe(1);
    expect(res.body.status).toBe('Almost Ready');
});

test('user cannot join the same queue twice', async function() {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User is already in this queue');
});

test('user cannot join another queue while waiting', async function() {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 3 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User is already in another queue');
});

test('user can leave a queue', async function() {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    const res = await request(app)
        .delete('/api/join-queue/2/users/1');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('You left the queue.');
});

test('user can check queue status', async function() {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    const res = await request(app)
        .get('/api/join-queue/2/users/1/status');

    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1);
    expect(res.body.waitTime).toBe(0);
    expect(res.body.status).toBe('Almost Ready');
});

test('invalid service is rejected', async function() {
    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 999 });

    expect(res.status).toBe(404);
});

test('invalid user ID is rejected', async function() {
    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: -1, name: 'Test User', serviceId: 2 });

    expect(res.status).toBe(400);
});

test('missing name is rejected', async function() {
    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: '', serviceId: 2 });

    expect(res.status).toBe(400);
});

test('served user gets Served status', async function() {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    await new Promise(function(resolve, reject) {
        db.run(
            "UPDATE QueueEntry SET status = 'served' WHERE user_id = '1'",
            function(err) {
                if (err) reject(err);
                else resolve();
            }
        );
    });

    const res = await request(app)
        .get('/api/join-queue/2/users/1/status');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Served');
});

test('position updates when someone leaves', async function() {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    await request(app)
        .post('/api/join-queue')
        .send({ userId: 2, name: 'Second User', serviceId: 2 });

    await request(app)
        .delete('/api/join-queue/2/users/1');

    const res = await request(app)
        .get('/api/join-queue/2/users/2/status');

    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1);
    expect(res.body.waitTime).toBe(0);
});

test('user can join again after leaving', async function() {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    await request(app)
        .delete('/api/join-queue/2/users/1');

    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    expect(res.status).toBe(201);
    expect(res.body.position).toBe(1);
});

test('new user gets correct position after someone in the middle leaves', async function() {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'User 1', serviceId: 2 });

    await request(app)
        .post('/api/join-queue')
        .send({ userId: 2, name: 'User 2', serviceId: 2 });

    await request(app)
        .post('/api/join-queue')
        .send({ userId: 3, name: 'User 3', serviceId: 2 });

    await request(app)
        .delete('/api/join-queue/2/users/2');

    const joinRes = await request(app)
        .post('/api/join-queue')
        .send({ userId: 4, name: 'User 4', serviceId: 2 });

    expect(joinRes.status).toBe(201);
    expect(joinRes.body.position).toBe(3);
    expect(joinRes.body.waitTime).toBe(16);

    const statusRes = await request(app)
        .get('/api/join-queue/2/users/4/status');

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.position).toBe(3);
    expect(statusRes.body.waitTime).toBe(16);
});

