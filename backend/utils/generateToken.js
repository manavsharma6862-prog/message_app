const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "fallback_dev_secret_change_in_production",
    { expiresIn: "30d" }
  );
};

module.exports = generateToken;
