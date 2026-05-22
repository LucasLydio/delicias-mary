const productsController = require("../../backend/controllers/products.controller");

// Thin Netlify Function wrapper (keep logic in backend/)
exports.handler = async function (event) {
  return productsController.handle(event);
};
