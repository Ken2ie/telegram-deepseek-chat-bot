const welcomeHandler = require('./welcome');
const conversationService = require('../../services/conversation');
const logger = require('../../utils/logger');
const CONSTANTS = require('../../config/constants');

class HandlerRegistry {
  constructor() {
    this.bot = null;
    this.handlers = new Map();
    this.processedMessages = new Set(); // Track processed messages to prevent duplicates
  }

  register(bot) {
    this.bot = bot;
    
    // Register all handlers
    this.registerCommandHandlers();
    this.registerAIHandlers();
    
    logger.info('All AI-powered handlers registered successfully');
  }

  registerCommandHandlers() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      try {
        await welcomeHandler.handleStart(this.bot, msg);
      } catch (error) {
        logger.botError(msg.from.id, error, { handler: 'welcome_start' });
      }
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      try {
        await welcomeHandler.handleHelp(this.bot, msg);
      } catch (error) {
        logger.botError(msg.from.id, error, { handler: 'welcome_help' });
      }
    });

    // Cancel command
    this.bot.onText(/\/cancel/, async (msg) => {
      try {
        await welcomeHandler.handleCancel(this.bot, msg);
      } catch (error) {
        logger.botError(msg.from.id, error, { handler: 'welcome_cancel' });
      }
    });

    // Test AI command
    this.bot.onText(/\/testai/, async (msg) => {
      try {
        await welcomeHandler.handleTestAI(this.bot, msg);
      } catch (error) {
        logger.botError(msg.from.id, error, { handler: 'welcome_testai' });
      }
    });
  }

  registerAIHandlers() {
    // Handle all messages with AI (except commands)
    this.bot.on('message', async (msg) => {
      try {
        // Create unique message identifier
        const messageId = `${msg.chat.id}_${msg.message_id}`;
        
        // Skip if we've already processed this message
        if (this.processedMessages.has(messageId)) {
          logger.info(`Skipping duplicate message: ${messageId}`);
          return;
        }
        
        // Mark message as processed
        this.processedMessages.add(messageId);
        
        // Clean up old processed messages (keep only last 1000)
        if (this.processedMessages.size > 1000) {
          const messagesArray = Array.from(this.processedMessages);
          this.processedMessages.clear();
          messagesArray.slice(-500).forEach(id => this.processedMessages.add(id));
        }
        
        // Skip if it's a command (handled by command handlers)
        if (msg.text && msg.text.startsWith('/')) return;
        
        // Skip if it's not a text message
        if (!msg.text) return;
        
        // Skip if message is empty or just whitespace
        if (msg.text.trim().length === 0) return;
        
        const userId = msg.from.id;
        const chatId = msg.chat.id;
        
        // Log message received
        logger.botActivity(userId, 'message_received', {
          messageId: msg.message_id,
          text: msg.text,
          chatType: msg.chat.type
        });
        
        logger.info(`Processing AI message from user ${userId}: "${msg.text}"`);
        
        // Get or initialize conversation
        let conversation = await conversationService.getConversation(userId);
        
        if (!conversation) {
          // Initialize conversation for new users
          await conversationService.initializeConversation(userId, {
            firstName: msg.from.first_name,
            lastName: msg.from.last_name,
            username: msg.from.username,
            chatId: chatId
          });
        }
        
        // Generate AI response
        const aiResponse = await conversationService.generateAIResponse(userId, msg.text);
        
        if (aiResponse.success) {
          // Send the AI response
          await this.bot.sendMessage(chatId, aiResponse.content, {
            parse_mode: 'Markdown'
          });
          
          // Log function calls if any
          if (aiResponse.functions && aiResponse.functions.length > 0) {
            logger.botActivity(userId, 'functions_executed', {
              functions: aiResponse.functions.map(f => f.functionName)
            });
          }
        } else {
          // Send error message
          await this.bot.sendMessage(chatId, 
            'I\'m here to help you book appointments and calls! What service are you interested in?'
          );
        }
      } catch (error) {
        logger.botError(msg.from.id, error, { handler: 'ai_message_handler' });
        
        // Send error message to user
        try {
          await this.bot.sendMessage(msg.chat.id, 
            'I\'m here to help! What service would you like to book?'
          );
        } catch (sendError) {
          logger.error('Failed to send error message:', sendError);
        }
      }
    });
  }
}

module.exports = new HandlerRegistry();
