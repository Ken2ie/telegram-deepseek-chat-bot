const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class JSONDatabase {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.appointmentsFile = path.join(this.dataDir, 'appointments.json');
    this.callsFile = path.join(this.dataDir, 'calls.json');
    this.conversationsFile = path.join(this.dataDir, 'conversations.json');
    
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize files with empty arrays if they don't exist
      await this.initializeFile(this.usersFile, []);
      await this.initializeFile(this.appointmentsFile, []);
      await this.initializeFile(this.callsFile, []);
      await this.initializeFile(this.conversationsFile, []);
      
      logger.info('JSON database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize JSON database:', error);
      throw error;
    }
  }

  async initializeFile(filePath, defaultValue) {
    try {
      await fs.access(filePath);
    } catch (error) {
      // File doesn't exist, create it with default value
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
    }
  }

  async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Failed to read file ${filePath}:`, error);
      throw error;
    }
  }

  async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error(`Failed to write file ${filePath}:`, error);
      throw error;
    }
  }

  // User management
  async createUser(userData) {
    try {
      const users = await this.readFile(this.usersFile);
      
      // Check if user already exists
      const existingUser = users.find(u => u.telegramId === userData.telegramId);
      if (existingUser) {
        // Update existing user
        Object.assign(existingUser, userData, { updatedAt: new Date().toISOString() });
        await this.writeFile(this.usersFile, users);
        logger.info(`User updated: ${userData.telegramId}`);
        return existingUser;
      }
      
      // Create new user
      const newUser = {
        id: this.generateId(),
        telegramId: userData.telegramId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        email: userData.email || null,
        phone: userData.phone || null,
        preferredContact: userData.preferredContact || 'phone',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      users.push(newUser);
      await this.writeFile(this.usersFile, users);
      
      logger.info(`New user created: ${newUser.id}`);
      return newUser;
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw error;
    }
  }

  async getUser(telegramId) {
    try {
      const users = await this.readFile(this.usersFile);
      return users.find(u => u.telegramId === telegramId) || null;
    } catch (error) {
      logger.error('Failed to get user:', error);
      throw error;
    }
  }

  async updateUser(telegramId, updates) {
    try {
      const users = await this.readFile(this.usersFile);
      const userIndex = users.findIndex(u => u.telegramId === telegramId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      users[userIndex] = {
        ...users[userIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await this.writeFile(this.usersFile, users);
      logger.info(`User updated: ${telegramId}`);
      return users[userIndex];
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw error;
    }
  }

  // Call booking management
  async createCall(callData) {
    try {
      const calls = await this.readFile(this.callsFile);
      
      const newCall = {
        id: this.generateId(),
        userId: callData.userId,
        telegramId: callData.telegramId,
        serviceId: callData.serviceId,
        serviceName: callData.serviceName,
        userName: callData.userName,
        userPhone: callData.userPhone,
        userEmail: callData.userEmail,
        preferredTime: callData.preferredTime,
        preferredDate: callData.preferredDate,
        timezone: callData.timezone || 'UTC',
        status: 'pending', // pending, scheduled, completed, cancelled
        notes: callData.notes || '',
        advisorNotes: '',
        scheduledAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      calls.push(newCall);
      await this.writeFile(this.callsFile, calls);
      
      logger.info(`New call booking created: ${newCall.id}`);
      return newCall;
    } catch (error) {
      logger.error('Failed to create call:', error);
      throw error;
    }
  }

  async getCall(callId) {
    try {
      const calls = await this.readFile(this.callsFile);
      return calls.find(c => c.id === callId) || null;
    } catch (error) {
      logger.error('Failed to get call:', error);
      throw error;
    }
  }

  async getUserCalls(telegramId) {
    try {
      const calls = await this.readFile(this.callsFile);
      return calls.filter(c => c.telegramId === telegramId);
    } catch (error) {
      logger.error('Failed to get user calls:', error);
      throw error;
    }
  }

  async updateCall(callId, updates) {
    try {
      const calls = await this.readFile(this.callsFile);
      const callIndex = calls.findIndex(c => c.id === callId);
      
      if (callIndex === -1) {
        throw new Error('Call not found');
      }
      
      calls[callIndex] = {
        ...calls[callIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await this.writeFile(this.callsFile, calls);
      logger.info(`Call updated: ${callId}`);
      return calls[callIndex];
    } catch (error) {
      logger.error('Failed to update call:', error);
      throw error;
    }
  }

  // Appointment management (for in-person visits)
  async createAppointment(appointmentData) {
    try {
      const appointments = await this.readFile(this.appointmentsFile);
      
      const newAppointment = {
        id: this.generateId(),
        userId: appointmentData.userId,
        telegramId: appointmentData.telegramId,
        serviceId: appointmentData.serviceId,
        serviceName: appointmentData.serviceName,
        userName: appointmentData.userName,
        userPhone: appointmentData.userPhone,
        userEmail: appointmentData.userEmail,
        locationId: appointmentData.locationId,
        locationName: appointmentData.locationName,
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        status: 'scheduled', // scheduled, completed, cancelled, no_show
        notes: appointmentData.notes || '',
        advisorNotes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      appointments.push(newAppointment);
      await this.writeFile(this.appointmentsFile, appointments);
      
      logger.info(`New appointment created: ${newAppointment.id}`);
      return newAppointment;
    } catch (error) {
      logger.error('Failed to create appointment:', error);
      throw error;
    }
  }

  async getAppointment(appointmentId) {
    try {
      const appointments = await this.readFile(this.appointmentsFile);
      return appointments.find(a => a.id === appointmentId) || null;
    } catch (error) {
      logger.error('Failed to get appointment:', error);
      throw error;
    }
  }

  async getUserAppointments(telegramId) {
    try {
      const appointments = await this.readFile(this.appointmentsFile);
      return appointments.filter(a => a.telegramId === telegramId);
    } catch (error) {
      logger.error('Failed to get user appointments:', error);
      throw error;
    }
  }

  // Conversation management
  async saveConversation(conversationData) {
    try {
      const conversations = await this.readFile(this.conversationsFile);
      
      const conversation = {
        id: this.generateId(),
        telegramId: conversationData.telegramId,
        userId: conversationData.userId,
        state: conversationData.state,
        selectedService: conversationData.selectedService,
        serviceName: conversationData.serviceName,
        appointmentType: conversationData.appointmentType,
        contactNumber: conversationData.contactNumber,
        selectedLocation: conversationData.selectedLocation,
        locationName: conversationData.locationName,
        selectedDay: conversationData.selectedDay,
        selectedTime: conversationData.selectedTime,
        appointmentId: conversationData.appointmentId,
        callId: conversationData.callId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      conversations.push(conversation);
      await this.writeFile(this.conversationsFile, conversations);
      
      logger.info(`Conversation saved: ${conversation.id}`);
      return conversation;
    } catch (error) {
      logger.error('Failed to save conversation:', error);
      throw error;
    }
  }

  async getConversation(telegramId) {
    try {
      const conversations = await this.readFile(this.conversationsFile);
      return conversations.find(c => c.telegramId === telegramId) || null;
    } catch (error) {
      logger.error('Failed to get conversation:', error);
      throw error;
    }
  }

  // Utility functions
  generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get all data for admin purposes
  async getAllData() {
    try {
      const users = await this.readFile(this.usersFile);
      const appointments = await this.readFile(this.appointmentsFile);
      const calls = await this.readFile(this.callsFile);
      const conversations = await this.readFile(this.conversationsFile);
      
      return {
        users,
        appointments,
        calls,
        conversations,
        summary: {
          totalUsers: users.length,
          totalAppointments: appointments.length,
          totalCalls: calls.length,
          totalConversations: conversations.length
        }
      };
    } catch (error) {
      logger.error('Failed to get all data:', error);
      throw error;
    }
  }

  // Backup and restore
  async backup() {
    try {
      const data = await this.getAllData();
      const backupFile = path.join(this.dataDir, `backup_${Date.now()}.json`);
      await fs.writeFile(backupFile, JSON.stringify(data, null, 2));
      logger.info(`Database backed up to: ${backupFile}`);
      return backupFile;
    } catch (error) {
      logger.error('Failed to backup database:', error);
      throw error;
    }
  }
}

module.exports = new JSONDatabase();
