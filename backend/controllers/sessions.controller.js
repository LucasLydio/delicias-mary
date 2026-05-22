const authService = require("../services/auth.service");
const { getBearerToken } = require("../utils/http");
const { sendSuccess, badRequest, unauthorized, sendError } = require("../utils/response");

async function handle(event) {
  try {
    const method = event.httpMethod;

    if (method === "GET") {
      const token = getBearerToken(event.headers || {});
      if (!token) return unauthorized("Missing Bearer token.");

      const session = await authService.getSessionUser({ token });
      return sendSuccess(session, "Session fetched successfully.");
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
