const { db } = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const User = require("./userModel");

const Chat = {
  // Populate a raw chat row into the expected frontend shape
  _populate(chat) {
    if (!chat) return null;

    // Get users (without passwords)
    const chatUsers = db
      .prepare("SELECT u.* FROM users u JOIN chat_users cu ON cu.user_id = u.id WHERE cu.chat_id = ?")
      .all(chat.id)
      .map(User.format);

    // Get group admin
    const groupAdmin = chat.group_admin_id ? User.format(User.findById(chat.group_admin_id)) : null;

    // Get latest message
    let latestMessage = null;
    if (chat.latest_message_id) {
      const msg = db.prepare("SELECT * FROM messages WHERE id = ?").get(chat.latest_message_id);
      if (msg) {
        const sender = User.format(User.findById(msg.sender_id));
        latestMessage = {
          _id: msg.id,
          content: msg.content,
          sender,
          chat: chat.id,
          messageType: msg.message_type,
          fileUrl: msg.file_url,
          fileName: msg.file_name,
          createdAt: msg.created_at,
          updatedAt: msg.updated_at,
        };
      }
    }

    return {
      _id: chat.id,
      chatName: chat.chat_name,
      isGroupChat: chat.is_group_chat === 1,
      users: chatUsers,
      latestMessage,
      groupAdmin,
      groupImage: chat.group_image,
      createdAt: chat.created_at,
      updatedAt: chat.updated_at,
    };
  },

  findById(id) {
    const chat = db.prepare("SELECT * FROM chats WHERE id = ?").get(id);
    return this._populate(chat);
  },

  // Find 1-on-1 chat between two users
  findDirectChat(userId1, userId2) {
    const chat = db.prepare(`
      SELECT c.* FROM chats c
      JOIN chat_users cu1 ON cu1.chat_id = c.id AND cu1.user_id = ?
      JOIN chat_users cu2 ON cu2.chat_id = c.id AND cu2.user_id = ?
      WHERE c.is_group_chat = 0
      LIMIT 1
    `).get(userId1, userId2);
    return chat ? this._populate(chat) : null;
  },

  // Find all chats for a user
  findForUser(userId) {
    const chats = db.prepare(`
      SELECT c.* FROM chats c
      JOIN chat_users cu ON cu.chat_id = c.id
      WHERE cu.user_id = ?
      ORDER BY c.updated_at DESC
    `).all(userId);
    return chats.map((c) => this._populate(c));
  },

  create({ chatName, isGroupChat = false, users = [], groupAdminId = null, groupImage = "" }) {
    const id = uuidv4();
    db.prepare(
      "INSERT INTO chats (id, chat_name, is_group_chat, group_admin_id, group_image) VALUES (?, ?, ?, ?, ?)"
    ).run(id, chatName, isGroupChat ? 1 : 0, groupAdminId, groupImage);

    const insertUser = db.prepare("INSERT OR IGNORE INTO chat_users (chat_id, user_id) VALUES (?, ?)");
    for (const uid of users) {
      insertUser.run(id, uid);
    }

    return this.findById(id);
  },

  update(id, fields = {}) {
    const chat = db.prepare("SELECT * FROM chats WHERE id = ?").get(id);
    if (!chat) return null;

    if (fields.chatName !== undefined) {
      db.prepare("UPDATE chats SET chat_name=?, updated_at=datetime('now') WHERE id=?").run(fields.chatName, id);
    }
    if (fields.latestMessageId !== undefined) {
      db.prepare("UPDATE chats SET latest_message_id=?, updated_at=datetime('now') WHERE id=?").run(fields.latestMessageId, id);
    }
    return this.findById(id);
  },

  addUser(chatId, userId) {
    db.prepare("INSERT OR IGNORE INTO chat_users (chat_id, user_id) VALUES (?, ?)").run(chatId, userId);
    db.prepare("UPDATE chats SET updated_at=datetime('now') WHERE id=?").run(chatId);
    return this.findById(chatId);
  },

  removeUser(chatId, userId) {
    db.prepare("DELETE FROM chat_users WHERE chat_id=? AND user_id=?").run(chatId, userId);
    db.prepare("UPDATE chats SET updated_at=datetime('now') WHERE id=?").run(chatId);
    return this.findById(chatId);
  },
};

module.exports = Chat;
