const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger');
const moment = require('moment');

// In-memory storage for appointments (in production, use a database)
const appointments = new Map();
let nextAppointmentId = 1;

class AppointmentService {
  async createAppointment(appointmentData) {
    try {
      const appointment = {
        id: nextAppointmentId++,
        userId: appointmentData.userId,
        chatId: appointmentData.chatId,
        serviceId: appointmentData.serviceId,
        serviceName: appointmentData.serviceName,
        appointmentType: appointmentData.appointmentType,
        contactNumber: appointmentData.contactNumber,
        selectedLocation: appointmentData.selectedLocation,
        locationName: appointmentData.locationName,
        selectedDay: appointmentData.selectedDay,
        selectedTime: appointmentData.selectedTime,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledFor: this.calculateScheduledDateTime(
          appointmentData.selectedDay,
          appointmentData.selectedTime
        )
      };

      appointments.set(appointment.id, appointment);
      
      logger.botActivity(appointmentData.userId, 'appointment_created', {
        appointmentId: appointment.id,
        serviceName: appointmentData.serviceName,
        appointmentType: appointmentData.appointmentType === 1 ? 'call' : 'visit'
      });

      return appointment;
    } catch (error) {
      logger.botError(appointmentData.userId, error, { action: 'createAppointment' });
      throw error;
    }
  }

  async getAppointment(appointmentId) {
    try {
      return appointments.get(appointmentId) || null;
    } catch (error) {
      logger.error('Error getting appointment:', error);
      throw error;
    }
  }

  async getAppointmentsByUserId(userId) {
    try {
      const allAppointments = Array.from(appointments.values());
      return allAppointments.filter(apt => apt.userId === userId);
    } catch (error) {
      logger.error('Error getting appointments by user ID:', error);
      throw error;
    }
  }

  async updateAppointment(appointmentId, updates) {
    try {
      const appointment = appointments.get(appointmentId);
      
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      Object.assign(appointment, updates, {
        updatedAt: new Date()
      });

      appointments.set(appointmentId, appointment);
      
      logger.info('Appointment updated', {
        appointmentId,
        updates: Object.keys(updates)
      });

      return appointment;
    } catch (error) {
      logger.error('Error updating appointment:', error);
      throw error;
    }
  }

  async cancelAppointment(appointmentId) {
    try {
      const appointment = await this.updateAppointment(appointmentId, {
        status: 'cancelled'
      });
      
      logger.botActivity(appointment.userId, 'appointment_cancelled', {
        appointmentId
      });
      
      return appointment;
    } catch (error) {
      logger.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  async getAllAppointments() {
    try {
      return Array.from(appointments.values());
    } catch (error) {
      logger.error('Error getting all appointments:', error);
      throw error;
    }
  }

  async getAppointmentsByDate(date) {
    try {
      const allAppointments = await this.getAllAppointments();
      const targetDate = moment(date).format('YYYY-MM-DD');
      
      return allAppointments.filter(apt => {
        const appointmentDate = moment(apt.scheduledFor).format('YYYY-MM-DD');
        return appointmentDate === targetDate;
      });
    } catch (error) {
      logger.error('Error getting appointments by date:', error);
      throw error;
    }
  }

  async getAppointmentsByService(serviceId) {
    try {
      const allAppointments = await this.getAllAppointments();
      return allAppointments.filter(apt => apt.serviceId === serviceId);
    } catch (error) {
      logger.error('Error getting appointments by service:', error);
      throw error;
    }
  }

  async getUpcomingAppointments(hours = 24) {
    try {
      const allAppointments = await this.getAllAppointments();
      const now = new Date();
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
      
      return allAppointments.filter(apt => {
        return apt.scheduledFor > now && apt.scheduledFor <= futureTime && apt.status === 'scheduled';
      });
    } catch (error) {
      logger.error('Error getting upcoming appointments:', error);
      throw error;
    }
  }

  calculateScheduledDateTime(day, time) {
    try {
      // Get next occurrence of the selected day
      const now = moment();
      const targetDay = moment().day(day);
      
      // If the day has passed this week, get next week's occurrence
      if (targetDay.isBefore(now, 'day')) {
        targetDay.add(1, 'week');
      }
      
      // Parse the time and set it
      const timeMoment = moment(time, ['h:mm A', 'HH:mm']);
      targetDay.hour(timeMoment.hour()).minute(timeMoment.minute()).second(0).millisecond(0);
      
      return targetDay.toDate();
    } catch (error) {
      logger.error('Error calculating scheduled date time:', error);
      throw error;
    }
  }

  async checkTimeSlotAvailability(day, time, location = null) {
    try {
      const scheduledDateTime = this.calculateScheduledDateTime(day, time);
      const allAppointments = await this.getAllAppointments();
      
      // Check for conflicts
      const conflicts = allAppointments.filter(apt => {
        if (apt.status !== 'scheduled') return false;
        
        const aptDateTime = moment(apt.scheduledFor);
        const timeDiff = Math.abs(aptDateTime.diff(scheduledDateTime, 'minutes'));
        
        // Consider it a conflict if within 30 minutes
        return timeDiff < 30;
      });
      
      return {
        available: conflicts.length === 0,
        conflicts: conflicts.length,
        scheduledDateTime: scheduledDateTime
      };
    } catch (error) {
      logger.error('Error checking time slot availability:', error);
      throw error;
    }
  }

  async getAppointmentStats() {
    try {
      const allAppointments = await this.getAllAppointments();
      
      const stats = {
        total: allAppointments.length,
        scheduled: allAppointments.filter(apt => apt.status === 'scheduled').length,
        cancelled: allAppointments.filter(apt => apt.status === 'cancelled').length,
        completed: allAppointments.filter(apt => apt.status === 'completed').length,
        byService: {},
        byType: {
          call: allAppointments.filter(apt => apt.appointmentType === 1).length,
          visit: allAppointments.filter(apt => apt.appointmentType === 2).length
        }
      };
      
      // Count by service
      allAppointments.forEach(apt => {
        if (!stats.byService[apt.serviceName]) {
          stats.byService[apt.serviceName] = 0;
        }
        stats.byService[apt.serviceName]++;
      });
      
      return stats;
    } catch (error) {
      logger.error('Error getting appointment stats:', error);
      throw error;
    }
  }
}

module.exports = new AppointmentService();
