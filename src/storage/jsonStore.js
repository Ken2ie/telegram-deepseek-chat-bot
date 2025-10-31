const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'chat_db.json');

function ensureDbFile() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE_PATH)) {
    const initial = { users: {} };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDbFile();
  const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    logger.warn('Failed to parse chat_db.json, returning empty structure:', error.message);
    return { users: {} };
  }
}

function writeDb(db) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Failed to write chat_db.json:', error);
    throw error;
  }
}

function getUser(db, userId) {
  if (!db.users[userId]) {
    db.users[userId] = {
      profile: {},
      sessions: {},
      bookings: [],
      metadata: {
        firstSeen: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        messageCount: 0
      }
    };
  }
  return db.users[userId];
}

function getSession(user, sessionId) {
  if (!user.sessions[sessionId]) {
    user.sessions[sessionId] = {
      messages: [],
      metadata: {
        startedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString()
      }
    };
  }
  return user.sessions[sessionId];
}

function appendMessage({ userId, sessionId, role, text, timestamp }) {
  const db = readDb();
  const user = getUser(db, String(userId));
  const session = getSession(user, String(sessionId));
  
  const message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    timestamp: timestamp || new Date().toISOString()
  };
  
  session.messages.push(message);
  session.metadata.lastMessageAt = message.timestamp;
  user.metadata.lastActive = message.timestamp;
  user.metadata.messageCount = (user.metadata.messageCount || 0) + 1;
  
  writeDb(db);
  return message;
}

function getConversation({ userId, sessionId, limit }) {
  const db = readDb();
  const user = db.users[String(userId)];
  if (!user) return [];
  const session = user.sessions[String(sessionId)];
  if (!session) return [];
  const msgs = session.messages || [];
  if (typeof limit === 'number' && limit > 0) {
    return msgs.slice(-limit);
  }
  return msgs;
}

function upsertUserProfile(userId, profileUpdates) {
  const db = readDb();
  const user = getUser(db, String(userId));
  user.profile = {
    ...user.profile,
    ...profileUpdates,
    updatedAt: new Date().toISOString()
  };
  writeDb(db);
  return user.profile;
}

function getUserProfile(userId) {
  const db = readDb();
  const user = db.users[String(userId)];
  return user ? (user.profile || {}) : {};
}

function addBooking(userId, booking) {
  const db = readDb();
  const user = getUser(db, String(userId));
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...booking,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  user.bookings.push(record);
  writeDb(db);
  return record;
}

function getBookings(userId) {
  const db = readDb();
  const user = db.users[String(userId)];
  return user ? (user.bookings || []) : [];
}

function updateBooking(userId, bookingId, updates) {
  const db = readDb();
  const user = getUser(db, String(userId));
  const booking = user.bookings.find(b => b.id === bookingId);
  if (!booking) {
    return null;
  }
  Object.assign(booking, updates, { updatedAt: new Date().toISOString() });
  writeDb(db);
  return booking;
}

// Enhanced context retrieval methods
function getUserContext(userId) {
  const db = readDb();
  const user = db.users[String(userId)];
  if (!user) {
    return null;
  }
  
  return {
    profile: user.profile || {},
    bookings: user.bookings || [],
    metadata: user.metadata || {},
    sessionsCount: Object.keys(user.sessions || {}).length,
    totalMessages: user.metadata?.messageCount || 0
  };
}

function getConversationHistory(userId, sessionId, limit = 50) {
  return getConversation({ userId, sessionId, limit });
}

function getAllUserSessions(userId) {
  const db = readDb();
  const user = db.users[String(userId)];
  if (!user) return [];
  
  return Object.entries(user.sessions || {}).map(([sessionId, session]) => ({
    sessionId,
    messageCount: session.messages?.length || 0,
    startedAt: session.metadata?.startedAt,
    lastMessageAt: session.metadata?.lastMessageAt,
    recentMessages: session.messages?.slice(-5) || []
  }));
}

function searchUserMessages(userId, query, limit = 10) {
  const db = readDb();
  const user = db.users[String(userId)];
  if (!user) return [];
  
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  for (const [sessionId, session] of Object.entries(user.sessions || {})) {
    for (const message of session.messages || []) {
      if (message.text && message.text.toLowerCase().includes(lowerQuery)) {
        results.push({
          ...message,
          sessionId
        });
      }
    }
  }
  
  // Sort by timestamp descending and limit results
  return results
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

function getUserStats(userId) {
  const db = readDb();
  const user = db.users[String(userId)];
  if (!user) {
    return null;
  }
  
  const totalMessages = user.metadata?.messageCount || 0;
  const totalBookings = user.bookings?.length || 0;
  const totalSessions = Object.keys(user.sessions || {}).length;
  
  // Count bookings by status
  const bookingsByStatus = {};
  (user.bookings || []).forEach(booking => {
    const status = booking.status || 'pending';
    bookingsByStatus[status] = (bookingsByStatus[status] || 0) + 1;
  });
  
  return {
    totalMessages,
    totalBookings,
    totalSessions,
    bookingsByStatus,
    firstSeen: user.metadata?.firstSeen,
    lastActive: user.metadata?.lastActive,
    profileComplete: !!(user.profile?.firstName || user.profile?.name)
  };
}

module.exports = {
  appendMessage,
  getConversation,
  getConversationHistory,
  upsertUserProfile,
  getUserProfile,
  addBooking,
  getBookings,
  updateBooking,
  getUserContext,
  getAllUserSessions,
  searchUserMessages,
  getUserStats
};


