// Import Express and crypto
const express = require('express');
const { createHash, randomBytes } = require('node:crypto');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Sample data array - Cars
let cars = [
    { id: 1, brand: "Toyota", model: "Camry", year: 2022, color: "Silver" },
    { id: 2, brand: "Honda", model: "Civic", year: 2023, color: "Blue" },
    { id: 3, brand: "Ford", model: "Mustang", year: 2021, color: "Red" }
];

// Helper function to hash password with salt
function hashPassword(password, salt) {
    return createHash('sha256').update(password + salt).digest('hex');
}

// 3. Administrators array with hashed passwords and salts
const administrators = [
    { 
        username: "admin", 
        salt: "salt123",
        passwordHash: hashPassword("admin123", "salt123")
    },
    { 
        username: "superadmin", 
        salt: "salt456",
        passwordHash: hashPassword("super123", "salt456")
    }
];

// Store active sessions (logged in users)
let activeSessions = [];

// 4. Authentication middleware
function isAuthenticated(req, res, next) {
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please login first."
        });
    }
    
    // Check if token exists in active sessions
    const session = activeSessions.find(s => s.token === token);
    
    if (!session) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please login again."
        });
    }
    
    // Add user info to request
    req.user = session.username;
    next();
}

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: "Welcome to the Cars API" });
});

// 3. LOGIN endpoint - Check admin credentials with hashed passwords
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required"
        });
    }
    
    // Find admin by username
    const admin = administrators.find(a => a.username === username);
    
    if (!admin) {
        return res.status(401).json({
            success: false,
            message: "Invalid username or password"
        });
    }
    
    // Hash the provided password with the admin's salt and compare
    const hashedPassword = hashPassword(password, admin.salt);
    
    if (hashedPassword !== admin.passwordHash) {
        return res.status(401).json({
            success: false,
            message: "Invalid username or password"
        });
    }
    
    // 2. Generate token using session secret from .env
    const sessionSecret = process.env.SESSION_SECRET || 'fallback-secret';
    const token = createHash('sha256')
        .update(`${username}_${Date.now()}_${sessionSecret}`)
        .digest('hex');
    
    // Store session
    activeSessions.push({
        username: username,
        token: token,
        loginTime: new Date()
    });
    
    res.json({
        success: true,
        message: "Login successful",
        token: token,
        username: username
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
    
    // Remove session
    const sessionIndex = activeSessions.findIndex(s => s.token === token);
    
    if (sessionIndex === -1) {
        return res.status(400).json({
            success: false,
            message: "Invalid token or already logged out"
        });
    }
    
    activeSessions.splice(sessionIndex, 1);
    
    res.json({
        success: true,
        message: "Logout successful"
    });
});

// Optional 1: REGISTER endpoint
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required"
        });
    }
    
    // Check if username already exists
    const existingAdmin = administrators.find(a => a.username === username);
    if (existingAdmin) {
        return res.status(400).json({
            success: false,
            message: "Username already exists"
        });
    }
    
    // Generate random salt
    const salt = randomBytes(16).toString('hex');
    
    // Hash password with salt
    const passwordHash = hashPassword(password, salt);
    
    // Add new admin
    administrators.push({
        username: username,
        salt: salt,
        passwordHash: passwordHash
    });
    
    res.status(201).json({
        success: true,
        message: "Registration successful. You can now login.",
        username: username
    });
});

// GET all cars (public - no authentication needed)
app.get('/api/cars', (req, res) => {
    res.json({
        success: true,
        count: cars.length,
        data: cars
    });
});

// GET car by ID (public - no authentication needed)
app.get('/api/cars/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const car = cars.find(c => c.id === id);
    
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

// 4. POST - Add new car (PROTECTED with isAuthenticated middleware)
app.post('/api/cars', isAuthenticated, (req, res) => {
    const newCar = {
        id: req.body.id || cars.length + 1,
        brand: req.body.brand,
        model: req.body.model,
        year: req.body.year,
        color: req.body.color
    };
    
    // Validate required fields
    if (!newCar.brand || !newCar.model) {
        return res.status(400).json({
            success: false,
            message: "Brand and model are required"
        });
    }
    
    cars.push(newCar);
    
    res.status(201).json({
        success: true,
        message: "Car added successfully",
        data: newCar,
        addedBy: req.user
    });
});

// 4. DELETE car by ID (PROTECTED with isAuthenticated middleware)
app.delete('/api/cars/:id', isAuthenticated, (req, res) => {
    const id = parseInt(req.params.id);
    const carIndex = cars.findIndex(c => c.id === id);
    
    if (carIndex === -1) {
        return res.status(404).json({
            success: false,
            message: `Car with ID ${id} not found`
        });
    }
    
    const deletedCar = cars.splice(carIndex, 1);
    
    res.json({
        success: true,
        message: "Car deleted successfully",
        data: deletedCar[0],
        deletedBy: req.user
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