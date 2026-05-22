const categoriesController = require("../../backend/controllers/categories.controller");

exports.handler = async function (event) {
  return categoriesController.handle(event);
};
