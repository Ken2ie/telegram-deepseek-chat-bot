const config = require('../../config');
const CONSTANTS = require('../../config/constants');
const conversationService = require('../../services/conversation');
const deepseekService = require('../../services/deepseek');
const logger = require('../../utils/logger');

class WelcomeHandler {
  async handleStart(bot, msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    try {
      // Initialize or reset conversation
      await conversationService.initializeConversation(userId, {
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        username: msg.from.username,
        chatId: chatId
      });

      const welcomeMessage = `Hello! 👋

Welcome to **Axis Point Advisory** — your trusted partner for expert guidance and solutions.

I'm your AI assistant, and I'm here to help you with:

💼 **Finance Advisory** - Financial planning, investment advice, budgeting
⚖️ **Legal Advisory** - Legal consultation, document review, compliance  
🎓 **Education Advisory** - Educational planning, career guidance, skill development
🚀 **Career Advisory** - Job search, career transitions, professional development
🩺 **Healthcare Advisory** - Health insurance, medical planning, wellness guidance

You can chat with me naturally about any of these services, ask questions, or book appointments. Just tell me what you need help with!

Type /help anytime for more information.`;

      await bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown'
      });

      logger.botActivity(userId, 'welcome_message_sent', { chatId });

    } catch (error) {
      logger.botError(userId, error, { handler: 'handleStart' });
      await bot.sendMessage(chatId, 'Welcome to Axis Point Advisory! Please try again.');
    }
  }

  async handleHelp(bot, msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    try {
      const helpMessage = this.getHelpMessage();
      
      await bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown'
      });

      logger.botActivity(userId, 'help_requested', { chatId });

    } catch (error) {
      logger.botError(userId, error, { handler: 'handleHelp' });
      await bot.sendMessage(chatId, 'I\'m here to help! Please use the menu options to get started.');
    }
  }

  async handleCancel(bot, msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    try {
      // Reset conversation
      await conversationService.resetConversation(userId);

      const cancelMessage = 'Your current session has been cancelled. You can start fresh anytime!';
      
      await bot.sendMessage(chatId, cancelMessage);

      // Show welcome message again
      await this.handleStart(bot, msg);

      logger.botActivity(userId, 'session_cancelled', { chatId });

    } catch (error) {
      logger.botError(userId, error, { handler: 'handleCancel' });
      await bot.sendMessage(chatId, 'Session cancelled. Please start again.');
    }
  }

  async handleTestAI(bot, msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    try {
      await bot.sendMessage(chatId, 'Testing DeepSeek AI connection...');
      
      const testResult = await deepseekService.testConnection();
      
      if (testResult) {
        await bot.sendMessage(chatId, '✅ DeepSeek AI is working correctly!');
        
        // Test a sample conversation
        const sampleResponse = await conversationService.handleUserMessage(userId, 'Hello, can you help me with financial planning?');
        
        if (sampleResponse.success) {
          await bot.sendMessage(chatId, `🤖 AI Response: ${sampleResponse.content}`);
        } else {
          await bot.sendMessage(chatId, `❌ AI Response failed: ${sampleResponse.error}`);
        }
      } else {
        await bot.sendMessage(chatId, '❌ DeepSeek AI connection failed. Please check your API key.');
      }

      logger.botActivity(userId, 'ai_test_performed', { chatId, testResult });

    } catch (error) {
      logger.botError(userId, error, { handler: 'handleTestAI' });
      await bot.sendMessage(chatId, '❌ AI test failed. Please check the logs for details.');
    }
  }

  getHelpMessage() {
    return `**Axis Point Advisory Bot Help**

🤖 **How to use this AI-powered bot:**

You can now chat naturally with me! I can help you with:

📋 **Services Available:**
• Finance Advisory - Investment, budgeting, financial planning
• Legal Advisory - Legal consultation, document review
• Education Advisory - Career guidance, skill development
• Career Advisory - Job search, career transitions
• Healthcare Advisory - Health insurance, medical planning

🎯 **What I can do:**
• Answer questions about our services
• Provide advice and guidance
• Book appointments for you (calls and in-person visits)
• Help you choose the right service
• Schedule calls or in-person visits
• Store your contact information
• Confirm your appointments
• Show your existing bookings

📞 **Commands:**
• /start - Start a new conversation
• /help - Show this help message
• /cancel - Cancel current session
• /testai - Test AI functionality (admin)

💡 **Tips:**
• Just chat naturally - no need to use specific commands
• Tell me what you need help with
• I'll guide you through booking appointments
• I remember our conversation context

**Examples:** 
• "I need help with financial planning"
• "I want to book a call for legal advice"
• "Schedule me an appointment for career counseling"
• "Show me my bookings"

Ready to get started? Just tell me what you need!`;
  }
}

module.exports = new WelcomeHandler();
