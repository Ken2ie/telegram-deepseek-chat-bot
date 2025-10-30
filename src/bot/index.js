const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const logger = require('../utils/logger');
const handlers = require('./handlers');

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.isInitialized = false;
  }

  initialize() {
    try {
      if (!config.TELEGRAM_BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN is required');
      }

      // Initialize bot with polling
      this.bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, {
        polling: {
          interval: config.BOT.POLLING_INTERVAL,
          autoStart: true,
          params: {
            timeout: config.BOT.TIMEOUT
          }
        }
      });

      // Ensure webhook is cleared when using polling to avoid conflicts
      // Fire and forget; do not block startup
      this.bot.deleteWebHook().catch((err) => {
        logger.warn('Failed to delete webhook before starting polling (continuing):', err.message || err);
      });

      // Validate token early and log bot identity (non-fatal)
      this.bot.getMe()
        .then((me) => {
          logger.info(`Bot authorized as @${me.username} (id: ${me.id})`);
        })
        .catch((err) => {
          const status = err && err.response && err.response.statusCode;
          if (status === 401 || (err.response && err.response.body && err.response.body.error_code === 401)) {
            logger.error('Telegram returned 401 Unauthorized. Your TELEGRAM_BOT_TOKEN is invalid or revoked. Rotate it in @BotFather and update the Render env var.');
          } else {
            logger.warn('Could not fetch bot info with getMe (continuing):', err.message || err);
          }
        });

      // Set up event listeners
      this.setupEventListeners();
      
      // Register handlers
      handlers.register(this.bot);
      
      this.isInitialized = true;
      logger.info('Telegram bot initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Telegram bot:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // Bot ready event
    this.bot.on('polling_error', (error) => {
      const status = error && error.response && error.response.statusCode;
      if (status === 401 || (error.response && error.response.body && error.response.body.error_code === 401)) {
        logger.error('Polling error 401: Invalid Telegram bot token. Rotate token via @BotFather and update TELEGRAM_BOT_TOKEN in your environment.');
      } else {
        logger.error('Polling error:', error);
      }
    });

    // Callback query event
    this.bot.on('callback_query', (callbackQuery) => {
      logger.botActivity(callbackQuery.from.id, 'callback_query', {
        data: callbackQuery.data,
        messageId: callbackQuery.message.message_id
      });
    });

    // Error handling
    this.bot.on('error', (error) => {
      logger.error('Bot error:', error);
    });
  }

  // Send message with error handling
  async sendMessage(chatId, text, options = {}) {
    try {
      const message = await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        ...options
      });
      
      logger.botActivity(chatId, 'message_sent', {
        messageId: message.message_id,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      });
      
      return message;
    } catch (error) {
      logger.botError(chatId, error, { action: 'send_message', text });
      throw error;
    }
  }

  // Edit message with error handling
  async editMessage(chatId, messageId, text, options = {}) {
    try {
      const message = await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        ...options
      });
      
      logger.botActivity(chatId, 'message_edited', {
        messageId,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      });
      
      return message;
    } catch (error) {
      logger.botError(chatId, error, { action: 'edit_message', messageId, text });
      throw error;
    }
  }

  // Send keyboard with error handling
  async sendKeyboard(chatId, text, keyboard, options = {}) {
    try {
      const message = await this.bot.sendMessage(chatId, text, {
        reply_markup: {
          keyboard: keyboard,
          resize_keyboard: true,
          one_time_keyboard: false
        },
        parse_mode: 'Markdown',
        ...options
      });
      
      logger.botActivity(chatId, 'keyboard_sent', {
        messageId: message.message_id,
        keyboardRows: keyboard.length
      });
      
      return message;
    } catch (error) {
      logger.botError(chatId, error, { action: 'send_keyboard', text });
      throw error;
    }
  }

  // Get bot info
  async getBotInfo() {
    try {
      return await this.bot.getMe();
    } catch (error) {
      logger.error('Failed to get bot info:', error);
      throw error;
    }
  }

  // Stop bot
  stop() {
    if (this.bot) {
      this.bot.stopPolling();
      this.isInitialized = false;
      logger.info('Telegram bot stopped');
    }
  }
}

module.exports = new TelegramBotService();
