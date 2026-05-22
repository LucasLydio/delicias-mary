const categoriesService = require("../services/categories.service");
const authService = require("../services/auth.service");
const { parseJsonBody, getBearerToken } = require("../utils/http");
const { getPagination } = require("../utils/pagination");
const { sendSuccess, badRequest, unauthorized, forbidden, sendError } = require("../utils/response");

async function tryGetUser(event) {
  const token = getBearerToken(event.headers || {});
  if (!token) return null;
  const session = await authService.getSessionUser({ token });
  return session.user;
}

async function requireAdmin(event) {
  const token = getBearerToken(event.headers || {});
  if (!token) {
    const error = new Error("Missing Bearer token.");
    error.statusCode = 401;
    throw error;
  }

  const session = await authService.getSessionUser({ token });
  if (session.user.role !== "admin") {
    const error = new Error("Forbidden.");
    error.statusCode = 403;
    throw error;
  }

  return session.user;
}

async function handle(event) {
  try {
    const method = event.httpMethod;
    const query = event.queryStringParameters || {};
    const id = query.id;

    if (method === "GET") {
      if (id) {
        const category = await categoriesService.findCategoryById(id);
        return sendSuccess(category, "Category fetched successfully.");
      }

      const pagination = getPagination(query);
      const user = await tryGetUser(event);
      const isActiveDefault = user && user.role === "admin" ? query.is_active : query.is_active ?? "true";

      const categories = await categoriesService.listCategories({
        ...pagination,
        name: query.name,
        is_active: isActiveDefault,
      });

      return sendSuccess(categories, "Categories fetched successfully.");
    }

    if (method === "POST") {
      await requireAdmin(event);

      const body = parseJsonBody(event.body, { isBase64Encoded: Boolean(event.isBase64Encoded) });
      if (!body) return badRequest("Invalid JSON body.");

      const category = await categoriesService.createCategory(body);
      return sendSuccess(category, "Category created successfully.", 201);
    }

    if (method === "PUT") {
      if (!id) return badRequest("Category id is required in query params.");
      await requireAdmin(event);

      const body = parseJsonBody(event.body, { isBase64Encoded: Boolean(event.isBase64Encoded) });
      if (!body) return badRequest("Invalid JSON body.");

      const category = await categoriesService.updateCategory(id, body);
      return sendSuccess(category, "Category updated successfully.");
    }

    if (method === "DELETE") {
      if (!id) return badRequest("Category id is required in query params.");
      await requireAdmin(event);

      const result = await categoriesService.removeCategory(id);
      return sendSuccess(result, "Category deleted successfully.");
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (error) {
    if (error.statusCode === 401) return unauthorized(error.message);
    if (error.statusCode === 403) return forbidden(error.message);
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handle,
};
