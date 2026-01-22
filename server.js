// Import Express, crypto, and SQLite
const express = require('express');
const { createHash, randomBytes } = require('node:crypto');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// 1. Create SQLite database connection
const db = new sqlite3.Database('./cars.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// 2. Initialize database tables
function initializeDatabase() {
    // Create cars table
    db.run(`
        CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER,
            color TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Error creating cars table:', err.message);
        } else {
            console.log('Cars table ready');
            // Add some initial data if table is empty
            db.get('SELECT COUNT(*) as count FROM cars', (err, row) => {
                if (row.count === 0) {
                    const insertCar = db.prepare('INSERT INTO cars (brand, model, year, color) VALUES (?, ?, ?, ?)');
                    insertCar.run('Toyota', 'Camry', 2022, 'Silver');
                    insertCar.run('Honda', 'Civic', 2023, 'Blue');
                    insertCar.run('Ford', 'Mustang', 2021, 'Red');
                    insertCar.finalize();
                    console.log('Initial cars data added');
                }
            });
        }
    });

    // Create administrators table
    db.run(`
        CREATE TABLE IF NOT EXISTS administrators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            salt TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating administrators table:', err.message);
        } else {
            console.log('Administrators table ready');
            // Add initial admin if table is empty
            db.get('SELECT COUNT(*) as count FROM administrators', (err, row) => {
                if (row.count === 0) {
                    const salt1 = 'salt123';
                    const salt2 = 'salt456';
                    const hash1 = hashPassword('admin123', salt1);
                    const hash2 = hashPassword('super123', salt2);
                    
                    const insertAdmin = db.prepare('INSERT INTO administrators (username, salt, password_hash) VALUES (?, ?, ?)');
                    insertAdmin.run('admin', salt1, hash1);
                    insertAdmin.run('superadmin', salt2, hash2);
                    insertAdmin.finalize();
                    console.log('Initial admin accounts created');
                }
            });
        }
    });

    // Create sessions table
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            login_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating sessions table:', err.message);
        } else {
            console.log('Sessions table ready');
        }
    });
}

// Helper function to hash password with salt
function hashPassword(password, salt) {
    return createHash('sha256').update(password + salt).digest('hex');
}

// Authentication middleware
function isAuthenticated(req, res, next) {
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please login first."
        });
    }
    
    // 3. Check token in database
    db.get('SELECT username FROM sessions WHERE token = ?', [token], (err, session) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }
        
        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token. Please login again."
            });
        }
        
        req.user = session.username;
        next();
    });
}

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: "Welcome to the Cars API with SQLite Database" });
});

// LOGIN endpoint - Check admin credentials from database
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required"
        });
    }
    
    // 3. Find admin in database
    db.get('SELECT username, salt, password_hash FROM administrators WHERE username = ?', [username], (err, admin) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }
        
        // Hash the provided password with the admin's salt and compare
        const hashedPassword = hashPassword(password, admin.salt);
        
        if (hashedPassword !== admin.password_hash) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }
        
        // Generate token using session secret from .env
        const sessionSecret = process.env.SESSION_SECRET || 'fallback-secret';
        const token = createHash('sha256')
            .update(`${username}_${Date.now()}_${sessionSecret}`)
            .digest('hex');
        
        // 3. Store session in database
        db.run('INSERT INTO sessions (username, token) VALUES (?, ?)', [username, token], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Error creating session"
                });
            }
            
            res.json({
                success: true,
                message: "Login successful",
                token: token,
                username: username
            });
        });
    });
});

// LOGOUT endpoint
app.post('/api/logout', (req, res) => {
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(400).json({
            success: false,
            message: "No token provided"
        });
    }
    
    // 3. Remove session from database
    db.run('DELETE FROM sessions WHERE token = ?', [token], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }
        
        if (this.changes === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid token or already logged out"
            });
        }
        
        res.json({
            success: true,
            message: "Logout successful"
        });
    });
});

// REGISTER endpoint
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required"
        });
    }
    
    // Generate random salt
    const salt = randomBytes(16).toString('hex');
    
    // Hash password with salt
    const passwordHash = hashPassword(password, salt);
    
    // 3. Add new admin to database
    db.run('INSERT INTO administrators (username, salt, password_hash) VALUES (?, ?, ?)', 
        [username, salt, passwordHash], 
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({
                        success: false,
                        message: "Username already exists"
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }
            
            res.status(201).json({
                success: true,
                message: "Registration successful. You can now login.",
                username: username
            });
        }
    );
});

// 3. GET all cars from database
app.get('/api/cars', (req, res) => {
    db.all('SELECT * FROM cars', [], (err, cars) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }
        
        res.json({
            success: true,
            count: cars.length,
            data: cars
        });
    });
});

// 3. GET car by ID from database
app.get('/api/cars/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    db.get('SELECT * FROM cars WHERE id = ?', [id], (err, car) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }
        
        if (!car) {
            return res.status(404).json({
                success: false,
                message: `Car with ID ${id} not found`
            });
        }
        
        res.json({
            success: true,
            data: car
        });
    });
});

// 3. POST - Add new car to database (PROTECTED)
app.post('/api/cars', isAuthenticated, (req, res) => {
    const { brand, model, year, color } = req.body;
    
    // Validate required fields
    if (!brand || !model) {
        return res.status(400).json({
            success: false,
            message: "Brand and model are required"
        });
    }
    
    db.run('INSERT INTO cars (brand, model, year, color) VALUES (?, ?, ?, ?)',
        [brand, model, year, color],
        function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }
            
            // Get the newly created car
            db.get('SELECT * FROM cars WHERE id = ?', [this.lastID], (err, car) => {
                res.status(201).json({
                    success: true,
                    message: "Car added successfully",
                    data: car,
                    addedBy: req.user
                });
            });
        }
    );
});

// 3. DELETE car by ID from database (PROTECTED)
app.delete('/api/cars/:id', isAuthenticated, (req, res) => {
    const id = parseInt(req.params.id);
    
    // First, get the car before deleting
    db.get('SELECT * FROM cars WHERE id = ?', [id], (err, car) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }
        
        if (!car) {
            return res.status(404).json({
                success: false,
                message: `Car with ID ${id} not found`
            });
        }
        
        // Delete the car
        db.run('DELETE FROM cars WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }
            
            res.json({
                success: true,
                message: "Car deleted successfully",
                data: car,
                deletedBy: req.user
            });
        });
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('\nDatabase connection closed');
        }
        process.exit(0);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/cars`);
    console.log(`\nTest admins:`);
    console.log(`  Username: admin, Password: admin123`);
    console.log(`  Username: superadmin, Password: super123`);
    console.log(`\nSession Secret: ${process.env.SESSION_SECRET || 'using fallback'}`);
});


// API Endpoints: (exc-1)
// GET /api/cars - get all cars
// GET /api/cars/:id - get specific car
// POST /api/cars - add new car
// DELETE /api/cars/:id - delete a car

// Authentication Endpoints: (exc-2)
// POST method for adding cars - Already using POST, now with authentication
// Login endpoint - POST /api/login - Returns a token
// Logout endpoint - POST /api/logout - Invalidates the token
// Protected endpoints - Both POST (add car) and DELETE (remove car) now require authentication