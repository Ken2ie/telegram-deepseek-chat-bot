const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.notifications = new Map();
    this.nextNotificationId = 1;
  }

  async sendAppointmentConfirmation(appointment, bot) {
    try {
      const message = this.buildConfirmationMessage(appointment);
      
      await bot.sendMessage(appointment.chatId, message, {
        parse_mode: 'Markdown'
      });
      
      logger.botActivity(appointment.userId, 'confirmation_sent', {
        appointmentId: appointment.id
      });
      
      return true;
    } catch (error) {
      logger.botError(appointment.userId, error, { 
        action: 'sendAppointmentConfirmation',
        appointmentId: appointment.id 
      });
      throw error;
    }
  }

  async sendAppointmentReminder(appointment, bot) {
    try {
      const message = this.buildReminderMessage(appointment);
      
      await bot.sendMessage(appointment.chatId, message, {
        parse_mode: 'Markdown'
      });
      
      logger.botActivity(appointment.userId, 'reminder_sent', {
        appointmentId: appointment.id
      });
      
      return true;
    } catch (error) {
      logger.botError(appointment.userId, error, { 
        action: 'sendAppointmentReminder',
        appointmentId: appointment.id 
      });
      throw error;
    }
  }

  async sendAppointmentCancellation(appointment, bot, reason = '') {
    try {
      const message = this.buildCancellationMessage(appointment, reason);
      
      await bot.sendMessage(appointment.chatId, message, {
        parse_mode: 'Markdown'
      });
      
      logger.botActivity(appointment.userId, 'cancellation_sent', {
        appointmentId: appointment.id,
        reason
      });
      
      return true;
    } catch (error) {
      logger.botError(appointment.userId, error, { 
        action: 'sendAppointmentCancellation',
        appointmentId: appointment.id 
      });
      throw error;
    }
  }

  buildConfirmationMessage(appointment) {
    const appointmentType = appointment.appointmentType === 1 ? 'Call Appointment' : 'In-Person Visit';
    const scheduledDate = new Date(appointment.scheduledFor);
    
    let message = `✅ **Appointment Confirmed!**\n\n`;
    message += `**Service:** ${appointment.serviceName}\n`;
    message += `**Type:** ${appointmentType}\n`;
    message += `**Date:** ${scheduledDate.toLocaleDateString()}\n`;
    message += `**Time:** ${appointment.selectedTime}\n`;
    
    if (appointment.appointmentType === 2) {
      message += `**Location:** ${appointment.locationName}\n`;
    } else {
      message += `**Contact:** ${appointment.contactNumber}\n`;
    }
    
    message += `\nWe look forward to serving you! 🌟`;
    
    return message;
  }

  buildReminderMessage(appointment) {
    const appointmentType = appointment.appointmentType === 1 ? 'call' : 'visit';
    const scheduledDate = new Date(appointment.scheduledFor);
    
    let message = `🔔 **Appointment Reminder**\n\n`;
    message += `This is a friendly reminder about your upcoming ${appointmentType} appointment:\n\n`;
    message += `**Service:** ${appointment.serviceName}\n`;
    message += `**Date:** ${scheduledDate.toLocaleDateString()}\n`;
    message += `**Time:** ${appointment.selectedTime}\n`;
    
    if (appointment.appointmentType === 2) {
      message += `**Location:** ${appointment.locationName}\n`;
    }
    
    message += `\nPlease be ready for your appointment. If you need to reschedule, please contact us.`;
    
    return message;
  }

  buildCancellationMessage(appointment, reason) {
    const scheduledDate = new Date(appointment.scheduledFor);
    
    let message = `❌ **Appointment Cancelled**\n\n`;
    message += `Your appointment has been cancelled:\n\n`;
    message += `**Service:** ${appointment.serviceName}\n`;
    message += `**Date:** ${scheduledDate.toLocaleDateString()}\n`;
    message += `**Time:** ${appointment.selectedTime}\n`;
    
    if (reason) {
      message += `**Reason:** ${reason}\n`;
    }
    
    message += `\nTo book a new appointment, please start a new session with /start`;
    
    return message;
  }

  async scheduleReminder(appointment, reminderTime) {
    try {
      const notification = {
        id: this.nextNotificationId++,
        appointmentId: appointment.id,
        userId: appointment.userId,
        chatId: appointment.chatId,
        type: 'reminder',
        scheduledFor: reminderTime,
        createdAt: new Date(),
        status: 'scheduled'
      };
      
      this.notifications.set(notification.id, notification);
      
      logger.info('Reminder scheduled', {
        notificationId: notification.id,
        appointmentId: appointment.id,
        scheduledFor: reminderTime
      });
      
      return notification;
    } catch (error) {
      logger.error('Error scheduling reminder:', error);
      throw error;
    }
  }

  async getPendingNotifications() {
    try {
      const now = new Date();
      const allNotifications = Array.from(this.notifications.values());
      
      return allNotifications.filter(notif => 
        notif.status === 'scheduled' && 
        notif.scheduledFor <= now
      );
    } catch (error) {
      logger.error('Error getting pending notifications:', error);
      throw error;
    }
  }

  async markNotificationSent(notificationId) {
    try {
      const notification = this.notifications.get(notificationId);
      
      if (notification) {
        notification.status = 'sent';
        notification.sentAt = new Date();
        
        this.notifications.set(notificationId, notification);
        
        logger.info('Notification marked as sent', {
          notificationId
        });
      }
      
      return notification;
    } catch (error) {
      logger.error('Error marking notification as sent:', error);
      throw error;
    }
  }

  async cleanupOldNotifications() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      let cleanedCount = 0;
      
      for (const [notificationId, notification] of this.notifications.entries()) {
        if (notification.createdAt < sevenDaysAgo) {
          this.notifications.delete(notificationId);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} old notifications`);
      }
      
      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
