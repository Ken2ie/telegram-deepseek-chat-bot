const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger');
const deepseekService = require('./deepseek');
const database = require('./database');
const contextRetriever = require('./contextRetriever');
const store = require('../storage/jsonStore');

// In-memory storage for conversations (in production, use a database)
const conversations = new Map();

class ConversationService {
  async initializeConversation(userId, userInfo) {
    try {
      // Try to get existing user context first
      const existingContext = await contextRetriever.getUserContext(userId);
      
      const conversation = {
        userId: userId,
        chatId: userInfo.chatId,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        username: userInfo.username,
        state: CONSTANTS.CONVERSATION_STATES.INITIAL,
        selectedService: null,
        serviceName: null,
        appointmentType: null,
        contactNumber: null,
        selectedLocation: null,
        locationName: null,
        selectedDay: null,
        selectedTime: null,
        appointmentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      conversations.set(userId, conversation);
      
      // Store user profile in unified storage
      if (userInfo.firstName) {
        store.upsertUserProfile(userId, {
          firstName: userInfo.firstName,
          lastName: userInfo.lastName || '',
          username: userInfo.username || null
        });
      }
      
      logger.botActivity(userId, 'conversation_initialized', {
        chatId: userInfo.chatId,
        firstName: userInfo.firstName
      });

      return conversation;
    } catch (error) {
      logger.botError(userId, error, { action: 'initializeConversation' });
      throw error;
    }
  }

  async getConversation(userId) {
    try {
      return conversations.get(userId) || null;
    } catch (error) {
      logger.botError(userId, error, { action: 'getConversation' });
      throw error;
    }
  }

  async updateConversation(userId, updates) {
    try {
      const conversation = conversations.get(userId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Update conversation with new data
      Object.assign(conversation, updates, {
        updatedAt: new Date()
      });

      conversations.set(userId, conversation);
      
      // Sync updates to unified storage if relevant
      if (updates.firstName || updates.lastName) {
        store.upsertUserProfile(userId, {
          firstName: updates.firstName || conversation.firstName,
          lastName: updates.lastName || conversation.lastName
        });
      }
      
      if (updates.contactNumber || updates.phone) {
        store.upsertUserProfile(userId, {
          phone: updates.contactNumber || updates.phone
        });
      }
      
      if (updates.email) {
        store.upsertUserProfile(userId, {
          email: updates.email
        });
      }
      
      logger.botActivity(userId, 'conversation_updated', {
        state: conversation.state,
        updates: Object.keys(updates)
      });

      return conversation;
    } catch (error) {
      logger.botError(userId, error, { action: 'updateConversation', updates });
      throw error;
    }
  }

  async resetConversation(userId) {
    try {
      const conversation = conversations.get(userId);
      
      if (conversation) {
        // Reset to initial state but keep user info
        const resetConversation = {
          ...conversation,
          state: CONSTANTS.CONVERSATION_STATES.INITIAL,
          selectedService: null,
          serviceName: null,
          appointmentType: null,
          contactNumber: null,
          selectedLocation: null,
          locationName: null,
          selectedDay: null,
          selectedTime: null,
          appointmentId: null,
          updatedAt: new Date()
        };

        conversations.set(userId, resetConversation);
        
        logger.botActivity(userId, 'conversation_reset');
        
        return resetConversation;
      }
      
      return null;
    } catch (error) {
      logger.botError(userId, error, { action: 'resetConversation' });
      throw error;
    }
  }

  async deleteConversation(userId) {
    try {
      const deleted = conversations.delete(userId);
      
      if (deleted) {
        logger.botActivity(userId, 'conversation_deleted');
      }
      
      return deleted;
    } catch (error) {
      logger.botError(userId, error, { action: 'deleteConversation' });
      throw error;
    }
  }

  async getAllConversations() {
    try {
      return Array.from(conversations.values());
    } catch (error) {
      logger.error('Error getting all conversations:', error);
      throw error;
    }
  }

  async getConversationsByState(state) {
    try {
      const allConversations = await this.getAllConversations();
      return allConversations.filter(conv => conv.state === state);
    } catch (error) {
      logger.error('Error getting conversations by state:', error);
      throw error;
    }
  }

  async getActiveConversations() {
    try {
      const allConversations = await this.getAllConversations();
      return allConversations.filter(conv => 
        conv.state !== CONSTANTS.CONVERSATION_STATES.COMPLETED &&
        conv.state !== CONSTANTS.CONVERSATION_STATES.INITIAL
      );
    } catch (error) {
      logger.error('Error getting active conversations:', error);
      throw error;
    }
  }

  // Clean up old conversations (older than 24 hours)
  async cleanupOldConversations() {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      let cleanedCount = 0;
      
      for (const [userId, conversation] of conversations.entries()) {
        if (conversation.updatedAt < twentyFourHoursAgo) {
          conversations.delete(userId);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} old conversations`);
      }
      
      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up old conversations:', error);
      throw error;
    }
  }

  // Generate AI response using DeepSeek with function calling
  async generateAIResponse(userId, userMessage) {
    try {
      const conversation = await this.getConversation(userId);
      
      if (!conversation) {
        logger.warn(`No conversation found for user ${userId} when generating AI response`);
        return {
          success: false,
          content: 'I don\'t have any context about our conversation. Please start a new conversation with /start.',
          shouldInitialize: true
        };
      }

      // Build conversation context for AI
      const conversationContext = {
        selectedService: conversation.selectedService,
        serviceName: conversation.serviceName,
        appointmentType: conversation.appointmentType,
        selectedLocation: conversation.selectedLocation,
        locationName: conversation.locationName,
        state: conversation.state,
        firstName: conversation.firstName
      };

      // Generate AI response with function calling
      const aiResponse = await deepseekService.generateBotResponse(userMessage, conversationContext, userId, this);
      
      if (aiResponse.success) {
        logger.botActivity(userId, 'ai_response_generated', {
          responseType: aiResponse.type,
          responseLength: aiResponse.content.length,
          usage: aiResponse.usage,
          functionsCalled: aiResponse.functions ? aiResponse.functions.length : 0
        });
      } else {
        logger.botError(userId, new Error(aiResponse.error), { 
          action: 'generateAIResponse',
          userMessage: userMessage.substring(0, 100) // Log first 100 chars for debugging
        });
      }

      return aiResponse;
    } catch (error) {
      logger.botError(userId, error, { action: 'generateAIResponse' });
      return {
        success: false,
        error: error.message,
        content: 'I\'m here to help you book appointments and calls! What service are you interested in?'
      };
    }
  }

  // Handle general user messages with AI
  async handleUserMessage(userId, userMessage) {
    try {
      const conversation = await this.getConversation(userId);
      
      // If no conversation exists, initialize one
      if (!conversation) {
        logger.info(`No conversation found for user ${userId}, initializing new conversation`);
        return {
          success: false,
          content: 'Welcome to Axis Point Advisory! Please start by typing /start to begin our conversation.',
          shouldInitialize: true
        };
      }

      // Generate AI response
      const aiResponse = await this.generateAIResponse(userId, userMessage);
      
      return aiResponse;
    } catch (error) {
      logger.botError(userId, error, { action: 'handleUserMessage' });
      return {
        success: false,
        error: error.message,
        content: 'I\'m here to help! What service would you like to book?'
      };
    }
  }
}

module.exports = new ConversationService();
