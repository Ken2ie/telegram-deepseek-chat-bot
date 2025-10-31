const config = require('../config');
const logger = require('../utils/logger');
const aiFunctions = require('./ai-functions');
const contextRetriever = require('./contextRetriever');

class DeepSeekService {
  constructor() {
    this.apiKey = config.DEEPSEEK_API_KEY;
    this.model = config.DEEPSEEK_MODEL;
    this.baseUrl = config.DEEPSEEK_BASE_URL;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async generateResponse(messages, options = {}) {
    try {
      const requestBody = {
        model: this.model,
        messages: messages,
        stream: false,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        ...options
      };

      logger.info('Sending request to DeepSeek API', {
        model: this.model,
        messageCount: messages.length,
        temperature: requestBody.temperature
      });

      const response = await this.makeApiRequest(requestBody);
      
      if (response.choices && response.choices.length > 0) {
        const aiResponse = response.choices[0].message.content;
        
        logger.info('Received response from DeepSeek API', {
          responseLength: aiResponse.length,
          usage: response.usage
        });

        return {
          success: true,
          content: aiResponse,
          usage: response.usage
        };
      } else {
        throw new Error('No response choices received from DeepSeek API');
      }
    } catch (error) {
      logger.error('Error generating DeepSeek response:', error);
      return {
        success: false,
        error: error.message,
        content: 'I apologize, but I\'m having trouble processing your request right now. Please try again later.'
      };
    }
  }

  async makeApiRequest(requestBody, retryCount = 0) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        logger.warn(`DeepSeek API request failed, retrying... (${retryCount + 1}/${this.maxRetries})`, {
          error: error.message
        });
        
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.makeApiRequest(requestBody, retryCount + 1);
      }
      
