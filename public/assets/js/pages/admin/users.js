import { mountAdminShell, requireAdminSession } from "./shell.js";
import { mountUsersTable } from "./users-table.js";

async function init() {
  const session = await requireAdminSession();
  if (!session) return;

  mountAdminShell({ user: session.user });
  mountUsersTable();
}

document.addEventListener("includes:loaded", init);
document.addEventListener("DOMContentLoaded", () => {
  if (window.__includesLoaded) init();
});

