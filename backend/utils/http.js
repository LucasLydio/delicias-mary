function parseJsonBody(body, { isBase64Encoded = false } = {}) {
  if (!body) return null;

  let jsonString = body;
  if (isBase64Encoded) {
    try {
      jsonString = Buffer.from(String(body), "base64").toString("utf8");
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

function getBearerToken(headers) {
  if (!headers) return null;
  const raw = headers.Authorization || headers.authorization || headers.AUTHORIZATION;
  if (!raw) return null;

  const value = String(raw).trim();
  const prefix = "bearer ";
  if (value.toLowerCase().startsWith(prefix)) return value.slice(prefix.length).trim();
  return null;
}

module.exports = {
  parseJsonBody,
  getBearerToken,
};
