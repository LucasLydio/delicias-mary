function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getPagination(query = {}) {
  const limit = Math.max(1, Math.min(100, toInt(query.limit, 20)));
  const offset = Math.max(0, toInt(query.offset, 0));
  return { limit, offset };
}

module.exports = {
  getPagination,
};
