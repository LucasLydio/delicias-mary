import { mountAdminShell, requireAdminSession } from "./shell.js";
import { mountProductsPage } from "./products-table.js";

async function init() {
  const session = await requireAdminSession();
  if (!session) return;

  mountAdminShell({ user: session.user });
  mountProductsPage();
}

document.addEventListener("includes:loaded", init);
document.addEventListener("DOMContentLoaded", () => {
  if (window.__includesLoaded) init();
});

