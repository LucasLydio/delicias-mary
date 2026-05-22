const authController = require("../../backend/controllers/auth.controller");

exports.handler = async function (event) {
  return authController.handle(event);
};
 