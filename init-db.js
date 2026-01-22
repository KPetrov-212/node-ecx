const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to database file
const dbPath = path.join(__dirname, 'cars.db');

// Create and initialize the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err);
        return;
    }
    console.log('Connected to SQLite database at:', dbPath);
});

// Create tables
db.serialize(() => {
    // Cars table
    db.run(`
        CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER,
            color TEXT
        )
    `, (err) => {
        if (err) console.error('Error creating cars table:', err);
        else console.log('✓ Cars table created/verified');
    });

    // Administrators table
    db.run(`
        CREATE TABLE IF NOT EXISTS administrators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            salt TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating administrators table:', err);
        else console.log('✓ Administrators table created/verified');
    });

    // Sessions table
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            login_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating sessions table:', err);
        else console.log('✓ Sessions table created/verified');
    });

    // Insert sample admin users
    db.run(`
        INSERT OR IGNORE INTO administrators (username, salt, password_hash)
        VALUES ('admin', 'salt123', 'admin1234')
    `, (err) => {
        if (err) console.error('Error inserting admin:', err);
        else console.log('✓ Admin user verified');
    });

    // Insert sample cars
    db.run(`
        INSERT OR IGNORE INTO cars (brand, model, year, color)
        VALUES 
        ('Toyota', 'Camry', 2022, 'Silver'),
        ('Honda', 'Civic', 2023, 'Blue'),
        ('Ford', 'Mustang', 2023, 'Red')
    `, (err) => {
        if (err) console.error('Error inserting sample cars:', err);
        else console.log('✓ Sample cars inserted');
    });
});

// Close database
setTimeout(() => {
    db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('\n✓ Database initialization complete!');
    });
}, 1000);
