const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // DeepSeek AI Configuration
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  
  // Bot configuration
  BOT: {
    POLLING_INTERVAL: 1000,
    TIMEOUT: 30000,
    RETRY_DELAY: 1000
  },
  
  // Services configuration
  SERVICES: {
    FINANCE: { id: 1, name: 'Finance', emoji: '💼' },
    LEGAL: { id: 2, name: 'Legal', emoji: '⚖️' },
    EDUCATION: { id: 3, name: 'Education', emoji: '🎓' },
    CAREER: { id: 4, name: 'Career', emoji: '🚀' },
    HEALTHCARE: { id: 5, name: 'Health Care', emoji: '🩺' }
  },
  
  // Appointment types
  APPOINTMENT_TYPES: {
    CALL: { id: 1, name: 'Call Appointment', emoji: '📞' },
    VISIT: { id: 2, name: 'In-Person Visit', emoji: '🏢' }
  },
  
  // Locations
  LOCATIONS: {
    RICHMOND: { id: 1, name: 'Richmond' },
    WEMBLEY: { id: 2, name: 'Wembley' },
    PUTNEY: { id: 3, name: 'Putney' },
    BRENT_CROSS: { id: 4, name: 'Brent Cross' }
  },
  
  // Business hours
  BUSINESS_HOURS: {
    START: '09:00',
    END: '16:00',
    DAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  
  // Validation
  VALIDATION: {
    PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
    TIME_REGEX: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    MAX_MESSAGE_LENGTH: 4096
  }
};

// Validate required environment variables
const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'DEEPSEEK_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

module.exports = config;
