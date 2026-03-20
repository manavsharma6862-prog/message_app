const { db } = require("../config/db");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const User = {
  findById(id) {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) || null;
  },

  findOne({ email, id } = {}) {
    if (email) return db.prepare("SELECT * FROM users WHERE email = ?").get(email) || null;
    if (id) return this.findById(id);
    return null;
  },

  find(keyword = "", excludeId = null) {
    let query = "SELECT id, name, email, image, status, is_admin, created_at, updated_at FROM users WHERE 1=1";
    const params = [];
    if (keyword) {
      query += " AND (name LIKE ? OR email LIKE ?)";
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }
    return db.prepare(query).all(...params);
  },

  async create({ name, email, password, image = "", status = "Hey there! I am using ChatApp.", isAdmin = false }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = uuidv4();
    db.prepare(
      "INSERT INTO users (id, name, email, password, image, status, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, name, email, hashedPassword, image, status, isAdmin ? 1 : 0);
    return this.findById(id);
  },

  async update(id, { name, status, image, password } = {}) {
    const user = this.findById(id);
    if (!user) return null;

    const newName = name ?? user.name;
    const newStatus = status ?? user.status;
    const newImage = image ?? user.image;
    let newPassword = user.password;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      newPassword = await bcrypt.hash(password, salt);
    }

    db.prepare(
      "UPDATE users SET name=?, status=?, image=?, password=?, updated_at=datetime('now') WHERE id=?"
    ).run(newName, newStatus, newImage, newPassword, id);

    return this.findById(id);
  },

  async matchPassword(userId, enteredPassword) {
    const user = this.findById(userId);
    if (!user) return false;
    return bcrypt.compare(enteredPassword, user.password);
  },

  withoutPassword(user) {
    if (!user) return null;
    const { password, ...rest } = user;
    return { ...rest, _id: rest.id, isAdmin: rest.is_admin === 1 };
  },

  format(user) {
    if (!user) return null;
    return {
      _id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      status: user.status,
      isAdmin: user.is_admin === 1,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  },
};

module.exports = User;
