/**
 * Simple test to start the server and check if it's working
 */

console.log('Starting server test...');

// Load environment variables
require('dotenv').config();

console.log('Environment loaded');
console.log('IQR_API_KEY:', process.env.IQR_API_KEY ? 'SET' : 'NOT SET');
console.log('SHIPSTATION_API_KEY:', process.env.SHIPSTATION_API_KEY ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT || '3000');

// Try to start the server
try {
  const app = require('./dist/index.js');
  console.log('Server module loaded successfully');
} catch (error) {
  console.error('Error loading server:', error.message);
  console.error(error.stack);
  process.exit(1);
}

