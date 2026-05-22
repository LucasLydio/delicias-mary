const jwt = require("jsonwebtoken");

const usersRepository = require("../repositories/users.repository");
const { comparePassword, hashPassword } = require("../utils/hash");
const authConfig = require("../config/auth");

function validateRequiredFields(fields) {
  const missing = Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null || String(value).trim() === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
}

function buildAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    authConfig.jwtSecret,
    {
      issuer: authConfig.jwtIssuer,
      expiresIn: authConfig.jwtExpiresIn,
    }
  );
}

function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

async function register({ name, email, phone, password }) {
  validateRequiredFields({ name, email, password });

  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await usersRepository.getUserByEmailWithPassword(normalizedEmail);
  if (existing) {
    const error = new Error("Email already in use.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(String(password));

  const user = await usersRepository.createUser({
    name: String(name).trim(),
    email: normalizedEmail,
    phone: phone ? String(phone).trim() : null,
    passwordHash,
    role: "common",
  });

  const token = buildAccessToken(user);
  return { token, user: toPublicUser(user) };
}

async function login({ email, password }) {
  validateRequiredFields({ email, password });

  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await usersRepository.getUserByEmailWithPassword(normalizedEmail);
  if (!user || !user.is_active) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const ok = await comparePassword(String(password), user.password_hash);
  if (!ok) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const token = buildAccessToken(user);
  return { token, user: toPublicUser(user) };
}

async function getSessionUser({ token }) {
  validateRequiredFields({ token });

  let payload;
  try {
    payload = jwt.verify(token, authConfig.jwtSecret, { issuer: authConfig.jwtIssuer });
  } catch {
    const error = new Error("Invalid token.");
    error.statusCode = 401;
    throw error;
  }

  const userId = payload.sub;
  const user = await usersRepository.getUserById(userId);
  if (!user || !user.is_active) {
    const error = new Error("Unauthorized.");
    error.statusCode = 401;
    throw error;
  }

  return { user: toPublicUser(user) };
}

module.exports = {
  register,
  login,
  getSessionUser,
};
