const usersRepository = require("../repositories/users.repository");
const { hashPassword } = require("../utils/hash");

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

function handleUniqueError(error, message) {
  if (error && String(error.code) === "23505") {
    const e = new Error(message);
    e.statusCode = 409;
    throw e;
  }
  throw error;
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

async function listUsers({ limit, offset, name, email, role, is_active }) {
  const result = await usersRepository.listUsers({ limit, offset, name, email, role, is_active });
  return { ...result, items: result.items.map(toPublicUser) };
}

async function listUserById(id) {
  validateRequiredFields({ id });
  const user = await usersRepository.getUserById(id);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  return toPublicUser(user);
}

async function create({ name, email, phone, password, role = "common", is_active = true }) {
  validateRequiredFields({ name, email, password });

  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await usersRepository.getUserByEmailWithPassword(normalizedEmail);
  if (existing) {
    const error = new Error("Email already in use.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(String(password));

  let created;
  try {
    created = await usersRepository.createUser({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : null,
      passwordHash,
      role,
    });
  } catch (error) {
    handleUniqueError(error, "Email already in use.");
  }

  if (is_active === false) {
    const updated = await usersRepository.updateUser(created.id, { is_active: false });
    return toPublicUser(updated);
  }

  return toPublicUser(created);
}

async function update(id, patch) {
  validateRequiredFields({ id });
  if (!patch || typeof patch !== "object") {
    const error = new Error("Invalid body.");
    error.statusCode = 400;
    throw error;
  }

  const updatePatch = {};

  if (patch.name !== undefined) {
    const value = String(patch.name ?? "").trim();
    if (!value) {
      const error = new Error("Name is required.");
      error.statusCode = 400;
      throw error;
    }
    updatePatch.name = value;
  }
  if (patch.phone !== undefined) updatePatch.phone = patch.phone ? String(patch.phone).trim() : null;
  if (patch.email !== undefined) {
    const value = String(patch.email ?? "").trim().toLowerCase();
    if (!value) {
      const error = new Error("Email is required.");
      error.statusCode = 400;
      throw error;
    }
    updatePatch.email = value;
  }
  if (patch.role !== undefined) updatePatch.role = patch.role;
  if (patch.is_active !== undefined) updatePatch.is_active = Boolean(patch.is_active);

  if (patch.password !== undefined) {
    validateRequiredFields({ password: patch.password });
    updatePatch.password_hash = await hashPassword(String(patch.password));
  }

  if (Object.keys(updatePatch).length === 0) {
    const error = new Error("No fields to update.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const updated = await usersRepository.updateUser(id, updatePatch);
    if (!updated) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }
    return toPublicUser(updated);
  } catch (error) {
    handleUniqueError(error, "Email already in use.");
  }
}

async function remove(id) {
  validateRequiredFields({ id });
  const deleted = await usersRepository.deleteUser(id);
  if (!deleted) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  return { id: deleted.id };
}

module.exports = {
  listUsers,
  listUserById,
  create,
  update,
  remove,
};
