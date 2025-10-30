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
      logger.error('Polling error:', error);
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
