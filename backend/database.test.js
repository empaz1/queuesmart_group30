const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

let db;

beforeAll((done) => {
    db = new sqlite3.Database(':memory:');

    const schema = fs.readFileSync(
        path.join(__dirname, 'schema.sql'),
        'utf8'
    );

    db.exec('PRAGMA foreign_keys = ON;' + schema, done);
});

afterAll((done) => {
    db.close(done);
});

test('creates all six tables', (done) => {
    db.all(
        "SELECT name FROM sqlite_master WHERE type = 'table'",
        (err, rows) => {
            expect(err).toBeNull();

            const names = rows.map(row => row.name);

            expect(names).toContain('UserCredentials');
            expect(names).toContain('UserProfile');
            expect(names).toContain('Service');
            expect(names).toContain('Queue');
            expect(names).toContain('QueueEntry');
            expect(names).toContain('NotificationHistory');

            done();
        }
    );
});

test('rejects a service with negative duration', (done) => {
    db.run(
        'INSERT INTO Service (service_name, expected_duration) VALUES (?, ?)',
        ['Test Service', -5],
        (err) => {
            expect(err).not.toBeNull();
            done();
        }
    );
});

test('rejects a queue with an invalid service ID', (done) => {
    db.run(
        'INSERT INTO Queue (service_id) VALUES (?)',
        [99999],
        (err) => {
            expect(err).not.toBeNull();
            done();
        }
    );
});

