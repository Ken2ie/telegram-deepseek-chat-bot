const moment = require('moment');
const logger = require('./logger');

class Helpers {
  // Generate a unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Format date for display
  formatDate(date, format = 'YYYY-MM-DD') {
    try {
      return moment(date).format(format);
    } catch (error) {
      logger.error('Error formatting date:', error);
      return date;
    }
  }

  // Format time for display
  formatTime(time, format = 'h:mm A') {
    try {
      return moment(time, ['h:mm A', 'HH:mm', 'h:mmA', 'h:mm a', 'hA', 'ha'], true).format(format);
    } catch (error) {
      logger.error('Error formatting time:', error);
      return time;
    }
  }

  // Get next business day
  getNextBusinessDay(date = new Date()) {
    try {
      let nextDay = moment(date).add(1, 'day');
      
      // Skip weekends
      while (nextDay.day() === 0 || nextDay.day() === 6) {
        nextDay.add(1, 'day');
      }
      
      return nextDay.toDate();
    } catch (error) {
      logger.error('Error getting next business day:', error);
      return date;
    }
  }

  // Check if date is a business day
  isBusinessDay(date) {
    try {
      const dayOfWeek = moment(date).day();
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
    } catch (error) {
      logger.error('Error checking business day:', error);
      return false;
    }
  }

  // Get available time slots for a day
  getAvailableTimeSlots(date, intervalMinutes = 30) {
    try {
      const slots = [];
      const startTime = moment(date).hour(9).minute(0); // 9:00 AM
      const endTime = moment(date).hour(16).minute(0); // 4:00 PM
      
      let currentTime = startTime.clone();
      
      while (currentTime.isBefore(endTime)) {
        slots.push({
          time: currentTime.format('h:mm A'),
          value: currentTime.format('HH:mm'),
          available: true
        });
        
        currentTime.add(intervalMinutes, 'minutes');
      }
      
      return slots;
    } catch (error) {
      logger.error('Error getting time slots:', error);
      return [];
    }
  }

  // Capitalize first letter of each word
  capitalizeWords(str) {
    try {
      return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    } catch (error) {
      logger.error('Error capitalizing words:', error);
      return str;
    }
  }

  // Truncate text with ellipsis
  truncateText(text, maxLength = 100) {
    try {
      if (text.length <= maxLength) {
        return text;
      }
      return text.substring(0, maxLength - 3) + '...';
    } catch (error) {
      logger.error('Error truncating text:', error);
      return text;
    }
  }

  // Escape special characters for Markdown
  escapeMarkdown(text) {
    try {
      return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    } catch (error) {
      logger.error('Error escaping markdown:', error);
      return text;
    }
  }

  // Format phone number for display
  formatPhoneNumber(phoneNumber) {
    try {
      // Remove all non-digit characters
      const cleaned = phoneNumber.replace(/\D/g, '');
      
      // Format based on length
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else if (cleaned.length === 11 && cleaned[0] === '1') {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }
      
      return phoneNumber; // Return original if can't format
    } catch (error) {
      logger.error('Error formatting phone number:', error);
      return phoneNumber;
    }
  }

  // Generate appointment reference number
  generateAppointmentRef(appointmentId) {
    try {
      const prefix = 'APA'; // Axis Point Advisory
      const paddedId = appointmentId.toString().padStart(6, '0');
      return `${prefix}-${paddedId}`;
    } catch (error) {
      logger.error('Error generating appointment reference:', error);
      return `APA-${appointmentId}`;
    }
  }

  // Calculate time difference in human readable format
  getTimeDifference(date1, date2) {
    try {
      const diff = moment(date2).diff(moment(date1));
      const duration = moment.duration(diff);
      
      if (duration.asDays() >= 1) {
        return `${Math.floor(duration.asDays())} day(s)`;
      } else if (duration.asHours() >= 1) {
        return `${Math.floor(duration.asHours())} hour(s)`;
      } else {
        return `${Math.floor(duration.asMinutes())} minute(s)`;
      }
    } catch (error) {
      logger.error('Error calculating time difference:', error);
      return 'Unknown';
    }
  }

  // Check if time is in the past
  isPastTime(timeInput, date = new Date()) {
    try {
      const timeFormats = ['h:mm A', 'HH:mm', 'h:mmA', 'h:mm a', 'hA', 'ha'];
      const parsedTime = moment(timeInput, timeFormats, true);
      
      if (!parsedTime.isValid()) {
        return false;
      }
      
      const targetDateTime = moment(date)
        .hour(parsedTime.hour())
        .minute(parsedTime.minute())
        .second(0)
        .millisecond(0);
      
      return targetDateTime.isBefore(moment());
    } catch (error) {
      logger.error('Error checking if time is in past:', error);
      return false;
    }
  }

  // Get user-friendly error message
  getUserFriendlyError(error) {
    try {
      const errorMessages = {
        'INVALID_INPUT': 'Please provide a valid input.',
        'INVALID_SERVICE': 'Please select a valid service (1-5).',
        'INVALID_APPOINTMENT_TYPE': 'Please select a valid appointment type (1-2).',
        'INVALID_LOCATION': 'Please select a valid location.',
        'INVALID_DAY': 'Please select a valid day.',
        'INVALID_TIME': 'Please provide a valid time.',
        'INVALID_PHONE': 'Please provide a valid phone number.',
        'BUSINESS_HOURS': 'Please choose a time between 9:00 AM and 4:00 PM.',
        'WEEKEND_BOOKING': 'We are closed on weekends. Please choose a weekday.',
        'APPOINTMENT_CONFLICT': 'This time slot is already booked. Please choose another time.'
      };
      
      return errorMessages[error] || 'Something went wrong. Please try again.';
    } catch (err) {
      logger.error('Error getting user-friendly error message:', err);
      return 'Something went wrong. Please try again.';
    }
  }

  // Deep clone an object
  deepClone(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      logger.error('Error deep cloning object:', error);
      return obj;
    }
  }

  // Sleep/delay function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry function with exponential backoff
  async retry(fn, maxRetries = 3, delay = 1000) {
    try {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          
          const waitTime = delay * Math.pow(2, i);
          await this.sleep(waitTime);
        }
      }
    } catch (error) {
      logger.error('Error in retry function:', error);
      throw error;
    }
  }
}

module.exports = new Helpers();
