import { createTestApp } from './test-app';
import { Logger } from '@nestjs/common';

async function runTests() {
  const logger = new Logger('TestRunner');
  
  try {
    logger.log('Starting test backend...');
    
    // Create test app
    const app = await createTestApp();
    
    // Wait a moment for the app to fully start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test basic endpoints
    const testResults = await runBasicTests();
    
    logger.log('Test Results:', testResults);
    
    // Keep the app running for manual testing
    logger.log('Test backend is ready for manual testing');
    logger.log('Press Ctrl+C to stop');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      logger.log('Shutting down test backend...');
      await app.close();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start test backend:', error);
    process.exit(1);
  }
}

async function runBasicTests() {
  const results = {
    health: false,
    docs: false,
    auth: false,
    products: false,
    errors: [] as string[],
  };
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/api/v1/health');
    if (healthResponse.ok) {
      results.health = true;
      console.log('✅ Health endpoint working');
    } else {
      results.errors.push('Health endpoint failed');
    }
  } catch (error) {
    results.errors.push(`Health test failed: ${error.message}`);
  }
  
  try {
    // Test docs endpoint
    const docsResponse = await fetch('http://localhost:3001/api/v1/docs');
    if (docsResponse.ok) {
      results.docs = true;
      console.log('✅ API docs accessible');
    } else {
      results.errors.push('Docs endpoint failed');
    }
  } catch (error) {
    results.errors.push(`Docs test failed: ${error.message}`);
  }
  
  try {
    // Test auth endpoint (should return 401 without token)
    const authResponse = await fetch('http://localhost:3001/api/v1/auth/profile');
    if (authResponse.status === 401) {
      results.auth = true;
      console.log('✅ Auth endpoint properly secured');
    } else {
      results.errors.push('Auth endpoint not properly secured');
    }
  } catch (error) {
    results.errors.push(`Auth test failed: ${error.message}`);
  }
  
  try {
    // Test products endpoint (should return 401 without token)
    const productsResponse = await fetch('http://localhost:3001/api/v1/products');
    if (productsResponse.status === 401) {
      results.products = true;
      console.log('✅ Products endpoint properly secured');
    } else {
      results.errors.push('Products endpoint not properly secured');
    }
  } catch (error) {
    results.errors.push(`Products test failed: ${error.message}`);
  }
  
  return results;
}

// Run the tests
runTests().catch(console.error);