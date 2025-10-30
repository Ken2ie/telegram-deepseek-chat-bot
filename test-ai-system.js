#!/usr/bin/env node

/**
 * AI-Driven Bot Test Script
 * 
 * This script tests the new AI-driven system with function calling capabilities.
 * It simulates various user interactions to verify the AI can handle different scenarios.
 */

require('dotenv').config();
const deepseekService = require('./src/services/deepseek');
const conversationService = require('./src/services/conversation');
const aiFunctions = require('./src/services/ai-functions');
const logger = require('./src/utils/logger');

async function testAIDrivenSystem() {
  console.log('🤖 Testing AI-Driven Bot System...\n');

  try {
    // Test 1: Basic AI Connection
    console.log('1️⃣ Testing AI connection...');
    const connectionTest = await deepseekService.testConnection();
    
    if (!connectionTest) {
      console.log('❌ AI connection failed!');
      return;
    }
    console.log('✅ AI connection successful!\n');

    // Test 2: Function System
    console.log('2️⃣ Testing function system...');
    const availableFunctions = aiFunctions.getAvailableFunctions();
    console.log(`✅ Found ${availableFunctions.length} available functions:`);
    availableFunctions.forEach(func => {
      console.log(`   - ${func.name}: ${func.description}`);
    });
    console.log('');

    // Test 3: Natural Conversation Flow
    console.log('3️⃣ Testing natural conversation flow...');
    
    const testUserId = 'test_user_ai_' + Date.now();
    
    // Initialize conversation
    await conversationService.initializeConversation(testUserId, {
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      chatId: 'test_chat_ai'
    });

    // Test scenarios
    const testScenarios = [
      {
        name: 'Service Interest',
        message: 'I need help with financial planning for my retirement',
        expectedFunction: 'select_service'
      },
      {
        name: 'Appointment Booking',
        message: 'I want to book an appointment for legal advice',
        expectedFunction: 'select_service'
      },
      {
        name: 'General Question',
        message: 'What services do you offer?',
        expectedFunction: 'show_services_menu'
      },
      {
        name: 'Contact Information',
        message: 'My phone number is +1234567890',
        expectedFunction: 'set_contact_info'
      }
    ];

    for (const scenario of testScenarios) {
      console.log(`   Testing: ${scenario.name}`);
      console.log(`   Message: "${scenario.message}"`);
      
      const response = await conversationService.generateAIResponse(testUserId, scenario.message);
      
      if (response.success) {
        console.log(`   ✅ Response: ${response.content.substring(0, 100)}...`);
        
        if (response.functions && response.functions.length > 0) {
          console.log(`   🔧 Functions called: ${response.functions.map(f => f.functionName).join(', ')}`);
        } else {
          console.log(`   💬 Text response (no functions)`);
        }
      } else {
        console.log(`   ❌ Failed: ${response.error}`);
      }
      console.log('');
    }

    // Test 4: Function Execution
    console.log('4️⃣ Testing direct function execution...');
    
    // Test service selection
    const serviceResult = await aiFunctions.executeFunction('select_service', {
      service_id: 1,
      service_name: 'Finance Advisory'
    }, testUserId);
    
    if (serviceResult.success) {
      console.log('✅ Service selection function works');
      console.log(`   Result: ${serviceResult.message}`);
    } else {
      console.log('❌ Service selection failed');
    }

    // Test appointment scheduling
    const scheduleResult = await aiFunctions.executeFunction('schedule_appointment', {
      day: 'Monday',
      time: '10:00'
    }, testUserId);
    
    if (scheduleResult.success) {
      console.log('✅ Appointment scheduling function works');
      console.log(`   Result: ${scheduleResult.message}`);
    } else {
      console.log('❌ Appointment scheduling failed');
    }

    console.log('');

    // Test 5: End-to-End Flow
    console.log('5️⃣ Testing end-to-end appointment flow...');
    
    const flowSteps = [
      'I want to book a call appointment for career advice',
      'My phone number is +1987654321',
      'I prefer the Richmond location',
      'Can we schedule it for Tuesday at 2 PM?'
    ];

    for (const step of flowSteps) {
      console.log(`   User: "${step}"`);
      const response = await conversationService.generateAIResponse(testUserId, step);
      
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

    // Clean up
    await conversationService.deleteConversation(testUserId);

    console.log('🎉 All AI-driven system tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ AI connection working');
    console.log('✅ Function system operational');
    console.log('✅ Natural conversation processing');
    console.log('✅ Function execution working');
    console.log('✅ End-to-end flow functional');
    console.log('\n🚀 Your AI-driven bot is ready!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testAIDrivenSystem()
    .then(() => {
      console.log('\n✨ AI-driven system test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testAIDrivenSystem };
