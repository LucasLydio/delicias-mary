async function includeHTML(root = document) {
  const includeNodes = Array.from(root.querySelectorAll("[data-include]"));

  for (const node of includeNodes) {
    const filePath = node.getAttribute("data-include");
    if (!filePath) continue;

    try {
      const response = await fetch(filePath, { cache: "no-cache" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

      node.innerHTML = await response.text();
      node.removeAttribute("data-include");

      await includeHTML(node);
    } catch (error) {
      console.error(`[include] Failed to load "${filePath}"`, error);
      node.innerHTML = "";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  includeHTML().then(() => {
    for (const node of document.querySelectorAll("[data-year]")) {
      node.textContent = String(new Date().getFullYear());
    }

    window.__includesLoaded = true;
    document.dispatchEvent(new CustomEvent("includes:loaded"));

    if (document.getElementById("auth-nav") || document.getElementById("auth-sidebar")) {
      import("/assets/js/components/auth-nav.js")
        .then((m) => m.mountAuthNav && m.mountAuthNav())
        .catch(() => {});
    }

    if (document.querySelector("[data-categories]")) {
      import("/assets/js/components/categories.js")
        .then((m) => m.mountCategories && m.mountCategories())
        .catch(() => {});
    }
  });
});
