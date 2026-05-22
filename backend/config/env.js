function getEnv(key, { required = false, defaultValue } = {}) {
  const rawValue = process.env[key];
  const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

  if ((value === undefined || value === "") && required) {
    throw new Error(`Missing required env var: ${key}`);
  }

  if (value === undefined || value === "") {
    return defaultValue;
  }

  return value;
}

function requireHttpUrl(key, value) {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new Error(`Missing required env var: ${key}`);
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${key} must be a valid HTTP or HTTPS URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${key} must be a valid HTTP or HTTPS URL.`);
  }

  return raw;
}

module.exports = {
  getEnv,
  requireHttpUrl,
};
