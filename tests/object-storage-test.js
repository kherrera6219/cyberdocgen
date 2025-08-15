// Object Storage Integration Test Suite
import { Client } from '@replit/object-storage';

async function testObjectStorageIntegration() {
  console.log('🧪 Testing Object Storage Integration...\n');
  
  try {
    const client = new Client();
    
    // Test 1: Basic connectivity
    console.log('1. Testing basic connectivity...');
    const testContent = JSON.stringify({ 
      test: true, 
      timestamp: new Date().toISOString(),
      message: "Object storage test file"
    });
    
    const uploadResult = await client.uploadFromText('test/connectivity-test.json', testContent);
    console.log('   ✓ Upload test:', uploadResult.ok ? 'PASSED' : 'FAILED');
    
    // Test 2: List objects
    console.log('2. Testing list functionality...');
    const listResult = await client.list();
    console.log('   ✓ List test:', listResult.ok ? 'PASSED' : 'FAILED');
    if (listResult.ok) {
      console.log(`   → Found ${listResult.value.length} objects in bucket`);
    }
    
    // Test 3: Download
    console.log('3. Testing download functionality...');
    const downloadResult = await client.downloadAsText('test/connectivity-test.json');
    console.log('   ✓ Download test:', downloadResult.ok ? 'PASSED' : 'FAILED');
    
    // Test 4: Cleanup
    console.log('4. Testing delete functionality...');
    const deleteResult = await client.delete('test/connectivity-test.json');
    console.log('   ✓ Delete test:', deleteResult.ok ? 'PASSED' : 'FAILED');
    
    console.log('\n🎉 Object Storage Integration Tests Complete!');
    console.log(`Bucket ID: ${process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || 'Not configured'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testObjectStorageIntegration();
}

export { testObjectStorageIntegration };