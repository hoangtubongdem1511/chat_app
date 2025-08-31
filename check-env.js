// Simple script to check environment variables
console.log('🔍 Checking environment variables...\n');

const vars = [
  'LIVEKIT_API_KEY',
  'LIVEKIT_API_SECRET', 
  'NEXT_PUBLIC_LIVEKIT_URL'
];

vars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***configured***' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT CONFIGURED`);
  }
});

console.log('\n💡 To configure LiveKit:');
console.log('1. Go to https://cloud.livekit.io/');
console.log('2. Create a project');
console.log('3. Copy API Key, API Secret, and Server URL');
console.log('4. Add them to your .env file');
