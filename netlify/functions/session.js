const sessionsController = require("../../backend/controllers/sessions.controller");

exports.handler = async function (event) {
  return sessionsController.handle(event);
};
