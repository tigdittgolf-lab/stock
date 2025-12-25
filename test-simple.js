const http = require('http');

const postData = JSON.stringify({
  type: 'mysql',
  host: 'localhost',
  port: 3307,
  database: 'stock_management',
  username: 'root',
  password: ''
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/database-config',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant': '2025_bu01',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();