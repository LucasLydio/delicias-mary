import { fetchActiveCategories, fetchActiveProductsByCategoryId } from "../../catalog.js";
import { escapeAttr, escapeHtml } from "../../utils/dom.js";
import { formatBRLFromCents } from "../../utils/money.js";

const PLACEHOLDER_IMAGE_URL = "/assets/images/home/plate.svg";

function sectionHeaderClass(index) {
  const n = (index % 3) + 1;
  return `box${n}`;
}

function getProductImageUrl(product) {
  const raw = String(product?.image_url || "").trim();
  if (raw) return raw;
  return PLACEHOLDER_IMAGE_URL;
}

function productCardTemplate(product) {
  const priceCents = Number.parseInt(String(product?.price_cents ?? 0), 10) || 0;
  const discountCents = Number.parseInt(String(product?.discount_cents ?? 0), 10) || 0;
  const finalCents = Math.max(0, priceCents - discountCents);
  const imageUrl = getProductImageUrl(product);
  const name = String(product?.name || "").trim();
  const description = String(product?.description || "").trim();

  return `
    <a class="menu-card text-decoration-none" href="/product.html?id=${escapeAttr(product.id)}" aria-label="${escapeAttr(product?.name || "")}">
      <div class="menu-card__image-wrap" aria-hidden="true">
        <img
          class="menu-card__image"
          src="${escapeAttr(imageUrl)}"
          alt="${escapeAttr(name || "Produto")}"
          loading="lazy"
        />
      </div>

      <div class="menu-card__content">
        <h6>${escapeHtml(name)}</h6>
        <p>${escapeHtml(description)}</p>
        <span>${escapeHtml(formatBRLFromCents(finalCents))}</span>
      </div>
    </a>
  `.trim();
}

function emptyCardTemplate() {
  return `
    <article class="menu-card" aria-label="Nenhum produto cadastrado">
      <h3>Nenhum produto cadastrado</h3>
      <p>Volte em breve.</p>
      <span>&nbsp;</span>
    </article>
  `.trim();
}

function categorySectionTemplate(category, index) {
  const headerClass = sectionHeaderClass(index);
  const desc = category?.description ? String(category.description) : "";

  return `
    <section id="category-${escapeAttr(category.id)}" class="menu-section mt-2 mb-5" data-category-id="${escapeAttr(category.id)}">
      <div class="menu-section__header ${escapeAttr(headerClass)}">
        <div class="d-flex flex-column align-items-center gap-3">
          <div class="overlay"></div>
          <h2>${escapeHtml(category?.name || "")}</h2>
          <p>${escapeHtml(desc)}</p>
        </div>
        <hr class="text-black-50 w-75" />
      </div>
      <div class="products mb-5">
        <div class="menu-section__grid" data-products-grid></div>
      </div>
    </section>
  `.trim();
}

async function init() {
  const root = document.querySelector("[data-home-sections]");
  if (!root) return;

  try {
    const categories = await fetchActiveCategories({ limit: 100, offset: 0 });

    if (!categories.length) {
      root.innerHTML = `
        <section class="menu-section">
          <div class="products">
            <div class="menu-section__grid">
              ${emptyCardTemplate()}
            </div>
          </div>
        </section>
      `.trim();
      return;
    }

    root.innerHTML = categories.map((c, idx) => categorySectionTemplate(c, idx)).join("");

    await Promise.all(
      categories.map(async (category) => {
        const section = root.querySelector(`[data-category-id="${CSS.escape(String(category.id))}"]`);
        const grid = section?.querySelector("[data-products-grid]");
        if (!grid) return;

        const products = await fetchActiveProductsByCategoryId(category.id, { limit: 100, offset: 0 });
        grid.innerHTML = products.length ? products.map((p) => productCardTemplate(p)).join("") : emptyCardTemplate();
      })
    );
  } catch (error) {
    console.error("[home] Failed to render home catalog", error);
    root.innerHTML = `
      <section class="menu-section">
        <div class="products">
          <div class="menu-section__grid">
            <article class="menu-card">
              <h3>Erro ao carregar</h3>
              <p>Tente novamente mais tarde.</p>
              <span>&nbsp;</span>
            </article>
          </div>
        </div>
      </section>
    `.trim();
  }
}

document.addEventListener("includes:loaded", init);
document.addEventListener("DOMContentLoaded", () => {
  if (window.__includesLoaded) init();
});
