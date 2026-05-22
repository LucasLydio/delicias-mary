const productImagesController = require("../../backend/controllers/product-images.controller");

exports.handler = async function (event) {
  return productImagesController.handle(event);
};
 