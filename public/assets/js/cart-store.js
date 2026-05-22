const STORAGE_KEY = "deliciasmary_cart_v1";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getCart() {
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY) || "");
  if (!parsed || typeof parsed !== "object") return { items: [] };
  if (!Array.isArray(parsed.items)) return { items: [] };
  return { items: parsed.items };
}

export function setCart(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  return { items };
}

export function clearCart() {
  localStorage.removeItem(STORAGE_KEY);
}

export function addToCart(item, { quantity = 1 } = {}) {
  const productId = String(item?.product_id || item?.id || "").trim();
  if (!productId) throw new Error("Produto inv\u00e1lido.");

  const qty = Math.max(1, Number.parseInt(String(quantity ?? 1), 10) || 1);
  const cart = getCart();

  const existing = cart.items.find((x) => String(x.product_id) === productId);
  if (existing) {
    existing.quantity = Math.max(1, (Number.parseInt(String(existing.quantity), 10) || 1) + qty);
    return setCart(cart);
  }

  cart.items.push({
    product_id: productId,
    name: String(item?.name || "").trim(),
    description: item?.description ? String(item.description) : "",
    price_cents: Number.parseInt(String(item?.price_cents ?? 0), 10) || 0,
    discount_cents: Number.parseInt(String(item?.discount_cents ?? 0), 10) || 0,
    image_url: item?.image_url ? String(item.image_url) : "",
    quantity: qty,
  });

  return setCart(cart);
}

export function updateCartItemQuantity(productId, quantity) {
  const id = String(productId || "").trim();
  if (!id) return getCart();

  const qty = Math.max(1, Number.parseInt(String(quantity ?? 1), 10) || 1);
  const cart = getCart();
  const existing = cart.items.find((x) => String(x.product_id) === id);
  if (!existing) return cart;

  existing.quantity = qty;
  return setCart(cart);
}

export function removeFromCart(productId) {
  const id = String(productId || "").trim();
  const cart = getCart();
  cart.items = cart.items.filter((x) => String(x.product_id) !== id);
  return setCart(cart);
}

export function getCartTotals(cart = getCart()) {
  const items = Array.isArray(cart?.items) ? cart.items : [];

  const subtotalCents = items.reduce((acc, it) => {
    const qty = Math.max(1, Number.parseInt(String(it.quantity ?? 1), 10) || 1);
    const unit = Number.parseInt(String(it.price_cents ?? 0), 10) || 0;
    return acc + unit * qty;
  }, 0);

  const discountCents = items.reduce((acc, it) => {
    const qty = Math.max(1, Number.parseInt(String(it.quantity ?? 1), 10) || 1);
    const unit = Number.parseInt(String(it.discount_cents ?? 0), 10) || 0;
    return acc + unit * qty;
  }, 0);

  const totalCents = Math.max(0, subtotalCents - discountCents);
  return { subtotalCents, discountCents, totalCents };
}

