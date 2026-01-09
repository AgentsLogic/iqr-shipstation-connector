/**
 * Comprehensive Test Suite
 * Runs all integration tests and displays results
 */

const tests = [
  {
    name: 'IQR Authentication',
    file: 'test-iqr-auth-simple.js',
    description: 'Tests IQR API authentication',
  },
  {
    name: 'ShipStation Authentication',
    file: 'test-shipstation-auth.js',
    description: 'Tests ShipStation API authentication',
  },
];

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     IQR-ShipStation Connector - Test Suite               ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

async function runTest(test) {
  console.log('─'.repeat(60));
  console.log(`📋 Test: ${test.name}`);
  console.log(`📝 Description: ${test.description}`);
  console.log(`📄 File: ${test.file}`);
  console.log('─'.repeat(60));
  console.log('');

  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const child = spawn('node', [test.file], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      console.log('');
      if (code === 0) {
        console.log(`✅ ${test.name} - PASSED`);
      } else {
        console.log(`❌ ${test.name} - FAILED (exit code: ${code})`);
      }
      console.log('');
      resolve(code === 0);
    });

    child.on('error', (error) => {
      console.log('');
      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
      console.log('');
      resolve(false);
    });
  });
}

async function runAllTests() {
  const results = [];

  for (const test of tests) {
    const passed = await runTest(test);
    results.push({ test: test.name, passed });
  }

  console.log('═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log('');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    const status = result.passed ? 'PASSED' : 'FAILED';
    console.log(`${icon} ${result.test}: ${status}`);
  });

  console.log('');
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 All tests passed!');
    console.log('');
    console.log('✅ The integration is ready to use!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Start the server: npm start');
    console.log('  2. Test manual sync: node test-manual-sync.js');
    console.log('  3. Monitor logs for any issues');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    console.log('');
    console.log('Common issues:');
    console.log('  - Check API credentials in .env file');
    console.log('  - Verify network connectivity');
    console.log('  - Ensure API keys are activated');
  }

  console.log('');
  console.log('═'.repeat(60));

  process.exit(failed === 0 ? 0 : 1);
}

runAllTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

