const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");

const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, messageType, fileUrl, fileName } = req.body;

  if (!content || !chatId) {
    res.status(400);
    throw new Error("Invalid data passed to request");
  }

  const message = Message.create({
    senderId: req.user._id,
    content,
    chatId,
    messageType: messageType || "text",
    fileUrl: fileUrl || "",
    fileName: fileName || "",
  });

  // Update chat's latest message
  Chat.update(chatId, { latestMessageId: message._id });

  res.status(201).json(message);
});

const allMessages = asyncHandler(async (req, res) => {
  const messages = Message.findByChatId(req.params.chatId);
  res.json(messages);
});

module.exports = { sendMessage, allMessages };
