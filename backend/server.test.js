const request = require('supertest');
const app = require('./server');

beforeEach(() => {
  if (typeof app._resetState === 'function') {
    app._resetState();
  }
});

describe('Authentication Module Validation & Logic', () => {
  test('POST /api/auth/register fails with short username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', password: 'password123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/between 3 and 30 characters/);
  });

  test('POST /api/auth/register fails with short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'validuser', password: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/between 6 and 50 characters/);
  });

  test('POST /api/auth/register registers new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newuser', password: 'securepassword', role: 'User' });
    expect(res.statusCode).toBe(201);
    expect(res.body.userId).toBeDefined();
  });

  test('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'jsmith', password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.role).toBe('User');
  });

  test('POST /api/auth/login rejects incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'jsmith', password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Queue Management, Wait Time & State Changes', () => {
  test('GET /api/queue/user/:userId returns active ticket and wait calculation', async () => {
    const res = await request(app).get('/api/queue/user/u1');
    expect(res.statusCode).toBe(200);
    expect(res.body.active).toBe(true);
    expect(res.body.ticket).toBe('R-14');
    expect(res.body.position).toBe(2);
    expect(res.body.estimatedWaitMinutes).toBe(6);
  });

  test('POST /api/queue/leave removes user and updates history', async () => {
    const leaveRes = await request(app).post('/api/queue/leave').send({ userId: 'u1' });
    expect(leaveRes.statusCode).toBe(200);

    const checkRes = await request(app).get('/api/queue/user/u1');
    expect(checkRes.body.active).toBe(false);

    const histRes = await request(app).get('/api/history/u1');
    expect(histRes.body[0].status).toBe('Cancelled');
  });

  test('POST /api/queue/join creates ticket and generates notification', async () => {
    await request(app).post('/api/queue/leave').send({ userId: 'u1' });

    const joinRes = await request(app)
      .post('/api/queue/join')
      .send({ userId: 'u1', serviceId: 's1' });

    expect(joinRes.statusCode).toBe(201);
    expect(joinRes.body.ticket).toBeDefined();

    const notifRes = await request(app).get('/api/notifications/u1');
    expect(notifRes.body[0].title).toBe('Joined Queue');
  });

  test('POST /api/queue/join rejects duplicate entry', async () => {
    const joinRes = await request(app)
      .post('/api/queue/join')
      .send({ userId: 'u1', serviceId: 's1' });
    expect(joinRes.statusCode).toBe(400);
  });
});

describe('Notifications & History Endpoints', () => {
  test('GET /api/history/:userId retrieves historical items', async () => {
    const res = await request(app).get('/api/history/u1');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  test('DELETE /api/notifications/:userId clears all notifications', async () => {
    const delRes = await request(app).delete('/api/notifications/u1');
    expect(delRes.statusCode).toBe(200);

    const checkRes = await request(app).get('/api/notifications/u1');
    expect(checkRes.body.length).toBe(0);
  });
});
