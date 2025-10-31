const config = require('../config');
const logger = require('../utils/logger');
const database = require('./database');
const contextRetriever = require('./contextRetriever');

class AIFunctionCallingSystem {
  constructor() {
    this.functions = new Map();
    this.registerCoreFunctions();
  }

  registerCoreFunctions() {
    // Service selection function
    this.functions.set('select_service', {
      name: 'select_service',
      description: 'Select an advisory service for the user',
      parameters: {
        type: 'object',
        properties: {
          service_id: {
            type: 'number',
            description: 'Service ID: 1=Finance, 2=Legal, 3=Education, 4=Career, 5=Healthcare'
          },
          service_name: {
            type: 'string',
            description: 'Human-readable service name'
          }
        },
        required: ['service_id', 'service_name']
      }
    });

    // Appointment type selection
    this.functions.set('select_appointment_type', {
      name: 'select_appointment_type',
      description: 'Select appointment type (call or in-person)',
      parameters: {
        type: 'object',
        properties: {
          type_id: {
            type: 'number',
            description: 'Appointment type: 1=Call, 2=In-Person'
          },
          type_name: {
            type: 'string',
            description: 'Human-readable appointment type'
          }
        },
        required: ['type_id', 'type_name']
      }
    });

    // Location selection
    this.functions.set('select_location', {
      name: 'select_location',
      description: 'Select office location for appointment',
      parameters: {
        type: 'object',
        properties: {
          location_id: {
            type: 'number',
            description: 'Location ID: 1=Richmond, 2=Wembley, 3=Putney, 4=Brent Cross'
          },
          location_name: {
            type: 'string',
            description: 'Human-readable location name'
          }
        },
        required: ['location_id', 'location_name']
      }
    });

    // Contact information
    this.functions.set('set_contact_info', {
      name: 'set_contact_info',
      description: 'Store user contact information',
      parameters: {
        type: 'object',
        properties: {
          contact_number: {
            type: 'string',
            description: 'User contact phone number'
          }
        },
        required: ['contact_number']
      }
    });

    // Schedule appointment
    this.functions.set('schedule_appointment', {
      name: 'schedule_appointment',
      description: 'Schedule an appointment with specific date and time',
      parameters: {
        type: 'object',
        properties: {
          day: {
            type: 'string',
            description: 'Day of the week (Monday-Friday)'
          },
          time: {
            type: 'string',
            description: 'Time in HH:MM format (09:00-16:00)'
          }
        },
        required: ['day', 'time']
      }
    });

    // Show services menu
    this.functions.set('show_services_menu', {
      name: 'show_services_menu',
      description: 'Display available advisory services',
      parameters: {
        type: 'object',
        properties: {}
      }
    });

    // Show appointment types
    this.functions.set('show_appointment_types', {
      name: 'show_appointment_types',
      description: 'Display available appointment types',
      parameters: {
        type: 'object',
        properties: {}
      }
    });

    // Show locations
    this.functions.set('show_locations', {
      name: 'show_locations',
      description: 'Display available office locations',
      parameters: {
        type: 'object',
        properties: {}
      }
    });

    // Confirm appointment
    this.functions.set('confirm_appointment', {
      name: 'confirm_appointment',
      description: 'Confirm and finalize the appointment booking',
      parameters: {
        type: 'object',
        properties: {}
      }
    });

    // Reset conversation
    this.functions.set('reset_conversation', {
      name: 'reset_conversation',
      description: 'Reset the conversation to start over',
      parameters: {
        type: 'object',
        properties: {}
      }
    });

    // Collect user name
    this.functions.set('collect_user_name', {
      name: 'collect_user_name',
      description: 'Collect and store user name information',
      parameters: {
        type: 'object',
        properties: {
          firstName: {
            type: 'string',
            description: 'User first name'
          },
          lastName: {
            type: 'string',
            description: 'User last name'
          }
        },
        required: ['firstName']
      }
    });

    // Collect contact information
    this.functions.set('collect_contact_info', {
      name: 'collect_contact_info',
      description: 'Collect and store user contact information',
      parameters: {
        type: 'object',
        properties: {
          phone: {
            type: 'string',
            description: 'User phone number'
          },
          email: {
            type: 'string',
            description: 'User email address'
          },
          preferredContact: {
            type: 'string',
            description: 'Preferred contact method: phone or email'
          }
        },
        required: ['phone']
      }
    });

    // Book a call appointment
    this.functions.set('book_call', {
      name: 'book_call',
      description: 'Book a call appointment with the user',
      parameters: {
        type: 'object',
        properties: {
          preferredDate: {
            type: 'string',
            description: 'Preferred date for the call (YYYY-MM-DD format)'
          },
          preferredTime: {
            type: 'string',
            description: 'Preferred time for the call (HH:MM format)'
          },
          timezone: {
            type: 'string',
            description: 'User timezone (e.g., UTC, EST, PST)'
          },
          notes: {
            type: 'string',
            description: 'Additional notes or requirements for the call'
          }
        },
        required: ['preferredDate', 'preferredTime']
      }
    });

    // Confirm call booking
    this.functions.set('confirm_call_booking', {
      name: 'confirm_call_booking',
      description: 'Confirm and finalize the call booking',
      parameters: {
        type: 'object',
        properties: {}
      }
    });

    // Show user bookings
    this.functions.set('show_user_bookings', {
      name: 'show_user_bookings',
      description: 'Show user their existing bookings (calls and appointments)',
      parameters: {
        type: 'object',
        properties: {}
      }
    });

    // Context retrieval functions (MCP-like interface)
    
    // Get user context
    this.functions.set('get_user_context', {
      name: 'get_user_context',
      description: 'Retrieve user context including profile, bookings, and conversation history. Use this to understand who the user is, their previous bookings, and conversation history before responding.',
      parameters: {
        type: 'object',
        properties: {}
      }
    });

    // Get conversation history
    this.functions.set('get_conversation_history', {
      name: 'get_conversation_history',
      description: 'Retrieve recent conversation history with the user. Use this to understand what was discussed previously and provide context-aware responses.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of messages to retrieve (default: 20)',
            default: 20
          }
        }
      }
    });

    // Search user messages
    this.functions.set('search_user_messages', {
      name: 'search_user_messages',
      description: 'Search previous messages from the user to find specific information or topics discussed. Use this when you need to recall specific details from past conversations.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to find in previous messages'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 5)',
            default: 5
          }
        },
        required: ['query']
      }
    });

    // Get user profile
    this.functions.set('get_user_profile', {
      name: 'get_user_profile',
      description: 'Retrieve user profile information including name, contact details, and preferences. Use this when you need to know user details or check if information is already collected.',
      parameters: {
        type: 'object',
        properties: {}
      }
    });
  }

  async executeFunction(functionName, parameters, userId, conversationService) {
    try {
      switch (functionName) {
        case 'select_service':
          return await this.handleSelectService(parameters, userId, conversationService);
        
        case 'select_appointment_type':
          return await this.handleSelectAppointmentType(parameters, userId, conversationService);
        
        case 'select_location':
          return await this.handleSelectLocation(parameters, userId, conversationService);
        
        case 'set_contact_info':
          return await this.handleSetContactInfo(parameters, userId, conversationService);
        
        case 'schedule_appointment':
          return await this.handleScheduleAppointment(parameters, userId, conversationService);
        
        case 'show_services_menu':
          return await this.handleShowServicesMenu(userId);
        
        case 'show_appointment_types':
          return await this.handleShowAppointmentTypes(userId);
        
        case 'show_locations':
          return await this.handleShowLocations(userId);
        
        case 'confirm_appointment':
          return await this.handleConfirmAppointment(userId, conversationService);
        
        case 'reset_conversation':
          return await this.handleResetConversation(userId, conversationService);
        
        case 'collect_user_name':
          return await this.handleCollectUserName(parameters, userId, conversationService);
        
        case 'collect_contact_info':
          return await this.handleCollectContactInfo(parameters, userId, conversationService);
        
        case 'book_call':
          return await this.handleBookCall(parameters, userId, conversationService);
        
        case 'confirm_call_booking':
          return await this.handleConfirmCallBooking(userId, conversationService);
        
        case 'show_user_bookings':
          return await this.handleShowUserBookings(userId, conversationService);
        
        case 'get_user_context':
          return await this.handleGetUserContext(userId);
        
        case 'get_conversation_history':
          return await this.handleGetConversationHistory(userId, parameters);
        
        case 'search_user_messages':
          return await this.handleSearchUserMessages(userId, parameters);
        
        case 'get_user_profile':
          return await this.handleGetUserProfile(userId);
        
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }
    } catch (error) {
      logger.error(`Error executing function ${functionName}:`, error);
      return {
        success: false,
        error: error.message,
        message: `Sorry, I encountered an error while processing your request. Please try again.`
      };
    }
  }

  async handleSelectService(parameters, userId, conversationService) {
    const { service_id, service_name } = parameters;
    
    await conversationService.updateConversation(userId, {
      selectedService: service_id,
      serviceName: service_name,
      state: 'SERVICE_SELECTED'
    });

    return {
      success: true,
      message: `Great! I've selected ${service_name} as your advisory service. How would you like to proceed?`,
      next_action: 'show_appointment_types',
      data: { service_id, service_name }
    };
  }

  async handleSelectAppointmentType(parameters, userId, conversationService) {
    const { type_id, type_name } = parameters;
    
    await conversationService.updateConversation(userId, {
      appointmentType: type_id,
      state: 'APPOINTMENT_TYPE_SELECTED'
    });

    return {
      success: true,
      message: `Perfect! You've chosen a ${type_name}. Now I'll need your contact information to proceed.`,
      next_action: 'request_contact',
      data: { type_id, type_name }
    };
  }

  async handleSelectLocation(parameters, userId, conversationService) {
    const { location_id, location_name } = parameters;
    
    await conversationService.updateConversation(userId, {
      selectedLocation: location_id,
      locationName: location_name,
      state: 'LOCATION_SELECTED'
    });

    return {
      success: true,
      message: `Excellent! I've noted your preference for the ${location_name} office. Now let's schedule your appointment.`,
      next_action: 'request_schedule',
      data: { location_id, location_name }
    };
  }

  async handleSetContactInfo(parameters, userId, conversationService) {
    const { contact_number } = parameters;
    
    await conversationService.updateConversation(userId, {
      contactNumber: contact_number,
      state: 'CONTACT_PROVIDED'
    });

    return {
      success: true,
      message: `Thank you! I've saved your contact number. Now let's choose your preferred location.`,
      next_action: 'show_locations',
      data: { contact_number }
    };
  }

  async handleScheduleAppointment(parameters, userId, conversationService) {
    const { day, time } = parameters;
    
    await conversationService.updateConversation(userId, {
      selectedDay: day,
      selectedTime: time,
      state: 'SCHEDULED'
    });

    return {
      success: true,
      message: `Perfect! I've scheduled your appointment for ${day} at ${time}. Let me confirm all the details.`,
      next_action: 'confirm_appointment',
      data: { day, time }
    };
  }

  async handleShowServicesMenu(userId) {
    const services = [
      { id: 1, name: 'Finance', emoji: '💼' },
      { id: 2, name: 'Legal', emoji: '⚖️' },
      { id: 3, name: 'Education', emoji: '🎓' },
      { id: 4, name: 'Career', emoji: '🚀' },
      { id: 5, name: 'Healthcare', emoji: '🩺' }
    ];

    return {
      success: true,
      message: `Here are our available advisory services:\n\n${services.map(s => `${s.emoji} ${s.name}`).join('\n')}\n\nWhich service interests you?`,
      next_action: 'wait_for_service_selection',
      data: { services }
    };
  }

  async handleShowAppointmentTypes(userId) {
    const types = [
      { id: 1, name: 'Call Appointment', emoji: '📞' },
      { id: 2, name: 'In-Person Visit', emoji: '🏢' }
    ];

    return {
      success: true,
      message: `How would you like to meet?\n\n${types.map(t => `${t.emoji} ${t.name}`).join('\n')}\n\nPlease let me know your preference.`,
      next_action: 'wait_for_appointment_type',
      data: { types }
    };
  }

  async handleShowLocations(userId) {
    const locations = [
      { id: 1, name: 'Richmond' },
      { id: 2, name: 'Wembley' },
      { id: 3, name: 'Putney' },
      { id: 4, name: 'Brent Cross' }
    ];

    return {
      success: true,
      message: `Which location works best for you?\n\n${locations.map((l, i) => `${i + 1}. ${l.name}`).join('\n')}\n\nPlease let me know your preferred location.`,
      next_action: 'wait_for_location_selection',
      data: { locations }
    };
  }

  async handleConfirmAppointment(userId, conversationService) {
    const conversation = await conversationService.getConversation(userId);
    
    if (!conversation) {
      return {
        success: false,
        message: 'I couldn\'t find your appointment details. Let\'s start over.'
      };
    }

    const confirmationMessage = `📋 **Appointment Confirmation**

✅ Service: ${conversation.serviceName}
✅ Type: ${conversation.appointmentType === 1 ? 'Call Appointment' : 'In-Person Visit'}
✅ Contact: ${conversation.contactNumber}
✅ Location: ${conversation.locationName}
✅ Day: ${conversation.selectedDay}
✅ Time: ${conversation.selectedTime}

Your appointment has been successfully booked! You'll receive a confirmation message shortly.`;

    await conversationService.updateConversation(userId, {
      state: 'COMPLETED',
      appointmentId: `APT-${Date.now()}`
    });

    return {
      success: true,
      message: confirmationMessage,
      next_action: 'completed',
      data: { appointment_id: `APT-${Date.now()}` }
    };
  }

  async handleResetConversation(userId, conversationService) {
    await conversationService.resetConversation(userId);
    
    return {
      success: true,
      message: 'I\'ve reset our conversation. How can I help you today?',
      next_action: 'show_services_menu',
      data: {}
    };
  }

  async handleCollectUserName(parameters, userId, conversationService) {
    const { firstName, lastName } = parameters;
    
    // Get or create user in database
    let user = await database.getUser(userId);
    if (!user) {
      user = await database.createUser({
        telegramId: userId,
        firstName: firstName,
        lastName: lastName || '',
        username: null
      });
    } else {
      user = await database.updateUser(userId, {
        firstName: firstName,
        lastName: lastName || ''
      });
    }

    // Update conversation state
    await conversationService.updateConversation(userId, {
      state: 'NAME_COLLECTED',
      firstName: firstName,
      lastName: lastName || ''
    });

    return {
      success: true,
      message: `Thank you, ${firstName}! Now I'll need your contact information to proceed with the booking.`,
      next_action: 'request_contact',
      data: { firstName, lastName: lastName || '' }
    };
  }

  async handleCollectContactInfo(parameters, userId, conversationService) {
    const { phone, email, preferredContact } = parameters;
    
    // Update user in database
    const user = await database.updateUser(userId, {
      phone: phone,
      email: email || null,
      preferredContact: preferredContact || 'phone'
    });

    // Update conversation state
    await conversationService.updateConversation(userId, {
      state: 'CONTACT_COLLECTED',
      contactNumber: phone,
      email: email || null
    });

    return {
      success: true,
      message: `Perfect! I've saved your contact information. Now let's schedule your call. When would you prefer to have the call?`,
      next_action: 'request_schedule',
      data: { phone, email: email || null }
    };
  }

  async handleBookCall(parameters, userId, conversationService) {
    const { preferredDate, preferredTime, timezone, notes } = parameters;
    
    // Get user and conversation data
    const user = await database.getUser(userId);
    const conversation = await conversationService.getConversation(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'I need to collect your information first. Let me start by getting your name.'
      };
    }

    // Create call booking
    const call = await database.createCall({
      userId: user.id,
      telegramId: userId,
      serviceId: conversation.selectedService,
      serviceName: conversation.serviceName,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      userPhone: user.phone,
      userEmail: user.email,
      preferredTime: preferredTime,
      preferredDate: preferredDate,
      timezone: timezone || 'UTC',
      notes: notes || ''
    });

    // Update conversation state
    await conversationService.updateConversation(userId, {
      state: 'CALL_SCHEDULED',
      callId: call.id,
      selectedDay: preferredDate,
      selectedTime: preferredTime
    });

    return {
      success: true,
      message: `Excellent! I've scheduled your call for ${preferredDate} at ${preferredTime} ${timezone || 'UTC'}. Let me confirm all the details.`,
      next_action: 'confirm_call_booking',
      data: { callId: call.id, date: preferredDate, time: preferredTime }
    };
  }

  async handleConfirmCallBooking(userId, conversationService) {
    const conversation = await conversationService.getConversation(userId);
    const user = await database.getUser(userId);
    
    if (!conversation.callId) {
      return {
        success: false,
        message: 'I don\'t have a call booking to confirm. Let\'s start over.'
      };
    }

    const call = await database.getCall(conversation.callId);
    
    if (!call) {
      return {
        success: false,
        message: 'I couldn\'t find your call booking. Let\'s start over.'
      };
    }

    const confirmationMessage = `📞 **Call Booking Confirmed**

✅ **Service**: ${call.serviceName}
✅ **Name**: ${call.userName}
✅ **Phone**: ${call.userPhone}
✅ **Email**: ${call.userEmail || 'Not provided'}
✅ **Date**: ${call.preferredDate}
✅ **Time**: ${call.preferredTime} ${call.timezone}
✅ **Booking ID**: ${call.id}

Your call has been successfully booked! Our advisor will contact you at the scheduled time.

📝 **Notes**: ${call.notes || 'None'}

You'll receive a confirmation message shortly. Thank you for choosing Axis Point Advisory!`;

    // Update conversation state
    await conversationService.updateConversation(userId, {
      state: 'COMPLETED'
    });

    return {
      success: true,
      message: confirmationMessage,
      next_action: 'completed',
      data: { callId: call.id }
    };
  }

  async handleShowUserBookings(userId, conversationService) {
    const user = await database.getUser(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'I don\'t have any information about you. Please start by telling me your name.'
      };
    }

    const calls = await database.getUserCalls(userId);
    const appointments = await database.getUserAppointments(userId);

    let message = `📋 **Your Bookings**

👤 **Name**: ${user.firstName} ${user.lastName || ''}
📞 **Phone**: ${user.phone}
📧 **Email**: ${user.email || 'Not provided'}

`;

    if (calls.length > 0) {
      message += `📞 **Call Appointments** (${calls.length}):\n`;
      calls.forEach(call => {
        const status = call.status === 'pending' ? '⏳ Pending' : 
                      call.status === 'scheduled' ? '✅ Scheduled' :
                      call.status === 'completed' ? '✅ Completed' : '❌ Cancelled';
        message += `• ${call.serviceName} - ${call.preferredDate} at ${call.preferredTime} ${status}\n`;
        message += `  ID: ${call.id}\n\n`;
      });
    }

    if (appointments.length > 0) {
      message += `🏢 **In-Person Appointments** (${appointments.length}):\n`;
      appointments.forEach(appointment => {
        const status = appointment.status === 'scheduled' ? '✅ Scheduled' :
                      appointment.status === 'completed' ? '✅ Completed' : '❌ Cancelled';
        message += `• ${appointment.serviceName} - ${appointment.appointmentDate} at ${appointment.appointmentTime}\n`;
        message += `  Location: ${appointment.locationName} ${status}\n`;
        message += `  ID: ${appointment.id}\n\n`;
      });
    }

    if (calls.length === 0 && appointments.length === 0) {
      message += `You don't have any bookings yet. Would you like to book a call or appointment?`;
    }

    return {
      success: true,
      message: message,
      next_action: 'show_services_menu',
      data: { callsCount: calls.length, appointmentsCount: appointments.length }
    };
  }

  // Context retrieval handlers
  async handleGetUserContext(userId) {
    try {
      const context = await contextRetriever.getUserContext(userId);
      
      if (!context) {
        return {
          success: true,
          message: 'No user context found. This appears to be a new user.',
          data: { context: null }
        };
      }

      const formatted = contextRetriever.formatUserContextForAI(context);
      
      return {
        success: true,
        message: `User context retrieved. ${context.profile?.firstName ? `User is ${context.profile.firstName}.` : 'User name not yet collected.'} ${context.bookings?.total > 0 ? `User has ${context.bookings.total} previous booking(s).` : 'User has no previous bookings.'}`,
        data: { context, formatted },
        formattedContext: formatted
      };
    } catch (error) {
      logger.error(`Error in handleGetUserContext for ${userId}:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Unable to retrieve user context.'
      };
    }
  }

  async handleGetConversationHistory(userId, parameters) {
    try {
      const limit = parameters?.limit || 20;
      const history = contextRetriever.getConversationHistory(userId, null, limit);
      const formatted = contextRetriever.formatConversationHistory(history);
      
      if (history.length === 0) {
        return {
          success: true,
          message: 'No conversation history found. This is the start of the conversation.',
          data: { history: [], formatted }
        };
      }

      return {
        success: true,
        message: `Retrieved ${history.length} previous message(s) from conversation history.`,
        data: { history, formatted },
        formattedHistory: formatted
      };
    } catch (error) {
      logger.error(`Error in handleGetConversationHistory for ${userId}:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Unable to retrieve conversation history.'
      };
    }
  }

  async handleSearchUserMessages(userId, parameters) {
    try {
      const { query, limit = 5 } = parameters;
      
      if (!query) {
        return {
          success: false,
          message: 'Search query is required.'
        };
      }

      const results = contextRetriever.searchMessages(userId, query, limit);
      
      if (results.length === 0) {
        return {
          success: true,
          message: `No messages found matching "${query}".`,
          data: { results: [], query }
        };
      }

      const formatted = results.map(r => `${r.role}: ${r.text} (${r.timestamp})`).join('\n');
      
      return {
        success: true,
        message: `Found ${results.length} message(s) matching "${query}".`,
        data: { results, query, formatted }
      };
    } catch (error) {
      logger.error(`Error in handleSearchUserMessages for ${userId}:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Unable to search user messages.'
      };
    }
  }

  async handleGetUserProfile(userId) {
    try {
      const profile = contextRetriever.getUserProfile(userId);
      const dbUser = await database.getUser(userId);
      
      // Merge profile data
      const mergedProfile = {
        ...profile,
        firstName: dbUser?.firstName || profile?.firstName,
        lastName: dbUser?.lastName || profile?.lastName,
        phone: dbUser?.phone || profile?.phone,
        email: dbUser?.email || profile?.email,
        preferredContact: dbUser?.preferredContact || profile?.preferredContact
      };

      const hasName = !!(mergedProfile.firstName || mergedProfile.name);
      const hasContact = !!(mergedProfile.phone || mergedProfile.email);

      let message = 'User profile retrieved. ';
      if (hasName) {
        message += `Name: ${mergedProfile.firstName || mergedProfile.name}${mergedProfile.lastName ? ` ${mergedProfile.lastName}` : ''}. `;
      } else {
        message += 'Name not yet collected. ';
      }
      if (hasContact) {
        message += `Contact: ${mergedProfile.phone || mergedProfile.email || 'Not provided'}.`;
      } else {
        message += 'Contact information not yet collected.';
      }

      return {
        success: true,
        message,
        data: { profile: mergedProfile, hasName, hasContact }
      };
    } catch (error) {
      logger.error(`Error in handleGetUserProfile for ${userId}:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Unable to retrieve user profile.'
      };
    }
  }

  getAvailableFunctions() {
    return Array.from(this.functions.values());
  }

  getFunctionSchema(functionName) {
    return this.functions.get(functionName);
  }
}

module.exports = new AIFunctionCallingSystem();
