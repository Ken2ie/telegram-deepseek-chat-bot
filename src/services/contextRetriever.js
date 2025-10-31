const store = require('../storage/jsonStore');
const database = require('./database');
const logger = require('../utils/logger');

/**
 * Context Retrieval Service
 * Provides an MCP-like interface for the AI to query user data and conversation history
 */
class ContextRetriever {
  /**
   * Get complete user context including profile, bookings, and conversation history
   */
  async getUserContext(userId) {
    try {
      const chatContext = store.getUserContext(userId);
      const dbUser = await database.getUser(userId);
      
      // Merge data from both sources
      const context = {
        userId: userId,
        profile: {
          ...(chatContext?.profile || {}),
          // Merge with database user data
          firstName: dbUser?.firstName || chatContext?.profile?.firstName,
          lastName: dbUser?.lastName || chatContext?.profile?.lastName,
          phone: dbUser?.phone || chatContext?.profile?.phone,
          email: dbUser?.email || chatContext?.profile?.email,
          preferredContact: dbUser?.preferredContact || chatContext?.profile?.preferredContact
        },
        bookings: {
          chat: chatContext?.bookings || [],
          database: {
            calls: await database.getUserCalls(userId) || [],
            appointments: await database.getUserAppointments(userId) || []
          }
        },
        conversation: {
          totalMessages: chatContext?.totalMessages || 0,
          sessionsCount: chatContext?.sessionsCount || 0,
          metadata: chatContext?.metadata || {}
        }
      };
      
      return context;
    } catch (error) {
      logger.error(`Failed to get user context for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get recent conversation history for context
   */
  getConversationHistory(userId, sessionId = null, limit = 20) {
    try {
      // Use provided sessionId or default to userId
      const actualSessionId = sessionId || userId;
      return store.getConversationHistory(userId, actualSessionId, limit);
    } catch (error) {
      logger.error(`Failed to get conversation history for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get user profile information
   */
  getUserProfile(userId) {
    try {
      const chatProfile = store.getUserProfile(userId);
      return chatProfile;
    } catch (error) {
      logger.error(`Failed to get user profile for ${userId}:`, error);
      return {};
    }
  }

  /**
   * Get user bookings from both chat_db and database
   */
  async getUserBookings(userId) {
    try {
      const chatBookings = store.getBookings(userId);
      const dbCalls = await database.getUserCalls(userId) || [];
      const dbAppointments = await database.getUserAppointments(userId) || [];
      
      return {
        chat: chatBookings,
        calls: dbCalls,
        appointments: dbAppointments,
        total: chatBookings.length + dbCalls.length + dbAppointments.length
      };
    } catch (error) {
      logger.error(`Failed to get user bookings for ${userId}:`, error);
      return { chat: [], calls: [], appointments: [], total: 0 };
    }
  }

  /**
   * Search previous messages for context
   */
  searchMessages(userId, query, limit = 5) {
    try {
      return store.searchUserMessages(userId, query, limit);
    } catch (error) {
      logger.error(`Failed to search messages for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  getUserStats(userId) {
    try {
      return store.getUserStats(userId);
    } catch (error) {
      logger.error(`Failed to get user stats for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Format conversation history for AI context
   */
  formatConversationHistory(messages, maxLength = 3000) {
    if (!messages || messages.length === 0) {
      return '';
    }

    let formatted = '';
    for (const msg of messages) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const text = msg.text || '';
      formatted += `${role}: ${text}\n`;
      
      // Limit total length to avoid token limits
      if (formatted.length > maxLength) {
        const truncated = formatted.substring(0, maxLength);
        return truncated + '\n[... conversation history truncated ...]';
      }
    }
    
    return formatted;
  }

  /**
   * Format user context for AI prompt
   */
  formatUserContextForAI(context) {
    if (!context) {
      return 'No user context available.';
    }

    let formatted = '=== USER CONTEXT ===\n\n';
    
    // Profile information
    if (context.profile) {
      const { firstName, lastName, phone, email } = context.profile;
      if (firstName) {
        formatted += `User Name: ${firstName}${lastName ? ` ${lastName}` : ''}\n`;
      }
      if (phone) {
        formatted += `Phone: ${phone}\n`;
      }
      if (email) {
        formatted += `Email: ${email}\n`;
      }
      formatted += '\n';
    }

    // Bookings summary
    if (context.bookings) {
      const totalBookings = context.bookings.total || 0;
      const chatBookings = context.bookings.chat?.length || 0;
      const calls = context.bookings.database?.calls?.length || 0;
      const appointments = context.bookings.database?.appointments?.length || 0;
      
      if (totalBookings > 0) {
        formatted += `Bookings Summary:\n`;
        if (chatBookings > 0) formatted += `- Chat bookings: ${chatBookings}\n`;
        if (calls > 0) formatted += `- Call appointments: ${calls}\n`;
        if (appointments > 0) formatted += `- In-person appointments: ${appointments}\n`;
        formatted += '\n';
      }
    }

    // Conversation stats
    if (context.conversation) {
      const { totalMessages, sessionsCount } = context.conversation;
      if (totalMessages > 0) {
        formatted += `Conversation History: ${totalMessages} messages across ${sessionsCount} session(s)\n`;
      }
    }

    formatted += '=== END USER CONTEXT ===\n';
    return formatted;
  }

  /**
   * Get comprehensive context for AI response generation
   */
  async getContextForAI(userId, sessionId = null, includeHistory = true, historyLimit = 15) {
    try {
      const context = await this.getUserContext(userId);
      const history = includeHistory 
        ? this.getConversationHistory(userId, sessionId, historyLimit)
        : [];
      
      return {
        userContext: context,
        conversationHistory: history,
        formattedContext: this.formatUserContextForAI(context),
        formattedHistory: this.formatConversationHistory(history)
      };
    } catch (error) {
      logger.error(`Failed to get context for AI for ${userId}:`, error);
      return {
        userContext: null,
        conversationHistory: [],
        formattedContext: 'No user context available.',
        formattedHistory: ''
      };
    }
  }

  /**
   * Check if user has previous bookings
   */
  async hasPreviousBookings(userId) {
    try {
      const bookings = await this.getUserBookings(userId);
      return bookings.total > 0;
    } catch (error) {
      logger.error(`Failed to check previous bookings for ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if user has provided name
   */
  async hasUserProvidedName(userId) {
    try {
      const profile = this.getUserProfile(userId);
      const dbUser = await database.getUser(userId);
      return !!(profile?.firstName || profile?.name || dbUser?.firstName);
    } catch (error) {
      logger.error(`Failed to check if user provided name for ${userId}:`, error);
      return false;
    }
  }
}

module.exports = new ContextRetriever();

