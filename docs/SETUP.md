# Axis Point Advisory Bot - Setup Guide

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Telegram Bot Token (from @BotFather)

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd axis-point-advisory-bot
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your bot token:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info
   ```

3. **Create Telegram Bot**
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Follow instructions to get your bot token
   - Add the token to your `.env` file

4. **Start the Bot**
   ```bash
   npm run dev
   ```

5. **Test the Bot**
   - Find your bot on Telegram using the username you created
   - Send `/start` to begin

## Bot Features

### Service Selection
- Finance Advisory
- Legal Advisory  
- Education Advisory
- Career Advisory
- Health Care Advisory

### Appointment Types
- **Call Appointment**: Phone consultation
- **In-Person Visit**: Office visit

### Locations (for in-person visits)
- Richmond
- Wembley
- Putney
- Brent Cross

### Business Hours
- Monday to Friday
- 9:00 AM to 4:00 PM

## Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix code style issues

### Project Structure
```
src/
├── app.js                 # Main application
├── config/               # Configuration files
├── bot/                  # Telegram bot logic
│   ├── handlers/         # Message handlers
│   └── middleware/       # Bot middleware
├── services/             # Business logic
├── utils/                # Utility functions
└── routes/               # API routes
```

## Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start src/app.js --name "axis-point-bot"
pm2 startup
pm2 save
```

### Using Docker
```bash
docker build -t axis-point-bot .
docker run -d --name axis-point-bot -p 3000:3000 axis-point-bot
```

### Environment Variables for Production
```bash
NODE_ENV=production
TELEGRAM_BOT_TOKEN=your_production_bot_token
PORT=3000
LOG_LEVEL=warn
```

## Webhook Setup (Optional)

For production, you can use webhooks instead of polling:

1. **Set Webhook URL**
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://yourdomain.com/webhook/telegram"}'
   ```

2. **Update Bot Configuration**
   ```javascript
   // In src/bot/index.js, change polling to false
   this.bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, {
     polling: false
   });
   ```

## Monitoring

### Logs
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- Console output for development

### Health Check
- Endpoint: `GET /health`
- Returns server status and uptime

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check bot token in `.env`
   - Verify bot is not blocked
   - Check server logs

2. **Environment variables not loading**
   - Ensure `.env` file exists
   - Check file permissions
   - Restart the application

3. **Port already in use**
   - Change PORT in `.env`
   - Kill existing process: `lsof -ti:3000 | xargs kill`

### Debug Mode
```bash
LOG_LEVEL=debug npm run dev
```

## Support

For issues and questions:
- Check the logs in `logs/` directory
- Review the error messages in console
- Ensure all environment variables are set correctly

## License

MIT License - see LICENSE file for details
