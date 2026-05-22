import { clearSession } from "../../auth.js";
import { mountAdminShell, requireAdminSession } from "./shell.js";

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value ? String(value) : "-";
}

async function init() {
  const session = await requireAdminSession();
  if (!session) return;

  mountAdminShell({ user: session.user });

  setText("sessionName", session.user?.name);
  setText("sessionEmail", session.user?.email);
  setText("sessionRole", session.user?.role);

  document.getElementById("sessionLogout")?.addEventListener("click", () => {
    if (!confirm("Sair do admin?")) return;
    clearSession();
    window.location.href = "/index.html";
  });
}

document.addEventListener("includes:loaded", init);
document.addEventListener("DOMContentLoaded", () => {
  if (window.__includesLoaded) init();
});

