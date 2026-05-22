const usersController = require("../../backend/controllers/users.controller");

exports.handler = async function (event) {
  return usersController.handle(event);
};
