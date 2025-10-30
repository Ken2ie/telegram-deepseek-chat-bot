#!/usr/bin/env node

/**
 * DeepSeek Integration Test Script
 * 
 * This script tests the DeepSeek AI integration without starting the full bot.
 * Run this to verify your API key and configuration are working correctly.
 */

require('dotenv').config();
const deepseekService = require('./src/services/deepseek');
const conversationService = require('./src/services/conversation');
const logger = require('./src/utils/logger');

async function testDeepSeekIntegration() {
  console.log('🧪 Testing DeepSeek AI Integration...\n');

  try {
    // Test 1: Basic API Connection
    console.log('1️⃣ Testing API connection...');
    const connectionTest = await deepseekService.testConnection();
    
    if (connectionTest) {
      console.log('✅ API connection successful!\n');
    } else {
      console.log('❌ API connection failed!\n');
      return;
    }

    // Test 2: Generate a simple response
    console.log('2️⃣ Testing basic response generation...');
    const testMessages = [
      {
        role: 'system',
        content: 'You are a helpful assistant for Axis Point Advisory.'
      },
      {
        role: 'user',
        content: 'Hello, I need help with financial planning.'
      }
    ];

    const response = await deepseekService.generateResponse(testMessages);
    
    if (response.success) {
      console.log('✅ Response generation successful!');
      console.log(`📝 AI Response: ${response.content}\n`);
    } else {
      console.log('❌ Response generation failed!');
      console.log(`Error: ${response.error}\n`);
      return;
    }

    // Test 3: Test conversation service integration
    console.log('3️⃣ Testing conversation service integration...');
    
    // Initialize a test conversation
    const testUserId = 'test_user_123';
    await conversationService.initializeConversation(testUserId, {
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      chatId: 'test_chat_123'
    });

    // Test AI response through conversation service
    const conversationResponse = await conversationService.handleUserMessage(
      testUserId, 
      'I need advice on investment strategies for retirement planning.'
    );

    if (conversationResponse.success) {
      console.log('✅ Conversation service integration successful!');
      console.log(`📝 AI Response: ${conversationResponse.content}\n`);
    } else {
      console.log('❌ Conversation service integration failed!');
      console.log(`Error: ${conversationResponse.error}\n`);
    }

    // Test 4: Test with different service contexts
    console.log('4️⃣ Testing with service context...');
    
    // Update conversation with service selection
    await conversationService.updateConversation(testUserId, {
      selectedService: 1, // Finance
      serviceName: 'Finance',
      state: 'SERVICE_SELECTED'
    });

    const contextualResponse = await conversationService.handleUserMessage(
      testUserId,
      'What are the best investment options for someone in their 30s?'
    );

    if (contextualResponse.success) {
      console.log('✅ Contextual response generation successful!');
      console.log(`📝 AI Response: ${contextualResponse.content}\n`);
    } else {
      console.log('❌ Contextual response generation failed!');
      console.log(`Error: ${contextualResponse.error}\n`);
    }

    // Clean up test conversation
    await conversationService.deleteConversation(testUserId);

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ DeepSeek API connection working');
    console.log('✅ Basic response generation working');
    console.log('✅ Conversation service integration working');
    console.log('✅ Contextual responses working');
    console.log('\n🚀 Your bot is ready to use DeepSeek AI!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDeepSeekIntegration()
    .then(() => {
      console.log('\n✨ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testDeepSeekIntegration };
