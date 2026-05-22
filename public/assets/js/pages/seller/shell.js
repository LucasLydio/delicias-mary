import { apiFetchData } from "../../api.js";
import { clearSession, getSession, getToken } from "../../auth.js";

function buildLoginRedirectUrl() {
  const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const url = new URL("/login.html", window.location.origin);
  url.searchParams.set("next", next);
  return url.toString();
}

function getActiveSellerPage() {
  const path = String(window.location.pathname || "").toLowerCase();
  if (path.endsWith("/product.html")) return "product";
  if (path.endsWith("/category.html")) return "category";
  return "index";
}

function setActiveNavLink(activeKey) {
  const links = Array.from(document.querySelectorAll("[data-seller-link]"));
  for (const link of links) {
    const key = link.getAttribute("data-seller-link");
    if (!key) continue;
    if (link.classList.contains("admin-nav__link")) {
      link.classList.toggle("admin-nav__link--active", key === activeKey);
    } else {
      link.classList.toggle("active", key === activeKey);
    }
  }
}

function setNavUser({ user } = {}) {
  const name = user && user.name ? String(user.name) : "Vendedor";
  const role = user && user.role ? String(user.role) : "seller";

  const nameEl = document.querySelector("[data-seller-name]");
  const roleEl = document.querySelector("[data-seller-role]");
  const avatarEl = document.querySelector("[data-seller-avatar]");

  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = role;
  if (avatarEl) avatarEl.textContent = name ? name.trim().slice(0, 1).toUpperCase() : "V";
}

export async function requireSellerSession() {
  const session = getSession();
  const token = getToken();
  if (!token) {
    window.location.href = buildLoginRedirectUrl();
    return null;
  }

  try {
    const data = await apiFetchData("/.netlify/functions/session", { method: "GET", token });
    const user = data && typeof data === "object" ? data.user : null;

    if (!user || (user.role !== "admin" && user.role !== "seller")) {
      clearSession();
      window.location.href = buildLoginRedirectUrl();
      return null;
    }

    return { token, user, session };
  } catch {
    clearSession();
    window.location.href = buildLoginRedirectUrl();
    return null;
  }
}

export function mountSellerShell({ user } = {}) {
  setActiveNavLink(getActiveSellerPage());
  setNavUser({ user });

  const logoutBtn = document.getElementById("sellerLogout");
  logoutBtn?.addEventListener("click", () => {
    if (!confirm("Sair?")) return;
    clearSession();
    window.location.href = "/index.html";
  });
}

