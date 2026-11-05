const fs = require('fs');
const path = require('path');
const db = require('./db');

const schema = fs.readFileSync(
    path.join(__dirname, 'schema.sql'),
    'utf8'
);

db.exec(schema, (err) => {
    if (err) {
        console.log('Error creating tables:', err.message);
    } else {
        console.log('Database tables created successfully!');
    }

    db.close();
});

