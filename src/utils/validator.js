const config = require('../config');
const CONSTANTS = require('../config/constants');
const moment = require('moment');

class Validator {
  isValidPhoneNumber(phoneNumber) {
    try {
      // Remove all non-digit characters except +
      const cleaned = phoneNumber.replace(/[^\d+]/g, '');
      
      // Check if it matches the phone regex
      return config.VALIDATION.PHONE_REGEX.test(cleaned);
    } catch (error) {
      return false;
    }
  }

  isValidTime(timeInput) {
    try {
      // Try to parse the time in various formats
      const timeFormats = [
        'h:mm A',    // 10:30 AM
        'HH:mm',     // 10:30
        'h:mmA',     // 10:30AM
        'h:mm a',    // 10:30 am
        'hA',        // 10AM
        'ha'         // 10am
      ];
      
      const parsedTime = moment(timeInput, timeFormats, true);
      return parsedTime.isValid();
    } catch (error) {
      return false;
    }
  }

  isValidDay(dayInput) {
    try {
      const validDays = CONSTANTS.BUSINESS_HOURS.DAYS.map(day => day.toLowerCase());
      const inputDay = dayInput.toLowerCase().trim();
      
      return validDays.includes(inputDay);
    } catch (error) {
      return false;
    }
  }

  isValidServiceId(serviceId) {
    try {
      return serviceId >= 1 && serviceId <= 5;
    } catch (error) {
      return false;
    }
  }

  isValidAppointmentType(appointmentType) {
    try {
      return appointmentType >= 1 && appointmentType <= 2;
    } catch (error) {
      return false;
    }
  }

  isValidLocationId(locationId) {
    try {
      return locationId >= 1 && locationId <= 4;
    } catch (error) {
      return false;
    }
  }

  isWithinBusinessHours(timeInput) {
    try {
      const timeFormats = [
        'h:mm A',    // 10:30 AM
        'HH:mm',     // 10:30
        'h:mmA',     // 10:30AM
        'h:mm a',    // 10:30 am
        'hA',        // 10AM
        'ha'         // 10am
      ];
      
      const parsedTime = moment(timeInput, timeFormats, true);
      
      if (!parsedTime.isValid()) {
        return false;
      }
      
      const businessStart = moment(config.BUSINESS_HOURS.START, 'HH:mm');
      const businessEnd = moment(config.BUSINESS_HOURS.END, 'HH:mm');
      
      const timeOnly = moment(parsedTime.format('HH:mm'), 'HH:mm');
      
      return timeOnly.isBetween(businessStart, businessEnd, null, '[)');
    } catch (error) {
      return false;
    }
  }

  isWeekend(date) {
    try {
      const dayOfWeek = moment(date).day();
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    } catch (error) {
      return false;
    }
  }

  isValidMessageLength(message) {
    try {
      return message && message.length <= config.VALIDATION.MAX_MESSAGE_LENGTH;
    } catch (error) {
      return false;
    }
  }

  sanitizeInput(input) {
    try {
      if (typeof input !== 'string') {
        return String(input);
      }
      
      // Remove potentially harmful characters
      return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .substring(0, 1000); // Limit length
    } catch (error) {
      return '';
    }
  }

  validateAppointmentData(data) {
    const errors = [];
    
    try {
      // Required fields
      if (!data.userId) errors.push('User ID is required');
      if (!data.serviceId || !this.isValidServiceId(data.serviceId)) {
        errors.push('Valid service ID is required');
      }
      if (!data.appointmentType || !this.isValidAppointmentType(data.appointmentType)) {
        errors.push('Valid appointment type is required');
      }
      if (!data.selectedDay || !this.isValidDay(data.selectedDay)) {
        errors.push('Valid day is required');
      }
      if (!data.selectedTime || !this.isValidTime(data.selectedTime)) {
        errors.push('Valid time is required');
      }
      
      // Conditional fields
      if (data.appointmentType === 1 && !data.contactNumber) {
        errors.push('Contact number is required for call appointments');
      }
      if (data.appointmentType === 2 && !data.selectedLocation) {
        errors.push('Location is required for in-person visits');
      }
      
      // Business hours validation
      if (data.selectedTime && !this.isWithinBusinessHours(data.selectedTime)) {
        errors.push('Time must be within business hours (9:00 AM - 4:00 PM)');
      }
      
      // Weekend validation
      if (data.selectedDay && this.isWeekend(data.selectedDay)) {
        errors.push('Appointments are not available on weekends');
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  formatTimeForDisplay(timeInput) {
    try {
      const timeFormats = [
        'h:mm A',    // 10:30 AM
        'HH:mm',     // 10:30
        'h:mmA',     // 10:30AM
        'h:mm a',    // 10:30 am
        'hA',        // 10AM
        'ha'         // 10am
      ];
      
      const parsedTime = moment(timeInput, timeFormats, true);
      
      if (parsedTime.isValid()) {
        return parsedTime.format('h:mm A');
      }
      
      return timeInput;
    } catch (error) {
      return timeInput;
    }
  }

  formatDateForDisplay(dateInput) {
    try {
      const parsedDate = moment(dateInput);
      
      if (parsedDate.isValid()) {
        return parsedDate.format('dddd, MMMM Do, YYYY');
      }
      
      return dateInput;
    } catch (error) {
      return dateInput;
    }
  }
}

module.exports = new Validator();
