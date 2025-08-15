// API Endpoints Testing Suite
// This tests the server endpoints without authentication for basic connectivity

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testApiEndpoints() {
  console.log('🔍 Testing API Endpoints...\n');

  const endpoints = [
    { method: 'GET', path: '/api/storage/stats', description: 'Storage Statistics' },
    { method: 'GET', path: '/api/storage/list', description: 'List All Files' },
    { method: 'GET', path: '/api/storage/list?folder=documents', description: 'List Documents' },
    { method: 'GET', path: '/api/storage/list?folder=profiles', description: 'List Profiles' },
    { method: 'GET', path: '/api/storage/list?folder=backups', description: 'List Backups' },
  ];

  console.log('Testing endpoint availability (will show 401 for protected routes):');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      });
      
      const status = response.status;
      const statusText = status === 401 ? 'Protected (Auth Required)' : 
                        status === 404 ? 'Not Found' : 
                        status === 500 ? 'Server Error' : 
                        status === 200 ? 'OK' : `HTTP ${status}`;
      
      console.log(`   ${endpoint.method} ${endpoint.path}`);
      console.log(`   → ${endpoint.description}: ${statusText}`);
      
    } catch (error) {
      console.log(`   ${endpoint.method} ${endpoint.path}`);
      console.log(`   → ${endpoint.description}: Connection Error`);
    }
    console.log('');
  }

  console.log('📊 Testing frontend accessibility...');
  try {
    const frontendResponse = await fetch(`${BASE_URL}/`);
    console.log(`   Frontend: ${frontendResponse.status === 200 ? 'Accessible' : 'Not Accessible'}`);
  } catch (error) {
    console.log('   Frontend: Connection Error');
  }
}

// Run tests
testApiEndpoints().catch(console.error);