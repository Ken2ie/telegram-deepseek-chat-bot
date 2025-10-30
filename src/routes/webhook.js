const express = require('express');
const logger = require('../utils/logger');
const telegramBot = require('../bot');

const router = express.Router();

// Health check for webhook
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'webhook',
    timestamp: new Date().toISOString()
  });
});

// Telegram webhook endpoint
router.post('/telegram', (req, res) => {
  try {
    const update = req.body;
    
    // Log the incoming update
    logger.info('Webhook received', {
      updateId: update.update_id,
      messageType: update.message ? 'message' : update.callback_query ? 'callback_query' : 'other'
    });
    
    // Process the update through the bot
    if (telegramBot.bot) {
      telegramBot.bot.processUpdate(update);
    }
    
    res.status(200).json({ status: 'OK' });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set webhook URL (for initial setup)
router.post('/set-webhook', async (req, res) => {
  try {
    const { webhookUrl, secretToken } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({ error: 'Webhook URL is required' });
    }
    
    if (telegramBot.bot) {
      const result = await telegramBot.bot.setWebHook(webhookUrl, {
        secret_token: secretToken
      });
      
      logger.info('Webhook set successfully', { webhookUrl });
      res.status(200).json({ 
        status: 'OK', 
        result: result,
        webhookUrl: webhookUrl 
      });
    } else {
      res.status(500).json({ error: 'Bot not initialized' });
    }
  } catch (error) {
    logger.error('Error setting webhook:', error);
    res.status(500).json({ error: 'Failed to set webhook' });
  }
});

// Get webhook info
router.get('/webhook-info', async (req, res) => {
  try {
    if (telegramBot.bot) {
      const webhookInfo = await telegramBot.bot.getWebHookInfo();
      res.status(200).json(webhookInfo);
    } else {
      res.status(500).json({ error: 'Bot not initialized' });
    }
  } catch (error) {
    logger.error('Error getting webhook info:', error);
    res.status(500).json({ error: 'Failed to get webhook info' });
  }
});

// Delete webhook (for polling mode)
router.delete('/webhook', async (req, res) => {
  try {
    if (telegramBot.bot) {
      const result = await telegramBot.bot.deleteWebHook();
      logger.info('Webhook deleted successfully');
      res.status(200).json({ 
        status: 'OK', 
        result: result 
      });
    } else {
      res.status(500).json({ error: 'Bot not initialized' });
    }
  } catch (error) {
    logger.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

module.exports = router;
