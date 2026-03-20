const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, email, password });

  if (user) {
    const fmt = User.format(user);
    res.status(201).json({ ...fmt, token: generateToken(user.id) });
  } else {
    res.status(400);
    throw new Error("Failed to create user");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await User.matchPassword(user.id, password))) {
    const fmt = User.format(user);
    res.json({ ...fmt, token: generateToken(user.id) });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const getUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search || "";
  const users = User.find(keyword, req.user._id).map(User.format);
  res.json(users);
});

const updateProfile = asyncHandler(async (req, res) => {
  const updated = await User.update(req.user._id, {
    name: req.body.name,
    status: req.body.status,
    image: req.body.image,
    password: req.body.password,
  });

  if (updated) {
    const fmt = User.format(updated);
    res.json({ ...fmt, token: generateToken(updated.id) });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

module.exports = { registerUser, loginUser, getUsers, updateProfile };
