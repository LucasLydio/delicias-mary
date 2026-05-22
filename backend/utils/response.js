function buildResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
}

function sendSuccess(data = null, message = "Success", statusCode = 200) {
  return buildResponse(statusCode, {
    success: true,
    message,
    data,
  });
}

function badRequest(message = "Bad request", errors = null) {
  return buildResponse(400, {
    success: false,
    message,
    errors,
  });
}

function unauthorized(message = "Unauthorized") {
  return buildResponse(401, {
    success: false,
    message,
  });
}

function forbidden(message = "Forbidden") {
  return buildResponse(403, {
    success: false,
    message,
  });
}

function notFound(message = "Not found") {
  return buildResponse(404, {
    success: false,
    message,
  });
}

function notImplemented(message = "Not implemented") {
  return buildResponse(501, {
    success: false,
    message,
  });
}

function getPublicErrorMessage(error) {
  const raw = error && error.message ? String(error.message) : "";

  if (raw.includes("TypeError: fetch failed") || raw === "fetch failed") {
    return "Failed to reach Supabase. Check SUPABASE_URL and your network/DNS connectivity.";
  }

  return raw || "Internal server error";
}

function sendError(error, statusCode = 500) {
  if (statusCode >= 500) {
    try {
      console.error("[api:error]", {
        name: error && error.name ? String(error.name) : undefined,
        message: error && error.message ? String(error.message) : undefined,
        code: error && error.code ? String(error.code) : undefined,
        details: error && error.details ? String(error.details) : undefined,
        cause: error && error.cause && error.cause.message ? String(error.cause.message) : undefined,
      });
    } catch {
      // ignore logging failures
    }
  }

  return buildResponse(statusCode, {
    success: false,
    message: getPublicErrorMessage(error),
  });
}

module.exports = {
  sendSuccess,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  notImplemented,
  sendError,
};
