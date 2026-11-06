const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' :path.join(__dirname, 'queuesmart.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to QueueSmart SQLite database!');
    }
});
db.run('PRAGMA foreign_keys = ON');

module.exports = db;


