/**
 * Quick test script to verify IQR API authentication
 * Run with: node test-iqr-auth.js
 */

const https = require('https');

const API_KEY = '5R7QxIfaQt7iB4Qz0t+T0qdupWIubmIEnIKlpqTSPdT2cWtP2FC7bLeDZZsmnrxBzHX8EMGq/xVEsh9N/26Vow==';
const AUTH_URL = 'signin.iqreseller.com';

console.log('Testing IQR API Authentication...\n');

const postData = JSON.stringify({
  APIToken: API_KEY
});

const options = {
  hostname: AUTH_URL,
  port: 443,
  path: '/api/IntegrationAPI/Session',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
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
      
      if (parsed.Data) {
        console.log('\n✅ SUCCESS! Session Token:', parsed.Data.substring(0, 50) + '...');
      } else {
        console.log('\n❌ FAILED - No session token in response');
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

req.write(postData);
req.end();

