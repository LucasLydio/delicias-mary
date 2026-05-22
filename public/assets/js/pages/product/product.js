import { fetchProductById, fetchProductImagesByProductId } from "../../catalog.js";
import { addToCart } from "../../cart-store.js";
import { setAlert } from "../../utils/dom.js";
import { formatBRLFromCents } from "../../utils/money.js";

function getIdFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function pickCoverUrl(images) {
  const items = Array.isArray(images) ? images : [];
  const cover = items.find((x) => x && x.is_cover) || items[0] || null;
  if (!cover) return "";
  return String(cover.url || cover.path || "").trim();
}

async function init() {
  const page = document.querySelector("[data-product-page]");
  if (!page) return;

  const id = getIdFromUrl();
  const alertRoot = document.getElementById("product-alert");
  const addBtn = document.getElementById("product-add");
  const qtyInput = document.getElementById("product-qty");

  if (!id) {
    setAlert(alertRoot, { type: "danger", message: "Produto não encontrado." });
    if (addBtn) addBtn.disabled = true;
    return;
  }

  try {
    const [product, images] = await Promise.all([fetchProductById(id), fetchProductImagesByProductId(id)]);

    const titleEl = document.getElementById("product-title");
    const descEl = document.getElementById("product-description");
    const imgEl = document.getElementById("product-image");
    const priceEl = document.getElementById("product-price");
    const originalPriceEl = document.getElementById("product-original-price");

    const coverUrl = pickCoverUrl(images);
    if (imgEl) {
      if (coverUrl) imgEl.src = coverUrl;
      imgEl.alt = product?.name ? String(product.name) : "";
    }

    if (titleEl) titleEl.textContent = product?.name ? String(product.name) : "Produto";
    if (descEl) descEl.textContent = product?.description ? String(product.description) : "";

    const priceCents = Number.parseInt(String(product?.price_cents ?? 0), 10) || 0;
    const discountCents = Number.parseInt(String(product?.discount_cents ?? 0), 10) || 0;
    const finalCents = Math.max(0, priceCents - discountCents);

    if (priceEl) priceEl.textContent = formatBRLFromCents(finalCents);

    if (originalPriceEl) {
      if (discountCents > 0) {
        originalPriceEl.hidden = false;
        originalPriceEl.textContent = formatBRLFromCents(priceCents);
      } else {
        originalPriceEl.hidden = true;
      }
    }

    addBtn?.addEventListener("click", () => {
      const qty = Math.max(1, Number.parseInt(String(qtyInput?.value ?? 1), 10) || 1);

      try {
        addToCart(
          {
            product_id: product.id,
            name: product?.name,
            description: product?.description,
            price_cents: priceCents,
            discount_cents: discountCents,
            image_url: coverUrl,
          },
          { quantity: qty }
        );

        setAlert(alertRoot, { type: "success", message: "Adicionado ao carrinho!" });
      } catch (error) {
        setAlert(alertRoot, { type: "danger", message: error?.message || "Não foi possível adicionar ao carrinho." });
      }
    });
  } catch (error) {
    setAlert(alertRoot, { type: "danger", message: error?.message || "Falha ao carregar o produto." });
    if (addBtn) addBtn.disabled = true;
  }
}

document.addEventListener("includes:loaded", init);
document.addEventListener("DOMContentLoaded", () => {
  if (window.__includesLoaded) init();
});

