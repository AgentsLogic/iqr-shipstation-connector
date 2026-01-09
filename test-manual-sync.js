/**
 * Manual Sync Test
 * Triggers a manual order sync and displays the results
 */

console.log('='.repeat(60));
console.log('Manual Order Sync Test');
console.log('='.repeat(60));
console.log('');
console.log('Triggering manual sync...');
console.log('Endpoint: POST http://localhost:3001/api/sync/orders');
console.log('');

fetch('http://localhost:3001/api/sync/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(async (response) => {
    console.log('='.repeat(60));
    console.log('RESPONSE RECEIVED');
    console.log('='.repeat(60));
    console.log('');
    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('');

    const responseText = await response.text();
    console.log('Response Body:');
    console.log(responseText);
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCESS! Sync completed successfully!');
      try {
        const data = JSON.parse(responseText);
        console.log('');
        console.log('Sync Results:');
        console.log('  - Status:', data.status);
        console.log('  - Message:', data.message);
        if (data.stats) {
          console.log('  - Orders Fetched:', data.stats.ordersFetched);
          console.log('  - Orders Created:', data.stats.ordersCreated);
          console.log('  - Orders Skipped:', data.stats.ordersSkipped);
          console.log('  - Errors:', data.stats.errors);
        }
      } catch (e) {
        console.log('⚠️  Could not parse response as JSON');
      }
    } else {
      console.log('❌ FAILED! Sync did not complete successfully.');
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
    console.log('');
    console.log('Make sure the server is running on port 3001');
    console.log('Run: node dist/index.js');
    console.log('');
    console.log('='.repeat(60));
  });

