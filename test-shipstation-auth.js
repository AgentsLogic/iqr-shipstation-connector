/**
 * Quick test script to verify ShipStation API authentication
 * Run with: node test-shipstation-auth.js
 */

const https = require('https');

const API_KEY = 'e3cc570635294a05ae5dd642b2c4ba23';
const API_SECRET = '6ecc2cb3549943a4bf1f1555009b37ea';
const API_BASE = 'ssapi.shipstation.com';

console.log('Testing ShipStation API Authentication...\n');

// Create Basic Auth header
const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');

const options = {
  hostname: API_BASE,
  port: 443,
  path: '/stores',
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 200) {
        console.log(`\n✅ SUCCESS! Found ${parsed.length} ShipStation stores`);
      } else {
        console.log('\n❌ FAILED - Authentication error');
      }
    } catch (e) {
      console.log(data);
      console.log('\n❌ FAILED - Invalid JSON response');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ ERROR: ${e.message}`);
});

req.end();

