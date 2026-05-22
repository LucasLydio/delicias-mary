export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function setAlert(container, { type = "danger", message = null } = {}) {
  if (!container) return;

  if (!message) {
    container.innerHTML = "";
    return;
  }

  const safeType = String(type || "danger");
  container.innerHTML = `
    <div class="alert alert-${safeType} py-2 mb-0" role="alert">
      ${escapeHtml(message)}
    </div>
  `.trim();
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
