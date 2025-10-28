/**
 * Test script for the /api/user/update endpoint
 * Tests different scenarios of user updates after purchases
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test credentials - use admin credentials
const TEST_USER = {
  email: 'admin@yopmail.com',
  password: 'Admin123!'
};

let jwtToken = '';

async function testLogin() {
  console.log('\n🔐 Step 1: Testing Login to get JWT token...');
  
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
    console.log(`   Allowed Games: ${data.user.allowedGames}`);
    console.log(`   Max Members: ${data.user.maxMembers}`);
    return data.user;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    process.exit(1);
  }
}

async function testPurchaseGames(user) {
  console.log('\n🎮 Step 2: Testing purchase of 10 additional games...');
  
  const currentGames = user.allowedGames;
  
  try {
    const response = await fetch(`${BASE_URL}/api/user/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        newGamesPurchased: 10
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Purchase failed:', data.message);
      return false;
    }

    console.log('✅ Games purchased successfully!');
    console.log(`   Previous allowed games: ${currentGames}`);
    console.log(`   New allowed games: ${data.user.allowedGames}`);
    
    if (data.user.allowedGames === currentGames + 10) {
      console.log('   ✅ Allowed games updated correctly');
    } else {
      console.log('   ❌ Allowed games update mismatch');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error purchasing games:', error.message);
    return false;
  }
}

async function testUpdateMaxMembers() {
  console.log('\n👥 Step 3: Testing update of max members to 8...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/user/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        maxMembers: 8
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Update failed:', data.message);
      return false;
    }

    console.log('✅ Max members updated successfully!');
    console.log(`   New max members: ${data.user.maxMembers}`);
    
    if (data.user.maxMembers === 8) {
      console.log('   ✅ Max members updated correctly');
    } else {
      console.log('   ❌ Max members update mismatch');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error updating max members:', error.message);
    return false;
  }
}

async function testPurchaseCharacters() {
  console.log('\n🎭 Step 4: Testing character purchase...');
  
  // First, get available characters
  try {
    const charsResponse = await fetch(`${BASE_URL}/api/mobile/store/characters`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });

    const charsData = await charsResponse.json();
    
    if (!charsResponse.ok || !charsData.characters || charsData.characters.length === 0) {
      console.log('⚠️  No characters available to purchase');
      console.log('   Skipping character purchase test');
      return true;
    }

    // Get first character ID
    const characterId = charsData.characters[0].id;
    console.log(`   Attempting to purchase character: ${charsData.characters[0].name}`);

    // Try to purchase it
    const response = await fetch(`${BASE_URL}/api/user/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        characters: [characterId]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Character purchase failed:', data.message);
      return false;
    }

    console.log('✅ Character purchased successfully!');
    console.log(`   Characters purchased: ${data.purchasedCharacters}`);
    console.log(`   Total characters owned: ${data.totalCharactersOwned}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error purchasing character:', error.message);
    return false;
  }
}

async function testCombinedPurchase() {
  console.log('\n🛍️  Step 5: Testing combined purchase (games + max members)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/user/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        newGamesPurchased: 5,
        maxMembers: 10
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Combined purchase failed:', data.message);
      return false;
    }

    console.log('✅ Combined purchase successful!');
    console.log(`   Allowed games: ${data.user.allowedGames}`);
    console.log(`   Max members: ${data.user.maxMembers}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error with combined purchase:', error.message);
    return false;
  }
}

async function testInvalidRequest() {
  console.log('\n❌ Step 6: Testing invalid request (should fail)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/user/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        newGamesPurchased: -5 // Invalid: negative number
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log('✅ Invalid request correctly rejected:', data.message);
      return true;
    } else {
      console.log('❌ Invalid request was accepted (unexpected)');
      return false;
    }
  } catch (error) {
    console.log('✅ Invalid request correctly rejected');
    return true;
  }
}

async function runTests() {
  console.log('🧪 Starting User Update API Tests');
  console.log('================================');
  
  try {
    // Login
    const user = await testLogin();
    
    // Run tests
    await testPurchaseGames(user);
    await testUpdateMaxMembers();
    await testPurchaseCharacters();
    await testCombinedPurchase();
    await testInvalidRequest();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📝 Summary:');
    console.log('   The /api/user/update endpoint allows users to:');
    console.log('   1. Purchase additional games (adds to allowedGames)');
    console.log('   2. Upgrade their max members capacity');
    console.log('   3. Purchase characters (creates UserCharacter records)');
    console.log('   4. Combine multiple purchases in one request');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests();

