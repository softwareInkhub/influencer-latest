// Test script to test the correct BRMH URL
const testUrl = 'https://brmh.in';

async function testBRMHConnection() {
  console.log(`🔍 Testing BRMH URL: ${testUrl}`);
  
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const testResponse = await fetch(`${testUrl}/test`);
    console.log(`✅ Test endpoint: ${testResponse.status} ${testResponse.statusText}`);
    
    // Test CRUD endpoint for influencers table
    console.log('\n2. Testing CRUD endpoint for brmh-influencers table...');
    const crudResponse = await fetch(`${testUrl}/crud?tableName=brmh-influencers&pagination=true&itemPerPage=10`);
    console.log(`✅ CRUD endpoint: ${crudResponse.status} ${crudResponse.statusText}`);
    
    if (crudResponse.ok) {
      const data = await crudResponse.json();
      console.log(`✅ Found ${data.items?.length || 0} influencers in brmh-influencers table`);
      
      if (data.items && data.items.length > 0) {
        console.log('\n📋 Sample influencer data:');
        console.log(JSON.stringify(data.items[0], null, 2));
      }
      
      return true;
    } else {
      const errorText = await crudResponse.text();
      console.log(`❌ CRUD endpoint failed: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
  }
  
  return false;
}

async function main() {
  console.log('🔍 Testing BRMH connection with correct URL...');
  
  const success = await testBRMHConnection();
  
  if (success) {
    console.log('\n🎉 BRMH connection successful!');
    console.log('✅ Your application should now fetch real data from brmh-influencers table');
  } else {
    console.log('\n❌ BRMH connection failed');
    console.log('Please check your BRMH instance and table configuration');
  }
}

main();
