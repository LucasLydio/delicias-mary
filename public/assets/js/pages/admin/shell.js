import { apiFetchData } from "../../api.js";
import { clearSession, getSession, getToken } from "../../auth.js";

function buildLoginRedirectUrl() {
  const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const url = new URL("/login.html", window.location.origin);
  url.searchParams.set("next", next);
  return url.toString();
}

function getActiveAdminPage() {
  const path = String(window.location.pathname || "").toLowerCase();
  if (path.endsWith("/product.html")) return "product";
  if (path.endsWith("/category.html")) return "category";
  if (path.endsWith("/user.html")) return "user";
  if (path.endsWith("/setting.html")) return "setting";
  return "index";
}

function setActiveNavLink(activeKey) {
  const links = Array.from(document.querySelectorAll("[data-admin-link]"));
  for (const link of links) {
    const key = link.getAttribute("data-admin-link");
    if (!key) continue;
    if (link.classList.contains("admin-nav__link")) {
      link.classList.toggle("admin-nav__link--active", key === activeKey);
    } else {
      link.classList.toggle("active", key === activeKey);
    }
  }
}

function setNavUser({ user } = {}) {
  const name = user && user.name ? String(user.name) : "Admin";
  const role = user && user.role ? String(user.role) : "admin";

  const nameEl = document.querySelector("[data-admin-name]");
  const roleEl = document.querySelector("[data-admin-role]");
  const avatarEl = document.querySelector("[data-admin-avatar]");

  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = role;
  if (avatarEl) avatarEl.textContent = name ? name.trim().slice(0, 1).toUpperCase() : "A";
}

export async function requireAdminSession() {
  const session = getSession();
  const token = getToken();
  if (!token) {
    window.location.href = buildLoginRedirectUrl();
    return null;
  }

  try {
    const data = await apiFetchData("/.netlify/functions/session", { method: "GET", token });
    const user = data && typeof data === "object" ? data.user : null;
    if (!user || user.role !== "admin") {
      clearSession();
      window.location.href = buildLoginRedirectUrl();
      return null;
    }

    return { token, user, session };
  } catch (error) {
    clearSession();
    window.location.href = buildLoginRedirectUrl();
    return null;
  }
}

export function mountAdminShell({ user } = {}) {
  setActiveNavLink(getActiveAdminPage());
  setNavUser({ user });

  const logoutBtn = document.getElementById("adminLogout");
  logoutBtn?.addEventListener("click", () => {
    if (!confirm("Sair do admin?")) return;
    clearSession();
    window.location.href = "/index.html";
  });
}
