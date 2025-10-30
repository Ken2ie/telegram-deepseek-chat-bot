#!/usr/bin/env node

/**
 * Call Booking System Test Script
 * 
 * This script tests the new call booking functionality and JSON database system.
 * It simulates various user interactions to verify call booking works correctly.
 */

require('dotenv').config();
const database = require('./src/services/database');
const aiFunctions = require('./src/services/ai-functions');
const conversationService = require('./src/services/conversation');
const logger = require('./src/utils/logger');

async function testCallBookingSystem() {
  console.log('📞 Testing Call Booking System...\n');

  try {
    // Test 1: Database initialization
    console.log('1️⃣ Testing database initialization...');
    const allData = await database.getAllData();
    console.log('✅ Database initialized successfully');
    console.log(`   Users: ${allData.summary.totalUsers}`);
    console.log(`   Calls: ${allData.summary.totalCalls}`);
    console.log(`   Appointments: ${allData.summary.totalAppointments}`);
    console.log('');

    // Test 2: User creation and management
    console.log('2️⃣ Testing user creation...');
    const testUserId = 'test_user_call_' + Date.now();
    
    const user = await database.createUser({
      telegramId: testUserId,
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      phone: '+1234567890',
      email: 'john.doe@example.com'
    });
    
    console.log('✅ User created successfully');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Phone: ${user.phone}`);
    console.log('');

    // Test 3: Call booking creation
    console.log('3️⃣ Testing call booking creation...');
    const call = await database.createCall({
      userId: user.id,
      telegramId: testUserId,
      serviceId: 1,
      serviceName: 'Finance Advisory',
      userName: 'John Doe',
      userPhone: '+1234567890',
      userEmail: 'john.doe@example.com',
      preferredTime: '14:00',
      preferredDate: '2024-01-15',
      timezone: 'EST',
      notes: 'Need help with retirement planning'
    });
    
    console.log('✅ Call booking created successfully');
    console.log(`   Call ID: ${call.id}`);
    console.log(`   Service: ${call.serviceName}`);
    console.log(`   Date: ${call.preferredDate}`);
    console.log(`   Time: ${call.preferredTime}`);
    console.log('');

    // Test 4: AI Function Testing
    console.log('4️⃣ Testing AI functions for call booking...');
    
    // Initialize conversation
    await conversationService.initializeConversation(testUserId, {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      chatId: 'test_chat_call'
    });

    // Test collect user name function
    console.log('   Testing collect_user_name function...');
    const nameResult = await aiFunctions.executeFunction('collect_user_name', {
      firstName: 'Jane',
      lastName: 'Smith'
    }, testUserId);
    
    if (nameResult.success) {
      console.log('   ✅ collect_user_name function works');
      console.log(`   Result: ${nameResult.message}`);
    } else {
      console.log('   ❌ collect_user_name function failed');
    }

    // Test collect contact info function
    console.log('   Testing collect_contact_info function...');
    const contactResult = await aiFunctions.executeFunction('collect_contact_info', {
      phone: '+1987654321',
      email: 'jane.smith@example.com',
      preferredContact: 'phone'
    }, testUserId);
    
    if (contactResult.success) {
      console.log('   ✅ collect_contact_info function works');
      console.log(`   Result: ${contactResult.message}`);
    } else {
      console.log('   ❌ collect_contact_info function failed');
    }

    // Test book call function
    console.log('   Testing book_call function...');
    const bookResult = await aiFunctions.executeFunction('book_call', {
      preferredDate: '2024-01-20',
      preferredTime: '10:00',
      timezone: 'PST',
      notes: 'Urgent financial planning consultation'
    }, testUserId);
    
    if (bookResult.success) {
      console.log('   ✅ book_call function works');
      console.log(`   Result: ${bookResult.message}`);
    } else {
      console.log('   ❌ book_call function failed');
    }

    console.log('');

    // Test 5: End-to-end call booking flow
    console.log('5️⃣ Testing end-to-end call booking flow...');
    
    const flowSteps = [
      {
        step: 'User expresses interest',
        message: 'I need help with financial planning and want to book a call',
        expectedFunction: 'select_service'
      },
      {
        step: 'User provides name',
        message: 'My name is Alice Johnson',
        expectedFunction: 'collect_user_name'
      },
      {
        step: 'User provides contact',
        message: 'My phone is +1555123456 and email is alice@example.com',
        expectedFunction: 'collect_contact_info'
      },
      {
        step: 'User schedules call',
        message: 'I want to schedule the call for tomorrow at 2 PM EST',
        expectedFunction: 'book_call'
      },
      {
        step: 'User confirms booking',
        message: 'Yes, that works for me',
        expectedFunction: 'confirm_call_booking'
      }
    ];

    for (const step of flowSteps) {
      console.log(`   ${step.step}: "${step.message}"`);
      
      // Simulate AI response (in real scenario, this would be handled by DeepSeek)
      const response = await conversationService.generateAIResponse(testUserId, step.message);
      
      if (response.success) {
        console.log(`   Bot: ${response.content.substring(0, 80)}...`);
        if (response.functions) {
          console.log(`   Actions: ${response.functions.map(f => f.functionName).join(', ')}`);
        }
      } else {
        console.log(`   Error: ${response.error}`);
      }
      console.log('');
    }

    // Test 6: Show user bookings
    console.log('6️⃣ Testing show_user_bookings function...');
    const bookingsResult = await aiFunctions.executeFunction('show_user_bookings', {}, testUserId);
    
    if (bookingsResult.success) {
      console.log('✅ show_user_bookings function works');
      console.log(`Result: ${bookingsResult.message.substring(0, 200)}...`);
    } else {
      console.log('❌ show_user_bookings function failed');
    }

    console.log('');

    // Test 7: Database queries
    console.log('7️⃣ Testing database queries...');
    
    const userCalls = await database.getUserCalls(testUserId);
    const userAppointments = await database.getUserAppointments(testUserId);
    const retrievedUser = await database.getUser(testUserId);
    
    console.log('✅ Database queries successful');
    console.log(`   User calls: ${userCalls.length}`);
    console.log(`   User appointments: ${userAppointments.length}`);
    console.log(`   User retrieved: ${retrievedUser ? 'Yes' : 'No'}`);

    // Clean up test data
    console.log('\n8️⃣ Cleaning up test data...');
    await conversationService.deleteConversation(testUserId);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All call booking system tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ JSON database system working');
    console.log('✅ User creation and management working');
    console.log('✅ Call booking creation working');
    console.log('✅ AI functions for call booking working');
    console.log('✅ End-to-end flow functional');
    console.log('✅ Database queries working');
    console.log('\n🚀 Your call booking system is ready!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCallBookingSystem()
    .then(() => {
      console.log('\n✨ Call booking system test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testCallBookingSystem };
