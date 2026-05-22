import { mountSellerShell, requireSellerSession } from "./shell.js";

async function init() {
  const session = await requireSellerSession();
  if (!session) return;
  mountSellerShell({ user: session.user });
}

document.addEventListener("includes:loaded", init);
document.addEventListener("DOMContentLoaded", () => {
  if (window.__includesLoaded) init();
});

