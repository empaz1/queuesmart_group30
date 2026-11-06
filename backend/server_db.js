const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(__dirname, 'queuesmart.db');

const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS UserCredentials (
      userId TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'User'
    );

    CREATE TABLE IF NOT EXISTS UserProfile (
      userId TEXT PRIMARY KEY,
      fullName TEXT NOT NULL CHECK(length(fullName) >= 2 AND length(fullName) <= 100),
      email TEXT NOT NULL UNIQUE,
      phone TEXT CHECK(length(phone) <= 20),
      preferences TEXT DEFAULT '{"emailAlerts":true,"smsAlerts":false}',
      FOREIGN KEY (userId) REFERENCES UserCredentials(userId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS NotificationHistory (
      notificationId INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      message TEXT NOT NULL CHECK(length(trim(message)) > 0),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('sent', 'viewed')),
      FOREIGN KEY (userId) REFERENCES UserCredentials(userId) ON DELETE CASCADE
    );
  `);
}

initDb();

module.exports = { db, initDb };
