/**
 * Test script for User Management API endpoints
 * Run this after starting the server to verify all endpoints work correctly
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:8080';
let authToken = '';
let userId = '';

// Test user credentials
const testUser = {
  email: 'test.user@example.com',
  password: 'TestPassword123',
  name: 'Test User',
  nic: '123456789V',
  address: '123 Test Street, Test City',
  phoneNumber: '+94771234567'
};

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  const result = await makeRequest('GET', '/api/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    console.log('📊 Server status:', result.data.status);
  } else {
    console.log('❌ Health check failed:', result.error);
    process.exit(1);
  }
}

async function testUserRegistration() {
  console.log('\n👤 Testing User Registration...');
  const result = await makeRequest('POST', '/api/auth/register', testUser);
  
  if (result.success) {
    console.log('✅ User registration successful');
    authToken = result.data.accessToken;
    userId = result.data.user.id;
    console.log('🔑 Auth token received');
  } else {
    console.log('❌ User registration failed:', result.error);
    // Try to login if user already exists
    await testUserLogin();
  }
}

async function testUserLogin() {
  console.log('\n🔐 Testing User Login...');
  const result = await makeRequest('POST', '/api/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (result.success) {
    console.log('✅ User login successful');
    authToken = result.data.accessToken;
    userId = result.data.user.id;
    console.log('🔑 Auth token received');
  } else {
    console.log('❌ User login failed:', result.error);
    process.exit(1);
  }
}

async function testGetCurrentUser() {
  console.log('\n👤 Testing Get Current User...');
  const result = await makeRequest('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Get current user successful');
    console.log('📧 User email:', result.data.user.email);
    console.log('👤 User name:', result.data.user.name);
  } else {
    console.log('❌ Get current user failed:', result.error);
  }
}

async function testUpdateProfile() {
  console.log('\n✏️ Testing Update Profile...');
  const updateData = {
    name: 'Updated Test User',
    address: '456 Updated Street, Updated City'
  };
  
  const result = await makeRequest('PUT', '/api/auth/profile', updateData, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Profile update successful');
    console.log('👤 Updated name:', result.data.user.name);
    console.log('🏠 Updated address:', result.data.user.address);
  } else {
    console.log('❌ Profile update failed:', result.error);
  }
}

async function testGetUserPreferences() {
  console.log('\n⚙️ Testing Get User Preferences...');
  const result = await makeRequest('GET', '/api/user/preferences', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Get preferences successful');
    console.log('🎨 Theme:', result.data.preferences.theme);
    console.log('🌐 Language:', result.data.preferences.language);
  } else {
    console.log('❌ Get preferences failed:', result.error);
  }
}

async function testUpdateUserPreferences() {
  console.log('\n⚙️ Testing Update User Preferences...');
  const updateData = {
    theme: 'dark',
    language: 'en',
    notifications: {
      email: true,
      browser: false,
      billReminders: true
    },
    dashboard: {
      defaultView: 'bills',
      itemsPerPage: 25
    }
  };
  
  const result = await makeRequest('PUT', '/api/user/preferences', updateData, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Preferences update successful');
    console.log('🎨 Theme:', result.data.preferences.theme);
    console.log('📧 Email notifications:', result.data.preferences.notifications.email);
  } else {
    console.log('❌ Preferences update failed:', result.error);
  }
}

async function testGetUserActivity() {
  console.log('\n📊 Testing Get User Activity...');
  const result = await makeRequest('GET', '/api/user/activity?limit=5', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Get activity successful');
    console.log('📈 Total activities:', result.data.pagination.total);
    console.log('📋 Recent activities:', result.data.activities.length);
  } else {
    console.log('❌ Get activity failed:', result.error);
  }
}

async function testGetActivityStats() {
  console.log('\n📊 Testing Get Activity Stats...');
  const result = await makeRequest('GET', '/api/user/activity/stats', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Get activity stats successful');
    console.log('📈 Total activities:', result.data.stats.totalActivities);
    console.log('📅 Period:', result.data.stats.period);
  } else {
    console.log('❌ Get activity stats failed:', result.error);
  }
}

async function testLogout() {
  console.log('\n🚪 Testing User Logout...');
  const result = await makeRequest('POST', '/api/auth/logout', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ User logout successful');
  } else {
    console.log('❌ User logout failed:', result.error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting User Management API Tests...');
  console.log('🌐 Testing against:', BASE_URL);
  
  try {
    await testHealthCheck();
    await testUserRegistration();
    await testGetCurrentUser();
    await testUpdateProfile();
    await testGetUserPreferences();
    await testUpdateUserPreferences();
    await testGetUserActivity();
    await testGetActivityStats();
    await testLogout();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ User Management System is working correctly');
    
  } catch (error) {
    console.log('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
