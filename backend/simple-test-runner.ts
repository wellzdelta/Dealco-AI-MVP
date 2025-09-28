import { createSimpleTestApp } from './simple-test-app';
import { Logger } from '@nestjs/common';

async function runSimpleTests() {
  const logger = new Logger('SimpleTestRunner');
  
  try {
    logger.log('Starting simple test backend...');
    
    // Create test app
    const app = await createSimpleTestApp();
    
    // Wait a moment for the app to fully start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test basic endpoints
    const testResults = await runBasicTests();
    
    logger.log('Test Results:', testResults);
    
    // Keep the app running for manual testing
    logger.log('Simple test backend is ready for manual testing');
    logger.log('Press Ctrl+C to stop');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      logger.log('Shutting down simple test backend...');
      await app.close();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start simple test backend:', error);
    process.exit(1);
  }
}

async function runBasicTests() {
  const results = {
    health: false,
    docs: false,
    auth: false,
    products: false,
    scans: false,
    prices: false,
    imageRecognition: false,
    errors: [] as string[],
  };
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/api/v1/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      results.health = true;
      console.log('✅ Health endpoint working:', healthData.status);
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
    // Test auth login endpoint
    const authResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    if (authResponse.ok) {
      const authData = await authResponse.json();
      results.auth = true;
      console.log('✅ Auth login working:', authData.data.user.email);
    } else {
      results.errors.push('Auth login failed');
    }
  } catch (error) {
    results.errors.push(`Auth test failed: ${error.message}`);
  }
  
  try {
    // Test products endpoint
    const productsResponse = await fetch('http://localhost:3001/api/v1/products');
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      results.products = true;
      console.log('✅ Products endpoint working:', productsData.data.products.length, 'products');
    } else {
      results.errors.push('Products endpoint failed');
    }
  } catch (error) {
    results.errors.push(`Products test failed: ${error.message}`);
  }
  
  try {
    // Test scans endpoint
    const scansResponse = await fetch('http://localhost:3001/api/v1/scans');
    if (scansResponse.ok) {
      const scansData = await scansResponse.json();
      results.scans = true;
      console.log('✅ Scans endpoint working:', scansData.data.scans.length, 'scans');
    } else {
      results.errors.push('Scans endpoint failed');
    }
  } catch (error) {
    results.errors.push(`Scans test failed: ${error.message}`);
  }
  
  try {
    // Test prices endpoint
    const pricesResponse = await fetch('http://localhost:3001/api/v1/prices/product/product-1');
    if (pricesResponse.ok) {
      const pricesData = await pricesResponse.json();
      results.prices = true;
      console.log('✅ Prices endpoint working:', pricesData.data.prices.length, 'prices');
    } else {
      results.errors.push('Prices endpoint failed');
    }
  } catch (error) {
    results.errors.push(`Prices test failed: ${error.message}`);
  }
  
  try {
    // Test image recognition endpoint
    const imageResponse = await fetch('http://localhost:3001/api/v1/image-recognition/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: 'https://example.com/test-image.jpg',
      }),
    });
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      results.imageRecognition = true;
      console.log('✅ Image recognition working:', imageData.data.bestMatch.productName);
    } else {
      results.errors.push('Image recognition endpoint failed');
    }
  } catch (error) {
    results.errors.push(`Image recognition test failed: ${error.message}`);
  }
  
  return results;
}

// Run the tests
runSimpleTests().catch(console.error);