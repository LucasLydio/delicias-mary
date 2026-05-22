import { clearSession, getSession } from "/assets/js/auth.js";

function buildLoggedOutLinks() {
  return `
    <a class="nav-link rounded-0 sidebar-link border-bottom" href="/login.html">
      <i class="bi bi-box-arrow-in-right me-2"></i>Entrar
    </a>
    <a class="nav-link rounded-0 sidebar-link border-bottom" href="/register.html">
      <i class="bi bi-person-plus me-2"></i>Criar conta
    </a>
  `;
}

function buildLoggedInLinks(session) {
  const userName = session?.user?.name ? String(session.user.name) : "Minha conta";
  return `
    <div class="px-3 py-2 text-white-50 small">Olá, <span class="text-white">${escapeHtml(userName)}</span></div>
    <a class="nav-link rounded-0 sidebar-link border-bottom" href="/user/index.html">
      <i class="bi bi-person me-2"></i>Minha conta
    </a>
    <button type="button" class="nav-link rounded-0 sidebar-link border-0 text-start w-100" data-logout>
      <i class="bi bi-box-arrow-right me-2"></i>Sair
    </button>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function mountInto(container) {
  if (!container) return;

  const session = getSession();
  container.innerHTML = session ? buildLoggedInLinks(session) : buildLoggedOutLinks();

  const logoutBtn = container.querySelector("[data-logout]");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = "/index.html";
    });
  }
}

export function mountAuthNav() {
  mountInto(document.getElementById("auth-nav"));
  mountInto(document.getElementById("auth-sidebar"));
}
