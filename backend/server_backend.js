const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const users = [
  { id: 'u1', username: 'jsmith', password: 'password123', role: 'User' },
  { id: 'admin1', username: 'admin', password: 'adminpassword', role: 'Administrator' }
];

const services = [
  { id: 's1', name: 'Academic Advising', description: 'Degree planning and registration', durationMinutes: 3, priorityLevel: 1 },
  { id: 's2', name: 'Financial Aid', description: 'Scholarships and grants', durationMinutes: 5, priorityLevel: 2 },
  { id: 's3', name: 'IT Desk', description: 'Account access and hardware', durationMinutes: 4, priorityLevel: 3 }
];

let queue = [
  { ticket: 'R-13', userId: 'u99', serviceId: 's1', joinedAt: new Date(Date.now() - 600000), priority: 1 },
  { ticket: 'R-14', userId: 'u1', serviceId: 's1', joinedAt: new Date(), priority: 1 }
];

let history = [
  { ticket: 'R-08', userId: 'u1', service: 'Academic Advising', date: 'Oct 24', status: 'Completed' },
  { ticket: 'R-91', userId: 'u1', service: 'Financial Aid', date: 'Oct 18', status: 'Completed' },
  { ticket: 'R-12', userId: 'u1', service: 'IT Desk', date: 'Oct 10', status: 'Cancelled' }
];

let notifications = [
  { id: 1, userId: 'u1', title: 'Almost Your Turn', text: 'You are #2 in line. Please head to the counter area.', timestamp: new Date() }
];

let ticketCounter = 15;

app.post('/api/auth/register', (req, res) => {
  const { username, password, role } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
    return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
  }

  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 50) {
    return res.status(400).json({ error: 'Password must be between 6 and 50 characters.' });
  }

  const assignedRole = role === 'Administrator' ? 'Administrator' : 'User';

  if (users.find(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Username already registered.' });
  }

  const newUser = { id: `u${Date.now()}`, username: username.trim(), password, role: assignedRole };
  users.push(newUser);
  return res.status(201).json({ message: 'User registered successfully', userId: newUser.id, role: newUser.role });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  return res.status(200).json({ message: 'Login successful', userId: user.id, username: user.username, role: user.role });
});

app.get('/api/services', (req, res) => {
  res.status(200).json(services);
});

app.post('/api/services', (req, res) => {
  const { name, description, durationMinutes, priorityLevel } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    return res.status(400).json({ error: 'Service name must be between 2 and 50 characters.' });
  }

  if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
    return res.status(400).json({ error: 'durationMinutes must be a positive number.' });
  }

  const newService = {
    id: `s${services.length + 1}`,
    name: name.trim(),
    description: description || '',
    durationMinutes,
    priorityLevel: Number.isInteger(priorityLevel) ? priorityLevel : 1
  };
  services.push(newService);
  return res.status(201).json(newService);
});

app.get('/api/queue/user/:userId', (req, res) => {
  const { userId } = req.params;
  const entryIndex = queue.findIndex(item => item.userId === userId);

  if (entryIndex === -1) {
    return res.status(200).json({ active: false, ticket: null });
  }

  const userTicket = queue[entryIndex];
  const service = services.find(s => s.id === userTicket.serviceId) || { durationMinutes: 3, name: 'General Service' };

  const position = entryIndex + 1;
  const estimatedWaitMinutes = position * service.durationMinutes;

  return res.status(200).json({
    active: true,
    ticket: userTicket.ticket,
    service: service.name,
    position,
    estimatedWaitMinutes
  });
});

app.post('/api/queue/join', (req, res) => {
  const { userId, serviceId } = req.body;
  if (!userId || !serviceId) {
    return res.status(400).json({ error: 'userId and serviceId are required.' });
  }

  const service = services.find(s => s.id === serviceId);
  if (!service) return res.status(404).json({ error: 'Service not found.' });

  const existing = queue.find(q => q.userId === userId);
  if (existing) {
    return res.status(400).json({ error: 'User already has an active queue ticket.' });
  }

  const ticketNumber = `R-${ticketCounter++}`;
  const newEntry = {
    ticket: ticketNumber,
    userId,
    serviceId,
    joinedAt: new Date(),
    priority: service.priorityLevel
  };

  queue.push(newEntry);

  const position = queue.length;
  const waitTime = position * service.durationMinutes;
  notifications.unshift({
    id: notifications.length + 1,
    userId,
    title: 'Joined Queue',
    text: `You hold ticket ${ticketNumber}. Initial estimated wait is ${waitTime} mins.`,
    timestamp: new Date()
  });

  return res.status(201).json({
    message: 'Joined queue successfully',
    ticket: ticketNumber,
    service: service.name,
    position,
    estimatedWaitMinutes: waitTime
  });
});

app.post('/api/queue/leave', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required.' });

  const index = queue.findIndex(q => q.userId === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'No active queue ticket found for user.' });
  }

  const [removed] = queue.splice(index, 1);
  const service = services.find(s => s.id === removed.serviceId);

  history.unshift({
    ticket: removed.ticket,
    userId,
    service: service ? service.name : 'Unknown Service',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    status: 'Cancelled'
  });

  return res.status(200).json({ message: 'Successfully removed from queue.' });
});

app.post('/api/queue/delay', (req, res) => {
  const { userId, additionalMinutes } = req.body;
  const index = queue.findIndex(q => q.userId === userId);

  if (index === -1) {
    return res.status(404).json({ error: 'Active ticket not found.' });
  }

  if (index < queue.length - 1) {
    const temp = queue[index];
    queue[index] = queue[index + 1];
    queue[index + 1] = temp;
  }

  const newIndex = queue.findIndex(q => q.userId === userId);
  const service = services.find(s => s.id === queue[newIndex].serviceId);
  const calculatedWait = (newIndex + 1) * (service ? service.durationMinutes : 3) + (additionalMinutes || 5);

  return res.status(200).json({
    message: 'Spot delayed',
    position: newIndex + 1,
    estimatedWaitMinutes: calculatedWait
  });
});

app.get('/api/history/:userId', (req, res) => {
  const { userId } = req.params;
  const userHistory = history.filter(h => h.userId === userId);
  return res.status(200).json(userHistory);
});

app.get('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  const userNotifs = notifications.filter(n => n.userId === userId);
  return res.status(200).json(userNotifs);
});

app.delete('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  notifications = notifications.filter(n => n.userId !== userId);
  return res.status(200).json({ message: 'Notifications cleared' });
});

app.resetState = () => {
  queue = [
    { ticket: 'R-13', userId: 'u99', serviceId: 's1', joinedAt: new Date(Date.now() - 600000), priority: 1 },
    { ticket: 'R-14', userId: 'u1', serviceId: 's1', joinedAt: new Date(), priority: 1 }
  ];
  notifications = [
    { id: 1, userId: 'u1', title: 'Almost Your Turn', text: 'You are #2 in line. Please head to the counter area.', timestamp: new Date() }
  ];
};
app._resetState = app.resetState;

if (require.main === module && process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`QueueSmart API running on port ${PORT}`));
}

module.exports = app;
