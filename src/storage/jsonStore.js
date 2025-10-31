const fs = require('fs');
const path = require('path');

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
  } catch (_) {
    return { users: {} };
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function getUser(db, userId) {
  if (!db.users[userId]) {
    db.users[userId] = {
      profile: {},
      sessions: {},
      bookings: []
    };
  }
  return db.users[userId];
}

function getSession(user, sessionId) {
  if (!user.sessions[sessionId]) {
    user.sessions[sessionId] = { messages: [] };
  }
  return user.sessions[sessionId];
}

function appendMessage({ userId, sessionId, role, text, timestamp }) {
  const db = readDb();
  const user = getUser(db, String(userId));
  const session = getSession(user, String(sessionId));
  session.messages.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    timestamp: timestamp || new Date().toISOString()
  });
  writeDb(db);
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
  user.profile = { ...user.profile, ...profileUpdates };
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
    createdAt: new Date().toISOString()
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

module.exports = {
  appendMessage,
  getConversation,
  upsertUserProfile,
  getUserProfile,
  addBooking,
  getBookings
};


