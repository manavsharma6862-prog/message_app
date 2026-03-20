const { db } = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const User = require("./userModel");

const Message = {
  _populate(msg) {
    if (!msg) return null;
    const sender = User.format(User.findById(msg.sender_id));
    const chat = db.prepare("SELECT * FROM chats WHERE id = ?").get(msg.chat_id);
    const chatUsers = chat
      ? db
          .prepare("SELECT u.* FROM users u JOIN chat_users cu ON cu.user_id = u.id WHERE cu.chat_id = ?")
          .all(chat.id)
          .map(User.format)
      : [];

    return {
      _id: msg.id,
      sender,
      content: msg.content,
      chat: chat
        ? {
            _id: chat.id,
            chatName: chat.chat_name,
            isGroupChat: chat.is_group_chat === 1,
            users: chatUsers,
          }
        : null,
      messageType: msg.message_type,
      fileUrl: msg.file_url,
      fileName: msg.file_name,
      readBy: db
        .prepare("SELECT user_id FROM message_read_by WHERE message_id = ?")
        .all(msg.id)
        .map((r) => r.user_id),
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
    };
  },

  create({ senderId, content, chatId, messageType = "text", fileUrl = "", fileName = "" }) {
    const id = uuidv4();
    db.prepare(
      "INSERT INTO messages (id, sender_id, content, chat_id, message_type, file_url, file_name) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, senderId, content, chatId, messageType, fileUrl, fileName);
    return this._populate(db.prepare("SELECT * FROM messages WHERE id = ?").get(id));
  },

  findByChatId(chatId) {
    const msgs = db
      .prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC")
      .all(chatId);
    return msgs.map((m) => this._populate(m));
  },
};

module.exports = Message;
