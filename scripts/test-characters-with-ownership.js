#!/usr/bin/env node

/**
 * Test script for the /api/mobile/characters endpoint
 * Tests fetching all characters with user ownership information
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

async function testGetAllCharacters() {
  console.log('\n🎭 Step 2: Testing Get All Characters with Ownership...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/mobile/characters`, {
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
    console.log(`\n📊 Summary:`);
    console.log(`   Total characters: ${data.total}`);
    console.log(`   Purchased: ${data.purchased}`);
    console.log(`   Default: ${data.default}`);
    
    if (data.characters && data.characters.length > 0) {
      console.log(`\n📋 Character Details (showing first 3):`);
      data.characters.slice(0, 3).forEach((char, index) => {
        console.log(`\n   Character ${index + 1}:`);
        console.log(`   - ID: ${char.id}`);
        console.log(`   - Name: ${char.name}`);
        console.log(`   - Price: ${char.price} cents`);
        console.log(`   - Is Purchased: ${char.isPurchased ? '✅ Yes' : '❌ No'}`);
        console.log(`   - Is Default: ${char.isDefault ? '✅ Yes' : '❌ No'}`);
        console.log(`   - Is Unlocked: ${char.isUnlocked ? 'Yes' : 'No'}`);
        console.log(`   - Is Paid: ${char.isPaid ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('\n⚠️  No characters found in database');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error fetching characters:', error.message);
    return false;
  }
}

async function testOwnershipLogic() {
  console.log('\n🔍 Step 3: Verifying Ownership Logic...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/mobile/characters`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok || !data.characters || data.characters.length === 0) {
      console.log('⚠️  No characters to test');
      return true;
    }

    // Check if ownership logic is correct
    let issues = 0;
    
    data.characters.forEach(char => {
      // Default characters should have isDefault = true
      if ((char.isUnlocked || char.price === 0) && !char.isDefault) {
        console.log(`⚠️  Character "${char.name}" is unlocked/default but isDefault is false`);
        issues++;
      }
      
      // Non-default characters should have isDefault = false if not unlocked
      if (!char.isUnlocked && char.price > 0 && char.isDefault) {
        console.log(`⚠️  Character "${char.name}" is paid but isDefault is true`);
        issues++;
      }
    });

    if (issues === 0) {
      console.log('✅ Ownership logic is correct!');
      console.log(`   All ${data.characters.length} characters have correct isDefault flags`);
    } else {
      console.log(`❌ Found ${issues} logic issues`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error verifying logic:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Characters with Ownership API Tests');
  console.log('='.repeat(70));
  
  try {
    // Login
    const user = await testLogin();
    
    // Run tests
    await testGetAllCharacters();
    await testOwnershipLogic();
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ All tests completed!');
    console.log('\n📝 API Summary:');
    console.log('   Endpoint: GET /api/mobile/characters');
    console.log('   Purpose: Fetch all characters with user ownership info');
    console.log('   Returns:');
    console.log('     - All characters');
    console.log('     - isPurchased: boolean (user purchased it)');
    console.log('     - isDefault: boolean (default/unlocked character)');
    console.log('     - Statistics (total, purchased, default count)');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests();