      throw error;
    }
  }

  async generateBotResponse(userMessage, conversationContext = {}, userId = null, conversationService = null) {
    try {
      // Get conversation history and user context for context-aware responses
      let conversationHistory = [];
      let userContextData = null;
      
      if (userId) {
        try {
          // Get recent conversation history (last 15 messages)
          conversationHistory = contextRetriever.getConversationHistory(userId, null, 15);
          
          // Get user context
          userContextData = await contextRetriever.getUserContext(userId);
        } catch (error) {
          logger.warn(`Failed to retrieve context for ${userId}:`, error.message);
        }
      }

      const systemPrompt = this.buildSystemPrompt(conversationContext, userContextData, conversationHistory);
      const availableFunctions = aiFunctions.getAvailableFunctions();
      
      // Build message array with conversation history
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        // Format conversation history for the AI
        for (const msg of conversationHistory.slice(-10)) { // Last 10 messages
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text || ''
          });
        }
      }
      
      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      const requestBody = {
        model: this.model,
        messages: messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 1000,
        tools: availableFunctions.map(func => ({
          type: 'function',
          function: func
        }))
      };

      logger.info('Sending request to DeepSeek API with function calling', {
        model: this.model,
        messageCount: messages.length,
        functionCount: availableFunctions.length
      });

      const response = await this.makeApiRequest(requestBody);
      
      if (response.choices && response.choices.length > 0) {
        const choice = response.choices[0];
        
        // Check if AI wants to call a function
        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
          return await this.handleFunctionCalls(choice.message.tool_calls, userId, userMessage, conversationService);
        } else {
          // Regular text response
          const aiResponse = choice.message.content;
          
          logger.info('Received text response from DeepSeek API', {
            responseLength: aiResponse.length,
            usage: response.usage
          });

          return {
            success: true,
            type: 'text',
            content: aiResponse,
            usage: response.usage
          };
        }
      } else {
        throw new Error('No response choices received from DeepSeek API');
      }
    } catch (error) {
      logger.error('Error generating bot response:', error);
      return {
        success: false,
        error: error.message,
        content: 'I\'m here to help! Let me guide you through booking an appointment or call. What service are you interested in?'
      };
    }
  }

  async handleFunctionCalls(toolCalls, userId, originalMessage, conversationService) {
    try {
      const results = [];
      
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const parameters = JSON.parse(toolCall.function.arguments);
        
        logger.info(`Executing function: ${functionName}`, { parameters });
        
        const result = await aiFunctions.executeFunction(functionName, parameters, userId, conversationService);
        results.push({
          functionName,
          parameters,
          result
        });
      }

      // Generate follow-up response based on function results
      const followUpResponse = await this.generateFollowUpResponse(results, originalMessage);
      
      return {
        success: true,
        type: 'function_call',
        content: followUpResponse.content,
        functions: results,
        usage: followUpResponse.usage
      };
    } catch (error) {
      logger.error('Error handling function calls:', error);
      return {
        success: false,
        error: error.message,
        content: 'Let me help you with that! What service would you like to book?'
      };
    }
  }

  async generateFollowUpResponse(functionResults, originalMessage) {
    try {
      const systemPrompt = `You are a helpful assistant. Based on the function execution results, provide a natural follow-up response to the user's original message. Be conversational and helpful.`;
      
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Original message: "${originalMessage}"\n\nFunction results: ${JSON.stringify(functionResults, null, 2)}`
        }
      ];

      const response = await this.generateResponse(messages, {
        temperature: 0.8,
        maxTokens: 300
      });

      return response;
    } catch (error) {
      logger.error('Error generating follow-up response:', error);
      return {
        success: false,
        content: 'I\'ve processed your request. How can I help you further?'
      };
    }
  }

  buildSystemPrompt(conversationContext, userContextData = null, conversationHistory = []) {
    let basePrompt = `You are a professional AI assistant for Axis Point Advisory, a comprehensive advisory service company. You help clients with:

1. Finance Advisory (💼) - Financial planning, investment advice, budgeting
2. Legal Advisory (⚖️) - Legal consultation, document review, compliance
3. Education Advisory (🎓) - Educational planning, career guidance, skill development
4. Career Advisory (🚀) - Job search, career transitions, professional development
5. Healthcare Advisory (🩺) - Health insurance, medical planning, wellness guidance

You have access to functions that allow you to:
- Select services and appointment types
- Store contact information
- Schedule appointments and calls
- Collect user names and contact details
- Book call appointments with specific dates/times
- Show menus and options
- Confirm bookings
- Show user's existing bookings
- Reset conversations
- Get user context (profile, bookings, conversation history)
- Get conversation history
- Search previous messages
- Get user profile information

CRITICAL BOOKING PROCEDURE:
When users want to book calls or appointments, follow this EXACT procedure:

1. **For Call Bookings**: 
   - If user says "book a call" or "schedule a call" → Call select_service function first
   - Then call collect_user_name function to get their name
   - Then call collect_contact_info function to get phone/email
   - Then call book_call function to schedule the call
   - Finally call confirm_call_booking function

2. **For Appointment Bookings**:
   - If user says "book appointment" or "in-person visit" → Call select_service function first
   - Then call select_appointment_type function
   - Then call collect_contact_info function
   - Then call select_location function
   - Then call schedule_appointment function
   - Finally call confirm_appointment function

3. **For Service Questions**:
   - If user asks about services → Call show_services_menu function

4. **For Existing Bookings**:
   - If user asks "my bookings" or "show bookings" → Call show_user_bookings function

NEVER give generic error messages like "technical issue" or "something went wrong". Always use the appropriate functions to handle requests. Be direct and procedural - take action immediately when users express booking intent.

Your role is to:
- Provide helpful, accurate, and professional advice
- Be empathetic and understanding
- Use functions to take concrete actions when appropriate
- Guide users through the appointment booking process
- Maintain a professional yet friendly tone
- Keep responses concise but informative
- ALWAYS execute functions instead of giving error messages

CONTEXT-AWARE RESPONSES:
You should provide context-aware responses by using the context retrieval functions:
- Use get_user_context() to understand who the user is, their previous bookings, and conversation history
- Use get_conversation_history() to understand what was discussed previously
- Use get_user_profile() to check if user information has already been collected
- Use search_user_messages() to find specific information from past conversations
- When a user mentions their name or provides information, remember it and use it in future responses
- Reference previous conversations and bookings when relevant

Current conversation context:`;

    let contextInfo = '';
    
    // Add user context if available
    if (userContextData) {
      const { profile, bookings, conversation } = userContextData;
      if (profile?.firstName) {
        contextInfo += `\n- User name: ${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ''}`;
      }
      if (profile?.phone || profile?.email) {
        contextInfo += `\n- User contact: ${profile.phone || profile.email || 'Not provided'}`;
      }
      if (bookings?.total > 0) {
        contextInfo += `\n- User has ${bookings.total} previous booking(s)`;
      }
      if (conversation?.totalMessages > 0) {
        contextInfo += `\n- Conversation history: ${conversation.totalMessages} messages`;
      }
    }
    
    if (conversationContext.selectedService) {
      const serviceNames = {
        1: 'Finance Advisory',
        2: 'Legal Advisory', 
        3: 'Education Advisory',
        4: 'Career Advisory',
        5: 'Healthcare Advisory'
      };
      contextInfo += `\n- User has selected: ${serviceNames[conversationContext.selectedService] || 'Unknown Service'}`;
    }

    if (conversationContext.appointmentType) {
      const appointmentTypes = {
        1: 'Call Appointment',
        2: 'In-Person Visit'
      };
      contextInfo += `\n- Appointment type: ${appointmentTypes[conversationContext.appointmentType] || 'Unknown'}`;
    }

    if (conversationContext.selectedLocation) {
      const locations = {
        1: 'Richmond',
        2: 'Wembley', 
        3: 'Putney',
        4: 'Brent Cross'
      };
      contextInfo += `\n- Preferred location: ${locations[conversationContext.selectedLocation] || 'Unknown'}`;
    }

    if (conversationContext.state) {
      contextInfo += `\n- Current state: ${conversationContext.state}`;
    }

    if (conversationHistory && conversationHistory.length > 0) {
      contextInfo += `\n- Recent conversation: ${conversationHistory.length} message(s) available in history`;
    }

    return basePrompt + contextInfo + '\n\nIMPORTANT: Be context-aware and conversational. Remember user names, reference previous conversations, and use the context retrieval functions to provide personalized responses. Respond naturally and use functions when users want to take actions like booking appointments or selecting services. NEVER give error messages - always execute the appropriate function.';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testConnection() {
    try {
      const testMessages = [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Hello, this is a test message.'
        }
      ];

      const response = await this.generateResponse(testMessages, {
        temperature: 0.1,
        maxTokens: 50
      });

      if (response.success) {
        logger.info('DeepSeek API connection test successful');
        return true;
      } else {
        logger.error('DeepSeek API connection test failed:', response.error);
        return false;
      }
    } catch (error) {
      logger.error('DeepSeek API connection test error:', error);
      return false;
    }
  }
}

module.exports = new DeepSeekService();
