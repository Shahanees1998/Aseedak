/**
 * FCM Notifications Test Script
 * 
 * This script demonstrates how to test FCM notifications with dummy device tokens
 * Run this script to verify all notification types work correctly
 */

const BASE_URL = 'http://localhost:3000' // Change to your server URL
const TEST_TOKEN = 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual JWT token

// Test data
const testCases = [
  {
    name: 'Test All Notifications',
    endpoint: '/api/notifications/test-fcm',
    method: 'POST',
    body: {
      testType: 'all',
      dummyToken: 'dummy_fcm_token_all_tests_' + Date.now()
    }
  },
  {
    name: 'Test Elimination Request Only',
    endpoint: '/api/notifications/test-fcm',
    method: 'POST',
    body: {
      testType: 'elimination',
      dummyToken: 'dummy_fcm_token_elimination_' + Date.now()
    }
  },
  {
    name: 'Test Game Start Only',
    endpoint: '/api/notifications/test-fcm',
    method: 'POST',
    body: {
      testType: 'game_start',
      dummyToken: 'dummy_fcm_token_game_start_' + Date.now()
    }
  },
  {
    name: 'Test Custom Notification',
    endpoint: '/api/notifications/test-fcm',
    method: 'POST',
    body: {
      testType: 'custom',
      dummyToken: 'dummy_fcm_token_custom_' + Date.now()
    }
  }
]

async function testFCMNotifications() {
  console.log('🧪 Starting FCM Notifications Test Suite')
  console.log('=' .repeat(50))

  for (const testCase of testCases) {
    console.log(`\n📱 Testing: ${testCase.name}`)
    console.log('-'.repeat(30))

    try {
      const response = await fetch(`${BASE_URL}${testCase.endpoint}`, {
        method: testCase.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': TEST_TOKEN
        },
        body: JSON.stringify(testCase.body)
      })

      const result = await response.json()

      if (response.ok) {
        console.log('✅ Test Status:', result.message)
        console.log('📊 Summary:', result.summary)
        
        if (result.testResults) {
          console.log('📋 Test Results:')
          result.testResults.forEach(test => {
            const status = test.success ? '✅' : '❌'
            console.log(`  ${status} ${test.type}: ${test.message}`)
          })
        }

        if (result.databaseStorage) {
          console.log('🗄️ Database Storage:')
          console.log(`  Notifications Stored: ${result.databaseStorage.notificationsStored}`)
          if (result.databaseStorage.recentNotifications.length > 0) {
            console.log('  Recent Notifications:')
            result.databaseStorage.recentNotifications.forEach(notification => {
              console.log(`    - ${notification.title} (${notification.type})`)
            })
          }
        }
      } else {
        console.log('❌ Test Failed:', result.message)
        if (result.error) {
          console.log('Error:', result.error)
        }
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message)
    }

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\n' + '='.repeat(50))
  console.log('🏁 FCM Test Suite Completed')
}

// Test individual notification types
async function testIndividualNotifications() {
  console.log('\n🔍 Testing Individual Notification Types')
  console.log('=' .repeat(50))

  const individualTests = [
    'elimination',
    'new_target', 
    'game_start',
    'game_end',
    'avatar',
    'invitation',
    'custom',
    'bulk'
  ]

  for (const testType of individualTests) {
    console.log(`\n📱 Testing: ${testType}`)
    
    try {
      const response = await fetch(`${BASE_URL}/api/notifications/test-fcm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': TEST_TOKEN
        },
        body: JSON.stringify({
          testType: testType,
          dummyToken: `dummy_fcm_token_${testType}_${Date.now()}`
        })
      })

      const result = await response.json()

      if (response.ok) {
        const testResult = result.testResults[0]
        const status = testResult.success ? '✅' : '❌'
        console.log(`${status} ${testResult.type}: ${testResult.message}`)
      } else {
        console.log('❌ Failed:', result.message)
      }
    } catch (error) {
      console.log('❌ Error:', error.message)
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// Get FCM test information
async function getFCMTestInfo() {
  console.log('\n📋 Getting FCM Test Information')
  console.log('=' .repeat(50))

  try {
    const response = await fetch(`${BASE_URL}/api/notifications/test-fcm`, {
      method: 'GET',
      headers: {
        'Authorization': TEST_TOKEN
      }
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ FCM Test Info Retrieved')
      console.log('👤 User Info:', result.user)
      console.log('🧪 Available Test Types:', result.availableTestTypes)
      console.log('📖 Usage:', result.usage)
    } else {
      console.log('❌ Failed to get info:', result.message)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

// Main execution
async function main() {
  console.log('🚀 FCM Notifications Test Suite')
  console.log('Make sure to update BASE_URL and TEST_TOKEN before running!')
  console.log('')

  if (TEST_TOKEN === 'Bearer YOUR_JWT_TOKEN_HERE') {
    console.log('❌ Please update TEST_TOKEN with your actual JWT token')
    console.log('❌ Please update BASE_URL with your server URL')
    return
  }

  try {
    await getFCMTestInfo()
    await testFCMNotifications()
    await testIndividualNotifications()
  } catch (error) {
    console.log('❌ Test suite failed:', error.message)
  }
}

// Run the test suite
if (typeof window === 'undefined') {
  // Node.js environment
  main().catch(console.error)
} else {
  // Browser environment
  console.log('Run this script in Node.js or copy the functions to your browser console')
}

module.exports = {
  testFCMNotifications,
  testIndividualNotifications,
  getFCMTestInfo
}
