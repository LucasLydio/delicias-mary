import { getSession, login } from "../../auth.js";

function getNextUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (!next) return "/index.html";

    const url = new URL(next, window.location.origin);
    if (url.origin !== window.location.origin) return "/index.html";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/index.html";
  }
}

function setAlert(alertEl, message) {
  if (!alertEl) return;
  if (!message) {
    alertEl.textContent = "";
    alertEl.classList.add("d-none");
    return;
  }
  alertEl.textContent = String(message);
  alertEl.classList.remove("d-none");
}

function setLoading(buttonEl, isLoading) {
  if (!buttonEl) return;
  buttonEl.disabled = Boolean(isLoading);
  buttonEl.dataset.originalText = buttonEl.dataset.originalText || buttonEl.textContent || "";
  buttonEl.textContent = isLoading ? "Entrando..." : buttonEl.dataset.originalText;
}

function init() {
  const session = getSession();
  if (session && session.token) {
    window.location.href = getNextUrl();
    return;
  }

  const form = document.getElementById("login-form");
  const alertEl = document.getElementById("login-alert");
  const submitBtn = document.getElementById("login-submit");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAlert(alertEl, null);
    setLoading(submitBtn, true);

    const email = form.elements.email?.value;
    const password = form.elements.password?.value;

    try {
      const result = await login({ email, password });
      const nextUrl = getNextUrl();

      if (nextUrl.startsWith("/admin/") && result?.user?.role !== "admin") {
        setAlert(alertEl, "Esta conta não tem permissão de admin.");
        return;
      }

      window.location.href = nextUrl;
    } catch (error) {
      setAlert(alertEl, error.message || "Falha ao entrar.");
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

document.addEventListener("includes:loaded", init);
document.addEventListener("DOMContentLoaded", () => {
  if (window.__includesLoaded) init();
});
