
const { getEnv } = require("./env");

const jwtSecret = getEnv("JWT_SECRET", { required: true });
const jwtIssuer = getEnv("JWT_ISSUER", { defaultValue: "delicias-mary" });
const jwtExpiresIn = getEnv("JWT_EXPIRES_IN", { defaultValue: "7d" });

module.exports = {
  jwtSecret,
  jwtIssuer,
  jwtExpiresIn,
};
