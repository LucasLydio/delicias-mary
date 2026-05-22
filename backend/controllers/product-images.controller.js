const productImagesService = require("../services/product-images.service");
const authService = require("../services/auth.service");
const { parseJsonBody, getBearerToken } = require("../utils/http");
const { sendSuccess, badRequest, unauthorized, forbidden, sendError } = require("../utils/response");

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
    const productId = query.product_id;

    if (method === "GET") {
      if (id) {
        const image = await productImagesService.getById(id);
        return sendSuccess(image, "Product image fetched successfully.");
      }

      if (!productId) return badRequest("product_id is required in query params.");
      const images = await productImagesService.listByProductId(productId);
      return sendSuccess(images, "Product images fetched successfully.");
    }

    if (method === "POST") {
      await requireAdmin(event);

      const body = parseJsonBody(event.body, { isBase64Encoded: Boolean(event.isBase64Encoded) });
      if (!body) return badRequest("Invalid JSON body.");

      const image = await productImagesService.create({
        product_id: body.product_id,
        filename: body.filename,
        base64: body.base64,
        alt_text: body.alt_text,
        is_cover: body.is_cover,
      });

      return sendSuccess(image, "Product image created successfully.", 201);
    }

    if (method === "PUT") {
      if (!id) return badRequest("Image id is required in query params.");
      await requireAdmin(event);

      const body = parseJsonBody(event.body, { isBase64Encoded: Boolean(event.isBase64Encoded) });
      if (!body) return badRequest("Invalid JSON body.");

      const image = await productImagesService.update(id, body);
      return sendSuccess(image, "Product image updated successfully.");
    }

    if (method === "DELETE") {
      if (!id) return badRequest("Image id is required in query params.");
      await requireAdmin(event);

      const result = await productImagesService.remove(id);
      return sendSuccess(result, "Product image deleted successfully.");
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
