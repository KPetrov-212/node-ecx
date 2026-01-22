const sqlite3 = require('sqlite3').verbose();
const { createHash } = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, 'cars.db');
const db = new sqlite3.Database(dbPath);

// Hash password function
function hashPassword(password, salt) {
    return createHash('sha256').update(password + salt).digest('hex');
}

// Clear old data and insert correct hashes
db.serialize(() => {
    // Delete old admin data
    db.run('DELETE FROM administrators', (err) => {
        if (err) console.error('Error deleting old data:', err);
        else console.log('✓ Cleared old admin data');
    });

    // Insert admin with correct hash
    const salt1 = 'salt123';
    const hash1 = hashPassword('admin123', salt1);
    
    db.run('INSERT INTO administrators (username, salt, password_hash) VALUES (?, ?, ?)',
        ['admin', salt1, hash1],
        (err) => {
            if (err) console.error('Error inserting admin:', err);
            else console.log('✓ Added admin user (password: admin123)');
        }
    );

    // Insert superadmin with correct hash
    const salt2 = 'salt456';
    const hash2 = hashPassword('super123', salt2);
    
    db.run('INSERT INTO administrators (username, salt, password_hash) VALUES (?, ?, ?)',
        ['superadmin', salt2, hash2],
        (err) => {
            if (err) console.error('Error inserting superadmin:', err);
            else console.log('✓ Added superadmin user (password: super123)');
        }
    );
});

setTimeout(() => {
    db.all('SELECT username, salt, password_hash FROM administrators', (err, rows) => {
        if (err) {
            console.error('Error reading data:', err);
        } else {
            console.log('\n✓ Updated administrator credentials:');
            console.table(rows);
        }
        db.close();
    });
}, 500);
