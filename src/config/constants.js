// Application constants
const CONSTANTS = {
  // Conversation states
  CONVERSATION_STATES: {
    INITIAL: 'initial',
    SERVICE_SELECTED: 'service_selected',
    APPOINTMENT_TYPE_SELECTED: 'appointment_type_selected',
    AWAITING_CONTACT: 'awaiting_contact',
    CONTACT_PROVIDED: 'contact_provided',
    AWAITING_DAY: 'awaiting_day',
    DAY_SELECTED: 'day_selected',
    AWAITING_TIME: 'awaiting_time',
    TIME_SELECTED: 'time_selected',
    AWAITING_LOCATION: 'awaiting_location',
    LOCATION_SELECTED: 'location_selected',
    COMPLETED: 'completed'
  },
  
  // Message types
  MESSAGE_TYPES: {
    TEXT: 'text',
    COMMAND: 'command',
    CALLBACK_QUERY: 'callback_query'
  },
  
  // Business hours
  BUSINESS_HOURS: {
    DAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  
  // Commands
  COMMANDS: {
    START: '/start',
    HELP: '/help',
    CANCEL: '/cancel',
    STATUS: '/status'
  },
  
  // Keyboard options
  KEYBOARD_OPTIONS: {
    RESIZE: true,
    ONE_TIME: false,
    SELECTIVE: false
  },
  
  // Error messages
  ERROR_MESSAGES: {
    INVALID_INPUT: 'Please provide a valid input.',
    INVALID_SERVICE: 'Please select a valid service (1-5).',
    INVALID_APPOINTMENT_TYPE: 'Please select a valid appointment type (1-2).',
    INVALID_LOCATION: 'Please select a valid location.',
    INVALID_DAY: 'Please select a valid day.',
    INVALID_TIME: 'Please provide a valid time.',
    INVALID_PHONE: 'Please provide a valid phone number.',
    APPOINTMENT_CONFLICT: 'This time slot is already booked. Please choose another time.',
    BUSINESS_HOURS: 'Please choose a time between 9:00 AM and 4:00 PM.',
    WEEKEND_BOOKING: 'We are closed on weekends. Please choose a weekday.'
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    APPOINTMENT_SCHEDULED: 'Your appointment has been scheduled successfully!',
    CALL_SCHEDULED: 'Your call appointment has been scheduled.',
    VISIT_SCHEDULED: 'Your in-person visit has been scheduled.'
  },
  
  // Time formats
  TIME_FORMATS: {
    DISPLAY: 'h:mm A',
    INPUT: 'HH:mm',
    DATABASE: 'YYYY-MM-DD HH:mm:ss'
  },
  
  // Rate limiting
  RATE_LIMITS: {
    MESSAGES_PER_MINUTE: 10,
    APPOINTMENTS_PER_HOUR: 3
  }
};

module.exports = CONSTANTS;
