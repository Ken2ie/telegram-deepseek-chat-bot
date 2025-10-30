# Axis Point Advisory Telegram Bot

A professional Telegram chatbot for Axis Point Advisory services that handles appointment booking for Finance, Legal, Education, Career, and Health Care advisory services.

## Features

- **🤖 AI-Driven Conversations**: Complete natural language processing with DeepSeek AI
- **🔧 Function Calling System**: AI can execute actions like booking appointments, storing data
- **💬 Natural Chat Interface**: No more rigid menus - chat naturally with the bot
- **📋 Smart Appointment Booking**: AI guides users through appointment booking process
- **🎯 Context Awareness**: AI remembers conversation context and user preferences
- **⚡ Real-time Actions**: AI can immediately perform actions based on user requests
- **🛡️ Robust Error Handling**: Comprehensive error handling and fallback responses
- **📊 Advanced Logging**: Detailed logging of AI interactions and function calls
- **🔒 Secure Configuration**: Environment-based configuration with API key management

## Project Structure

```
axis-point-advisory-bot/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── config/
│   │   ├── index.js           # Configuration management
│   │   └── constants.js       # Application constants
│   ├── bot/
│   │   ├── index.js           # Telegram bot setup
│   │   └── handlers/          # AI-powered message handlers
│   │       ├── index.js       # AI handler registry
│   │       └── welcome.js     # Welcome and command handlers
│   │   └── middleware/        # Bot middleware
│   │       ├── auth.js        # Authentication middleware
│   │       └── validation.js  # Input validation
│   ├── services/
│   │   ├── conversation.js    # Conversation state management
│   │   ├── appointment.js     # Appointment booking logic
│   │   ├── notification.js    # Notification service
│   │   ├── deepseek.js       # DeepSeek AI integration
│   │   └── ai-functions.js   # AI function calling system
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Appointment.js     # Appointment model
│   │   └── Conversation.js    # Conversation state model
│   ├── utils/
│   │   ├── logger.js          # Logging utility
│   │   ├── validator.js       # Validation utilities
│   │   └── helpers.js         # Helper functions
│   └── routes/
│       └── webhook.js         # Webhook routes
├── tests/
│   ├── unit/                  # Unit tests
│   └── integration/           # Integration tests
├── docs/                      # Documentation
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── .eslintrc.js               # ESLint configuration
└── README.md                  # This file
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Configure your environment variables in `.env`
5. Start the application:
   ```bash
   npm run dev
   ```

## Environment Variables

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `DEEPSEEK_API_KEY`: Your DeepSeek AI API key
- `DEEPSEEK_MODEL`: DeepSeek model to use (default: deepseek-chat)
- `DEEPSEEK_BASE_URL`: DeepSeek API base URL (default: https://api.deepseek.com)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (error/warn/info/debug)

## Usage

**The bot now works completely through natural conversation!** No more rigid menus or button selections.

### How to Use

1. **Start a conversation**: Send `/start` to begin
2. **Chat naturally**: Tell the AI what you need help with
3. **Get instant help**: The AI will provide advice, answer questions, or help book appointments
4. **Book appointments**: Simply say "I want to book an appointment" and the AI will guide you through the process

### Example Conversations

**Service Questions:**
- "I need help with financial planning"
- "What legal services do you offer?"
- "Can you help me with career advice?"

**Appointment Booking:**
- "I want to book a call for legal advice"
- "Can I schedule an in-person visit for financial planning?"
- "I need an appointment for career counseling"

**Call Booking:**
- "Book me a call for tomorrow at 2 PM"
- "I want to schedule a call for financial advice"
- "Can we set up a call for next week?"

**General Help:**
- "What services do you offer?"
- "How do I book an appointment?"
- "Show me my bookings"
- "What are your office locations?"

### Commands

- `/start` - Start a new conversation
- `/help` - Show help information  
- `/cancel` - Cancel current session
- `/testai` - Test AI functionality (for debugging)

## DeepSeek AI Integration

This bot features a complete AI-driven system with function calling capabilities (similar to MCP - Model Context Protocol). The AI can:

### Core Capabilities
- **Natural Language Processing**: Understand and respond to any user input
- **Function Calling**: Execute actions like booking appointments, storing data, showing menus
- **Context Awareness**: Remember conversation history and user preferences
- **Smart Decision Making**: Choose appropriate actions based on user intent
- **Real-time Actions**: Immediately perform tasks without additional user input

### Available Functions
The AI has access to these functions:
- `select_service` - Choose advisory service
- `select_appointment_type` - Choose call or in-person
- `select_location` - Choose office location
- `set_contact_info` - Store contact information
- `schedule_appointment` - Book specific date/time
- `collect_user_name` - Collect and store user name
- `collect_contact_info` - Collect phone/email details
- `book_call` - Schedule call appointments
- `confirm_call_booking` - Finalize call bookings
- `show_user_bookings` - Display user's bookings
- `show_services_menu` - Display available services
- `show_appointment_types` - Show appointment options
- `show_locations` - Display office locations
- `confirm_appointment` - Finalize in-person bookings
- `reset_conversation` - Start over

### How It Works
1. **User sends message** → AI analyzes intent
2. **AI decides action** → Calls appropriate function(s)
3. **Function executes** → Updates conversation state
4. **AI responds** → Provides natural follow-up message

### Testing the AI Integration

Run the comprehensive test script:

```bash
node test-ai-system.js
```

This tests:
- AI connection and function calling
- Natural conversation processing
- Function execution capabilities
- End-to-end appointment booking flow
- Call booking functionality
- JSON database operations
- Error handling and fallbacks

## JSON Database System

The bot uses a JSON-based database system for data persistence:

### Database Structure
- **`data/users.json`** - User profiles and contact information
- **`data/calls.json`** - Call appointment bookings
- **`data/appointments.json`** - In-person appointment bookings
- **`data/conversations.json`** - Conversation state tracking

### Features
- **Automatic Backup**: Built-in backup functionality
- **Data Persistence**: All user data and bookings are saved
- **User Management**: Complete user profile management
- **Booking Tracking**: Track both calls and appointments
- **Admin Access**: View all bookings and user data

## Development

- `npm run dev`: Start development server with hot reload
- `npm test`: Run tests
- `npm run lint`: Check code style
- `npm run lint:fix`: Fix code style issues

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Submit pull requests for review

## License

MIT License - see LICENSE file for details
