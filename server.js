// Import Express
const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Sample data array - Books example (you can change this to match your project)
let books = [
    { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925 },
    { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960 },
    { id: 3, title: "Pride and Prejudice", author: "Jane Austen", year: 1813 }
];

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: "Welcome to the Books API" });
});

// 4.1 GET all objects
app.get('/api/books', (req, res) => {
    res.json({
        success: true,
        count: books.length,
        data: books
    });
});

// 4.2 GET object by ID
app.get('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const book = books.find(b => b.id === id);
    
    if (!book) {
        return res.status(404).json({
            success: false,
            message: `Book with ID ${id} not found`
        });
    }
    
    res.json({
        success: true,
        data: book
    });
});

// 4.3 POST - Add new object
app.post('/api/books', (req, res) => {
    const newBook = {
        id: req.body.id || books.length + 1,
        title: req.body.title,
        author: req.body.author,
        year: req.body.year
    };
    
    // Validate required fields
    if (!newBook.title || !newBook.author) {
        return res.status(400).json({
            success: false,
            message: "Title and author are required"
        });
    }
    
    books.push(newBook);
    
    res.status(201).json({
        success: true,
        message: "Book added successfully",
        data: newBook
    });
});

// 4.4 DELETE object by ID
app.delete('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const bookIndex = books.findIndex(b => b.id === id);
    
    if (bookIndex === -1) {
        return res.status(404).json({
            success: false,
            message: `Book with ID ${id} not found`
        });
    }
    
    const deletedBook = books.splice(bookIndex, 1);
    
    res.json({
        success: true,
        message: "Book deleted successfully",
        data: deletedBook[0]
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/books`);
});