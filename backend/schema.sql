-- Stores login information
CREATE TABLE IF NOT EXISTS UserCredentials (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE CHECK (length(email) BETWEEN 1 AND 255), 
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('User', 'Administrator'))
);

-- Stores user information
CREATE TABLE IF NOT EXISTS UserProfile (
    user_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 100),
    email TEXT NOT NULL CHECK (length(email) BETWEEN 1 AND 255),
    phone TEXT CHECK (length(phone) <= 20),
    FOREIGN KEY (user_id) REFERENCES UserCredentials(user_id)
);

-- Stores available services
CREATE TABLE IF NOT EXISTS Service (
    service_id INTEGER PRIMARY KEY,
    service_name TEXT NOT NULL CHECK (length(service_name) BETWEEN 1 AND 100),
    description TEXT CHECK (length(description) <= 500),
    expected_duration INTEGER NOT NULL CHECK (expected_duration > 0),
    priority_level INTEGER NOT NULL DEFAULT 0 CHECK (priority_level >= 0)
);

-- Stores queues for each service
CREATE TABLE IF NOT EXISTS Queue (
    queue_id INTEGER PRIMARY KEY,
    service_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closed')),
    created_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES Service(service_id)
);

-- Stores users joining and leaving queues
CREATE TABLE IF NOT EXISTS QueueEntry (
    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position > 0),
    join_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'served', 'canceled')),
    FOREIGN KEY (queue_id) REFERENCES Queue(queue_id),
    FOREIGN KEY (user_id) REFERENCES UserCredentials(user_id)
); 

-- Stores notifications and activity history
CREATE TABLE IF NOT EXISTS NotificationHistory (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 500),
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'sent'
        CHECK (status IN ('sent', 'viewed')),
    FOREIGN KEY (user_id) REFERENCES UserCredentials(user_id) 
);

