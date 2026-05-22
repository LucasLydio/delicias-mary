import { getToken } from "../../auth.js";

function init() {
  const token = getToken();
  if (!token) {
    window.location.href = "/";
    return;
  }
}

document.addEventListener("includes:loaded", init);
document.addEventListener("DOMContentLoaded", () => {
  if (window.__includesLoaded) init();
});
