const https = require('https');

https.get('https://yoman-masa.vercel.app/api/debug_roles', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Error parsing JSON:', data);
    }
  });
});
