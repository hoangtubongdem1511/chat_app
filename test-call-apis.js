// Test script for Call APIs
// Run with: node test-call-apis.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data
const testData = {
  conversationId: '686e433f33fae876b16f4274', // Use real conversation ID from logs
  type: 'VIDEO'
};

async function testCallAPIs() {
  console.log('🧪 Testing Call APIs...\n');
  
  try {
    // Test 1: Create Call
    console.log('1. Testing Create Call API...');
    const createResponse = await axios.post(`${BASE_URL}/api/calls`, testData);
    console.log('✅ Create Call Success:', createResponse.data.id);
    
    const callId = createResponse.data.id;
    
    // Test 2: Get Call Details
    console.log('\n2. Testing Get Call Details API...');
    const getResponse = await axios.get(`${BASE_URL}/api/calls/${callId}`);
    console.log('✅ Get Call Details Success:', getResponse.data.status);
    
    // Test 3: Accept Call
    console.log('\n3. Testing Accept Call API...');
    const acceptResponse = await axios.post(`${BASE_URL}/api/calls/${callId}/accept`);
    console.log('✅ Accept Call Success:', acceptResponse.data.status);
    
    // Test 4: End Call
    console.log('\n4. Testing End Call API...');
    const endResponse = await axios.post(`${BASE_URL}/api/calls/${callId}/end`);
    console.log('✅ End Call Success:', endResponse.data.status);
    
    // Test 5: Get Call History
    console.log('\n5. Testing Get Call History API...');
    const historyResponse = await axios.get(`${BASE_URL}/api/calls?conversationId=${testData.conversationId}`);
    console.log('✅ Get Call History Success:', historyResponse.data.length, 'calls found');
    
    console.log('\n🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.response?.data || error.message);
  }
}

// Test LiveKit Token API
async function testLiveKitToken() {
  console.log('\n🔑 Testing LiveKit Token API...');
  
  try {
    const tokenResponse = await axios.post(`${BASE_URL}/api/livekit/token`, {
      roomName: 'test-room-123'
    });
    
    console.log('✅ LiveKit Token Success:', {
      hasToken: !!tokenResponse.data.token,
      roomName: tokenResponse.data.roomName,
      identity: tokenResponse.data.identity
    });
    
  } catch (error) {
    console.error('❌ LiveKit Token Test Failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Call API Tests...\n');
  
  await testLiveKitToken();
  await testCallAPIs();
  
  console.log('\n✨ Test suite completed!');
}

runTests();
