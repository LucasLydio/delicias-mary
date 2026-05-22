import { clearCart, getCart, getCartTotals, removeFromCart, updateCartItemQuantity } from "../../cart-store.js";
import { setAlert, escapeHtml } from "../../utils/dom.js";
import { formatBRLFromCents } from "../../utils/money.js";
import { openWhatsAppMobile } from "../../utils/whatsapp.js";

function lineTotalCents(item) {
  const qty = Math.max(1, Number.parseInt(String(item?.quantity ?? 1), 10) || 1);
  const price = Number.parseInt(String(item?.price_cents ?? 0), 10) || 0;
  const discount = Number.parseInt(String(item?.discount_cents ?? 0), 10) || 0;
  return Math.max(0, (price - discount) * qty);
}

function itemTemplate(item) {
  const qty = Math.max(1, Number.parseInt(String(item?.quantity ?? 1), 10) || 1);
  const total = lineTotalCents(item);

  return `
    <div class="d-flex gap-3 align-items-start border-bottom pb-3" data-cart-item="${escapeHtml(item.product_id)}">
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between gap-2">
          <strong>${escapeHtml(item?.name || "")}</strong>
          <span class="text-muted">${escapeHtml(formatBRLFromCents(total))}</span>
        </div>
        ${item?.description ? `<div class="text-muted small mt-1">${escapeHtml(item.description)}</div>` : ""}
        <div class="d-flex align-items-center gap-2 mt-2">
          <label class="small text-muted" for="qty-${escapeHtml(item.product_id)}">Qtd</label>
          <input id="qty-${escapeHtml(item.product_id)}" class="form-control form-control-sm" style="width: 92px" type="number" min="1" step="1" value="${escapeHtml(qty)}" data-action="qty" data-id="${escapeHtml(item.product_id)}" />
          <button class="btn btn-outline-danger btn-sm" type="button" data-action="remove" data-id="${escapeHtml(item.product_id)}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `.trim();
}

function buildWhatsAppText(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  const totals = getCartTotals(cart);

  const lines = [
    "Olá! Gostaria de fazer um pedido:",
    "",
    ...items.map((it) => {
      const qty = Math.max(1, Number.parseInt(String(it.quantity ?? 1), 10) || 1);
      const unitCents = Math.max(0, (Number.parseInt(String(it.price_cents ?? 0), 10) || 0) - (Number.parseInt(String(it.discount_cents ?? 0), 10) || 0));
      return `- ${qty}x ${it?.name || ""} (${formatBRLFromCents(unitCents)}): ${formatBRLFromCents(lineTotalCents(it))}`;
    }),
    "",
    `Total: ${formatBRLFromCents(totals.totalCents)}`,
  ];

  return lines.join("\n");
}

function render() {
  const cart = getCart();
  const alertRoot = document.getElementById("cart-alert");
  const itemsRoot = document.getElementById("cart-items");
  const emptyEl = document.getElementById("cart-empty");

  const subtotalEl = document.getElementById("cart-subtotal");
  const discountEl = document.getElementById("cart-discount");
  const totalEl = document.getElementById("cart-total");

  if (!itemsRoot) return;

  if (!cart.items.length) {
    itemsRoot.innerHTML = "";
    if (emptyEl) emptyEl.hidden = false;
  } else {
    if (emptyEl) emptyEl.hidden = true;
    itemsRoot.innerHTML = cart.items.map((it) => itemTemplate(it)).join("");
  }

  const totals = getCartTotals(cart);
  if (subtotalEl) subtotalEl.textContent = formatBRLFromCents(totals.subtotalCents);
  if (discountEl) discountEl.textContent = formatBRLFromCents(totals.discountCents);
  if (totalEl) totalEl.textContent = formatBRLFromCents(totals.totalCents);

  itemsRoot.querySelectorAll("[data-action]").forEach((el) => {
    const action = el.getAttribute("data-action");
    const id = el.getAttribute("data-id");

    if (action === "remove") {
      el.addEventListener("click", () => {
        removeFromCart(id);
        setAlert(alertRoot, { type: "success", message: "Item removido." });
        render();
      });
      return;
    }

    if (action === "qty" && el instanceof HTMLInputElement) {
      el.addEventListener("change", () => {
        updateCartItemQuantity(id, el.value);
        render();
      });
    }
  });
}

function init() {
  const page = document.querySelector("[data-cart-page]");
  if (!page) return;

  const alertRoot = document.getElementById("cart-alert");
  const clearBtn = document.getElementById("cart-clear");
  const checkoutBtn = document.getElementById("cart-checkout");

  clearBtn?.addEventListener("click", () => {
    clearCart();
    setAlert(alertRoot, { type: "success", message: "Carrinho limpo." });
    render();
  });

  checkoutBtn?.addEventListener("click", () => {
    const cart = getCart();
    if (!cart.items.length) {
      setAlert(alertRoot, { type: "warning", message: "Seu carrinho está vazio." });
      return;
    }

    const number = checkoutBtn.getAttribute("data-whatsapp-number") || "";
    openWhatsAppMobile({ waNumber: number, waText: buildWhatsAppText(cart) });
  });

  render();
}

document.addEventListener("includes:loaded", init);
document.addEventListener("DOMContentLoaded", () => {
  if (window.__includesLoaded) init();
});

