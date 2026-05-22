const bcrypt = require("bcryptjs");

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(String(password), salt);
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(String(password), String(passwordHash));
}

module.exports = {
  hashPassword,
  comparePassword,
};
