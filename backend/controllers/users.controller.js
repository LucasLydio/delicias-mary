const usersService = require("../services/users.service");
const authService = require("../services/auth.service");
const { parseJsonBody, getBearerToken } = require("../utils/http");
const { getPagination } = require("../utils/pagination");
const { sendSuccess, badRequest, unauthorized, forbidden, sendError } = require("../utils/response");

async function requireAuth(event) {
  const token = getBearerToken(event.headers || {});
  if (!token) {
    const error = new Error("Missing Bearer token.");
    error.statusCode = 401;
    throw error;
  }
  const session = await authService.getSessionUser({ token });
  return session.user;
}

function pickAllowed(body, allowedKeys) {
  const out = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) out[key] = body[key];
  }
  return out;
}

async function handle(event) {
  try {
    const method = event.httpMethod;
    const query = event.queryStringParameters || {};
    const id = query.id;

    const currentUser = await requireAuth(event);

    if (method === "GET") {
      if (id) {
        if (currentUser.role !== "admin" && currentUser.id !== id) {
          return forbidden("Forbidden.");
        }
        const user = await usersService.listUserById(id);
        return sendSuccess(user, "User fetched successfully.");
      }

      if (currentUser.role !== "admin") {
        return forbidden("Forbidden.");
      }

      const pagination = getPagination(query);
      const users = await usersService.listUsers({
        ...pagination,
        name: query.name,
        email: query.email,
        role: query.role,
        is_active: query.is_active,
      });
      return sendSuccess(users, "Users fetched successfully.");
    }

    if (method === "POST") {
      if (currentUser.role !== "admin") {
        return forbidden("Forbidden.");
      }

      const body = parseJsonBody(event.body, { isBase64Encoded: Boolean(event.isBase64Encoded) });
      if (!body) return badRequest("Invalid JSON body.");

      const user = await usersService.create({
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: body.password,
        role: body.role || "common",
        is_active: body.is_active !== undefined ? body.is_active : true,
      });

      return sendSuccess(user, "User created successfully.", 201);
    }

    if (method === "PUT") {
      if (!id) return badRequest("User id is required in query params.");

      const body = parseJsonBody(event.body, { isBase64Encoded: Boolean(event.isBase64Encoded) });
      if (!body) return badRequest("Invalid JSON body.");

      const isSelf = currentUser.id === id;
      const isAdmin = currentUser.role === "admin";

      if (!isSelf && !isAdmin) {
        return forbidden("Forbidden.");
      }

      const allowed = isAdmin ? ["name", "email", "phone", "password", "role", "is_active"] : ["name", "phone", "password"];
      const patch = pickAllowed(body, allowed);

      const user = await usersService.update(id, patch);
      return sendSuccess(user, "User updated successfully.");
    }

    if (method === "DELETE") {
      if (!id) return badRequest("User id is required in query params.");

      if (currentUser.role !== "admin") {
        return forbidden("Forbidden.");
      }

      const result = await usersService.remove(id);
      return sendSuccess(result, "User deleted successfully.");
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (error) {
    if (error.statusCode === 401) return unauthorized(error.message);
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handle,
};
