#!/usr/bin/env node

/**
 * Test script for the updated profile endpoints
 * Tests /api/user/profile and /api/auth/me
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test credentials
const TEST_USER = {
  email: 'admin@yopmail.com',
  password: 'Admin123!'
};

let jwtToken = '';

async function testLogin() {
  console.log('\n🔐 Step 1: Logging in to get JWT token...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/mobile/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Login failed:', data.message || data.error);
      process.exit(1);
    }

    jwtToken = data.token;
    console.log('✅ Login successful!');
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    return data.user;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    process.exit(1);
  }
}

async function testUserProfile() {
  console.log('\n👤 Step 2: Testing GET /api/user/profile...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API call failed:', data.message);
      return false;
    }

    console.log('✅ API call successful!');
    console.log('\n📊 User Profile Data:');
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Username: ${data.user.username}`);
    console.log(`   Name: ${data.user.firstName} ${data.user.lastName}`);
    console.log(`   Role: ${data.user.role}`);
    console.log(`   Avatar: ${data.user.avatar || 'Not set'}`);
    console.log(`   Phone: ${data.user.phoneNumber || 'Not set'}`);
    console.log('\n🎮 Game Statistics:');
    console.log(`   Games Played: ${data.user.gamesPlayed}`);
    console.log(`   Games Won: ${data.user.gamesWon}`);
    console.log(`   Total Kills: ${data.user.totalKills}`);
    console.log('\n💰 Purchase Data:');
    console.log(`   Allowed Games: ${data.user.allowedGames}`);
    console.log(`   Max Members: ${data.user.maxMembers}`);
    console.log(`   Purchased Characters Count: ${data.user.purchasedCharactersCount}`);
    
    // Check if purchasedCharacters array is present
    if (data.user.purchasedCharacters) {
      console.log(`   Purchased Characters Array: ${data.user.purchasedCharacters.length} characters`);
      if (data.user.purchasedCharacters.length > 0) {
        console.log(`\n📋 Sample Character Data:`);
        const sample = data.user.purchasedCharacters[0];
        console.log(`   - ID: ${sample.id}`);
        console.log(`   - Name: ${sample.name}`);
        console.log(`   - Image URL: ${sample.imageUrl}`);
      }
    } else {
      console.log('   ⚠️  purchasedCharacters array not present');
    }
    
    // Verify required fields are present
    const requiredFields = ['allowedGames', 'maxMembers', 'purchasedCharacters', 'purchasedCharactersCount'];
    const missingFields = requiredFields.filter(field => data.user[field] === undefined);
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
      return false;
    } else {
      console.log('✅ All required purchase fields present');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error fetching profile:', error.message);
    return false;
  }
}

async function testAuthMe() {
  console.log('\n🔐 Step 3: Testing GET /api/auth/me...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API call failed:', data.error || data.message);
      return false;
    }

    console.log('✅ API call successful!');
    console.log('\n📊 Auth Me Response:');
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Username: ${data.user.username}`);
    console.log(`   Name: ${data.user.firstName} ${data.user.lastName}`);
    console.log(`   Role: ${data.user.role}`);
    console.log(`   Status: ${data.user.status}`);
    console.log('\n🎮 Game Statistics:');
    console.log(`   Games Played: ${data.user.gamesPlayed}`);
    console.log(`   Games Won: ${data.user.gamesWon}`);
    console.log(`   Total Kills: ${data.user.totalKills}`);
    console.log('\n💰 Purchase Data:');
    console.log(`   Allowed Games: ${data.user.allowedGames}`);
    console.log(`   Max Members: ${data.user.maxMembers}`);
    console.log(`   Purchased Characters Count: ${data.user.purchasedCharactersCount}`);
    
    // Check if purchasedCharacters array is present
    if (data.user.purchasedCharacters) {
      console.log(`   Purchased Characters Array: ${data.user.purchasedCharacters.length} characters`);
      if (data.user.purchasedCharacters.length > 0) {
        console.log(`\n📋 Sample Character Data:`);
        const sample = data.user.purchasedCharacters[0];
        console.log(`   - ID: ${sample.id}`);
        console.log(`   - Name: ${sample.name}`);
        console.log(`   - Image URL: ${sample.imageUrl}`);
      }
    } else {
      console.log('   ⚠️  purchasedCharacters array not present');
    }
    
    // Verify required fields are present
    const requiredFields = ['allowedGames', 'maxMembers', 'purchasedCharacters', 'purchasedCharactersCount'];
    const missingFields = requiredFields.filter(field => data.user[field] === undefined);
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
      return false;
    } else {
      console.log('✅ All required purchase fields present');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error fetching auth/me:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Profile Endpoints Tests');
  console.log('='.repeat(70));
  
  try {
    // Login
    const user = await testLogin();
    
    // Run tests
    await testUserProfile();
    await testAuthMe();
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ All tests completed!');
    console.log('\n📝 Updated Endpoints:');
    console.log('   GET /api/user/profile - Now includes:');
    console.log('     - allowedGames');
    console.log('     - maxMembers');
    console.log('     - purchasedCharacters (full character data array)');
    console.log('     - purchasedCharactersCount');
    console.log('');
    console.log('   GET /api/auth/me - Now includes:');
    console.log('     - allowedGames');
    console.log('     - maxMembers');
    console.log('     - purchasedCharacters (full character data array)');
    console.log('     - purchasedCharactersCount');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests();

