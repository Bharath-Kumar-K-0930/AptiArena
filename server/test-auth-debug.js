const http = require('http');

function makeRequest(path, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, res => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                resolve({ status: res.statusCode, body });
            });
        });

        req.on('error', error => reject(error));
        req.write(data);
        req.end();
    });
}

async function run() {
    const user = {
        username: 'debug_test_user',
        email: 'debug_test_' + Date.now() + '@example.com',
        password: 'password123'
    };

    console.log(`Attempting Register with ${user.email}...`);
    try {
        const regRes = await makeRequest('/register', user);
        console.log('Register Status:', regRes.status);
        console.log('Register Body:', regRes.body);

        if (regRes.status === 201 || regRes.status === 400) {
            console.log('Attempting Login...');
            const loginRes = await makeRequest('/login', { email: user.email, password: user.password });
            console.log('Login Status:', loginRes.status);
            console.log('Login Body:', loginRes.body);
        }
    } catch (e) {
        console.error('Request failed:', e.message);
    }
}

run();
