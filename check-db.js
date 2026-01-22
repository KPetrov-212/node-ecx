const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'cars.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT username, salt, password_hash FROM administrators', (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Current administrators in database:');
        console.table(rows);
    }
    db.close();
});
