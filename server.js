// Import Express
const express = require('express');
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

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: "Welcome to the Cars API" });
});

// 4.1 GET all objects
app.get('/api/cars', (req, res) => {
    res.json({
        success: true,
        count: cars.length,
        data: cars
    });
});

// 4.2 GET object by ID
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

// 4.3 POST - Add new object
app.post('/api/cars', (req, res) => {
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
        data: newCar
    });
});

// 4.4 DELETE object by ID
app.delete('/api/cars/:id', (req, res) => {
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
        data: deletedCar[0]
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/cars`);
});