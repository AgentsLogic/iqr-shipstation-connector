/**
 * Simple IQR Authentication Test
 * Tests the IQR API authentication with detailed logging
 */

const API_KEY = '9ccQ4jB4d24KhWhOtcpeR/y3FmFBp/Asq1664VjnKUV/jp/Nvyj+6rf21xysTjoeXDB9aSuxlpZ5L5OxXAUkPw==';
const AUTH_URL = 'https://signin.iqreseller.com/api/IntegrationAPI/Session';

console.log('='.repeat(60));
console.log('IQR API Authentication Test');
console.log('='.repeat(60));
console.log('');
console.log('API Key:', API_KEY.substring(0, 30) + '...');
console.log('Auth URL:', AUTH_URL);
console.log('');
console.log('Sending POST request...');
console.log('');

const requestBody = { APIToken: API_KEY };
const requestHeaders = {
  'Content-Type': 'application/json',
  'Content-Encoding': 'UTF8',
  'Accept': 'application/json',
};

console.log('Request Headers:', JSON.stringify(requestHeaders, null, 2));
console.log('Request Body:', JSON.stringify(requestBody, null, 2));
console.log('');

fetch(AUTH_URL, {
  method: 'POST',
  headers: requestHeaders,
  body: JSON.stringify(requestBody),
})
  .then(async (response) => {
    console.log('='.repeat(60));
    console.log('RESPONSE RECEIVED');
    console.log('='.repeat(60));
    console.log('');
    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('');
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');

    const responseText = await response.text();
    console.log('Response Body:', responseText || '(empty)');
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCESS! Authentication worked!');
      try {
        const data = JSON.parse(responseText);
        console.log('Session Token:', data.Data);
      } catch (e) {
        console.log('⚠️  Could not parse response as JSON');
      }
    } else {
      console.log('❌ FAILED! Authentication did not work.');
      console.log('');
      console.log('Possible reasons:');
      console.log('  1. API key is not activated yet');
      console.log('  2. API key is incorrect or expired');
      console.log('  3. IP address is restricted');
      console.log('  4. API endpoint has changed');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Test this API key in Postman');
      console.log('  2. Contact Robb to verify the API key is active');
      console.log('  3. Check if there are any IP restrictions');
    }
    console.log('');
    console.log('='.repeat(60));
  })
  .catch((error) => {
    console.log('');
    console.log('='.repeat(60));
    console.log('ERROR');
    console.log('='.repeat(60));
    console.log('');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    console.log('');
    console.log('This usually means:');
    console.log('  - Network connectivity issue');
    console.log('  - DNS resolution problem');
    console.log('  - Firewall blocking the request');
    console.log('');
    console.log('='.repeat(60));
  });

