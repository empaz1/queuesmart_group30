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
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        preferences TEXT DEFAULT '{"emailAlerts":true,"smsAlerts":false}',
        FOREIGN KEY (userId) REFERENCES UserCredentials(userId)
      );
  
      CREATE TABLE IF NOT EXISTS NotificationHistory (
        notificationId INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'sent',
        FOREIGN KEY (userId) REFERENCES UserCredentials(userId)
      );
  `);
}

initDb();

module.exports = { db, initDb };
