const authService = require("../services/auth.service");
const { parseJsonBody } = require("../utils/http");
const { sendSuccess, badRequest, sendError } = require("../utils/response");

async function handle(event) {
  try {
    if (event.httpMethod !== "POST") {
      return badRequest(`Unsupported method: ${event.httpMethod}`);
    }

    const body = parseJsonBody(event.body, { isBase64Encoded: Boolean(event.isBase64Encoded) });
    if (!body) return badRequest("Invalid JSON body.");

    const action = String(body.action || body.mode || "").toLowerCase();

    if (action === "login") {
      const result = await authService.login({
        email: body.email,
        password: body.password,
      });
      return sendSuccess(result, "Login successful.");
    }

    if (action === "register") {
      const result = await authService.register({
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: body.password,
      });
      return sendSuccess(result, "Registration successful.", 201);
    }

    return badRequest('Missing or invalid action. Use action: "login" or "register".');
  } catch (error) {
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handle,
};
