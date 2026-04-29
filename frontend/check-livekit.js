// Script to check LiveKit credentials
// Run with: node check-livekit.js

console.log('🔍 Checking LiveKit credentials...\n');

const requiredVars = [
  'LIVEKIT_API_KEY',
  'LIVEKIT_API_SECRET', 
  'NEXT_PUBLIC_LIVEKIT_URL'
];

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***configured***' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT CONFIGURED`);
    allConfigured = false;
  }
});

console.log('\n📋 Summary:');
if (allConfigured) {
  console.log('✅ All LiveKit credentials are configured!');
  console.log('🚀 You can now test video calls.');
} else {
  console.log('❌ Some LiveKit credentials are missing.');
  console.log('📖 Please follow the setup guide to configure them.');
}

console.log('\n💡 To configure LiveKit:');
console.log('1. Go to https://cloud.livekit.io/');
console.log('2. Create a project');
console.log('3. Copy API Key, API Secret, and Server URL');
console.log('4. Add them to your .env file');
