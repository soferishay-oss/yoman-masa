const http = require('http');
const FormData = require('form-data');
const fs = require('fs');

async function runTest() {
  const form = new FormData();
  // We need a dummy audio file. Let's just create a small dummy buffer.
  const dummyAudio = Buffer.from('dummy audio content');
  form.append('audio', dummyAudio, { filename: 'test.webm', contentType: 'audio/webm' });

  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/ai/transcribe',
    method: 'POST',
    headers: {
      ...form.getHeaders(),
      'Cookie': 'auth_token=dummy_token_not_verified_by_this_route_anyway',
      'x-user-id': 'test-user-id'
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Body: ${body}`);
    });
  });

  req.on('error', console.error);
  form.pipe(req);
}

runTest();
