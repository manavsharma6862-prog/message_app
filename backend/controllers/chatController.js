const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");

const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400);
    throw new Error("UserId not provided");
  }

  let chat = Chat.findDirectChat(req.user._id, userId);

  if (chat) {
    res.json(chat);
  } else {
    const created = Chat.create({
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    });
    res.status(201).json(created);
  }
});

const fetchChats = asyncHandler(async (req, res) => {
  const chats = Chat.findForUser(req.user._id);
  res.status(200).json(chats);
});

const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    res.status(400);
    throw new Error("Please provide group name and users");
  }

  let users;
  try {
    users = JSON.parse(req.body.users);
  } catch {
    res.status(400);
    throw new Error("Invalid users format");
  }

  if (users.length < 2) {
    res.status(400);
    throw new Error("A group chat requires at least 2 other users");
  }

  // Add the current user if not already included
  if (!users.includes(req.user._id)) {
    users.push(req.user._id);
  }

  const groupChat = Chat.create({
    chatName: req.body.name,
    isGroupChat: true,
    users,
    groupAdminId: req.user._id,
  });

  res.status(201).json(groupChat);
});

const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  const updated = Chat.update(chatId, { chatName });
  if (!updated) {
    res.status(404);
    throw new Error("Chat not found");
  }
  res.json(updated);
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  const updated = Chat.addUser(chatId, userId);
  if (!updated) {
    res.status(404);
    throw new Error("Chat not found");
  }
  res.json(updated);
});

const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  const updated = Chat.removeUser(chatId, userId);
  if (!updated) {
    res.status(404);
    throw new Error("Chat not found");
  }
  res.json(updated);
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
