/**
 * Quick Status Checker
 * Checks if the server is running and healthy
 */

const SERVER_URL = 'http://localhost:3001';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     IQR-ShipStation Connector - Status Check             ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

async function checkHealth() {
  console.log('Checking server health...');
  console.log(`URL: ${SERVER_URL}/health`);
  console.log('');

  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Server is HEALTHY');
      console.log('');
      console.log('Status:', data.status);
      console.log('Timestamp:', data.timestamp);
      console.log('');
      return true;
    } else {
      console.log('⚠️  Server responded but not healthy');
      console.log('Status Code:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('');
      return false;
    }
  } catch (error) {
    console.log('❌ Server is NOT RUNNING');
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    console.log('To start the server:');
    console.log('  Windows: start-server.bat');
    console.log('  Linux/Mac: npm start');
    console.log('');
    return false;
  }
}

async function checkDetailedHealth() {
  console.log('Checking detailed health...');
  console.log(`URL: ${SERVER_URL}/health/detailed`);
  console.log('');

  try {
    const response = await fetch(`${SERVER_URL}/health/detailed`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Detailed Health Check');
      console.log('');
      console.log('Overall Status:', data.status);
      console.log('');
      
      if (data.services) {
        console.log('Service Status:');
        Object.entries(data.services).forEach(([service, status]) => {
          const icon = status === 'healthy' ? '✅' : '❌';
          console.log(`  ${icon} ${service}: ${status}`);
        });
      }
      
      console.log('');
      console.log('Uptime:', data.uptime);
      console.log('Timestamp:', data.timestamp);
      console.log('');
      return true;
    } else {
      console.log('⚠️  Could not get detailed health');
      console.log('Status Code:', response.status);
      console.log('');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Could not get detailed health');
    console.log('Error:', error.message);
    console.log('');
    return false;
  }
}

async function main() {
  const healthOk = await checkHealth();
  
  if (healthOk) {
    await checkDetailedHealth();
    
    console.log('═'.repeat(60));
    console.log('');
    console.log('🎉 Server is running and healthy!');
    console.log('');
    console.log('Available endpoints:');
    console.log(`  - ${SERVER_URL}/health`);
    console.log(`  - ${SERVER_URL}/health/detailed`);
    console.log(`  - ${SERVER_URL}/ready`);
    console.log(`  - ${SERVER_URL}/live`);
    console.log(`  - ${SERVER_URL}/api/sync/orders (POST)`);
    console.log(`  - ${SERVER_URL}/webhooks/shipstation (POST)`);
    console.log('');
    console.log('To trigger a manual sync:');
    console.log('  node test-manual-sync.js');
    console.log('');
    console.log('═'.repeat(60));
  } else {
    console.log('═'.repeat(60));
    console.log('');
    console.log('⚠️  Server is not running or not healthy');
    console.log('');
    console.log('Please start the server and try again.');
    console.log('');
    console.log('═'.repeat(60));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

