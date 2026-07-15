const { SignJWT } = require('jose');
const http = require('http');

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev');

async function getAdminToken() {
  const token = await new SignJWT({ userId: 'mock-admin-id', tenantId: 'mock-tenant-id', role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(JWT_SECRET);
  return token;
}

function makeRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth_token=' + token,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  try {
    const token = await getAdminToken();
    console.log('--- Testing PUT /api/admin/tenant ---');
    const tenantRes = await makeRequest('/api/admin/tenant', 'PUT', { name: 'Test School', dateMode: 'hebrew' }, token);
    console.log(`Status: ${tenantRes.status}`);
    console.log(`Body: ${tenantRes.body}`);

    console.log('\n--- Testing POST /api/admin/users ---');
    const userRes = await makeRequest('/api/admin/users', 'POST', { fullName: 'Test User', email: 'test@example.com', userRole: 'student' }, token);
    console.log(`Status: ${userRes.status}`);
    console.log(`Body: ${userRes.body}`);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
