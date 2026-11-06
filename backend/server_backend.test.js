const request = require('supertest');
const app = require('./server_backend');
const { db, initDb } = require('./server_db');

beforeAll(() => {
  initDb();
  db.prepare(`INSERT OR IGNORE INTO UserCredentials (userId, email, password, role) VALUES ('u1', 'jsmith@uh.edu', 'password123', 'User')`).run();
});
beforeEach(() => {
  if (typeof app.resetState === 'function') {
    app.resetState();
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

  test('POST /api/auth/register rejects duplicate username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'jsmith', password: 'password123' });
    expect(res.statusCode).toBe(409);
  });

  test('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'jsmith', password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.role).toBe('User');
  });

  test('POST /api/auth/login rejects incorrect password or missing fields', async () => {
    const badPass = await request(app)
      .post('/api/auth/login')
      .send({ username: 'jsmith', password: 'wrong' });
    expect(badPass.statusCode).toBe(401);

    const noPass = await request(app)
      .post('/api/auth/login')
      .send({ username: 'jsmith' });
    expect(noPass.statusCode).toBe(400);
  });
});

describe('Service Management Module', () => {
  test('GET /api/services returns all available services', async () => {
    const res = await request(app).get('/api/services');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  test('POST /api/services adds a valid service', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ name: 'Testing Center', description: 'Exam proctoring', durationMinutes: 10, priorityLevel: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/services rejects invalid inputs', async () => {
    const badName = await request(app)
      .post('/api/services')
      .send({ name: 'T', durationMinutes: 10 });
    expect(badName.statusCode).toBe(400);

    const badDuration = await request(app)
      .post('/api/services')
      .send({ name: 'Valid Name', durationMinutes: -5 });
    expect(badDuration.statusCode).toBe(400);
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

  test('GET /api/queue/user/:userId handles user not in queue', async () => {
    const res = await request(app).get('/api/queue/user/nonexistent');
    expect(res.statusCode).toBe(200);
    expect(res.body.active).toBe(false);
  });

  test('POST /api/queue/leave removes user and updates history', async () => {
    const leaveRes = await request(app).post('/api/queue/leave').send({ userId: 'u1' });
    expect(leaveRes.statusCode).toBe(200);

    const checkRes = await request(app).get('/api/queue/user/u1');
    expect(checkRes.body.active).toBe(false);

    const histRes = await request(app).get('/api/history/u1');
    expect(histRes.body[0].status).toBe('Cancelled');
  });

  test('POST /api/queue/leave rejects missing userId or non-existent ticket', async () => {
    const noUser = await request(app).post('/api/queue/leave').send({});
    expect(noUser.statusCode).toBe(400);

    const notFound = await request(app).post('/api/queue/leave').send({ userId: 'ghost' });
    expect(notFound.statusCode).toBe(404);
  });

  test('POST /api/queue/join creates ticket and generates notification', async () => {
    await request(app).post('/api/queue/leave').send({ userId: 'u1' });

    const joinRes = await request(app)
      .post('/api/queue/join')
      .send({ userId: 'u1', serviceId: 's1' });

    expect(joinRes.statusCode).toBe(201);
    expect(joinRes.body.ticket).toBeDefined();

    const notifRes = await request(app).get('/api/notifications/u1');
    expect(notifRes.body[0].message).toMatch(/Joined Queue|You hold ticket/);
  });

  test('POST /api/queue/join rejects invalid parameters or duplicate ticket', async () => {
    const missing = await request(app).post('/api/queue/join').send({ userId: 'u1' });
    expect(missing.statusCode).toBe(400);

    const badService = await request(app).post('/api/queue/join').send({ userId: 'u999', serviceId: 's999' });
    expect(badService.statusCode).toBe(404);

    const duplicate = await request(app).post('/api/queue/join').send({ userId: 'u1', serviceId: 's1' });
    expect(duplicate.statusCode).toBe(400);
  });

  test('POST /api/queue/delay shifts user position or returns 404', async () => {
    const okRes = await request(app)
      .post('/api/queue/delay')
      .send({ userId: 'u1', additionalMinutes: 5 });
    expect(okRes.statusCode).toBe(200);

    const notFound = await request(app)
      .post('/api/queue/delay')
      .send({ userId: 'unknown_user', additionalMinutes: 5 });
    expect(notFound.statusCode).toBe(404);
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

describe('UserProfile Database Integration', () => {
  test('POST /api/profile creates a new user profile', async () => {
    const res = await request(app)
      .post('/api/profile')
      .send({
        userId: 'u1',
        fullName: 'John Smith',
        email: 'jsmith@uh.edu',
        phone: '713-555-0199'
      });
    expect(res.statusCode).toBe(201);
  });

  test('POST /api/profile validates required fields and email formatting', async () => {
    const badName = await request(app)
      .post('/api/profile')
      .send({ userId: 'u1', fullName: 'J', email: 'valid@uh.edu' });
    expect(badName.statusCode).toBe(400);

    const badEmail = await request(app)
      .post('/api/profile')
      .send({ userId: 'u1', fullName: 'John Smith', email: 'notanemail' });
    expect(badEmail.statusCode).toBe(400);
  });

  test('GET /api/profile/:userId returns 200 with saved profile data', async () => {
    const res = await request(app).get('/api/profile/u1');
    expect(res.statusCode).toBe(200);
    expect(res.body.fullName).toBe('John Smith');
    expect(res.body.email).toBe('jsmith@uh.edu');
  });

  test('GET /api/profile/:userId returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/profile/nonexistent');
    expect(res.statusCode).toBe(404);
  });

  test('PUT /api/profile/:userId updates record in SQLite', async () => {
    const res = await request(app)
      .put('/api/profile/u1')
      .send({ fullName: 'Johnathon Smith', phone: '832-555-9999' });
    expect(res.statusCode).toBe(200);

    const row = db.prepare('SELECT fullName, phone FROM UserProfile WHERE userId = ?').get('u1');
    expect(row.fullName).toBe('Johnathon Smith');
    expect(row.phone).toBe('832-555-9999');
  });

  test('PUT /api/profile/:userId rejects invalid input lengths', async () => {
    const res = await request(app)
      .put('/api/profile/u1')
      .send({ fullName: 'A' });
    expect(res.statusCode).toBe(400);
  });
});

describe('NotificationHistory Database Integration', () => {
  let createdNotifId;

  test('POST /api/notifications persists a notification to SQLite', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', message: 'Ticket R-14 is ready for service.' });
    expect(res.statusCode).toBe(201);
    expect(res.body.notificationId).toBeDefined();
    createdNotifId = res.body.notificationId;

    const row = db.prepare('SELECT status, message FROM NotificationHistory WHERE notificationId = ?').get(createdNotifId);
    expect(row.status).toBe('sent');
  });

  test('POST /api/notifications enforces non-empty message constraint', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ userId: 'u1', message: '   ' });
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/notifications/:userId returns array of notifications from SQLite', async () => {
    const res = await request(app).get('/api/notifications/u1');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('PATCH /api/notifications/:id/read updates status to viewed', async () => {
    const res = await request(app).patch(`/api/notifications/${createdNotifId}/read`);
    expect(res.statusCode).toBe(200);

    const row = db.prepare('SELECT status FROM NotificationHistory WHERE notificationId = ?').get(createdNotifId);
    expect(row.status).toBe('viewed');
  });
});

