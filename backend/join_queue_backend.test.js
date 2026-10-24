
const express = require('express');
const request = require('supertest');
const router = require('./join_queue_backend');
const { queues, servedUsers } = require('./data');

const app = express();
app.use(express.json());
app.use('/api/join-queue', router);

beforeEach(function () {
    // reset test data
    queues.length = 0;
    servedUsers.length = 0;
});

test('user can join a queue', async function () {
    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    expect(res.status).toBe(201);
    expect(res.body.position).toBe(1);
    expect(res.body.status).toBe('Almost Ready');
});

test('user cannot join the same queue twice', async function () {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User is already in this queue');
});

test('user can leave a queue', async function () {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    const res = await request(app)
        .delete('/api/join-queue/2/users/1');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('You left the queue.');
});

test('user can check queue status', async function () {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    const res = await request(app)
        .get('/api/join-queue/2/users/1/status');

    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1);
    expect(res.body.waitTime).toBe(0);
});

test('invalid service is rejected', async function () {
    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 999 });

    expect(res.status).toBe(404);
});

test('invalid user ID is rejected', async function () {
    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: -1, name: 'Test User', serviceId: 2 });

    expect(res.status).toBe(400);
});

test('missing name is rejected', async function () {
    const res = await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: '', serviceId: 2 });

    expect(res.status).toBe(400);
});

test('served user gets Served status', async function () {
    await request(app)
        .post('/api/join-queue')
        .send({ userId: 1, name: 'Test User', serviceId: 2 });

    queues.find(q => q.serviceId === 2).users.shift();
    servedUsers.push({ serviceId: 2, id: 1 });

    const res = await request(app)
        .get('/api/join-queue/2/users/1/status');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Served');
});
