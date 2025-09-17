#!/bin/bash

# FCM Notifications Test Script using cURL
# 
# Usage: 
# 1. Update JWT_TOKEN with your actual JWT token
# 2. Update BASE_URL with your server URL
# 3. Run: chmod +x test-fcm-curl.sh && ./test-fcm-curl.sh

# Configuration
JWT_TOKEN="Bearer YOUR_JWT_TOKEN_HERE"
BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 FCM Notifications Test Suite${NC}"
echo -e "${BLUE}================================${NC}"

# Check if JWT token is set
if [ "$JWT_TOKEN" = "Bearer YOUR_JWT_TOKEN_HERE" ]; then
    echo -e "${RED}❌ Please update JWT_TOKEN with your actual JWT token${NC}"
    echo -e "${RED}❌ Please update BASE_URL with your server URL${NC}"
    exit 1
fi

# Function to test FCM endpoint
test_fcm() {
    local test_type=$1
    local test_name=$2
    local dummy_token="dummy_fcm_token_${test_type}_$(date +%s)"
    
    echo -e "\n${YELLOW}📱 Testing: ${test_name}${NC}"
    echo -e "${YELLOW}----------------------------------------${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/notifications/test-fcm" \
        -H "Content-Type: application/json" \
        -H "Authorization: ${JWT_TOKEN}" \
        -d "{
            \"testType\": \"${test_type}\",
            \"dummyToken\": \"${dummy_token}\"
        }")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Test Status: SUCCESS${NC}"
        echo "$body" | jq -r '.message // "No message"'
        
        # Extract summary
        echo -e "\n${BLUE}📊 Summary:${NC}"
        echo "$body" | jq -r '.summary | "Total Tests: \(.totalTests), Successful: \(.successfulTests), Failed: \(.failedTests), DB Notifications: \(.databaseNotificationsStored)"'
        
        # Extract test results
        echo -e "\n${BLUE}📋 Test Results:${NC}"
        echo "$body" | jq -r '.testResults[]? | "\(if .success then "✅" else "❌" end) \(.type): \(.message)"'
        
        # Extract database storage info
        echo -e "\n${BLUE}🗄️ Database Storage:${NC}"
        echo "$body" | jq -r '.databaseStorage | "Notifications Stored: \(.notificationsStored)"'
        
    else
        echo -e "${RED}❌ Test Failed (HTTP $http_code)${NC}"
        echo "$body" | jq -r '.message // "No message"'
    fi
}

# Function to get FCM test info
get_fcm_info() {
    echo -e "\n${BLUE}📋 Getting FCM Test Information${NC}"
    echo -e "${BLUE}================================${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/notifications/test-fcm" \
        -H "Authorization: ${JWT_TOKEN}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ FCM Test Info Retrieved${NC}"
        echo "$body" | jq -r '.user | "User ID: \(.userId), FCM Tokens: \(.fcmTokenCount), Has Settings: \(.hasNotificationSettings)"'
        echo -e "\n${BLUE}🧪 Available Test Types:${NC}"
        echo "$body" | jq -r '.availableTestTypes[]'
    else
        echo -e "${RED}❌ Failed to get info (HTTP $http_code)${NC}"
        echo "$body" | jq -r '.message // "No message"'
    fi
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed. Please install jq for JSON parsing.${NC}"
    echo -e "${YELLOW}Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)${NC}"
    exit 1
fi

# Run tests
get_fcm_info

# Test all notification types
test_fcm "all" "All Notifications"

# Test individual notification types
test_fcm "elimination" "Elimination Request"
test_fcm "new_target" "New Target Assignment"
test_fcm "game_start" "Game Start"
test_fcm "game_end" "Game End"
test_fcm "avatar" "Avatar Assignment"
test_fcm "invitation" "Game Invitation"
test_fcm "custom" "Custom Notification"
test_fcm "bulk" "Bulk Notification"

echo -e "\n${BLUE}================================${NC}"
echo -e "${GREEN}🏁 FCM Test Suite Completed${NC}"
echo -e "${BLUE}================================${NC}"

# Optional: Test with custom dummy token
echo -e "\n${YELLOW}🔧 Testing with Custom Dummy Token${NC}"
custom_token="custom_dummy_token_$(date +%s)"
test_fcm "custom" "Custom Token Test"

echo -e "\n${GREEN}✅ All tests completed!${NC}"
echo -e "${BLUE}Check your Firebase console for FCM delivery logs${NC}"
echo -e "${BLUE}Check your database for stored notifications${NC}"
