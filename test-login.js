const http = require('http');

const loginData = JSON.stringify({
    username: "admin",
    password: "admin123"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Login Response:', data);
        const response = JSON.parse(data);
        if (response.success) {
            console.log('✓ Login SUCCESSFUL!');
            console.log('Token:', response.token);
        } else {
            console.log('✗ Login FAILED');
            console.log('Message:', response.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    console.log('Make sure your server is running: node server.js');
});

req.write(loginData);
req.end();
