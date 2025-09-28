const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testEndpoint(method, endpoint, data = null, description = '') {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ ${description || `${method} ${endpoint}`}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
    console.log('');
    return true;
  } catch (error) {
    console.log(`❌ ${description || `${method} ${endpoint}`}`);
    console.log(`   Error: ${error.message}`);
    console.log('');
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Dealco AI Backend Endpoints\n');
  
  const tests = [
    // Health check
    ['GET', '/health', null, 'Health Check'],
    
    // Auth endpoints
    ['POST', '/auth/login', { email: 'test@example.com', password: 'password' }, 'User Login'],
    ['POST', '/auth/register', { email: 'newuser@example.com', password: 'password', firstName: 'New', lastName: 'User' }, 'User Registration'],
    
    // Products endpoints
    ['GET', '/products', null, 'Get Products'],
    ['GET', '/products/search?q=nike&page=1&limit=10', null, 'Search Products'],
    
    // Scans endpoints
    ['POST', '/scans', { imageUrl: 'https://example.com/test.jpg' }, 'Create Scan'],
    ['GET', '/scans', null, 'Get Scans'],
    
    // Prices endpoints
    ['GET', '/prices/product/product-1', null, 'Get Product Prices'],
    
    // Image recognition endpoints
    ['POST', '/image-recognition/recognize', { imageUrl: 'https://example.com/test.jpg' }, 'Image Recognition'],
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [method, endpoint, data, description] of tests) {
    const success = await testEndpoint(method, endpoint, data, description);
    if (success) passed++;
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Backend is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the backend.');
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if backend is running...');
  
  const isRunning = await checkBackend();
  if (!isRunning) {
    console.log('❌ Backend is not running. Please start it first with: node express-test-app.js');
    process.exit(1);
  }
  
  console.log('✅ Backend is running. Starting tests...\n');
  await runTests();
}

main().catch(console.error);