import { getSession, register } from "../../auth.js";

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
  buttonEl.textContent = isLoading ? "Criando..." : buttonEl.dataset.originalText;
}

function init() {
  const session = getSession();
  if (session && session.token) {
    window.location.href = "/index.html";
    return;
  }

  const form = document.getElementById("register-form");
  const alertEl = document.getElementById("register-alert");
  const submitBtn = document.getElementById("register-submit");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAlert(alertEl, null);

    const name = form.elements.name?.value;
    const email = form.elements.email?.value;
    const phone = form.elements.phone?.value;
    const password = form.elements.password?.value;
    const passwordConfirm = form.elements.password_confirm?.value;

    if (String(password || "") !== String(passwordConfirm || "")) {
      setAlert(alertEl, "As senhas não conferem.");
      return;
    }

    setLoading(submitBtn, true);
    try {
      await register({ name, email, phone, password });
      window.location.href = "/index.html";
    } catch (error) {
      setAlert(alertEl, error.message || "Falha ao criar conta.");
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

document.addEventListener("includes:loaded", init);
document.addEventListener("DOMContentLoaded", () => {
  if (window.__includesLoaded) init();
});
