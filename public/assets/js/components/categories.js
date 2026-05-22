import { fetchActiveCategories } from "../catalog.js";
import { escapeAttr, escapeHtml } from "../utils/dom.js";

export async function mountCategories() {
  const root = document.querySelector("[data-categories]");
  if (!root) return;

  const grid = root.querySelector("[data-categories-grid]");
  const empty = root.querySelector("[data-categories-empty]");
  if (!grid) return;

  try {
    const categories = await fetchActiveCategories({ limit: 100, offset: 0 });

    if (!categories.length) {
      grid.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;

    grid.innerHTML = categories
      .map((c, idx) => {
        const icon = idx % 3 === 2 ? "cup-straw" : "fork-knife";
        return `<a href="#category-${escapeAttr(c.id)}" class="menu-categories__item">${escapeHtml(c.name || "")} <i class="bi bi-${icon} ms-2"></i></a>`;
      })
      .join("");
  } catch (error) {
    console.error("[categories] Failed to load categories", error);
    grid.innerHTML = "";
    if (empty) {
      empty.textContent = "Não foi possível carregar as categorias.";
      empty.hidden = false;
    }
  }
}

